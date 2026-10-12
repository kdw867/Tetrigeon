// 양팔 낮게 벌리기 v3 (작업 폴더 전용): 왼팔 = 원본 팔 조각(회색 위팔+손목 수정+윤곽)을 어깨 축으로 회전, 오른팔 = 원본 회색 사선 조각+윤곽을 회전(손은 평행 이동).
// 비워진 자리: 왼쪽은 VARCO 팔 없는 바탕 도트, 오른쪽은 주변 보라 결정 색으로 채움. 팔 밖은 원본 도트 그대로.
// 사용: node tools/arm_open3.js <rest|mid|final> <out.png> [각도 기본 20]
const path = require('path');
const p = require('../../PauseUI_VARCO/tools/pix.js');
const { cls } = require('./arm_composite.js');
const AO = require('./arm_open.js');
const R = path.join(__dirname, '..'), W = 160, SS = 4;
const IDLE = 'C:/Users/MBC-501-15/Documents/Tetrigeon/Tetrigeon/Assets/@Resources/Enemies/CrystalQueenIdle/T_CrystalQueen_Idle.png';
const base = p.crop(p.decode(IDLE), 0, 0, W, W), noarm = p.decode(path.join(R, 'work', 'snapcq_noarm_4.png'));
const GR = new Set(['72,79,97', '116,119,129', '88,94,108']);
const A = (x, y) => x >= 0 && y >= 0 && x < W && y < W && base.d[(y * W + x) * 4 + 3] > 0;
const col = (x, y) => { const o = (y * W + x) * 4; return [base.d[o], base.d[o + 1], base.d[o + 2]]; };
const isGray = (x, y) => A(x, y) && GR.has(col(x, y).join(','));
const isNavy = (x, y) => A(x, y) && cls(base.d, (y * W + x) * 4) === 'navy';
// 상자 안에서 가장 큰 회색 덩어리(8연결)
function comp(box, whole) {
  const [x0, y0, x1, y1] = box, seen = new Set(); let best = [];
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    if (!isGray(x, y) || seen.has(x + ',' + y)) continue;
    const c = [], st = [[x, y]]; seen.add(x + ',' + y);
    while (st.length) { const [a, b] = st.pop(); c.push([a, b]); for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = a + dx, Y = b + dy; if (isGray(X, Y) && !seen.has(X + ',' + Y)) { seen.add(X + ',' + Y); st.push([X, Y]); } } }
    if (whole && !c.every(([a, b]) => a >= x0 && a <= x1 && b >= y0 && b <= y1)) continue; // 상자를 벗어나는 큰 덩어리(하단 몸 등)는 제외
    if (c.length > best.length) best = c;
  }
  return best;
}
// 회색 도트 + 주위 남색 윤곽 1도트 (원본 색 그대로)
function withOutline(cells) {
  const m = new Map();
  for (const [x, y] of cells) { m.set(x + ',' + y, col(x, y)); for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = x + dx, Y = y + dy; if (!m.has(X + ',' + Y) && isNavy(X, Y)) m.set(X + ',' + Y, col(X, Y)); } }
  return m;
}
const HANDL = AO.HL.px, HANDR = AO.HR.px, handKeys = new Set([...HANDL.keys(), ...HANDR.keys()]);
const upperL = withOutline(comp([72, 86, 77, 100], true)); // 왼팔 회색 위팔(X73-76,Y88-100)
const crystalL = new Map(); // 왼팔 손목 수정: (72,97)-(67.5,108) 선분에서 2.4도트 이내의 비회색·비남색 도트 + 그 윤곽
{
  const x0 = 72, y0 = 96, x1 = 67.5, y1 = 108, dx = x1 - x0, dy = y1 - y0;
  for (let y = 94; y <= 110; y++) for (let x = 64; x <= 75; x++) {
    const t = Math.max(0, Math.min(1, ((x - x0) * dx + (y - y0) * dy) / (dx * dx + dy * dy))), d = Math.hypot(x - (x0 + t * dx), y - (y0 + t * dy));
    if (d <= 2.4 && A(x, y) && !isGray(x, y) && cls(base.d, (y * W + x) * 4) !== 'navy') crystalL.set(x + ',' + y, col(x, y));
  }
  for (const k of [...crystalL.keys()]) { const [x, y] = k.split(',').map(Number); for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const X = x + i, Y = y + j; if (!crystalL.has(X + ',' + Y) && isNavy(X, Y) && !handKeys.has(X + ',' + Y)) crystalL.set(X + ',' + Y, col(X, Y)); } }
}
const armL = new Map([...upperL, ...crystalL]); for (const k of handKeys) armL.delete(k);
const armR = withOutline(comp([88, 100, 97, 111], true)); for (const k of handKeys) armR.delete(k); // 오른팔 회색 사선(X89-96,Y101-110) + 윤곽 (지울 대상)
const torsoEdgeR = withOutline(comp([79, 83, 96, 102], true).filter(([x, y]) => x >= 94 && y >= 92)); for (const k of handKeys) torsoEdgeR.delete(k); // 몸통 오른쪽 가장자리의 회색 세로선(오른 위팔 자리)
const PIV = { L: [74, 88], R: [89, 100] };
// 스프라이트를 piv 기준 시계 방향 deg 회전: 4배 확대 → 역변환 표본 → 4x4 최빈색(불투명 8/16 이상)
function rotateSprite(sprite, piv, deg) {
  const a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a), res = new Map(), big = new Map();
  for (const [k, cc] of sprite) { const [x, y] = k.split(',').map(Number); for (let j = 0; j < SS; j++) for (let i = 0; i < SS; i++) big.set((x * SS + i) + ',' + (y * SS + j), cc); }
  const cand = new Set();
  for (const k of sprite.keys()) { const [x, y] = k.split(',').map(Number), dx = x + 0.5 - piv[0], dy = y + 0.5 - piv[1], X = piv[0] + c * dx - s * dy, Y = piv[1] + s * dx + c * dy; for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) cand.add((Math.floor(X) + i) + ',' + (Math.floor(Y) + j)); }
  for (const k of cand) {
    const [x, y] = k.split(',').map(Number), cnt = new Map(); let op = 0;
    for (let j = 0; j < SS; j++) for (let i = 0; i < SS; i++) { const X = x + (i + 0.5) / SS - piv[0], Y = y + (j + 0.5) / SS - piv[1], sx = piv[0] + c * X + s * Y, sy = piv[1] - s * X + c * Y, cc = big.get(Math.floor(sx * SS) + ',' + Math.floor(sy * SS)); if (!cc) continue; op++; const ck = cc.join(','); cnt.set(ck, (cnt.get(ck) || 0) + 1); }
    if (op < 8) continue;
    let b = null, bn = 0; for (const [ck, n] of cnt) { const lum = ck.split(',').reduce((q, r) => q + +r, 0); if (n > bn || (n === bn && lum < b.lum)) { bn = n; b = { ck, lum }; } }
    res.set(k, b.ck.split(',').map(Number));
  }
  return res;
}
function dilate(keys, r) { const out = new Set(); for (const k of keys) { const [x, y] = k.split(',').map(Number); for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) out.add((x + dx) + ',' + (y + dy)); } return out; }
function handShift(hand, piv, deg) {
  let sx = 0, n = 0, top = 1e9;
  for (const k of hand.keys()) { const [x, y] = k.split(',').map(Number); if (GR.has(col(x, y).join(','))) { sx += x; n++; top = Math.min(top, y); } }
  const wr = [sx / n + 0.5, top + 0.5], a = deg * Math.PI / 180, dx = wr[0] - piv[0], dy = wr[1] - piv[1];
  return [Math.round(piv[0] + Math.cos(a) * dx - Math.sin(a) * dy - wr[0]), Math.round(piv[1] + Math.sin(a) * dx + Math.cos(a) * dy - wr[1])];
}
function build(stage, ang) {
  const t = stage === 'rest' ? 0 : stage === 'mid' ? 0.5 : 1, out = { w: W, h: W, d: Buffer.from(base.d) }, info = { stage };
  if (!t) return { img: out, info: '원본 그대로' };
  const put = (k, c) => { const [x, y] = k.split(',').map(Number); if (x < 0 || y < 0 || x >= W || y >= W) return; const o = (y * W + x) * 4; out.d[o] = c[0]; out.d[o + 1] = c[1]; out.d[o + 2] = c[2]; out.d[o + 3] = 255; };
  const clearK = (k) => { const [x, y] = k.split(',').map(Number); out.d[(y * W + x) * 4 + 3] = 0; };
  const vacL = dilate([...armL.keys(), ...HANDL.keys()], 1), vacR = dilate([...armR.keys(), ...torsoEdgeR.keys(), ...HANDR.keys()], 1);
  const prot = new Set(); for (const c of [...comp([73, 61, 86, 86], true), ...comp([79, 83, 96, 102], true)]) prot.add(c[0] + ',' + c[1]);
  for (const k of vacL) { const [x, y] = k.split(',').map(Number); if (x < 58 || x > 80 || y < 84 || y > 121 || prot.has(k)) continue; const o = (y * W + x) * 4; noarm.d.copy(out.d, o, o, o + 4); }
  const keep = (x, y) => A(x, y) && !vacR.has(x + ',' + y) && cls(base.d, (y * W + x) * 4) === 'purple';
  for (const k of vacR) {
    const [x, y] = k.split(',').map(Number); if (x < 86 || x > 114 || y < 94 || y > 124) continue;
    let found = null; for (let r = 1; r <= 6 && !found; r++) { let bestd = 1e9; for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue; if (keep(x + dx, y + dy)) { const d = dx * dx + dy * dy + (dy > 0 ? 0.5 : 0); if (d < bestd) { bestd = d; found = col(x + dx, y + dy); } } } }
    if (found) put(k, found); else clearK(k);
  }
  const deg = +ang * t; info.deg = deg;
  const rl = rotateSprite(armL, PIV.L, deg);
  for (const [k, c] of rl) put(k, c);
  const shL = handShift(HANDL, PIV.L, deg);
  for (const [k, c] of HANDL) { const [x, y] = k.split(',').map(Number); put((x + shL[0]) + ',' + (y + shL[1]), c); }
  const gR = JSON.parse(JSON.stringify(AO.GEO.R)); gR.S = [93, 89]; gR.rest = { E: [95, 100], W: [101, 108], d: [0, 0] }; gR.final = { E: [99, 99], W: [105, 107], d: [3, -2] }; gR.tu = 4; gR.tf = 4;
  const infoR = AO.drawArm(out, gR, t, AO.HR); const shR = infoR.handShift; info.armRdrawn = infoR;
  Object.assign(info, { armL: armL.size, armR: armR.size, handShiftL: shL, handShiftR: shR });
  return { img: out, info };
}
module.exports = { build, armL, armR, torsoEdgeR };
if (require.main === module) { const [stage, outp, ang] = process.argv.slice(2), r = build(stage, ang || 20); p.encode(r.img, outp); console.log(JSON.stringify(r.info)); }
