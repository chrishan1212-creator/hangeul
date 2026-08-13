/** SpeechSynthesis(TTS) 래퍼. 순서대로 말하게 하려고 Promise를 반환한다. */

interface SpeakOptions {
  rate?: number;
  pitch?: number;
}

function isSpeechAvailable(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** 재생 중이거나 대기 중인 말을 모두 취소한다 */
export function cancelSpeech(): void {
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
export function speak(text: string, { rate = 0.9, pitch = 1.15 }: SpeakOptions = {}): Promise<void> {
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

    const fallbackTimer = setTimeout(finish, 1200 + text.length * 400);

    window.speechSynthesis.speak(utterance);
  });
}

/** 잠깐 쉬기 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
