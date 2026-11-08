// 앱 상태 JSON과 사진을 저장소에 읽고 쓴다. 이 앱이 만든 키(whereiscar.*)만 건드린다.
import { LIMITS, SCHEMA_VERSION, emptyState, type AppState, type ParkingRecord, type RateRule } from '../domain/types';
import type { KeyValueStore } from './kv';

export const KEYS = {
  state: 'whereiscar.state.v1',
  photo: (id: string) => `whereiscar.photo.${id}`,
} as const;

export interface LoadResult {
  state: AppState;
  /** 저장된 값이 손상돼 읽지 못함(빈 상태로 시작) */
  corrupted: boolean;
}

export async function loadState(kv: KeyValueStore): Promise<LoadResult> {
  const raw = await kv.get(KEYS.state);
  if (!raw) return { state: emptyState(), corrupted: false };
  try {
    return { state: normalizeState(JSON.parse(raw)), corrupted: false };
  } catch {
    return { state: emptyState(), corrupted: true };
  }
}

export async function saveState(kv: KeyValueStore, state: AppState): Promise<void> {
  await kv.set(KEYS.state, JSON.stringify(state));
}

export async function loadPhoto(kv: KeyValueStore, id: string): Promise<string | null> {
  const v = await kv.get(KEYS.photo(id));
  return v && v.startsWith('data:image/') ? v : null;
}

export async function savePhoto(kv: KeyValueStore, id: string, dataUri: string): Promise<void> {
  await kv.set(KEYS.photo(id), dataUri);
}

export async function removePhotos(kv: KeyValueStore, ids: string[]): Promise<void> {
  await Promise.all(ids.map((id) => kv.remove(KEYS.photo(id))));
}

/** 모든 기록 삭제: 상태 키와 기록에 연결된 사진 키만 지운다(다른 앱 영역은 건드리지 않음). */
export async function wipeAll(kv: KeyValueStore, state: AppState): Promise<void> {
  const ids = [state.active, ...state.history].filter((r): r is ParkingRecord => r != null).map((r) => r.id);
  await removePhotos(kv, ids);
  await kv.remove(KEYS.state);
}

// ── 방어적 파싱: 알 수 없는 값은 버리고 앱이 멈추지 않게 한다 ─────────────

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown, max = 200) => (typeof v === 'string' ? v.slice(0, max) : '');
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const iso = (v: unknown) => (typeof v === 'string' && Number.isFinite(Date.parse(v)) ? v : null);

function rule(v: unknown): RateRule | null {
  if (!isObj(v)) return null;
  const r = {
    freeMinutes: num(v.freeMinutes),
    baseMinutes: num(v.baseMinutes),
    baseFeeWon: num(v.baseFeeWon),
    unitMinutes: num(v.unitMinutes),
    unitFeeWon: num(v.unitFeeWon),
  };
  if (Object.values(r).some((x) => x == null)) return null;
  return { ...(r as Omit<RateRule, 'maxFeeWon'>), maxFeeWon: num(v.maxFeeWon) };
}

function record(v: unknown): ParkingRecord | null {
  if (!isObj(v)) return null;
  const id = str(v.id, 64);
  const startedAt = iso(v.startedAt);
  if (!id || !startedAt) return null;
  const loc = isObj(v.location) ? v.location : null;
  const lat = loc ? num(loc.lat) : null;
  const lng = loc ? num(loc.lng) : null;
  const location =
    loc && lat != null && lng != null && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
      ? { lat, lng, accuracyM: num(loc.accuracyM), capturedAt: iso(loc.capturedAt) ?? startedAt }
      : null;
  const endedAt = iso(v.endedAt);
  return {
    id,
    status: v.status === 'ACTIVE' && !endedAt ? 'ACTIVE' : 'COMPLETED',
    startedAt,
    endedAt,
    placeName: str(v.placeName, LIMITS.placeName),
    floor: str(v.floor, LIMITS.floor),
    zone: str(v.zone, LIMITS.zone),
    spot: str(v.spot, LIMITS.spot),
    note: str(v.note, LIMITS.note),
    locationSource: location ? 'GPS' : 'MANUAL',
    location,
    rate: rule(v.rate),
    actualPaidWon: num(v.actualPaidWon),
    hasPhoto: v.hasPhoto === true,
  };
}

export function normalizeState(v: unknown): AppState {
  if (!isObj(v) || v.schemaVersion !== SCHEMA_VERSION) throw new Error('unsupported schema');
  const active = record(v.active);
  const history = (Array.isArray(v.history) ? v.history : [])
    .map(record)
    .filter((r): r is ParkingRecord => r != null && r.status === 'COMPLETED')
    .slice(0, LIMITS.history);
  const rateProfiles = (Array.isArray(v.rateProfiles) ? v.rateProfiles : [])
    .map((p) => (isObj(p) && rule(p.rule) ? { name: str(p.name, LIMITS.placeName), rule: rule(p.rule)!, updatedAt: iso(p.updatedAt) ?? new Date(0).toISOString() } : null))
    .filter((p): p is NonNullable<typeof p> => p != null)
    .slice(0, LIMITS.rateProfiles);
  const recentSearches = (Array.isArray(v.recentSearches) ? v.recentSearches : [])
    .filter((s): s is string => typeof s === 'string' && s.length > 0)
    .slice(0, LIMITS.recentSearches);
  return {
    schemaVersion: SCHEMA_VERSION,
    onboarded: v.onboarded === true,
    active: active?.status === 'ACTIVE' ? active : null,
    history,
    rateProfiles,
    recentSearches,
  };
}
