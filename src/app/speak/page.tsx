import type { Metadata } from "next";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "말하기 놀이 | 한글 놀이터",
};

/**
 * 토스 미니앱 "주요 기능" 딥링크(intoss://hangeulnori/speak)로 들어오는 진입점.
 * 말하기 놀이 화면으로 바로 시작한다. (← 홈 을 누르면 평소처럼 상태로만 돌아간다)
 */
export default function SpeakEntry() {
  return <AppShell initialView="speak" />;
}
