"use client";

interface ChoiceTileProps {
  label: string;
  wrong: boolean;
  disabled: boolean;
  onClick: () => void;
}

/** 아이가 고르는 글자 카드. 손가락으로 누르기 쉽게 크게 만든다. */
export default function ChoiceTile({ label, wrong, disabled, onClick }: ChoiceTileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={`${label} 고르기`}
      className={`
        flex aspect-square h-full max-w-full justify-self-center items-center justify-center rounded-3xl bg-white/95
        font-jua text-slate-700 shadow-[0_8px_0_rgba(0,0,0,0.15)]
        text-6xl transition-transform duration-150
        active:translate-y-1.5 active:shadow-[0_3px_0_rgba(0,0,0,0.15)]
        disabled:opacity-70 sm:text-8xl
        ${wrong ? "animate-shake bg-red-50" : ""}
      `}
    >
      {label}
    </button>
  );
}
