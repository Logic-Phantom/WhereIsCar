// 주차 기록 상태 변경(순수 함수). 저장·SDK 호출은 하지 않고 새 상태와 '지워야 할 사진 id'만 돌려준다.
import { estimateFee } from './fee';
import { elapsed } from './time';
import {
  LIMITS,
  type AppState,
  type ParkingLocation,
  type ParkingRecord,
  type RateProfile,
  type RateRule,
} from './types';

export interface RecordDraft {
  placeName: string;
  floor: string;
  zone: string;
  spot: string;
  note: string;
  startedAt: string;
  location: ParkingLocation | null;
  rate: RateRule | null;
}

export interface Change {
  state: AppState;
  /** 저장소에서 지워야 할 사진의 기록 id */
  dropPhotos: string[];
}

const clip = (s: string, max: number) => s.trim().slice(0, max);

export function sanitizeDraft(d: RecordDraft): RecordDraft {
  const loc = d.location;
  const validLoc =
    loc && Number.isFinite(loc.lat) && Number.isFinite(loc.lng) && Math.abs(loc.lat) <= 90 && Math.abs(loc.lng) <= 180
      ? { ...loc, accuracyM: loc.accuracyM != null && Number.isFinite(loc.accuracyM) && loc.accuracyM >= 0 ? Math.round(loc.accuracyM) : null }
      : null;
  return {
    placeName: clip(d.placeName, LIMITS.placeName),
    floor: clip(d.floor, LIMITS.floor),
    zone: clip(d.zone, LIMITS.zone),
    spot: clip(d.spot, LIMITS.spot),
    note: clip(d.note, LIMITS.note),
    startedAt: Number.isFinite(Date.parse(d.startedAt)) ? d.startedAt : new Date().toISOString(),
    location: validLoc,
    rate: d.rate,
  };
}

/** 새 주차 시작. 진행 중인 기록이 있으면(화면에서 먼저 확인받은 뒤) 지금 시각으로 끝내고 기록으로 옮긴다. */
export function startParking(state: AppState, draft: RecordDraft, id: string, nowIso: string): Change {
  const d = sanitizeDraft(draft);
  const record: ParkingRecord = {
    id,
    status: 'ACTIVE',
    startedAt: d.startedAt,
    endedAt: null,
    placeName: d.placeName,
    floor: d.floor,
    zone: d.zone,
    spot: d.spot,
    note: d.note,
    locationSource: d.location ? 'GPS' : 'MANUAL',
    location: d.location,
    rate: d.rate,
    actualPaidWon: null,
    hasPhoto: false,
  };
  let base: Change = { state, dropPhotos: [] };
  if (state.active) base = completeParking(state, nowIso, null);
  const next = { ...base.state, active: record };
  const withProfile = d.rate ? upsertProfile(next, d.placeName, d.rate, nowIso) : next;
  return { state: withProfile, dropPhotos: base.dropPhotos };
}

export function updateRecord(state: AppState, id: string, draft: RecordDraft): AppState {
  const d = sanitizeDraft(draft);
  const patch = (r: ParkingRecord): ParkingRecord => ({
    ...r,
    placeName: d.placeName,
    floor: d.floor,
    zone: d.zone,
    spot: d.spot,
    note: d.note,
    startedAt: d.startedAt,
    location: d.location,
    locationSource: d.location ? 'GPS' : 'MANUAL',
  });
  return mapRecord(state, id, patch);
}

/** 활성 기록을 끝내고(endedAt 고정) 완료 기록 맨 앞으로 옮긴다. */
export function completeParking(state: AppState, endedAtIso: string, actualPaidWon: number | null): Change {
  if (!state.active) return { state, dropPhotos: [] };
  const done: ParkingRecord = {
    ...state.active,
    status: 'COMPLETED',
    endedAt: endedAtIso,
    actualPaidWon: validWon(actualPaidWon),
  };
  return pushHistory({ ...state, active: null }, done);
}

export function setActualPaid(state: AppState, id: string, amount: number | null): AppState {
  return mapRecord(state, id, (r) => ({ ...r, actualPaidWon: validWon(amount) }));
}

export function setPhotoFlag(state: AppState, id: string, hasPhoto: boolean): AppState {
  return mapRecord(state, id, (r) => ({ ...r, hasPhoto }));
}

/** 기록의 요금표 스냅샷을 바꾸고, 장소 이름으로 요금표 목록에도 저장한다(다음에 불러오기). */
export function setRecordRate(state: AppState, id: string, rule: RateRule | null, nowIso: string): AppState {
  const next = mapRecord(state, id, (r) => ({ ...r, rate: rule }));
  const rec = findRecord(next, id);
  return rule && rec ? upsertProfile(next, rec.placeName, rule, nowIso) : next;
}

export function upsertProfile(state: AppState, placeName: string, rule: RateRule, nowIso: string): AppState {
  const name = placeName.trim() || '이름 없는 주차장';
  const profile: RateProfile = { name, rule, updatedAt: nowIso };
  const rest = state.rateProfiles.filter((p) => p.name !== name);
  return { ...state, rateProfiles: [profile, ...rest].slice(0, LIMITS.rateProfiles) };
}

