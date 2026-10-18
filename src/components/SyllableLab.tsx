"use client";

import { useEffect, useRef, useState } from "react";
import PlayShell from "@/components/PlayShell";
import SettingsButton from "@/components/SettingsButton";
import { unlockAudio } from "@/lib/sfx";
import { cancelSpeech, delay, primeSpeech, speak } from "@/lib/speech";
import { composeSyllable, consonantName, subjectParticle, vowelName } from "@/lib/korean";
import {
  PLAY_CONSONANTS,
  PLAY_VOWELS,
  getSyllableWords,
  splitAroundSyllable,
} from "@/lib/syllableWords";

interface SyllableLabProps {
  onHome: () => void;
}

/** 지금 소리가 나고 있는 곳 (스피커 버튼을 흔들어 보여준다) */
type SpeakingKey = string | null;

const CARD = "rounded-3xl bg-white/95 shadow-[0_6px_0_rgba(0,0,0,0.12)]";

interface StepTitleProps {
  step: number;
  color: string;
  title: string;
  hint: string;
}

function StepTitle({ step, color, title, hint }: StepTitleProps) {
  return (
    <div className="mb-3 flex items-start gap-3">
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-jua text-xl text-white ${color}`}
      >
        {step}
      </span>
      <span className="flex flex-col">
        <span className="font-jua text-xl text-slate-700 sm:text-2xl">{title}</span>
        <span className="font-jua text-sm text-slate-400">{hint}</span>
      </span>
    </div>
  );
}

function SpeakerIcon({ active }: { active: boolean }) {
  return (
    <span className={`inline-block ${active ? "animate-wiggle" : ""}`} aria-hidden>
      🔊
    </span>
  );
}

/**
 * 자음 + 모음 합치기.
 *
 * 모음을 고르고 자음을 누르면 둘이 만나 글자가 되는 걸 보여주고 읽어준다.
 * (ㄱ + ㅏ = 가 → "기역하고 아가 만나면 가!")
 * 그 글자가 들어간 낱말을 그림과 함께 늘어놓아, 눌러서 들어볼 수 있게 한다.
 */
export default function SyllableLab({ onHome }: SyllableLabProps) {
  const [vowel, setVowel] = useState("ㅏ");
  const [consonant, setConsonant] = useState("ㄱ");
  const [speaking, setSpeaking] = useState<SpeakingKey>(null);
  const [popKey, setPopKey] = useState(0);
  /** "차례로 듣기" 중인지. 다른 걸 누르면 멈춘다. */
  const [sweeping, setSweeping] = useState(false);
  /** 말하기 요청마다 번호를 매겨, 늦게 끝난 옛 요청이 화면을 건드리지 않게 한다 */
  const runRef = useRef(0);

  const syllable = composeSyllable(consonant, vowel);
  const words = getSyllableWords(syllable);
  const [lead] = words;

  useEffect(() => () => cancelSpeech(), []);

  /** 아이폰은 터치한 순간에만 소리를 열 수 있어서, 누를 때마다 깨워둔다 */
  const wake = () => {
    unlockAudio();
    primeSpeech();
  };

  const say = async (key: string, text: string) => {
    wake();
    const run = ++runRef.current;
    setSweeping(false);
    cancelSpeech();
    setSpeaking(key);
    await speak(text);
    if (runRef.current === run) setSpeaking(null);
  };

  const comboLine = (c: string, v: string) => {
    const vName = vowelName(v);
    return `${consonantName(c)}하고 ${vName}${subjectParticle(vName)} 만나면 ${composeSyllable(c, v)}!`;
  };

  const pickConsonant = (c: string) => {
    setConsonant(c);
    setPopKey((k) => k + 1);
    void say("combo", comboLine(c, vowel));
  };

  const pickVowel = (v: string) => {
    setVowel(v);
    setPopKey((k) => k + 1);
    void say(`vowel-${v}`, vowelName(v));
  };

  /** 고른 모음 줄을 가, 나, 다 … 차례로 읽어준다 */
  const sweep = async () => {
    if (sweeping) {
      runRef.current += 1;
      setSweeping(false);
      setSpeaking(null);
      cancelSpeech();
      return;
    }
    wake();
    const run = ++runRef.current;
    cancelSpeech();
    setSweeping(true);
    for (const c of PLAY_CONSONANTS) {
      if (runRef.current !== run) return;
      setConsonant(c);
      setPopKey((k) => k + 1);
      setSpeaking("syllable");
      await speak(composeSyllable(c, vowel), { rate: 0.85 });
      if (runRef.current !== run) return;
      await delay(250);
    }
    if (runRef.current === run) {
      setSweeping(false);
      setSpeaking(null);
    }
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

      <div className="relative z-10 flex w-full max-w-3xl flex-1 flex-col gap-4 py-4">
        {/* 인사 카드: 곰이 모음을, 토끼가 만들어진 글자를 들고 있다 */}
        <section className={`${CARD} flex items-center gap-2 px-3 py-4 sm:gap-4 sm:px-6`}>
          <div className="flex shrink-0 flex-col items-center">
            <span className="text-4xl sm:text-5xl" aria-hidden>
              🐻
            </span>
            <span className="-mt-1 rounded-xl border-2 border-candy-pink/40 bg-white px-2 font-jua text-2xl text-candy-pink">
              {vowel}
            </span>
          </div>
          <div className="flex-1 text-center">
            <h2 className="font-jua text-xl leading-snug text-slate-700 sm:text-3xl">
              <span className="text-sky-500">자음</span>과{" "}
              <span className="text-candy-pink">모음</span>이 만나면
              <br className="sm:hidden" /> 어떤 소리가 날까요?
            </h2>
            <p className="mt-1 font-jua text-xs text-slate-400 sm:text-sm">
              자음을 누르면 모음 {vowel}와 만나 어떤 글자가 되는지 들을 수 있어요!
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-center">
            <span className="text-4xl sm:text-5xl" aria-hidden>
              🐰
            </span>
            <span className="-mt-1 rounded-xl border-2 border-sky-300 bg-white px-2 font-jua text-2xl text-sky-500">
              {syllable}
            </span>
          </div>
        </section>

        {/* ① 모음 고르기 */}
        <section className={`${CARD} p-4 sm:p-5`}>
          <StepTitle
            step={1}
            color="bg-candy-pink"
            title="모음을 골라보세요"
            hint="누르면 모음 소리를 들려줘요"
          />
          <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
            {PLAY_VOWELS.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => pickVowel(v)}
                aria-pressed={vowel === v}
                aria-label={`모음 ${v} ${vowelName(v)}`}
                className={`flex aspect-square flex-col items-center justify-center rounded-2xl font-jua transition active:scale-95 ${
                  vowel === v
                    ? "bg-candy-pink text-white shadow-[0_4px_0_rgba(190,40,110,0.45)]"
                    : "bg-pink-50 text-candy-pink"
                }`}
              >
                <span className="text-3xl leading-none">{v}</span>
                <span className={`text-xs ${vowel === v ? "text-white/90" : "text-pink-400"}`}>
                  {vowelName(v)}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* ② 자음 고르기 */}
        <section className={`${CARD} p-4 sm:p-5`}>
          <StepTitle
            step={2}
            color="bg-sky-500"
            title="자음을 눌러보세요"
            hint={`모음 ${vowel}와 합쳐진 글자와 소리를 들을 수 있어요`}
          />
          <div className="grid grid-cols-7 gap-2 sm:grid-cols-[repeat(14,minmax(0,1fr))] sm:gap-2.5">
            {PLAY_CONSONANTS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => pickConsonant(c)}
                aria-pressed={consonant === c}
                aria-label={`자음 ${c} ${consonantName(c)}`}
                className={`flex aspect-square items-center justify-center rounded-2xl font-jua text-2xl transition active:scale-95 sm:text-3xl ${
                  consonant === c
                    ? "bg-sky-500 text-white shadow-[0_4px_0_rgba(2,100,160,0.45)]"
                    : "bg-sky-50 text-slate-700"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => void sweep()}
            className={`mt-3 w-full rounded-2xl py-2.5 font-jua text-lg transition active:scale-[0.98] ${
              sweeping ? "bg-slate-200 text-slate-600" : "bg-sky-100 text-sky-600"
            }`}
          >
            {sweeping
              ? "⏹ 그만 듣기"
              : `▶ ${composeSyllable("ㄱ", vowel)} ${composeSyllable("ㄴ", vowel)} ${composeSyllable("ㄷ", vowel)} … 차례로 듣기`}
          </button>
        </section>

        {/* ③ 어떻게 합쳐질까? */}
        <section className={`${CARD} p-4 sm:p-5`}>
          <StepTitle
            step={3}
            color="bg-candy-green"
            title="어떻게 합쳐질까요?"
            hint={`자음 ${consonant}과 모음 ${vowel}가 만나서 글자가 돼요`}
          />
          <div className="flex items-stretch justify-center gap-1.5 sm:gap-3">
            <div className="flex flex-1 flex-col items-center justify-center rounded-2xl bg-sky-50 py-3">
              <span className="font-jua text-sm text-sky-500">자음</span>
              <span key={`c-${popKey}`} className="animate-pop-in font-jua text-5xl text-slate-800 sm:text-7xl">
                {consonant}
              </span>
              <span className="font-jua text-sm text-sky-600">[{consonantName(consonant)}]</span>
            </div>
            <span className="self-center font-jua text-3xl text-slate-400">+</span>
            <div className="flex flex-1 flex-col items-center justify-center rounded-2xl bg-pink-50 py-3">
              <span className="font-jua text-sm text-candy-pink">모음</span>
              <span className="font-jua text-5xl text-candy-pink sm:text-7xl">{vowel}</span>
              <span className="font-jua text-sm text-candy-pink">[{vowelName(vowel)}]</span>
            </div>
            <span className="self-center font-jua text-3xl text-slate-400">=</span>
            <div className="flex flex-1 flex-col items-center justify-center rounded-2xl bg-amber-50 py-3">
              <span className="font-jua text-sm text-amber-600">글자</span>
              <span key={`s-${popKey}`} className="animate-pop-in font-jua text-5xl text-slate-800 sm:text-7xl">
                {syllable}
              </span>
              <span className="font-jua text-sm text-amber-700">[{syllable}]</span>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => void say("syllable", syllable)}
              className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-sky-500 py-3 text-white shadow-[0_4px_0_rgba(2,100,160,0.45)] transition active:translate-y-1 active:shadow-none"
            >
              <span className="text-4xl">
                <SpeakerIcon active={speaking === "syllable"} />
              </span>
              <span className="font-jua text-lg">{syllable} 소리 듣기</span>
            </button>

            {lead ? (
              <button
                type="button"
                onClick={() => void say("lead", lead.word)}
                className="flex flex-col items-center justify-center rounded-2xl border-2 border-slate-100 bg-white py-2 transition active:scale-[0.98]"
              >
                <span className={`text-4xl ${speaking === "lead" ? "animate-wiggle" : ""}`}>
                  {lead.emoji}
                </span>
                <WordText word={lead.word} syllable={syllable} className="text-2xl" />
                <span className="font-jua text-xs text-slate-400">
                  {syllable}: {lead.word}의 {syllable}예요
                </span>
              </button>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 px-2 py-2 text-center">
                <span className="text-3xl">🔍</span>
                <span className="font-jua text-sm text-slate-400">
                  {syllable}가 들어간 쉬운 낱말은
                  <br />
                  찾기 어려워요
                </span>
              </div>
            )}
          </div>
        </section>

        {/* ④ 낱말 */}
        <section className={`${CARD} p-4 sm:p-5`}>
          <StepTitle
            step={4}
            color="bg-candy-purple"
            title="낱말을 눌러서 들어보세요"
            hint={
              words.length > 0
                ? `‘${syllable}’가 들어간 낱말이에요`
                : "다른 자음이나 모음을 골라보세요"
            }
          />
          {words.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
              {words.map((item) => {
                const key = `word-${item.word}`;
                return (
                  <button
                    key={item.word}
                    type="button"
                    onClick={() => void say(key, item.word)}
                    className="relative flex flex-col items-center rounded-2xl border-2 border-slate-100 bg-white px-2 pb-2 pt-3 transition active:scale-95"
                  >
                    <span className={`text-5xl ${speaking === key ? "animate-wiggle" : ""}`}>
                      {item.emoji}
                    </span>
                    <WordText word={item.word} syllable={syllable} className="mt-1 text-2xl" />
                    {item.hint && (
                      <span className="font-jua text-xs text-slate-400">({item.hint})</span>
                    )}
                    <span className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-base">
                      <SpeakerIcon active={speaking === key} />
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="rounded-2xl bg-slate-50 py-6 text-center font-jua text-lg text-slate-400">
              {syllable}는 소리만 들어볼까요? 위의 🔊 를 눌러보세요
            </p>
          )}
        </section>
      </div>
    </PlayShell>
  );
}

/** 낱말 안에서 지금 배우는 글자만 색칠해 보여준다 (바나나 → 바"나"나) */
function WordText({ word, syllable, className = "" }: { word: string; syllable: string; className?: string }) {
  const [before, hit, after] = splitAroundSyllable(word, syllable);
  return (
    <span className={`font-jua text-slate-700 ${className}`}>
      {before}
      <span className="text-sky-500">{hit}</span>
      {after}
    </span>
  );
}
