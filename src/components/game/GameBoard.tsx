"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Confetti from "@/components/Confetti";
import ChoiceTile from "./ChoiceTile";
import {
  GameMode,
  Question,
  QuizItem,
  buildPromptParts,
  getPool,
  makeQuestion,
} from "@/lib/gameData";
import { playCorrect, playWrong, unlockAudio } from "@/lib/sfx";
import { cancelSpeech, delay, speak, speakPhrase } from "@/lib/speech";
import { fillWidthFontSize } from "@/lib/textSize";

interface GameBoardProps {
  mode: GameMode;
  includeBatchim: boolean;
  choiceCount: number;
  onExit: () => void;
}

/** 정답 축하 순서가 끝나지 않아도 이 시간이 지나면 '다음' 버튼을 보여준다 */
const NEXT_BUTTON_FALLBACK_MS = 8000;

/**
 * 화면이 바뀌자마자 소리가 나오면 아이가 앞부분을 놓치므로,
 * 새 문제가 나온 뒤 잠깐 쉬었다가 질문을 들려준다.
 */
const QUESTION_DELAY_MS = 1000;

/** 팡파레가 울리는 동안 기다렸다가 글자를 읽어준다 */
const CELEBRATION_DELAY_MS = 1400;

export default function GameBoard({
  mode,
  includeBatchim,
  choiceCount,
  onExit,
}: GameBoardProps) {
  const [question, setQuestion] = useState<Question | null>(null);
  const [celebrating, setCelebrating] = useState(false);
  const [wrongDisplay, setWrongDisplay] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [confettiKey, setConfettiKey] = useState(0);
  const [showNext, setShowNext] = useState(false);

  // 정답 축하 순서가 진행되는 동안 다른 화면으로 넘어가면 중단시키기 위한 토큰
  const sequenceRef = useRef(0);
  const lastTargetRef = useRef<string | undefined>(undefined);

  const pool = useMemo(() => getPool(mode, includeBatchim), [mode, includeBatchim]);

  /** 지금 바로 질문을 들려준다 (다시 듣기 버튼용) */
  const askNow = useCallback(
    (q: Question) => {
      cancelSpeech();
      void speakPhrase(buildPromptParts(mode, q.target));
    },
    [mode]
  );

  const nextQuestion = useCallback(() => {
    const token = ++sequenceRef.current;
    const q = makeQuestion(pool, choiceCount, lastTargetRef.current);
    lastTargetRef.current = q.target.display;

    setQuestion(q);
    setCelebrating(false);
    setShowNext(false);
    setWrongDisplay(null);

    cancelSpeech();
    // 화면이 먼저 뜨고 잠깐 뒤에 질문이 나오도록 한 박자 쉰다
    setTimeout(() => {
      if (sequenceRef.current !== token) return;
      void speakPhrase(buildPromptParts(mode, q.target));
    }, QUESTION_DELAY_MS);
  }, [pool, choiceCount, mode]);

  useEffect(() => {
    unlockAudio();
    nextQuestion();
  }, [nextQuestion]);

  useEffect(() => {
    return () => {
      sequenceRef.current += 1;
      cancelSpeech();
    };
  }, []);

  const celebrate = useCallback(async (target: QuizItem) => {
    const token = ++sequenceRef.current;
    const stillActive = () => sequenceRef.current === token;

    const fallback = setTimeout(() => {
      if (stillActive()) setShowNext(true);
    }, NEXT_BUTTON_FALLBACK_MS);

    try {
      await delay(CELEBRATION_DELAY_MS);
      if (!stillActive()) return;
      await speak(target.spoken);
      if (!stillActive()) return;

      await delay(250);
      if (!stillActive()) return;
      await speak("따라해보세요");
      if (!stillActive()) return;

      await delay(200);
      if (!stillActive()) return;
      await speak(target.spoken);
    } finally {
      clearTimeout(fallback);
      if (stillActive()) setShowNext(true);
    }
  }, []);

  const handleChoice = (item: QuizItem) => {
    if (!question || celebrating) return;

    if (item.display === question.target.display) {
      cancelSpeech();
      playCorrect();
      setCelebrating(true);
      setWrongDisplay(null);
      setScore((s) => s + 1);
      setConfettiKey((k) => k + 1);
      void celebrate(question.target);
    } else {
      playWrong();
      setWrongDisplay(item.display);
      setTimeout(() => setWrongDisplay((cur) => (cur === item.display ? null : cur)), 500);
    }
  };

  const handleRepeat = () => {
    if (!question || celebrating) return;
    askNow(question);
  };

  const target = question?.target;
  const showSubtitle = !!target && target.display !== target.spoken;

  return (
    <>
      <Confetti triggerKey={confettiKey} />

      <header className="relative z-10 flex w-full max-w-md items-center justify-between">
        <button
          type="button"
          onClick={onExit}
          aria-label="게임 종료하고 뒤로 가기"
          className="rounded-full bg-white/25 px-4 py-2 font-jua text-lg text-white backdrop-blur-sm transition hover:bg-white/35"
        >
          ← 뒤로
        </button>
        <span className="rounded-full bg-white/25 px-4 py-2 font-jua text-lg text-white backdrop-blur-sm">
          ⭐ {score}
        </span>
      </header>

      {celebrating && target ? (
        <section className="relative z-20 flex w-full max-w-md flex-1 flex-col items-center justify-center gap-3 py-6 text-center">
          {target.emoji && (
            <div className="animate-pop-in text-[4.5rem] leading-none drop-shadow-xl sm:text-[6rem]">
              {target.emoji}
            </div>
          )}
          <div
            className="animate-pop-in font-jua text-white drop-shadow-[0_5px_0_rgba(0,0,0,0.25)]"
            style={{ fontSize: fillWidthFontSize(target.display), lineHeight: 1.15 }}
          >
            {target.display}
          </div>
          {showSubtitle && (
            <div className="font-jua text-3xl text-white/90 drop-shadow sm:text-4xl">
              {target.spoken}
            </div>
          )}
          <p className="mt-2 font-jua text-2xl text-candy-yellow drop-shadow sm:text-3xl">
            따라해보세요!
          </p>
        </section>
      ) : (
        <section className="relative z-10 flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 py-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="font-jua text-2xl text-white drop-shadow sm:text-3xl">
              🔊 잘 듣고 골라보세요
            </p>
            <button
              type="button"
              onClick={handleRepeat}
              className="rounded-full bg-white/30 px-5 py-2 font-jua text-lg text-white backdrop-blur-sm transition hover:bg-white/40"
            >
              🔁 다시 듣기
            </button>
          </div>

          <div className="grid w-full grid-cols-2 gap-4">
            {question?.choices.map((choice) => (
              <ChoiceTile
                key={choice.display}
                label={choice.display}
                wrong={wrongDisplay === choice.display}
                disabled={celebrating}
                onClick={() => handleChoice(choice)}
              />
            ))}
          </div>
        </section>
      )}

      <footer className="relative z-20 flex w-full max-w-md flex-col items-center gap-3 pb-2">
        {celebrating && showNext && (
          <button
            type="button"
            onClick={nextQuestion}
            className="animate-pop-in rounded-full bg-gradient-to-br from-candy-green to-candy-blue px-10 py-4 font-jua text-3xl text-white shadow-[0_8px_0_rgba(0,0,0,0.15)] transition active:translate-y-1.5 active:shadow-[0_3px_0_rgba(0,0,0,0.15)]"
          >
            다음 ➡️
          </button>
        )}
      </footer>
    </>
  );
}
