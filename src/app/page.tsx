"use client";

import { useCallback, useRef, useState } from "react";
import MicButton from "@/components/MicButton";
import WordDisplay from "@/components/WordDisplay";
import RecentWords, { RecentWord } from "@/components/RecentWords";
import Confetti from "@/components/Confetti";
import FloatingBackground from "@/components/FloatingBackground";
import TypingInput from "@/components/TypingInput";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { matchWordToEmoji } from "@/lib/wordEmojiMap";

const ENCOURAGEMENTS = ["참 잘했어요!", "최고예요!", "우와, 대단해요!", "딩동댕!", "잘 들었어요!"];

function speak(text: string) {
  if (typeof window === "undefined") return;
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ko-KR";
  utterance.rate = 0.95;
  utterance.pitch = 1.15;
  window.speechSynthesis.speak(utterance);
}

export default function Home() {
  const [currentWord, setCurrentWord] = useState("");
  const [currentEmoji, setCurrentEmoji] = useState("");
  const [praise, setPraise] = useState("");
  const [recentWords, setRecentWords] = useState<RecentWord[]>([]);
  const [confettiKey, setConfettiKey] = useState(0);
  const [popKey, setPopKey] = useState(0);
  const [soundOn, setSoundOn] = useState(true);
  const idRef = useRef(0);
  const soundOnRef = useRef(soundOn);
  soundOnRef.current = soundOn;

  // 음성으로 들었든, 타이핑으로 입력했든 여기서 같은 방식으로 처리한다.
  // 사전에 없는 단어도 매칭이 안 될 뿐 화면에는 그대로 표시된다 (matchWordToEmoji 참고).
  const handleWord = useCallback((raw: string) => {
    const { word, emoji, matched } = matchWordToEmoji(raw);
    if (!word) return;

    setCurrentWord(word);
    setCurrentEmoji(emoji);
    setPopKey((k) => k + 1);

    if (matched) {
      setConfettiKey((k) => k + 1);
      setPraise(ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)]);
    } else {
      setPraise("");
    }

    idRef.current += 1;
    setRecentWords((prev) => [{ id: idRef.current, word, emoji }, ...prev].slice(0, 8));

    if (soundOnRef.current) {
      speak(word);
    }
  }, []);

  const { status, errorMessage, isSupported, start, stop } = useSpeechRecognition({
    lang: "ko-KR",
    onResult: handleWord,
  });

  const listening = status === "listening";

  const handleMicClick = () => {
    if (listening) {
      stop();
    } else {
      start();
    }
  };

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-between overflow-hidden bg-gradient-to-br from-candy-purple via-candy-pink to-candy-orange bg-[length:200%_200%] animate-gradient-move px-4 py-6 sm:py-10">
      <FloatingBackground />
      <Confetti triggerKey={confettiKey} />

      <header className="relative z-10 flex w-full max-w-3xl items-center justify-between">
        <h1 className="font-jua text-2xl text-white drop-shadow sm:text-3xl">
          🐥 한글 말하기 놀이
        </h1>
        <button
          type="button"
          onClick={() => setSoundOn((s) => !s)}
          aria-pressed={soundOn}
          aria-label={soundOn ? "소리 끄기" : "소리 켜기"}
          className="rounded-full bg-white/25 px-3 py-2 text-xl backdrop-blur-sm transition hover:bg-white/35"
        >
          {soundOn ? "🔊" : "🔇"}
        </button>
      </header>

      <section className="relative z-10 flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-6 py-6">
        <WordDisplay word={currentWord} emoji={currentEmoji} animationKey={popKey} />

        {praise && (
          <p className="animate-pop-in font-jua text-2xl text-candy-yellow drop-shadow sm:text-3xl">
            {praise}
          </p>
        )}

        {status === "error" && errorMessage && (
          <p className="rounded-full bg-white/80 px-4 py-2 text-center font-jua text-lg text-red-500 shadow">
            {errorMessage}
          </p>
        )}

        {listening && (
          <p className="font-jua text-xl text-white/90 animate-wiggle">듣고 있어요... 🎧</p>
        )}

        {!isSupported && (
          <p className="max-w-sm rounded-2xl bg-white/85 px-4 py-3 text-center font-jua text-base text-candy-purple shadow">
            😅 이 브라우저는 음성 인식이 안돼요. 아래에 글자를 입력해보세요!
          </p>
        )}
      </section>

      <footer className="relative z-10 flex w-full max-w-3xl flex-col items-center gap-5 pb-2">
        <RecentWords words={recentWords} />
        <TypingInput onSubmit={handleWord} />
        {isSupported && (
          <>
            <MicButton listening={listening} onClick={handleMicClick} />
            <p className="font-jua text-white/80 text-sm sm:text-base">
              마이크를 누르거나 위에 글자를 써서 한글 단어를 확인해보세요
            </p>
          </>
        )}
      </footer>
    </main>
  );
}
