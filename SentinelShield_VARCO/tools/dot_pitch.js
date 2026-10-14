// VARCO 결과 이미지의 도트 한 칸 크기(px)와 캐릭터 바운딩 박스 추정 (작업 폴더 전용)
const p = require('../../PauseUI_VARCO/tools/pix.js');
const file = process.argv[2];
const im = p.decode(file);
const W = im.w, H = im.h;
const px = (x, y) => { const o = (y * W + x) * 4; return [im.d[o], im.d[o + 1], im.d[o + 2], im.d[o + 3]]; };
const isBg = (c) => c[0] > 235 && c[1] > 235 && c[2] > 235;
let x0 = W, y0 = H, x1 = 0, y1 = 0;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!isBg(px(x, y))) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
console.log(file.split(/[\/]/).pop(), W + 'x' + H, 'char bbox', x0, y0, x1, y1, 'size', x1 - x0 + 1, 'x', y1 - y0 + 1);
// 색이 크게 바뀌는 지점 사이 거리(런 길이) 히스토그램
const dist = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
const hist = new Map();
for (let y = y0; y <= y1; y += 3) {
  let start = x0, prev = px(x0, y);
  for (let x = x0 + 1; x <= x1; x++) { const c = px(x, y); if (dist(c, prev) > 60) { const len = x - start; if (len > 2 && len < 40) hist.set(len, (hist.get(len) || 0) + 1); start = x; } prev = c; }
}
console.log('run-length top', [...hist.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(e => e.join(':')).join('  '));
