// 주차 시작(새 기록)·주차 정보 수정. 한 화면에서 위치(선택)·층·구역·번호·사진(선택)·메모를 받고 저장한다.
import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { useOverlay } from '../components/overlay';
import { Button, Chip, Header, Notice, Screen } from '../components/ui';
import { describeRule } from '../domain/fee';
import { findRecord, setPhotoFlag, startParking, updateRecord, type RecordDraft } from '../domain/records';
import { dateTimeLabel, fromLocalInput, toLocalInput } from '../domain/time';
import { FLOOR_OPTIONS, LIMITS, type ParkingLocation, type RateRule } from '../domain/types';
import { compressPhoto } from '../platform/image';
import { getLocationOnce, takePhoto } from '../platform/toss';
import { useApp } from '../state/store';

type LocState = 'idle' | 'locating' | 'done' | 'denied' | 'unavailable';
const POOR_ACCURACY_M = 50;

export function Editor() {
  const { id } = useParams();
  const { state } = useApp();
  if (id && !findRecord(state, id)) return <Navigate to="/" replace />;
  return <EditorForm key={id ?? 'new'} id={id} />;
}

function EditorForm({ id }: { id?: string }) {
  const navigate = useNavigate();
  const { state, commit, putPhoto } = useApp();
  const { toast, confirm } = useOverlay();
  const editing = id ? findRecord(state, id) : null;

  const [placeName, setPlaceName] = useState(editing?.placeName ?? '');
  const initialFloor = editing?.floor ?? '';
  const [floor, setFloor] = useState(initialFloor && !FLOOR_OPTIONS.includes(initialFloor as never) ? '기타' : initialFloor);
  const [floorOther, setFloorOther] = useState(initialFloor && !FLOOR_OPTIONS.includes(initialFloor as never) ? initialFloor : '');
  const [zone, setZone] = useState(editing?.zone ?? '');
  const [spot, setSpot] = useState(editing?.spot ?? '');
  const [note, setNote] = useState(editing?.note ?? '');
  const [startedAt, setStartedAt] = useState(editing?.startedAt ?? new Date().toISOString());
  const [editTime, setEditTime] = useState(false);
  const [location, setLocation] = useState<ParkingLocation | null>(editing?.location ?? null);
  const [locState, setLocState] = useState<LocState>(editing?.location ? 'done' : 'idle');
  const [photo, setPhoto] = useState<string | null>(null);
  const [rate, setRate] = useState<RateRule | null>(null);
  const [rateName, setRateName] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const locate = async () => {
    if (locState === 'locating') return;
    setLocState('locating');
    const r = await getLocationOnce();
    if (r.ok) {
      setLocation({ ...r.fix, capturedAt: new Date().toISOString() });
      setLocState('done');
    } else setLocState(r.reason);
  };

  const shoot = async () => {
    const r = await takePhoto();
    if (!r.ok) {
      if (r.reason === 'denied') toast('카메라 권한이 없어 사진을 찍을 수 없어요');
      else if (r.reason === 'unavailable') toast('지금은 사진을 찍을 수 없어요');
      return;
    }
    const small = await compressPhoto(r.dataUri);
    if (!small) return toast('사진이 너무 커서 저장할 수 없어요');
    setPhoto(small);
  };

  const draft = (): RecordDraft => ({
    placeName,
    floor: floor === '기타' ? floorOther : floor,
    zone,
    spot,
    note,
    startedAt,
    location,
    rate,
  });

  const save = async () => {
    if (saving) return;
    if (Date.parse(startedAt) > Date.now() + 60_000) return toast('주차 시작 시각이 지금보다 늦어요');
    setSaving(true);
    try {
      if (editing) {
        const ok = await commit((s) => updateRecord(s, editing.id, draft()));
        if (!ok) return toast('저장하지 못했어요. 다시 시도해 주세요');
        toast('수정했어요');
        navigate(-1);
        return;
      }
      if (state.active) {
        const yes = await confirm({
          title: '진행 중인 주차를 끝낼까요?',
          message: '새 주차를 시작하면 지금 진행 중인 주차는 현재 시각으로 종료되어 기록에 저장돼요.',
          confirmText: '끝내고 새로 시작',
        });
        if (!yes) return;
      }
      const newId = crypto.randomUUID();
      const nowIso = new Date().toISOString();
      const ok = await commit((s) => startParking(s, draft(), newId, nowIso));
      if (!ok) return toast('저장하지 못했어요. 입력한 내용은 그대로 있어요');
      if (photo) {
        const saved = await putPhoto(newId, photo);
        if (saved) await commit((s) => setPhotoFlag(s, newId, true));
        else toast('사진은 저장하지 못했어요(기록은 저장됨)');
      }
      navigate('/timer', { replace: true });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen
      footer={
        <Button onClick={save} disabled={saving}>
          {editing ? '수정 완료' : '주차 시작 및 저장'}
        </Button>
      }
    >
      <Header title={editing ? '주차 정보 수정' : '주차 시작하기'} />
      <div className="form">
        {!editing && <p className="form-lead">주차 위치와 시간을 한 번에 기록해 두세요.</p>}

        <section className="field-card">
          <div className="field-card-head">
            <Icon name="gps" size={20} color="var(--c-primary)" />
            <strong>현재 위치</strong>
            <span className="muted">선택</span>
          </div>
          <LocationStatus state={locState} location={location} />
          <div className="btn-row">
            <Button variant="soft" small icon="gps" onClick={locate} disabled={locState === 'locating'}>
              {locState === 'locating' ? '위치 확인 중…' : location ? '다시 가져오기' : '현재 위치 가져오기'}
            </Button>
            {location && (
              <Button
                variant="ghost"
                small
                onClick={() => {
                  setLocation(null);
                  setLocState('idle');
                }}
              >
                위치 지우기
              </Button>
            )}
          </div>
        </section>

        <label className="field">
          <span className="field-label">주차장 / 건물명</span>
          <input value={placeName} maxLength={LIMITS.placeName} placeholder="예: 스타필드 하남" onChange={(e) => setPlaceName(e.target.value)} />
        </label>

        <div className="field">
          <span className="field-label">층</span>
          <div className="chips">
            {[...FLOOR_OPTIONS, '기타'].map((f) => (
              <Chip key={f} active={floor === f} onClick={() => setFloor(floor === f ? '' : f)}>
                {f}
              </Chip>
            ))}
          </div>
          {floor === '기타' && <input value={floorOther} maxLength={LIMITS.floor} placeholder="예: B6, 옥상, M층" onChange={(e) => setFloorOther(e.target.value)} />}
        </div>

        <div className="field-pair">
          <label className="field">
            <span className="field-label">구역</span>
            <input value={zone} maxLength={LIMITS.zone} placeholder="예: A구역" onChange={(e) => setZone(e.target.value)} />
          </label>
          <label className="field">
            <span className="field-label">기둥 / 면 번호</span>
            <input value={spot} maxLength={LIMITS.spot} placeholder="예: 12번" onChange={(e) => setSpot(e.target.value)} />
          </label>
        </div>

        {!editing && (
          <div className="field">
            <span className="field-label">
              주변 사진 <span className="muted">선택</span>
            </span>
            {photo ? (
              <div className="photo-preview">
                <img src={photo} alt="찍은 주변 사진" />
                <button type="button" className="photo-remove" aria-label="사진 지우기" onClick={() => setPhoto(null)}>
                  <Icon name="x" size={18} color="#fff" />
                </button>
              </div>
            ) : (
              <button type="button" className="photo-add" onClick={shoot}>
                <Icon name="camera" size={22} color="var(--c-primary)" />
                기둥·층 표지판을 찍어 두면 찾기 쉬워요
              </button>
            )}
          </div>
        )}

        <label className="field">
          <span className="field-label">
            메모 <span className="muted">선택</span>
          </span>
          <textarea value={note} maxLength={LIMITS.note} rows={2} placeholder="예: 엘리베이터 옆, 노란 기둥" onChange={(e) => setNote(e.target.value)} />
        </label>

        <div className="field">
          <span className="field-label">주차 시작 시각</span>
          {editTime ? (
            <input
              type="datetime-local"
              value={toLocalInput(startedAt)}
              max={toLocalInput(new Date().toISOString())}
              onChange={(e) => {
                const v = fromLocalInput(e.target.value);
                if (v) setStartedAt(v);
              }}
            />
          ) : (
            <div className="time-line">
              <Icon name="clock" size={18} color="var(--c-primary)" />
              <span>{dateTimeLabel(startedAt)}</span>
              <button type="button" className="link-btn" onClick={() => setEditTime(true)}>
                시각 바꾸기
              </button>
            </div>
          )}
        </div>

        {!editing && state.rateProfiles.length > 0 && (
          <div className="field">
            <span className="field-label">
              저장한 요금표 적용 <span className="muted">선택</span>
            </span>
            <div className="chips">
              <Chip
                active={rateName == null}
                onClick={() => {
                  setRate(null);
                  setRateName(null);
                }}
              >
                적용 안 함
              </Chip>
              {state.rateProfiles.map((p) => (
                <Chip
                  key={p.name}
                  active={rateName === p.name}
                  onClick={() => {
                    setRate(p.rule);
                    setRateName(p.name);
                  }}
                >
                  {p.name}
                </Chip>
              ))}
            </div>
            {rate && <p className="hint">{describeRule(rate)} · 예상 요금 계산이 적용돼요</p>}
          </div>
        )}

        {!editing && <p className="hint center">요금표는 저장 후 타이머 화면에서 언제든 입력할 수 있어요.</p>}
      </div>
    </Screen>
  );
}

function LocationStatus({ state, location }: { state: LocState; location: ParkingLocation | null }) {
  if (state === 'done' && location) {
    const poor = location.accuracyM == null || location.accuracyM > POOR_ACCURACY_M;
    return (
      <div className="loc-status">
        <p className="loc-ok">
          <Icon name="check" size={16} color="var(--c-green)" /> 위치가 기록되었어요
          {location.accuracyM != null && <span className="muted"> · 측정 오차 약 {Math.round(location.accuracyM)}m</span>}
        </p>
        {poor && <p className="loc-warn">실내 주차장에서는 GPS가 부정확할 수 있어요. 주차장명과 층을 직접 입력해 주세요.</p>}
      </div>
    );
  }
  if (state === 'denied') {
    return <p className="loc-warn">위치 권한이 없어요. 권한 없이도 주차장명과 층·구역을 직접 입력해 저장할 수 있어요.</p>;
  }
  if (state === 'unavailable') {
    return <p className="loc-warn">위치를 가져오지 못했어요. 실내에서는 GPS가 잡히지 않을 수 있어요. 직접 입력해도 괜찮아요.</p>;
  }
  return (
    <Notice>
      버튼을 누를 때만 위치를 한 번 확인해요. 주차장 주변 위치를 저장하는 데만 쓰고, 이 기기에만 저장돼요.
    </Notice>
  );
}
