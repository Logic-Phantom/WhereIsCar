// 토스 앱 안(WebView)인지 판별하고 SDK 호출을 감싼다(점심합의 platform/toss.ts와 같은 방식).
// SDK는 토스 밖에서 호출하면 throw하므로 window.ReactNativeWebView 유무로 판별해 브라우저 대체 동작을 쓴다.
// 네이티브 기능은 모두 사용자가 버튼을 눌렀을 때만 한 번 호출한다(진입 즉시 권한 요청·폴링 금지).

export const APP_NAME = 'whereiscar'; // apps-in-toss.config.ts appName과 같게

declare global {
  interface Window {
    ReactNativeWebView?: unknown;
  }
}

export function isInToss(): boolean {
  return typeof window !== 'undefined' && window.ReactNativeWebView != null;
}

async function sdk() {
  return import('@apps-in-toss/web-framework');
}

// ── 위치 ────────────────────────────────────────────────

export interface Fix {
  lat: number;
  lng: number;
  accuracyM: number | null;
}
export type LocationResult = { ok: true; fix: Fix } | { ok: false; reason: 'denied' | 'unavailable' };

/**
 * 현재 위치를 한 번 조회한다(구독·백그라운드 수집 없음).
 * 토스: Device.getLocation({ accuracy: Accuracy.High }) — 3.10.0 타입: 권한 없으면 GetCurrentLocationPermissionError(PermissionError 하위).
 * 브라우저 미리보기: navigator.geolocation(10초 제한).
 */
export async function getLocationOnce(): Promise<LocationResult> {
  if (isInToss()) {
    try {
      const { Device, Accuracy, PermissionError } = await sdk();
      try {
        const loc = await Device.getLocation({ accuracy: Accuracy.High });
        return { ok: true, fix: { lat: loc.coords.latitude, lng: loc.coords.longitude, accuracyM: finiteOrNull(loc.coords.accuracy) } };
      } catch (e) {
        return { ok: false, reason: e instanceof PermissionError ? 'denied' : 'unavailable' };
      }
    } catch {
      return { ok: false, reason: 'unavailable' };
    }
  }
  if (!navigator.geolocation) return { ok: false, reason: 'unavailable' };
  return new Promise((done) => {
    navigator.geolocation.getCurrentPosition(
      (p) => done({ ok: true, fix: { lat: p.coords.latitude, lng: p.coords.longitude, accuracyM: finiteOrNull(p.coords.accuracy) } }),
      (err) => done({ ok: false, reason: err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable' }),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 },
    );
  });
}

function finiteOrNull(n: unknown): number | null {
  return typeof n === 'number' && Number.isFinite(n) && n >= 0 ? n : null;
}

// ── 카메라 ──────────────────────────────────────────────

export type PhotoResult = { ok: true; dataUri: string } | { ok: false; reason: 'denied' | 'cancelled' | 'unavailable' };

/** 토스: Device.openCamera({ base64: true, maxWidth: 1024 }) → data URI. 브라우저: 파일 선택(capture). */
export async function takePhoto(): Promise<PhotoResult> {
  if (isInToss()) {
    try {
      const { Device, PermissionError } = await sdk();
      try {
        const img = await Device.openCamera({ base64: true, maxWidth: 1024 });
        if (!img?.dataUri) return { ok: false, reason: 'cancelled' };
        const uri = img.dataUri.startsWith('data:') ? img.dataUri : `data:image/jpeg;base64,${img.dataUri}`;
        return { ok: true, dataUri: uri };
      } catch (e) {
        return { ok: false, reason: e instanceof PermissionError ? 'denied' : 'cancelled' };
      }
    } catch {
      return { ok: false, reason: 'unavailable' };
    }
  }
  return pickFileAsDataUri();
}

function pickFileAsDataUri(): Promise<PhotoResult> {
  return new Promise((done) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.setAttribute('capture', 'environment');
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return done({ ok: false, reason: 'cancelled' });
      const reader = new FileReader();
      reader.onload = () => done({ ok: true, dataUri: String(reader.result) });
      reader.onerror = () => done({ ok: false, reason: 'unavailable' });
      reader.readAsDataURL(file);
    };
    input.click();
  });
}

// ── 지도·복사 ───────────────────────────────────────────

/**
 * 저장한 좌표를 카카오맵 웹 링크로 연다(지도 앱이 있으면 앱으로 열림). 토스: Device.openURL.
 * 앱인토스 서비스 오픈 정책 2-2 '단순 정보 확인을 위한 타사 웹사이트 이동' 허용 범위(점심합의 D-042와 같은 판단). 검수에서 지적되면 좌표 복사만 남긴다.
 */
export function mapUrl(lat: number, lng: number, label: string): string {
  const name = encodeURIComponent((label || '내 차').replace(/,/g, ' '));
  return `https://map.kakao.com/link/map/${name},${lat.toFixed(6)},${lng.toFixed(6)}`;
}

export async function openExternal(url: string): Promise<void> {
  if (isInToss()) {
    const { Device } = await sdk();
    await Device.openURL(url);
    return;
  }
  window.open(url, '_blank', 'noopener');
}

export async function copyText(text: string): Promise<boolean> {
  try {
    if (isInToss()) {
      const { Clipboard } = await sdk();
      await Clipboard.setText(text);
      return true;
    }
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
