// 직접 그린 벡터 일러스트(시안의 도시·차·핀 장면). 외부 이미지 에셋 없음.

function Car({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="62" cy="57" rx="56" ry="5" fill="#C7D5EA" opacity="0.8" />
      <path d="M8 42Q8 34 16 32L30 29 42 17Q46 13 54 13H78Q86 13 92 19L103 29 111 31Q117 33 117 41V47Q117 49 115 49H10Q8 49 8 47Z" fill="#fff" stroke="#C9D4E3" strokeWidth="2" />
      <path d="M45 19Q47 17 51 17H63V29H36Z" fill="#6E9DF2" />
      <path d="M67 17H78Q84 17 88 21L96 29H67Z" fill="#6E9DF2" />
      <path d="M8 40h8" stroke="#F6C64A" strokeWidth="3" strokeLinecap="round" />
      <path d="M110 38h6" stroke="#F28B82" strokeWidth="3" strokeLinecap="round" />
      <circle cx="33" cy="49" r="9" fill="#2A3344" />
      <circle cx="33" cy="49" r="4" fill="#C9D4E3" />
      <circle cx="94" cy="49" r="9" fill="#2A3344" />
      <circle cx="94" cy="49" r="4" fill="#C9D4E3" />
    </g>
  );
}

function Tree({ x, y, s = 1, tone = 0 }: { x: number; y: number; s?: number; tone?: number }) {
  const c = ['#8FCF7E', '#74C06A', '#A6DA8F'][tone % 3];
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-2" y="0" width="4" height="22" rx="2" fill="#A2805E" />
      <ellipse cx="0" cy="-6" rx="13" ry="16" fill={c} />
    </g>
  );
}

function Pin({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="0" cy="40" rx="10" ry="3" fill="#B9C9E3" />
      <path d="M0 39C-7 29-20 20-20 4A20 20 0 1 1 20 4C20 20 7 29 0 39Z" fill="#3182F6" />
      <circle cx="0" cy="3" r="8" fill="#fff" />
    </g>
  );
}

function Building({ x, w, h, base, c }: { x: number; w: number; h: number; base: number; c: string }) {
  const rows = Math.floor((h - 10) / 12);
  return (
    <g>
      <rect x={x} y={base - h} width={w} height={h} rx="3" fill={c} />
      {Array.from({ length: rows }).map((_, i) => (
        <g key={i}>
          <rect x={x + 5} y={base - h + 7 + i * 12} width={w / 2 - 8} height="5" rx="1.5" fill="#fff" opacity="0.7" />
          <rect x={x + w / 2 + 3} y={base - h + 7 + i * 12} width={w / 2 - 8} height="5" rx="1.5" fill="#fff" opacity="0.7" />
        </g>
      ))}
    </g>
  );
}

/** 홈 상단: 언덕 위 차 + 핀 + 나무·건물 */
export function HomeScene() {
  return (
    <svg viewBox="0 0 220 120" width="100%" height="100%" aria-hidden="true">
      <Building x={150} w={26} h={62} base={92} c="#DCE8FA" />
      <Building x={178} w={22} h={44} base={92} c="#E7EFFC" />
      <Building x={18} w={22} h={40} base={92} c="#E7EFFC" />
      <path d="M0 96Q60 76 120 86T220 84V120H0Z" fill="#DDF0D6" />
      <path d="M0 104Q80 92 150 100T220 98V120H0Z" fill="#C9E8BE" />
      <Tree x={32} y={78} s={0.9} tone={1} />
      <Tree x={196} y={80} s={0.8} tone={0} />
      <Tree x={208} y={84} s={0.6} tone={2} />
      <Car x={52} y={52} s={0.95} />
      <Pin x={168} y={20} s={0.9} />
    </svg>
  );
}

/** 시작 화면 하단: 도시 + 차 */
export function IntroScene() {
  return (
    <svg viewBox="0 0 320 170" width="100%" height="100%" aria-hidden="true" preserveAspectRatio="xMidYMax meet">
      <Building x={14} w={30} h={70} base={128} c="#DCE8FA" />
      <Building x={46} w={24} h={48} base={128} c="#E7EFFC" />
      <Building x={226} w={30} h={90} base={128} c="#DCE8FA" />
      <Building x={258} w={28} h={60} base={128} c="#E7EFFC" />
      <Building x={288} w={24} h={76} base={128} c="#D3E2F8" />
      <path d="M0 130Q90 104 170 118T320 112V170H0Z" fill="#DDF0D6" />
      <path d="M0 146Q110 128 200 140T320 136V170H0Z" fill="#C9E8BE" />
      <Tree x={36} y={112} s={1.1} tone={1} />
      <Tree x={60} y={118} s={0.8} tone={2} />
      <Tree x={272} y={114} s={1.1} tone={0} />
      <Tree x={296} y={120} s={0.8} tone={1} />
      <Car x={104} y={92} s={1.05} />
    </svg>
  );
}

/** 사진이 없는 기록의 썸네일 자리: 주차장 느낌의 그림 */
export function NoPhotoArt() {
  return (
    <svg viewBox="0 0 120 80" width="100%" height="100%" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <rect width="120" height="80" fill="#E9F0FB" />
      <path d="M0 52H120" stroke="#fff" strokeWidth="3" />
      <path d="M20 52V80M50 52V80M80 52V80M110 52V80" stroke="#fff" strokeWidth="2" />
      <rect x="10" y="10" width="10" height="42" fill="#DCE6F6" />
      <rect x="100" y="10" width="10" height="42" fill="#DCE6F6" />
      <Car x={30} y={26} s={0.5} />
    </svg>
  );
}
