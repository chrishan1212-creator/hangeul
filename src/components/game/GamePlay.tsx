"use client";

import { useState } from "react";
import PlayShell from "@/components/PlayShell";
import GameBoard from "./GameBoard";
import SettingsButton from "@/components/SettingsButton";
import { GameMode, MODE_LIST } from "@/lib/gameData";
import { ALL_VOWELS, COMBO_VOWELS } from "@/lib/syllableCombos";
import { unlockAudio } from "@/lib/sfx";
import { primeSpeech } from "@/lib/speech";

interface GamePlayProps {
  onHome: () => void;
}

export default function GamePlay({ onHome }: GamePlayProps) {
  const [mode, setMode] = useState<GameMode | null>(null);
  const [includeBatchim, setIncludeBatchim] = useState(false);
  const [choiceCount, setChoiceCount] = useState(4);
  const [comboVowel, setComboVowel] = useState<string>(ALL_VOWELS);

  const startGame = (selected: GameMode) => {
    // 아이폰은 화면을 터치한 순간에만 소리를 열 수 있다.
    // 효과음(Web Audio)과 읽어주기(TTS) 둘 다 여기서 미리 깨워둬야
    // 잠시 뒤에 나오는 질문 소리가 정상적으로 재생된다.
    unlockAudio();
    primeSpeech();
    setMode(selected);
  };

  if (mode) {
    return (
      <PlayShell>
        <GameBoard
          mode={mode}
          includeBatchim={includeBatchim}
          comboVowel={comboVowel}
          choiceCount={choiceCount}
          onExit={() => setMode(null)}
        />
      </PlayShell>
    );
  }

  return (
    <PlayShell>
      <header className="relative z-10 flex w-full max-w-md items-center justify-between">
        <button
          type="button"
          onClick={onHome}
          className="rounded-full bg-white/25 px-4 py-2 font-jua text-lg text-white backdrop-blur-sm transition hover:bg-white/35"
        >
          ← 홈
        </button>
        <h1 className="font-jua text-2xl text-white drop-shadow">🔤 글자 놀이</h1>
        <SettingsButton />
      </header>

      <section className="relative z-10 flex w-full max-w-md flex-1 flex-col justify-center gap-5 py-6">
        <p className="text-center font-jua text-xl text-white/90 drop-shadow">
          어떤 놀이를 해볼까요?
        </p>

        <div className="grid grid-cols-2 gap-4">
          {MODE_LIST.map((item) => (
            <button
              key={item.mode}
              type="button"
              onClick={() => startGame(item.mode)}
              className="flex flex-col items-center gap-1 rounded-3xl bg-white/95 px-3 py-6 shadow-[0_8px_0_rgba(0,0,0,0.15)] transition active:translate-y-1.5 active:shadow-[0_3px_0_rgba(0,0,0,0.15)]"
            >
              <span className="font-jua text-5xl leading-tight text-slate-700">{item.icon}</span>
              <span className="font-jua text-2xl text-slate-700">{item.title}</span>
              <span className="font-jua text-sm text-slate-400">{item.sample}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 rounded-3xl bg-white/20 p-4 backdrop-blur-sm">
          <p className="font-jua text-lg text-white drop-shadow">난이도</p>

          <button
            type="button"
            onClick={() => setIncludeBatchim((v) => !v)}
            aria-pressed={includeBatchim}
            className="flex items-center justify-between rounded-2xl bg-white/80 px-4 py-3 text-left transition hover:bg-white/90"
          >
            <span className="font-jua text-base text-slate-700">
              받침 있는 글자 넣기
              <span className="block text-xs text-slate-400">
                한 글자 모드 · 밤, 손, 발 같은 글자
              </span>
            </span>
            <span className="font-jua text-lg">{includeBatchim ? "✅ 켜짐" : "⬜️ 꺼짐"}</span>
          </button>

          <div className="rounded-2xl bg-white/80 px-4 py-3">
            <span className="font-jua text-base text-slate-700">
              가나다 모음 고르기
              <span className="block text-xs text-slate-400">
                가나다 모드 · 고른 모음이 붙은 글자만 나와요
              </span>
            </span>
            <div className="mt-2 flex flex-wrap gap-2">
              {[ALL_VOWELS, ...COMBO_VOWELS].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setComboVowel(v)}
                  aria-pressed={comboVowel === v}
                  className={`h-11 min-w-[2.75rem] rounded-full px-3 font-jua text-lg transition ${
                    comboVowel === v
                      ? "bg-candy-purple text-white"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-white/80 px-4 py-3">
            <span className="font-jua text-base text-slate-700">
              고르는 개수
              <span className="block text-xs text-slate-400">적을수록 쉬워요</span>
            </span>
            <div className="flex gap-2">
              {[2, 3, 4].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setChoiceCount(count)}
                  aria-pressed={choiceCount === count}
                  className={`h-11 w-11 rounded-full font-jua text-lg transition ${
                    choiceCount === count
                      ? "bg-candy-purple text-white"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="relative z-10 pb-2">
        <p className="text-center font-jua text-sm text-white/80">
          소리를 들려주니 볼륨을 켜주세요 🔊
        </p>
      </footer>
    </PlayShell>
  );
}
