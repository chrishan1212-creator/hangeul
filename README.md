# 🐥 한글 말하기 놀이 (Hangeul Speech Play)

아이를 위한 한글 음성 인식 학습 PWA예요. 마이크 버튼을 누르고 한글 단어를 말하면,
Web Speech API로 인식한 단어를 큰 글씨와 어울리는 이모지로 화면 중앙에 보여줍니다.
(예: "사과"라고 말하면 🍎 + **사과** 가 크게 나타나요!)

## ✨ 주요 기능

- 🎤 **자유 음성 인식** — Web Speech API(`SpeechRecognition`)로 한국어(`ko-KR`) 음성을 실시간 인식
- 🖼️ **단어 + 이모지 매칭** — 250개 이상의 한글 단어 사전(과일, 동물, 색깔, 숫자, 탈것, 감정 등)에서
  가장 잘 맞는 단어를 찾아 이모지와 함께 큰 글씨로 표시
- 🔊 **음성으로 다시 읽어주기** — 인식된 단어를 SpeechSynthesis(TTS)로 다시 들려줘요 (끄기/켜기 가능)
- 🎉 **칭찬 애니메이션** — 단어를 맞히면 색종이(컨페티) 효과와 칭찬 문구가 나타남
- 🌈 **아이 친화적 UI** — 밝은 그라데이션 배경, 큰 버튼, 둥근 글씨체(Jua), 떠다니는 이모지 장식
- 📱 **PWA** — 홈 화면에 설치 가능, 오프라인에서도 앱 화면이 뜨도록 서비스워커 캐싱 지원

## 🧱 기술 스택

- [Next.js 14](https://nextjs.org/) (App Router, TypeScript)
- [Tailwind CSS](https://tailwindcss.com/)
- 브라우저 내장 [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
  (`SpeechRecognition`, `SpeechSynthesis`) — 별도 서버/과금 없이 브라우저에서 바로 동작
- 커스텀 Service Worker 기반 PWA (오프라인 앱 셸 캐싱)

## 🚀 시작하기

```bash
npm install
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 을 열어주세요.

> ⚠️ Web Speech API의 `SpeechRecognition`은 **Chrome / Edge** 등 크로미움 계열 브라우저에서
> 가장 안정적으로 동작합니다. Firefox는 미지원일 수 있고, iOS Safari는 지원 범위가 제한적입니다.
> 마이크 사용 권한을 반드시 허용해주세요. 로컬 개발 시 `http://localhost`는 예외적으로
> 마이크 권한이 허용되지만, 배포 후에는 **HTTPS** 환경이 필요합니다 (Vercel은 기본 HTTPS 제공).

## 📦 빌드

```bash
npm run build
npm run start
```

## ☁️ Vercel 배포

1. 이 저장소를 GitHub에 push 합니다.
2. [Vercel](https://vercel.com/new) 에서 저장소를 Import 합니다.
3. Framework Preset은 자동으로 **Next.js** 로 감지됩니다. 별도 환경 변수는 필요 없습니다.
4. Deploy를 누르면 끝! HTTPS 도메인이 자동 발급되어 마이크 권한이 정상 동작합니다.

Vercel CLI로 배포하려면:

```bash
npm i -g vercel
vercel
```

## 📁 프로젝트 구조

```
src/
  app/
    layout.tsx        # 폰트, 메타데이터, PWA manifest 연결
    page.tsx           # 메인 화면 (마이크 버튼 + 단어/이모지 표시)
    globals.css
  components/
    MicButton.tsx       # 마이크 버튼 (듣는 중 애니메이션 포함)
    WordDisplay.tsx      # 큰 글씨 + 이모지 표시 영역
    RecentWords.tsx       # 최근에 맞힌 단어 칩 목록
    Confetti.tsx           # 정답 시 색종이 효과
    FloatingBackground.tsx  # 배경에 떠다니는 이모지 장식
    ServiceWorkerRegister.tsx # 서비스워커 등록
  hooks/
    useSpeechRecognition.ts # Web Speech API 래퍼 훅
  lib/
    wordEmojiMap.ts    # 한글 단어 → 이모지 사전 + 매칭 로직
public/
  manifest.json        # PWA manifest
  sw.js                # 서비스워커 (오프라인 캐싱)
  icons/                # 앱 아이콘 (any / maskable)
```

## 🈶 단어 사전에 새 단어 추가하기

`src/lib/wordEmojiMap.ts` 의 `WORD_EMOJI_MAP` 객체에 `"단어": "이모지"` 형태로
한 줄만 추가하면 바로 인식됩니다.

## 🔒 개인정보

음성은 브라우저(및 브라우저가 사용하는 음성 인식 엔진)에서 텍스트로 변환될 뿐,
이 앱 자체는 별도의 서버로 음성이나 인식 결과를 전송하거나 저장하지 않습니다.
