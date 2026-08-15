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
/**
 * iOS(Safari)는 audio 요소의 volume 을 코드로 바꾸는 걸 무시한다.
 * (볼륨은 기기의 물리 버튼으로만 조절하도록 막혀 있다)
 * 그래서 소리를 Web Audio 로 한 번 통과시키고, 그쪽 음량을 조절한다.
 * 이렇게 하면 아이폰에서도 설정의 음량 조절이 실제로 먹는다.
 */
let mediaSource: MediaElementAudioSourceNode | null = null;
let fileGain: GainNode | null = null;
let playlist: string[] = [];
let trackIndex = 0;
let positionTimer: number | null = null;

/** 페이지가 통째로 새로 열려도 듣던 위치에서 이어지도록 저장해둔다 */
const POSITION_KEY = "hangeul-bgm-position";

function savePosition(): void {
  if (!audioEl) return;
  try {
    window.sessionStorage.setItem(
      POSITION_KEY,
      JSON.stringify({ track: trackIndex, time: audioEl.currentTime })
    );
  } catch {
    // 저장이 안 돼도 재생에는 지장이 없다
  }
}

function loadPosition(): { track: number; time: number } | null {
  try {
    const raw = window.sessionStorage.getItem(POSITION_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    if (typeof saved?.time !== "number" || typeof saved?.track !== "number") return null;
    return saved;
  } catch {
    return null;
  }
}

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

/** audio 요소의 소리를 Web Audio 로 끌어와 음량을 조절할 수 있게 한다 */
function connectFileGraph(): void {
  if (mediaSource || !audioEl) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    mediaSource = ctx.createMediaElementSource(audioEl);
    fileGain = ctx.createGain();
    fileGain.gain.value = 0;
    mediaSource.connect(fileGain);
    fileGain.connect(ctx.destination);
  } catch {
    // 연결에 실패하면 예전처럼 audio 요소의 volume 을 쓴다
    mediaSource = null;
    fileGain = null;
  }
}

function applyVolume(): void {
  const settings = getSettings();
  const on = settings.bgm ? 1 : 0;
  const ctx = getAudioContext();
  const fileTarget = Math.min(1, settings.bgmVolume * FILE_BASE_VOLUME * duckMultiplier() * on);

  if (fileGain && ctx) {
    fileGain.gain.setTargetAtTime(fileTarget, ctx.currentTime, 0.15);
    if (audioEl) audioEl.volume = 1;
  } else if (audioEl) {
    audioEl.volume = fileTarget;
  }

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

/**
 * 곡을 바꿔 끼운다. **src 를 다시 지정하면 처음부터 재생되므로**
 * 정말 다른 곡으로 넘어갈 때만 부른다.
 */
function loadTrack(index: number, startAt = 0): void {
  if (!audioEl) return;
  trackIndex = index;
  audioEl.src = playlist[trackIndex];
  // 곡이 하나뿐이면 이어서 반복, 여러 곡이면 끝날 때 다음 곡으로 넘어간다
  audioEl.loop = playlist.length === 1;

  if (startAt > 0) {
    const seek = () => {
      try {
        if (audioEl) audioEl.currentTime = startAt;
      } catch {
        // 위치를 못 옮기면 그냥 처음부터 듣는다
      }
    };
    audioEl.addEventListener("loadedmetadata", seek, { once: true });
  }
}

function handleTrackEnded(): void {
  if (playlist.length <= 1) return;
  loadTrack((trackIndex + 1) % playlist.length);
  if (running) void audioEl?.play().catch(() => {});
}

/**
 * 음악 파일을 미리 준비해둔다. 재생은 하지 않으므로 터치 전에도 부를 수 있고,
 * 미리 받아두기 때문에 첫 터치에 곧바로 소리가 난다.
 */
export function prepareBgm(): void {
  if (typeof window === "undefined") return;
  if (TRACKS.length === 0 || audioEl) return;

  playlist = shuffled(TRACKS);

  audioEl = new Audio();
  audioEl.preload = "auto";
  audioEl.addEventListener("ended", handleTrackEnded);

  // 페이지가 통째로 새로 열렸어도 듣던 자리에서 이어지게 한다
  const saved = loadPosition();
  const index = saved && saved.track < playlist.length ? saved.track : 0;
  loadTrack(index, saved?.time ?? 0);

  applyVolume();
  audioEl.load();
}

function startFileBgm(): void {
  // 파일을 미리 받아두는 것은 터치 전에도 할 수 있다
  prepareBgm();
  if (!audioEl) return;

  // 재생은 사용자가 화면을 만진 뒤에만 가능하다. 그 전에 play() 를 부르면
  // 브라우저가 거부하는데, 그때 running 을 켜버리면 정작 첫 터치 때
  // "이미 재생 중"으로 보여 재시도가 무시된다.
  if (!isAudioUnlocked()) return;

  // 터치로 오디오가 열린 뒤에야 Web Audio 에 연결할 수 있다
  connectFileGraph();

  running = true;
  applyVolume();

  // src 를 다시 지정하지 않는다. 그래야 화면을 옮겨다녀도 이어서 재생된다.
  void audioEl.play().catch(() => {
    // 재생이 거부되면 다음 기회에 다시 시도할 수 있도록 표시를 되돌린다
    running = false;
  });

  if (positionTimer === null) {
    positionTimer = window.setInterval(savePosition, 2000);
  }
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
  if (positionTimer !== null) {
    window.clearInterval(positionTimer);
    positionTimer = null;
  }
  if (audioEl) {
    // pause 만 한다. 위치는 그대로 두어 다시 켤 때 이어서 재생된다.
    savePosition();
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

/** 페이지를 떠나기 직전 등에 듣던 위치를 저장한다 */
export function saveBgmPosition(): void {
  savePosition();
}
