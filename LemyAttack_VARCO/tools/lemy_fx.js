// 레미 "코어 방출" 공격 이펙트와 시간표 (작업 폴더 전용, Unity 와 무관). 이펙트는 전부 코드로 그림(VARCO 는 투명 출력이 없고, 레미 몸 아트는 그대로 쓰므로 필요 없음).
// 좌표는 화면(FHD 1920x1080) 픽셀. 도트 한 칸 = 화면 3px (레미 아트의 실제 도트 크기). 오버레이 캔버스 = 화면 [CX0,CY0,CW,CH] 영역.
// 색은 레미의 켜진 가슴 코어(T_ChestCore 오른쪽)와 눈에서 뽑은 단계만 사용: 윤곽 #0E1115, 어두운 청록 #007078, 청록 #00B8C0, 밝은 청록 #00F8F8, 흰빛 #E0F8F8.
const fs = require('fs'), path = require('path');
const p = require('../../PauseUI_VARCO/tools/pix.js');
const OUT = path.join(__dirname, '..', 'work'), D = 3; // 도트 = 3px
const CX0 = 230, CY0 = 100, CW = 560, CH = 185; // 오버레이/캡처 영역 (레미와 마법탄 진행 방향이 들어감, HP바 위까지)
const C = { ol: [14, 17, 21], t1: [0, 112, 120], t2: [0, 184, 192], t3: [0, 248, 248], w: [224, 248, 248], st: [56, 88, 96] };
const CORE = [334, 221]; // 가슴 코어 중심 화면 좌표 (실측: 화면 (327,214)~(342,228))
const px = (img, x, y, c) => { x = Math.round(x) - CX0; y = Math.round(y) - CY0; if (x < 0 || y < 0 || x >= img.w || y >= img.h) return; const o = (y * img.w + x) * 4; img.d[o] = c[0]; img.d[o + 1] = c[1]; img.d[o + 2] = c[2]; img.d[o + 3] = 255; };
// 도트 하나(3x3px)를 코어 격자(중심이 CORE)의 격자 좌표 (gx,gy) 에 그림: 중심 칸의 가운데가 CORE
const dot = (img, gx, gy, c, ox = 0, oy = 0) => { const x0 = Math.round(CORE[0] + ox) - 1 + gx * D, y0 = Math.round(CORE[1] + oy) - 1 + gy * D; for (let j = 0; j < D; j++) for (let i = 0; i < D; i++) px(img, x0 + i, y0 + j, c); };
const rect = (img, gx0, gy0, w, h, c, ox, oy) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) dot(img, gx0 + i, gy0 + j, c, ox, oy); };
const blank = () => p.blank(CW, CH);
// 코어 빛 구슬: 단계 1~4. 둥근 도트 원판을 바깥에서 안쪽으로 색 띠(어두운 청록 → 청록 → 밝은 청록 → 흰빛)로 겹쳐 그림. 단단한 도트 경계, 번짐 없음. 3단계부터 왼쪽 위에 흰 하이라이트 한 칸(켜진 코어 그림과 같은 위치)
function disc(img, bands) { for (const [R, c] of bands) for (let gy = -5; gy <= 5; gy++) for (let gx = -5; gx <= 5; gx++) if (Math.hypot(gx, gy) <= R) dot(img, gx, gy, c); }
function coreGlow(stage) {
  const img = blank();
  if (stage === 1) disc(img, [[2.4, C.t1]]);
  if (stage === 2) disc(img, [[3.4, C.t1], [2.4, C.t2]]);
  if (stage === 3) { disc(img, [[4.2, C.t1], [3.4, C.t2], [2.4, C.t3]]); dot(img, -1, -1, C.w); }
  if (stage === 4) disc(img, [[4.6, C.t2], [3.6, C.t3], [2.4, C.w]]);
  return img;
}
// 코어로 모이는 빛: 8방향 대칭. 멀 때(r>=6)는 2x2 덩어리, 가까우면 1칸 + 바깥쪽 꼬리 1칸(코어 쪽으로 움직이는 느낌). 모일수록 밝아짐
function converge(r, bright) {
  const img = blank(), dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]];
  for (const [dx, dy] of dirs) { const k = dx && dy ? 0.72 : 1, gx = Math.round(dx * r * k), gy = Math.round(dy * r * k * 0.6);
    if (r >= 6) { rect(img, gx, gy, 2, 2, bright ? C.t3 : C.t2); dot(img, gx, gy, bright ? C.w : C.t3); }
    else { dot(img, gx, gy, bright ? C.w : C.t3); dot(img, Math.round(dx * (r + 2) * k), Math.round(dy * (r + 2) * k * 0.6), C.t2); } }
  return img;
}
// 발사 순간: 코어에서 십자 섬광 한 장 (가운데 3x3 흰빛, 팔 길이 4, 대각 2)
function flash() {
  const img = blank(); rect(img, -1, -1, 3, 3, C.w);
  for (let k = 2; k <= 5; k++) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) dot(img, dx * k, dy * k, k < 4 ? C.t3 : C.t2);
  for (const [dx, dy] of [[1, 1], [-1, -1], [1, -1], [-1, 1]]) dot(img, dx * 2, dy * 2, C.t3);
  return img;
}
// 마법탄: 머리 9x7 도트(둥근 팔각, 윤곽 한 겹 + 청록 + 밝은 중심 + 흰빛 1칸) + 뒤로 줄어드는 꼬리 3묶음. 중심 = (x,y) 화면 좌표(머리 가운데)
const HEAD = ['..OOOOO..', '.OTTTTTO.', 'OTTBBBTTO', 'OTBWWWBTO', 'OTTBBBTTO', '.OTTTTTO.', '..OOOOO..'];
function bolt(img, x, y, tail = 3, flick = 0) {
  const put = (gx, gy, c) => { const x0 = Math.round(x) - 1 + gx * D, y0 = Math.round(y) - 1 + gy * D; for (let j = 0; j < D; j++) for (let i = 0; i < D; i++) px(img, x0 + i, y0 + j, c); };
  const col = { O: C.ol, T: C.t2, B: C.t3, W: C.w };
  HEAD.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== '.') put(i - 4, j - 3, ch === 'T' && flick && (i + j) % 2 === 0 ? C.t3 : col[ch]); }));
  for (let k = 0; k < tail; k++) { const gx = -6 - k * 2, c = [C.t3, C.t2, C.t1][k] || C.t1, h = [3, 1, 1][k] || 1; for (let j = 0; j < h; j++) { put(gx, -Math.floor(h / 2) + j, c); put(gx - 1, -Math.floor(h / 2) + j, c); } }
}
function boltFrame(x, y, tail, flick) { const img = blank(); bolt(img, x, y, tail, flick); return img; }
// 도착(소멸): 십자 모양으로 흩어졌다 사라짐 (2장)
function fade(x, y, stage) {
  const img = blank(), put = (gx, gy, c) => { const x0 = Math.round(x) - 1 + gx * D, y0 = Math.round(y) - 1 + gy * D; for (let j = 0; j < D; j++) for (let i = 0; i < D; i++) px(img, x0 + i, y0 + j, c); };
  if (stage === 1) { for (const [gx, gy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0], [0, 2], [0, -2]]) put(gx, gy, C.t3); put(0, 0, C.w); for (const [gx, gy] of [[3, 0], [-3, 0], [0, 3], [0, -3], [2, 2], [-2, -2], [2, -2], [-2, 2]]) put(gx, gy, C.t2); }
  else { for (const [gx, gy] of [[4, 0], [-4, 0], [0, 4], [0, -4]]) put(gx, gy, C.t2); for (const [gx, gy] of [[3, 3], [-3, -3], [3, -3], [-3, 3]]) put(gx, gy, C.t1); }
  return img;
}
const over = (...imgs) => { const o = blank(); for (const im of imgs) { if (!im) continue; for (let i = 0; i < CW * CH; i++) if (im.d[i * 4 + 3]) im.d.copy(o.d, i * 4, i * 4, i * 4 + 4); } return o; };
module.exports = { C, D, CX0, CY0, CW, CH, CORE, coreGlow, converge, flash, boltFrame, fade, over, blank };
