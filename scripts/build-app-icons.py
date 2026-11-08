# 사용자 제공 시안(docs/design/reference.webp) 왼쪽 위 앱 아이콘을 그대로 잘라 앱 아이콘 세트를 만든다(다시 그리지 않음).
# 사용: npm run icons   (Pillow 필요: python -m pip install Pillow)
# 산출:
#   assets/brand/icon-source.png        잘라낸 원본(1024, 둥근 사각 밖은 흰색)
#   assets/brand/console-icon-600.png   앱인토스 콘솔 앱 로고(600×600, 흰 배경 꽉 참 — 플랫폼이 모서리를 둥글린다)
#   public/brand/logo.png               앱 안 로고(512, 둥근 사각 밖은 투명)
#   public/favicon.png                  브라우저 탭(64)
#   public/brand/og-image.png           공유 미리보기(1200×630)
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'docs' / 'design' / 'reference.webp'
# 측정값(1254×1254 시안): 아이콘 흰 둥근 사각 경계. 가로줄 y=130에서 x=64~274, 세로줄 x=170에서 y=25~234
BOX = (64, 25, 275, 236)
RADIUS = 0.22  # 한 변 대비 모서리 반경(시안 실측 근사)


def main() -> None:
    src = Image.open(SRC).convert('RGB')
    art = src.crop(BOX).resize((1024, 1024), Image.LANCZOS)

    # 둥근 사각 마스크: 테두리 선·그림자는 22px 안쪽으로 잘라 버린다
    shape = Image.new('L', (1024, 1024), 0)
    ImageDraw.Draw(shape).rounded_rectangle((22, 22, 1001, 1001), radius=int(1024 * RADIUS), fill=255)
    shape = shape.filter(ImageFilter.GaussianBlur(1.5))

    white = Image.new('RGB', art.size, (255, 255, 255))
    full = Image.composite(art, white, shape)
    brand = ROOT / 'assets' / 'brand'
    full.save(brand / 'icon-source.png', optimize=True)
    full.resize((600, 600), Image.LANCZOS).save(brand / 'console-icon-600.png', optimize=True)

    out = ROOT / 'public' / 'brand'
    out.mkdir(parents=True, exist_ok=True)
    logo = art.convert('RGBA')
    logo.putalpha(shape)
    logo.resize((512, 512), Image.LANCZOS).save(out / 'logo.png', optimize=True)
    logo.resize((64, 64), Image.LANCZOS).save(ROOT / 'public' / 'favicon.png', optimize=True)

    og = Image.new('RGB', (1200, 630), (244, 247, 252))
    icon = logo.resize((440, 440), Image.LANCZOS)
    og.paste(icon, ((1200 - 440) // 2, (630 - 440) // 2), icon)
    og.save(out / 'og-image.png', optimize=True)
    print('icons → assets/brand/console-icon-600.png, public/brand/logo.png, public/favicon.png, public/brand/og-image.png')


if __name__ == '__main__':
    main()
