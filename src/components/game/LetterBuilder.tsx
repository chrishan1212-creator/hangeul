"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { splitSyllable } from "@/lib/korean";

interface LetterBuilderProps {
  /** 만들어야 할 글자 (예: "가") */
  syllable: string;
  /** 글자를 떠올리게 해줄 그림 (예: 가방 🎒) */
  emoji: string;
  /** 함께 보여줄 가짜 자음·모음 (헷갈리게 섞어두는 용도) */
  consonantChoices: string[];
  vowelChoices: string[];
  /** 두 조각을 모두 맞게 끼웠을 때 */
  onComplete: () => void;
  /** 엉뚱한 조각을 끼웠을 때 */
  onMistake: () => void;
  disabled: boolean;
}

type SlotKind = "consonant" | "vowel";

interface DragState {
  letter: string;
  kind: SlotKind;
  x: number;
  y: number;
}

/**
 * 자음과 모음을 손가락으로 끌어와 한 글자를 만드는 놀이.
 *
 * 브라우저 기본 드래그(HTML5 drag&drop)는 손가락으로는 잘 동작하지 않아서,
 * 포인터 이벤트로 직접 끌기를 구현했다. (마우스·손가락 모두 같은 코드로 처리)
 */
export default function LetterBuilder({
  syllable,
  emoji,
  consonantChoices,
  vowelChoices,
  onComplete,
  onMistake,
  disabled,
}: LetterBuilderProps) {
  const parts = useMemo(() => splitSyllable(syllable), [syllable]);

  const [placed, setPlaced] = useState<{ consonant?: string; vowel?: string }>({});
  const [drag, setDrag] = useState<DragState | null>(null);
  const [shakeSlot, setShakeSlot] = useState<SlotKind | null>(null);

  const consonantSlotRef = useRef<HTMLDivElement | null>(null);
  const vowelSlotRef = useRef<HTMLDivElement | null>(null);
  const completedRef = useRef(false);

  // 문제가 바뀌면 끼운 조각을 비운다
  useEffect(() => {
    setPlaced({});
    setDrag(null);
    setShakeSlot(null);
    completedRef.current = false;
  }, [syllable]);

  // 둘 다 맞게 끼워지면 알린다
  useEffect(() => {
    if (completedRef.current || !parts) return;
    if (placed.consonant === parts.consonant && placed.vowel === parts.vowel) {
      completedRef.current = true;
      onComplete();
    }
  }, [placed, parts, onComplete]);

  if (!parts) return null;

  const isInside = (el: HTMLElement | null, x: number, y: number) => {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    // 손가락이 조금 빗나가도 들어가도록 넉넉하게 잡아준다
    const pad = 24;
    return x >= r.left - pad && x <= r.right + pad && y >= r.top - pad && y <= r.bottom + pad;
  };

  const handlePointerDown = (e: React.PointerEvent, letter: string, kind: SlotKind) => {
    if (disabled) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDrag({ letter, kind, x: e.clientX, y: e.clientY });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!drag) return;
    setDrag({ ...drag, x: e.clientX, y: e.clientY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!drag) return;

    const slot = drag.kind === "consonant" ? consonantSlotRef.current : vowelSlotRef.current;
    const dropped = isInside(slot, e.clientX, e.clientY);

    if (dropped) {
      const correct =
        drag.kind === "consonant" ? drag.letter === parts.consonant : drag.letter === parts.vowel;

      if (correct) {
        setPlaced((prev) => ({ ...prev, [drag.kind]: drag.letter }));
      } else {
        setShakeSlot(drag.kind);
        setTimeout(() => setShakeSlot(null), 500);
        onMistake();
      }
    }

    setDrag(null);
  };

  const slotClass = (kind: SlotKind, filled: boolean) => `
    flex h-24 w-24 items-center justify-center rounded-3xl border-4 border-dashed
    font-jua text-6xl transition-colors sm:h-28 sm:w-28 sm:text-7xl
    ${filled ? "border-transparent bg-white text-slate-700" : "border-white/70 bg-white/20 text-white/40"}
    ${shakeSlot === kind ? "animate-shake border-red-300" : ""}
  `;

  const tileClass = (used: boolean) => `
    flex h-16 w-16 touch-none select-none items-center justify-center rounded-2xl
    font-jua text-4xl shadow-[0_5px_0_rgba(0,0,0,0.15)] transition
    sm:h-20 sm:w-20 sm:text-5xl
    ${used ? "pointer-events-none opacity-25" : "bg-white/95 text-slate-700 active:translate-y-1"}
  `;

  return (
    <div className="flex w-full flex-col items-center gap-4">
      {/* 무엇을 만들지 알려주는 그림 */}
      <div className="rounded-3xl bg-white/90 px-6 py-3 shadow-lg">
        <span className="block text-5xl leading-none sm:text-6xl">{emoji}</span>
      </div>

      {/* 조각을 끼우는 자리: [자음] + [모음] = [글자] */}
      <div className="flex items-center justify-center gap-2">
        <div ref={consonantSlotRef} className={slotClass("consonant", !!placed.consonant)}>
          {placed.consonant ?? "?"}
        </div>
        <span className="font-jua text-4xl text-white drop-shadow">+</span>
        <div ref={vowelSlotRef} className={slotClass("vowel", !!placed.vowel)}>
          {placed.vowel ?? "?"}
        </div>
        <span className="font-jua text-4xl text-white drop-shadow">=</span>
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-candy-yellow/90 font-jua text-6xl text-slate-700 shadow-lg sm:h-28 sm:w-28 sm:text-7xl">
          {placed.consonant && placed.vowel ? syllable : "?"}
        </div>
      </div>

      {/* 끌어다 쓸 조각들 */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex flex-wrap justify-center gap-2">
          {consonantChoices.map((letter) => (
            <div
              key={`c-${letter}`}
              role="button"
              tabIndex={0}
              aria-label={`자음 ${letter}`}
              className={tileClass(placed.consonant === letter)}
              onPointerDown={(e) => handlePointerDown(e, letter, "consonant")}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={() => setDrag(null)}
            >
              {letter}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {vowelChoices.map((letter) => (
            <div
              key={`v-${letter}`}
              role="button"
              tabIndex={0}
              aria-label={`모음 ${letter}`}
              className={tileClass(placed.vowel === letter)}
              onPointerDown={(e) => handlePointerDown(e, letter, "vowel")}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={() => setDrag(null)}
            >
              {letter}
            </div>
          ))}
        </div>
      </div>

      {/* 끌고 다니는 동안 손가락을 따라다니는 조각 */}
      {drag && (
        <div
          className="pointer-events-none fixed z-50 flex h-20 w-20 items-center justify-center rounded-2xl bg-white font-jua text-5xl text-slate-700 shadow-2xl"
          style={{ left: drag.x - 40, top: drag.y - 40 }}
        >
          {drag.letter}
        </div>
      )}
    </div>
  );
}
