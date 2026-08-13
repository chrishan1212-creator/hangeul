"use client";

import { AnimalInfo, FoodItem } from "@/lib/animals";

interface AnimalTrackProps {
  animal: AnimalInfo;
  food: FoodItem;
  step: number;
  goal: number;
  /** 밥을 먹을 때마다 친구가 커진다 (1 = 처음 크기) */
  scale: number;
  feasting: boolean;
}

/** 기본 크기(rem). 여기에 scale 을 곱해서 점점 커지게 한다. */
const BASE_REM = 2.25;

/**
 * 화면 위쪽에서 동물 친구가 음식을 향해 조금씩 걸어간다.
 * 문제를 하나 맞힐 때마다 한 걸음 앞으로 가고, 끝까지 가면 음식을 먹는다.
 */
export default function AnimalTrack({
  animal,
  food,
  step,
  goal,
  scale,
  feasting,
}: AnimalTrackProps) {
  // 음식 자리를 남겨두기 위해 친구는 0% ~ 76% 구간만 움직인다
  const progress = Math.min(step / goal, 1);
  const left = progress * 76;
  const remaining = Math.max(goal - step, 0);

  return (
    <div className="relative z-10 w-full max-w-md pt-2">
      <div className="relative h-16">
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
            <span className="animate-float">{food.emoji}</span>
          )}
        </div>

        {/* 동물 친구 */}
        <div
          className={`absolute bottom-3 leading-none transition-all duration-700 ease-out ${
            feasting ? "animate-wiggle" : ""
          }`}
          style={{ left: `${left}%`, fontSize: `${BASE_REM * scale}rem` }}
        >
          {animal.emoji}
        </div>
      </div>

      <p className="text-center font-jua text-sm text-white/80">
        {feasting
          ? `냠냠! ${food.name} 다 먹었어요 🎊`
          : `${animal.name} · ${remaining}개 더 맞히면 ${food.emoji} 먹어요!`}
      </p>
    </div>
  );
}
