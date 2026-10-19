/**
 * 자음 + 모음 합치기 놀이용 낱말들.
 *
 * 자음을 누르면 고른 모음과 합쳐 글자가 되고(ㄱ + ㅏ = 가), 그 글자가 들어간
 * 낱말을 그림과 함께 보여준다. 낱말 안에서 그 글자는 색으로 짚어준다.
 *
 * 규칙: 낱말 안에 그 글자가 **그대로** 들어 있어야 한다. (가 → 가방 ○, 바다는 다 ○)
 * 첫 글자인 낱말을 먼저 적는다. 쉬운 낱말이 없는 글자(뎌, 쵸 …)는 비워둔다.
 */

import { composeSyllable, consonantName, subjectParticle, vowelName } from "./korean";

export interface SyllableWord {
  word: string;
  emoji: string;
  /** 낱말 아래 작게 붙이는 설명 (없어도 된다) */
  hint?: string;
}

/** 놀이에 쓰는 자음 14개 (된소리는 뺀다) */
export const PLAY_CONSONANTS = [
  "ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ",
  "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
];

/** 놀이에 쓰는 기본 모음 10개 */
export const PLAY_VOWELS = ["ㅏ", "ㅑ", "ㅓ", "ㅕ", "ㅗ", "ㅛ", "ㅜ", "ㅠ", "ㅡ", "ㅣ"];

