"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Confetti from "@/components/Confetti";
import ChoiceTile from "./ChoiceTile";
import AnimalTrack from "./AnimalTrack";
import LetterBuilder from "./LetterBuilder";
import SettingsButton from "@/components/SettingsButton";
import {
  GameMode,
  Question,
  QuizItem,
  buildLetterChoices,
  getPool,
  isLetterMode,
  makeQuestion,
} from "@/lib/gameData";
import {
  AnimalInfo,
  FoodItem,
  JOURNEY_GOAL,
  MAX_GROWTH_ROUND,
  animalScale,
  buildFeastLine,
  buildGreetingLine,
  randomAnimal,
  randomFood,
} from "@/lib/animals";
import { playCorrect, playFeast, playWrong, unlockAudio } from "@/lib/sfx";
import {
  cancelSpeech,
  delay,
  prefetchPhrase,
  prefetchSpeech,
  speak,
  speakPhrase,
} from "@/lib/speech";
import { fillWidthFontSize } from "@/lib/textSize";

interface GameBoardProps {
  mode: GameMode;
  includeBatchim: boolean;
  comboVowel: string;
  choiceCount: number;
  onExit: () => void;
}

/** 어떤 이유로든 축하 순서가 끝나지 않을 때, 이 시간이 지나면 그냥 다음 문제로 넘어간다 */
const CELEBRATION_TIMEOUT_MS = 15000;

/**
 * 읽어주기가 꺼져 있으면 축하 순서가 순식간에 끝나버린다.
 * 아이가 글자를 볼 시간은 확보해야 하므로 최소 이만큼은 보여준다.
 */
const MIN_CELEBRATION_MS = 2600;

/** 다 읽어준 뒤 다음 문제로 넘어가기 전 쉬는 시간 */
const NEXT_PAUSE_MS = 1200;

/** 밥을 먹은 뒤에는 조금 더 여운을 준다 */
const FEAST_PAUSE_MS = 2200;

/**
 * 화면이 바뀌자마자 소리가 나오면 아이가 앞부분을 놓치므로,
 * 새 문제가 나온 뒤 잠깐 쉬었다가 공룡이 말하게 한다.
 */
const QUESTION_DELAY_MS = 1000;

/** 팡파레가 울리는 동안 기다렸다가 글자를 읽어준다 */
const CELEBRATION_DELAY_MS = 1400;

