import { buildDinoLineParts, getWordCategory } from "./dinoLines";

export type GameMode = "syllable" | "word2" | "consonant" | "vowel";

export interface QuizItem {
  /** 화면의 카드에 보여줄 글자 (예: "배", "ㄱ") */
  display: string;
  /** 소리로 읽어줄 말 (예: "배", "기역") */
  spoken: string;
  /** 정답 축하 화면에 함께 보여줄 이모지 (자음/모음에는 없음) */
  emoji?: string;
}

/** 한 글자 - 받침 없는 쉬운 글자들 */
const SYLLABLES_NO_BATCHIM: QuizItem[] = [
  { display: "개", spoken: "개", emoji: "🐕" },
  { display: "새", spoken: "새", emoji: "🐦" },
  { display: "배", spoken: "배", emoji: "🍐" },
  { display: "소", spoken: "소", emoji: "🐮" },
  { display: "코", spoken: "코", emoji: "👃" },
  { display: "차", spoken: "차", emoji: "🚗" },
  { display: "게", spoken: "게", emoji: "🦀" },
  { display: "키", spoken: "키", emoji: "🔑" },
  { display: "해", spoken: "해", emoji: "☀️" },
  { display: "비", spoken: "비", emoji: "🌧️" },
  { display: "쥐", spoken: "쥐", emoji: "🐭" },
  { display: "초", spoken: "초", emoji: "🕯️" },
  { display: "뼈", spoken: "뼈", emoji: "🦴" },
  { display: "파", spoken: "파", emoji: "🧅" },
];

/** 한 글자 - 받침 있는 글자들 (난이도 옵션으로 켜고 끌 수 있다) */
const SYLLABLES_BATCHIM: QuizItem[] = [
  { display: "밤", spoken: "밤", emoji: "🌰" },
  { display: "밥", spoken: "밥", emoji: "🍚" },
  { display: "손", spoken: "손", emoji: "✋" },
  { display: "발", spoken: "발", emoji: "🦶" },
  { display: "눈", spoken: "눈", emoji: "👀" },
  { display: "입", spoken: "입", emoji: "👄" },
  { display: "별", spoken: "별", emoji: "⭐" },
  { display: "산", spoken: "산", emoji: "⛰️" },
  { display: "문", spoken: "문", emoji: "🚪" },
  { display: "물", spoken: "물", emoji: "💧" },
  { display: "불", spoken: "불", emoji: "🔥" },
  { display: "공", spoken: "공", emoji: "⚽" },
  { display: "곰", spoken: "곰", emoji: "🐻" },
  { display: "말", spoken: "말", emoji: "🐴" },
  { display: "양", spoken: "양", emoji: "🐑" },
  { display: "닭", spoken: "닭", emoji: "🐔" },
  { display: "꽃", spoken: "꽃", emoji: "🌸" },
  { display: "책", spoken: "책", emoji: "📚" },
  { display: "집", spoken: "집", emoji: "🏠" },
  { display: "떡", spoken: "떡", emoji: "🍡" },
  { display: "빵", spoken: "빵", emoji: "🍞" },
  { display: "알", spoken: "알", emoji: "🥚" },
  { display: "돈", spoken: "돈", emoji: "💰" },
  { display: "팔", spoken: "팔", emoji: "💪" },
  { display: "귤", spoken: "귤", emoji: "🍊" },
  { display: "컵", spoken: "컵", emoji: "🥤" },
  { display: "옷", spoken: "옷", emoji: "👕" },
  { display: "똥", spoken: "똥", emoji: "💩" },
];

