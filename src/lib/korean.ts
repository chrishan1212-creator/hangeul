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
