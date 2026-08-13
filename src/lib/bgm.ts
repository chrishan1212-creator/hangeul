/**
 * 잔잔한 배경 음악.
 *
 * 음악 파일을 받아오지 않고 Web Audio API로 직접 연주한다.
 * 그래서 로딩이 없고 오프라인에서도 나오며 용량도 차지하지 않는다.
 * 아이가 오래 들어도 피곤하지 않도록 아주 작은 소리로, 5음 음계(펜타토닉)의
 * 부드러운 음만 써서 어떤 음이 겹쳐도 불협화음이 나지 않게 했다.
 */
import { getAudioContext } from "./audioContext";
import { getSettings } from "./settings";

const TEMPO_BPM = 80;
const BEAT_SECONDS = 60 / TEMPO_BPM;

/** 도레미솔라도 (C장조 펜타토닉) */
const SCALE = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];

/** 한 마디 4박, 네 마디짜리 멜로디. -1은 쉼표 */
const MELODY = [0, 2, 4, 2, 4, 5, 4, 2, 1, 2, 4, 5, 4, 2, 0, -1];

/** 마디마다 아래에 깔리는 낮은 음 (도 → 솔 → 라 → 파) */
const BASS = [130.81, 98.0, 110.0, 87.31];

/** 전체 음량을 여기서 한 번 더 줄인다. 배경음은 확실히 작아야 한다. */
const BASE_VOLUME = 0.1;

/** 말하는 동안 배경음을 이만큼으로 낮춘다 */
const DUCK_RATIO = 0.25;

let master: GainNode | null = null;
let schedulerTimer: number | null = null;
let nextNoteTime = 0;
let stepIndex = 0;
let running = false;
let duckDepth = 0;

function targetVolume(): number {
  const settings = getSettings();
  if (!settings.bgm) return 0;
  const ducked = duckDepth > 0 ? DUCK_RATIO : 1;
  return settings.bgmVolume * BASE_VOLUME * ducked;
}

function applyVolume(): void {
  const ctx = getAudioContext();
  if (!ctx || !master) return;
  // 뚝 끊기지 않고 부드럽게 바뀌도록
  master.gain.setTargetAtTime(targetVolume(), ctx.currentTime, 0.15);
}

function playTone(
  ctx: AudioContext,
  freq: number,
  startAt: number,
  duration: number,
  peak: number,
  type: OscillatorType
): void {
  if (!master) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, startAt);

  // 천천히 커졌다가 천천히 사라지게 (부드러운 느낌)
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(peak, startAt + duration * 0.25);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  osc.connect(gain);
  gain.connect(master);
  osc.start(startAt);
  osc.stop(startAt + duration + 0.05);
}

function scheduleStep(step: number, time: number): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const note = MELODY[step];
  if (note >= 0) {
    playTone(ctx, SCALE[note], time, BEAT_SECONDS * 1.6, 0.32, "sine");
  }

  // 마디가 바뀔 때마다 낮은 음을 길게 깔아준다
  if (step % 4 === 0) {
    const bar = Math.floor(step / 4) % BASS.length;
    playTone(ctx, BASS[bar], time, BEAT_SECONDS * 4, 0.18, "triangle");
    playTone(ctx, BASS[bar] * 1.5, time, BEAT_SECONDS * 4, 0.1, "triangle");
  }
}

function scheduler(): void {
  const ctx = getAudioContext();
  if (!ctx || !running) return;

  // 조금 앞서서 미리 예약해둬야 소리가 끊기지 않는다
  while (nextNoteTime < ctx.currentTime + 0.3) {
    scheduleStep(stepIndex % MELODY.length, nextNoteTime);
    nextNoteTime += BEAT_SECONDS;
    stepIndex += 1;
  }
}

export function startBgm(): void {
  const ctx = getAudioContext();
  if (!ctx || running) return;
  if (!getSettings().bgm) return;

  if (ctx.state === "suspended") void ctx.resume();

  if (!master) {
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
  }

  running = true;
  nextNoteTime = ctx.currentTime + 0.15;
  stepIndex = 0;
  applyVolume();

  scheduler();
  schedulerTimer = window.setInterval(scheduler, 60);
}

export function stopBgm(): void {
  running = false;
  if (schedulerTimer !== null) {
    window.clearInterval(schedulerTimer);
    schedulerTimer = null;
  }
  applyVolume();
}

/** 설정이 바뀌었을 때 배경음악을 켜거나 끄거나 음량을 맞춘다 */
export function syncBgm(): void {
  const settings = getSettings();
  if (settings.bgm && !running) {
    startBgm();
    return;
  }
  if (!settings.bgm && running) {
    stopBgm();
    return;
  }
  applyVolume();
}

/** 말하는 동안 배경음을 잠시 줄인다 (여러 번 겹쳐 불려도 괜찮다) */
export function duckBgm(on: boolean): void {
  duckDepth = on ? duckDepth + 1 : Math.max(0, duckDepth - 1);
  applyVolume();
}

export function isBgmRunning(): boolean {
  return running;
}
