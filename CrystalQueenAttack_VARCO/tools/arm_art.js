// 양팔 낮게 벌리기 v4 (작업 폴더 전용): 원본 Idle 과 같은 "2x2 스프라이트 픽셀 = 도트 1칸" 격자(블록 위상 (1,1))에서 만든다.
//  - 팔 밖은 원본 픽셀 그대로.
//  - 원래 팔 자리는 "블록 단위로" 비우고 VARCO 팔 없는 바탕(2x2 블록 스냅, noarm_art4.png)으로 채움 (등 뒤 수정 보완).
//  - 돌 위팔·손목 수정 아래팔은 블록 선(폭 2블록)으로 새로 그림, 윤곽 1블록. 손은 원본 돌 손 픽셀을 짝수 픽셀만큼만 이동(격자 유지).
// 사용: node tools/arm_art.js <rest|mid|final> <out.png>
const path = require('path');
const p = require('../../PauseUI_VARCO/tools/pix.js');
const { cls } = require('./arm_composite.js');
const AO = require('./arm_open.js');
const R = path.join(__dirname, '..'), W = 160;
const IDLE = 'C:/Users/MBC-501-15/Documents/Tetrigeon/Tetrigeon/Assets/@Resources/Enemies/CrystalQueenIdle/T_CrystalQueen_Idle.png';
const base = p.crop(p.decode(IDLE), 0, 0, W, W), art = p.decode(path.join(R, 'work', 'noarm_art4.png'));
const NAVY = [15, 23, 54], DARK = [72, 79, 97], LIGHT = [116, 119, 129], LIL = [244, 201, 252], BRI = [189, 93, 251], MID = [158, 58, 251];
const GR = new Set(['72,79,97', '116,119,129', '88,94,108']);
const A = (im, x, y) => x >= 0 && y >= 0 && x < W && y < W && im.d[(y * W + x) * 4 + 3] > 0;
const col = (im, x, y) => { const o = (y * W + x) * 4; return [im.d[o], im.d[o + 1], im.d[o + 2]]; };
const bi = (x) => Math.floor((x - 1) / 2); // 픽셀 좌표 → 블록 번호 (블록 i = 픽셀 2i+1..2i+2)
// 팔 단계별 블록 기하 (블록 좌표, 2x2 스탬프의 왼쪽 위): S 어깨 시작, E 팔꿈치, W 손목, h 손 이동(블록)
const GEO = {
  L: { rest: { S: [36, 43], E: [36, 48], W: [33, 52], h: [0, 0] }, mid: { S: [36, 43], E: [35, 48], W: [32, 52], h: [-1, 0] }, final: { S: [36, 43], E: [34, 48], W: [30, 52], h: [-3, -1] } },
  R: { rest: { S: [46, 44], E: [47, 49], W: [50, 53], h: [0, 0] }, mid: { S: [46, 44], E: [48, 49], W: [52, 52], h: [1, 0] }, final: { S: [46, 44], E: [49, 49], W: [54, 52], h: [2, -1] } }
};
function line(x0, y0, x1, y1, f) { const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let err = dx + dy; for (;;) { f(x0, y0); if (x0 === x1 && y0 === y1) break; const e2 = 2 * err; if (e2 >= dy) { err += dy; x0 += sx; } if (e2 <= dx) { err += dx; y0 += sy; } } }
// 보호 픽셀: 머리, 가슴 코어, 몸통 왼쪽 부분 (절대 바꾸지 않음)
function protectSet() {
  const prot = new Uint8Array(W * W);
  for (let y = 56; y <= 92; y++) for (let x = 70; x <= 90; x++) prot[y * W + x] = 1; // 얼굴·왕관·목·코어 (X70-90, Y56-92)
  return prot;
}
function vacatedPixels() { // 팔 자리 = 실제 팔 조각만 (왼팔: 회색 위팔+윤곽, 손목 수정+윤곽, 손 / 오른팔: 회색 사선+윤곽, 몸통 오른쪽 가장자리 선, 손), 1픽셀 팽창
  const A3 = require('./arm_open3.js'), out = new Uint8Array(W * W);
  const mark = (keys) => { for (const k of keys) { const [x, y] = k.split(',').map(Number); if (x >= 0 && y >= 0 && x < W && y < W) out[y * W + x] = 1; } }; // 팽창 없음: 팔 조각 픽셀을 포함한 블록만 비움
  mark(A3.armL.keys()); mark(A3.armR.keys()); mark(A3.torsoEdgeR.keys()); mark(AO.HL.px.keys()); mark(AO.HR.px.keys()); return out;
}
function buildStage(stage, opt = {}) { // opt.guard: 손목 팔찌 대신 전완(팔꿈치 아래~손 위)을 수정 암가드로 덮음
  const out = { w: W, h: W, d: opt.armsOnly ? Buffer.alloc(base.d.length) : Buffer.from(base.d) }; // opt.armsOnly: 팔(손 포함)만 투명 캔버스에, opt.noArms: 팔 없는 몸만
  if (stage === 'rest') return { img: out, info: '원본 그대로' };
  const prot = protectSet(), vac = vacatedPixels(), blocks = new Set();
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) if (vac[y * W + x]) blocks.add(bi(x) + ',' + bi(y));
  let filled = 0, skipped = 0; const rightBlocks = new Set([...blocks].filter(k => +k.split(',')[0] >= 43));
  const purpleBlock = (i, j) => { const x = 2 * i + 1, y = 2 * j + 1; return x >= 0 && y >= 0 && x < W && y < W && A(base, x, y) && !blocks.has(i + ',' + j) && cls(base.d, (y * W + x) * 4) === 'purple'; };
  const bfsColor = (i, j) => { for (let r = 1; r <= 5; r++) { let best = null, bd = 1e9; for (let b = -r; b <= r; b++) for (let a = -r; a <= r; a++) { if (Math.max(Math.abs(a), Math.abs(b)) !== r) continue; if (purpleBlock(i + a, j + b)) { const d = a * a + b * b + (b > 0 ? 0.5 : 0); if (d < bd) { bd = d; best = col(base, 2 * (i + a) + 1, 2 * (j + b) + 1); } } } if (best) return best; } return null; };
  if (!opt.armsOnly) for (const k of blocks) { const [i, j] = k.split(',').map(Number); let hit = false; for (let y = 2 * j + 1; y <= 2 * j + 2; y++) for (let x = 2 * i + 1; x <= 2 * i + 2; x++) if (x >= 0 && y >= 0 && x < W && y < W && prot[y * W + x]) hit = true; if (hit) { skipped++; continue; } if (rightBlocks.has(k)) { const c = bfsColor(i, j); for (let y = 2 * j + 1; y <= 2 * j + 2; y++) for (let x = 2 * i + 1; x <= 2 * i + 2; x++) { if (x >= W || y >= W) continue; const o = (y * W + x) * 4; if (c) { out.d[o] = c[0]; out.d[o + 1] = c[1]; out.d[o + 2] = c[2]; out.d[o + 3] = 255; } else out.d[o + 3] = 0; } filled++; continue; } for (let y = 2 * j + 1; y <= 2 * j + 2; y++) for (let x = 2 * i + 1; x <= 2 * i + 2; x++) { if (x >= W || y >= W) continue; art.d.copy(out.d, (y * W + x) * 4, (y * W + x) * 4, (y * W + x) * 4 + 4); } filled++; }
  const setBlock = (i, j, c, force) => { for (let y = 2 * j + 1; y <= 2 * j + 2; y++) for (let x = 2 * i + 1; x <= 2 * i + 2; x++) { if (x >= W || y >= W || x < 0 || y < 0 || prot[y * W + x]) continue; const o = (y * W + x) * 4; out.d[o] = c[0]; out.d[o + 1] = c[1]; out.d[o + 2] = c[2]; out.d[o + 3] = 255; } };
  const info = { stage, filledBlocks: filled, skippedProtectedBlocks: skipped }, hands = {}; // hands: 회전 손으로 실제 찍은 픽셀 (간격 측정용)
  for (const key of (opt.noArms ? [] : (opt.order || ['L', 'R']))) {
    const patch = key === 'L' ? AO.HL : AO.HR, g = opt.geo ? opt.geo[key] : GEO[key][stage], fill = new Map(), horiz = !!opt.geo && Math.abs(g.W[0] - g.E[0]) > Math.abs(g.W[1] - g.E[1]); // opt.geo: 장면별 팔 기하 지정, horiz: 전완이 가로에 가까움
    const stamp = (i, j, tag) => { for (let b = 0; b < 2; b++) for (let a = 0; a < 2; a++) { const k = (i + a) + ',' + (j + b); if (!fill.has(k) || tag === 'F') fill.set(k, tag); } };
    const upper = new Set(), fore = new Set();
    line(g.S[0], g.S[1], g.E[0], g.E[1], (i, j) => { for (let b = 0; b < 2; b++) for (let a = 0; a < 2; a++) upper.add((i + a) + ',' + (j + b)); }); // 위팔(돌)
    const fpos = []; line(g.E[0], g.E[1], g.W[0], g.W[1], (i, j) => fpos.push([i, j])); const BR = opt.guard ? fpos.length - 1 : 3; // 아래팔: 앞쪽은 돌, 손목 쪽 3칸은 수정 팔찌 (guard: 팔꿈치 1칸만 돌, 나머지 전체가 암가드)
    fpos.forEach(([i, j], n) => { const set = n >= fpos.length - BR ? fore : upper; for (let b = 0; b < 2; b++) for (let a = 0; a < 2; a++) set.add((i + a) + ',' + (j + b));
      if (opt.guard && set === fore && n < fpos.length - 1) for (let b = 0; b < 2; b++) fore.add(horiz ? (i + b) + ',' + (j + (g.wide === 'up' ? -1 : 2)) : (i + (key === 'L' ? -1 : 2)) + ',' + (j + b)); }); // 암가드는 손목 직전 칸을 빼고 바깥쪽으로 한 칸 두껍게 (좌우 방향만 다름)
    const body = new Map(); for (const k of upper) body.set(k, 'S'); for (const k of fore) body.set(k, 'F'); // 팔찌가 돌과 겹치면 팔찌가 위
    // 윤곽: 몸 블록의 8방향 이웃 중 몸이 아닌 블록
    const ring = new Set(); for (const k of body.keys()) { const [i, j] = k.split(',').map(Number); for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) { const q = (i + a) + ',' + (j + b); if (!body.has(q)) ring.add(q); } }
    for (const k of ring) { const [i, j] = k.split(',').map(Number); setBlock(i, j, NAVY, true); }
    const rows = new Map(); for (const [k, tag] of body) if (tag === 'F') { const [i, j] = k.split(',').map(Number); if (!rows.has(j)) rows.set(j, []); rows.get(j).push(i); } for (const r of rows.values()) r.sort((a, b) => a - b); // 암가드 줄별 블록 (왼쪽부터)
    const guardTop = Math.min(...rows.keys()), guardBot = Math.max(...rows.keys()); // 암가드 맨 윗줄 (소매 테두리)
    for (const [k, tag] of body) { const [i, j] = k.split(',').map(Number); if (tag === 'F' && opt.guard) { const r = rows.get(j), n = r.indexOf(i); if (horiz) { setBlock(i, j, j === guardTop ? LIL : j === guardBot ? MID : BRI, true); continue; } setBlock(i, j, j === guardTop || n === 0 || (n === 1 && r.length >= 4) ? LIL : n === r.length - 1 ? MID : BRI, true); continue; } if (tag === 'S') setBlock(i, j, (!body.has((i + 1) + ',' + j) || !body.has(i + ',' + (j + 1))) ? DARK : LIGHT, true); else setBlock(i, j, !body.has((i - 1) + ',' + j) || !body.has(i + ',' + (j - 1)) ? LIL : (!body.has((i + 1) + ',' + j) || !body.has(i + ',' + (j + 1)) ? MID : BRI), true); }
    // 손: 원본 돌 손 픽셀을 짝수 픽셀(블록 단위)만큼 이동
    if (g.hand) { const ax = 2 * Math.floor((patch.cx - 1) / 2) + 1, ay = 2 * Math.floor((patch.top - 1) / 2) + 1, ROT = { down: (u, v) => [u, v], left: (u, v) => [-v - 1, u], right: (u, v) => [v, -u - 1], up: (u, v) => [-u - 1, -v - 1] }[g.hand.rot]; // 손 패치를 90도 단위로 돌려도 2x2 블록 격자가 유지되는 변환
      for (const [k, c] of patch.px) { const [x, y] = k.split(',').map(Number), [nu, nv] = ROT(x - ax, y - ay), X = 2 * g.hand.at[0] + 1 + nu, Y = 2 * g.hand.at[1] + 1 + nv; if (X < 0 || Y < 0 || X >= W || Y >= W || prot[Y * W + X]) continue; const o = (Y * W + X) * 4; out.d[o] = c[0]; out.d[o + 1] = c[1]; out.d[o + 2] = c[2]; out.d[o + 3] = 255; (hands[key] = hands[key] || []).push([X, Y]); } info[key] = { upperBlocks: upper.size, foreBlocks: fore.size, hand: g.hand }; continue; }
    const sh = [g.h[0] * 2, g.h[1] * 2]; for (const [k, c] of patch.px) { const [x, y] = k.split(',').map(Number), X = x + sh[0], Y = y + sh[1]; if (X < 0 || Y < 0 || X >= W || Y >= W || prot[Y * W + X]) continue; const o = (Y * W + X) * 4; out.d[o] = c[0]; out.d[o + 1] = c[1]; out.d[o + 2] = c[2]; out.d[o + 3] = 255; }
    info[key] = { upperBlocks: upper.size, foreBlocks: fore.size, handShiftPx: sh };
  }
  // 원래 팔(손)에서 남은 떨어진 잔여 조각(8도트 미만 덩어리) 제거
  const seen = new Uint8Array(W * W); let removed = 0;
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
    if (!A(out, x, y) || seen[y * W + x]) continue;
    const cells = [], st = [[x, y]]; seen[y * W + x] = 1;
    while (st.length) { const [a, b] = st.pop(); cells.push([a, b]); for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = a + dx, Y = b + dy; if (A(out, X, Y) && !seen[Y * W + X]) { seen[Y * W + X] = 1; st.push([X, Y]); } } }
    if (cells.length < 8) { for (const [a, b] of cells) out.d[(b * W + a) * 4 + 3] = 0; removed += cells.length; }
  }
  info.removedStrayPixels = removed;
  return { img: out, info, hands };
}
module.exports = { buildStage, GEO };
if (require.main === module) { const [stage, outp, g] = process.argv.slice(2), r = buildStage(stage, { guard: g === 'guard' }); p.encode(r.img, outp); console.log(JSON.stringify(r.info)); }
