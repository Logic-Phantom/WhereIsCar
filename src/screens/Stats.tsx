// 통계: 이 기기에 저장된 기록만으로 계산한다.
import { Icon, type IconName } from '../components/Icon';
import { Header, Notice, Screen } from '../components/ui';
import { won } from '../domain/fee';
import { computeStats } from '../domain/records';
import { durationLabel } from '../domain/time';
import { useApp, useNow } from '../state/store';

export function Stats() {
  const { state } = useApp();
  const now = useNow(60_000);
  const s = computeStats(state, now);
  const tiles: { icon: IconName; label: string; value: string; sub?: string }[] = [
    { icon: 'car', label: '주차 횟수', value: `${s.count}회` },
    { icon: 'clock', label: '평균 주차 시간', value: s.count ? durationLabel(s.avgMinutes) : '-' },
    { icon: 'won', label: '예상 요금 합계', value: s.estimatedCount ? won(s.estimatedWon) : '-', sub: s.estimatedCount ? `요금표 입력한 ${s.estimatedCount}회 기준` : '요금표 입력 기록 없음' },
    { icon: 'receipt', label: '실제 정산 합계', value: s.actualCount ? won(s.actualWon) : '-', sub: s.actualCount ? `직접 입력한 ${s.actualCount}회` : '입력한 금액 없음' },
  ];
  return (
    <Screen>
      <Header title="통계" />
      <div className="stat-grid">
        {tiles.map((t) => (
          <div key={t.label} className="stat">
            <Icon name={t.icon} size={22} color="var(--c-primary)" />
            <span className="stat-label">{t.label}</span>
            <strong className="stat-value">{t.value}</strong>
            {t.sub && <span className="stat-sub">{t.sub}</span>}
          </div>
        ))}
      </div>
      <div className="stat wide">
        <Icon name="pin" size={22} color="var(--c-primary)" />
        <span className="stat-label">가장 자주 간 곳</span>
        <strong className="stat-value">{s.topPlace ? `${s.topPlace.name} · ${s.topPlace.count}회` : '-'}</strong>
      </div>
      <div className="stat wide">
        <Icon name="history" size={22} color="var(--c-primary)" />
        <span className="stat-label">총 주차 시간</span>
        <strong className="stat-value">{s.count ? durationLabel(s.totalMinutes) : '-'}</strong>
      </div>
      <Notice>이 기기에 보관된 최근 기록(최대 50개)으로만 계산해요.</Notice>
    </Screen>
  );
}
