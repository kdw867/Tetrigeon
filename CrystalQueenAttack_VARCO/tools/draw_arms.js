// 팔 교차를 직접 도트로 그림 (작업 폴더 전용). 팔이 없는 바탕 셀 위에 양팔을 X자로 그린다. 모델이 그린 팔은 쓰지 않는다.
// 팔 1개 = 어깨 S → 팔꿈치 E → 손 H 의 꺾은선. 회색 돌 코어 2도트 굵기 + 1도트 남색 윤곽, 위·왼쪽 모서리에 밝은 회색(#747781) 하이라이트.
// 그리는 순서가 곧 앞뒤 순서: 먼저 그린 팔이 뒤, 나중에 그린 팔이 앞.
const p = require('../../PauseUI_VARCO/tools/pix.js');
const NAVY = [15, 23, 54], DARK = [72, 79, 97], LIGHT = [116, 119, 129];
const CFG = {
  back: { S: [75, 86], E: [72, 100], H: [88, 90], tu: 2, tf: 3 },   // 화면 왼쪽 어깨에서 시작하는 팔 (뒤). tu 위팔 굵기, tf 아래팔 굵기
  front: { S: [92, 87], E: [95, 100], H: [78, 91], tu: 2, tf: 3 }  // 화면 오른쪽 어깨에서 시작하는 팔 (앞)
};
function line(x0, y0, x1, y1, f) { x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1); const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let err = dx + dy; for (;;) { f(x0, y0); if (x0 === x1 && y0 === y1) break; const e2 = 2 * err; if (e2 >= dy) { err += dy; x0 += sx; } if (e2 <= dx) { err += dx; y0 += sy; } } }
function drawArm(img, a) {
  const core = new Set(), key = (x, y) => x + ',' + y, stamp = (x, y, n) => { for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) core.add(key(x + i, y + j)); };
  line(a.S[0], a.S[1], a.E[0], a.E[1], (x, y) => stamp(x, y, a.tu)); // 위팔
  line(a.E[0], a.E[1], a.H[0], a.H[1], (x, y) => stamp(x, y, a.tf)); // 아래팔
  stamp(a.E[0] - 1, a.E[1] - 1, 3); // 팔꿈치 마디 (3x3)
  stamp(a.H[0] - 1, a.H[1] - 1, 4); // 손 (4x4)
  const set = (x, y, c) => { if (x < 0 || y < 0 || x >= img.w || y >= img.h) return; const o = (y * img.w + x) * 4; img.d[o] = c[0]; img.d[o + 1] = c[1]; img.d[o + 2] = c[2]; img.d[o + 3] = 255; };
  for (const k of core) { const [x, y] = k.split(',').map(Number); for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (!core.has(key(x + dx, y + dy))) set(x + dx, y + dy, NAVY); } // 윤곽
  for (const k of core) { const [x, y] = k.split(',').map(Number); set(x, y, (!core.has(key(x + 1, y)) || !core.has(key(x, y + 1))) ? DARK : LIGHT); } // 몸은 밝은 회색, 아래·오른쪽 가장자리는 어두운 회색
  return core.size;
}
// 수정 팔찌: 원화의 손목 수정. 팔 방향에 직각인 띠(길이 3 x 폭 6도트)에 밝은 연보라·보라·어두운 보라 면, 남색 윤곽, 한쪽 끝에 뾰족한 조각
const PU = { L: [244, 201, 252], B: [189, 93, 251], P: [158, 58, 251], D: [96, 30, 200] };
function drawBracelet(img, a) {
  const dx = a.H[0] - a.E[0], dy = a.H[1] - a.E[1], len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len, nx = -uy, ny = ux; // ux 팔 방향, n 직각 방향
  const cx = a.H[0] - ux * (a.bd || 3.5), cy = a.H[1] - uy * (a.bd || 3.5), px = new Map();
  const set = (x, y, c, force) => { const k = x + ',' + y; if (force || !px.has(k)) px.set(k, c); };
  const BW = a.bw || 2.5, BL = a.bl || 1; for (let t = -BL; t <= BL; t += 0.5) for (let s2 = -BW; s2 <= BW; s2 += 0.5) { const x = Math.round(cx + ux * t + nx * s2), y = Math.round(cy + uy * t + ny * s2), f = (s2 + BW) / (2 * BW); set(x, y, f < 0.34 ? PU.L : f < 0.68 ? PU.P : PU.D, true); } // 띠
  const tip = [Math.round(cx + nx * (BW + 1) + ux * 0.5), Math.round(cy + ny * (BW + 1) + uy * 0.5)], tip2 = [Math.round(cx + nx * BW + ux * 0.5), Math.round(cy + ny * BW + uy * 0.5)]; set(tip[0], tip[1], PU.L, true); set(tip2[0], tip2[1], PU.B, true); // 뾰족한 조각
  const keys = new Set(px.keys()); for (const [k] of [...px]) { const [x, y] = k.split(',').map(Number); for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const q = (x + i) + ',' + (y + j); if (!keys.has(q) && !px.has(q)) px.set(q, [15, 23, 54]); } } // 윤곽
  for (const [k, c] of px) { const [x, y] = k.split(',').map(Number); if (x < 0 || y < 0 || x >= img.w || y >= img.h) continue; const o = (y * img.w + x) * 4; if (c[0] === 15 && img.d[o + 3] && !(img.d[o] === 72 || img.d[o] === 116)) { /* 남색 윤곽은 이미 팔 윤곽이면 유지 */ } img.d[o] = c[0]; img.d[o + 1] = c[1]; img.d[o + 2] = c[2]; img.d[o + 3] = 255; }
  return px.size;
}
function drawCross(img, cfg) { cfg = cfg || CFG; const r = []; for (const a of [cfg.back, cfg.front]) { r.push(drawArm(img, a)); if (a.bracelet !== false) r.push(drawBracelet(img, a)); } return r; }
module.exports = { drawCross, drawArm, CFG };
if (require.main === module) {
  const [inp, out] = process.argv.slice(2), img = p.decode(inp), n = drawCross(img); p.encode(img, out); console.log('arms drawn, core dots', n.join('/'));
}
