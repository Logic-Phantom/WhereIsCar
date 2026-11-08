// 주차 기록 상세(시안 3번 화면): 사진 · 장소 · 층/구역/번호 · 시작 시간 · 주차 종료하기.
import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { NoPhotoArt } from '../components/Illustrations';
import { useOverlay } from '../components/overlay';
import { Button, Card, Header, Notice, Row, Screen } from '../components/ui';
import { estimateFee, won } from '../domain/fee';
import { deleteRecord, findRecord, placeTitle, setActualPaid, setPhotoFlag } from '../domain/records';
import { dateTimeLabel, durationLabel, elapsed } from '../domain/time';
import type { ParkingRecord } from '../domain/types';
import { compressPhoto } from '../platform/image';
import { copyText, mapUrl, openExternal, takePhoto } from '../platform/toss';
import { useApp, useNow, usePhoto } from '../state/store';

export function Detail() {
  const { id = '' } = useParams();
  const { state } = useApp();
  const rec = findRecord(state, id);
  if (!rec) return <Navigate to="/records" replace />;
  return <DetailView rec={rec} />;
}

function DetailView({ rec }: { rec: ParkingRecord }) {
  const navigate = useNavigate();
  const { commit, putPhoto, dropPhoto } = useApp();
  const { toast, confirm } = useOverlay();
  const [photoVer, setPhotoVer] = useState(0);
  const [menu, setMenu] = useState(false);
  const photo = usePhoto(rec.id, rec.hasPhoto, photoVer);
  const now = useNow(30_000);
  const active = rec.status === 'ACTIVE';
  const e = elapsed(rec.startedAt, now, rec.endedAt);
  const fee = estimateFee(rec.rate, e.totalMinutes);

  const shoot = async () => {
    const r = await takePhoto();
    if (!r.ok) {
      if (r.reason === 'denied') toast('카메라 권한이 없어 사진을 찍을 수 없어요');
      return;
    }
    const small = await compressPhoto(r.dataUri);
    if (!small) return toast('사진이 너무 커서 저장할 수 없어요');
    if (!(await putPhoto(rec.id, small))) return toast('사진을 저장하지 못했어요');
    await commit((s) => setPhotoFlag(s, rec.id, true));
    setPhotoVer((v) => v + 1);
  };

  const removePhoto = async () => {
    if (!(await confirm({ title: '사진을 지울까요?', confirmText: '지우기', danger: true }))) return;
    await dropPhoto(rec.id);
    await commit((s) => setPhotoFlag(s, rec.id, false));
    setPhotoVer((v) => v + 1);
  };

  const remove = async () => {
    setMenu(false);
    const yes = await confirm({
      title: '이 주차 기록을 삭제할까요?',
      message: active ? '진행 중인 주차와 사진이 함께 삭제되고 되돌릴 수 없어요.' : '기록과 사진이 함께 삭제되고 되돌릴 수 없어요.',
      confirmText: '삭제',
      danger: true,
    });
    if (!yes) return;
    if (await commit((s) => deleteRecord(s, rec.id))) {
      toast('삭제했어요');
      navigate(-1);
    } else toast('삭제하지 못했어요. 다시 시도해 주세요');
  };

  // window.prompt는 토스 WebView에서 동작을 보장하지 않아 화면 안 입력칸을 쓴다
  const [paidDraft, setPaidDraft] = useState<string | null>(null);
  const editPaid = () => setPaidDraft(rec.actualPaidWon?.toString() ?? '');
  const savePaid = async () => {
    const v = (paidDraft ?? '').replace(/[^0-9]/g, '');
    if (await commit((s) => setActualPaid(s, rec.id, v ? Number(v) : null))) setPaidDraft(null);
    else toast('저장하지 못했어요');
  };
  const paidEditor =
    paidDraft != null ? (
      <div className="paid-edit">
        <span className="rate-input boxed">
          <input
            inputMode="numeric"
            autoFocus
            placeholder="정산기에서 확인한 금액"
            value={paidDraft ? Number(paidDraft).toLocaleString('ko-KR') : ''}
            onChange={(ev) => setPaidDraft(ev.target.value.replace(/[^0-9]/g, '').slice(0, 8))}
          />
          <span className="rate-unit">원</span>
        </span>
        <Button small onClick={savePaid}>
          저장
        </Button>
      </div>
    ) : null;

  const loc = rec.location;

  return (
    <Screen footer={active ? <Button onClick={() => navigate(`/record/${rec.id}/end`)}>주차 종료하기</Button> : undefined}>
      <Header
        title="주차 기록"
        right={
          <button className="icon-btn" aria-label="더보기" onClick={() => setMenu((m) => !m)}>
            <Icon name="more" size={24} stroke={3} />
          </button>
        }
      />
      {menu && (
        <div className="menu" role="menu">
          <button role="menuitem" onClick={() => navigate(`/park/${rec.id}/edit`)}>
            <Icon name="edit" size={18} /> 주차 정보 수정
          </button>
          {active && (
            <button role="menuitem" onClick={() => navigate('/rate')}>
              <Icon name="won" size={18} /> 요금표 {rec.rate ? '수정' : '입력'}
            </button>
          )}
          {rec.hasPhoto && (
            <button
              role="menuitem"
              onClick={() => {
                setMenu(false);
                removePhoto();
              }}
            >
              <Icon name="image" size={18} /> 사진 지우기
            </button>
          )}
          <button role="menuitem" className="danger" onClick={remove}>
            <Icon name="trash" size={18} /> 기록 삭제
          </button>
        </div>
      )}

      <div className="detail-photo">
        {photo ? <img src={photo} alt="주차 위치 주변 사진" /> : <NoPhotoArt />}
        <button type="button" className="photo-cam" aria-label={rec.hasPhoto ? '사진 다시 찍기' : '사진 찍기'} onClick={shoot}>
          <Icon name="camera" size={20} color="#fff" />
        </button>
      </div>

      <div className="detail-place">
        <Icon name="pin" size={22} color="var(--c-text)" />
        <div>
          <strong>{placeTitle(rec)}</strong>
          <span className="muted">
            {loc ? `GPS 기록됨${loc.accuracyM != null ? ` · 측정 오차 약 ${Math.round(loc.accuracyM)}m` : ''}` : '위치 직접 입력'}
          </span>
        </div>
      </div>

      <div className="rows">
        <Row icon="layers" label="층" value={rec.floor || '미입력'} onClick={() => navigate(`/park/${rec.id}/edit`)} />
        <Row icon="grid" label="구역" value={rec.zone || '미입력'} onClick={() => navigate(`/park/${rec.id}/edit`)} />
        <Row icon="parking" label="기둥/면 번호" value={rec.spot || '미입력'} onClick={() => navigate(`/park/${rec.id}/edit`)} />
      </div>

      {rec.note && <p className="detail-note">{rec.note}</p>}

      {loc && (
        <div className="btn-row">
          <Button
            variant="soft"
            small
            icon="map"
            onClick={() => openExternal(mapUrl(loc.lat, loc.lng, placeTitle(rec))).catch(() => toast('지도를 열 수 없어요. 좌표를 복사해 주세요'))}
          >
            지도에서 보기
          </Button>
          <Button
            variant="soft"
            small
            icon="copy"
            onClick={async () => toast((await copyText(`${loc.lat.toFixed(6)}, ${loc.lng.toFixed(6)}`)) ? '좌표를 복사했어요' : `복사하지 못했어요: ${loc.lat.toFixed(6)}, ${loc.lng.toFixed(6)}`)}
          >
            좌표 복사
          </Button>
        </div>
      )}

      <Card className="time-card">
        <div className="time-card-head">
          <Icon name="clock" size={18} color="var(--c-primary)" /> 주차 시작 시간
        </div>
        <div className="time-card-value">{dateTimeLabel(rec.startedAt)}</div>
        {rec.endedAt && <div className="time-card-sub">종료 {dateTimeLabel(rec.endedAt)}</div>}
        <div className="time-card-sub">{e.invalid ? '기기 시각이 시작 시각보다 빨라요. 시작 시각을 확인해 주세요' : `${active ? '경과' : '총 주차'} ${durationLabel(e.totalMinutes)}`}</div>
      </Card>

      {fee.status === 'OK' && (
        <div className="rows">
          <Row icon="won" label="예상 요금" value={`${won(fee.amountWon)}${fee.isCapped ? ' (최대)' : ''}`} onClick={active ? () => navigate('/rate') : undefined} />
          {!active && <Row icon="receipt" label="실제 정산 금액" value={rec.actualPaidWon != null ? won(rec.actualPaidWon) : '입력하기'} onClick={editPaid} />}
        </div>
      )}
      {fee.status !== 'OK' && !active && (
        <div className="rows">
          <Row icon="receipt" label="실제 정산 금액" value={rec.actualPaidWon != null ? won(rec.actualPaidWon) : '입력하기'} onClick={editPaid} />
        </div>
      )}
      {paidEditor}
      {fee.status === 'OK' && <p className="hint">사용자가 입력한 요금표 기준 · 실제 정산 금액과 다를 수 있어요</p>}
      {active && fee.status === 'NOT_CONFIGURED' && (
        <button type="button" className="link-card" onClick={() => navigate('/rate')}>
          <Icon name="won" size={18} color="var(--c-primary)" /> 요금표를 입력하면 예상 요금을 볼 수 있어요
          <Icon name="chevron-right" size={16} />
        </button>
      )}
      {loc && <Notice>GPS는 주차장 주변 위치예요. 지하 주차면까지는 층·구역·번호와 사진으로 찾아 주세요.</Notice>}
    </Screen>
  );
}
