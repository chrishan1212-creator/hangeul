import type { Metadata } from "next";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "자음 맞추기 | 한글 놀이터",
};

/**
 * 토스 미니앱 "주요 기능" 딥링크(intoss://hangeulnori/consonant)로 들어오는 진입점.
 * 글자 놀이의 자음 모드로 모드 고르는 화면 없이 바로 시작한다.
 */
export default function ConsonantEntry() {
  return <AppShell initialView="game" initialGameMode="consonant" />;
}
