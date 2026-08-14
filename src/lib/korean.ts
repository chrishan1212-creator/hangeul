/** 한글 조사 처리에 필요한 최소한의 도우미들 */

const HANGUL_START = 0xac00;
const HANGUL_END = 0xd7a3;

/** 마지막 글자에 받침이 있는지 확인 (예: "밤" -> true, "배" -> false) */
export function hasBatchim(word: string): boolean {
  if (!word) return false;
  const code = word.charCodeAt(word.length - 1);
  if (code < HANGUL_START || code > HANGUL_END) return false;
  return (code - HANGUL_START) % 28 !== 0;
}

/** 은/는 (예: "밤은", "배는") */
export function topicParticle(word: string): string {
  return hasBatchim(word) ? "은" : "는";
}

/** 을/를 (예: "기역을", "야를") */
export function objectParticle(word: string): string {
  return hasBatchim(word) ? "을" : "를";
}

/** 이/가 (예: "손이", "코가") */
export function subjectParticle(word: string): string {
  return hasBatchim(word) ? "이" : "가";
}

/** 한글 낱자를 조합 순서대로 늘어놓은 표 (유니코드 규칙) */
const CHOSEONG = [
  "ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ",
  "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
];

const JUNGSEONG = [
  "ㅏ", "ㅐ", "ㅑ", "ㅒ", "ㅓ", "ㅔ", "ㅕ", "ㅖ", "ㅗ", "ㅘ",
  "ㅙ", "ㅚ", "ㅛ", "ㅜ", "ㅝ", "ㅞ", "ㅟ", "ㅠ", "ㅡ", "ㅢ", "ㅣ",
];

/** 자음을 읽는 이름 (ㄱ -> 기역) */
const CONSONANT_NAMES: Record<string, string> = {
  ㄱ: "기역", ㄲ: "쌍기역", ㄴ: "니은", ㄷ: "디귿", ㄸ: "쌍디귿",
  ㄹ: "리을", ㅁ: "미음", ㅂ: "비읍", ㅃ: "쌍비읍", ㅅ: "시옷",
  ㅆ: "쌍시옷", ㅇ: "이응", ㅈ: "지읒", ㅉ: "쌍지읒", ㅊ: "치읓",
  ㅋ: "키읔", ㅌ: "티읕", ㅍ: "피읖", ㅎ: "히읗",
};

/** 모음을 읽는 소리 (ㅏ -> 아) */
const VOWEL_NAMES: Record<string, string> = {
  ㅏ: "아", ㅐ: "애", ㅑ: "야", ㅒ: "얘", ㅓ: "어", ㅔ: "에",
  ㅕ: "여", ㅖ: "예", ㅗ: "오", ㅘ: "와", ㅙ: "왜", ㅚ: "외",
  ㅛ: "요", ㅜ: "우", ㅝ: "워", ㅞ: "웨", ㅟ: "위", ㅠ: "유",
  ㅡ: "으", ㅢ: "의", ㅣ: "이",
};

export interface SyllableParts {
  /** 첫소리 자음 (예: ㅁ) */
  consonant: string;
  /** 자음을 읽는 이름 (예: 미음) */
  consonantName: string;
  /** 가운뎃소리 모음 (예: ㅏ) */
  vowel: string;
  /** 모음을 읽는 소리 (예: 아) */
  vowelName: string;
}

/**
 * 한글 한 글자를 자음과 모음으로 쪼갠다. (예: "마" -> ㅁ + ㅏ)
 * 한글 글자가 아니면 null 을 돌려준다.
 */
export function splitSyllable(syllable: string): SyllableParts | null {
  if (!syllable) return null;
  const code = syllable.charCodeAt(0);
  if (code < HANGUL_START || code > HANGUL_END) return null;

  const offset = code - HANGUL_START;
  const consonant = CHOSEONG[Math.floor(offset / 588)];
  const vowel = JUNGSEONG[Math.floor((offset % 588) / 28)];

  return {
    consonant,
    consonantName: CONSONANT_NAMES[consonant] ?? consonant,
    vowel,
    vowelName: VOWEL_NAMES[vowel] ?? vowel,
  };
}
