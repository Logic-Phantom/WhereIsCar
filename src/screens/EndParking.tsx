// 주차 종료 확인 + 요약. 종료 시각을 고정하고, 정산기에서 본 실제 금액은 선택으로 적는다.
import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { useOverlay } from '../components/overlay';
import { Button, Card, Header, Notice, Row, Screen } from '../components/ui';
import { estimateFee, won } from '../domain/fee';
import { completeParking, placeTitle, spotSummary } from '../domain/records';
import { durationLabel, elapsed } from '../domain/time';
import { useApp, useNow } from '../state/store';

export function EndParking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, commit } = useApp();
  const { toast } = useOverlay();
  const now = useNow(10_000);
  const [paid, setPaid] = useState('');
  const [saving, setSaving] = useState(false);
  const a = state.active;
  if (!a || a.id !== id) return <Navigate to="/" replace />;

  const e = elapsed(a.startedAt, now);
  const fee = estimateFee(a.rate, e.totalMinutes);

  const finish = async () => {
    if (saving) return;
    setSaving(true);
    const endedAt = new Date().toISOString();
    const ok = await commit((s) => completeParking(s, endedAt, paid ? Number(paid) : null));
    setSaving(false);
    if (!ok) return toast('저장하지 못했어요. 다시 시도해 주세요');
    toast('주차를 종료했어요. 기록에 저장됐어요');
    navigate('/', { replace: true });
  };

  return (
    <Screen
      footer={
        <div className="footer-pair">
          <Button variant="soft" onClick={() => navigate(-1)}>
            계속 주차
          </Button>
          <Button onClick={finish} disabled={saving}>
            차량 찾았어요
          </Button>
        </div>
      }
    >
      <Header title="주차 종료" />
      <div className="end-hero">
        <div className="end-icon">
          <Icon name="car" size={36} color="var(--c-primary)" />
        </div>
        <h2>차량을 찾으셨나요?</h2>
        <p className="muted">지금 시각으로 주차를 끝내고 기록에 저장해요.</p>
      </div>

      <Card className="summary">
        <Row icon="pin" label={placeTitle(a)} value={spotSummary(a) || undefined} />
        <Row icon="clock" label="총 주차 시간" value={e.invalid ? '확인 필요' : durationLabel(e.totalMinutes)} />
        {fee.status === 'OK' && <Row icon="won" label="예상 요금" value={`${won(fee.amountWon)}${fee.isCapped ? ' (최대)' : ''}`} />}
      </Card>

      <label className="field">
        <span className="field-label">
          실제 정산 금액 <span className="muted">선택</span>
        </span>
        <span className="rate-input boxed">
          <input inputMode="numeric" placeholder="정산기에서 확인한 금액" value={paid ? Number(paid).toLocaleString('ko-KR') : ''} onChange={(ev) => setPaid(ev.target.value.replace(/[^0-9]/g, '').slice(0, 8))} />
          <span className="rate-unit">원</span>
        </span>
      </label>

      {fee.status === 'OK' && (
        <Notice>예상 요금은 입력한 요금표 기준이에요. 할인·일 최대요금·운영사 정산 규칙은 반영되지 않아 실제 금액과 다를 수 있어요. 결제는 주차장 정산기에서 해 주세요.</Notice>
      )}
    </Screen>
  );
}
