// 색별 수정 파괴 시트(burst_<T>_v1.png, 4x2칸)에서 프레임을 도트 격자로 읽어 투명 배경 프레임 8장으로 저장 (work/burst_raw_<T>.json)
// 사용: node extract_burst.js <I|J|L|O|S|T|Z> <green|magenta> [pitch]
const { p, R, put } = require('./lib_fx');
const [T, BG = 'green', PITCH_ARG] = process.argv.slice(2);
const sheet = p.decode(`${R}/generated/burst_${T}_v1.png`);
const isBlack = (x, y) => { const o = (y * sheet.w + x) * 4; return sheet.d[o] < 70 && sheet.d[o + 1] < 75 && sheet.d[o + 2] < 70; };
function lines(isLine, len, other) { const r = []; let s = -1; for (let i = 0; i < len; i++) { let c = 0; for (let j = 0; j < other; j += 4) if (isLine(i, j)) c++; const on = c > other / 4 * 0.9; if (on && s < 0) s = i; if (!on && s >= 0) { r.push([s, i - 1]); s = -1; } } return r; }
const vx = lines((x, y) => isBlack(x, y), sheet.w, sheet.h), hy = lines((y, x) => isBlack(x, y), sheet.h, sheet.w);
const xs = [0, ...vx.map(v => v[1] + 1)], xe = [...vx.map(v => v[0]), sheet.w], ys = [0, ...hy.map(v => v[1] + 1)], ye = [...hy.map(v => v[0]), sheet.h];
if (xs.length !== 4 || ys.length !== 2) throw new Error('칸 구분선 인식 실패: 세로 ' + vx.length + ' 가로 ' + hy.length);
const isBg = BG === 'magenta' ? (r, g, b) => r > 190 && b > 190 && g < 110 : (r, g, b) => g > 150 && g > r + 60 && g > b + 60;
const lum = (r, g, b) => r * 0.3 + g * 0.59 + b * 0.11;
function phaseScore(X0, Y0, cw, ch, pitch) { // 도트 중심 5x5 분산 합이 가장 작은 위상
  let best = null;
  for (let py = 0; py < pitch; py += 1) for (let px = 0; px < pitch; px += 1) {
    let v = 0;
    for (let j = 0; j * pitch + py + 3 < ch; j += 2) for (let i = 0; i * pitch + px + 3 < cw; i += 2) {
      const cx = X0 + Math.round(px + (i + 0.5) * pitch), cy = Y0 + Math.round(py + (j + 0.5) * pitch); let s = 0, s2 = 0;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const o = ((cy + dy) * sheet.w + cx + dx) * 4, L = lum(sheet.d[o], sheet.d[o + 1], sheet.d[o + 2]); s += L; s2 += L * L; }
      v += s2 / 25 - (s / 25) * (s / 25);
    }
    if (!best || v < best.v) best = { v, px, py };
  }
  return best;
}
// 도트 크기: 인자가 없으면 큰 파편이 있는 셋째 칸에서 10.5~12.5를 훑어 정함
let PITCH = +PITCH_ARG;
if (!PITCH) { let bp = 11.5, bv = 1e18; const X0 = xs[2], Y0 = ys[0], cw = xe[2] - X0, ch = ye[0] - Y0; for (let pt = 10.5; pt <= 12.51; pt += 0.25) { const b = phaseScore(X0, Y0, cw, ch, pt); const norm = b.v / ((cw / pt) * (ch / pt)); if (norm < bv) { bv = norm; bp = pt; } } PITCH = bp; }
const out = [];
for (let row = 0; row < 2; row++) for (let col = 0; col < 4; col++) {
  const X0 = xs[col], Y0 = ys[row], cw = xe[col] - X0, ch = ye[row] - Y0, best = phaseScore(X0, Y0, cw, ch, PITCH);
  const W = Math.floor((cw - best.px) / PITCH), H = Math.floor((ch - best.py) / PITCH), f = p.blank(W, H);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const cx = X0 + Math.round(best.px + (i + 0.5) * PITCH), cy = Y0 + Math.round(best.py + (j + 0.5) * PITCH), rs = [], gs = [], bs = [];
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const o = ((cy + dy) * sheet.w + cx + dx) * 4; rs.push(sheet.d[o]); gs.push(sheet.d[o + 1]); bs.push(sheet.d[o + 2]); }
    const m = (a) => a.sort((u, v) => u - v)[12], r = m(rs), g = m(gs), b = m(bs);
    if (isBg(r, g, b)) continue; put(f, i, j, [r, g, b]);
  }
  out.push({ w: W, h: H, cx: (cw / 2 - best.px) / PITCH, cy: (ch / 2 - best.py) / PITCH, d: f.d.toString('base64') });
}
require('fs').writeFileSync(`${R}/work/burst_raw_${T}.json`, JSON.stringify(out));
console.log(`${T}: 도트 크기 ${PITCH}px, 칸 ${out.map(o => o.w + 'x' + o.h).join(' ')}`);