const WORDS: Record<string, SyllableWord[]> = {
  // ㅏ
  가: [
    { word: "가방", emoji: "🎒" },
    { word: "가위", emoji: "✂️" },
    { word: "가지", emoji: "🍆" },
    { word: "가게", emoji: "🏪" },
  ],
  나: [
    { word: "나비", emoji: "🦋" },
    { word: "나무", emoji: "🌳" },
    { word: "나팔", emoji: "🎺" },
    { word: "바나나", emoji: "🍌" },
  ],
  다: [
    { word: "다람쥐", emoji: "🐿️" },
    { word: "다리", emoji: "🌉" },
    { word: "바다", emoji: "🌊" },
    { word: "사다리", emoji: "🪜" },
  ],
  라: [
    { word: "라면", emoji: "🍜" },
    { word: "라디오", emoji: "📻" },
    { word: "고릴라", emoji: "🦍" },
    { word: "코알라", emoji: "🐨" },
  ],
  마: [
    { word: "마늘", emoji: "🧄" },
    { word: "마스크", emoji: "😷" },
    { word: "하마", emoji: "🦛" },
    { word: "고구마", emoji: "🍠" },
  ],
  바: [
    { word: "바나나", emoji: "🍌" },
    { word: "바다", emoji: "🌊" },
    { word: "바지", emoji: "👖" },
    { word: "바퀴", emoji: "🛞" },
  ],
  사: [
    { word: "사과", emoji: "🍎" },
    { word: "사자", emoji: "🦁" },
    { word: "사탕", emoji: "🍬" },
    { word: "사슴", emoji: "🦌" },
  ],
  아: [
    { word: "아기", emoji: "👶" },
    { word: "아빠", emoji: "👨" },
    { word: "아이스크림", emoji: "🍦" },
    { word: "피아노", emoji: "🎹" },
  ],
  자: [
    { word: "자전거", emoji: "🚲" },
    { word: "자동차", emoji: "🚗" },
    { word: "모자", emoji: "🧢" },
    { word: "피자", emoji: "🍕" },
  ],
  차: [
    { word: "차", emoji: "🍵", hint: "따뜻하게 마셔요" },
    { word: "기차", emoji: "🚂" },
    { word: "자동차", emoji: "🚗" },
    { word: "소방차", emoji: "🚒" },
  ],
  카: [
    { word: "카메라", emoji: "📷" },
    { word: "카드", emoji: "💳" },
    { word: "스카프", emoji: "🧣" },
  ],
  타: [
    { word: "타코", emoji: "🌮" },
    { word: "타이어", emoji: "🛞" },
    { word: "기타", emoji: "🎸" },
  ],
  파: [
    { word: "파인애플", emoji: "🍍" },
    { word: "파도", emoji: "🌊" },
    { word: "파티", emoji: "🎉" },
    { word: "파랑", emoji: "💙" },
  ],
  하: [
    { word: "하마", emoji: "🦛" },
    { word: "하트", emoji: "❤️" },
    { word: "하늘", emoji: "🌤️" },
    { word: "하품", emoji: "🥱" },
  ],

  // ㅑ
  갸: [{ word: "갸우뚱", emoji: "🤔", hint: "고개를 갸웃해요" }],
  냐: [{ word: "냐옹", emoji: "🐱", hint: "고양이 소리" }],
  샤: [
    { word: "샤워", emoji: "🚿" },
    { word: "샤프", emoji: "✏️" },
  ],
  야: [
    { word: "야구", emoji: "⚾" },
    { word: "야자수", emoji: "🌴" },
    { word: "야옹", emoji: "🐱", hint: "고양이 소리" },
    { word: "이야기", emoji: "📖" },
  ],

  // ㅓ
  거: [
    { word: "거북이", emoji: "🐢" },
    { word: "거미", emoji: "🕷️" },
    { word: "거울", emoji: "🪞" },
  ],
  너: [{ word: "너구리", emoji: "🦝" }],
  더: [
    { word: "더하기", emoji: "➕" },
    { word: "더워요", emoji: "🥵" },
  ],
  머: [
    { word: "머리", emoji: "💇" },
    { word: "머핀", emoji: "🧁" },
  ],
  버: [
    { word: "버스", emoji: "🚌" },
    { word: "버섯", emoji: "🍄" },
    { word: "버터", emoji: "🧈" },
  ],
  서: [
    { word: "서커스", emoji: "🎪" },
    { word: "서랍", emoji: "🗄️" },
  ],
  어: [
    { word: "어린이", emoji: "🧒" },
    { word: "악어", emoji: "🐊" },
    { word: "오징어", emoji: "🦑" },
    { word: "타이어", emoji: "🛞" },
  ],
  저: [
    { word: "저금통", emoji: "🐷" },
    { word: "저울", emoji: "⚖️" },
  ],
  커: [
    { word: "커피", emoji: "☕" },
    { word: "서커스", emoji: "🎪" },
  ],
  터: [
    { word: "터널", emoji: "🚇" },
    { word: "버터", emoji: "🧈" },
  ],
  퍼: [{ word: "퍼즐", emoji: "🧩" }],
  허: [{ word: "허리", emoji: "🧍" }],

  // ㅕ
  겨: [{ word: "겨울", emoji: "⛄" }],
  녀: [{ word: "소녀", emoji: "👧" }],
  벼: [{ word: "벼", emoji: "🌾", hint: "쌀이 열려요" }],
  셔: [{ word: "티셔츠", emoji: "👕" }],
  여: [
    { word: "여우", emoji: "🦊" },
    { word: "여름", emoji: "🌞" },
    { word: "여권", emoji: "🛂" },
  ],
  혀: [{ word: "혀", emoji: "👅" }],

  // ㅗ
  고: [
    { word: "고구마", emoji: "🍠" },
    { word: "고양이", emoji: "🐱" },
    { word: "고래", emoji: "🐋" },
    { word: "고추", emoji: "🌶️" },
  ],
  노: [
    { word: "노래", emoji: "🎵" },
    { word: "노랑", emoji: "💛" },
    { word: "피아노", emoji: "🎹" },
  ],
  도: [
    { word: "도넛", emoji: "🍩" },
    { word: "도토리", emoji: "🌰" },
    { word: "도마뱀", emoji: "🦎" },
    { word: "포도", emoji: "🍇" },
  ],
  로: [
    { word: "로봇", emoji: "🤖" },
    { word: "로켓", emoji: "🚀" },
    { word: "브로콜리", emoji: "🥦" },
  ],
  모: [
    { word: "모자", emoji: "🧢" },
    { word: "모기", emoji: "🦟" },
    { word: "모래", emoji: "🏖️" },
  ],
  보: [
    { word: "보석", emoji: "💎" },
    { word: "보라", emoji: "💜" },
  ],
  소: [
    { word: "소", emoji: "🐄" },
    { word: "소방차", emoji: "🚒" },
    { word: "소금", emoji: "🧂" },
  ],
  오: [
    { word: "오리", emoji: "🦆" },
    { word: "오이", emoji: "🥒" },
    { word: "오징어", emoji: "🦑" },
    { word: "오렌지", emoji: "🍊" },
  ],
  조: [{ word: "조개", emoji: "🐚" }],
  초: [
    { word: "초콜릿", emoji: "🍫" },
    { word: "초록", emoji: "💚" },
  ],
  코: [
    { word: "코끼리", emoji: "🐘" },
    { word: "코", emoji: "👃" },
    { word: "코알라", emoji: "🐨" },
    { word: "타코", emoji: "🌮" },
  ],
  토: [
    { word: "토끼", emoji: "🐰" },
    { word: "토마토", emoji: "🍅" },
    { word: "도토리", emoji: "🌰" },
  ],
  포: [
    { word: "포도", emoji: "🍇" },
    { word: "포크", emoji: "🍴" },
  ],
  호: [
    { word: "호랑이", emoji: "🐯" },
    { word: "호박", emoji: "🎃" },
    { word: "호두", emoji: "🌰" },
  ],

  // ㅛ
  교: [{ word: "학교", emoji: "🏫" }],
  쇼: [{ word: "쇼핑", emoji: "🛍️" }],
  요: [
    { word: "요리", emoji: "🍳" },
    { word: "요요", emoji: "🪀" },
  ],
  표: [{ word: "표범", emoji: "🐆" }],

  // ㅜ
  구: [
    { word: "구름", emoji: "☁️" },
    { word: "구두", emoji: "👞" },
    { word: "야구", emoji: "⚾" },
  ],
  누: [
    { word: "누나", emoji: "👧" },
    { word: "비누", emoji: "🧼" },
  ],
  두: [
    { word: "호두", emoji: "🌰" },
    { word: "구두", emoji: "👞" },
  ],
  무: [
    { word: "무지개", emoji: "🌈" },
    { word: "무당벌레", emoji: "🐞" },
    { word: "나무", emoji: "🌳" },
  ],
  부: [
    { word: "부엉이", emoji: "🦉" },
    { word: "부채", emoji: "🪭" },
  ],
  수: [
    { word: "수박", emoji: "🍉" },
    { word: "수영", emoji: "🏊" },
    { word: "야자수", emoji: "🌴" },
  ],
  우: [
    { word: "우유", emoji: "🥛" },
    { word: "우산", emoji: "☂️" },
    { word: "우주", emoji: "🌌" },
    { word: "여우", emoji: "🦊" },
  ],
  주: [
    { word: "주스", emoji: "🧃" },
    { word: "주사", emoji: "💉" },
    { word: "우주", emoji: "🌌" },
  ],
  루: [{ word: "루돌프", emoji: "🦌" }],
  추: [{ word: "고추", emoji: "🌶️" }],
  쿠: [{ word: "쿠키", emoji: "🍪" }],
  투: [{ word: "투수", emoji: "⚾" }],
  푸: [{ word: "푸딩", emoji: "🍮" }],

  // ㅠ
  뉴: [{ word: "뉴스", emoji: "📰" }],
  슈: [{ word: "슈퍼맨", emoji: "🦸" }],
  유: [
    { word: "유령", emoji: "👻" },
    { word: "유치원", emoji: "🏫" },
    { word: "우유", emoji: "🥛" },
  ],
  튜: [{ word: "튜브", emoji: "🛟" }],
  휴: [
    { word: "휴지", emoji: "🧻" },
    { word: "휴대폰", emoji: "📱" },
  ],

  // ㅡ
  그: [{ word: "그림", emoji: "🖼️" }],
  드: [
    { word: "드럼", emoji: "🥁" },
    { word: "카드", emoji: "💳" },
  ],
  브: [
    { word: "브로콜리", emoji: "🥦" },
    { word: "튜브", emoji: "🛟" },
  ],
  스: [
    { word: "스키", emoji: "⛷️" },
    { word: "스케이트", emoji: "⛸️" },
    { word: "버스", emoji: "🚌" },
    { word: "주스", emoji: "🧃" },
  ],
  즈: [
    { word: "치즈", emoji: "🧀" },
  ],
  츠: [{ word: "티셔츠", emoji: "👕" }],
  크: [
    { word: "크레파스", emoji: "🖍️" },
    { word: "크리스마스", emoji: "🎄" },
    { word: "포크", emoji: "🍴" },
  ],
  트: [
    { word: "트럭", emoji: "🚚" },
    { word: "트럼펫", emoji: "🎺" },
    { word: "하트", emoji: "❤️" },
  ],
  프: [{ word: "스카프", emoji: "🧣" }],

  // ㅣ
  기: [
    { word: "기차", emoji: "🚂" },
    { word: "기린", emoji: "🦒" },
    { word: "아기", emoji: "👶" },
    { word: "비행기", emoji: "✈️" },
  ],
  디: [{ word: "라디오", emoji: "📻" }],
  리: [
    { word: "리본", emoji: "🎀" },
    { word: "오리", emoji: "🦆" },
    { word: "다리", emoji: "🌉" },
    { word: "머리", emoji: "💇" },
  ],
  미: [
    { word: "미끄럼틀", emoji: "🛝" },
    { word: "개미", emoji: "🐜" },
    { word: "거미", emoji: "🕷️" },
  ],
  비: [
    { word: "비행기", emoji: "✈️" },
    { word: "비누", emoji: "🧼" },
    { word: "비", emoji: "🌧️" },
    { word: "나비", emoji: "🦋" },
  ],
  시: [{ word: "시계", emoji: "⏰" }],
  이: [
    { word: "이빨", emoji: "🦷" },
    { word: "오이", emoji: "🥒" },
    { word: "고양이", emoji: "🐱" },
    { word: "거북이", emoji: "🐢" },
  ],
  지: [
    { word: "지도", emoji: "🗺️" },
    { word: "지렁이", emoji: "🪱" },
    { word: "바지", emoji: "👖" },
    { word: "가지", emoji: "🍆" },
  ],
  치: [
    { word: "치즈", emoji: "🧀" },
    { word: "치킨", emoji: "🍗" },
  ],
  키: [
    { word: "키위", emoji: "🥝" },
    { word: "쿠키", emoji: "🍪" },
    { word: "스키", emoji: "⛷️" },
  ],
  티: [
    { word: "티셔츠", emoji: "👕" },
    { word: "파티", emoji: "🎉" },
  ],
  피: [
    { word: "피자", emoji: "🍕" },
    { word: "피아노", emoji: "🎹" },
    { word: "커피", emoji: "☕" },
  ],
};

