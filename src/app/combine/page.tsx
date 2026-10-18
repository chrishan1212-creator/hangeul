import type { Metadata } from "next";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "소리 만들기 | 한글 놀이터",
};

/** 자음 + 모음 합치기 화면으로 바로 들어오는 진입점 (/combine) */
export default function CombineEntry() {
  return <AppShell initialView="combine" />;
}
