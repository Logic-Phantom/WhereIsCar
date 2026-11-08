import { describe, expect, it } from 'vitest';
import {
  addRecentSearch,
  completeParking,
  computeStats,
  deleteRecord,
  sanitizeDraft,
  searchRecords,
  setPhotoFlag,
  setRecordRate,
  spotSummary,
  startParking,
  updateRecord,
  type RecordDraft,
} from '../src/domain/records';
import { LIMITS, emptyState, type AppState, type RateRule } from '../src/domain/types';

const rule: RateRule = { freeMinutes: 0, baseMinutes: 60, baseFeeWon: 3000, unitMinutes: 60, unitFeeWon: 1000, maxFeeWon: null };
const draft = (over: Partial<RecordDraft> = {}): RecordDraft => ({
  placeName: '테스트 주차장',
  floor: 'B2',
  zone: 'A구역',
  spot: '12번',
  note: '',
  startedAt: '2026-11-08T05:00:00.000Z',
  location: null,
  rate: null,
  ...over,
});

function park(s: AppState, id: string, over: Partial<RecordDraft> = {}, now = '2026-11-08T06:00:00.000Z') {
  return startParking(s, draft(over), id, now);
}

describe('주차 시작·종료', () => {
  it('위치 없이 수동 입력만으로 저장된다', () => {
    const { state } = park(emptyState(), 'a');
    expect(state.active).toMatchObject({ id: 'a', status: 'ACTIVE', locationSource: 'MANUAL', location: null, placeName: '테스트 주차장' });
  });

  it('GPS 위치가 있으면 GPS로 표시하고 범위를 벗어난 좌표는 버린다', () => {
    const ok = park(emptyState(), 'a', { location: { lat: 37.5, lng: 127, accuracyM: 18.4, capturedAt: '2026-11-08T05:00:00.000Z' } }).state.active!;
    expect(ok.locationSource).toBe('GPS');
    expect(ok.location?.accuracyM).toBe(18);
    const bad = park(emptyState(), 'b', { location: { lat: 99, lng: 127, accuracyM: 5, capturedAt: '' } }).state.active!;
    expect(bad.location).toBeNull();
    expect(bad.locationSource).toBe('MANUAL');
  });

  it('진행 중 기록이 있으면 종료해 기록으로 옮기고 새로 시작한다', () => {
    const s1 = park(emptyState(), 'a').state;
    const s2 = park(s1, 'b', {}, '2026-11-08T07:00:00.000Z').state;
    expect(s2.active?.id).toBe('b');
    expect(s2.history[0]).toMatchObject({ id: 'a', status: 'COMPLETED', endedAt: '2026-11-08T07:00:00.000Z' });
  });

  it('주차 종료: endedAt 고정, 실제 정산액 검증', () => {
    const s1 = park(emptyState(), 'a').state;
    const { state } = completeParking(s1, '2026-11-08T08:00:00.000Z', 4500);
    expect(state.active).toBeNull();
    expect(state.history[0]).toMatchObject({ endedAt: '2026-11-08T08:00:00.000Z', actualPaidWon: 4500 });
    expect(completeParking(s1, '2026-11-08T08:00:00.000Z', -5).state.history[0].actualPaidWon).toBeNull();
  });

  it('입력 길이를 자른다', () => {
    const d = sanitizeDraft(draft({ placeName: 'x'.repeat(100), note: '  메모  ' }));
    expect(d.placeName.length).toBe(LIMITS.placeName);
    expect(d.note).toBe('메모');
  });
});

describe('기록 보관 한도', () => {
  it(`완료 기록은 최대 ${LIMITS.history}개, 사진은 최근 ${LIMITS.photosKept}개 기록에만 남긴다`, () => {
    let s = emptyState();
    const dropped: string[] = [];
    for (let i = 0; i < LIMITS.history + 3; i++) {
      const r = park(s, `r${i}`);
      s = setPhotoFlag(r.state, `r${i}`, true);
      dropped.push(...r.dropPhotos);
      const c = completeParking(s, '2026-11-08T07:00:00.000Z', null);
      s = c.state;
      dropped.push(...c.dropPhotos);
    }
    expect(s.history.length).toBe(LIMITS.history);
    expect(s.history[0].id).toBe(`r${LIMITS.history + 2}`);
    expect(s.history.filter((r) => r.hasPhoto).length).toBe(LIMITS.photosKept);
    // 잘려 나간 기록과 사진 보관 범위를 벗어난 기록의 사진은 지우라고 알려 준다
    expect(new Set(dropped).size).toBe(LIMITS.history + 3 - LIMITS.photosKept);
  });
});