/** 이 글자가 들어간 낱말들 (없으면 빈 배열) */
export function getSyllableWords(syllable: string): SyllableWord[] {
  return WORDS[syllable] ?? [];
}

/** 낱말을 그 글자 앞 · 그 글자 · 뒤로 나눈다. 글자만 색칠할 때 쓴다. */
export function splitAroundSyllable(word: string, syllable: string): [string, string, string] {
  const at = word.indexOf(syllable);
  if (at < 0) return [word, "", ""];
  return [word.slice(0, at), syllable, word.slice(at + syllable.length)];
}

/** 자음을 눌렀을 때 읽어주는 말: "기역하고 아가 만나면 가!" */
export function buildCombineLine(consonant: string, vowel: string): string {
  const vName = vowelName(vowel);
  return `${consonantName(consonant)}하고 ${vName}${subjectParticle(vName)} 만나면 ${composeSyllable(consonant, vowel)}!`;
}

/**
 * 소리 만들기 화면이 말할 수 있는 모든 말.
 * 음성 파일을 미리 만들 때(scripts/collect-phrases.mjs) 쓴다.
 */
export function collectCombinePhrases(): string[] {
  const phrases = new Set<string>();
  for (const v of PLAY_VOWELS) {
    phrases.add(vowelName(v));
    for (const c of PLAY_CONSONANTS) {
      const syllable = composeSyllable(c, v);
      phrases.add(buildCombineLine(c, v));
      phrases.add(syllable);
      for (const item of getSyllableWords(syllable)) phrases.add(item.word);
    }
  }
  return [...phrases];
}
