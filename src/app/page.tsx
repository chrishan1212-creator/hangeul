"use client";

import { useCallback, useRef, useState } from "react";
import MicButton from "@/components/MicButton";
import WordDisplay from "@/components/WordDisplay";
import RecentWords, { RecentWord } from "@/components/RecentWords";
import Confetti from "@/components/Confetti";
import FloatingBackground from "@/components/FloatingBackground";
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

  const handleFinalTranscript = useCallback((transcript: string) => {
    const { word, emoji, matched } = matchWordToEmoji(transcript);
    if (!word) return;

    setCurrentWord(word);
    setCurrentEmoji(emoji);
    setPopKey((k) => k + 1);

    if (matched) {
      setConfettiKey((k) => k + 1);
      setPraise(ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)]);
      idRef.current += 1;
      setRecentWords((prev) => [{ id: idRef.current, word, emoji }, ...prev].slice(0, 8));
    } else {
      setPraise("");
    }

    if (soundOnRef.current) {
      speak(word);
    }
  }, []);

  const { status, errorMessage, isSupported, start, stop } = useSpeechRecognition({
    lang: "ko-KR",
    onResult: handleFinalTranscript,
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
        {!isSupported && (
          <div className="max-w-md rounded-3xl bg-white/90 p-6 text-center shadow-xl">
            <p className="font-jua text-xl text-candy-purple">
              😢 이 브라우저는 음성 인식을 지원하지 않아요.
            </p>
            <p className="mt-2 text-gray-600">
              크롬(Chrome)이나 엣지(Edge) 브라우저에서 열어주세요.
            </p>
          </div>
        )}

        {isSupported && (
          <>
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
              <p className="font-jua text-xl text-white/90 animate-wiggle">
                듣고 있어요... 🎧
              </p>
            )}
          </>
        )}
      </section>

      <footer className="relative z-10 flex w-full max-w-3xl flex-col items-center gap-5 pb-2">
        <RecentWords words={recentWords} />
        <MicButton listening={listening} disabled={!isSupported} onClick={handleMicClick} />
        <p className="font-jua text-white/80 text-sm sm:text-base">
          {isSupported ? "마이크를 누르고 한글 단어를 말해보세요" : " "}
        </p>
      </footer>
    </main>
  );
}
