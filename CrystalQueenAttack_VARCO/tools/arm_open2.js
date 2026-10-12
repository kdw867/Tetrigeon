// 양팔 낮게 벌리기 v2 (작업 폴더 전용): 원본 팔 픽셀(돌 위팔·손목 수정·윤곽)을 어깨를 축으로 회전(4배 확대 → 최빈색 축소), 손은 원본 픽셀 그대로 평행 이동.
// 팔 자리는 VARCO 팔 없는 바탕 도트로 채워 등 뒤 수정을 복원한다. 팔 밖은 원본 도트 그대로.
// 사용: node tools/arm_open2.js <rest|mid|final> <out.png> [각도(도) 기본 20]
const path = require('path');
const p = require('../../PauseUI_VARCO/tools/pix.js');
const { cls } = require('./arm_composite.js');
const AO = require('./arm_open.js');
const R = path.join(__dirname, '..'), W = 160, SS = 4;
const IDLE = 'C:/Users/MBC-501-15/Documents/Tetrigeon/Tetrigeon/Assets/@Resources/Enemies/CrystalQueenIdle/T_CrystalQueen_Idle.png';
const base = p.crop(p.decode(IDLE), 0, 0, W, W), noarm = p.decode(path.join(R, 'work', 'snapcq_noarm_4.png'));
const PIV = { L: [74, 88], R: [94, 91] };
// 팔 스프라이트 = 팔 자리 마스크(팽창 전) 안의 원본 픽셀 중 손 패치가 아닌 것
function armMasks() {
  const vacDil = AO.vacated(), diff = new Uint8Array(W * W), box = (x, y) => (x >= 58 && x <= 79 && y >= 84 && y <= 121) || (x >= 86 && x <= 112 && y >= 94 && y <= 124);
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) if (box(x, y) && cls(base.d, (y * W + x) * 4) !== cls(noarm.d, (y * W + x) * 4)) diff[y * W + x] = 1;
  const seg = (x0, y0, x1, y1, r) => { for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) { const dx = x1 - x0, dy = y1 - y0, t = Math.max(0, Math.min(1, ((x - x0) * dx + (y - y0) * dy) / (dx * dx + dy * dy))), d = Math.hypot(x - (x0 + t * dx), y - (y0 + t * dy)); if (d <= r && box(x, y)) diff[y * W + x] = 1; } };
  seg(72, 96, 67.5, 108, 2.6);
  const handKeys = new Set([...AO.HL.px.keys(), ...AO.HR.px.keys()]);
  const L = new Map(), Rm = new Map();
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) { if (!diff[y * W + x] || !vacDil[y * W + x] || handKeys.has(x + ',' + y) || !base.d[(y * W + x) * 4 + 3]) continue; const o = (y * W + x) * 4, c = [base.d[o], base.d[o + 1], base.d[o + 2]]; (x <= 79 ? L : Rm).set(x + ',' + y, c); }
  return { vacDil, L, R: Rm };
}
function rotateSprite(sprite, piv, deg) { // 스프라이트(도트 맵)를 piv 기준 시계 방향 deg 만큼 회전: 4배 확대 → 역변환 표본 → 4x4 최빈색
  const a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a), res = new Map(), big = new Map();
  for (const [k, col] of sprite) { const [x, y] = k.split(',').map(Number); for (let j = 0; j < SS; j++) for (let i = 0; i < SS; i++) big.set((x * SS + i) + ',' + (y * SS + j), col); }
  const cand = new Set(); for (const k of sprite.keys()) { const [x, y] = k.split(',').map(Number); const dx = x + 0.5 - piv[0], dy = y + 0.5 - piv[1], X = piv[0] + c * dx - s * dy, Y = piv[1] + s * dx + c * dy; for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) cand.add((Math.floor(X) + i) + ',' + (Math.floor(Y) + j)); }
  for (const k of cand) { const [x, y] = k.split(',').map(Number), cnt = new Map(); let op = 0; for (let j = 0; j < SS; j++) for (let i = 0; i < SS; i++) { const X = x + (i + 0.5) / SS - piv[0], Y = y + (j + 0.5) / SS - piv[1], sx = piv[0] + c * X + s * Y, sy = piv[1] - s * X + c * Y, col = big.get(Math.floor(sx * SS) + ',' + Math.floor(sy * SS)); if (!col) continue; op++; const ck = col.join(','); cnt.set(ck, (cnt.get(ck) || 0) + 1); } if (op < 8) continue; let best = null, bn = 0; for (const [ck, n] of cnt) { const lum = ck.split(',').reduce((a, b) => a + +b, 0); if (n > bn || (n === bn && lum < best.lum)) { bn = n; best = { ck, lum }; } } res.set(k, best.ck.split(',').map(Number)); }
  return res;
}
function build(stage, ang) {
  const t = stage === 'rest' ? 0 : stage === 'mid' ? 0.5 : 1, out = { w: W, h: W, d: Buffer.from(base.d) }, info = { stage };
  if (!t) return { img: out, info: '원본 그대로' };
  const M = armMasks(); let n = 0; for (let i = 0; i < W * W; i++) if (M.vacDil[i]) { noarm.d.copy(out.d, i * 4, i * 4, i * 4 + 4); n++; } info.vacatedFilled = n;
  const put = (k, c) => { const [x, y] = k.split(',').map(Number); if (x < 0 || y < 0 || x >= W || y >= W) return; const o = (y * W + x) * 4; out.d[o] = c[0]; out.d[o + 1] = c[1]; out.d[o + 2] = c[2]; out.d[o + 3] = 255; };
  const side = { L: { sprite: M.L, deg: +ang * t, hand: AO.HL }, R: { sprite: M.R, deg: -ang * t, hand: AO.HR } };
  for (const key of ['L', 'R']) { const sd = side[key], rot = rotateSprite(sd.sprite, PIV[key], sd.deg); for (const [k, c] of rot) put(k, c);
    // 손: 손목(손 윗부분 중앙)이 회전한 위치로 평행 이동 (정수)
    const wr = [sd.hand.cx + 0.5, sd.hand.top + 0.5], a = sd.deg * Math.PI / 180, dx = wr[0] - PIV[key][0], dy = wr[1] - PIV[key][1], nx = PIV[key][0] + Math.cos(a) * dx - Math.sin(a) * dy, ny = PIV[key][1] + Math.sin(a) * dx + Math.cos(a) * dy, sh = [Math.round(nx - wr[0]), Math.round(ny - wr[1])];
    for (const [k, c] of sd.hand.px) { const [x, y] = k.split(',').map(Number); put((x + sh[0]) + ',' + (y + sh[1]), c); }
    info[key] = { spritePx: sd.sprite.size, rotatedPx: rot.size, deg: +sd.deg.toFixed(1), handShift: sh }; }
  return { img: out, info };
}
module.exports = { build };
if (require.main === module) { const [stage, outp, ang] = process.argv.slice(2), r = build(stage, ang || 20); p.encode(r.img, outp); console.log(JSON.stringify(r.info)); }
