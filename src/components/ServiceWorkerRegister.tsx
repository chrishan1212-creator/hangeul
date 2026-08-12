"use client";

import { useEffect } from "react";

/** 앱 로드 후 서비스 워커를 등록해 오프라인에서도 화면이 뜨도록 한다 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // 서비스 워커 등록 실패는 앱 사용에 치명적이지 않으므로 조용히 무시한다
      });
    };

    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
