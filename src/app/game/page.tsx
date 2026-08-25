import type { Metadata } from "next";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "글자 놀이 | 한글 놀이터",
};

/**
 * 토스 미니앱 "주요 기능" 딥링크(intoss://hangeulnori/game)로 들어오는 진입점.
 * 글자 놀이(모드 선택) 화면으로 바로 시작한다.
 */
export default function GameEntry() {
  return <AppShell initialView="game" />;
}
