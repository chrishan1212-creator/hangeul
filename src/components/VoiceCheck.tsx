"use client";

import { useEffect, useState } from "react";
import PlayShell from "@/components/PlayShell";

interface VoiceRow {
  name: string;
  lang: string;
  localService: boolean;
  isDefault: boolean;
}

const SAMPLE = "안녕하세요. 나는 아기공룡이에요. 사과는 어디 있을까요?";

/**
 * 어떤 한국어 목소리가 깔려 있는지 확인하고 하나씩 들어보는 점검용 화면.
 * 아이가 쓰는 화면이 아니라 어른이 확인하는 용도라 홈에는 링크를 두지 않았다.
 */
interface VoiceCheckProps {
  onClose: () => void;
}

export default function VoiceCheck({ onClose }: VoiceCheckProps) {
  const [voices, setVoices] = useState<VoiceRow[]>([]);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setSupported(false);
      return;
    }

    const load = () => {
      const list = window.speechSynthesis
        .getVoices()
        .filter((v) => v.lang?.toLowerCase().startsWith("ko"))
        .map((v) => ({
          name: v.name,
          lang: v.lang,
          localService: v.localService,
          isDefault: v.default,
        }));
      setVoices(list);
    };

    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, []);

  const speakWithSystemDefault = () => {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(SAMPLE);
    u.lang = "ko-KR";
    u.rate = 0.9;
    u.pitch = 1.15;
    window.speechSynthesis.speak(u);
  };

  const speakWithVoice = (name: string) => {
    window.speechSynthesis.cancel();
    const voice = window.speechSynthesis.getVoices().find((v) => v.name === name);
    const u = new SpeechSynthesisUtterance(SAMPLE);
    u.lang = "ko-KR";
    u.rate = 0.9;
    u.pitch = 1.15;
    if (voice) u.voice = voice;
    window.speechSynthesis.speak(u);
  };

  return (
    <PlayShell>
      <header className="relative z-10 flex w-full max-w-md items-center justify-between">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-white/25 px-4 py-2 font-jua text-lg text-white backdrop-blur-sm"
        >
          ← 뒤로
        </button>
        <h1 className="font-jua text-xl text-white drop-shadow">🔎 목소리 점검</h1>
        <span className="w-16" aria-hidden />
      </header>

      <section className="relative z-10 flex w-full max-w-md flex-1 flex-col justify-center gap-4 py-6">
        {!supported && (
          <p className="rounded-2xl bg-white/90 p-4 text-center font-jua text-lg text-candy-purple">
            이 브라우저는 읽어주기를 지원하지 않아요.
          </p>
        )}

        <button
          type="button"
          onClick={speakWithSystemDefault}
          className="rounded-3xl bg-white/95 px-5 py-4 text-left shadow-[0_6px_0_rgba(0,0,0,0.15)] transition active:translate-y-1"
        >
          <span className="font-jua text-xl text-slate-700">▶︎ 앱이 실제로 쓰는 방식</span>
          <span className="mt-1 block font-jua text-sm text-slate-500">
            목소리를 지정하지 않고 시스템에 맡깁니다. 게임에서 나는 소리와 같아요.
          </span>
        </button>

        <div className="rounded-3xl bg-white/20 p-4 backdrop-blur-sm">
          <p className="font-jua text-lg text-white drop-shadow">
            기기에 설치된 한국어 목소리 ({voices.length}개)
          </p>
          <p className="mt-1 font-jua text-xs text-white/80">
            눌러서 하나씩 들어보고, 위의 &ldquo;앱이 쓰는 방식&rdquo;과 같은 목소리인지
            비교해보세요.
          </p>

          <div className="mt-3 flex flex-col gap-2">
            {voices.length === 0 && (
              <p className="rounded-2xl bg-white/80 px-4 py-3 font-jua text-sm text-slate-600">
                아직 목록이 안 떴어요. 화면을 한 번 누르거나 새로고침해보세요.
              </p>
            )}
            {voices.map((v) => (
              <button
                key={v.name + v.lang}
                type="button"
                onClick={() => speakWithVoice(v.name)}
                className="rounded-2xl bg-white/85 px-4 py-3 text-left transition hover:bg-white"
              >
                <span className="font-jua text-base text-slate-700">▶︎ {v.name}</span>
                <span className="mt-0.5 block font-jua text-xs text-slate-500">
                  {v.lang}
                  {v.isDefault ? " · 기본" : ""}
                  {v.localService ? " · 기기 내장" : " · 온라인"}
                </span>
              </button>
            ))}
          </div>
        </div>

        <p className="px-2 text-center font-jua text-xs text-white/80">
          iOS는 웹에서 &ldquo;지금 쓰는 음성이 프리미엄인지&rdquo;를 알려주지 않아요.
          설정 → 손쉬운 사용 → 음성 콘텐츠 → 음성 → 한국어 에서 고른 음성이 쓰입니다.
        </p>
      </section>
    </PlayShell>
  );
}