/** 두 글자 단어 */
const WORDS_TWO: QuizItem[] = [
  { display: "사자", spoken: "사자", emoji: "🦁" },
  { display: "악어", spoken: "악어", emoji: "🐊" },
  { display: "얼굴", spoken: "얼굴", emoji: "😀" },
  { display: "우유", spoken: "우유", emoji: "🥛" },
  { display: "사과", spoken: "사과", emoji: "🍎" },
  { display: "딸기", spoken: "딸기", emoji: "🍓" },
  { display: "포도", spoken: "포도", emoji: "🍇" },
  { display: "수박", spoken: "수박", emoji: "🍉" },
  { display: "토끼", spoken: "토끼", emoji: "🐰" },
  { display: "여우", spoken: "여우", emoji: "🦊" },
  { display: "돼지", spoken: "돼지", emoji: "🐷" },
  { display: "오리", spoken: "오리", emoji: "🦆" },
  { display: "나비", spoken: "나비", emoji: "🦋" },
  { display: "개미", spoken: "개미", emoji: "🐜" },
  { display: "버스", spoken: "버스", emoji: "🚌" },
  { display: "기차", spoken: "기차", emoji: "🚂" },
  { display: "당근", spoken: "당근", emoji: "🥕" },
  { display: "감자", spoken: "감자", emoji: "🥔" },
  { display: "양파", spoken: "양파", emoji: "🧅" },
  { display: "오이", spoken: "오이", emoji: "🥒" },
  { display: "호박", spoken: "호박", emoji: "🎃" },
  { display: "우산", spoken: "우산", emoji: "☂️" },
  { display: "모자", spoken: "모자", emoji: "🧢" },
  { display: "신발", spoken: "신발", emoji: "👟" },
  { display: "바지", spoken: "바지", emoji: "👖" },
  { display: "안경", spoken: "안경", emoji: "👓" },
  { display: "시계", spoken: "시계", emoji: "⏰" },
  { display: "가방", spoken: "가방", emoji: "🎒" },
  { display: "연필", spoken: "연필", emoji: "✏️" },
  { display: "의자", spoken: "의자", emoji: "🪑" },
  { display: "침대", spoken: "침대", emoji: "🛏️" },
  { display: "학교", spoken: "학교", emoji: "🏫" },
  { display: "바다", spoken: "바다", emoji: "🌊" },
  { display: "구름", spoken: "구름", emoji: "☁️" },
  { display: "사탕", spoken: "사탕", emoji: "🍬" },
  { display: "과자", spoken: "과자", emoji: "🍪" },
  { display: "김밥", spoken: "김밥", emoji: "🍙" },
  { display: "라면", spoken: "라면", emoji: "🍜" },
  { display: "피자", spoken: "피자", emoji: "🍕" },
  { display: "치킨", spoken: "치킨", emoji: "🍗" },
  { display: "얼음", spoken: "얼음", emoji: "🧊" },
  { display: "양말", spoken: "양말", emoji: "🧦" },
  { display: "장갑", spoken: "장갑", emoji: "🧤" },
  { display: "풍선", spoken: "풍선", emoji: "🎈" },
  { display: "인형", spoken: "인형", emoji: "🧸" },
  { display: "로봇", spoken: "로봇", emoji: "🤖" },
  { display: "기타", spoken: "기타", emoji: "🎸" },
  { display: "그림", spoken: "그림", emoji: "🎨" },
  { display: "종이", spoken: "종이", emoji: "📄" },
  { display: "가위", spoken: "가위", emoji: "✂️" },
  { display: "나무", spoken: "나무", emoji: "🌳" },
];

/** 자음 14개 (읽는 이름과 함께) */
const CONSONANTS: QuizItem[] = [
  { display: "ㄱ", spoken: "기역" },
  { display: "ㄴ", spoken: "니은" },
  { display: "ㄷ", spoken: "디귿" },
  { display: "ㄹ", spoken: "리을" },
  { display: "ㅁ", spoken: "미음" },
  { display: "ㅂ", spoken: "비읍" },
  { display: "ㅅ", spoken: "시옷" },
  { display: "ㅇ", spoken: "이응" },
  { display: "ㅈ", spoken: "지읒" },
  { display: "ㅊ", spoken: "치읓" },
  { display: "ㅋ", spoken: "키읔" },
  { display: "ㅌ", spoken: "티읕" },
  { display: "ㅍ", spoken: "피읖" },
  { display: "ㅎ", spoken: "히읗" },
];

