"use client";

import { fillWidthFontSize } from "@/lib/textSize";

interface WordDisplayProps {
  word: string;
  emoji: string;
  animationKey: number;
}

/** 글자가 짧을수록 이모지도 조금 크게 (긴 단어는 글씨에 자리를 양보한다) */
function getEmojiSizeClasses(length: number): string {
  if (length <= 2) return "text-[6rem] sm:text-[8rem]";
  if (length === 3) return "text-[5.5rem] sm:text-[7rem]";
  return "text-[5rem] sm:text-[6rem]";
}

export default function WordDisplay({ word, emoji, animationKey }: WordDisplayProps) {
  if (!word) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="text-8xl animate-float sm:text-9xl">🎈</div>
        <p className="font-jua text-2xl text-white/90 drop-shadow sm:text-3xl">
          마이크를 누르고 말해보세요!
        </p>
      </div>
    );
  }

  return (
    <div
      key={animationKey}
      className="flex w-full flex-col items-center gap-2 text-center animate-pop-in"
    >
      <div className={`leading-none drop-shadow-xl ${getEmojiSizeClasses(word.length)}`}>
        {emoji}
      </div>
      <div
        className="font-jua text-white drop-shadow-[0_4px_0_rgba(0,0,0,0.2)]"
        style={{
          // 말하기 화면은 아래에 입력창과 마이크 버튼이 있어서
          // 게임 화면보다는 조금 작게 잡아 버튼이 가려지지 않게 한다.
          fontSize: fillWidthFontSize(word, {
            usableWidthVw: 78,
            maxVw: 62,
            maxWidthRem: 15,
          }),
          lineHeight: 1.15,
          wordBreak: "keep-all",
        }}
      >
        {word}
      </div>
    </div>
  );
}
