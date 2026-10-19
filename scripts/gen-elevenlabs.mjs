/**
 * 일레븐랩스(ElevenLabs) 목소리로 앱이 말하는 문장을 미리 만들어 저장한다.
 *
 *   ELEVENLABS_API_KEY=키 ELEVENLABS_VOICE_ID=목소리ID npm run audio:eleven -- --scope=combine
 *
 * 만들어진 mp3 는 public/audio/ 에 들어가고, 앱은 기기 음성 대신 이 파일을
 * 재생한다. (구글 TTS 로 만든 파일이 있으면 덮어쓴다)
 *
 * 범위(--scope)
 *   sample  : 맛보기 10개 (목소리를 먼저 들어볼 때, 50자 남짓)
 *   combine : 소리 만들기 화면만 (446개, 약 2,500자)
 *   all     : 앱 전체 (약 1,000개, 약 12,600자)
 *
 * 일레븐랩스로 만든 파일은 public/audio/elevenlabs.json 에 "어떤 목소리로
 * 만들었는지" 적어둔다. 다시 돌려도 같은 목소리로 이미 만든 건 건너뛰므로
 * 크레딧이 두 번 나가지 않는다. (--force 를 주면 전부 다시 만든다)
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { collectPhrases } from "./collect-phrases.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const audioDir = join(here, "..", "public", "audio");
const recordFile = join(audioDir, "elevenlabs.json");

const API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID;
/** 한국어가 자연스러운 기본 모델. 크레딧을 아끼려면 eleven_flash_v2_5 (절반) */
const MODEL = process.env.ELEVENLABS_MODEL || "eleven_multilingual_v2";
/** 말하는 속도 (0.7 ~ 1.2, 1이 보통). 아이가 따라 하기 좋게 살짝 느리게. */
const SPEED = Number(process.env.ELEVENLABS_SPEED || 0.9);
/** 높을수록 매번 비슷하게 읽는다. 낱말 카드처럼 일정한 게 좋아서 조금 높게. */
const STABILITY = Number(process.env.ELEVENLABS_STABILITY || 0.6);

const args = process.argv.slice(2);
const dryRun = args.includes("--dry");
const force = args.includes("--force");
const scope = (args.find((a) => a.startsWith("--scope=")) ?? "--scope=sample").split("=")[1];

/** 목소리를 먼저 들어보는 용도. 소리 만들기의 대표적인 말들. */
const SAMPLE = [
  "아",
  "오",
  "가",
  "나",
  "기역하고 아가 만나면 가!",
  "미음하고 오가 만나면 모!",
  "가방",
  "토마토",
  "도토리",
  "바나나",
];

/** src/lib/audioClips.ts 의 normalizeClipKey 와 똑같이 유지해야 한다 */
function normalizeKey(text) {
  return text
    .normalize("NFC")
    .replace(/[?!.,~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function pickPhrases() {
  if (scope === "sample") return SAMPLE;
  const { words, fragments, sentences, combine } = await collectPhrases();
  if (scope === "combine") return combine;
  if (scope === "all") return [...new Set([...words, ...fragments, ...sentences])];
  throw new Error(`알 수 없는 범위: ${scope} (sample / combine / all 중 하나)`);
}

function loadRecord() {
  if (!existsSync(recordFile)) return {};
  try {
    return JSON.parse(readFileSync(recordFile, "utf8"));
  } catch {
    return {};
  }
}

function saveRecord(record) {
  const sorted = Object.fromEntries(Object.entries(record).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(recordFile, `${JSON.stringify(sorted, null, 2)}\n`, "utf8");
}

/** 남은 크레딧. 키에 사용자 정보 읽기 권한이 없으면 null. */
async function remainingCredits() {
  try {
    const res = await fetch("https://api.elevenlabs.io/v1/user/subscription", {
      headers: { "xi-api-key": API_KEY },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.character_limit - data.character_count;
  } catch {
    return null;
  }
}

async function synthesize(text, attempt = 1) {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "xi-api-key": API_KEY },
      body: JSON.stringify({
        text,
        model_id: MODEL,
        voice_settings: {
          stability: STABILITY,
          similarity_boost: 0.75,
          style: 0,
          use_speaker_boost: true,
          speed: SPEED,
        },
      }),
    }
  );

  // 한꺼번에 너무 많이 보내면 잠깐 막힌다. 조금 쉬었다가 다시 보낸다.
  if ((res.status === 429 || res.status >= 500) && attempt < 5) {
    await new Promise((r) => setTimeout(r, 2000 * attempt));
    return synthesize(text, attempt + 1);
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status} ${body.slice(0, 300)}`);
  }

  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  const phrases = (await pickPhrases()).filter((p) => normalizeKey(p));
  const record = loadRecord();
  const done = (p) => VOICE_ID && record[normalizeKey(p)] === VOICE_ID;
  const todo = phrases.filter((p) => force || !done(p));
  const chars = todo.reduce((sum, p) => sum + p.length, 0);
  const creditPerChar = /flash|turbo/.test(MODEL) ? 0.5 : 1;

  console.log(`범위: ${scope} · 전체 ${phrases.length}개`);
  console.log(`새로 만들 것 ${todo.length}개 · ${chars}자 · 예상 크레딧 약 ${Math.ceil(chars * creditPerChar)}`);
  console.log(`모델 ${MODEL} · 속도 ${SPEED} · 안정감 ${STABILITY}`);

  if (dryRun) {
    console.log("\n--dry 이므로 실제로 만들지는 않습니다. 예시:");
    for (const p of todo.slice(0, 10)) console.log(`  ${normalizeKey(p)}.mp3  <- "${p}"`);
    return;
  }

  if (!API_KEY || !VOICE_ID) {
    console.error(
      "\nELEVENLABS_API_KEY 와 ELEVENLABS_VOICE_ID 가 필요합니다.\n" +
        "  키: elevenlabs.io → 왼쪽 아래 프로필 → API Keys\n" +
        "  목소리 ID: Voices 에서 목소리 옆 ··· → Copy voice ID"
    );
    process.exitCode = 1;
    return;
  }

  if (todo.length === 0) {
    console.log("이미 이 목소리로 다 만들어져 있습니다.");
    return;
  }

  const left = await remainingCredits();
  if (left !== null) {
    console.log(`남은 크레딧 ${left}`);
    if (left < chars * creditPerChar) {
      console.error("크레딧이 모자랍니다. 범위를 줄이거나 다음 달에 다시 해주세요.");
      process.exitCode = 1;
      return;
    }
  }

  mkdirSync(audioDir, { recursive: true });
  let made = 0;

  for (const phrase of todo) {
    const key = normalizeKey(phrase);
    try {
      writeFileSync(join(audioDir, `${key}.mp3`), await synthesize(phrase));
      record[key] = VOICE_ID;
      made += 1;
      process.stdout.write(`\r만드는 중… ${made} / ${todo.length}`);
    } catch (error) {
      console.error(`\n실패: "${phrase}" -> ${error.message}`);
      process.exitCode = 1;
      break;
    } finally {
      // 중간에 멈춰도 그때까지 만든 건 기록해둔다 (다음에 이어서 만든다)
      if (made % 20 === 0) saveRecord(record);
    }
  }

  saveRecord(record);
  console.log(`\n완료! ${made}개 만들었습니다.`);
}

await main();
