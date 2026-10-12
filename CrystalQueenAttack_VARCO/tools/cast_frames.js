// 시전 공격 전체 프레임 v3 (작업 폴더 전용, Unity와 무관): 승인된 자세(손 모음 A, 팔 뻗기 B) 사이 중간 프레임 + 전신 기울이기(휘기) + 수정이 여왕 앞까지 비행.
//  v2 의 줄 밀기(shear)는 모든 줄이 같은 높이에서 어긋나 가로 "층"이 생겨 폐기. v3 는 몸(팔 제외)을 bend.js 로 부드럽게 휘고, 팔·손은 원본 블록 그림 그대로 평행 이동해서 얹는다.
//  캐릭터 8장(기울임 적용)·기울이기 전 8장·팔만 8장(검증용)·이펙트(수정·마법·섬광, 캐릭터 앞 한 층)와 시간표를 저장. 모든 셀은 같은 160x160 좌표.
const fs = require('fs'), path = require('path');
const p = require('../../PauseUI_VARCO/tools/pix.js');
const AA = require('./arm_art.js'), CP = require('./cast_poses.js'), FX = require('./fx_cast.js'), BD = require('./bend.js');
const VER = 'v3', R = path.join(__dirname, '..'), OUT = path.join(R, 'output'), D = (n) => path.join(OUT, 'CastFrames_' + VER + '_' + n);
const IDLE = 'C:/Users/MBC-501-15/Documents/Tetrigeon/Tetrigeon/Assets/@Resources/Enemies/CrystalQueenIdle/T_CrystalQueen_Idle.png';
// 팔 기하 (블록 좌표): 기본 자세의 원래 팔(위팔 아래·전완 안쪽 아래·손 아래)을 같은 형식으로 적은 것
const REST = { L: { S: [36, 43], E: [36, 48], W: [33, 52], hand: { rot: 'down', at: [33, 53] } }, R: { S: [46, 44], E: [47, 49], W: [50, 53], hand: { rot: 'down', at: [50, 54] } } };
const GA = CP.POSES.A_clasp.geo, GB = CP.POSES.B_reach.geo;
const mix = (a, b) => (t) => [Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t)];
function between(g0, g1, t, rot) { const o = {}; for (const k of ['L', 'R']) o[k] = { S: g1[k].S, E: mix(g0[k].E, g1[k].E)(t), W: mix(g0[k].W, g1[k].W)(t), hand: { rot: rot[k], at: mix(g0[k].hand.at, g1[k].hand.at)(t) }, wide: g1[k].wide }; return o; }
const FRAMES = { // 손 방향은 90도 단위라 방향이 바뀌는 구간은 '아래'를 거침
  g1: () => between(REST, GA, 0.35, { L: 'down', R: 'down' }), g2: () => between(REST, GA, 0.7, { L: GA.L.hand.rot, R: GA.R.hand.rot }), A: () => GA,
  r1: () => between(GA, GB, 0.5, { L: 'down', R: GB.R.hand.rot }), B: () => GB,
  d1: () => between(GB, REST, 0.5, { L: 'down', R: 'down' }), d2: () => between(GB, REST, 0.8, { L: 'down', R: 'down' })
};
// 전신 기울기(도): + = 앞(레미 방향, 화면 왼쪽), - = 뒤. 손 모을 때 뒤로 5도, 팔 뻗을 때 앞으로 15도
const LEAN = { rest: 0, g1: -2, g2: -4, A: -5, r1: 5, B: 15, d1: 8, d2: 3 };
const base = p.crop(p.decode(IDLE), 0, 0, 160, 160), X0 = 91; // X0: 몸 중심축(발바닥 줄 가로 중앙)
const e2 = (v) => 2 * Math.round(v / 2); // 짝수 픽셀(블록)로 반올림
const tr = (img, dx, dy) => { const o = { w: 160, h: 160, d: Buffer.alloc(img.d.length) }; for (let y = 0; y < 160; y++) for (let x = 0; x < 160; x++) { const a = (y * 160 + x) * 4; if (!img.d[a + 3]) continue; const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= 160 || Y >= 160) throw new Error('이동으로 셀 밖: ' + X + ',' + Y); img.d.copy(o.d, (Y * 160 + X) * 4, a, a + 4); } return o; };
// 다시 찍기로 모양이 바뀌면 안 되는 작은 디테일은 원본 픽셀을 짝수 px 이동만 해서 다시 찍는다:
//  - 얼굴 묶음(눈 청록 8px + 눈썹 남색 + 눈 왼쪽 남색 + 왼쪽 위 연청 4px + 위쪽 보라 점 + 둘레 회색, 원본 X75~84·Y63~70 상자째)
//  - 가슴 코어(연청 8px), 오른쪽 위 수정 하이라이트(연청 4px)
const rectPx = (x0, y0, x1, y1) => { const L = []; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const q = (y * 160 + x) * 4; if (base.d[q + 3]) L.push([x, y, base.d[q], base.d[q + 1], base.d[q + 2]]); } return L; };
const colPx = (win, col) => rectPx(...win).filter(q => q[2] === col[0] && q[3] === col[1] && q[4] === col[2]);
const CYAN = [51, 229, 239], PALE = [188, 199, 245];
const MARKS = [{ name: 'face', clear: [CYAN, PALE], px: rectPx(75, 63, 84, 70) }, { name: 'core', clear: [PALE], px: colPx([76, 86, 81, 90], PALE) }, { name: 'hl', clear: [PALE], px: colPx([98, 48, 101, 51], PALE) }];
function stamp(body, deg) {
  const shifts = {};
  for (const m of MARKS) {
    const cx = m.px.reduce((a, q) => a + q[0] + 0.5, 0) / m.px.length, cy = m.px.reduce((a, q) => a + q[1] + 0.5, 0) / m.px.length, [dx, dy] = BD.disp(deg, X0, cx, cy), sx = e2(dx), sy = e2(dy); shifts[m.name] = [sx, sy];
    const isClear = (q) => m.clear.some(col => body.d[q] === col[0] && body.d[q + 1] === col[1] && body.d[q + 2] === col[2]);
    for (let y = Math.round(cy + dy) - 9; y <= Math.round(cy + dy) + 9; y++) for (let x = Math.round(cx + dx) - 9; x <= Math.round(cx + dx) + 9; x++) { // 창 안에 휜 결과가 만든 같은 색 픽셀 제거 (둘레에서 가장 많은 다른 색으로)
      if (x < 1 || y < 1 || x > 158 || y > 158) continue; const q = (y * 160 + x) * 4; if (!(body.d[q + 3] && isClear(q))) continue;
      const cnt = new Map(); for (let b = -3; b <= 3; b++) for (let a = -3; a <= 3; a++) { const n = ((y + b) * 160 + x + a) * 4; if (!body.d[n + 3] || isClear(n)) continue; const k = body.d[n] + ',' + body.d[n + 1] + ',' + body.d[n + 2]; cnt.set(k, (cnt.get(k) || 0) + 1); }
      let best = null, bn = 0; for (const [k, n] of cnt) if (n > bn) { bn = n; best = k; } if (best) { const c = best.split(',').map(Number); body.d[q] = c[0]; body.d[q + 1] = c[1]; body.d[q + 2] = c[2]; }
    }
    for (const [x, y, r, g, b] of m.px) { const q = ((y + sy) * 160 + x + sx) * 4; body.d[q] = r; body.d[q + 1] = g; body.d[q + 2] = b; body.d[q + 3] = 255; }
  }
  return shifts;
}
// 프레임 만들기: 기울이기 전(팔 포함) / 팔만 / 팔 없는 몸을 휜 것 + 팔(이동) = 최종
const GEO0 = FRAMES.A(), ORDER = ['R', 'L'], armless = AA.buildStage('final', { guard: true, geo: GEO0, order: ORDER, noArms: true }).img;
const upright = { rest: base }, armsUp = {}, ch = {}, armShift = {}, markShift = {};
for (const [k, f] of Object.entries(FRAMES)) { upright[k] = AA.buildStage('final', { guard: true, geo: f(), order: ORDER }).img; armsUp[k] = AA.buildStage('final', { guard: true, geo: f(), order: ORDER, armsOnly: true }).img; }
for (const k of Object.keys(upright)) {
  const deg = LEAN[k]; if (deg === 0) { ch[k] = upright[k]; armShift[k] = [0, 0]; continue; }
  const body = BD.bend(armless, deg, X0); for (let x = 0; x < 160; x++) body.d[(148 * 160 + x) * 4 + 3] = 0; // 도트 올림으로 생긴 148줄 제거 (발바닥 Y=147 유지)
  const mk = stamp(body, deg); markShift[k] = mk; const [dx, dy] = BD.disp(deg, X0, 83, 95); armShift[k] = [e2(dx), e2(dy)]; // 팔은 어깨~손 중간 지점의 이동량(짝수 px)만큼 평행 이동 (두 팔이 같이 움직여 손 사이 간격 유지)
  const arms = tr(armsUp[k], ...armShift[k]); ch[k] = body; for (let i = 0; i < 25600; i++) if (arms.d[i * 4 + 3]) arms.d.copy(ch[k].d, i * 4, i * 4, i * 4 + 4);
}
// 이펙트 (블록 좌표). 마법 중심 = 기울이기 전 위치 + 팔이 움직인 양
const ab = (k) => [armShift[k][0] / 2, armShift[k][1] / 2];
const HA = [41 + ab('A')[0], 50 + ab('A')[1]], HR1 = [24 + ab('r1')[0], 47 + ab('r1')[1]], HB = [15 + ab('B')[0], 46 + ab('B')[1]];
// 수정 3개의 기울이기 전 왼쪽 위 블록: 등 뒤 오른쪽 여백, 높이를 달리함. 날아가는 줄이 얼굴·코어(Y55~92)와 팔·손(Y89~107)을 가리지 않게 위쪽 날개 높이 / 손 아래 두 줄
const CRY = [[66, 20], [67, 54], [66, 64]], CAP = [68, 67, 68]; // CAP: 왼쪽 위 블록 상한 (게임 화면 오른쪽 끝 1920px 안)
const att = (n, k) => { const [i, j] = CRY[n], dx = BD.disp(LEAN[k], X0, 2 * (i + 4) + 1, 2 * (j + 2) + 1)[0]; return [Math.min(CAP[n], i + Math.round(dx / 2)), j]; }; // 몸에 붙어 같이 기울어지는 가로 위치 (높이는 고정)
// 발사 끝: 수정 왼쪽 끝이 그 높이에서 여왕(기울어진 팔 뻗기 자세)의 맨 왼쪽보다 5블록(10px) 앞
const AHEAD = 5, endI = CRY.map(([, j]) => { let m = 999; for (let y = 2 * j + 1; y <= 2 * (j + 4) + 2; y++) for (let x = 0; x < 160; x++) if (ch.B.d[(y * 160 + x) * 4 + 3]) { m = Math.min(m, x); break; } return Math.max(1, Math.floor((m - 2 * AHEAD - 1) / 2)); });
const cry = (c, n, st, k = 'B', f = 0) => { const [i0, j] = att(n, k); if (st === 'full') FX.place(c, 'crystal', i0, j); else if (st === 'fly') FX.place(c, 'crystal', Math.round(i0 + (endI[n] - i0) * f), j); else FX.placeC(c, st === 'small' ? 'crystalS' : 'dot', i0 + 4, j + 2); };
const flash = (c, n, kind) => FX.placeC(c, kind, endI[n] + 4, CRY[n][1] + 2);
const allC = (c, k) => [0, 1, 2].forEach(n => cry(c, n, 'full', k));
// 시간표: ms 는 10의 배수. fx = 캐릭터 앞 층(마법·수정·섬광)
const STEPS = [
  { id: 'T00', ch: 'rest', ms: 40, role: '기본' },
  { id: 'T01', ch: 'g1', ms: 60, role: '손 모으기 중간 1 (뒤로 2도)' },
  { id: 'T02', ch: 'g2', ms: 60, role: '손 모으기 중간 2 (뒤로 4도)' },
  { id: 'T03', ch: 'A', ms: 60, role: '손 모음 (뒤로 5도)' },
  { id: 'T04', ch: 'A', ms: 60, role: '손 사이 마법', fx: c => FX.placeC(c, 'spark1', ...HA) },
  { id: 'T05', ch: 'A', ms: 50, role: '마법 + 수정 생성 1', fx: c => { FX.placeC(c, 'spark2', ...HA); cry(c, 0, 'small', 'A'); cry(c, 1, 'dot', 'A'); } },
  { id: 'T06', ch: 'A', ms: 50, role: '마법 + 수정 생성 2', fx: c => { FX.placeC(c, 'spark2', ...HA); cry(c, 0, 'full', 'A'); cry(c, 1, 'small', 'A'); cry(c, 2, 'dot', 'A'); } },
  { id: 'T07', ch: 'A', ms: 70, role: '마법 + 수정 3개 완성', fx: c => { FX.placeC(c, 'spark2', ...HA); allC(c, 'A'); } },
  { id: 'T08', ch: 'r1', ms: 50, role: '팔 뻗기 중간 (앞으로 5도) + 작은 마법', fx: c => { FX.placeC(c, 'starS', ...HR1); allC(c, 'r1'); } },
  { id: 'T09', ch: 'B', ms: 70, role: '팔 뻗기 (앞으로 15도) + 마법', fx: c => { FX.placeC(c, 'star', ...HB); allC(c, 'B'); } },
  { id: 'T10', ch: 'B', ms: 50, role: '발사 1: 1번 수정 출발 + 마법', fx: c => { FX.placeC(c, 'burst', ...HB); cry(c, 0, 'fly', 'B', 0.25); cry(c, 1, 'full'); cry(c, 2, 'full'); } },
  { id: 'T11', ch: 'B', ms: 50, role: '발사 2: 2번 출발', fx: c => { FX.placeC(c, 'burst2', ...HB); cry(c, 0, 'fly', 'B', 0.5); cry(c, 1, 'fly', 'B', 0.25); cry(c, 2, 'full'); } },
  { id: 'T12', ch: 'B', ms: 50, role: '발사 3: 3번 출발', fx: c => { cry(c, 0, 'fly', 'B', 0.75); cry(c, 1, 'fly', 'B', 0.5); cry(c, 2, 'fly', 'B', 0.25); } },
  { id: 'T13', ch: 'B', ms: 50, role: '발사 4: 1번 소멸 섬광 (대표 타격 시점)', fx: c => { flash(c, 0, 'flash0'); cry(c, 1, 'fly', 'B', 0.75); cry(c, 2, 'fly', 'B', 0.5); } },
  { id: 'T14', ch: 'B', ms: 50, role: '발사 5: 2번 섬광', fx: c => { flash(c, 0, 'flash1'); flash(c, 1, 'flash0'); cry(c, 2, 'fly', 'B', 0.75); } },
  { id: 'T15', ch: 'd1', ms: 60, role: '팔 내리기 중간 1 (앞으로 8도) + 3번 섬광', fx: c => { flash(c, 1, 'flash1'); flash(c, 2, 'flash0'); } },
  { id: 'T16', ch: 'd2', ms: 60, role: '팔 내리기 중간 2 (앞으로 3도) + 마지막 잔상', fx: c => flash(c, 2, 'flash1') }
];
const CELLNAME = { rest: '0_rest', g1: '1_gather1', g2: '2_gather2', A: '3_clasp', r1: '4_reach-mid', B: '5_reach', d1: '6_lower1', d2: '7_lower2' };
for (const n of ['cells', 'cells_upright', 'cells_arms_upright', 'fx']) fs.mkdirSync(D(n), { recursive: true });
for (const k of Object.keys(ch)) { p.encode(ch[k], path.join(D('cells'), 'CrystalQueen_CastFrame_' + CELLNAME[k] + '.png')); p.encode(upright[k], path.join(D('cells_upright'), 'CrystalQueen_CastFrame_' + CELLNAME[k] + '_upright.png')); if (armsUp[k]) p.encode(armsUp[k], path.join(D('cells_arms_upright'), 'CrystalQueen_CastArms_' + CELLNAME[k] + '_upright.png')); }
let t0 = 0; const meta = [];
for (const s of STEPS) {
  const m = { step: s.id, start_ms: t0, ms: s.ms, lean_deg: LEAN[s.ch], arm_shift_px: armShift[s.ch], mark_shift_px: markShift[s.ch] || null, character: 'CastFrames_' + VER + '_cells/CrystalQueen_CastFrame_' + CELLNAME[s.ch] + '.png', fx: null, role: s.role };
  if (s.fx) { const c = FX.blank(); s.fx(c); m.fx = 'CastFrames_' + VER + '_fx/CrystalQueen_CastFx_' + s.id + '.png'; p.encode(c, path.join(OUT, m.fx)); }
  meta.push(m); t0 += s.ms;
}
const hit = STEPS.findIndex(s => s.id === 'T13'), J = { note: '시전 공격 중간 프레임 v3 (미리보기용, Unity 미적용): 전신 기울이기(뒤 5도 → 앞 15도, 휘기) + 수정이 여왕 앞까지 비행. 레이어 2개(캐릭터, 이펙트=캐릭터 앞)는 같은 160x160 셀·피벗 (0.5,0.45).', cell: [160, 160], pivot_unity: [0.5, 0.45], ppu: 75.6, flipX: 0, attack_ms: t0, rest_between_attacks_ms: 500,
  lean_method: '몸(팔 제외)을 중심선이 휘는 bend 로 기울임: 기울기가 발바닥 0 → 발바닥 위 50px 이상 θ 로 부드럽게 변하고(발바닥 Y=147 고정), 결과는 2x2 도트 격자로 8x8 지점 다수결로 다시 찍음. 눈·코어는 원본 픽셀을 이동만 해서 다시 찍음. 팔·손은 원본 블록 그림 그대로 평행 이동(짝수 px)', lean_deg: LEAN, body_axis_x: X0, ramp_px: BD.RAMP,
  crystal_flight: { top_left_blocks_before_lean: CRY, top_left_cap_blocks: CAP, end_left_edge_block: endI, ahead_of_queen_px: 2 * AHEAD, rule: '수정 왼쪽 끝이 그 높이에서 여왕(팔 뻗기 자세)의 맨 왼쪽보다 10px 앞에서 소멸 섬광' },
  representative_hit: { step: 'T13', start_ms: STEPS.slice(0, hit).reduce((a, s) => a + s.ms, 0), meaning: '첫 수정 소멸 섬광 시작 (제안값, 확정 아님)' }, character_cells: CELLNAME, steps: meta };
fs.writeFileSync(path.join(OUT, 'CastFrames_' + VER + '_timeline.json'), JSON.stringify(J, null, 1));
module.exports = { VER, STEPS, ch, upright, CELLNAME, LEAN, J, endI, att, HA, HB, HR1, CRY, armShift };
if (require.main === module) console.log('캐릭터 셀', Object.keys(ch).length, '이펙트 셀', meta.filter(m => m.fx).length, '공격 총', t0, 'ms', '대표 타격', J.representative_hit.start_ms, 'ms', '수정 끝 블록', endI.join(','), '팔 이동', JSON.stringify(armShift), '마법 중심', JSON.stringify({ HA, HR1, HB }));
