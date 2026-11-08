// 사진을 저장 전에 줄인다(긴 변 720px, JPEG). 저장소 한도가 공식 문서에 없어 작은 크기(≈250KB 이하)로 제한한다.
export const PHOTO_MAX_CHARS = 350_000;

export async function compressPhoto(dataUri: string): Promise<string | null> {
  try {
    const img = await load(dataUri);
    const scale = Math.min(1, 720 / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, w, h);
    for (const q of [0.7, 0.55, 0.4]) {
      const out = canvas.toDataURL('image/jpeg', q);
      if (out.length <= PHOTO_MAX_CHARS) return out;
    }
    return null;
  } catch {
    return null;
  }
}

function load(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
