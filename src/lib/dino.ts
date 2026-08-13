/** 아기공룡이 밥 먹으러 가는 여행. 문제를 맞힐 때마다 한 걸음씩 앞으로 간다. */

export type DinoType = "herbivore" | "carnivore";

export interface DinoInfo {
  type: DinoType;
  /** 공룡 그림 */
  emoji: string;
  /** 여행 끝에서 먹을 음식 */
  food: string;
  /** 다 먹었을 때 하는 말 */
  feastLine: string;
}

/** 몇 문제를 맞히면 음식에 도착하는지 */
export const JOURNEY_GOAL = 5;

const HERBIVORE_FOODS = ["🌿", "🍃", "🌱"];
const CARNIVORE_FOODS = ["🍖", "🥩"];

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function randomDino(): DinoInfo {
  const herbivore = Math.random() < 0.5;

  if (herbivore) {
    return {
      type: "herbivore",
      emoji: "🦕",
      food: pick(HERBIVORE_FOODS),
      feastLine: "냠냠! 풀이 정말 맛있어. 고마워!",
    };
  }

  return {
    type: "carnivore",
    emoji: "🦖",
    food: pick(CARNIVORE_FOODS),
    feastLine: "냠냠! 고기가 정말 맛있어. 고마워!",
  };
}
