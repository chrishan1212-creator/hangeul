"use client";

import { useState, type FormEvent } from "react";

interface TypingInputProps {
  onSubmit: (word: string) => void;
}

/** 음성 대신(또는 함께) 글자를 타이핑해서 단어를 확인할 수 있는 입력창 */
export default function TypingInput({ onSubmit }: TypingInputProps) {
  const [value, setValue] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setValue("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-md items-center gap-2 px-4"
    >
      <input
        type="text"
        inputMode="text"
        lang="ko"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        enterKeyHint="done"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="여기에 단어를 써보세요 (예: 사과)"
        aria-label="단어 입력"
        className="min-w-0 flex-1 rounded-full bg-white/90 px-5 py-3 font-jua text-lg text-candy-purple placeholder:text-candy-purple/40 shadow-inner outline-none focus:ring-4 focus:ring-white/60 sm:text-xl"
      />
      <button
        type="submit"
        disabled={!value.trim()}
        aria-label="입력한 단어 확인하기"
        className="shrink-0 rounded-full bg-candy-yellow px-5 py-3 text-2xl shadow-[0_5px_0_rgba(0,0,0,0.15)] transition active:translate-y-1 active:shadow-[0_2px_0_rgba(0,0,0,0.15)] disabled:opacity-50"
      >
        ➡️
      </button>
    </form>
  );
}
