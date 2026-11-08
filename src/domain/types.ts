// 도메인 타입(순수 TS — DOM·SDK 의존 금지). 저장 형식이 바뀌면 SCHEMA_VERSION과 repository 마이그레이션을 같이 고친다.

export const SCHEMA_VERSION = 1 as const;

export type ParkingStatus = 'ACTIVE' | 'COMPLETED';
export type LocationSource = 'GPS' | 'MANUAL';

export interface ParkingLocation {
  lat: number;
  lng: number;
  /** 기기가 돌려준 측정 오차(m). 모르면 null — 임의 값 금지 */
  accuracyM: number | null;
  capturedAt: string;
}

/** 지원하는 단순 요금표: 무료 시간 → 기본 시간·요금 → 추가 단위마다 요금 → (선택) 1회 최대 요금 */
export interface RateRule {
  freeMinutes: number;
  baseMinutes: number;
  baseFeeWon: number;
  unitMinutes: number;
  unitFeeWon: number;
  /** 1회 주차 최대 요금. 일 최대요금(자정 초기화)과 다르다 */
  maxFeeWon: number | null;
}

export interface ParkingRecord {
  id: string;
  status: ParkingStatus;
  /** ISO 8601. 경과 시간 계산의 기준(now - startedAt) */
  startedAt: string;
  endedAt: string | null;
  placeName: string;
  floor: string;
  zone: string;
  spot: string;
  note: string;
  locationSource: LocationSource;
  location: ParkingLocation | null;
  /** 이 기록에 적용한 요금표 스냅샷(요금표를 나중에 바꿔도 과거 기록은 그대로) */
  rate: RateRule | null;
  /** 사용자가 정산기에서 확인해 직접 적은 금액 */
  actualPaidWon: number | null;
  hasPhoto: boolean;
}

export interface RateProfile {
  name: string;
  rule: RateRule;
  updatedAt: string;
}

export interface AppState {
  schemaVersion: typeof SCHEMA_VERSION;
  onboarded: boolean;
  active: ParkingRecord | null;
  /** 완료된 기록, 최신순 */
  history: ParkingRecord[];
  rateProfiles: RateProfile[];
  recentSearches: string[];
}

export const LIMITS = {
  history: 50,
  rateProfiles: 5,
  recentSearches: 5,
  /** 사진을 남겨 두는 완료 기록 수(그보다 오래된 기록의 사진은 지운다) */
  photosKept: 10,
  placeName: 40,
  floor: 10,
  zone: 20,
  spot: 20,
  note: 200,
  minutes: 60 * 24 * 7,
  won: 10_000_000,
} as const;

export const FLOOR_OPTIONS = ['B5', 'B4', 'B3', 'B2', 'B1', '1F', '2F', '3F'] as const;

export function emptyState(): AppState {
  return { schemaVersion: SCHEMA_VERSION, onboarded: false, active: null, history: [], rateProfiles: [], recentSearches: [] };
}
