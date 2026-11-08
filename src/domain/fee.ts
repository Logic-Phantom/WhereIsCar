// 사용자가 입력한 요금표로 '예상' 요금을 계산한다. 실제 정산 금액이 아니다(할인·일 최대요금·운영사 규칙 미반영).
import { LIMITS, type RateRule } from './types';

export type FeeEstimate =
  | { status: 'OK'; amountWon: number; billableMinutes: number; isCapped: boolean }
  | { status: 'NOT_CONFIGURED' }
  | { status: 'INVALID_RULE'; reason: string };

const isInt = (n: unknown): n is number => typeof n === 'number' && Number.isInteger(n);

/** 요금표가 계산 가능한지 검사한다. 문제가 있으면 사용자에게 보여 줄 이유를, 없으면 null. */
export function validateRule(rule: RateRule): string | null {
  const mins = [rule.freeMinutes, rule.baseMinutes, rule.unitMinutes];
  const wons = [rule.baseFeeWon, rule.unitFeeWon];
  if (![...mins, ...wons].every(isInt)) return '숫자만 입력해 주세요.';
  if (mins.some((m) => m < 0 || m > LIMITS.minutes)) return '시간은 0분~7일 사이로 입력해 주세요.';
  if (wons.some((w) => w < 0 || w > LIMITS.won)) return '요금은 0원~1,000만 원 사이로 입력해 주세요.';
  if (rule.unitMinutes <= 0) return '추가 요금 단위 시간은 1분 이상이어야 해요.';
  if (rule.maxFeeWon != null && (!isInt(rule.maxFeeWon) || rule.maxFeeWon <= 0 || rule.maxFeeWon > LIMITS.won)) {
    return '최대 요금은 1원 이상으로 입력하거나 비워 주세요.';
  }
  return null;
}

export function estimateFee(rule: RateRule | null, elapsedMinutes: number): FeeEstimate {
  if (!rule) return { status: 'NOT_CONFIGURED' };
  const reason = validateRule(rule);
  if (reason) return { status: 'INVALID_RULE', reason };
  const minutes = Math.max(0, Math.floor(elapsedMinutes));
  const billable = Math.max(0, minutes - rule.freeMinutes);
  let amount = 0;
  if (billable > 0) {
    amount = rule.baseFeeWon;
    if (billable > rule.baseMinutes) {
      amount += Math.ceil((billable - rule.baseMinutes) / rule.unitMinutes) * rule.unitFeeWon;
    }
  }
  let isCapped = false;
  if (rule.maxFeeWon != null && amount > rule.maxFeeWon) {
    amount = rule.maxFeeWon;
    isCapped = true;
  }
  return { status: 'OK', amountWon: amount, billableMinutes: billable, isCapped };
}

/** '무료 10분 · 기본 1시간 2,000원 · 이후 10분마다 500원' 형태 요약 */
export function describeRule(rule: RateRule): string {
  const parts: string[] = [];
  if (rule.freeMinutes > 0) parts.push(`무료 ${minutesLabel(rule.freeMinutes)}`);
  parts.push(`기본 ${minutesLabel(rule.baseMinutes)} ${won(rule.baseFeeWon)}`);
  parts.push(`이후 ${minutesLabel(rule.unitMinutes)}마다 ${won(rule.unitFeeWon)}`);
  if (rule.maxFeeWon != null) parts.push(`최대 ${won(rule.maxFeeWon)}`);
  return parts.join(' · ');
}

export function won(n: number): string {
  return `${n.toLocaleString('ko-KR')}원`;
}

export function minutesLabel(m: number): string {
  if (m >= 60 && m % 60 === 0) return `${m / 60}시간`;
  return `${m}분`;
}
