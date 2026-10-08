// 숫자 시트(3칸, 검은 세로 구분선, 자홍 배경)에서 도트 격자를 읽어 칸마다 투명 배경 도트 그림으로 저장 (작업 폴더 전용)
// 사용: node extract_digits.js <시트.png> <태그> [pitch]
const path = require('path'), fs = require('fs');
const R = path.join(__dirname, '..');
const p = require(path.join(R, '..', 'PauseUI_VARCO', 'tools', 'pix.js'));
const [FILE, TAG, PITCH_ARG] = process.argv.slice(2);
const sheet = p.decode(FILE);
const px = (x, y) => { const o = (y * sheet.w + x) * 4; return [sheet.d[o], sheet.d[o + 1], sheet.d[o + 2]]; };
const isBlack = (x, y) => { const c = px(x, y); return c[0] < 70 && c[1] < 70 && c[2] < 70; };
const isBg = (r, g, b) => r > 170 && b > 170 && g < 130; // 자홍 배경
const lum = (r, g, b) => r * 0.3 + g * 0.59 + b * 0.11;

// 1) 검은 세로 구분선 찾기 (거의 모든 행이 검은 열)
const cols = []; for (let x = 0; x < sheet.w; x++) { let c = 0; for (let y = 0; y < sheet.h; y += 3) if (isBlack(x, y)) c++; cols.push(c / (sheet.h / 3) > 0.9); }
const lines = []; let s = -1; for (let x = 0; x <= sheet.w; x++) { const on = x < sheet.w && cols[x]; if (on && s < 0) s = x; if (!on && s >= 0) { lines.push([s, x - 1]); s = -1; } }
if (lines.length !== 2) throw new Error('구분선 인식 실패: ' + lines.length);
const xs = [0, lines[0][1] + 1, lines[1][1] + 1], xe = [lines[0][0], lines[1][0], sheet.w];
console.log('칸 x범위', xs.map((v, i) => v + '~' + xe[i]).join(' | '));

// 2) 도트 격자 위상 점수 (도트 가운데 5x5 밝기 분산 합이 작을수록 격자에 맞음)
function phaseScore(X0, cw, pitch) {
  let best = null;
  for (let py = 0; py < pitch; py++) for (let pxx = 0; pxx < pitch; pxx++) {
    let v = 0, n = 0;
    for (let j = 0; (j + 1) * pitch + py + 3 < sheet.h; j += 2) for (let i = 0; (i + 1) * pitch + pxx + 3 < cw; i += 2) {
      const cx = X0 + Math.round(pxx + (i + 0.5) * pitch), cy = Math.round(py + (j + 0.5) * pitch); let a = 0, a2 = 0;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const c = px(cx + dx, cy + dy), L = lum(c[0], c[1], c[2]); a += L; a2 += L * L; }
      v += a2 / 25 - (a / 25) * (a / 25); n++;
    }
    v /= n; if (!best || v < best.v) best = { v, px: pxx, py };
  }
  return best;
}
let PITCH = +PITCH_ARG;
if (!PITCH) { let bp = 11.5, bv = 1e18; for (let pt = 9; pt <= 14.01; pt += 0.25) { let tot = 0; for (let c = 0; c < 3; c++) tot += phaseScore(xs[c] + 4, xe[c] - xs[c] - 8, pt).v; if (tot < bv) { bv = tot; bp = pt; } } PITCH = bp; }
console.log('도트 크기', PITCH, 'px');

// 3) 칸마다 도트 읽기
const out = [];
for (let c = 0; c < 3; c++) {
  const X0 = xs[c] + 4, cw = xe[c] - xs[c] - 8, best = phaseScore(X0, cw, PITCH);
  const W = Math.floor((cw - best.px) / PITCH), H = Math.floor((sheet.h - best.py) / PITCH), f = p.blank(W, H);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const cx = X0 + Math.round(best.px + (i + 0.5) * PITCH), cy = Math.round(best.py + (j + 0.5) * PITCH), rs = [], gs = [], bs = [];
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const q = px(cx + dx, cy + dy); rs.push(q[0]); gs.push(q[1]); bs.push(q[2]); }
    const m = (a) => a.sort((u, v) => u - v)[12], r = m(rs), g = m(gs), b = m(bs);
    if (isBg(r, g, b)) continue; const o = (j * W + i) * 4; f.d[o] = r; f.d[o + 1] = g; f.d[o + 2] = b; f.d[o + 3] = 255;
  }
  // 경계 상자
  let a = W, b2 = H, c2 = -1, d2 = -1, n = 0; for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) if (f.d[(j * W + i) * 4 + 3]) { a = Math.min(a, i); c2 = Math.max(c2, i); b2 = Math.min(b2, j); d2 = Math.max(d2, j); n++; }
  console.log(`칸${c + 1}: 격자 ${W}x${H}, 위상 (${best.px},${best.py}), 숫자 경계 x ${a}~${c2} (폭 ${c2 - a + 1}) y ${b2}~${d2} (높이 ${d2 - b2 + 1}), 도트 ${n}개`);
  out.push({ w: W, h: H, bbox: [a, b2, c2, d2], d: f.d.toString('base64') });
}
fs.writeFileSync(path.join(R, 'work', `digit_raw_${TAG}.json`), JSON.stringify({ pitch: PITCH, cells: out }));
