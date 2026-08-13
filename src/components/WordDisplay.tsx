"use client";

interface WordDisplayProps {
  word: string;
  emoji: string;
  animationKey: number;
}

/**
 * 글자 수에 따라 크기를 다르게 보여준다.
 * 2글자 이하는 가장 크게, 5글자 이상은 가장 작게, 그 사이는 단계적으로 줄어든다.
 */
function getWordSizeClasses(length: number): string {
  if (length <= 2) return "text-7xl sm:text-9xl";
  if (length === 3) return "text-6xl sm:text-8xl";
  if (length === 4) return "text-5xl sm:text-7xl";
  return "text-4xl sm:text-6xl";
}

function getEmojiSizeClasses(length: number): string {
  if (length <= 2) return "text-[7rem] sm:text-[10rem]";
  if (length === 3) return "text-[6.5rem] sm:text-[9rem]";
  if (length === 4) return "text-[6rem] sm:text-[8rem]";
  return "text-[5.5rem] sm:text-[7rem]";
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
      <div className={`leading-none drop-shadow-xl ${getEmojiSizeClasses(word.length)}`}>
        {emoji}
      </div>
      <div
        className={`font-jua text-white drop-shadow-[0_4px_0_rgba(0,0,0,0.2)] ${getWordSizeClasses(word.length)}`}
      >
        {word}
      </div>
    </div>
  );
}
