"use client";

import { useState } from "react";
import HomeMenu, { PlayView } from "@/components/HomeMenu";
import SpeakPlay from "@/components/SpeakPlay";
import GamePlay from "@/components/game/GamePlay";

/**
 * 앱 전체가 이 한 화면 안에서 상태만 바꿔가며 움직인다.
 *
 * 페이지를 옮겨다니면(주소가 바뀌면) 브라우저 사정에 따라 페이지가 통째로
 * 다시 열리면서 배경음악이 끊기고 처음부터 재생될 수 있다. 그래서 화면 전환을
 * 주소 이동 없이 상태 변경으로만 처리해, 어떤 경우에도 음악이 이어지게 한다.
 */
export default function Home() {
  const [view, setView] = useState<PlayView>("home");

  if (view === "speak") {
    return <SpeakPlay onHome={() => setView("home")} />;
  }

  if (view === "game") {
    return <GamePlay onHome={() => setView("home")} />;
  }

  return <HomeMenu onSelect={setView} />;
}
