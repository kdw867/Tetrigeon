// 센티넬 현재 Idle 시트 분석 (작업 폴더 전용, Unity와 무관): 프레임별 외곽 상자, 색 수, 01과의 차이, 발바닥 줄
const path = require('path');
const p = require('../../PauseUI_VARCO/tools/pix.js');
const SHEET = 'C:/Users/MBC-501-15/Documents/Tetrigeon/Tetrigeon/Assets/@Resources/Enemies/AmethystSentinelIdle/T_AmethystSentinel_Idle.png';
const CELL = 96;
const s = p.decode(SHEET);
console.log('sheet', s.w + 'x' + s.h, 'colors', p.countColors(s));
const fr = [];
for (let i = 0; i < 10; i++) fr.push(p.crop(s, (i % 5) * CELL, Math.floor(i / 5) * CELL, CELL, CELL));
const A = (im, x, y) => im.d[(y * im.w + x) * 4 + 3];
fr.forEach((im, i) => {
  let x0 = 99, y0 = 99, x1 = -1, y1 = -1, n = 0, partial = 0;
  for (let y = 0; y < CELL; y++) for (let x = 0; x < CELL; x++) { const a = A(im, x, y); if (a) { n++; if (a !== 255) partial++; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } }
  let diff = 0; for (let k = 0; k < CELL * CELL * 4; k++) if (im.d[k] !== fr[0].d[k]) { diff++; }
  console.log('frame', String(i + 1).padStart(2, '0'), 'bbox X', x0 + '-' + x1, 'Y', y0 + '-' + y1, 'opaque', n, 'partialAlpha', partial, 'bytesDiffVs01', diff);
});
// 01 의 발바닥(가장 아래 불투명 줄)과 가로 범위
const im = fr[0];
for (let y = 80; y < 92; y++) { let xs = []; for (let x = 0; x < CELL; x++) if (A(im, x, y)) xs.push(x); console.log('row', y, xs.length ? xs[0] + '-' + xs[xs.length - 1] + ' (' + xs.length + ')' : '-'); }
// 팔레트(01)
const cnt = new Map(); for (let i = 0; i < CELL * CELL; i++) if (im.d[i * 4 + 3]) { const k = [im.d[i * 4], im.d[i * 4 + 1], im.d[i * 4 + 2]].join(','); cnt.set(k, (cnt.get(k) || 0) + 1); }
console.log('palette01', cnt.size); [...cnt.entries()].sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(' ', k, v));
// 확대 보기: 01 을 10배, 격자 눈금 없이 / 있는 두 가지
const big = p.nearestUp(im, 10, [38, 44, 58]);
p.encode(big, path.join(__dirname, '..', 'work', 'idle01_x10.png'));
