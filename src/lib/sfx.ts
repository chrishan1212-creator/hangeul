/**
 * 효과음. 오디오 파일 없이 Web Audio API로 직접 소리를 만들어서
 * 오프라인에서도 동작하고 로딩도 필요 없다.
 */

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const Ctor = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctor) return null;
    audioCtx = new Ctor();
  }
  return audioCtx;
}

/**
 * 모바일(특히 iOS)은 사용자가 화면을 터치한 직후에만 소리를 켤 수 있다.
 * 게임 시작 버튼을 누를 때 한 번 불러주면 이후 효과음이 정상 재생된다.
 */
let unlocked = false;

export function unlockAudio(): void {
  const ctx = getCtx();
  if (!ctx) return;

  if (ctx.state === "suspended") {
    void ctx.resume();
  }

  // iOS는 resume() 만으로는 안 열리는 경우가 있어서, 터치가 살아있는 동안
  // 소리 없는 버퍼를 한 번 재생해 확실히 깨워준다.
  if (unlocked) return;
  unlocked = true;
  try {
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
  } catch {
    // 실패해도 이후 효과음 재생에는 영향이 없다
  }
}

/** 종소리 같은 한 음 */
function chime(
  ctx: AudioContext,
  freq: number,
  startAt: number,
  duration: number,
  peak: number,
  type: OscillatorType = "sine"
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, startAt);

  // 0에서 exponentialRamp를 쓸 수 없어서 아주 작은 값에서 시작한다
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(peak, startAt + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startAt);
  osc.stop(startAt + duration + 0.05);
}

/** 정답! "딩동댕동" 하고 올라가는 팡파레 */
export function playCorrect(): void {
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") void ctx.resume();

  const now = ctx.currentTime + 0.02;
  const notes = [523.25, 659.25, 783.99, 1046.5]; // 도 미 솔 높은도

  notes.forEach((freq, i) => {
    chime(ctx, freq, now + i * 0.14, 0.5, 0.25);
  });

  // 마지막에 반짝이는 느낌으로 한 옥타브 위를 살짝 얹는다
  chime(ctx, 1567.98, now + 3 * 0.14, 0.6, 0.09, "triangle");
}

/** 공룡이 음식에 도착해서 먹을 때. 정답 팡파레보다 조금 더 길고 신나게 */
export function playFeast(): void {
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") void ctx.resume();

  const now = ctx.currentTime + 0.02;
  // 도 미 솔 도 / 솔 도 (올라갔다가 한 번 더 치솟는 느낌)
  const melody = [
    [523.25, 0.0],
    [659.25, 0.12],
    [783.99, 0.24],
    [1046.5, 0.36],
    [783.99, 0.52],
    [1046.5, 0.64],
    [1318.51, 0.78],
  ] as const;

  for (const [freq, offset] of melody) {
    chime(ctx, freq, now + offset, 0.45, 0.24);
  }
  chime(ctx, 1567.98, now + 0.78, 0.7, 0.1, "triangle");
}

/** 오답. 아이가 주눅들지 않게 부드럽고 짧게 */
export function playWrong(): void {
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") void ctx.resume();

  const now = ctx.currentTime + 0.02;
  chime(ctx, 392.0, now, 0.18, 0.14, "triangle");
  chime(ctx, 293.66, now + 0.13, 0.24, 0.12, "triangle");
}
