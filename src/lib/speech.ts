/**
 * 말하기 담당.
 *
 * public/audio/ 에 직접 녹음한 파일이 있으면 그 파일을 먼저 재생하고,
 * 없으면 기기 내장 목소리(TTS)로 읽어준다.
 * 순서대로 말하게 하려고 Promise를 반환한다.
 */
import { getClipUrl, playClip, prefetchClip, stopClip } from "./audioClips";
import { duckBgm } from "./bgm";
import { getSettings } from "./settings";

interface SpeakOptions {
  rate?: number;
  pitch?: number;
}

function isSpeechAvailable(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

let cachedVoice: SpeechSynthesisVoice | null = null;

/**
 * 안드로이드 크롬은 목소리 목록을 **비동기로** 불러온다. 목록이 비어 있는
 * 상태에서 말하려고 하면 아무 소리도 나지 않는 경우가 있어서, 목록이 찰
 * 때까지 잠깐 기다렸다가 말한다. (이미 차 있으면 곧바로 진행한다)
 */
let voicesChecked = false;

function waitForVoices(timeoutMs = 1500): Promise<void> {
  return new Promise((resolve) => {
    if (!isSpeechAvailable() || voicesChecked) {
      resolve();
      return;
    }
    if (window.speechSynthesis.getVoices().length > 0) {
      voicesChecked = true;
      resolve();
      return;
    }

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      // 한 번 기다려봤으면 다시는 기다리지 않는다.
      // (목소리가 아예 없는 기기에서 말할 때마다 멈칫하지 않도록)
      voicesChecked = true;
      clearTimeout(timer);
      window.speechSynthesis.removeEventListener("voiceschanged", finish);
      resolve();
    };

    const timer = setTimeout(finish, timeoutMs);
    window.speechSynthesis.addEventListener("voiceschanged", finish);
  });
}

/** 기기에 한국어 목소리가 하나라도 깔려 있는지 */
export function hasKoreanVoice(): boolean {
  if (!isSpeechAvailable()) return false;
  return window.speechSynthesis
    .getVoices()
    .some((voice) => voice.lang?.toLowerCase().startsWith("ko"));
}

/**
 * 한국어 목소리를 고른다.
 *
 * ⚠️ iOS(Safari)에서는 utterance.voice 를 직접 지정하면 아무 소리도 나지 않는
 * 경우가 있다(WebKit의 오래된 문제). iOS는 lang 만 지정하면 사용자가 설정에서
 * 고른 한국어 음성(예: 유나 프리미엄)을 시스템이 알아서 써주기 때문에,
 * iOS에서는 목소리를 지정하지 않는 편이 오히려 안전하고 결과도 좋다.
 *
 * 안드로이드 등에서는 한국어 음성이 여러 개 깔려 있을 수 있어서
 * 향상된(Enhanced/Premium) 음성을 골라주는 게 도움이 된다.
 */
function getKoreanVoice(): SpeechSynthesisVoice | null {
  if (isIOS()) return null;
  if (cachedVoice) return cachedVoice;
  if (!isSpeechAvailable()) return null;

  const voices = window.speechSynthesis.getVoices();
  const korean = voices.filter((voice) => voice.lang?.toLowerCase().startsWith("ko"));
  if (korean.length === 0) return null;

  const enhanced = korean.find((voice) => /premium|enhanced|neural|향상/i.test(voice.name));
  cachedVoice = enhanced ?? korean[0];
  return cachedVoice;
}

let primed = false;

/**
 * iOS(Safari)는 **첫 speak() 호출이 사용자의 터치 안에서** 일어나야만 이후
 * 소리를 허용한다. 질문을 잠시 뒤에 들려주는 것처럼 setTimeout 안에서 처음
 * 말하려고 하면 터치 맥락을 벗어나 아무 소리도 나지 않는다.
 *
 * 그래서 버튼을 누르는 순간(터치 핸들러 안)에 소리 없는 문장을 한 번 흘려보내
 * 음성 엔진을 미리 열어둔다. 이후의 말들은 언제 호출해도 정상 재생된다.
 */
export function primeSpeech(): void {
  if (primed || !isSpeechAvailable()) return;
  primed = true;
  try {
    const warmup = new SpeechSynthesisUtterance(" ");
    warmup.volume = 0;
    warmup.lang = "ko-KR";
    window.speechSynthesis.speak(warmup);
  } catch {
    // 실패해도 이후 재생 시도에는 영향이 없다
  }
}

let lastCancelAt = 0;

/** 재생 중이거나 대기 중인 말을 모두 취소한다 (녹음 파일 재생도 함께 멈춘다) */
export function cancelSpeech(): void {
  stopClip();
  if (!isSpeechAvailable()) return;
  lastCancelAt = Date.now();
  window.speechSynthesis.cancel();
}

/**
 * 말할 내용이 있으면 녹음 파일을, 없으면 TTS를 쓴다.
 * 말하는 동안에는 배경음악을 잠깐 줄여서 목소리가 잘 들리게 한다.
 */
export function speak(text: string, options: SpeakOptions = {}): Promise<void> {
  if (!getSettings().voice) return Promise.resolve();

  const clip = getClipUrl(text);
  return withDuckedBgm(() => (clip ? playClip(clip) : speakWithTts(text, options)));
}

/** 말하는 동안만 배경음악을 낮췄다가 되돌린다 */
async function withDuckedBgm(run: () => Promise<void>): Promise<void> {
  duckBgm(true);
  try {
    await run();
  } finally {
    duckBgm(false);
  }
}

