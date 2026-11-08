// 타이머(시안 6번 화면): 원형 진행 + 경과 시간 + 위치 + 예상 요금 + 주차 종료하기.
import { Navigate, useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Button, Card, Header, Screen } from '../components/ui';
import { estimateFee, won } from '../domain/fee';
import { placeTitle, spotSummary } from '../domain/records';
import { clock, dateTimeLabel, elapsed } from '../domain/time';
import { useApp, useNow } from '../state/store';

const R = 78;
const CIRC = 2 * Math.PI * R;

export function Timer() {
  const navigate = useNavigate();
  const { state } = useApp();
  const now = useNow(1000);
  const a = state.active;
  if (!a) return <Navigate to="/" replace />;
  const e = elapsed(a.startedAt, now);
  const fee = estimateFee(a.rate, e.totalMinutes);
  // 원은 현재 1시간 안에서 지난 비율(시계 분침처럼 매시간 한 바퀴)
  const progress = e.invalid ? 0 : (e.totalMs % 3_600_000) / 3_600_000;

  return (
    <Screen footer={<Button onClick={() => navigate(`/record/${a.id}/end`)}>주차 종료하기</Button>}>
      <Header title="타이머" />
      <div className="timer-ring" role="timer" aria-label={`주차 경과 시간 ${clock(e.totalMs)}`}>
        <svg viewBox="0 0 180 180" width="220" height="220" aria-hidden="true">
          <circle cx="90" cy="90" r={R} fill="none" stroke="var(--c-primary-soft)" strokeWidth="12" />
          <circle
            cx="90"
            cy="90"
            r={R}
            fill="none"
            stroke="var(--c-primary)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${CIRC * Math.max(progress, 0.005)} ${CIRC}`}
            transform="rotate(-90 90 90)"
          />
        </svg>
        <div className="timer-center">
          <Icon name="car" size={34} color="var(--c-primary)" stroke={2.2} />
          <div className="timer-clock">{e.invalid ? '--:--:--' : clock(e.totalMs)}</div>
          <div className="timer-label">주차 경과 시간</div>
        </div>
      </div>
      {e.invalid && <p className="loc-warn center">기기 시각이 주차 시작 시각보다 빨라요. 기록에서 시작 시각을 확인해 주세요.</p>}
      <p className="timer-start">{dateTimeLabel(a.startedAt)} 주차 시작</p>

      <Card className="info-card" onClick={() => navigate(`/record/${a.id}`)}>
        <div className="info-icon">
          <Icon name="pin" size={22} color="var(--c-primary)" />
        </div>
        <div className="info-text">
          <strong>{placeTitle(a)}</strong>
          <span>{spotSummary(a) || '층·구역 미입력'}</span>
        </div>
        <Icon name="chevron-right" size={18} color="var(--c-text-4)" />
      </Card>

      {fee.status === 'OK' ? (
        <Card className="info-card fee" onClick={() => navigate('/rate')}>
          <div className="info-icon">
            <Icon name="won" size={22} color="var(--c-primary)" />
          </div>
          <div className="info-text">
            <span className="fee-label">예상 요금</span>
            <strong className="fee-amount">
              {won(fee.amountWon)} {fee.isCapped ? <small>(최대 요금)</small> : <small>~</small>}
            </strong>
            <span className="fee-note">※ 사용자가 입력한 요금표 기준 · 실제 정산 금액과 다를 수 있어요</span>
          </div>
        </Card>
      ) : (
        <Card className="info-card fee" onClick={() => navigate('/rate')}>
          <div className="info-icon">
            <Icon name="won" size={22} color="var(--c-primary)" />
          </div>
          <div className="info-text">
            <strong>요금표 입력하기</strong>
            <span>{fee.status === 'INVALID_RULE' ? fee.reason : '요금표를 입력하면 예상 요금을 볼 수 있어요'}</span>
          </div>
          <Icon name="chevron-right" size={18} color="var(--c-text-4)" />
        </Card>
      )}
      <p className="hint center">앱을 닫아도 주차 시작 시각 기준으로 시간이 이어져요.</p>
    </Screen>
  );
}
