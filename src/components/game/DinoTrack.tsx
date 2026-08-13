"use client";

import { DinoInfo } from "@/lib/dino";

interface DinoTrackProps {
  dino: DinoInfo;
  step: number;
  goal: number;
  feasting: boolean;
}

/**
 * 화면 위쪽에서 아기공룡이 음식을 향해 조금씩 걸어간다.
 * 문제를 하나 맞힐 때마다 한 걸음 앞으로 가고, 끝까지 가면 음식을 먹는다.
 */
export default function DinoTrack({ dino, step, goal, feasting }: DinoTrackProps) {
  // 음식 자리를 남겨두기 위해 공룡은 0% ~ 78% 구간만 움직인다
  const progress = Math.min(step / goal, 1);
  const left = progress * 78;

  return (
    <div className="relative z-10 w-full max-w-md pt-2">
      <div className="relative h-14">
        {/* 걸어가는 길 */}
        <div className="absolute inset-x-0 bottom-1 h-2.5 rounded-full bg-white/30" />
        <div
          className="absolute bottom-1 left-0 h-2.5 rounded-full bg-candy-yellow/70 transition-all duration-700 ease-out"
          style={{ width: `${left}%` }}
        />

        {/* 목적지 음식 */}
        <div className="absolute bottom-3 right-0 text-3xl">
          {feasting ? (
            <span className="animate-pop-in">✨</span>
          ) : (
            <span className="animate-float">{dino.food}</span>
          )}
        </div>

        {/* 아기공룡 */}
        <div
          className={`absolute bottom-3 text-4xl transition-all duration-700 ease-out ${
            feasting ? "animate-wiggle" : ""
          }`}
          style={{ left: `${left}%` }}
        >
          {dino.emoji}
        </div>
      </div>

      <p className="text-center font-jua text-sm text-white/80">
        {feasting
          ? "냠냠! 다 먹었어요 🎊"
          : `${Math.max(goal - step, 0)}개 더 맞히면 ${dino.food} 먹어요!`}
      </p>
    </div>
  );
}
