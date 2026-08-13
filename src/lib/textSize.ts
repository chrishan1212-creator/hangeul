/**
 * 글자 수에 맞춰 "화면 폭을 꽉 채우는" 글씨 크기를 계산한다.
 *
 * 한글은 글자 하나가 대략 폰트 크기(1em)만큼의 폭을 차지하므로,
 * 글자 수로 나누면 가로를 가득 채우는 크기가 나온다.
 * (한 글자면 아주 크게, 글자가 늘어날수록 자동으로 작아진다)
 *
 * vw = 화면 폭 기준, rem = 큰 화면에서 너무 커지지 않게 하는 상한선.
 */
/**
 * 한글 글자 한 개가 실제로 차지하는 가로 폭은 폰트 크기의 약 83% 정도다.
 * (Jua 폰트 기준으로 재보고 맞춘 값)
 */
const GLYPH_WIDTH_RATIO = 0.83;

interface FillOptions {
  /** 화면 좌우 여백을 뺀, 글씨가 쓸 수 있는 가로 폭 (vw 기준) */
  usableWidthVw?: number;
  /** 한 글자일 때 세로로 너무 커지지 않게 막는 상한 (vw 기준) */
  maxVw?: number;
  /** 큰 화면에서 글씨가 한없이 커지지 않도록 하는 상한선 (rem 기준) */
  maxWidthRem?: number;
  /**
   * 화면 높이 기준 상한 (dvh). 글씨가 세로로 너무 커지면 아래 버튼이
   * 화면 밖으로 밀려나므로, 화면 높이에 비해서도 커지지 않게 막는다.
   * dvh 를 쓰는 이유는 주소창이 접혔다 펴지는 모바일에서도 실제 보이는
   * 높이를 기준으로 삼기 위해서다.
   */
  maxDvh?: number;
}

export function fillWidthFontSize(
  text: string,
  { usableWidthVw = 87, maxVw = 95, maxWidthRem = 24.7, maxDvh }: FillOptions = {}
): string {
  const count = Math.max(1, [...text].length);

  const vw = clamp(usableWidthVw / GLYPH_WIDTH_RATIO / count, 7, maxVw);
  const remCap = clamp(maxWidthRem / GLYPH_WIDTH_RATIO / count, 2, maxWidthRem / GLYPH_WIDTH_RATIO);

  const limits = [`${round(vw)}vw`, `${round(remCap)}rem`];
  if (maxDvh) limits.push(`${round(maxDvh)}dvh`);

  return `min(${limits.join(", ")})`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
