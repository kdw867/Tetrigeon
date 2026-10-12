// 양팔을 허리 양옆으로 낮게 벌리는 자세 제작 (작업 폴더 전용)
// 원본 Idle 01 의 도트를 그대로 쓰고, 팔 자리만 바꾼다:
//  1) 원래 팔 자리(원본과 "팔 없는 바탕"의 부류 차이 + 손목 수정 자리)는 VARCO 팔 없는 바탕(snapcq_noarm_4)의 도트로 채운다 (등 뒤 수정 보완).
//  2) 원본의 돌 손(회색 덩어리+윤곽)은 픽셀 그대로 복사해 평행 이동만 한다 (회전 금지 → 픽셀 안 깨짐).
//  3) 위팔(돌)·아래팔(손목 수정 장식)은 원본 팔과 같은 길이·굵기·색(팔레트)으로 새로 그린다.
// 사용: node tools/arm_open.js <단계: rest|mid|final> <out.png>
const fs = require('fs'), path = require('path');
const p = require('../../PauseUI_VARCO/tools/pix.js');
const { cls } = require('./arm_composite.js');
const R = path.join(__dirname, '..'), W = 160;
const IDLE = 'C:/Users/MBC-501-15/Documents/Tetrigeon/Tetrigeon/Assets/@Resources/Enemies/CrystalQueenIdle/T_CrystalQueen_Idle.png';
const NAVY = [15, 23, 54], DARK = [72, 79, 97], LIGHT = [116, 119, 129], LIL = [244, 201, 252], BRI = [189, 93, 251], MID = [158, 58, 251];
const base = p.crop(p.decode(IDLE), 0, 0, W, W), noarm = p.decode(path.join(R, 'work', 'snapcq_noarm_4.png'));
const A = (im, x, y) => (x < 0 || y < 0 || x >= W || y >= W) ? 0 : im.d[(y * W + x) * 4 + 3];
const get = (im, x, y) => { const o = (y * W + x) * 4; return [im.d[o], im.d[o + 1], im.d[o + 2]]; };
const set = (im, x, y, c) => { if (x < 0 || y < 0 || x >= W || y >= W) return; const o = (y * W + x) * 4; im.d[o] = c[0]; im.d[o + 1] = c[1]; im.d[o + 2] = c[2]; im.d[o + 3] = 255; };
const GRAYS = new Set(['72,79,97', '116,119,129', '88,94,108']), isGray = (im, x, y) => A(im, x, y) && GRAYS.has(get(im, x, y).join(','));
const isNavy = (im, x, y) => A(im, x, y) && cls(im.d, (y * W + x) * 4) === 'navy';
// 손 패치: 회색 덩어리(8연결) + 그 주위 남색 윤곽 1도트. 박스 안의 가장 큰 회색 덩어리를 쓴다.
function handPatch(box) {
  const [x0, y0, x1, y1] = box, lab = new Map(); let best = null;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { if (!isGray(base, x, y) || lab.has(x + ',' + y)) continue; const comp = [], st = [[x, y]]; lab.set(x + ',' + y, 1); while (st.length) { const [a, b] = st.pop(); comp.push([a, b]); for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = a + dx, Y = b + dy; if (X >= x0 && X <= x1 && Y >= y0 && Y <= y1 && isGray(base, X, Y) && !lab.has(X + ',' + Y)) { lab.set(X + ',' + Y, 1); st.push([X, Y]); } } } if (!best || comp.length > best.length) best = comp; }
  const px = new Map(); for (const [x, y] of best) { px.set(x + ',' + y, get(base, x, y)); for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = x + dx, Y = y + dy; if (!px.has(X + ',' + Y) && isNavy(base, X, Y)) px.set(X + ',' + Y, get(base, X, Y)); } }
  let sx = 0, n = 0; for (const [x, y] of best) { sx += x; n++; } const ys = best.map(q => q[1]); return { px, gray: best.length, cx: sx / n, top: Math.min(...ys) };
}
const HL = handPatch([63, 105, 72, 118]), HR = handPatch([97, 107, 108, 122]);
// 원래 팔 자리: 부류 차이 마스크(+1 팽창) + 손목 수정 캡슐, 보호 영역(머리·몸통 왼쪽 부분·하단 몸) 제외
function vacated() {
  const diff = new Uint8Array(W * W), box = (x, y) => (x >= 58 && x <= 79 && y >= 84 && y <= 121) || (x >= 86 && x <= 112 && y >= 94 && y <= 124);
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) if (box(x, y) && cls(base.d, (y * W + x) * 4) !== cls(noarm.d, (y * W + x) * 4)) diff[y * W + x] = 1;
  const seg = (x0, y0, x1, y1, r) => { for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) { const dx = x1 - x0, dy = y1 - y0, t = Math.max(0, Math.min(1, ((x - x0) * dx + (y - y0) * dy) / (dx * dx + dy * dy))), d = Math.hypot(x - (x0 + t * dx), y - (y0 + t * dy)); if (d <= r && box(x, y)) diff[y * W + x] = 1; } };
  seg(72, 96, 67.5, 108, 2.6); // 왼팔 손목 수정 (원본 연보라 조각이 놓인 자리)
  const out = new Uint8Array(W * W); for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) if (diff[y * W + x]) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < W && Y < W && box(X, Y)) out[Y * W + X] = 1; }
  // 보호: 머리·하단 몸(회색 큰 덩어리)과 몸통 왼쪽 부분(X<=92)의 회색 + 윤곽 1도트
  const protect = new Uint8Array(W * W); const mark = (x, y) => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < W && Y < W) protect[Y * W + X] = 1; } };
  const lab = new Int32Array(W * W).fill(-1), comps = []; for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) { if (!isGray(base, x, y) || lab[y * W + x] >= 0) continue; const id = comps.length, st = [[x, y]], cells = []; lab[y * W + x] = id; while (st.length) { const [a, b] = st.pop(); cells.push([a, b]); for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = a + dx, Y = b + dy; if (isGray(base, X, Y) && lab[Y * W + X] < 0) { lab[Y * W + X] = id; st.push([X, Y]); } } } comps.push(cells); }
  for (const cells of comps) { const xs = cells.map(c => c[0]), ys = cells.map(c => c[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), n = cells.length; const head = y0 >= 60 && y1 <= 86 && x0 >= 72, torso = x0 >= 79 && x1 <= 96 && y0 >= 83 && y1 <= 102 && n > 100, skirt = n >= 300; if (head || skirt) cells.forEach(([x, y]) => mark(x, y)); else if (torso) cells.forEach(([x, y]) => { if (x <= 92) mark(x, y); }); }
  for (let i = 0; i < W * W; i++) if (protect[i]) out[i] = 0; return out;
}
// 팔 기하 (도트 좌표). 단계별로 팔꿈치 E, 손목 W, 손 이동 d 를 보간. 어깨 S 는 고정.
const GEO = {
  L: { S: [74, 88], rest: { E: [73, 99], W: [67.5, 107], d: [0, 0] }, final: { E: [70, 98], W: [63, 106], d: [-5, -1] }, tu: 3, tf: 4 },
  R: { S: [93, 90], rest: { E: [95, 100], W: [101, 108], d: [0, 0] }, final: { E: [98, 100], W: [106, 108], d: [5, -1] }, tu: 3, tf: 4 }
};
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
function line(x0, y0, x1, y1, f) { x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1); const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let err = dx + dy; for (;;) { f(x0, y0); if (x0 === x1 && y0 === y1) break; const e2 = 2 * err; if (e2 >= dy) { err += dy; x0 += sx; } if (e2 <= dx) { err += dx; y0 += sy; } } }
function drawArm(img, g, t, patch) {
  const E = lerp(g.rest.E, g.final.E, t), Wr = lerp(g.rest.W, g.final.W, t), d = lerp(g.rest.d, g.final.d, t), fill = new Map();
  const put = (x, y, c, force) => { const k = x + ',' + y; if (force || !fill.has(k)) fill.set(k, c); };
  // 위팔: 돌, 회색 면 + 아래·오른쪽 어두운 가장자리
  const up = new Set(); line(g.S[0], g.S[1], E[0], E[1], (x, y) => { for (let j = 0; j < g.tu - 1; j++) for (let i = 0; i < g.tu - 1; i++) up.add((x + i) + ',' + (y + j)); });
  for (const k of up) { const [x, y] = k.split(',').map(Number); put(x, y, (!up.has((x + 1) + ',' + y) || !up.has(x + ',' + (y + 1))) ? DARK : LIGHT, true); }
  // 아래팔: 손목 수정 장식 (연보라/밝은 보라/보라 면), 팔꿈치에서 손목까지
  const fa = new Map(); const dx = Wr[0] - E[0], dy = Wr[1] - E[1], len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len, nx = -uy, ny = ux, half = g.tf / 2;
  for (let s = 0; s <= len; s += 0.5) for (let o = -half; o <= half; o += 0.5) { const x = Math.round(E[0] + ux * s + nx * o), y = Math.round(E[1] + uy * s + ny * o), f = (o + half) / (2 * half); fa.set(x + ',' + y, f < 0.34 ? LIL : f < 0.72 ? BRI : MID); }
  for (const [k, c] of fa) { const [x, y] = k.split(',').map(Number); put(x, y, c, true); }
  // 윤곽: 위팔·아래팔 바깥 1도트 남색
  const ring = new Map(); for (const k of fill.keys()) { const [x, y] = k.split(',').map(Number); for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const q = (x + i) + ',' + (y + j); if (!fill.has(q)) ring.set(q, NAVY); } }
  for (const [k, c] of ring) { const [x, y] = k.split(',').map(Number); set(img, x, y, c); } for (const [k, c] of fill) { const [x, y] = k.split(',').map(Number); set(img, x, y, c); }
  // 손: 원본 돌 손 픽셀 그대로, 평행 이동만 (정수 이동)
  const sx = Math.round(d[0]), sy = Math.round(d[1]); for (const [k, c] of patch.px) { const [x, y] = k.split(',').map(Number); set(img, x + sx, y + sy, c); }
  return { E: E.map(v => +v.toFixed(1)), W: Wr.map(v => +v.toFixed(1)), handShift: [sx, sy], upperLen: +Math.hypot(E[0] - g.S[0], E[1] - g.S[1]).toFixed(1), foreLen: +len.toFixed(1) };
}
function build(stage) {
  const t = stage === 'rest' ? 0 : stage === 'mid' ? 0.5 : 1, out = { w: W, h: W, d: Buffer.from(base.d) };
  if (stage === 'rest') return { img: out, info: '원본 그대로' };
  const vac = vacated(); let n = 0; for (let i = 0; i < W * W; i++) if (vac[i]) { noarm.d.copy(out.d, i * 4, i * 4, i * 4 + 4); n++; }
  const L = drawArm(out, GEO.L, t, HL), Rr = drawArm(out, GEO.R, t, HR);
  return { img: out, info: { vacatedFilled: n, handL: { gray: HL.gray }, handR: { gray: HR.gray }, L, R: Rr } };
}
module.exports = { build, vacated, HL, HR, GEO, drawArm };
if (require.main === module) { const [stage, outp] = process.argv.slice(2), r = build(stage); p.encode(r.img, outp); console.log(stage, JSON.stringify(r.info)); }
