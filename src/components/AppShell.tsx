"use client";

import { useState } from "react";
import HomeMenu, { PlayView } from "@/components/HomeMenu";
import SpeakPlay from "@/components/SpeakPlay";
import GamePlay from "@/components/game/GamePlay";
import { GameMode } from "@/lib/gameData";

interface AppShellProps {
  /** 어떤 화면으로 시작할지. 딥링크(예: /speak, /game)로 바로 들어올 때 쓴다. */
  initialView?: PlayView;
  /** initialView가 "game"일 때, 모드 고르는 화면을 건너뛰고 바로 시작할 모드 */
  initialGameMode?: GameMode;
}

/**
 * 앱 전체가 이 한 화면 안에서 상태만 바꿔가며 움직인다.
 *
 * 페이지를 옮겨다니면(주소가 바뀌면) 브라우저 사정에 따라 페이지가 통째로
 * 다시 열리면서 배경음악이 끊기고 처음부터 재생될 수 있다. 그래서 화면 전환을
 * 주소 이동 없이 상태 변경으로만 처리해, 어떤 경우에도 음악이 이어지게 한다.
 *
 * 다만 앱을 "처음 여는 시점"에는 어느 화면에서 시작할지 골라야 할 때가 있다
 * (토스 미니앱의 "주요 기능" 딥링크처럼, 특정 화면으로 바로 들어와야 하는 경우).
 * 그건 최초 진입 한 번뿐이라 음악 끊김과 무관하므로, initialView 로 받는다.
 * /src/app/speak, /src/app/game 페이지가 이 값을 넘겨준다.
 */
export default function AppShell({ initialView = "home", initialGameMode }: AppShellProps) {
  const [view, setView] = useState<PlayView>(initialView);

  if (view === "speak") {
    return <SpeakPlay onHome={() => setView("home")} />;
  }

  if (view === "game") {
    return <GamePlay onHome={() => setView("home")} initialMode={initialGameMode} />;
  }

  return <HomeMenu onSelect={setView} />;
}
