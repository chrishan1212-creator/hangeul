/**
 * 배경 음악.
 *
 * public/music/ 에 음악 파일을 넣어두면 그 파일을 틀고,
 * 없으면 Web Audio API로 직접 잔잔한 음악을 연주한다.
 * (직접 연주하는 쪽은 파일을 받지 않아 로딩이 없고 오프라인에서도 나온다)
 */
import { getAudioContext, isAudioUnlocked } from "./audioContext";
import musicManifest from "./musicManifest.json";
import { getSettings } from "./settings";

const TRACKS: string[] = musicManifest;

/** 직접 연주할 때의 음량. 배경음은 확실히 작아야 한다. */
const SYNTH_BASE_VOLUME = 0.1;

/** 음악 파일을 틀 때의 음량. 이미 완성된 곡이라 조금 더 크게 잡는다. */
const FILE_BASE_VOLUME = 0.6;

/** 말하는 동안 배경음을 이만큼으로 낮춘다 */
const DUCK_RATIO = 0.25;

let running = false;
let duckDepth = 0;

// ── 음악 파일 재생용 ──────────────────────────────────────────────
let audioEl: HTMLAudioElement | null = null;
let playlist: string[] = [];
let trackIndex = 0;

// ── 직접 연주용 ──────────────────────────────────────────────────
const TEMPO_BPM = 80;
const BEAT_SECONDS = 60 / TEMPO_BPM;
/** 도레미솔라도 (C장조 펜타토닉) */
const SCALE = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
/** 한 마디 4박, 네 마디짜리 멜로디. -1은 쉼표 */
const MELODY = [0, 2, 4, 2, 4, 5, 4, 2, 1, 2, 4, 5, 4, 2, 0, -1];
/** 마디마다 아래에 깔리는 낮은 음 (도 → 솔 → 라 → 파) */
const BASS = [130.81, 98.0, 110.0, 87.31];

let master: GainNode | null = null;
let schedulerTimer: number | null = null;
let nextNoteTime = 0;
let stepIndex = 0;

export function hasMusicFiles(): boolean {
  return TRACKS.length > 0;
}

function duckMultiplier(): number {
  return duckDepth > 0 ? DUCK_RATIO : 1;
}

function applyVolume(): void {
  const settings = getSettings();
  const on = settings.bgm ? 1 : 0;

  if (audioEl) {
    audioEl.volume = Math.min(1, settings.bgmVolume * FILE_BASE_VOLUME * duckMultiplier() * on);
  }

  const ctx = getAudioContext();
  if (ctx && master) {
    const target = settings.bgmVolume * SYNTH_BASE_VOLUME * duckMultiplier() * on;
    // 뚝 끊기지 않고 부드럽게 바뀌도록
    master.gain.setTargetAtTime(target, ctx.currentTime, 0.15);
  }
}

// ── 음악 파일 ────────────────────────────────────────────────────

function shuffled<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function playCurrentTrack(): void {
  if (!audioEl) return;
  audioEl.src = playlist[trackIndex];
  // 곡이 하나뿐이면 이어서 반복, 여러 곡이면 끝날 때 다음 곡으로 넘어간다
  audioEl.loop = playlist.length === 1;
  applyVolume();
  void audioEl.play().catch(() => {
    // 아직 재생 권한이 없으면 조용히 넘어간다 (다음 터치 때 다시 시도된다)
  });
}

function handleTrackEnded(): void {
  if (!running || playlist.length <= 1) return;
  trackIndex = (trackIndex + 1) % playlist.length;
  playCurrentTrack();
}

function startFileBgm(): void {
  if (!isAudioUnlocked()) return;

  if (!audioEl) {
    audioEl = new Audio();
    audioEl.preload = "auto";
    audioEl.addEventListener("ended", handleTrackEnded);
  }

  if (playlist.length === 0) {
    playlist = shuffled(TRACKS);
    trackIndex = 0;
  }

  running = true;
  playCurrentTrack();
}

// ── 직접 연주 ────────────────────────────────────────────────────

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

function startSynthBgm(): void {
  // 터치 전에는 오디오 장치가 없다. 그때는 시작하지 않고 조용히 넘어가서
  // 첫 터치 때 다시 시도되도록 둔다 (running 도 켜지 않는다).
  const ctx = getAudioContext();
  if (!ctx) return;

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

// ── 바깥에서 쓰는 함수들 ─────────────────────────────────────────

export function startBgm(): void {
  if (running) return;
  if (!getSettings().bgm) return;

  if (hasMusicFiles()) {
    startFileBgm();
    return;
  }
  startSynthBgm();
}

export function stopBgm(): void {
  running = false;

  if (schedulerTimer !== null) {
    window.clearInterval(schedulerTimer);
    schedulerTimer = null;
  }
  if (audioEl) {
    audioEl.pause();
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
