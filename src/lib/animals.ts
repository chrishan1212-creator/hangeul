import { hasBatchim, subjectParticle } from "./korean";

/**
 * 아이와 함께 다니는 동물 친구. 문제를 맞힐 때마다 음식을 향해 한 걸음씩
 * 나아가고, 밥을 먹을 때마다 조금씩 자란다. 다 자라면 다른 친구가 찾아온다.
 */

export type DietType = "herbivore" | "carnivore" | "omnivore";

export interface AnimalInfo {
  emoji: string;
  name: string;
  diet: DietType;
}

export interface FoodItem {
  emoji: string;
  name: string;
}

/** 몇 문제를 맞히면 음식에 도착하는지 */
export const JOURNEY_GOAL = 3;

/**
 * 성장 단계별 크기. 아기 → 어린이 → 다 자란 모습 순으로,
 * 한눈에 "우와 커졌다!" 하고 알아볼 수 있게 차이를 크게 뒀다.
 */
const GROWTH_SCALES = [1, 1.55, 2.2];

/** 이만큼 자라고 나면(마지막 단계) 다음 끼니부터 다른 친구가 온다 */
export const MAX_GROWTH_ROUND = GROWTH_SCALES.length - 1;

const ANIMALS: AnimalInfo[] = [
  { emoji: "🦕", name: "브라키오", diet: "herbivore" },
  { emoji: "🦖", name: "티라노", diet: "carnivore" },
  { emoji: "🐵", name: "원숭이", diet: "omnivore" },
  { emoji: "🐦", name: "새", diet: "omnivore" },
  { emoji: "🦆", name: "오리", diet: "omnivore" },
  { emoji: "🐰", name: "토끼", diet: "herbivore" },
  { emoji: "🐻", name: "곰", diet: "omnivore" },
  { emoji: "🐼", name: "판다", diet: "herbivore" },
  { emoji: "🐯", name: "호랑이", diet: "carnivore" },
  { emoji: "🦁", name: "사자", diet: "carnivore" },
  { emoji: "🐶", name: "강아지", diet: "omnivore" },
  { emoji: "🐱", name: "고양이", diet: "carnivore" },
  { emoji: "🐷", name: "돼지", diet: "omnivore" },
  { emoji: "🐮", name: "소", diet: "herbivore" },
  { emoji: "🐹", name: "햄스터", diet: "herbivore" },
  { emoji: "🦊", name: "여우", diet: "carnivore" },
  { emoji: "🐨", name: "코알라", diet: "herbivore" },
  { emoji: "🐸", name: "개구리", diet: "carnivore" },
  { emoji: "🐧", name: "펭귄", diet: "carnivore" },
  { emoji: "🐘", name: "코끼리", diet: "herbivore" },
  { emoji: "🦒", name: "기린", diet: "herbivore" },
  { emoji: "🐴", name: "말", diet: "herbivore" },
  { emoji: "🐥", name: "병아리", diet: "omnivore" },
  { emoji: "🦔", name: "고슴도치", diet: "omnivore" },
  { emoji: "🐢", name: "거북이", diet: "herbivore" },
  { emoji: "🐳", name: "고래", diet: "carnivore" },
  { emoji: "🦉", name: "부엉이", diet: "carnivore" },
  { emoji: "🐭", name: "생쥐", diet: "omnivore" },
];

/** 풀을 먹는 친구가 좋아하는 것 */
const PLANT_FOODS: FoodItem[] = [
  { emoji: "🌿", name: "풀" },
  { emoji: "🍃", name: "나뭇잎" },
  { emoji: "🌱", name: "새싹" },
  { emoji: "🥕", name: "당근" },
  { emoji: "🥦", name: "브로콜리" },
];

/** 고기를 먹는 친구가 좋아하는 것 */
const MEAT_FOODS: FoodItem[] = [
  { emoji: "🍖", name: "고기" },
  { emoji: "🍗", name: "닭다리" },
  { emoji: "🥩", name: "스테이크" },
  { emoji: "🐟", name: "생선" },
];

/** 누구나 좋아하는 간식. 뭐가 나올지 궁금하도록 종류를 넉넉히 둔다. */
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

/**
 * 글자 만들기 놀이에서만 나오는 친구들.
 * 아이가 좋아하는 공룡·자동차·로봇으로만 골랐다.
 */
const BUILD_FRIENDS: AnimalInfo[] = [
  { emoji: "🦖", name: "공룡", diet: "omnivore" },
  { emoji: "🚗", name: "자동차", diet: "omnivore" },
  { emoji: "🤖", name: "로봇", diet: "omnivore" },
];

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/**
 * 새 친구를 데려온다. 직전 친구와는 다른 친구로 고른다.
 * buildOnly 를 켜면 공룡·자동차·로봇 중에서만 고른다.
 */
export function randomAnimal(avoidName?: string, buildOnly = false): AnimalInfo {
  const source = buildOnly ? BUILD_FRIENDS : ANIMALS;
  const candidates = avoidName ? source.filter((a) => a.name !== avoidName) : source;
  return pick(candidates.length > 0 ? candidates : source);
}

/** 이번 여행의 목적지 음식. 직전에 먹은 것과 겹치지 않게 고른다. */
export function randomFood(diet: DietType, avoidName?: string): FoodItem {
  const own =
    diet === "herbivore" ? PLANT_FOODS : diet === "carnivore" ? MEAT_FOODS : [...PLANT_FOODS, ...MEAT_FOODS];
  const pool = [...own, ...TREATS];
  const candidates = avoidName ? pool.filter((food) => food.name !== avoidName) : pool;
  return pick(candidates.length > 0 ? candidates : pool);
}

/** 다 먹고 나서 하는 말 */
export function buildFeastLine(food: FoodItem): string {
  return `냠냠! ${food.name}${subjectParticle(food.name)} 정말 맛있어. 고마워!`;
}

/** 새 친구가 왔을 때 인사말 */
export function buildGreetingLine(animal: AnimalInfo): string {
  // 받침이 있으면 "곰이야", 없으면 "토끼야"
  const suffix = hasBatchim(animal.name) ? "이야" : "야";
  return `안녕! 나는 ${animal.name}${suffix}. 같이 놀자!`;
}

/** 밥을 몇 번 먹었는지(round)에 따라 친구가 얼마나 자랐는지 */
export function animalScale(round: number): number {
  return GROWTH_SCALES[Math.min(round, MAX_GROWTH_ROUND)];
}
