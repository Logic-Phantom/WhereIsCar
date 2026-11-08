// 요금표 입력(시안 7번 화면). 진행 중인 주차에 적용하고, 장소 이름으로 저장해 다음에 불러온다.
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useOverlay } from '../components/overlay';
import { Chip, Header, Notice, Screen } from '../components/ui';
import { describeRule, estimateFee, validateRule, won } from '../domain/fee';
import { setRecordRate } from '../domain/records';
import { elapsed } from '../domain/time';
import type { RateRule } from '../domain/types';
import { useApp, useNow } from '../state/store';

type Form = Record<'freeMinutes' | 'baseMinutes' | 'baseFeeWon' | 'unitMinutes' | 'unitFeeWon' | 'maxFeeWon', string>;

const FIELDS: { key: keyof Form; label: string; unit: string; placeholder: string; optional?: boolean }[] = [
  { key: 'freeMinutes', label: '무료 시간', unit: '분', placeholder: '0' },
  { key: 'baseMinutes', label: '기본 시간', unit: '분', placeholder: '60' },
  { key: 'baseFeeWon', label: '기본 요금', unit: '원', placeholder: '3,000' },
  { key: 'unitMinutes', label: '추가 요금 단위', unit: '분', placeholder: '60' },
  { key: 'unitFeeWon', label: '추가 요금', unit: '원', placeholder: '1,000' },
  { key: 'maxFeeWon', label: '1회 최대 요금', unit: '원', placeholder: '선택', optional: true },
];

const toForm = (r: RateRule | null): Form => ({
  freeMinutes: r ? String(r.freeMinutes) : '0',
  baseMinutes: r ? String(r.baseMinutes) : '60',
  baseFeeWon: r ? String(r.baseFeeWon) : '',
  unitMinutes: r ? String(r.unitMinutes) : '60',
  unitFeeWon: r ? String(r.unitFeeWon) : '',
  maxFeeWon: r?.maxFeeWon != null ? String(r.maxFeeWon) : '',
});

const digits = (s: string) => s.replace(/[^0-9]/g, '').slice(0, 8);
const fmt = (s: string, unit: string) => (unit === '원' && s ? Number(s).toLocaleString('ko-KR') : s);

function toRule(f: Form): RateRule | null {
  const req = ['freeMinutes', 'baseMinutes', 'baseFeeWon', 'unitMinutes', 'unitFeeWon'] as const;
  if (req.some((k) => f[k] === '')) return null;
  return {
    freeMinutes: Number(f.freeMinutes),
    baseMinutes: Number(f.baseMinutes),
    baseFeeWon: Number(f.baseFeeWon),
    unitMinutes: Number(f.unitMinutes),
    unitFeeWon: Number(f.unitFeeWon),
    maxFeeWon: f.maxFeeWon === '' ? null : Number(f.maxFeeWon),
  };
}

export function RateEditor() {
  const navigate = useNavigate();
  const { state, commit } = useApp();
  const { toast, confirm } = useOverlay();
  const a = state.active;
  const now = useNow(30_000);
  const [form, setForm] = useState<Form>(() => toForm(a?.rate ?? state.rateProfiles.find((p) => p.name === a?.placeName)?.rule ?? null));
  if (!a) return <Navigate to="/" replace />;

  const rule = toRule(form);
  const problem = rule ? validateRule(rule) : '필수 항목을 모두 입력해 주세요.';
  const preview = rule && !problem ? estimateFee(rule, elapsed(a.startedAt, now).totalMinutes) : null;

  const save = async () => {
    if (!rule || problem) return toast(problem ?? '입력값을 확인해 주세요');
    const ok = await commit((s) => setRecordRate(s, a.id, rule, new Date().toISOString()));
    if (!ok) return toast('저장하지 못했어요. 다시 시도해 주세요');
    toast('요금표를 저장했어요');
    navigate(-1);
  };

  const clear = async () => {
    if (!(await confirm({ title: '요금표를 지울까요?', message: '이번 주차의 예상 요금이 더 이상 표시되지 않아요.', confirmText: '지우기', danger: true }))) return;
    await commit((s) => setRecordRate(s, a.id, null, new Date().toISOString()));
    navigate(-1);
  };

  return (
    <Screen>
      <Header
        title="요금표 입력"
        right={
          <button type="button" className="text-btn" onClick={save}>
            저장하기
          </button>
        }
      />
      <p className="form-lead">
        주차장 요금을 입력해
        <br />
        예상 요금을 계산해보세요.
      </p>

      {state.rateProfiles.length > 0 && (
        <div className="chips scroll">
          {state.rateProfiles.map((p) => (
            <Chip key={p.name} onClick={() => setForm(toForm(p.rule))}>
              {p.name} 불러오기
            </Chip>
          ))}
        </div>
      )}

      <div className="rate-list">
        {FIELDS.map((f) => (
          <label key={f.key} className="rate-row">
            <span className="rate-label">{f.label}</span>
            <span className="rate-input">
              <input
                inputMode="numeric"
                value={fmt(form[f.key], f.unit)}
                placeholder={f.placeholder}
                aria-label={`${f.label}(${f.unit})`}
                onChange={(e) => setForm({ ...form, [f.key]: digits(e.target.value) })}
              />
              <span className="rate-unit">{f.unit}</span>
            </span>
          </label>
        ))}
      </div>

      {rule && !problem && <p className="hint">{describeRule(rule)}</p>}
      {problem && rule && <p className="loc-warn">{problem}</p>}
      {preview?.status === 'OK' && (
        <div className="preview">
          지금 나가면 예상 <strong>{won(preview.amountWon)}</strong>
          {preview.isCapped && ' (최대 요금)'}
        </div>
      )}

      <Notice>
        입력한 요금표는 예상 요금 계산에만 사용돼요. 일 최대요금·심야/주말 요금·할인·회차 무료는 계산하지 않아 실제 정산 금액과 다를 수 있어요.
      </Notice>

      {a.rate && (
        <button type="button" className="link-btn danger center-block" onClick={clear}>
          이번 주차 요금표 지우기
        </button>
      )}
    </Screen>
  );
}
