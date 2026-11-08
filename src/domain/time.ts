// 경과 시간은 저장한 startedAt과 현재 시각의 차이로만 계산한다(백그라운드 타이머 없음 → 앱을 닫았다 열어도 이어진다).

export interface Elapsed {
  totalMs: number;
  totalMinutes: number;
  /** 기기 시계가 시작 시각보다 앞서 있음(시계 변경 등) */
  invalid: boolean;
}

export function elapsed(startedAt: string, now: number, endedAt?: string | null): Elapsed {
  const start = Date.parse(startedAt);
  const end = endedAt ? Date.parse(endedAt) : now;
  if (!Number.isFinite(start) || !Number.isFinite(end)) return { totalMs: 0, totalMinutes: 0, invalid: true };
  const diff = end - start;
  if (diff < -60_000) return { totalMs: 0, totalMinutes: 0, invalid: true };
  const ms = Math.max(0, diff);
  return { totalMs: ms, totalMinutes: Math.floor(ms / 60_000), invalid: false };
}

const pad = (n: number) => String(n).padStart(2, '0');

/** 02:35:17 (24시간을 넘으면 시간 자리가 계속 커진다) */
export function clock(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

/** 1시간 24분 · 1일 2시간 · 12분 */
export function durationLabel(totalMinutes: number): string {
  const d = Math.floor(totalMinutes / 1440);
  const h = Math.floor((totalMinutes % 1440) / 60);
  const m = totalMinutes % 60;
  if (d > 0) return h > 0 ? `${d}일 ${h}시간` : `${d}일`;
  if (h > 0) return m > 0 ? `${h}시간 ${m}분` : `${h}시간`;
  return `${m}분`;
}

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

export function timeLabel(d: Date): string {
  const h = d.getHours();
  return `${h < 12 ? '오전' : '오후'} ${h % 12 === 0 ? 12 : h % 12}:${pad(d.getMinutes())}`;
}

/** 11. 8 (토) */
export function dateLabel(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}. ${d.getDate()} (${DAYS[d.getDay()]})`;
}

/** 11. 8 (토) 오후 3:20 */
export function dateTimeLabel(iso: string): string {
  return `${dateLabel(iso)} ${timeLabel(new Date(iso))}`;
}

/** 방금 전 · 3시간 전 · 2일 전 */
export function relativeLabel(iso: string, now: number): string {
  const diff = Math.max(0, now - Date.parse(iso));
  const min = Math.floor(diff / 60_000);
  if (min < 1) return '방금 전';
  if (min < 60) return `${min}분 전`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  if (d < 31) return `${d}일 전`;
  return dateLabel(iso);
}

/** datetime-local 입력값(YYYY-MM-DDTHH:mm, 기기 현지 시각) ↔ ISO */
export function toLocalInput(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromLocalInput(value: string): string | null {
  const t = new Date(value).getTime();
  return Number.isFinite(t) ? new Date(t).toISOString() : null;
}
