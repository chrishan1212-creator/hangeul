"use client";

interface MicButtonProps {
  listening: boolean;
  disabled?: boolean;
  onClick: () => void;
}

export default function MicButton({ listening, disabled, onClick }: MicButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={listening}
      aria-label={listening ? "듣는 중, 눌러서 멈추기" : "눌러서 말하기"}
      className={`
        relative flex h-32 w-32 items-center justify-center rounded-full
        text-6xl shadow-[0_10px_0_rgba(0,0,0,0.15)] transition-all duration-150
        active:translate-y-1.5 active:shadow-[0_4px_0_rgba(0,0,0,0.15)]
        disabled:cursor-not-allowed disabled:opacity-50
        sm:h-40 sm:w-40 sm:text-7xl
        ${
          listening
            ? "bg-gradient-to-br from-candy-pink to-candy-purple"
            : "bg-gradient-to-br from-candy-blue to-candy-green"
        }
      `}
    >
      {listening && (
        <>
          <span className="absolute inset-0 rounded-full bg-candy-pink/60 animate-pulse-ring" />
          <span
            className="absolute inset-0 rounded-full bg-candy-purple/50 animate-pulse-ring"
            style={{ animationDelay: "0.4s" }}
          />
        </>
      )}
      <span className="relative drop-shadow-md">{listening ? "🔴" : "🎤"}</span>
    </button>
  );
}
