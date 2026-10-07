// 스테이지 현황판 정적 아트 생성: 기존 명패(MINO UPGRADES)의 빈 틀에서 파생 + 노드·연결선·왕관은 같은 팔레트로 도트 작성
// 출력(작업 폴더 parts/layers): T_StageBoard_Plate / Slot / Track / Node_Pending|Done|Current
const { p, R, hex, PAL, px, put, rect } = require('./lib_board');
const OUT = `${R}/parts/layers`;
const plate = p.decode(`${R}/work/plate_blank.png`); // 192x33 빈 명패 (룬 있음)

// ---------- 1. 룬을 지운 틀 (행 배경과 숫자 칸용) ----------
function eraseRunes(src) {
  const o = { w: src.w, h: src.h, d: Buffer.from(src.d) };
  for (const [x0, x1] of [[3, 21], [170, 188]]) {
    // 룬 칸 바탕색: 어두운 픽셀의 중앙값
    const rs = [], gs = [], bs = [];
    for (let y = 9; y <= 23; y++) for (let x = x0; x <= x1; x++) { const c = px(src, x, y); if ((c[0] + c[1] + c[2]) / 3 < 70 && c[2] - c[0] < 40) { rs.push(c[0]); gs.push(c[1]); bs.push(c[2]); } }
    const m = (a) => a.sort((u, v) => u - v)[Math.floor(a.length / 2)];
    const base = [m(rs), m(gs), m(bs)];
    for (let y = 8; y <= 24; y++) for (let x = x0; x <= x1; x++) { const c = px(src, x, y); if (c[2] - c[0] > 28 && c[1] > 70) put(o, x, y, base); }
  }
  return o;
}
// ---------- 2. 가로 길이를 맞춰 굽기: 양끝(24)과 위·아래 띠는 그대로, 가운데 무늬(40~152)를 반복 ----------
function bake(src, w, h) {
  const L = 24, Rr = 24, T = 9, B = 8, C0 = 40, C1 = 152, MID = 16;
  const o = p.blank(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const sx = x < L ? x : x >= w - Rr ? src.w - (w - x) : C0 + ((x - L) % (C1 - C0));
    const sy = y < T ? y : y >= h - B ? src.h - (h - y) : MID;
    const c = px(src, sx, sy); const od = (y * w + x) * 4; o.d[od] = c[0]; o.d[od + 1] = c[1]; o.d[od + 2] = c[2]; o.d[od + 3] = c[3];
  }
  return o;
}
p.encode(plate, `${OUT}/T_StageBoard_Plate.png`);
p.encode(bake(eraseRunes(plate), 236, 40), `${OUT}/T_StageBoard_Slot.png`);

// ---------- 3. 육각 노드 (납작한 위쪽 변, 33x29, 반지름 15) ----------
const NW = 33, NH = 29, HR = 15, HINR = HR * Math.sqrt(3) / 2;
function hexDepth(x, y) { // 육각형 안쪽으로 얼마나 들어왔는지 (변까지의 거리). 바깥이면 음수
  const dx = Math.abs(x + 0.5 - NW / 2), dy = Math.abs(y + 0.5 - NH / 2);
  return HINR - Math.max(dy, (Math.sqrt(3) * dx + dy) / 2);
}
function node(st) {
  const o = p.blank(NW, NH);
  for (let y = 0; y < NH; y++) for (let x = 0; x < NW; x++) {
    const d = hexDepth(x, y), top = y + 0.5 < NH / 2; // 위쪽 절반은 림을 한 단계 밝게 (돌 모서리 느낌)
    if (d < -2 || (d < 0 && st !== 'current')) continue;
    if (d < 0) { put(o, x, y, PAL.tealDim); continue; } // 현재: 바깥 1칸 청록 테두리만 (후광은 이것뿐)
    if (d < 1) { put(o, x, y, PAL.outline); continue; }
    if (d < 2) { put(o, x, y, st === 'pending' ? (top ? PAL.stoneLight : PAL.stoneMid) : st === 'done' ? PAL.tealDim : PAL.tealBright); continue; }
    if (d < 3) { put(o, x, y, st === 'pending' ? PAL.stoneEdge : st === 'done' ? PAL.tealDeep : PAL.tealMid); continue; }
    if (d < 4 && st === 'current') { put(o, x, y, PAL.outline); continue; }
    put(o, x, y, st === 'pending' ? PAL.fillDark : st === 'done' ? PAL.tealFill : PAL.tealFillHi);
  }
  return o;
}
for (const [st, name] of [['pending', 'Pending'], ['done', 'Done'], ['current', 'Current']]) p.encode(node(st), `${OUT}/T_StageBoard_Node_${name}.png`);

// ---------- 4. 연결선 + 보스 왕관 (노드 아래에 깔리는 정적 그림) ----------
const TW = 236, GAP = 18, TH = NH + GAP + NH; // 236x76
const CX = [24, 71, 118, 165, 212], Y1 = Math.floor(NH / 2), Y2 = NH + GAP + Math.floor(NH / 2);
const track = p.blank(TW, TH);
function hline(x0, x1, y) { for (let x = x0; x <= x1; x++) { put(track, x, y - 1, PAL.fillMid); put(track, x, y, PAL.stoneMid); put(track, x, y + 1, PAL.fillMid); } }
function vline(x, y0, y1) { for (let y = y0; y <= y1; y++) { put(track, x - 1, y, PAL.fillMid); put(track, x, y, PAL.stoneMid); put(track, x + 1, y, PAL.fillMid); } }
for (let i = 0; i < 4; i++) { hline(CX[i] + 15, CX[i + 1] - 15, Y1); hline(CX[i] + 15, CX[i + 1] - 15, Y2); } // 같은 줄 안 연결
const CH = NH + 4; // 두 줄 사이 가로 통로 높이 (5번 노드 아래 4칸)
vline(CX[4], NH - 2, CH + 1); hline(CX[0] - 1, CX[4] + 1, CH); vline(CX[0], CH - 1, NH + GAP + 2); // 5번 → 아래로 → 왼쪽으로 → 6번 위
// 왕관 (13x8, 10번 노드 위): 몸통 보라 + 외곽선
const crownRows = ['#.....#.....#', '##...###...##', '#############', '#############', '.###########.', '.###########.'];
const crownBody = ['#b57be8', '#b57be8', '#b57be8', '#9a5ed4', '#7a45b8', '#7a45b8'], CO = '#2d1752';
const cx0 = CX[4] - 6, cy0 = Y2 - Math.floor(NH / 2) - 8; // 노드 10 위쪽 바로 위
const mask = {}; crownRows.forEach((row, r) => row.split('').forEach((v, c) => { if (v === '#') mask[`${c},${r}`] = crownBody[r]; }));
for (const k of Object.keys(mask)) { const [c, r] = k.split(',').map(Number); for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (!mask[`${c + dx},${r + dy}`]) put(track, cx0 + 1 + c + dx, cy0 + 1 + r + dy, CO); }
for (const k of Object.keys(mask)) { const [c, r] = k.split(',').map(Number); put(track, cx0 + 1 + c, cy0 + 1 + r, mask[k]); }
put(track, cx0 + 1 + 6, cy0 + 1 + 3, '#fbe9ff'); // 가운데 보석 한 점
p.encode(track, `${OUT}/T_StageBoard_Track.png`);
console.log('완료: Plate 192x33, Slot 236x40, Node 33x29 x3, Track', TW + 'x' + TH, '| 노드 중심 x', CX.join(','), 'y', Y1, Y2);
