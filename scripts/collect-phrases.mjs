/**
 * 앱이 말할 수 있는 모든 문장·조각을 모아준다.
 *
 * 녹음할 목록을 뽑을 때도, 음성 파일을 자동 생성할 때도 이 목록을 쓴다.
 * 실제 앱 코드(src/lib)를 그대로 불러와서 만들기 때문에, 대사를 고쳐도
 * 목록이 어긋나지 않는다.
 */
import { build } from "esbuild";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

/** 대사를 만드는 함수들을 한 덩어리로 묶어서 불러온다 */
async function loadAppLogic() {
  const dir = mkdtempSync(join(tmpdir(), "hangeul-phrases-"));
  const entry = join(dir, "entry.ts");
  const out = join(dir, "bundle.cjs");

  writeFileSync(
    entry,
    `
    export { MODE_LIST, getPool, buildPromptParts } from ${JSON.stringify(join(root, "src/lib/gameData"))};
    export { COMBO_VOWELS, ALL_VOWELS } from ${JSON.stringify(join(root, "src/lib/syllableCombos"))};
    export { ALL_ANIMALS, ALL_FOODS, buildFeastLine, buildGreetingLine } from ${JSON.stringify(join(root, "src/lib/animals"))};
    `,
    "utf8"
  );

  await build({
    entryPoints: [entry],
    bundle: true,
    outfile: out,
    platform: "node",
    format: "cjs",
    logLevel: "silent",
  });

  const require = createRequire(import.meta.url);
  const mod = require(out);
  rmSync(dir, { recursive: true, force: true });
  return mod;
}

/** 대사 조각을 여러 번 뽑아본다. 템플릿이 무작위로 골라지기 때문이다. */
const SAMPLES_PER_ITEM = 60;

export async function collectPhrases() {
  const app = await loadAppLogic();

  /** 문장 조각(끼워 맞추는 말) */
  const fragments = new Set();
  /** 낱말·글자 (아이가 따라 읽는 말) */
  const words = new Set();
  /** 통째로 말하는 긴 문장 */
  const sentences = new Set();

  const modes = [
    { mode: "syllable", batchim: false },
    { mode: "syllable", batchim: true },
    { mode: "word2", batchim: false },
    { mode: "consonant", batchim: false },
    { mode: "vowel", batchim: false },
    { mode: "combo", batchim: false },
    { mode: "build", batchim: false },
  ];

  for (const { mode, batchim } of modes) {
    const pool = app.getPool(mode, batchim, app.ALL_VOWELS);
    for (const item of pool) {
      words.add(item.spoken);
      if (item.celebrateLine) sentences.add(item.celebrateLine);

      for (let i = 0; i < SAMPLES_PER_ITEM; i++) {
        const parts = app.buildPromptParts(mode, item);

        // 질문은 **문장 통째로** 하나의 파일로 만드는 것이 가장 중요하다.
        // 조각을 이어 붙이면 조각마다 앞뒤 무음이 끼어 "저기. 쥐. 가 있네."
        // 처럼 뚝뚝 끊겨 들린다. 통문장이면 억양도 자연스럽게 이어진다.
        sentences.add(parts.join(""));

        // 조각도 남겨둔다. 통문장 파일이 없을 때(대사를 새로 추가했을 때 등)
        // 조각을 이어 붙이는 쪽으로 자연스럽게 물러나기 위해서다.
        for (const part of parts) {
          const trimmed = part.trim();
          if (!trimmed) continue;
          // 낱말은 words 로, 그 사이를 잇는 말은 fragments 로 나눈다
          if (trimmed === item.spoken) words.add(trimmed);
          else fragments.add(trimmed);
        }
      }
    }
  }

  sentences.add("따라해보세요");
  sentences.add("안녕! 나는 아기공룡이야.");
  for (const food of app.ALL_FOODS) sentences.add(app.buildFeastLine(food));
  for (const animal of app.ALL_ANIMALS) sentences.add(app.buildGreetingLine(animal));

  return {
    words: [...words].sort(),
    fragments: [...fragments].sort(),
    sentences: [...sentences].sort(),
  };
}
