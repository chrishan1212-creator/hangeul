/** 효과음과 배경음악이 함께 쓰는 오디오 장치 하나를 관리한다. */

let audioCtx: AudioContext | null = null;
let unlocked = false;

export function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const Ctor = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctor) return null;
    audioCtx = new Ctor();
  }
  return audioCtx;
}

export function isAudioUnlocked(): boolean {
  return unlocked;
}

/**
 * 모바일(특히 iOS)은 사용자가 화면을 만진 직후에만 소리를 켤 수 있다.
 * 버튼을 누르는 순간 이 함수를 부르면 이후 소리가 정상적으로 난다.
 */
export function unlockAudio(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === "suspended") {
    void ctx.resume();
  }

  if (unlocked) return;
  unlocked = true;

  // resume() 만으로 안 열리는 기기가 있어서, 터치가 살아있는 동안
  // 소리 없는 버퍼를 한 번 재생해 확실히 깨워준다.
  try {
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
  } catch {
    // 실패해도 이후 재생에는 영향이 없다
  }
}
