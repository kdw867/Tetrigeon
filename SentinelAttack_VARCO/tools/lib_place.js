// 후보 한 장을 128x104 셀에 배치하는 공용 함수 (작업 폴더 전용): 스냅(v2, 색 분포 맞춤) -> 정리 -> 발바닥 줄·발 위치 정렬
const fs = require('fs'), path = require('path'), cp = require('child_process');
const p = require('../../PauseUI_VARCO/tools/pix.js');
const R = path.join(__dirname, '..'), W_ = path.join(R, 'work');
const CW = 144, CH = 104, OX = 24, OY = 8, BASE_Y = 94, FEET_CX = 74; // 원본 96x96 셀을 (24,8)에 둔 144x104 캔버스, 발바닥 줄 94, 발 중심 74
const A = (im, x, y) => (x < 0 || y < 0 || x >= im.w || y >= im.h) ? 0 : im.d[(y * im.w + x) * 4 + 3];

// raw VARCO 이미지 -> work/snapc2_<tag>.png (스냅 v2 + 정리). 이미 있으면 건너뜀
function prepare(rawFile, tag, force) {
  const out = path.join(W_, 'snapc2_' + tag + '.png');
  if (!force && fs.existsSync(out)) return out;
  const name = path.basename(rawFile, '.png');
  cp.execFileSync('node', [path.join(__dirname, 'snap2.js'), rawFile, '7'], { stdio: 'pipe' });
  fs.copyFileSync(path.join(W_, 'snap2_' + name + '.png'), path.join(W_, 'snap2_' + tag + '.png'));
  cp.execFileSync('node', [path.join(__dirname, 'clean.js'), path.join(W_, 'snap2_' + tag + '.png'), out], { stdio: 'pipe' });
  return out;
}
function baselineRow(im) { for (let y = im.h - 1; y >= 0; y--) { let n = 0; for (let x = 0; x < im.w; x++) if (A(im, x, y)) n++; if (n >= 30) return y; } throw new Error('발바닥 줄을 못 찾음'); }
function rightFootCenter(im, yb) {
  let best = null;
  for (const y of [yb, yb - 1]) { let s = -1; for (let x = 0; x <= im.w; x++) { const a = x < im.w ? A(im, x, y) : 0; if (a && s < 0) s = x; if (!a && s >= 0) { if (x - s >= 12 && (best === null || (s + x - 1) / 2 > best)) best = (s + x - 1) / 2; s = -1; } } }
  if (best === null) throw new Error('오른쪽 발을 못 찾음'); return best;
}
// 배치: rf 가 있으면 오른발 중심을 rf 에, 없으면 발 중심을 FEET_CX 에 맞춤. 발 아래로 삐져나온 부분은 자름
function place(snapcFile, rf) {
  const im = p.decode(snapcFile), yb = baselineRow(im);
  let x0 = 999, x1 = -1; for (let y = yb - 3; y <= yb; y++) for (let x = 0; x < im.w; x++) if (A(im, x, y)) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); }
  const dx = rf != null ? Math.round(rf - rightFootCenter(im, yb)) : Math.round(FEET_CX - (x0 + x1) / 2), dy = BASE_Y - yb, out = p.blank(CW, CH); let cut = 0, outside = 0;
  for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) { if (!A(im, x, y)) continue; const X = x + dx, Y = y + dy; if (Y > BASE_Y) { cut++; continue; } if (X < 0 || Y < 0 || X >= CW) { outside++; continue; } im.d.copy(out.d, (Y * CW + X) * 4, (y * im.w + x) * 4, (y * im.w + x) * 4 + 4); }
  return { cell: out, offset: [dx, dy], cutBelowSole: cut, outsideCanvas: outside, baselineRow: yb };
}
const mask = (cell) => { const m = new Uint8Array(CW * CH); for (let i = 0; i < CW * CH; i++) m[i] = cell.d[i * 4 + 3] ? 1 : 0; return m; };
const iou = (a, b) => { let i = 0, u = 0; for (let k = 0; k < a.length; k++) { if (a[k] && b[k]) i++; if (a[k] || b[k]) u++; } return u ? i / u : 0; };
const kind = (r, g, b) => (g > 140 && b > 180 && r < 150 && g > r + 60) ? 'cyan' : ((b - g > 55 && r > 40 && b > 90) ? 'purple' : 'stone');
function stats(cell) { let n = 0, pu = 0, cy = 0, st = 0; for (let i = 0; i < CW * CH; i++) { const o = i * 4; if (!cell.d[o + 3]) continue; n++; const k = kind(cell.d[o], cell.d[o + 1], cell.d[o + 2]); if (k === 'purple') pu++; else if (k === 'cyan') cy++; else st++; } return { dots: n, purple: pu, cyan: cy, stone: st }; }
module.exports = { prepare, place, mask, iou, stats, CW, CH, OX, OY, BASE_Y, FEET_CX, R, W_ };
