/**
 * 좋은 품질의 음성(TTS)으로 앱이 말하는 모든 문장을 미리 만들어 저장한다.
 *
 *   GOOGLE_TTS_API_KEY=xxxx npm run audio:tts
 *
 * 만들어진 mp3 는 public/audio/ 에 들어가고, 앱은 기기 음성 대신 이 파일을
 * 재생한다. 한 번 만들어두면 인터넷 없이도 같은 목소리가 나온다.
 *
 * 왜 미리 만들어두나: 앱이 말하는 문장은 정해져 있어서(643개, 10,170자)
 * 한 번만 만들면 된다. 실시간 호출이 없으니 요금도, 지연도, 서버도 필요 없다.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { collectPhrases } from "./collect-phrases.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const audioDir = join(here, "..", "public", "audio");

const API_KEY = process.env.GOOGLE_TTS_API_KEY;
/** 목소리 종류. 다른 목소리를 쓰고 싶으면 이 값만 바꾸면 된다. */
const VOICE = process.env.TTS_VOICE ?? "ko-KR-Neural2-A";
/** 말하는 속도. 아이가 따라 하기 좋게 조금 느리게. */
const SPEAKING_RATE = Number(process.env.TTS_RATE ?? 0.92);
const PITCH = Number(process.env.TTS_PITCH ?? 1.5);

const dryRun = process.argv.includes("--dry");
const force = process.argv.includes("--force");

/** src/lib/audioClips.ts 의 normalizeClipKey 와 똑같이 유지해야 한다 */
function normalizeKey(text) {
  return text
    .normalize("NFC")
    .replace(/[?!.,~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function synthesize(text) {
  const res = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: "ko-KR", name: VOICE },
        audioConfig: {
          audioEncoding: "MP3",
          speakingRate: SPEAKING_RATE,
          pitch: PITCH,
        },
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status} ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  return Buffer.from(data.audioContent, "base64");
}

async function main() {
  const { words, fragments, sentences } = await collectPhrases();
  const phrases = [...new Set([...words, ...fragments, ...sentences])];
  const totalChars = phrases.reduce((sum, p) => sum + p.length, 0);

  console.log(`만들 문장 ${phrases.length}개 (${totalChars}자)`);
  console.log(`목소리: ${VOICE} · 속도 ${SPEAKING_RATE} · 높이 ${PITCH}`);

  if (dryRun) {
    console.log("\n--dry 이므로 실제로 만들지는 않습니다. 예시 몇 개:");
    for (const p of phrases.slice(0, 8)) console.log(`  ${normalizeKey(p)}.mp3  <- "${p}"`);
    return;
  }

  if (!API_KEY) {
    console.error(
      "\nGOOGLE_TTS_API_KEY 가 없습니다.\n" +
        "  1) console.cloud.google.com 에서 Text-to-Speech API 를 켜고\n" +
        "  2) API 키를 만든 뒤\n" +
        "  3) GOOGLE_TTS_API_KEY=키 npm run audio:tts\n" +
        "\n먼저 무엇이 만들어질지 보려면: npm run audio:tts -- --dry"
    );
    process.exitCode = 1;
    return;
  }

  mkdirSync(audioDir, { recursive: true });

  let made = 0;
  let skipped = 0;

  for (const phrase of phrases) {
    const key = normalizeKey(phrase);
    if (!key) continue;

    const file = join(audioDir, `${key}.mp3`);
    if (!force && existsSync(file)) {
      skipped += 1;
      continue;
    }

    try {
      const audio = await synthesize(phrase);
      writeFileSync(file, audio);
      made += 1;
      process.stdout.write(`\r만드는 중… ${made}개  (건너뜀 ${skipped})`);
    } catch (error) {
      console.error(`\n실패: "${phrase}" -> ${error.message}`);
      process.exitCode = 1;
      return;
    }
  }

  console.log(`\n완료! 새로 만든 것 ${made}개, 이미 있던 것 ${skipped}개`);
  console.log("public/audio/ 를 커밋하고 push 하면 그 목소리로 바뀝니다.");
}

await main();
