"use client";

export interface RecentWord {
  id: number;
  word: string;
  emoji: string;
}

interface RecentWordsProps {
  words: RecentWord[];
}

export default function RecentWords({ words }: RecentWordsProps) {
  if (words.length === 0) return null;

  return (
    <div className="flex w-full max-w-2xl flex-wrap items-center justify-center gap-2 px-4">
      {words.map((item) => (
        <span
          key={item.id}
          className="flex items-center gap-1 rounded-full bg-white/25 px-3 py-1.5 text-lg font-jua text-white backdrop-blur-sm sm:text-xl"
        >
          <span>{item.emoji}</span>
          <span>{item.word}</span>
        </span>
      ))}
    </div>
  );
}
