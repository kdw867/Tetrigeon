// VARCO 결과 -> 원본 도트 1칸=1px (v2, 작업 폴더 전용). v1과 달리 "색 분포를 원본 Idle 01에 맞춤":
//  돌·윤곽 / 보라 수정 / 청록 코어 세 부류를 따로, 밝기 순위(분위)를 원본 Idle 01의 같은 부류 분포에 대응시켜 팔레트 색을 정함.
//  그 뒤 겉 한 겹(4방향 이웃 중 투명이 있는 픽셀)을 윤곽색으로 정리해 "테두리의 흰 점"을 없앰.
const fs = require('fs'), path = require('path');
const p = require('../../PauseUI_VARCO/tools/pix.js');
const SHEET = 'C:/Users/MBC-501-15/Documents/Tetrigeon/Tetrigeon/Assets/@Resources/Enemies/AmethystSentinelIdle/T_AmethystSentinel_Idle.png';
const DARK = [16, 18, 28], MIDPURPLE = [181, 71, 232];
const lum = (c) => 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2];
const d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
// 부류: 청록(코어·눈) / 보라(수정) / 돌·윤곽
const kind = (c) => (c[1] > 140 && c[2] > 180 && c[0] < 150 && c[1] > c[0] + 60) ? 'cyan' : ((c[2] - c[1] > 55 && c[0] > 40 && c[2] > 90) ? 'purple' : 'stone');

// 원본 Idle 01 의 부류별 색 목록 (밝기 순)
function originalLists() {
  const s = p.decode(SHEET), f = p.crop(s, 0, 0, 96, 96), L = { stone: [], purple: [], cyan: [] };
  for (let i = 0; i < 96 * 96; i++) if (f.d[i * 4 + 3]) { const c = [f.d[i * 4], f.d[i * 4 + 1], f.d[i * 4 + 2]]; L[kind(c)].push(c); }
  for (const k in L) L[k].sort((a, b) => lum(a) - lum(b) || a[0] - b[0] || a[1] - b[1]);
  return L;
}
const ORIG = originalLists();
const PAL = [...new Set([...ORIG.stone, ...ORIG.purple, ...ORIG.cyan].map(c => c.join(',')))].map(k => k.split(',').map(Number));

function snap(file, pitch, opt = {}) {
  const im = p.decode(file), W = im.w, H = im.h;
  const px = (x, y) => { const o = (Math.min(H - 1, y) * W + Math.min(W - 1, x)) * 4; return [im.d[o], im.d[o + 1], im.d[o + 2]]; };
  const isBg = c => c[0] > 232 && c[1] > 232 && c[2] > 232;
  const phase = (hor) => { const e = new Array(pitch).fill(0); if (hor) { for (let y = 0; y < H; y += 2) for (let x = 1; x < W; x++) e[x % pitch] += Math.sqrt(d2(px(x - 1, y), px(x, y))); } else { for (let x = 0; x < W; x += 2) for (let y = 1; y < H; y++) e[y % pitch] += Math.sqrt(d2(px(x, y - 1), px(x, y))); } return e.indexOf(Math.max(...e)); };
  const px0 = phase(true), py0 = phase(false), cols = Math.floor((W - px0) / pitch), rows = Math.floor((H - py0) / pitch);
  const blocks = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const cx = px0 + c * pitch + (pitch >> 1), cy = py0 + r * pitch + (pitch >> 1); let sr = 0, sg = 0, sb = 0, n = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const q = px(cx + dx, cy + dy); sr += q[0]; sg += q[1]; sb += q[2]; n++; }
    const m = [sr / n, sg / n, sb / n]; if (isBg(m)) continue; blocks.push({ r, c, m, k: kind(m) });
  }
  // 부류별 분위 대응
  const out = p.blank(cols, rows);
  for (const k of ['stone', 'purple', 'cyan']) {
    const list = blocks.filter(b => b.k === k).sort((a, b) => lum(a.m) - lum(b.m) || a.r - b.r || a.c - b.c); if (!list.length) continue;
    list.forEach((b, i) => { let col; if (k === 'cyan' || !opt.match) { let best = 0, bd = 1e9; PAL.forEach((q, j) => { const dd = d2(b.m, q); if (dd < bd) { bd = dd; best = j; } }); col = PAL[best]; } else { const O = ORIG[k]; col = O[Math.min(O.length - 1, Math.floor((i + 0.5) / list.length * O.length))]; } const o = (b.r * cols + b.c) * 4; out.d[o] = col[0]; out.d[o + 1] = col[1]; out.d[o + 2] = col[2]; out.d[o + 3] = 255; });
  }
  return { img: out, phase: [px0, py0], cols, rows, counts: { stone: blocks.filter(b => b.k === 'stone').length, purple: blocks.filter(b => b.k === 'purple').length, cyan: blocks.filter(b => b.k === 'cyan').length } };
}

// 겉 한 겹 정리: 돌 색이면 윤곽색, 아주 밝은 보라(연분홍)·밝은 회색이면 이웃 중 가장 흔한 중간 보라 또는 윤곽색
function rimFix(img) {
  const W = img.w, H = img.h, d = img.d, A = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? 0 : d[(y * W + x) * 4 + 3];
  const edge = []; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (A(x, y) && (!A(x - 1, y) || !A(x + 1, y) || !A(x, y - 1) || !A(x, y + 1))) edge.push([x, y]);
  let changed = 0;
  edge.forEach(([x, y]) => {
    const o = (y * W + x) * 4, c = [d[o], d[o + 1], d[o + 2]], k = kind(c);
    if (k === 'cyan') return;
    if (k === 'stone') { if (lum(c) > 38) { d[o] = DARK[0]; d[o + 1] = DARK[1]; d[o + 2] = DARK[2]; changed++; } return; } // 겉 돌 픽셀은 가장 어두운 윤곽 계열로
    if (lum(c) > 150) { // 너무 밝은 보라(연분홍 하이라이트)가 겉에 있으면 안쪽 이웃의 중간 보라로
      let best = null; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!(dx || dy) || !A(x + dx, y + dy)) continue; const q = ((y + dy) * W + x + dx) * 4, cc = [d[q], d[q + 1], d[q + 2]]; if (kind(cc) === 'purple' && lum(cc) <= 150 && lum(cc) > 60) best = cc; }
      const t = best || DARK; d[o] = t[0]; d[o + 1] = t[1]; d[o + 2] = t[2]; changed++;
    }
  });
  return changed;
}
module.exports = { snap, rimFix, kind, lum, ORIG, PAL, DARK };
if (require.main === module) {
  const file = process.argv[2], pitch = +process.argv[3] || 7, name = path.basename(file, '.png');
  const r = snap(file, pitch, { match: true }); const fix = rimFix(r.img);
  p.encode(r.img, path.join(__dirname, '..', 'work', 'snap2_' + name + '.png'));
  console.log(name, 'grid', r.cols + 'x' + r.rows, 'phase', r.phase, 'counts', JSON.stringify(r.counts), 'rim', fix);
}
