// assets/brand/icon.svg(직접 그린 벡터 원본) 하나에서 앱인토스 콘솔 로고·파비콘·OG 이미지를 만든다.
// 사용: npm run icons
// 산출:
//   assets/brand/console-icon-600.png  콘솔 앱 로고(600×600, 흰 배경 꽉 참 — 플랫폼이 모서리를 직접 둥글린다)
//   public/brand/icon.svg              앱 안 로고(원본 복사)
//   public/favicon.png                 브라우저 탭(64)
//   public/brand/og-image.png          공유 미리보기(1200×630, 흰 배경 가운데 아이콘)
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { Resvg } from '@resvg/resvg-js';

const ROOT = resolve(import.meta.dirname, '..');
const SRC = join(ROOT, 'assets/brand/icon.svg');
const svg = readFileSync(SRC, 'utf8');

function png(source, width) {
  return new Resvg(source, { fitTo: { mode: 'width', value: width }, background: 'rgba(0,0,0,0)' }).render().asPng();
}

// 콘솔 로고: 둥근 모서리 없이 흰 정사각
const square = svg.replace(/<rect id="bg"[^>]*\/>/, '<rect id="bg" width="1024" height="1024" fill="#FFFFFF"/>');
writeFileSync(join(ROOT, 'assets/brand/console-icon-600.png'), png(square, 600));

mkdirSync(join(ROOT, 'public/brand'), { recursive: true });
copyFileSync(SRC, join(ROOT, 'public/brand/icon.svg'));
writeFileSync(join(ROOT, 'public/favicon.png'), png(svg, 64));

const inner = svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
const og = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <rect width="1200" height="630" fill="#F4F7FC"/>
  <g transform="translate(375 90) scale(0.4394)">${inner}</g>
</svg>`;
writeFileSync(join(ROOT, 'public/brand/og-image.png'), png(og, 1200));
console.log('icons → assets/brand/console-icon-600.png, public/favicon.png, public/brand/og-image.png');
