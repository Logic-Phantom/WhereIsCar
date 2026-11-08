// 직접 그린 선 아이콘(24×24, 외부 아이콘 라이브러리 없음).
import type { CSSProperties } from 'react';

export type IconName =
  | 'home' | 'history' | 'gear' | 'pin' | 'camera' | 'list' | 'chart' | 'car' | 'search' | 'chevron-right'
  | 'chevron-left' | 'more' | 'info' | 'doc' | 'lock' | 'help' | 'trash' | 'won' | 'map' | 'copy' | 'edit'
  | 'clock' | 'x' | 'gps' | 'check' | 'layers' | 'grid' | 'parking' | 'receipt' | 'plus' | 'alert' | 'image';

const P: Record<IconName, string> = {
  home: 'M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5h-5v5H5a1 1 0 0 1-1-1z',
  history: 'M3.5 12a8.5 8.5 0 1 0 2.5-6M3.5 4v4h4M12 8v4.5l3 2',
  gear: 'M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4zM19.4 13.5l1.6 1.2-2 3.4-1.9-.7a7.4 7.4 0 0 1-2 1.2l-.3 2h-3.9l-.3-2a7.4 7.4 0 0 1-2-1.2l-1.9.7-2-3.4 1.6-1.2a7.6 7.6 0 0 1 0-2.4L2.7 9.9l2-3.4 1.9.7a7.4 7.4 0 0 1 2-1.2l.3-2h3.9l.3 2a7.4 7.4 0 0 1 2 1.2l1.9-.7 2 3.4-1.6 1.2a7.6 7.6 0 0 1 0 2.4z',
  pin: 'M12 21s-6.5-6.1-6.5-11.2a6.5 6.5 0 0 1 13 0C18.5 14.9 12 21 12 21zM12 12.3a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  camera: 'M4 8.5A1.5 1.5 0 0 1 5.5 7h2.2l1.5-2h5.6l1.5 2h2.2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5zM12 16a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4z',
  list: 'M6 3.5h12a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1zM8.5 8.5h7M8.5 12h7M8.5 15.5h4',
  chart: 'M5 20V12M10 20V8M15 20v-6M20 20V5',
  car: 'M5 16.5V12l1.8-4.6A2 2 0 0 1 8.7 6h6.6a2 2 0 0 1 1.9 1.4L19 12v4.5M4 12h16v4.5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zM6.5 17.5V19M17.5 17.5V19M7.5 14.5h1M15.5 14.5h1',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
  'chevron-right': 'M9.5 6l6 6-6 6',
  'chevron-left': 'M14.5 6l-6 6 6 6',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5.5M12 7.6v.01',
  doc: 'M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-10A1.5 1.5 0 0 1 6 19V5a1.5 1.5 0 0 1 1-1.5zM9 12h6M9 15.5h6M13.5 3.5V8H18',
  lock: 'M6.5 10.5h11a1 1 0 0 1 1 1V19a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-7.5a1 1 0 0 1 1-1zM8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5M12 14v2.5',
  help: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17v.01',
  trash: 'M4.5 7h15M10 7V5h4v2M6.5 7l1 12.5a1 1 0 0 0 1 .9h7a1 1 0 0 0 1-.9l1-12.5M10 11v6M14 11v6',
  won: 'M4 8h16M4 12.5h16M6 5l3 13 3-10 3 10 3-13',
  map: 'M9 4.5 3.5 6.5v13l5.5-2 6 2 5.5-2v-13l-5.5 2zM9 4.5v13M15 6.5v13',
  copy: 'M9 9h10a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1zM5 15H4.5a.5.5 0 0 1-.5-.5V5a1 1 0 0 1 1-1h9.5a.5.5 0 0 1 .5.5V5',
  edit: 'M14.5 5.5l4 4M4 20l1-4.5L15.5 5a1.4 1.4 0 0 1 2 0l1.5 1.5a1.4 1.4 0 0 1 0 2L8.5 19z',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7.5V12l3 2',
  x: 'M6 6l12 12M18 6 6 18',
  gps: 'M12 19a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM12 2v3M12 19v3M2 12h3M19 12h3',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  layers: 'M12 4 3 8.5l9 4.5 9-4.5zM3 12.5l9 4.5 9-4.5M3 16.5 12 21l9-4.5',
  grid: 'M4.5 4.5h6v6h-6zM13.5 4.5h6v6h-6zM4.5 13.5h6v6h-6zM13.5 13.5h6v6h-6z',
  parking: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM10 16.5v-9h2.8a2.6 2.6 0 0 1 0 5.2H10',
  receipt: 'M6 3.5h12V21l-2.2-1.4L13.5 21 12 19.6 10.5 21l-2.3-1.4L6 21zM9 8h6M9 11.5h6M9 15h3',
  plus: 'M12 5v14M5 12h14',
  alert: 'M12 4 2.8 19.5h18.4zM12 10v4.5M12 17v.01',
  image: 'M4.5 5h15a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM3.5 16l5-5 4 4 2.5-2.5 5.5 5M15.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
};

export function Icon({ name, size = 22, stroke = 2, color, style, fill }: { name: IconName; size?: number; stroke?: number; color?: string; style?: CSSProperties; fill?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0, color, ...style }}>
      <path d={P[name]} fill={fill ?? 'none'} stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
