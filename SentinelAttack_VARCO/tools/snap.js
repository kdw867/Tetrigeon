// VARCO 결과(도트 7px 격자)를 원본 도트 1칸=1px 이미지로 되돌림: 격자 위상 탐지 → 블록 중앙 색 샘플 → 원본 팔레트로 치환 (작업 폴더 전용)
const fs = require('fs'), path = require('path');
const p = require('../../PauseUI_VARCO/tools/pix.js');
const SHEET = 'C:/Users/MBC-501-15/Documents/Tetrigeon/Tetrigeon/Assets/@Resources/Enemies/AmethystSentinelIdle/T_AmethystSentinel_Idle.png';

// 원본 Idle 시트에서 쓰는 모든 색 = 허용 팔레트
function palette() {
  const s = p.decode(SHEET), set = new Map();
  for (let i = 0; i < s.w * s.h; i++) if (s.d[i * 4 + 3]) { const k = s.d[i * 4] + ',' + s.d[i * 4 + 1] + ',' + s.d[i * 4 + 2]; set.set(k, (set.get(k) || 0) + 1); }
  return [...set.keys()].map(k => k.split(',').map(Number));
}
const d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;

function snap(file, pitch, opt = {}) {
  const im = p.decode(file), W = im.w, H = im.h, PAL = palette();
  const px = (x, y) => { const o = (Math.min(H - 1, y) * W + Math.min(W - 1, x)) * 4; return [im.d[o], im.d[o + 1], im.d[o + 2]]; };
  const isBg = c => c[0] > 232 && c[1] > 232 && c[2] > 232;
  // 격자 위상: 블록 경계에서 색 차이가 가장 큰 오프셋
  const phase = (horizontal) => {
    const e = new Array(pitch).fill(0);
    if (horizontal) { for (let y = 0; y < H; y += 2) for (let x = 1; x < W; x++) e[x % pitch] += Math.sqrt(d2(px(x - 1, y), px(x, y))); }
    else { for (let x = 0; x < W; x += 2) for (let y = 1; y < H; y++) e[y % pitch] += Math.sqrt(d2(px(x, y - 1), px(x, y))); }
    return e.indexOf(Math.max(...e));
  };
  const px0 = phase(true), py0 = phase(false);
  const cols = Math.floor((W - px0) / pitch), rows = Math.floor((H - py0) / pitch);
  const out = p.blank(cols, rows);
  let nonPal = 0;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    // 블록 중앙 3x3 평균 색
    const cx = px0 + c * pitch + (pitch >> 1), cy = py0 + r * pitch + (pitch >> 1);
    let sr = 0, sg = 0, sb = 0, n = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const q = px(cx + dx, cy + dy); sr += q[0]; sg += q[1]; sb += q[2]; n++; }
    const m = [sr / n, sg / n, sb / n];
    if (isBg(m)) continue;
    let best = 0, bd = 1e9; PAL.forEach((q, i) => { const dd = d2(m, q); if (dd < bd) { bd = dd; best = i; } });
    if (bd > 40 * 40) nonPal++;
    const o = (r * cols + c) * 4; out.d[o] = PAL[best][0]; out.d[o + 1] = PAL[best][1]; out.d[o + 2] = PAL[best][2]; out.d[o + 3] = 255;
  }
  return { img: out, phase: [px0, py0], nonPal, cols, rows };
}
module.exports = { snap, palette };
if (require.main === module) {
  const file = process.argv[2], pitch = +process.argv[3] || 7;
  const r = snap(file, pitch);
  const tr = p.trim(r.img).img;
  const name = path.basename(file, '.png');
  p.encode(r.img, path.join(__dirname, '..', 'work', 'snap_' + name + '.png'));
  p.encode(p.nearestUp(tr, 8, [38, 44, 58]), path.join(__dirname, '..', 'work', 'snap_' + name + '_x8.png'));
  console.log(name, 'grid', r.cols + 'x' + r.rows, 'phase', r.phase, 'trimmed', tr.w + 'x' + tr.h, 'colorsFarFromPalette', r.nonPal, 'colors', p.countColors(r.img));
}
