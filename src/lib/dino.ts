import { subjectParticle } from "./korean";

/** 아기공룡이 밥 먹으러 가는 여행. 문제를 맞힐 때마다 한 걸음씩 앞으로 간다. */

export type DinoType = "herbivore" | "carnivore";

export interface FoodItem {
  emoji: string;
  name: string;
}

export interface DinoInfo {
  type: DinoType;
  emoji: string;
}

/** 몇 문제를 맞히면 음식에 도착하는지 */
export const JOURNEY_GOAL = 3;

/** 초식공룡이 좋아하는 것 */
const HERBIVORE_FOODS: FoodItem[] = [
  { emoji: "🌿", name: "풀" },
  { emoji: "🍃", name: "나뭇잎" },
  { emoji: "🌱", name: "새싹" },
];

/** 육식공룡이 좋아하는 것 */
const CARNIVORE_FOODS: FoodItem[] = [
  { emoji: "🍖", name: "고기" },
  { emoji: "🍗", name: "닭다리" },
  { emoji: "🥩", name: "스테이크" },
];

/** 어떤 공룡이든 좋아하는 간식. 뭐가 나올지 궁금하도록 종류를 넉넉히 둔다. */
const TREATS: FoodItem[] = [
  { emoji: "🍦", name: "아이스크림" },
  { emoji: "🍬", name: "사탕" },
  { emoji: "🍪", name: "과자" },
  { emoji: "🍞", name: "빵" },
  { emoji: "🍚", name: "밥" },
  { emoji: "🍜", name: "국수" },
  { emoji: "🍎", name: "사과" },
  { emoji: "🍓", name: "딸기" },
  { emoji: "🍇", name: "포도" },
  { emoji: "🍌", name: "바나나" },
  { emoji: "🍉", name: "수박" },
  { emoji: "🍰", name: "케이크" },
  { emoji: "🍩", name: "도넛" },
  { emoji: "🍕", name: "피자" },
  { emoji: "🥞", name: "팬케이크" },
  { emoji: "🍙", name: "주먹밥" },
  { emoji: "🌽", name: "옥수수" },
  { emoji: "🍠", name: "고구마" },
];

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function randomDino(): DinoInfo {
  return Math.random() < 0.5
    ? { type: "herbivore", emoji: "🦕" }
    : { type: "carnivore", emoji: "🦖" };
}

/** 이번 여행의 목적지 음식. 직전에 먹은 것과 겹치지 않게 고른다. */
export function randomFood(type: DinoType, avoidName?: string): FoodItem {
  const own = type === "herbivore" ? HERBIVORE_FOODS : CARNIVORE_FOODS;
  const pool = [...own, ...TREATS];
  const candidates = avoidName ? pool.filter((food) => food.name !== avoidName) : pool;
  return pick(candidates.length > 0 ? candidates : pool);
}

/** 다 먹고 나서 하는 말 */
export function buildFeastLine(food: FoodItem): string {
  return `냠냠! ${food.name}${subjectParticle(food.name)} 정말 맛있어. 고마워!`;
}

/** 한 번 먹을 때마다 이만큼씩 커진다 */
const GROWTH_PER_MEAL = 0.28;
const MAX_SCALE = 2.2;

/** 밥을 몇 번 먹었는지(round)에 따라 공룡이 얼마나 커졌는지 */
export function dinoScale(round: number): number {
  return Math.min(1 + round * GROWTH_PER_MEAL, MAX_SCALE);
}
