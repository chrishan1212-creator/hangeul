import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보처리방침 | 한글 놀이터",
  description: "한글 놀이터 개인정보처리방침",
};

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <section className="mb-6">
      <h2 className="mb-2 font-jua text-xl text-candy-purple">{title}</h2>
      <div className="space-y-2 leading-relaxed text-slate-700">{children}</div>
    </section>
  );
}

/**
 * 개인정보처리방침. 이 페이지는 정적 문서라 화면 전환 없이 렌더링되는
 * 앱 본체(page.tsx)와 달리 독립된 라우트로 둔다. /privacy 로 접근한다.
 */
export default function PrivacyPage() {
  return (
    <main className="mx-auto min-h-dvh max-w-2xl bg-white px-6 py-10 font-gaegu text-base">
      <h1 className="mb-1 font-jua text-3xl text-slate-800">🐥 한글 놀이터 개인정보처리방침</h1>
      <p className="mb-8 text-sm text-slate-400">시행일: 2026년 8월 19일</p>

      <Section title="한 줄 요약">
        <p>
          한글 놀이터는 <strong>회원가입이 없고, 어떤 개인정보도 서버로 전송하거나
          저장하지 않는</strong> 앱이에요. 진행 상황·설정 같은 정보는 전부 사용하는
          기기 안에만 저장됩니다.
        </p>
      </Section>

      <Section title="수집하는 개인정보">
        <p>없습니다. 이름, 생년월일, 연락처 등 어떤 개인정보도 입력받거나 수집하지 않습니다.</p>
        <p>
          앱을 쓰면서 생기는 정보(효과음·배경음악·읽어주기 켬/끔과 크기, 다 자란
          동물 마을 기록 등)는 브라우저의 로컬 저장소(localStorage)에만 저장되고,
          어떤 서버로도 전송되지 않습니다. 앱을 지우거나 브라우저 데이터를 지우면
          함께 사라집니다.
        </p>
      </Section>

      <Section title="음성 인식(마이크) 안내">
        <p>
          &ldquo;말하기 놀이&rdquo;에서 마이크 버튼을 누르면 브라우저에 내장된 음성 인식
          기능(Web Speech API)을 사용합니다. 이 처리는 한글 놀이터가 아니라{" "}
          <strong>사용 중인 브라우저(및 브라우저가 연결한 음성 인식 엔진, 보통 기기
          제조사나 구글)</strong>가 담당하며, 한글 놀이터는 인식된 결과(글자)만
          받아서 화면에 보여줄 뿐 음성 자체를 저장하거나 별도 서버로 보내지
          않습니다.
        </p>
        <p>
          마이크는 버튼을 누른 순간에만 사용되고, 타이핑 입력으로 마이크 없이도
          똑같이 쓸 수 있습니다.
        </p>
      </Section>

      <Section title="AI로 만든 음성 안내">
        <p>
          공룡 친구가 말하거나 단어를 읽어줄 때 나오는 목소리는{" "}
          <strong>AI 음성 합성 기술로 미리 만들어 저장해둔 음성 파일</strong>입니다.
          실시간으로 목소리를 생성하거나 사용자의 음성을 학습에 사용하지 않으며,
          미리 정해진 문장을 읽어주는 용도로만 재생됩니다.
        </p>
      </Section>

      <Section title="쿠키·광고·분석 도구">
        <p>
          방문 기록을 추적하는 분석 도구나 광고 SDK를 사용하지 않습니다. 로그인이
          없으므로 쿠키도 쓰지 않습니다.
        </p>
      </Section>

      <Section title="만 14세 미만 이용자">
        <p>
          한글 놀이터는 아이가 함께 쓰는 것을 전제로 만들어졌습니다. 위에서 설명한
          것처럼 애초에 어떤 개인정보도 수집하지 않으므로, 법정대리인의 별도 동의
          절차 없이도 안전하게 사용할 수 있습니다.
        </p>
      </Section>

      <Section title="문의">
        <p>
          이 방침이나 앱 이용에 대해 궁금한 점이 있다면 아래로 연락해 주세요.
        </p>
        <p className="font-jua text-candy-purple">[이메일 주소를 여기에 적어주세요]</p>
      </Section>

      <Section title="방침 변경">
        <p>
          이 방침이 바뀌면 이 페이지에 새 시행일과 함께 반영합니다. 별도의 알림
          없이 갱신될 수 있으니, 궁금하면 이 페이지를 다시 확인해 주세요.
        </p>
      </Section>
    </main>
  );
}
