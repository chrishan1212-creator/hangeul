/**
 * 말하기 담당.
 *
 * public/audio/ 에 직접 녹음한 파일이 있으면 그 파일을 먼저 재생하고,
 * 없으면 기기 내장 목소리(TTS)로 읽어준다.
 * 순서대로 말하게 하려고 Promise를 반환한다.
 */
import { getClipUrl, playClip, stopClip } from "./audioClips";

interface SpeakOptions {
  rate?: number;
  pitch?: number;
}

function isSpeechAvailable(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

let cachedVoice: SpeechSynthesisVoice | null = null;

/**
 * 기기에 설치된 한국어 목소리 중 가장 자연스러운 것을 고른다.
 *
 * 기기에 "향상된(Enhanced/Premium)" 한국어 음성이 설치되어 있으면 그걸 쓰고,
 * 없으면 기본 한국어 음성으로 넘어간다. 목소리 목록은 늦게 로드되는 경우가
 * 있어서 한 번 찾은 뒤에만 기억해둔다.
 */
function getKoreanVoice(): SpeechSynthesisVoice | null {
  if (cachedVoice) return cachedVoice;
  if (!isSpeechAvailable()) return null;

  const voices = window.speechSynthesis.getVoices();
  const korean = voices.filter((voice) => voice.lang?.toLowerCase().startsWith("ko"));
  if (korean.length === 0) return null;

  const enhanced = korean.find((voice) => /premium|enhanced|neural|향상/i.test(voice.name));
  cachedVoice = enhanced ?? korean[0];
  return cachedVoice;
}

/** 재생 중이거나 대기 중인 말을 모두 취소한다 (녹음 파일 재생도 함께 멈춘다) */
export function cancelSpeech(): void {
  stopClip();
  if (!isSpeechAvailable()) return;
  window.speechSynthesis.cancel();
}

/**
 * 한국어로 한 문장을 읽어주고, 다 읽으면 resolve 되는 Promise를 반환한다.
 *
 * iOS 등 일부 환경에서는 onend 이벤트가 아예 오지 않는 경우가 있어서,
 * 글자 수에 비례한 여유 시간이 지나면 강제로 resolve 한다.
 * (그래야 다음 단계가 영원히 멈추지 않는다)
 */
export function speak(text: string, options: SpeakOptions = {}): Promise<void> {
  const clip = getClipUrl(text);
  if (clip) return playClip(clip);
  return speakWithTts(text, options);
}

/**
 * 여러 조각을 이어서 말한다. 조각이 **전부** 녹음되어 있으면 녹음으로 이어 붙이고,
 * 하나라도 없으면 문장 전체를 TTS로 읽는다.
 * (녹음 목소리와 기계 목소리가 한 문장 안에서 섞이지 않게 하기 위해서다)
 */
export async function speakPhrase(parts: string[], options: SpeakOptions = {}): Promise<void> {
  const urls = parts.map(getClipUrl);

  if (urls.every((url): url is string => url !== null)) {
    for (const url of urls) {
      await playClip(url);
    }
    return;
  }

  await speakWithTts(parts.join(""), options);
}

function speakWithTts(
  text: string,
  { rate = 0.9, pitch = 1.15 }: SpeakOptions = {}
): Promise<void> {
  return new Promise((resolve) => {
    if (!isSpeechAvailable() || !text) {
      resolve();
      return;
    }

    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(fallbackTimer);
      resolve();
    };

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ko-KR";
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.onend = finish;
    utterance.onerror = finish;

    const voice = getKoreanVoice();
    if (voice) utterance.voice = voice;

    const fallbackTimer = setTimeout(finish, 1200 + text.length * 400);

    window.speechSynthesis.speak(utterance);
  });
}

/** 잠깐 쉬기 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
