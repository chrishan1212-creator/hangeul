import manifest from "./audioManifest.json";

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

let currentAudio: HTMLAudioElement | null = null;

export function stopClip(): void {
  if (!currentAudio) return;
  currentAudio.pause();
  currentAudio = null;
}

/** 녹음 파일을 재생하고, 다 끝나면 resolve 되는 Promise를 준다 */
export function playClip(url: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve();
      return;
    }

    stopClip();

    const audio = new Audio(url);
    currentAudio = audio;

    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(safety);
      if (currentAudio === audio) currentAudio = null;
      resolve();
    };

    // 파일이 깨졌거나 재생이 막힌 경우에도 다음 단계로 넘어가도록 안전장치를 둔다
    const safety = setTimeout(finish, 15000);

    audio.onended = finish;
    audio.onerror = finish;
    void audio.play().catch(finish);
  });
}
