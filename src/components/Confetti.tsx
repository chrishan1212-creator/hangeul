"use client";

import { useMemo } from "react";

const PIECES = ["🎉", "⭐", "🎊", "✨", "💖", "🌟"];

interface ConfettiProps {
  triggerKey: number;
}

/** 정답(매칭 성공)마다 화면 위에서 이모지 색종이가 떨어지는 순수 CSS 애니메이션 */
export default function Confetti({ triggerKey }: ConfettiProps) {
  const pieces = useMemo(() => {
    if (triggerKey === 0) return [];
    return Array.from({ length: 14 }, (_, i) => ({
      id: `${triggerKey}-${i}`,
      left: Math.random() * 100,
      delay: Math.random() * 0.4,
      duration: 1.6 + Math.random() * 1.2,
      emoji: PIECES[Math.floor(Math.random() * PIECES.length)],
      size: 1.2 + Math.random() * 1.4,
    }));
  }, [triggerKey]);

  if (pieces.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-30 overflow-hidden">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="absolute top-0 animate-confetti-fall"
          style={{
            left: `${p.left}%`,
            fontSize: `${p.size}rem`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  );
}
