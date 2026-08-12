"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type RecognitionStatus =
  | "idle"
  | "listening"
  | "processing"
  | "error"
  | "unsupported";

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

/**
 * Web Speech API(SpeechRecognition)를 감싸는 훅.
 * 브라우저가 지원하지 않으면 isSupported=false 를 반환한다.
 * Chrome / Edge / Safari(일부)에서 동작하며, Firefox는 미지원일 수 있다.
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setIsSupported(false);
      setStatus("unsupported");
      return;
    }

    setIsSupported(true);

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = lang;
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
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.onstart = null;
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      try {
        recognition.stop();
      } catch {
        // ignore
      }
    };
  }, [lang]);

  const start = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      setErrorMessage(null);
      recognitionRef.current.start();
    } catch {
      // start() throws if already started - restart cleanly
      try {
        recognitionRef.current.stop();
        recognitionRef.current.start();
      } catch {
        // ignore
      }
    }
  }, []);

  const stop = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch {
      // ignore
    }
  }, []);

  return { status, interimTranscript, errorMessage, isSupported, start, stop };
}
