"use client";

import { useEffect } from "react";
import { unlockAudio } from "@/lib/audioContext";
import { prepareBgm, saveBgmPosition, startBgm, stopBgm, syncBgm } from "@/lib/bgm";
import { getSettings, loadSettings } from "@/lib/settings";

/**
 * 앱이 뜰 때 한 번만 해야 하는 일들.
 * - 저장해둔 설정 불러오기
 * - 배경음악 파일 미리 받아두기 (첫 터치에 바로 나오도록)
 * - 첫 터치에 배경음악 시작 (브라우저는 사용자가 만지기 전에는 소리를 막는다)
 * - 다른 앱으로 갔을 때 음악 멈추기
 */
export default function AppBootstrap() {
  useEffect(() => {
    loadSettings();

    // 재생하지 않고 파일만 미리 받아둔다. 터치 전에도 할 수 있다.
    if (getSettings().bgm) prepareBgm();

    // 화면을 처음 만지는 순간에야 오디오 장치를 만들 수 있다.
    // (그 전에 만들어두면 iOS에서 소리가 아예 나지 않는다)
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

    // 페이지를 떠나기 직전에 듣던 위치를 저장해둔다
    const handlePageHide = () => saveBgmPosition();
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.removeEventListener("pointerdown", handleFirstGesture);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pagehide", handlePageHide);
      stopBgm();
    };
  }, []);

  return null;
}
