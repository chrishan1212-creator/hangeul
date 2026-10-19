"use client";

import { useEffect, useRef, useState } from "react";
import PlayShell from "@/components/PlayShell";
import SettingsButton from "@/components/SettingsButton";
import { unlockAudio } from "@/lib/sfx";
import { cancelSpeech, primeSpeech, speak } from "@/lib/speech";
import { composeSyllable, consonantName, vowelName } from "@/lib/korean";
import {
  PLAY_CONSONANTS,
  PLAY_VOWELS,
  buildCombineLine,
  getSyllableWords,
  splitAroundSyllable,
} from "@/lib/syllableWords";

interface SyllableLabProps {
  onHome: () => void;
}

const PANEL = "rounded-3xl bg-white/95 p-2.5 shadow-[0_6px_0_rgba(0,0,0,0.12)] sm:p-4";

/**
 * 자음 + 모음 합치기 (소리 만들기).
 *
 * 아이가 글을 읽지 않아도 갖고 놀 수 있게 설명 글은 두지 않고, 색으로만 이어준다.
 * 자음(파랑)과 모음(분홍)을 누르면 둘이 만나 글자가 되는 걸 보여주고 읽어준다.
 * (ㄱ + ㅏ = 가 → "기역하고 아가 만나면 가!")
 * 그 글자가 들어간 낱말을 그림과 함께 보여주고, 누르면 읽어준다.
 *
 * 휴대폰 한 화면에 다 들어가도록 스크롤 없이 배치한다.
 */
