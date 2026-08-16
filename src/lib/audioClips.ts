import manifest from "./audioManifest.json";
import { getAudioContext, isAudioUnlocked } from "./audioContext";
import { getSettings } from "./settings";

const clips: Record<string, string> = manifest;

/** scripts/gen-audio-manifest.mjs 의 normalizeKey 와 똑같이 유지해야 한다 */
export function normalizeClipKey(text: string): string {
  return text
    .normalize("NFC")
    .replace(/[?!.,~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** 이 말에 해당하는 녹음 파일이 있으면 그 주소를, 없으면 null을 준다 */
export function getClipUrl(text: string): string | null {
  return clips[normalizeClipKey(text)] ?? null;
}

export function hasClip(text: string): boolean {
  return getClipUrl(text) !== null;
}

/**
 * 재생기는 **하나만 만들어 계속 다시 쓴다.**
 *
 * 이유가 두 가지다.
 * 1) 매번 new Audio() 를 만들면 그때부터 파일을 받아오기 시작해서, 말과 말
 *    사이가 눈에 띄게 벌어진다.
 * 2) iOS는 audio.volume 지정을 무시한다(읽기 전용). 그래서 설정의 목소리
 *    크기를 실제로 반영하려면 Web Audio 의 GainNode 를 거쳐야 하는데,
 *    createMediaElementSource() 는 한 element 당 한 번만 부를 수 있다.
 */
let player: HTMLAudioElement | null = null;
let playerSource: MediaElementAudioSourceNode | null = null;
let playerGain: GainNode | null = null;
/** 재생 중인 요청을 끝맺는 함수. 새 재생이나 정지가 오면 곧바로 놓아준다. */
let finishCurrent: (() => void) | null = null;

function getPlayer(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!player) {
    player = new Audio();
    player.preload = "auto";
  }

  // 오디오 장치가 열린 뒤에 한 번만 연결한다. (열리기 전에 연결하면 무음이 된다)
  if (!playerSource && isAudioUnlocked()) {
    const ctx = getAudioContext();
    if (ctx) {
      try {
        playerSource = ctx.createMediaElementSource(player);
        playerGain = ctx.createGain();
        playerSource.connect(playerGain);
        playerGain.connect(ctx.destination);
      } catch {
        // 연결에 실패하면 element 볼륨으로 물러난다
        playerSource = null;
        playerGain = null;
      }
    }
  }

  const volume = getSettings().voiceVolume;
  if (playerGain) playerGain.gain.value = volume;
  else player.volume = volume;

  return player;
}

export function stopClip(): void {
  if (player) player.pause();
  finishCurrent?.();
}

/** 다음에 말할 파일을 미리 받아둔다. 말이 시작되는 순간을 앞당겨준다. */
export function prefetchClip(url: string | null): void {
  if (!url || typeof window === "undefined") return;
  const warm = new Audio();
  warm.preload = "auto";
  warm.src = url;
  // load() 만 걸어두면 브라우저 캐시에 남아, 실제 재생 때 곧바로 시작된다
  warm.load();
}

/** 녹음 파일을 재생하고, 다 끝나면 resolve 되는 Promise를 준다 */
export function playClip(url: string): Promise<void> {
  return new Promise((resolve) => {
    const audio = getPlayer();
    if (!audio) {
      resolve();
      return;
    }

    // 앞의 재생이 남아 있으면 기다리게 두지 말고 바로 끝맺어준다
    finishCurrent?.();

    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(safety);
      if (finishCurrent === finish) finishCurrent = null;
      resolve();
    };
    finishCurrent = finish;

    // 파일이 깨졌거나 재생이 막힌 경우에도 다음 단계로 넘어가도록 안전장치를 둔다
    const safety = setTimeout(finish, 15000);

    audio.onended = finish;
    audio.onerror = finish;

    // src 를 넣으면 처음 위치로 돌아간다 (currentTime 을 직접 만지면
    // 아직 파일 정보가 없는 시점이라 오류가 나는 브라우저가 있다)
    audio.src = url;
    void audio.play().catch(finish);
  });
}
