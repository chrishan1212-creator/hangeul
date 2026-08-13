"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type RecognitionStatus = "idle" | "listening" | "error" | "unsupported";

interface UseSpeechRecognitionOptions {
  lang?: string;
  onResult?: (transcript: string) => void;
}

interface UseSpeechRecognitionReturn {
  status: RecognitionStatus;
  interimTranscript: string;
  errorMessage: string | null;
  isSupported: boolean;
  start: () => void;
  stop: () => void;
}

function getSpeechRecognitionCtor(): any {
  if (typeof window === "undefined") return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

/**
 * Web Speech API(SpeechRecognition)를 감싸는 훅.
 * 브라우저가 지원하지 않으면 isSupported=false 를 반환한다.
 * Chrome / Edge / 안드로이드 Chrome에서 가장 안정적으로 동작한다.
 *
 * 주의: 같은 SpeechRecognition 인스턴스를 여러 번 start()/stop()으로 재사용하면
 * 몇 번 사용한 뒤부터 인식 결과가 한 글자씩만 잘려서 나오는 브라우저 버그가 있다
 * (특히 Chrome 계열). 그래서 이 훅은 말하기 버튼을 누를 때마다 완전히 새로운
 * SpeechRecognition 인스턴스를 만들어서 사용한다.
 */
export function useSpeechRecognition({
  lang = "ko-KR",
  onResult,
}: UseSpeechRecognitionOptions = {}): UseSpeechRecognitionReturn {
  const [status, setStatus] = useState<RecognitionStatus>("idle");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef<any>(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;
  const langRef = useRef(lang);
  langRef.current = lang;

  useEffect(() => {
    const ctor = getSpeechRecognitionCtor();
    setIsSupported(!!ctor);
    if (!ctor) setStatus("unsupported");
  }, []);

  const destroyCurrent = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    recognition.onstart = null;
    recognition.onresult = null;
    recognition.onerror = null;
    recognition.onend = null;
    try {
      recognition.abort();
    } catch {
      // ignore
    }
    recognitionRef.current = null;
  }, []);

  const start = useCallback(() => {
    const ctor = getSpeechRecognitionCtor();
    if (!ctor) return;

    // 이전 세션이 남아있다면 완전히 정리하고 새로 만든다.
    destroyCurrent();

    const recognition = new ctor();
    recognition.lang = langRef.current;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setErrorMessage(null);
      setStatus("listening");
    };

    recognition.onresult = (event: any) => {
      let finalText = "";
      let interimText = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript;
        } else {
          interimText += result[0].transcript;
        }
      }

      if (interimText) {
        setInterimTranscript(interimText);
      }

      if (finalText) {
        setInterimTranscript("");
        onResultRef.current?.(finalText);
      }
    };

    recognition.onerror = (event: any) => {
      let message = "잘 못 들었어요. 다시 말해볼까요?";
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        message = "마이크 사용을 허락해주세요!";
      } else if (event.error === "no-speech") {
        message = "아무 소리도 안 들렸어요. 다시 눌러서 말해보세요!";
      } else if (event.error === "audio-capture") {
        message = "마이크를 찾을 수 없어요.";
      }
      setErrorMessage(message);
      setStatus("error");
    };

    recognition.onend = () => {
      setStatus((prev) => (prev === "listening" ? "idle" : prev));
      setInterimTranscript("");
      // 이 세션은 끝났으니 다음 start()가 새 인스턴스를 만들도록 참조를 비운다.
      if (recognitionRef.current === recognition) {
        recognitionRef.current = null;
      }
    };

    recognitionRef.current = recognition;
    setErrorMessage(null);
    try {
      recognition.start();
    } catch {
      // 아주 드물게 start() 직후 재호출 시 발생하는 레이스 컨디션 - 무시
    }
  }, [destroyCurrent]);

  const stop = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    return () => {
      destroyCurrent();
    };
  }, [destroyCurrent]);

  return { status, interimTranscript, errorMessage, isSupported, start, stop };
}
