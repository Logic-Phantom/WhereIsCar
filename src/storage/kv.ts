// 키-값 저장소 어댑터(점심합의 storage/kv.ts와 같은 구조).
// 토스: SDK Storage(기기 로컬, 앱 종료 후에도 유지, 기기 변경·앱 삭제 시 사라짐) / 브라우저 미리보기: localStorage.
// 읽기 실패는 null. 쓰기 실패는 호출한 쪽이 알 수 있게 throw한다(입력값을 지키고 다시 시도하도록).
import { isInToss } from '../platform/toss';

export interface KeyValueStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

const tossStore: KeyValueStore = {
  async get(key) {
    const { Storage } = await import('@apps-in-toss/web-framework');
    return Storage.getItem(key);
  },
  async set(key, value) {
    const { Storage } = await import('@apps-in-toss/web-framework');
    await Storage.setItem(key, value);
  },
  async remove(key) {
    const { Storage } = await import('@apps-in-toss/web-framework');
    await Storage.removeItem(key);
  },
};

const webStore: KeyValueStore = {
  async get(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  async set(key, value) {
    localStorage.setItem(key, value);
  },
  async remove(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* 저장 불가 환경 */
    }
  },
};

export function memoryStore(): KeyValueStore {
  const m = new Map<string, string>();
  return {
    async get(k) {
      return m.get(k) ?? null;
    },
    async set(k, v) {
      m.set(k, v);
    },
    async remove(k) {
      m.delete(k);
    },
  };
}

function safeRead(store: KeyValueStore): KeyValueStore {
  return {
    async get(k) {
      try {
        return await store.get(k);
      } catch {
        return null;
      }
    },
    set: (k, v) => store.set(k, v),
    async remove(k) {
      try {
        await store.remove(k);
      } catch {
        /* 무시 */
      }
    },
  };
}

export const store: KeyValueStore = safeRead(isInToss() ? tossStore : webStore);
