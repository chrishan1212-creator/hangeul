import Link from "next/link";
import PlayShell from "@/components/PlayShell";

const MENU = [
  {
    href: "/speak",
    emoji: "🎤",
    title: "말하기 놀이",
    description: "말하면 큰 글씨와 그림으로 보여줘요",
  },
  {
    href: "/game",
    emoji: "🎮",
    title: "찾기 게임",
    description: "소리를 듣고 맞는 글자를 찾아요",
  },
];

export default function Home() {
  return (
    <PlayShell>
      <header className="relative z-10 pt-6 text-center">
        <h1 className="font-jua text-4xl text-white drop-shadow-[0_4px_0_rgba(0,0,0,0.2)] sm:text-5xl">
          🐥 한글 놀이터
        </h1>
        <p className="mt-2 font-jua text-lg text-white/90 drop-shadow sm:text-xl">
          무엇을 하고 놀까요?
        </p>
      </header>

      <section className="relative z-10 flex w-full max-w-md flex-1 flex-col justify-center gap-5 py-8">
        {MENU.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-4 rounded-3xl bg-white/95 px-6 py-6 shadow-[0_8px_0_rgba(0,0,0,0.15)] transition active:translate-y-1.5 active:shadow-[0_3px_0_rgba(0,0,0,0.15)]"
          >
            <span className="text-6xl">{item.emoji}</span>
            <span className="flex flex-col">
              <span className="font-jua text-3xl text-slate-700">{item.title}</span>
              <span className="font-jua text-sm text-slate-400">{item.description}</span>
            </span>
          </Link>
        ))}
      </section>

      <footer className="relative z-10 pb-2">
        <p className="text-center font-jua text-sm text-white/80">
          소리가 나오니 볼륨을 켜주세요 🔊
        </p>
      </footer>
    </PlayShell>
  );
}
