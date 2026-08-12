"use client";

interface WordDisplayProps {
  word: string;
  emoji: string;
  animationKey: number;
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
      className="flex flex-col items-center gap-2 text-center animate-pop-in"
    >
      <div className="text-[7rem] leading-none drop-shadow-xl sm:text-[10rem]">
        {emoji}
      </div>
      <div className="font-jua text-6xl text-white drop-shadow-[0_4px_0_rgba(0,0,0,0.2)] sm:text-8xl">
        {word}
      </div>
    </div>
  );
}
