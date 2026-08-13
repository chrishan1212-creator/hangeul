"use client";

import { useEffect } from "react";
import { unlockAudio } from "@/lib/audioContext";
import { startBgm, stopBgm, syncBgm } from "@/lib/bgm";
import { getSettings, loadSettings } from "@/lib/settings";

/**
 * 앱이 뜰 때 한 번만 해야 하는 일들.
 * - 저장해둔 설정 불러오기
 * - 첫 터치에 배경음악 시작 (브라우저는 사용자가 만지기 전에는 소리를 막는다)
 * - 다른 앱으로 갔을 때 음악 멈추기
 */
export default function AppBootstrap() {
  useEffect(() => {
    loadSettings();

    const handleFirstGesture = () => {
      unlockAudio();
      if (getSettings().bgm) startBgm();
    };
    window.addEventListener("pointerdown", handleFirstGesture, { once: true });

    const handleVisibility = () => {
      if (document.hidden) {
        stopBgm();
      } else if (getSettings().bgm) {
        syncBgm();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("pointerdown", handleFirstGesture);
      document.removeEventListener("visibilitychange", handleVisibility);
      stopBgm();
    };
  }, []);

  return null;
}
