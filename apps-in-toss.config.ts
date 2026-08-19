import { defineConfig } from "@apps-in-toss/web-framework/config";

/**
 * 앱인토스(토스 미니앱) 배포 설정.
 * appName 은 앱인토스 콘솔에 등록한 이름과 똑같아야 한다.
 */
export default defineConfig({
  appName: "hangeulnori",

  brand: {
    // 홈 화면 테마 색과 동일하게 맞췄다 (src/app/layout.tsx 의 themeColor)
    primaryColor: "#9B6BFF",
  },

  // 말하기 놀이의 음성 인식(마이크)이 토스 웹뷰 안에서도 동작하려면 필요하다.
  // 빠뜨리면 토스 앱 안에서는 마이크 권한이 막혀서 음성 인식이 안 될 수 있다.
  permissions: [{ name: "microphone", access: "access" }],

  // `npm run build:toss` 가 만드는 정적 내보내기(static export) 결과물 위치
  webBundleDir: "out",
});
