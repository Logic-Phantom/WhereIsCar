import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Thumb } from '../components/ui';
import { placeTitle, spotSummary } from '../domain/records';
import { dateLabel, durationLabel, elapsed, relativeLabel } from '../domain/time';
import type { ParkingRecord } from '../domain/types';

export function RecordItem({ rec, now }: { rec: ParkingRecord; now: number }) {
  const navigate = useNavigate();
  const active = rec.status === 'ACTIVE';
  const e = elapsed(rec.startedAt, now, rec.endedAt);
  return (
    <li>
      <button type="button" className="record-item" onClick={() => navigate(`/record/${rec.id}`)}>
        <Thumb id={rec.id} hasPhoto={rec.hasPhoto} />
        <div className="record-text">
          <strong>
            {placeTitle(rec)}
            {active && <span className="badge">주차 중</span>}
          </strong>
          <span>{spotSummary(rec) || '층·구역 미입력'}</span>
          <span className="muted">
            {dateLabel(rec.startedAt)} · {active ? `${durationLabel(e.totalMinutes)}째` : relativeLabel(rec.endedAt ?? rec.startedAt, now)}
          </span>
        </div>
        <Icon name="chevron-right" size={18} color="var(--c-text-4)" />
      </button>
    </li>
  );
}
