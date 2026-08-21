"use client";

import PlayShell from "./PlayShell";
import SettingsButton from "./SettingsButton";

export type PlayView = "home" | "speak" | "game";

const MENU: Array<{ view: PlayView; emoji: string; title: string; description: string }> = [
  {
    view: "speak",
    emoji: "🎤",
    title: "말하기 놀이",
    description: "말하면 큰 글씨와 그림으로 보여줘요",
  },
  {
    view: "game",
    emoji: "가",
    title: "글자 놀이",
    description: "소리를 듣고 맞는 글자를 찾아요",
  },
];

interface HomeMenuProps {
  onSelect: (view: PlayView) => void;
}

export default function HomeMenu({ onSelect }: HomeMenuProps) {
  return (
    <PlayShell>
      <div className="relative z-10 flex w-full max-w-md justify-end">
        <SettingsButton />
      </div>

      <header className="relative z-10 text-center">
        <h1 className="font-jua text-4xl text-white drop-shadow-[0_4px_0_rgba(0,0,0,0.2)] sm:text-5xl">
          🐥 한글 놀이터
        </h1>
        <p className="mt-2 font-jua text-lg text-white/90 drop-shadow sm:text-xl">
          무엇을 하고 놀까요?
        </p>
      </header>

      <section className="relative z-10 flex w-full max-w-md flex-1 flex-col justify-center gap-5 py-8">
        {MENU.map((item) => (
          <button
            key={item.view}
            type="button"
            onClick={() => onSelect(item.view)}
            className="flex items-center gap-4 rounded-3xl bg-white/95 px-6 py-6 text-left shadow-[0_8px_0_rgba(0,0,0,0.15)] transition active:translate-y-1.5 active:shadow-[0_3px_0_rgba(0,0,0,0.15)]"
          >
            {/* "글자 놀이"는 이모지가 아니라 실제 한글 글자(가)를 아이콘으로 쓴다.
                font-jua/색상은 이모지에는 영향을 주지 않아 그대로 같이 쓸 수 있다. */}
            <span className="font-jua text-6xl text-candy-purple">{item.emoji}</span>
            <span className="flex flex-col">
              <span className="font-jua text-3xl text-slate-700">{item.title}</span>
              <span className="font-jua text-sm text-slate-400">{item.description}</span>
            </span>
          </button>
        ))}
      </section>

      <footer className="relative z-10 flex flex-col items-center gap-1 pb-2">
        <p className="text-center font-jua text-sm text-white/80">
          소리가 나오니 볼륨을 켜주세요 🔊
        </p>
        <p className="text-center font-jua text-xs text-white/60">
          🗣️ 읽어주는 목소리는 AI로 만든 음성이에요
        </p>
      </footer>
    </PlayShell>
  );
}