export default function GameBoard({
  mode,
  includeBatchim,
  comboVowel,
  choiceCount,
  onExit,
}: GameBoardProps) {
  const [question, setQuestion] = useState<Question | null>(null);
  const [celebrating, setCelebrating] = useState(false);
  const [wrongDisplay, setWrongDisplay] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [confettiKey, setConfettiKey] = useState(0);

  // 같은 친구가 따라다니며 밥을 먹을 때마다 자라고, 다 자라면 새 친구가 온다
  const buildMode = mode === "build";
  const [animal, setAnimal] = useState<AnimalInfo>(() => randomAnimal(undefined, mode === "build"));
  const [round, setRound] = useState(0);
  const [food, setFood] = useState<FoodItem>(() => randomFood(animal.diet));
  const [step, setStep] = useState(0);
  const [feasting, setFeasting] = useState(false);

  // nextQuestion 이 매번 새로 만들어지지 않도록 최신 값을 ref 로도 들고 있는다
  const animalRef = useRef(animal);
  animalRef.current = animal;
  const roundRef = useRef(round);
  roundRef.current = round;
  const foodRef = useRef(food);
  foodRef.current = food;

  // 진행 중인 순서를 중간에 끊기 위한 토큰
  const sequenceRef = useRef(0);
  const lastTargetRef = useRef<string | undefined>(undefined);
  // 여행이 끝나서 다음 문제 때 새 공룡으로 바꿔야 하는지
  const journeyDoneRef = useRef(false);

  const pool = useMemo(
    () => getPool(mode, includeBatchim, comboVowel),
    [mode, includeBatchim, comboVowel]
  );
  const letterMode = isLetterMode(mode);

  /** 지금 바로 공룡 대사를 들려준다 (다시 듣기 버튼용) */
  const askNow = useCallback((q: Question) => {
    cancelSpeech();
    void speakPhrase(q.lineParts);
  }, []);

  const nextQuestion = useCallback(() => {
    const token = ++sequenceRef.current;

    // 한 끼 다 먹었으면 친구가 자라고, 다음엔 다른 음식을 찾아 떠난다.
    // 다 자란 친구는 인사하고 떠나면서 새 친구를 데려온다.
    let newFriend: AnimalInfo | null = null;
    if (journeyDoneRef.current) {
      journeyDoneRef.current = false;
      const nextRound = roundRef.current + 1;

      if (nextRound > MAX_GROWTH_ROUND) {
        newFriend = randomAnimal(animalRef.current.name, buildMode);
        setAnimal(newFriend);
        setRound(0);
        setFood(randomFood(newFriend.diet));
      } else {
        setRound(nextRound);
        setFood(randomFood(animalRef.current.diet, foodRef.current.name));
      }
      setStep(0);
    }
    setFeasting(false);

    const q = makeQuestion(pool, mode, choiceCount, lastTargetRef.current);
    lastTargetRef.current = q.target.display;

    setQuestion(q);
    setCelebrating(false);
    setWrongDisplay(null);

    // 질문과 정답 칭찬을 미리 받아둔다. 말이 곧바로 시작되게 하기 위해서다.
    prefetchPhrase(q.lineParts);
    prefetchSpeech(q.target.celebrateLine ?? q.target.spoken);

    cancelSpeech();
    // 화면이 먼저 뜨고 잠깐 뒤에 친구가 말하도록 한 박자 쉰다
    setTimeout(() => {
      void (async () => {
        if (sequenceRef.current !== token) return;
        // 새 친구가 왔으면 먼저 인사부터 시킨다
        if (newFriend) {
          await speak(buildGreetingLine(newFriend));
          if (sequenceRef.current !== token) return;
          await delay(250);
          if (sequenceRef.current !== token) return;
        }
        await speakPhrase(q.lineParts);
      })();
    }, QUESTION_DELAY_MS);
  }, [pool, choiceCount, mode, buildMode]);

  // celebrate 안에서 다음 문제로 넘어가기 위해 최신 함수를 ref 로 들고 있는다
  const nextQuestionRef = useRef(nextQuestion);
  nextQuestionRef.current = nextQuestion;

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

  const celebrate = useCallback(
    async (target: QuizItem, reachedGoal: boolean, currentFood: FoodItem) => {
      const token = ++sequenceRef.current;
      const stillActive = () => sequenceRef.current === token;

      const startedAt = Date.now();
      const goNext = () => {
        if (stillActive()) nextQuestionRef.current();
      };

      // 축하 순서가 어딘가에서 멈추더라도 놀이가 끊기지 않도록 안전장치를 둔다
      const timeout = setTimeout(goNext, CELEBRATION_TIMEOUT_MS);

      try {
        await delay(CELEBRATION_DELAY_MS);
        if (!stillActive()) return;
        // 가나다 놀이는 자음과 모음이 만나 글자가 되는 걸 짚어준다
        await speak(target.celebrateLine ?? target.spoken);
        if (!stillActive()) return;

        await delay(250);
        if (!stillActive()) return;
        await speak("따라해보세요");
        if (!stillActive()) return;

        await delay(200);
        if (!stillActive()) return;
        await speak(target.spoken);
        if (!stillActive()) return;

        // 공룡이 음식에 도착했으면 먹는 장면을 보여준다
        if (reachedGoal) {
          await delay(400);
          if (!stillActive()) return;
          playFeast();
          setFeasting(true);
          setConfettiKey((k) => k + 1);
          await delay(900);
          if (!stillActive()) return;
          await speak(buildFeastLine(currentFood));
        }
      } finally {
        clearTimeout(timeout);
        if (stillActive()) {
          // 글자를 볼 시간을 최소한 확보한 뒤, 잠깐 쉬었다가 다음 문제로 넘어간다
          const shown = Date.now() - startedAt;
          const pause = reachedGoal ? FEAST_PAUSE_MS : NEXT_PAUSE_MS;
          const wait = Math.max(pause, MIN_CELEBRATION_MS - shown);
          setTimeout(goNext, wait);
        }
      }
    },
    []
  );

  const handleCorrect = useCallback(() => {
    if (!question || celebrating) return;

    const nextStep = step + 1;
    const reachedGoal = nextStep >= JOURNEY_GOAL;

    cancelSpeech();
    playCorrect();
    setCelebrating(true);
    setWrongDisplay(null);
    setScore((s) => s + 1);
    setConfettiKey((k) => k + 1);
    setStep(nextStep);
    if (reachedGoal) journeyDoneRef.current = true;

    void celebrate(question.target, reachedGoal, food);
  }, [question, celebrating, step, food, celebrate]);

  const handleChoice = (item: QuizItem) => {
    if (!question || celebrating) return;

    if (item.display === question.target.display) {
      handleCorrect();
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

  const letterChoices = useMemo(
    () =>
      buildMode && question
        ? buildLetterChoices(question.target.display, choiceCount)
        : { consonants: [], vowels: [] },
    [buildMode, question, choiceCount]
  );

  const target = question?.target;
  const subtitle = target?.note ?? (target && target.display !== target.spoken ? target.spoken : null);
  // 그림 힌트: 글자를 배우는 모드에는 그림이 없으니 물음표를 보여준다
  const hintEmoji = letterMode ? "❓" : target?.emoji ?? "❓";

  return (
    <>
      <Confetti triggerKey={confettiKey} />

      <div className="relative z-10 flex w-full max-w-md shrink-0 flex-col items-center gap-1">
        <header className="flex w-full items-center justify-between">
          <button
            type="button"
            onClick={onExit}
            aria-label="게임 종료하고 뒤로 가기"
            className="rounded-full bg-white/25 px-4 py-2 font-jua text-lg text-white backdrop-blur-sm transition hover:bg-white/35"
          >
            ← 뒤로
          </button>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-white/25 px-4 py-2 font-jua text-lg text-white backdrop-blur-sm">
              ⭐ {score}
            </span>
            <SettingsButton />
          </div>
        </header>

        <AnimalTrack
          animal={animal}
          food={food}
          step={step}
          goal={JOURNEY_GOAL}
          scale={animalScale(round)}
          feasting={feasting}
        />
      </div>

      {celebrating && target ? (
        <section className="relative z-20 flex w-full max-w-md min-h-0 flex-1 flex-col items-center justify-center gap-2 py-2 text-center">
          {target.emoji && (
            <div className="animate-pop-in text-[3.25rem] leading-none drop-shadow-xl sm:text-[4rem]">
              {target.emoji}
            </div>
          )}
          <div
            className="animate-pop-in font-jua text-white drop-shadow-[0_5px_0_rgba(0,0,0,0.25)]"
            style={{
              fontSize: fillWidthFontSize(target.display, { maxDvh: 34 }),
              lineHeight: 1.1,
            }}
          >
            {target.display}
          </div>
          {subtitle && (
            <div className="font-jua text-3xl text-white/90 drop-shadow sm:text-4xl">
              {subtitle}
            </div>
          )}
          <p className="font-jua text-2xl text-candy-yellow drop-shadow sm:text-3xl">
            {feasting ? `냠냠! ${food.name} 맛있다! 🎉` : "따라해보세요!"}
          </p>
        </section>
      ) : (
        <section className="relative z-10 flex w-full max-w-md min-h-0 flex-1 flex-col items-center justify-center gap-5 py-2">
          {buildMode && question ? (
            <>
              <LetterBuilder
                syllable={question.target.display}
                emoji={question.target.emoji ?? "❓"}
                consonantChoices={letterChoices.consonants}
                vowelChoices={letterChoices.vowels}
                onComplete={handleCorrect}
                onMistake={playWrong}
                disabled={celebrating}
              />
              <button
                type="button"
                onClick={handleRepeat}
                className="rounded-full bg-white/30 px-5 py-2 font-jua text-lg text-white backdrop-blur-sm transition hover:bg-white/40"
              >
                🔁 다시 듣기
              </button>
            </>
          ) : (
            <>
              {/*
                찾아야 할 것을 그림으로만 보여준다 (글자는 숨긴다).
                친구는 위쪽 길에 이미 있으므로 여기서는 빼서, 아이가 그림 하나에만
                집중할 수 있게 한다.
              */}
              <div className="rounded-3xl bg-white/90 px-8 py-5 shadow-lg">
                <span className="block text-7xl leading-none sm:text-8xl">{hintEmoji}</span>
              </div>

              <button
                type="button"
                onClick={handleRepeat}
                className="rounded-full bg-white/30 px-5 py-2 font-jua text-lg text-white backdrop-blur-sm transition hover:bg-white/40"
              >
                🔁 다시 듣기
              </button>

              <div
                className="grid w-full min-h-0 flex-1 gap-3"
                style={{
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gridTemplateRows: `repeat(${Math.ceil(choiceCount / 2)}, minmax(0, 1fr))`,
                  maxHeight: "58dvh",
                }}
              >
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
            </>
          )}
        </section>
      )}

    </>
  );
}
