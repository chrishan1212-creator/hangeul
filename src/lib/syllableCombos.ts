import { splitSyllable, subjectParticle, topicParticle } from "./korean";

/**
 * 가나다 놀이용 글자들.
 *
 * "마늘 할 때 마는 어디 있을까?" 처럼 아는 낱말을 실마리로 삼아
 * 자음과 모음이 만나 한 글자가 되는 걸 배우는 놀이다.
 *
 * 자음·모음은 글자에서 자동으로 뽑아내므로(splitSyllable),
 * 여기에는 글자와 예시 낱말, 그림만 적어두면 된다.
 *
 * 규칙: 예시 낱말의 **첫 글자가 그 글자와 똑같아야** 한다.
 * (예: 마 → 마늘 ○ / 마 → 함마 ✕)
 */

export interface ComboEntry {
  syllable: string;
  word: string;
  emoji: string;
}

/** 모음별로 묶어두면 "ㅏ 줄만 놀기" 처럼 골라서 할 수 있다 */
export const COMBOS_BY_VOWEL: Record<string, ComboEntry[]> = {
  ㅏ: [
    { syllable: "가", word: "가방", emoji: "🎒" },
    { syllable: "나", word: "나비", emoji: "🦋" },
    { syllable: "다", word: "다람쥐", emoji: "🐿️" },
    { syllable: "라", word: "라면", emoji: "🍜" },
    { syllable: "마", word: "마늘", emoji: "🧄" },
    { syllable: "바", word: "바나나", emoji: "🍌" },
    { syllable: "사", word: "사과", emoji: "🍎" },
    { syllable: "아", word: "아기", emoji: "👶" },
    { syllable: "자", word: "자전거", emoji: "🚲" },
    { syllable: "카", word: "카메라", emoji: "📷" },
    { syllable: "파", word: "파인애플", emoji: "🍍" },
    { syllable: "하", word: "하마", emoji: "🦛" },
  ],
  ㅗ: [
    { syllable: "고", word: "고구마", emoji: "🍠" },
    { syllable: "노", word: "노래", emoji: "🎵" },
    { syllable: "도", word: "도넛", emoji: "🍩" },
    { syllable: "로", word: "로봇", emoji: "🤖" },
    { syllable: "모", word: "모자", emoji: "🧢" },
    { syllable: "보", word: "보석", emoji: "💎" },
    { syllable: "소", word: "소방차", emoji: "🚒" },
    { syllable: "오", word: "오리", emoji: "🦆" },
    { syllable: "초", word: "초콜릿", emoji: "🍫" },
    { syllable: "코", word: "코끼리", emoji: "🐘" },
    { syllable: "토", word: "토끼", emoji: "🐰" },
    { syllable: "포", word: "포도", emoji: "🍇" },
    { syllable: "호", word: "호랑이", emoji: "🐯" },
  ],
  ㅜ: [
    { syllable: "구", word: "구름", emoji: "☁️" },
    { syllable: "무", word: "무지개", emoji: "🌈" },
    { syllable: "부", word: "부엉이", emoji: "🦉" },
    { syllable: "수", word: "수박", emoji: "🍉" },
    { syllable: "우", word: "우유", emoji: "🥛" },
    { syllable: "주", word: "주스", emoji: "🧃" },
    { syllable: "쿠", word: "쿠키", emoji: "🍪" },
    { syllable: "투", word: "투수", emoji: "⚾" },
  ],
  ㅣ: [
    { syllable: "기", word: "기차", emoji: "🚂" },
    { syllable: "리", word: "리본", emoji: "🎀" },
    { syllable: "비", word: "비행기", emoji: "✈️" },
    { syllable: "시", word: "시계", emoji: "⏰" },
    { syllable: "이", word: "이빨", emoji: "🦷" },
    { syllable: "지", word: "지도", emoji: "🗺️" },
    { syllable: "치", word: "치즈", emoji: "🧀" },
    { syllable: "키", word: "키위", emoji: "🥝" },
    { syllable: "티", word: "티셔츠", emoji: "👕" },
    { syllable: "피", word: "피자", emoji: "🍕" },
  ],
};

/** 고를 수 있는 모음들 (자료가 넉넉한 것만) */
export const COMBO_VOWELS = Object.keys(COMBOS_BY_VOWEL);

/** 모음을 고르지 않았을 때 쓰는 값 */
export const ALL_VOWELS = "전체";

export function getComboEntries(vowel: string): ComboEntry[] {
  if (vowel === ALL_VOWELS) return Object.values(COMBOS_BY_VOWEL).flat();
  return COMBOS_BY_VOWEL[vowel] ?? Object.values(COMBOS_BY_VOWEL).flat();
}

/**
 * 문제 대사: "마늘 할 때 마는 어디 있을까?"
 * 녹음한 목소리를 쓸 수 있도록 조각으로 나눠서 돌려준다.
 */
export function buildComboPromptParts(entry: ComboEntry): string[] {
  return [
    entry.word,
    " 할 때 ",
    entry.syllable,
    `${topicParticle(entry.syllable)} 어디 있을까?`,
  ];
}

/**
 * 정답 대사: "미음하고 아가 만나면 마! 마늘 할 때 마!"
 * 자음과 모음이 합쳐져 글자가 되는 걸 소리로 짚어준다.
 */
export function buildComboCelebrateLine(entry: ComboEntry): string {
  const parts = splitSyllable(entry.syllable);
  if (!parts) return entry.syllable;

  const vowelName = parts.vowelName;
  return (
    `${parts.consonantName}하고 ${vowelName}${subjectParticle(vowelName)} 만나면 ` +
    `${entry.syllable}! ${entry.word} 할 때 ${entry.syllable}!`
  );
}

/** 축하 화면에 함께 보여줄 설명: "ㅁ + ㅏ · 마늘" */
export function buildComboNote(entry: ComboEntry): string {
  const parts = splitSyllable(entry.syllable);
  if (!parts) return entry.word;
  return `${parts.consonant} + ${parts.vowel} · ${entry.word}`;
}