describe('요금표', () => {
  it('기록에 스냅샷을 저장하고 장소 이름으로 요금표 목록에 올린다(최대 5개)', () => {
    let s = park(emptyState(), 'a').state;
    s = setRecordRate(s, 'a', rule, '2026-11-08T06:00:00.000Z');
    expect(s.active?.rate).toEqual(rule);
    expect(s.rateProfiles[0].name).toBe('테스트 주차장');
    for (let i = 0; i < 7; i++) s = park(s, `p${i}`, { placeName: `장소${i}`, rate: rule }).state;
    expect(s.rateProfiles.length).toBe(LIMITS.rateProfiles);
    expect(s.rateProfiles[0].name).toBe('장소6');
  });

  it('요금표 목록을 바꿔도 완료 기록의 스냅샷은 그대로', () => {
    let s = park(emptyState(), 'a', { rate: rule }).state;
    s = completeParking(s, '2026-11-08T07:00:00.000Z', null).state;
    s = park(s, 'b', { rate: { ...rule, baseFeeWon: 9999 } }).state;
    expect(s.history[0].rate?.baseFeeWon).toBe(3000);
  });
});

describe('수정·삭제·검색·통계', () => {
  it('수정은 상태·종료 시각을 바꾸지 않는다', () => {
    let s = park(emptyState(), 'a').state;
    s = completeParking(s, '2026-11-08T07:00:00.000Z', null).state;
    s = updateRecord(s, 'a', draft({ floor: 'B3' }));
    expect(s.history[0]).toMatchObject({ floor: 'B3', status: 'COMPLETED', endedAt: '2026-11-08T07:00:00.000Z' });
  });

  it('삭제하면 사진도 지우라고 알려 준다', () => {
    const s = park(emptyState(), 'a').state;
    expect(deleteRecord(s, 'a')).toMatchObject({ state: { active: null }, dropPhotos: ['a'] });
  });

  it('검색 범위', () => {
    let s = park(emptyState(), 'a', { placeName: '신촌 백화점', note: '엘리베이터 옆' }).state;
    s = park(s, 'b', { placeName: '코엑스', floor: 'B1', zone: 'D구역' }).state;
    expect(searchRecords(s, '신촌', 'all').map((r) => r.id)).toEqual(['a']);
    expect(searchRecords(s, 'd 구역', 'spot').map((r) => r.id)).toEqual(['b']);
    expect(searchRecords(s, '엘리베이터', 'place')).toEqual([]);
    expect(searchRecords(s, '엘리베이터', 'note').map((r) => r.id)).toEqual(['a']);
    expect(searchRecords(s, '  ', 'all')).toEqual([]);
  });

  it('최근 검색어는 중복 없이 5개', () => {
    let s = emptyState();
    for (const q of ['a', 'b', 'c', 'd', 'e', 'f', 'b']) s = addRecentSearch(s, q);
    expect(s.recentSearches).toEqual(['b', 'f', 'e', 'd', 'c']);
  });

  it('통계는 요금표가 있는 기록만 예상 요금에 더한다', () => {
    let s = park(emptyState(), 'a', { rate: rule }).state;
    s = completeParking(s, '2026-11-08T07:30:00.000Z', 5000).state; // 150분 → 3000 + 2*1000
    s = park(s, 'b', { placeName: '테스트 주차장' }, '2026-11-08T08:00:00.000Z').state;
    const st = computeStats(s, Date.parse('2026-11-08T06:00:00.000Z'));
    expect(st.count).toBe(2);
    expect(st.estimatedWon).toBe(5000);
    expect(st.estimatedCount).toBe(1);
    expect(st.actualWon).toBe(5000);
    expect(st.topPlace).toEqual({ name: '테스트 주차장', count: 2 });
  });

  it('spotSummary는 빈 칸을 뺀다', () => {
    expect(spotSummary({ floor: 'B2', zone: '', spot: '12번' })).toBe('B2 · 12번');
  });
});
