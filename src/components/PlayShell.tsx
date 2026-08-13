import FloatingBackground from "./FloatingBackground";

interface PlayShellProps {
  children: React.ReactNode;
}

/** 모든 화면이 공유하는 밝은 그라데이션 배경 + 떠다니는 이모지 장식 */
export default function PlayShell({ children }: PlayShellProps) {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-between overflow-hidden bg-gradient-to-br from-candy-purple via-candy-pink to-candy-orange bg-[length:200%_200%] animate-gradient-move px-4 py-6 sm:py-10">
      <FloatingBackground />
      {children}
    </main>
  );
}
