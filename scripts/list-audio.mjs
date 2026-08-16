/**
 * 직접 녹음할 때 "어떤 파일 이름으로 만들어야 하는지" 목록을 뽑아준다.
 *   npm run audio:list
 * 화면에 보여주고 public/audio/녹음목록.txt 로도 저장한다.
 *
 * 목록은 실제 앱 코드에서 뽑아내므로(collect-phrases.mjs) 대사를 고쳐도
 * 목록이 어긋나지 않는다.
 */
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { collectPhrases } from "./collect-phrases.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const audioDir = join(here, "..", "public", "audio");

const AUDIO_EXTENSIONS = /\.(mp3|m4a|aac|wav|ogg|opus|webm)$/i;

/** src/lib/audioClips.ts 의 normalizeClipKey 와 똑같이 유지해야 한다 */
function normalizeKey(text) {
  return text
    .normalize("NFC")
    .replace(/[?!.,~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const existing = new Set(
  existsSync(audioDir)
    ? readdirSync(audioDir)
        .filter((f) => AUDIO_EXTENSIONS.test(f))
        .map((f) => normalizeKey(f.replace(/\.[^.]+$/, "")))
    : []
);

const { words, fragments, sentences } = await collectPhrases();

const lines = [];
let done = 0;
let total = 0;

const section = (title, items, note) => {
  lines.push("");
  lines.push(`## ${title} (${items.length}개)`);
  if (note) lines.push(`   ${note}`);
  for (const item of items) {
    const key = normalizeKey(item);
    const has = existing.has(key);
    if (has) done += 1;
    total += 1;
    lines.push(`${has ? "[완료]" : "[    ]"} ${key}.mp3`);
  }
};

lines.push("# 녹음할 파일 목록");
lines.push("");
lines.push("public/audio/ 폴더에 아래 이름 그대로 저장하세요.");
lines.push("일부만 녹음해도 됩니다. 없는 것은 기기 내장 목소리로 읽어줍니다.");
lines.push("");
lines.push("한 문장 안에서 목소리가 섞이지 않도록, 그 문장에 필요한 조각이");
lines.push("모두 있을 때만 녹음을 씁니다. 그래서 '문장 조각'을 먼저 녹음하면");
lines.push("효과가 가장 큽니다.");

section("① 문장 조각", fragments, "낱말 사이를 잇는 말. 모든 문제에 재사용됩니다.");
section("② 낱말·글자", words, "아이가 따라 읽는 말. 화면에 크게 뜨는 그 글자입니다.");
section("③ 통째로 말하는 문장", sentences, "칭찬·설명 문장입니다.");

lines.push("");
lines.push(`진행: ${done} / ${total}`);

const text = lines.join("\n");
console.log(text);

mkdirSync(audioDir, { recursive: true });
writeFileSync(join(audioDir, "녹음목록.txt"), `${text}\n`, "utf8");
console.log("\n-> public/audio/녹음목록.txt 에 저장했습니다.");
