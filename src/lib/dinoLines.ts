import { objectParticle, subjectParticle, topicParticle } from "./korean";

/**
 * 아기공룡이 문제를 낼 때 하는 대사를 만든다.
 *
 * 대사는 [앞부분, 단어, 중간, 단어, 끝부분] 조각으로 만들어진다.
 * 이렇게 나누는 이유는 직접 녹음한 목소리를 쓸 때, 단어 하나하나와
 * 정해진 문장 조각만 녹음하면 모든 문제에 재사용되기 때문이다.
 * (자세한 내용은 public/audio/README.md)
 *
 * ⚠️ 여기의 문장 조각을 바꾸면 scripts/list-audio.mjs 의 목록도 함께 고쳐야 한다.
 */

export type WordCategory = "body" | "food" | "animal" | "nature" | "thing" | "letter";

interface LineTemplate {
  intro: string;
  middle: (word: string) => string;
}

const TEMPLATES: Record<WordCategory, LineTemplate[]> = {
  body: [
    { intro: "나 지금 ", middle: (w) => `${subjectParticle(w)} 아파! ` },
    { intro: "내 ", middle: (w) => `${subjectParticle(w)} 어디 갔지? ` },
  ],
  food: [
    { intro: "나 배고파! ", middle: (w) => `${objectParticle(w)} 먹고 싶어. ` },
    { intro: "냠냠, ", middle: (w) => `${subjectParticle(w)} 제일 맛있어! ` },
  ],
  animal: [
    { intro: "나 ", middle: () => " 친구를 만나고 싶어! " },
    { intro: "어? 저기 ", middle: (w) => `${subjectParticle(w)} 숨었나 봐. ` },
  ],
  nature: [
    { intro: "우와, ", middle: (w) => `${subjectParticle(w)} 정말 예쁘다! ` },
    { intro: "나 ", middle: (w) => `${objectParticle(w)} 보고 싶어! ` },
  ],
  thing: [
    { intro: "나 ", middle: (w) => `${objectParticle(w)} 찾고 있어! ` },
    { intro: "어? 내 ", middle: (w) => `${subjectParticle(w)} 없어졌어. ` },
  ],
  letter: [
    { intro: "나 ", middle: (w) => `${objectParticle(w)} 배우고 있어! ` },
    { intro: "선생님이 ", middle: (w) => `${objectParticle(w)} 알려줬어. ` },
  ],
};

const outro = (word: string) => `${topicParticle(word)} 어디 있을까?`;

/** 단어별 분류. 여기 없는 단어는 "thing"으로 본다. */
const CATEGORY_WORDS: Record<Exclude<WordCategory, "thing" | "letter">, string[]> = {
  body: ["코", "손", "발", "눈", "입", "귀", "팔", "뼈", "얼굴"],
  food: [
    "밥", "빵", "떡", "밤", "귤", "알", "배", "파",
    "우유", "사과", "딸기", "포도", "수박", "당근", "감자", "양파", "오이", "호박",
    "사탕", "과자", "김밥", "라면", "피자", "치킨",
  ],
  animal: [
    "개", "새", "소", "게", "쥐", "곰", "말", "양", "닭",
    "사자", "악어", "토끼", "여우", "돼지", "오리", "나비", "개미",
  ],
  nature: ["해", "비", "별", "산", "물", "불", "꽃", "바다", "구름", "얼음", "나무"],
};

export function getWordCategory(word: string, isLetter: boolean): WordCategory {
  if (isLetter) return "letter";
  for (const [category, words] of Object.entries(CATEGORY_WORDS)) {
    if (words.includes(word)) return category as WordCategory;
  }
  return "thing";
}

/**
 * 대사 조각들을 만든다.
 * 예: "코" -> ["나 지금 ", "코", "가 아파! ", "코", "는 어디 있을까?"]
 */
export function buildDinoLineParts(word: string, category: WordCategory): string[] {
  const templates = TEMPLATES[category];
  const template = templates[Math.floor(Math.random() * templates.length)];

  return [template.intro, word, template.middle(word), word, outro(word)];
}
