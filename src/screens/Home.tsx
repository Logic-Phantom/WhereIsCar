// 홈: 인사 + 주차 시작/진행 카드 + 최근 주차 기록 + 바로가기 4개 + 탭바(시안 2번 화면).
import { Navigate, useNavigate } from 'react-router-dom';
import { Icon, type IconName } from '../components/Icon';
import { HomeScene } from '../components/Illustrations';
import { useOverlay } from '../components/overlay';
import { Card, Screen, SectionTitle, Thumb } from '../components/ui';
import { estimateFee, won } from '../domain/fee';
import { allRecords, placeTitle, spotSummary } from '../domain/records';
import { dateTimeLabel, durationLabel, elapsed } from '../domain/time';
import { mapUrl, openExternal } from '../platform/toss';
import { useApp, useNow } from '../state/store';

export function Home() {
  const navigate = useNavigate();
  const { state } = useApp();
  const { toast } = useOverlay();
  const now = useNow(30_000);
  if (!state.onboarded) return <Navigate to="/intro" replace />;

  const active = state.active;
  const recent = allRecords(state)[0] ?? null;
  const withLocation = allRecords(state).find((r) => r.location) ?? null;
  const withPhoto = allRecords(state).find((r) => r.hasPhoto) ?? null;

  const quick: { icon: IconName; label: string; onClick: () => void }[] = [
    {
      icon: 'pin',
      label: '지도 보기',
      onClick: () => {
        if (!withLocation?.location) return toast('위치가 기록된 주차가 아직 없어요');
        openExternal(mapUrl(withLocation.location.lat, withLocation.location.lng, placeTitle(withLocation))).catch(() => toast('지도를 열 수 없어요. 기록 화면에서 좌표를 복사해 주세요'));
      },
    },
    {
      icon: 'camera',
      label: '사진 보기',
      onClick: () => (withPhoto ? navigate(`/record/${withPhoto.id}`) : toast('사진을 남긴 주차 기록이 아직 없어요')),
    },
    { icon: 'list', label: '기록 관리', onClick: () => navigate('/records') },
    { icon: 'chart', label: '통계', onClick: () => navigate('/stats') },
  ];

  return (
    <Screen tabbar>
      <header className="home-header">
        <h1>내 차 어딨지?</h1>
        <button className="icon-btn" aria-label="검색" onClick={() => navigate('/search')}>
          <Icon name="search" size={22} />
        </button>
        <button className="icon-btn" aria-label="설정" onClick={() => navigate('/settings')}>
          <Icon name="gear" size={22} />
        </button>
      </header>

      <section className="home-hero">
        <p className="home-greet">
          {active ? (
            <>
              주차 중이에요,
              <br />
              차는 잘 있어요! 🚗
            </>
          ) : (
            <>
              오늘도,
              <br />
              좋은 하루예요! 😊
            </>
          )}
        </p>
        <div className="home-scene">
          <HomeScene />
        </div>
      </section>

      {active ? (
        <ActiveCard now={now} />
      ) : (
        <Card className="start-card" onClick={() => navigate('/park/new')}>
          <div className="start-icon">
            <Icon name="car" size={28} color="#fff" />
          </div>
          <div className="start-text">
            <strong>주차 시작하기</strong>
            <span>지금 바로 주차 위치를 저장해요!</span>
          </div>
          <Icon name="chevron-right" size={20} color="var(--c-text-3)" />
        </Card>
      )}

      <SectionTitle
        right={
          <button className="link-btn" onClick={() => navigate('/records')}>
            더보기 <Icon name="chevron-right" size={14} />
          </button>
        }
      >
        최근 주차 기록
      </SectionTitle>
      {recent ? (
        <Card className="recent-card" onClick={() => navigate(`/record/${recent.id}`)}>
          <Thumb id={recent.id} hasPhoto={recent.hasPhoto} />
          <div className="recent-text">
            <strong>{placeTitle(recent)}</strong>
            <span>{spotSummary(recent) || '층·구역 미입력'}</span>
            <span className="muted">{dateTimeLabel(recent.startedAt)}</span>
          </div>
          {recent.status === 'ACTIVE' && <span className="badge">주차 중</span>}
        </Card>
      ) : (
        <Card className="recent-empty">
          <span>아직 주차 기록이 없어요. 주차하면 여기에 보여요.</span>
        </Card>
      )}

      <div className="quick-grid">
        {quick.map((q) => (
          <button key={q.label} type="button" className="quick" onClick={q.onClick}>
            <Icon name={q.icon} size={24} color="var(--c-primary)" />
            <span>{q.label}</span>
          </button>
        ))}
      </div>
    </Screen>
  );
}

function ActiveCard({ now }: { now: number }) {
  const navigate = useNavigate();
  const { state } = useApp();
  const a = state.active!;
  const e = elapsed(a.startedAt, now);
  const fee = estimateFee(a.rate, e.totalMinutes);
  return (
    <Card className="start-card active" onClick={() => navigate('/timer')}>
      <div className="start-icon">
        <Icon name="clock" size={26} color="#fff" />
      </div>
      <div className="start-text">
        <strong>{e.invalid ? '주차 시간을 확인해 주세요' : `주차한 지 ${durationLabel(e.totalMinutes)}`}</strong>
        <span>
          {placeTitle(a)}
          {spotSummary(a) && ` · ${spotSummary(a)}`}
          {fee.status === 'OK' && ` · 예상 ${won(fee.amountWon)}`}
        </span>
      </div>
      <Icon name="chevron-right" size={20} color="var(--c-text-3)" />
    </Card>
  );
}
