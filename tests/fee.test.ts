import { describe, expect, it } from 'vitest';
import { describeRule, estimateFee, validateRule } from '../src/domain/fee';
import type { RateRule } from '../src/domain/types';

// 알고리즘 예시용 요금표(특정 주차장 요금 아님): 무료 10분, 기본 60분 2,000원, 이후 10분마다 500원
const rule: RateRule = { freeMinutes: 10, baseMinutes: 60, baseFeeWon: 2000, unitMinutes: 10, unitFeeWon: 500, maxFeeWon: null };
const amount = (r: RateRule | null, m: number) => {
  const f = estimateFee(r, m);
  return f.status === 'OK' ? f.amountWon : f.status;
};

describe('estimateFee', () => {
  it('요금표가 없으면 금액을 만들지 않는다', () => {
    expect(estimateFee(null, 120)).toEqual({ status: 'NOT_CONFIGURED' });
  });

  it('무료 시간 경계', () => {
    expect(amount(rule, 0)).toBe(0);
    expect(amount(rule, 10)).toBe(0);
    expect(amount(rule, 11)).toBe(2000);
  });

  it('기본 시간 경계와 추가 단위 올림', () => {
    expect(amount(rule, 70)).toBe(2000); // 과금 60분
    expect(amount(rule, 71)).toBe(2500); // 과금 61분 → 1단위
    expect(amount(rule, 75)).toBe(2500); // 프롬프트 예시
    expect(amount(rule, 80)).toBe(2500);
    expect(amount(rule, 81)).toBe(3000);
  });

  it('기본 시간 0분이면 바로 단위 과금', () => {
    const r = { ...rule, freeMinutes: 0, baseMinutes: 0, baseFeeWon: 0 };
    expect(amount(r, 1)).toBe(500);
    expect(amount(r, 10)).toBe(500);
    expect(amount(r, 11)).toBe(1000);
  });

  it('1회 최대 요금 상한', () => {
    const r = { ...rule, maxFeeWon: 5000 };
    const f = estimateFee(r, 600);
    expect(f).toMatchObject({ status: 'OK', amountWon: 5000, isCapped: true });
    expect(estimateFee(r, 70)).toMatchObject({ amountWon: 2000, isCapped: false });
  });

  it('0원 요금표', () => {
    expect(amount({ ...rule, baseFeeWon: 0, unitFeeWon: 0 }, 500)).toBe(0);
  });

  it('잘못된 요금표는 숫자를 만들지 않는다', () => {
    expect(estimateFee({ ...rule, unitMinutes: 0 }, 100).status).toBe('INVALID_RULE');
    expect(estimateFee({ ...rule, baseFeeWon: -1 }, 100).status).toBe('INVALID_RULE');
    expect(estimateFee({ ...rule, freeMinutes: 1.5 }, 100).status).toBe('INVALID_RULE');
    expect(estimateFee({ ...rule, maxFeeWon: 0 }, 100).status).toBe('INVALID_RULE');
    expect(validateRule(rule)).toBeNull();
  });

  it('음수 경과 시간은 0분으로 본다', () => {
    expect(amount(rule, -30)).toBe(0);
  });

  it('요약 문구', () => {
    expect(describeRule({ ...rule, maxFeeWon: 20000 })).toBe('무료 10분 · 기본 1시간 2,000원 · 이후 10분마다 500원 · 최대 20,000원');
  });
});
