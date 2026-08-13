/**
 * public/audio/ 안의 녹음 파일을 훑어서 "무슨 말 -> 어느 파일" 목록을 만든다.
 * 빌드 전에 자동으로 실행되므로(package.json 의 prebuild), 녹음 파일을 폴더에
 * 넣고 배포하기만 하면 앱이 알아서 그 파일을 재생한다.
 *
 * 맥에서 만든 한글 파일명은 자모가 분리된 형태(NFD)로 저장되는데 브라우저는
 * 합쳐진 형태(NFC)로 찾기 때문에 그냥 두면 파일을 못 찾는다.
 * 그래서 "찾을 때 쓰는 이름"은 NFC로 통일하고, "실제 주소"는 디스크에 있는
 * 이름 그대로 인코딩해서 넣는다.
 */
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const audioDir = join(here, "..", "public", "audio");
const outFile = join(here, "..", "src", "lib", "audioManifest.json");
const musicDir = join(here, "..", "public", "music");
const musicOutFile = join(here, "..", "src", "lib", "musicManifest.json");

const AUDIO_EXTENSIONS = /\.(mp3|m4a|aac|wav|ogg|opus|webm)$/i;

/** 이 함수는 src/lib/audioClips.ts 의 normalizeClipKey 와 똑같이 유지해야 한다 */
function normalizeKey(text) {
  return text
    .normalize("NFC")
    .replace(/[?!.,~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const manifest = {};

if (existsSync(audioDir)) {
  for (const file of readdirSync(audioDir)) {
    if (!AUDIO_EXTENSIONS.test(file)) continue;
    const key = normalizeKey(file.replace(/\.[^.]+$/, ""));
    if (!key) continue;
    manifest[key] = `/audio/${encodeURIComponent(file)}`;
  }
}

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

const count = Object.keys(manifest).length;
console.log(
  count === 0
    ? "녹음 파일이 없습니다. 모두 기기 내장 목소리(TTS)로 읽어줍니다."
    : `녹음 파일 ${count}개를 찾았습니다.`
);

// public/music/ 의 배경음악 파일 목록도 함께 만든다.
// 파일이 하나라도 있으면 그걸 틀고, 없으면 코드로 연주하는 음악을 쓴다.
const tracks = [];
if (existsSync(musicDir)) {
  for (const file of readdirSync(musicDir).sort()) {
    if (!AUDIO_EXTENSIONS.test(file)) continue;
    tracks.push(`/music/${encodeURIComponent(file)}`);
  }
}

writeFileSync(musicOutFile, `${JSON.stringify(tracks, null, 2)}\n`, "utf8");
console.log(
  tracks.length === 0
    ? "배경음악 파일이 없습니다. 직접 연주하는 음악을 씁니다."
    : `배경음악 파일 ${tracks.length}개를 찾았습니다.`
);
