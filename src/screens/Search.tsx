// 검색(시안 4·5번 화면): 검색창 + 범위 칩 + 최근 검색어 + 결과. 이 기기의 기록에서만 찾는다.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Chip, Header, Screen, SectionTitle } from '../components/ui';
import { addRecentSearch, searchRecords, type SearchScope } from '../domain/records';
import { useApp, useNow } from '../state/store';
import { RecordItem } from './RecordItem';

const SCOPES: { value: SearchScope; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'place', label: '주차장' },
  { value: 'spot', label: '층·구역' },
  { value: 'note', label: '메모' },
];

export function Search() {
  const navigate = useNavigate();
  const { state, commit } = useApp();
  const now = useNow(60_000);
  const [q, setQ] = useState('');
  const [scope, setScope] = useState<SearchScope>('all');
  const results = searchRecords(state, q, scope);

  const remember = (text = q) => {
    if (text.trim()) commit((s) => addRecentSearch(s, text));
  };

  return (
    <Screen>
      <Header title="검색" />
      <form
        className="search-box"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          remember();
          (document.activeElement as HTMLElement | null)?.blur();
        }}
      >
        <Icon name="search" size={20} color="var(--c-text-3)" />
        <input type="search" value={q} placeholder="어디에 주차했지?" aria-label="기록 검색" onChange={(e) => setQ(e.target.value)} autoFocus />
        {q && (
          <button type="button" className="icon-btn sm" aria-label="지우기" onClick={() => setQ('')}>
            <Icon name="x" size={16} />
          </button>
        )}
      </form>
      <div className="chips">
        {SCOPES.map((s) => (
          <Chip key={s.value} active={scope === s.value} onClick={() => setScope(s.value)}>
            {s.label}
          </Chip>
        ))}
      </div>

      {!q.trim() && state.recentSearches.length > 0 && (
        <>
          <SectionTitle
            right={
              <button className="link-btn" onClick={() => commit((s) => ({ ...s, recentSearches: [] }))}>
                전체 삭제
              </button>
            }
          >
            최근 검색어
          </SectionTitle>
          <ul className="recent-searches">
            {state.recentSearches.map((s) => (
              <li key={s}>
                <button type="button" onClick={() => setQ(s)}>
                  <Icon name="clock" size={18} color="var(--c-text-3)" />
                  <span>{s}</span>
                  <Icon name="chevron-right" size={16} color="var(--c-text-4)" />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {q.trim() && (
        <>
          <SectionTitle>검색 결과 ({results.length})</SectionTitle>
          {results.length === 0 ? (
            <p className="hint center">‘{q.trim()}’에 맞는 주차 기록이 없어요.</p>
          ) : (
            <ul className="record-list" onClick={() => remember()}>
              {results.map((r) => (
                <RecordItem key={r.id} rec={r} now={now} />
              ))}
            </ul>
          )}
        </>
      )}
      {!q.trim() && state.recentSearches.length === 0 && (
        <div className="search-tip">
          <p>주차장 이름, 층(B2), 구역(A구역), 메모로 지난 주차 기록을 찾을 수 있어요.</p>
          <button type="button" className="link-btn" onClick={() => navigate('/records')}>
            전체 기록 보기 <Icon name="chevron-right" size={14} />
          </button>
        </div>
      )}
    </Screen>
  );
}
