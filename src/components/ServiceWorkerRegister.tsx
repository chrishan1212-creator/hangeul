"use client";

import { useEffect } from "react";

/**
 * 서비스워커를 등록해 오프라인에서도 화면이 뜨게 한다.
 *
 * 새 버전을 배포해도 기기에 저장된 예전 화면이 계속 보이는 일이 있어서,
 * 열 때마다 새 버전이 있는지 확인하고 있으면 곧바로 받아 쓰도록 했다.
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const openedAt = Date.now();
    let reloading = false;

    // 새 서비스워커가 화면을 넘겨받으면 최신 코드로 다시 그린다.
    // 다만 한창 놀고 있는 중에 갑자기 새로고침되면 곤란하므로,
    // 막 열린 직후(5초 이내)에만 새로고침한다. 그 외에는 다음에 열 때 적용된다.
    const handleControllerChange = () => {
      if (reloading) return;
      if (Date.now() - openedAt > 5000) return;
      reloading = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          // 새 버전이 올라왔는지 확인한다
          void registration.update();
        })
        .catch(() => {
          // 등록 실패는 앱 사용에 치명적이지 않으므로 조용히 무시한다
        });
    };

    window.addEventListener("load", register);
    return () => {
      window.removeEventListener("load", register);
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
    };
  }, []);

  return null;
}
