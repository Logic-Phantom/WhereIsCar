// 앱 상태 컨텍스트: 시작할 때 한 번 읽고, 바뀔 때마다 저장한다. 저장에 실패하면 화면 상태를 되돌리고 false를 돌려준다.
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Change } from '../domain/records';
import { emptyState, type AppState } from '../domain/types';
import { store as kv } from '../storage/kv';
import { loadPhoto, loadState, removePhotos, savePhoto, saveState, wipeAll } from '../storage/repository';

type Updater = (s: AppState) => AppState | Change;

interface Ctx {
  ready: boolean;
  corrupted: boolean;
  state: AppState;
  commit: (fn: Updater) => Promise<boolean>;
  photo: (id: string) => Promise<string | null>;
  putPhoto: (id: string, dataUri: string) => Promise<boolean>;
  dropPhoto: (id: string) => Promise<void>;
  wipe: () => Promise<boolean>;
  dismissCorrupted: () => void;
}

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(emptyState);
  const [ready, setReady] = useState(false);
  const [corrupted, setCorrupted] = useState(false);
  const ref = useRef(state);
  ref.current = state;
  const photoCache = useRef(new Map<string, string | null>());

  useEffect(() => {
    loadState(kv).then((r) => {
      setState(r.state);
      ref.current = r.state;
      setCorrupted(r.corrupted);
      setReady(true);
    });
  }, []);

  const commit = useCallback(async (fn: Updater) => {
    const prev = ref.current;
    const out = fn(prev);
    const change: Change = 'dropPhotos' in out ? out : { state: out, dropPhotos: [] };
    ref.current = change.state;
    setState(change.state);
    try {
      await saveState(kv, change.state);
    } catch {
      ref.current = prev;
      setState(prev);
      return false;
    }
    if (change.dropPhotos.length) {
      for (const id of change.dropPhotos) photoCache.current.delete(id);
      await removePhotos(kv, change.dropPhotos);
    }
    return true;
  }, []);

  const photo = useCallback(async (id: string) => {
    if (photoCache.current.has(id)) return photoCache.current.get(id) ?? null;
    const v = await loadPhoto(kv, id);
    photoCache.current.set(id, v);
    return v;
  }, []);

  const putPhoto = useCallback(async (id: string, dataUri: string) => {
    try {
      await savePhoto(kv, id, dataUri);
      photoCache.current.set(id, dataUri);
      return true;
    } catch {
      return false;
    }
  }, []);

  const dropPhoto = useCallback(async (id: string) => {
    photoCache.current.delete(id);
    await removePhotos(kv, [id]);
  }, []);

  const wipe = useCallback(async () => {
    try {
      await wipeAll(kv, ref.current);
    } catch {
      return false;
    }
    photoCache.current.clear();
    const next = { ...emptyState(), onboarded: true };
    ref.current = next;
    setState(next);
    try {
      await saveState(kv, next);
    } catch {
      /* 다음 변경 때 다시 저장 */
    }
    return true;
  }, []);

  return (
    <AppCtx.Provider value={{ ready, corrupted, state, commit, photo, putPhoto, dropPhoto, wipe, dismissCorrupted: () => setCorrupted(false) }}>
      {children}
    </AppCtx.Provider>
  );
}

export function useApp(): Ctx {
  const c = useContext(AppCtx);
  if (!c) throw new Error('AppProvider 밖에서 useApp 호출');
  return c;
}

/** 화면이 열려 있는 동안만 주기적으로 현재 시각을 갱신한다(데이터의 원천이 아님 — 계산은 항상 startedAt 기준). */
export function useNow(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const t = window.setInterval(tick, intervalMs);
    const onVis = () => document.visibilityState === 'visible' && tick();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.clearInterval(t);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [intervalMs]);
  return now;
}

/** 기록 사진(없으면 null). 화면에서 바로 쓰는 훅. */
export function usePhoto(id: string | undefined, hasPhoto: boolean | undefined, version = 0): string | null {
  const { photo } = useApp();
  const [uri, setUri] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    if (!id || !hasPhoto) {
      setUri(null);
      return;
    }
    photo(id).then((v) => alive && setUri(v));
    return () => {
      alive = false;
    };
  }, [id, hasPhoto, photo, version]);
  return uri;
}
