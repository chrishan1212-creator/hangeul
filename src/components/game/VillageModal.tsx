"use client";

import { createPortal } from "react-dom";
import { ALL_ANIMALS } from "@/lib/animals";
import { useVillage } from "@/lib/village";

interface VillageModalProps {
  onClose: () => void;
}

/**
 * 다 자란 친구들을 모아 보여주는 마을.
 * 아직 만나지 못한 친구는 실루엣(❔)으로만 보여줘서 궁금증을 남긴다.
 */
export default function VillageModal({ onClose }: VillageModalProps) {
  const village = useVillage();
  const total = ALL_ANIMALS.length;
  const moved = village.size;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="동물 마을"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85dvh] w-full max-w-sm flex-col rounded-3xl bg-gradient-to-br from-candy-green to-candy-blue p-5 shadow-2xl"
      >
        <div className="mb-1 flex items-center justify-between">
          <h2 className="font-jua text-2xl text-white drop-shadow">🏡 동물 마을</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="마을 닫기"
            className="rounded-full bg-white/30 px-3 py-1.5 font-jua text-lg text-white"
          >
            ✕
          </button>
        </div>

        <p className="mb-3 font-jua text-sm text-white/90 drop-shadow">
          친구가 다 자랄 때마다 마을에 입주해요 · {moved} / {total}
        </p>

        <div className="grid grid-cols-4 gap-2.5 overflow-y-auto rounded-2xl bg-white/15 p-3">
          {ALL_ANIMALS.map((animal) => {
            const arrived = village.has(animal.name);
            return (
              <div
                key={animal.name}
                className={`flex flex-col items-center gap-1 rounded-2xl px-1 py-2.5 text-center ${
                  arrived ? "bg-white/90" : "bg-white/25"
                }`}
              >
                <span
                  className={`text-3xl leading-none ${arrived ? "" : "opacity-30 grayscale"}`}
                >
                  {arrived ? animal.emoji : "❔"}
                </span>
                <span
                  className={`font-jua text-[0.65rem] leading-tight ${
                    arrived ? "text-slate-700" : "text-white/70"
                  }`}
                >
                  {arrived ? animal.name : "???"}
                </span>
              </div>
            );
          })}
        </div>

        {moved === 0 && (
          <p className="mt-3 text-center font-jua text-xs text-white/80">
            아직 아무도 안 왔어요. 친구가 다 자랄 때까지 문제를 맞혀보세요!
          </p>
        )}
        {moved === total && total > 0 && (
          <p className="mt-3 text-center font-jua text-sm text-candy-yellow drop-shadow">
            🎉 마을이 가득 찼어요! 모두 모았어요!
          </p>
        )}
      </div>
    </div>,
    document.body
  );
}
