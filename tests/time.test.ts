import { describe, expect, it } from 'vitest';
import { clock, durationLabel, elapsed, relativeLabel } from '../src/domain/time';

const start = '2026-11-08T05:00:00.000Z';
const t = (iso: string) => Date.parse(iso);

describe('elapsed', () => {
  it('현재 시각과 시작 시각 차이로 계산한다(재진입 후에도 이어짐)', () => {
    const e = elapsed(start, t('2026-11-08T07:35:17.000Z'));
    expect(e.invalid).toBe(false);
    expect(e.totalMinutes).toBe(155);
    expect(clock(e.totalMs)).toBe('02:35:17');
  });

  it('종료 시각이 있으면 그 시각에서 멈춘다', () => {
    const e = elapsed(start, t('2026-11-09T00:00:00.000Z'), '2026-11-08T06:00:00.000Z');
    expect(e.totalMinutes).toBe(60);
  });

  it('기기 시계가 시작보다 이르면 음수 대신 invalid', () => {
    expect(elapsed(start, t('2026-11-08T04:00:00.000Z')).invalid).toBe(true);
    // 1분 이내 차이는 0으로 본다(시계 오차)
    expect(elapsed(start, t('2026-11-08T04:59:30.000Z'))).toMatchObject({ invalid: false, totalMs: 0 });
  });

  it('손상된 시각은 invalid', () => {
    expect(elapsed('nope', Date.now()).invalid).toBe(true);
  });
});

describe('표시', () => {
  it('durationLabel', () => {
    expect(durationLabel(0)).toBe('0분');
    expect(durationLabel(84)).toBe('1시간 24분');
    expect(durationLabel(120)).toBe('2시간');
    expect(durationLabel(1560)).toBe('1일 2시간');
  });

  it('clock은 24시간을 넘어도 시간 자리가 커진다', () => {
    expect(clock(26 * 3600_000 + 61_000)).toBe('26:01:01');
  });

  it('relativeLabel', () => {
    const now = t('2026-11-08T08:00:00.000Z');
    expect(relativeLabel('2026-11-08T07:59:40.000Z', now)).toBe('방금 전');
    expect(relativeLabel('2026-11-08T05:00:00.000Z', now)).toBe('3시간 전');
    expect(relativeLabel('2026-11-06T08:00:00.000Z', now)).toBe('2일 전');
  });
});