export function deleteProfile(state: AppState, name: string): AppState {
  return { ...state, rateProfiles: state.rateProfiles.filter((p) => p.name !== name) };
}

export function deleteRecord(state: AppState, id: string): Change {
  if (state.active?.id === id) return { state: { ...state, active: null }, dropPhotos: [id] };
  return { state: { ...state, history: state.history.filter((r) => r.id !== id) }, dropPhotos: [id] };
}

export function findRecord(state: AppState, id: string): ParkingRecord | null {
  if (state.active?.id === id) return state.active;
  return state.history.find((r) => r.id === id) ?? null;
}

/** 진행 중 기록 + 완료 기록(최신순) */
export function allRecords(state: AppState): ParkingRecord[] {
  return state.active ? [state.active, ...state.history] : state.history;
}

function pushHistory(state: AppState, record: ParkingRecord): Change {
  const list = [record, ...state.history.filter((r) => r.id !== record.id)];
  const dropPhotos: string[] = [];
  // 오래된 기록 정리 + 사진은 최근 N개 기록에만 남긴다(기기 저장 공간 보호)
  const kept = list.slice(0, LIMITS.history).map((r, i) => {
    if (i >= LIMITS.photosKept && r.hasPhoto) {
      dropPhotos.push(r.id);
      return { ...r, hasPhoto: false };
    }
    return r;
  });
  for (const r of list.slice(LIMITS.history)) if (r.hasPhoto) dropPhotos.push(r.id);
  return { state: { ...state, history: kept }, dropPhotos };
}

function mapRecord(state: AppState, id: string, fn: (r: ParkingRecord) => ParkingRecord): AppState {
  if (state.active?.id === id) return { ...state, active: fn(state.active) };
  return { ...state, history: state.history.map((r) => (r.id === id ? fn(r) : r)) };
}

function validWon(n: number | null): number | null {
  return n != null && Number.isInteger(n) && n >= 0 && n <= LIMITS.won ? n : null;
}

// ── 표시용 ──────────────────────────────────────────────

/** 'B2 · A구역 · 12번' — 비어 있는 칸은 뺀다 */
export function spotSummary(r: Pick<ParkingRecord, 'floor' | 'zone' | 'spot'>): string {
  return [r.floor, r.zone, r.spot].filter(Boolean).join(' · ');
}

export function placeTitle(r: Pick<ParkingRecord, 'placeName'>): string {
  return r.placeName || '이름 없는 주차 위치';
}

// ── 검색 ────────────────────────────────────────────────

export type SearchScope = 'all' | 'place' | 'spot' | 'note';

export function searchRecords(state: AppState, query: string, scope: SearchScope): ParkingRecord[] {
  const q = query.trim().toLowerCase().replace(/\s+/g, '');
  if (!q) return [];
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, '');
  return allRecords(state).filter((r) => {
    const fields =
      scope === 'place' ? [r.placeName] : scope === 'spot' ? [r.floor, r.zone, r.spot] : scope === 'note' ? [r.note] : [r.placeName, r.floor, r.zone, r.spot, r.note];
    return fields.some((f) => norm(f).includes(q));
  });
}

export function addRecentSearch(state: AppState, query: string): AppState {
  const q = query.trim().slice(0, 30);
  if (!q) return state;
  return { ...state, recentSearches: [q, ...state.recentSearches.filter((s) => s !== q)].slice(0, LIMITS.recentSearches) };
}

// ── 통계 ────────────────────────────────────────────────

export interface Stats {
  count: number;
  totalMinutes: number;
  avgMinutes: number;
  estimatedWon: number;
  estimatedCount: number;
  actualWon: number;
  actualCount: number;
  topPlace: { name: string; count: number } | null;
}

export function computeStats(state: AppState, now: number): Stats {
  const recs = allRecords(state);
  let totalMinutes = 0;
  let estimatedWon = 0;
  let estimatedCount = 0;
  let actualWon = 0;
  let actualCount = 0;
  const places = new Map<string, number>();
  for (const r of recs) {
    const e = elapsed(r.startedAt, now, r.endedAt);
    if (!e.invalid) totalMinutes += e.totalMinutes;
    const fee = estimateFee(r.rate, e.totalMinutes);
    if (fee.status === 'OK' && !e.invalid) {
      estimatedWon += fee.amountWon;
      estimatedCount++;
    }
    if (r.actualPaidWon != null) {
      actualWon += r.actualPaidWon;
      actualCount++;
    }
    if (r.placeName) places.set(r.placeName, (places.get(r.placeName) ?? 0) + 1);
  }
  let topPlace: Stats['topPlace'] = null;
  for (const [name, count] of places) if (!topPlace || count > topPlace.count) topPlace = { name, count };
  return {
    count: recs.length,
    totalMinutes,
    avgMinutes: recs.length ? Math.round(totalMinutes / recs.length) : 0,
    estimatedWon,
    estimatedCount,
    actualWon,
    actualCount,
    topPlace,
  };
}
