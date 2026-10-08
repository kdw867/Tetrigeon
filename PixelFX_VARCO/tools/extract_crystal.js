// VARCO가 만든 수정 파괴 시트(crystal_v1.png, 4x2칸, 초록 배경)에서 프레임을 뽑아 도트 격자에 맞춰 줄이고 투명 배경으로 만든다
// 1) 검은 구분선으로 칸 분리 2) 칸마다 도트 격자 위상 탐색 3) 도트 중심 색(중앙값) 읽기 4) 초록=투명 5) 팔레트 정리
const { p, R, put } = require('./lib_fx');
const sheet = p.decode(`${R}/generated/crystal_v1.png`);
const PITCH = +(process.argv[2] || 11.5);
// 검은 구분선 찾기
const isBlack = (x, y) => { const o = (y * sheet.w + x) * 4; return sheet.d[o] < 40 && sheet.d[o + 1] < 40 && sheet.d[o + 2] < 40; };
function lines(isLine, len, other) { const r = []; let s = -1; for (let i = 0; i < len; i++) { let c = 0; for (let j = 0; j < other; j += 4) if (isLine(i, j)) c++; const on = c > other / 4 * 0.9; if (on && s < 0) s = i; if (!on && s >= 0) { r.push([s, i - 1]); s = -1; } } return r; }
const vx = lines((x, y) => isBlack(x, y), sheet.w, sheet.h), hy = lines((y, x) => isBlack(x, y), sheet.h, sheet.w);
console.log('세로 구분선', JSON.stringify(vx), '가로 구분선', JSON.stringify(hy));
const xs = [0, ...vx.map(v => v[1] + 1)], xe = [...vx.map(v => v[0]), sheet.w], ys = [0, ...hy.map(v => v[1] + 1)], ye = [...hy.map(v => v[0]), sheet.h];
const isGreen = (r, g, b) => g > 150 && g > r + 60 && g > b + 60;
const lum = (r, g, b) => r * 0.3 + g * 0.59 + b * 0.11;
const out = [];
for (let row = 0; row < 2; row++) for (let col = 0; col < 4; col++) {
  const X0 = xs[col], X1 = xe[col], Y0 = ys[row], Y1 = ye[row], cw = X1 - X0, ch = Y1 - Y0;
  // 도트 격자 위상 탐색: 도트 중심 근처 5x5의 색 분산이 가장 작은 위상
  let best = null;
  for (let py = 0; py < PITCH; py += 1) for (let px = 0; px < PITCH; px += 1) {
    let v = 0, n = 0;
    for (let j = 0; j * PITCH + py + 3 < ch; j += 2) for (let i = 0; i * PITCH + px + 3 < cw; i += 2) {
      const cx = X0 + Math.round(px + (i + 0.5) * PITCH), cy = Y0 + Math.round(py + (j + 0.5) * PITCH);
      let sr = 0, sg = 0, sb = 0, s2 = 0; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const o = ((cy + dy) * sheet.w + cx + dx) * 4; const L = lum(sheet.d[o], sheet.d[o + 1], sheet.d[o + 2]); sr += L; s2 += L * L; n++; }
      v += s2 / 25 - (sr / 25) * (sr / 25);
    }
    if (!best || v < best.v) best = { v, px, py };
  }
  const W = Math.floor((cw - best.px) / PITCH), H = Math.floor((ch - best.py) / PITCH), f = p.blank(W, H);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const cx = X0 + Math.round(best.px + (i + 0.5) * PITCH), cy = Y0 + Math.round(best.py + (j + 0.5) * PITCH);
    const rs = [], gs = [], bs = []; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const o = ((cy + dy) * sheet.w + cx + dx) * 4; rs.push(sheet.d[o]); gs.push(sheet.d[o + 1]); bs.push(sheet.d[o + 2]); }
    const m = (a) => a.sort((u, v) => u - v)[12];
    const r = m(rs), g = m(gs), b = m(bs);
    if (isGreen(r, g, b)) continue; // 배경
    put(f, i, j, [r, g, b]);
  }
  out.push({ img: f, phase: best, cell: [cw, ch], cx: (cw / 2 - best.px) / PITCH, cy: (ch / 2 - best.py) / PITCH }); // 칸 기하 중심을 도트 좌표로
  console.log(`칸 ${row * 4 + col + 1}: ${cw}x${ch} -> ${W}x${H} 도트, 위상 (${best.px},${best.py})`);
}
require('fs').writeFileSync(`${R}/work/crystal_raw_frames.json`, JSON.stringify(out.map(o => ({ w: o.img.w, h: o.img.h, cx: o.cx, cy: o.cy, d: o.img.d.toString('base64') }))));
// 확인용 시트: 8프레임을 4배로 가로로 나열
const k = 6, sw = out.reduce((s, o) => s + o.img.w * k + 8, 0), sh = Math.max(...out.map(o => o.img.h)) * k + 8;
const chk = p.blank(sw, sh); for (let i = 0; i < sw * sh; i++) { chk.d[i * 4] = 14; chk.d[i * 4 + 1] = 24; chk.d[i * 4 + 2] = 40; chk.d[i * 4 + 3] = 255; }
let ox = 4; for (const o of out) { for (let y = 0; y < o.img.h * k; y++) for (let x = 0; x < o.img.w * k; x++) { const s = (Math.floor(y / k) * o.img.w + Math.floor(x / k)) * 4; if (o.img.d[s + 3]) o.img.d.copy(chk.d, ((y + 4) * sw + ox + x) * 4, s, s + 4); } ox += o.img.w * k + 8; }
p.encode(chk, `${R}/work/crystal_raw_check.png`);