export default function SyllableLab({ onHome }: SyllableLabProps) {
  const [consonant, setConsonant] = useState("ㄱ");
  const [vowel, setVowel] = useState("ㅏ");
  /** 지금 소리가 나고 있는 곳 (흔들어서 보여준다) */
  const [speaking, setSpeaking] = useState<string | null>(null);
  const [popKey, setPopKey] = useState(0);
  /** 말하기 요청마다 번호를 매겨, 늦게 끝난 옛 요청이 화면을 건드리지 않게 한다 */
  const runRef = useRef(0);

  const syllable = composeSyllable(consonant, vowel);
  const words = getSyllableWords(syllable).slice(0, 4);

  useEffect(() => () => cancelSpeech(), []);

  const say = async (key: string, text: string) => {
    // 아이폰은 터치한 순간에만 소리를 열 수 있어서, 누를 때마다 깨워둔다
    unlockAudio();
    primeSpeech();
    const run = ++runRef.current;
    cancelSpeech();
    setSpeaking(key);
    await speak(text);
    if (runRef.current === run) setSpeaking(null);
  };

  const pick = (c: string, v: string) => {
    setConsonant(c);
    setVowel(v);
    setPopKey((k) => k + 1);
    void say("syllable", buildCombineLine(c, v));
  };

  return (
    <PlayShell>
      <header className="relative z-10 flex w-full max-w-3xl items-center justify-between">
        <button
          type="button"
          onClick={() => {
            cancelSpeech();
            onHome();
          }}
          className="rounded-full bg-white/25 px-4 py-2 font-jua text-lg text-white backdrop-blur-sm transition hover:bg-white/35"
        >
          ← 홈
        </button>
        <h1 className="font-jua text-2xl text-white drop-shadow">소리 만들기</h1>
        <SettingsButton />
      </header>

      <div className="relative z-10 flex w-full max-w-3xl flex-1 flex-col justify-center gap-3 py-3">
        {/* 자음 */}
        <section className={PANEL}>
          <div className="grid grid-cols-7 gap-1.5 sm:grid-cols-[repeat(14,minmax(0,1fr))] sm:gap-2">
            {PLAY_CONSONANTS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => pick(c, vowel)}
                aria-pressed={consonant === c}
                aria-label={`자음 ${c} ${consonantName(c)}`}
                className={`flex h-[clamp(3rem,7dvh,4rem)] items-center justify-center rounded-2xl font-jua text-2xl transition active:scale-95 sm:text-3xl ${
                  consonant === c
                    ? "bg-sky-500 text-white shadow-[0_4px_0_rgba(2,100,160,0.45)]"
                    : "bg-sky-50 text-slate-700"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </section>

        {/* 모음 */}
        <section className={PANEL}>
          <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-10 sm:gap-2">
            {PLAY_VOWELS.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => pick(consonant, v)}
                aria-pressed={vowel === v}
                aria-label={`모음 ${v} ${vowelName(v)}`}
                className={`flex h-[clamp(3rem,7dvh,4rem)] items-center justify-center rounded-2xl font-jua text-3xl transition active:scale-95 ${
                  vowel === v
                    ? "bg-candy-pink text-white shadow-[0_4px_0_rgba(190,40,110,0.45)]"
                    : "bg-pink-50 text-candy-pink"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </section>

        {/* 자음 + 모음 = 글자 (글자를 누르면 다시 읽어준다) */}
        <section className={`${PANEL} flex items-center justify-center gap-1.5 sm:gap-3`}>
          <span className="flex h-[clamp(6rem,14dvh,9rem)] flex-1 items-center justify-center rounded-2xl bg-sky-50 font-jua text-6xl text-slate-800 sm:text-7xl">
            <span key={`c-${popKey}`} className="animate-pop-in">
              {consonant}
            </span>
          </span>
          <span className="font-jua text-3xl text-slate-300">+</span>
          <span className="flex h-[clamp(6rem,14dvh,9rem)] flex-1 items-center justify-center rounded-2xl bg-pink-50 font-jua text-6xl text-candy-pink sm:text-7xl">
            <span key={`v-${popKey}`} className="animate-pop-in">
              {vowel}
            </span>
          </span>
          <span className="font-jua text-3xl text-slate-300">=</span>
          <button
            type="button"
            onClick={() => void say("syllable", syllable)}
            aria-label={`${syllable} 소리 듣기`}
            className="relative flex h-[clamp(6rem,14dvh,9rem)] flex-[1.3] items-center justify-center rounded-2xl bg-amber-100 font-jua text-7xl text-slate-800 shadow-[0_4px_0_rgba(180,120,0,0.35)] transition active:translate-y-1 active:shadow-none sm:text-8xl"
          >
            <span key={`s-${popKey}`} className="animate-pop-in">
              {syllable}
            </span>
            <span
              className={`absolute bottom-1 right-1.5 text-lg ${speaking === "syllable" ? "animate-wiggle" : ""}`}
              aria-hidden
            >
              🔊
            </span>
          </button>
        </section>

        {/* 낱말 */}
        <section className={`${PANEL} grid min-h-[7.5rem] grid-cols-4 gap-1.5 sm:min-h-[9rem] sm:gap-3`}>
          {words.length > 0 ? (
            words.map((item) => {
              const key = `word-${item.word}`;
              return (
                <button
                  key={item.word}
                  type="button"
                  onClick={() => void say(key, item.word)}
                  aria-label={item.word}
                  className="flex flex-col items-center justify-center rounded-2xl bg-violet-50 px-1 py-2 transition active:scale-95"
                >
                  <span className={`text-4xl sm:text-5xl ${speaking === key ? "animate-wiggle" : ""}`}>
                    {item.emoji}
                  </span>
                  <WordText word={item.word} syllable={syllable} />
                </button>
              );
            })
          ) : (
            // 쉬운 낱말이 없는 글자(뎌, 쵸 …)는 글자 소리만 듣는다
            <span className="col-span-4 flex items-center justify-center text-5xl opacity-40" aria-hidden>
              🔊
            </span>
          )}
        </section>
      </div>
    </PlayShell>
  );
}

/** 낱말 안에서 지금 배우는 글자만 색칠해 보여준다 (도토리 → 도"토"리) */
function WordText({ word, syllable }: { word: string; syllable: string }) {
  const [before, hit, after] = splitAroundSyllable(word, syllable);
  // 긴 낱말(아이스크림, 크리스마스)도 한 줄에 들어가게 글씨를 줄인다
  const size = word.length >= 5 ? "text-sm sm:text-lg" : word.length === 4 ? "text-base sm:text-xl" : "text-xl sm:text-2xl";
  return (
    <span className={`mt-1 whitespace-nowrap font-jua text-slate-700 ${size}`}>
      {before}
      <span className="text-sky-500">{hit}</span>
      {after}
    </span>
  );
}
