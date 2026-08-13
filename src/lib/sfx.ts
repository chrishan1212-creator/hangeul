/**
 * 효과음. 오디오 파일 없이 Web Audio API로 직접 소리를 만들어서
 * 오프라인에서도 동작하고 로딩도 필요 없다.
 */
import { getAudioContext } from "./audioContext";
import { getSettings } from "./settings";

export { unlockAudio } from "./audioContext";

/** 종소리 한 음. 배음을 겹쳐서 실로폰·차임벨 같은 소리를 낸다. */
function bell(ctx: AudioContext, freq: number, startAt: number, duration: number, peak: number): void {
  // 기본음 + 배음들. 위쪽 배음일수록 작고 빨리 사라지게 해야 종처럼 들린다.
  const partials = [
    { ratio: 1, gain: 1, decay: 1 },
    { ratio: 2, gain: 0.45, decay: 0.7 },
    { ratio: 3, gain: 0.22, decay: 0.45 },
    { ratio: 4.2, gain: 0.12, decay: 0.3 },
  ];

  for (const partial of partials) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq * partial.ratio, startAt);

    const level = peak * partial.gain;
    const life = duration * partial.decay;

    // 아주 빠르게 때리고 천천히 사라지는 모양 (종을 친 느낌)
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(level, startAt + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + life);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startAt);
    osc.stop(startAt + life + 0.05);
  }
}

/** 부드러운 음 하나 (오답용) */
function softTone(
  ctx: AudioContext,
  freq: number,
  startAt: number,
  duration: number,
  peak: number
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "triangle";
  osc.frequency.setValueAtTime(freq, startAt);

  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(peak, startAt + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startAt);
  osc.stop(startAt + duration + 0.05);
}

/** 효과음을 낼 수 있는 상태면 오디오 장치를 돌려준다 */
function readyCtx(): AudioContext | null {
  if (!getSettings().sfx) return null;
  const ctx = getAudioContext();
  if (!ctx) return null;
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** 정답! "딩- 동- 댕- 동" 하고 올라가는 종소리 */
export function playCorrect(): void {
  const ctx = readyCtx();
  if (!ctx) return;

  const now = ctx.currentTime + 0.02;
  // 솔 - 도 - 미 - 솔 (딩 동 댕 동)
  const notes = [391.995, 523.25, 659.25, 783.99];

  notes.forEach((freq, i) => {
    bell(ctx, freq, now + i * 0.16, 1.1, 0.3);
  });
}

/** 공룡이 음식에 도착해서 먹을 때. 정답 소리보다 길고 신나게 */
export function playFeast(): void {
  const ctx = readyCtx();
  if (!ctx) return;

  const now = ctx.currentTime + 0.02;
  const melody: Array<[number, number]> = [
    [523.25, 0.0],
    [659.25, 0.12],
    [783.99, 0.24],
    [1046.5, 0.36],
    [783.99, 0.54],
    [1046.5, 0.66],
    [1318.51, 0.8],
  ];

  for (const [freq, offset] of melody) {
    bell(ctx, freq, now + offset, 1.2, 0.28);
  }
}

/** 오답. 아이가 주눅들지 않게 부드럽고 짧게 */
export function playWrong(): void {
  const ctx = readyCtx();
  if (!ctx) return;

  const now = ctx.currentTime + 0.02;
  softTone(ctx, 392.0, now, 0.18, 0.14);
  softTone(ctx, 293.66, now + 0.13, 0.24, 0.12);
}