/**
 * 여러 조각으로 이루어진 한 문장을 말한다. 좋은 순서대로 시도한다.
 *
 * 1. **문장 통째로** 된 파일이 있으면 그것 하나만 재생한다. 가장 자연스럽다.
 * 2. 없으면 조각 파일을 이어 붙인다. 다만 조각마다 앞뒤 무음이 있어서
 *    "저기. 쥐. 가 있네." 처럼 끊겨 들리므로 어디까지나 차선책이다.
 *    (조각이 하나라도 빠지면 한 문장 안에서 목소리가 섞이므로 쓰지 않는다)
 * 3. 그것도 안 되면 기기 내장 목소리로 문장 전체를 읽는다.
 */
export async function speakPhrase(parts: string[], options: SpeakOptions = {}): Promise<void> {
  if (!getSettings().voice) return;

  const whole = parts.join("");
  const wholeClip = getClipUrl(whole);
  const urls = parts.map(getClipUrl);

  await withDuckedBgm(async () => {
    if (wholeClip) {
      await playClip(wholeClip);
      return;
    }
    if (urls.every((url): url is string => url !== null)) {
      for (const url of urls) {
        await playClip(url);
      }
      return;
    }
    await speakWithTts(whole, options);
  });
}

/**
 * 곧 말할 것들을 미리 받아둔다. 말이 시작될 때의 뜸을 줄여준다.
 * (문장 통째 파일이 있으면 그것만, 없으면 조각들을 받아둔다)
 */
export function prefetchPhrase(parts: string[]): void {
  const whole = getClipUrl(parts.join(""));
  if (whole) {
    prefetchClip(whole);
    return;
  }
  for (const part of parts) prefetchClip(getClipUrl(part));
}

/** 낱말 하나를 미리 받아둔다 */
export function prefetchSpeech(text: string): void {
  prefetchClip(getClipUrl(text));
}

/** cancel() 직후에 바로 speak() 하면 씹히는 브라우저가 있어 살짝 텀을 준다 */
const POST_CANCEL_GAP_MS = 120;

/** 이 시간 안에 말이 시작되지 않으면 목소리 지정을 빼고 한 번 더 시도한다 */
const START_WATCHDOG_MS = 800;

/**
 * 한국어로 한 문장을 읽어주고, 다 읽으면 resolve 되는 Promise를 반환한다.
 *
 * 소리가 안 나는 상황을 여러 겹으로 방어한다:
 * 1) speechSynthesis 가 일시정지 상태로 굳어 있으면 이후 모든 말이 안 나오므로
 *    말하기 전에 항상 resume() 한다.
 * 2) 지정한 목소리 때문에 재생이 실패하면, 목소리 지정 없이 자동으로 재시도한다.
 * 3) onend 가 아예 오지 않는 기기가 있어서, 시간이 지나면 강제로 resolve 한다.
 */
async function speakWithTts(text: string, options: SpeakOptions = {}): Promise<void> {
  // 안드로이드는 목소리 목록이 늦게 오는데, 그 전에 말하면 소리가 안 난다
  await waitForVoices();
  return speakNowWithTts(text, options);
}

function speakNowWithTts(
  text: string,
  { rate = 0.9, pitch = 1.15 }: SpeakOptions = {}
): Promise<void> {
  return new Promise((resolve) => {
    if (!isSpeechAvailable() || !text) {
      resolve();
      return;
    }

    const synth = window.speechSynthesis;
    let settled = false;
    let started = false;
    let activeUtterance: SpeechSynthesisUtterance | null = null;

    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(watchdog);
      clearTimeout(fallbackTimer);
      resolve();
    };

    const buildUtterance = (withVoice: boolean) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ko-KR";
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = getSettings().voiceVolume;

      if (withVoice) {
        const voice = getKoreanVoice();
        if (voice) utterance.voice = voice;
      }

      utterance.onstart = () => {
        started = true;
      };
      // 재시도로 버려진 utterance 의 이벤트는 무시한다
      utterance.onend = () => {
        if (utterance === activeUtterance) finish();
      };
      utterance.onerror = () => {
        if (utterance === activeUtterance) finish();
      };

      return utterance;
    };

    const speakNow = (withVoice: boolean) => {
      if (settled) return;
      try {
        synth.resume();
      } catch {
        // 일부 브라우저는 resume 자체가 없을 수 있다
      }
      const utterance = buildUtterance(withVoice);
      activeUtterance = utterance;
      synth.speak(utterance);
    };

    // 방금 cancel() 했다면 잠깐 쉬었다가 말한다
    const sinceCancel = Date.now() - lastCancelAt;
    const startDelay = sinceCancel < POST_CANCEL_GAP_MS ? POST_CANCEL_GAP_MS - sinceCancel : 0;
    setTimeout(() => speakNow(true), startDelay);

    // 목소리 지정 탓에 소리가 안 나는 경우를 대비한 재시도
    const watchdog = setTimeout(() => {
      if (settled || started || synth.speaking) return;
      activeUtterance = null;
      try {
        synth.cancel();
      } catch {
        // ignore
      }
      setTimeout(() => speakNow(false), 80);
    }, startDelay + START_WATCHDOG_MS);

    const fallbackTimer = setTimeout(finish, startDelay + 2000 + text.length * 400);
  });
}

/** 잠깐 쉬기 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