/** 모음 */
const VOWELS: QuizItem[] = [
  { display: "ㅏ", spoken: "아" },
  { display: "ㅑ", spoken: "야" },
  { display: "ㅓ", spoken: "어" },
  { display: "ㅕ", spoken: "여" },
  { display: "ㅗ", spoken: "오" },
  { display: "ㅛ", spoken: "요" },
  { display: "ㅜ", spoken: "우" },
  { display: "ㅠ", spoken: "유" },
  { display: "ㅡ", spoken: "으" },
  { display: "ㅣ", spoken: "이" },
  { display: "ㅐ", spoken: "애" },
  { display: "ㅔ", spoken: "에" },
];

export interface ModeInfo {
  mode: GameMode;
  /** 모드 카드에 크게 보여줄 아이콘. 이모지 대신 한글 글자를 쓰기도 한다. */
  icon: string;
  title: string;
  sample: string;
}

export const MODE_LIST: ModeInfo[] = [
  { mode: "syllable", icon: "🍎", title: "한 글자", sample: "새 · 밤 · 손" },
  { mode: "word2", icon: "🦁", title: "두 글자", sample: "사자 · 악어" },
  { mode: "consonant", icon: "ㄱ", title: "자음", sample: "ㄱ · ㄴ · ㄷ" },
  { mode: "vowel", icon: "ㅏ", title: "모음", sample: "ㅏ · ㅑ · ㅓ" },
];

/** 모드(와 받침 옵션)에 맞는 문제 풀을 돌려준다 */
export function getPool(mode: GameMode, includeBatchim: boolean): QuizItem[] {
  switch (mode) {
    case "syllable":
      return includeBatchim
        ? [...SYLLABLES_NO_BATCHIM, ...SYLLABLES_BATCHIM]
        : SYLLABLES_NO_BATCHIM;
    case "word2":
      return WORDS_TWO;
    case "consonant":
      return CONSONANTS;
    case "vowel":
      return VOWELS;
  }
}

/** 자음·모음처럼 글자 자체를 배우는 모드인지 */
export function isLetterMode(mode: GameMode): boolean {
  return mode === "consonant" || mode === "vowel";
}

/**
 * 아기공룡이 낼 문제의 대사 조각들을 만든다.
 * 예: 코 -> ["나 지금 ", "코", "가 아파! ", "코", "는 어디 있을까?"]
 */
export function buildPromptParts(mode: GameMode, item: QuizItem): string[] {
  const category = getWordCategory(item.spoken, isLetterMode(mode));
  return buildDinoLineParts(item.spoken, category);
}

/** 질문 전체 문장 (디버깅·테스트용) */
export function buildPrompt(mode: GameMode, item: QuizItem): string {
  return buildPromptParts(mode, item).join("");
}

export interface Question {
  target: QuizItem;
  choices: QuizItem[];
  /**
   * 아기공룡 대사 조각. 문제를 만들 때 한 번만 정해서 들고 다닌다.
   * (매번 새로 만들면 '다시 듣기'를 눌렀을 때 다른 대사가 나와버린다)
   */
  lineParts: string[];
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * 문제 하나를 만든다.
 * avoidDisplay를 주면 바로 직전 정답과 같은 문제가 연속으로 나오지 않게 한다.
 */
export function makeQuestion(
  pool: QuizItem[],
  mode: GameMode,
  choiceCount: number,
  avoidDisplay?: string
): Question {
  const candidates =
    avoidDisplay && pool.length > 1
      ? pool.filter((item) => item.display !== avoidDisplay)
      : pool;

  const target = candidates[Math.floor(Math.random() * candidates.length)];
  const distractors = shuffle(pool.filter((item) => item.display !== target.display)).slice(
    0,
    Math.max(0, choiceCount - 1)
  );

  return {
    target,
    choices: shuffle([target, ...distractors]),
    lineParts: buildPromptParts(mode, target),
  };
}
