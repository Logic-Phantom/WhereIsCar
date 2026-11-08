// 주차 기록 목록(시안 8번 화면): 전체 / 진행 중 / 완료.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Button, Empty, Header, Screen, Segmented } from '../components/ui';
import { allRecords } from '../domain/records';
import type { ParkingRecord } from '../domain/types';
import { useApp, useNow } from '../state/store';
import { RecordItem } from './RecordItem';

type Filter = 'all' | 'active' | 'done';

export function Records() {
  const navigate = useNavigate();
  const { state } = useApp();
  const now = useNow(60_000);
  const [filter, setFilter] = useState<Filter>('all');
  const list: ParkingRecord[] = filter === 'active' ? (state.active ? [state.active] : []) : filter === 'done' ? state.history : allRecords(state);

  return (
    <Screen tabbar>
      <Header
        title="주차 기록"
        back={false}
        right={
          <button className="icon-btn" aria-label="기록 검색" onClick={() => navigate('/search')}>
            <Icon name="search" size={22} />
          </button>
        }
      />
      <Segmented
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'all', label: '전체' },
          { value: 'active', label: '진행 중' },
          { value: 'done', label: '완료' },
        ]}
      />
      {list.length === 0 ? (
        <Empty
          title={filter === 'active' ? '진행 중인 주차가 없어요' : '아직 주차 기록이 없어요'}
          desc="주차 위치와 시간을 한 번에 기록해 두세요."
          action={
            <Button small onClick={() => navigate('/park/new')}>
              주차 시작하기
            </Button>
          }
        />
      ) : (
        <ul className="record-list">
          {list.map((r) => (
            <RecordItem key={r.id} rec={r} now={now} />
          ))}
        </ul>
      )}
      {state.history.length > 0 && <p className="hint center">최근 50개 기록을 이 기기에 보관해요.</p>}
    </Screen>
  );
}
