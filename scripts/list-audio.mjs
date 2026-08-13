/**
 * 직접 녹음할 때 "어떤 파일 이름으로 만들어야 하는지" 목록을 뽑아준다.
 *   npm run audio:list
 * 실행하면 화면에 보여주고 public/audio/녹음목록.txt 로도 저장한다.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const audioDir = join(here, "..", "public", "audio");

/** 게임에서 쓰는 단어들은 gameData.ts 의 spoken 값에서 그대로 뽑아온다 */
const gameDataSource = readFileSync(join(here, "..", "src", "lib", "gameData.ts"), "utf8");
const words = [...new Set([...gameDataSource.matchAll(/spoken:\s*"([^"]+)"/g)].map((m) => m[1]))];

/** 문장 뒷부분과 고정 문구는 이것만 녹음하면 모든 문제에 재사용된다 */
const phrases = [
  "는 어디 있을까요",
  "은 어디 있을까요",
  "을 찾아보세요",
  "를 찾아보세요",
  "따라해보세요",
];

const AUDIO_EXTENSIONS = /\.(mp3|m4a|aac|wav|ogg|opus|webm)$/i;
const existing = new Set(
  existsSync(audioDir)
    ? readdirSync(audioDir)
        .filter((f) => AUDIO_EXTENSIONS.test(f))
        .map((f) => f.replace(/\.[^.]+$/, "").normalize("NFC"))
    : []
);

const lines = [];
const section = (title, items) => {
  lines.push(`\n## ${title} (${items.length}개)`);
  for (const item of items) {
    lines.push(`${existing.has(item.normalize("NFC")) ? "[완료]" : "[    ]"} ${item}.mp3`);
  }
};

lines.push("# 녹음할 파일 목록");
lines.push("");
lines.push("public/audio/ 폴더에 아래 이름 그대로 저장하세요.");
lines.push("일부만 녹음해도 됩니다. 없는 것은 기기 내장 목소리로 읽어줍니다.");

section("문장 뒷부분 · 고정 문구 — 이것부터 녹음하면 효과가 큽니다", phrases);
section("게임에 나오는 단어", words);

const done = [...phrases, ...words].filter((t) => existing.has(t.normalize("NFC"))).length;
lines.push("");
lines.push(`진행: ${done} / ${phrases.length + words.length}`);

const text = lines.join("\n");
console.log(text);

mkdirSync(audioDir, { recursive: true });
writeFileSync(join(audioDir, "녹음목록.txt"), `${text}\n`, "utf8");
console.log(`\n-> public/audio/녹음목록.txt 에 저장했습니다.`);
