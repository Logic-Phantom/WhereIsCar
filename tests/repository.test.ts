import { describe, expect, it } from 'vitest';
import { startParking, setPhotoFlag } from '../src/domain/records';
import { emptyState } from '../src/domain/types';
import { memoryStore } from '../src/storage/kv';
import { KEYS, loadPhoto, loadState, normalizeState, savePhoto, saveState, wipeAll } from '../src/storage/repository';

const draft = { placeName: '테스트', floor: 'B1', zone: '', spot: '', note: '', startedAt: '2026-11-08T05:00:00.000Z', location: null, rate: null };

describe('repository', () => {
  it('저장 → 다시 읽기(재진입 복원)', async () => {
    const kv = memoryStore();
    const s = startParking({ ...emptyState(), onboarded: true }, draft, 'a', '2026-11-08T05:00:00.000Z').state;
    await saveState(kv, s);
    const r = await loadState(kv);
    expect(r.corrupted).toBe(false);
    expect(r.state).toEqual(s);
  });

  it('값이 없으면 빈 상태', async () => {
    expect(await loadState(memoryStore())).toEqual({ state: emptyState(), corrupted: false });
  });

  it('손상된 JSON·모르는 버전은 빈 상태 + corrupted', async () => {
    const kv = memoryStore();
    await kv.set(KEYS.state, '{oops');
    expect((await loadState(kv)).corrupted).toBe(true);
    await kv.set(KEYS.state, JSON.stringify({ schemaVersion: 99 }));
    expect((await loadState(kv)).corrupted).toBe(true);
  });

  it('이상한 필드는 버리고 나머지는 살린다', () => {
    const s = normalizeState({
      schemaVersion: 1,
      onboarded: true,
      active: { id: 'x', startedAt: 'bad' },
      history: [
        { id: 'h1', status: 'COMPLETED', startedAt: '2026-11-08T05:00:00.000Z', endedAt: '2026-11-08T06:00:00.000Z', placeName: 3, location: { lat: 200, lng: 0 }, rate: { freeMinutes: 'x' } },
        'garbage',
      ],
      rateProfiles: [{ name: 'p', rule: { freeMinutes: 0, baseMinutes: 60, baseFeeWon: 1000, unitMinutes: 10, unitFeeWon: 100 } }],
      recentSearches: ['a', 3],
    });
    expect(s.active).toBeNull();
    expect(s.history).toHaveLength(1);
    expect(s.history[0]).toMatchObject({ id: 'h1', placeName: '', location: null, rate: null });
    expect(s.rateProfiles[0].rule.maxFeeWon).toBeNull();
    expect(s.recentSearches).toEqual(['a']);
  });

  it('사진은 data:image만 돌려주고, 전체 삭제는 이 앱 키만 지운다', async () => {
    const kv = memoryStore();
    await kv.set('other-app-key', 'keep');
    let s = startParking(emptyState(), draft, 'a', '2026-11-08T05:00:00.000Z').state;
    s = setPhotoFlag(s, 'a', true);
    await saveState(kv, s);
    await savePhoto(kv, 'a', 'data:image/jpeg;base64,AAAA');
    expect(await loadPhoto(kv, 'a')).toBe('data:image/jpeg;base64,AAAA');
    await kv.set(KEYS.photo('z'), 'not-an-image');
    expect(await loadPhoto(kv, 'z')).toBeNull();
    await wipeAll(kv, s);
    expect(await kv.get(KEYS.state)).toBeNull();
    expect(await kv.get(KEYS.photo('a'))).toBeNull();
    expect(await kv.get('other-app-key')).toBe('keep');
  });
});
