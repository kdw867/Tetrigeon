// 센티넬 웅크림 자세 안내 이미지 (작업 폴더 전용, Unity와 무관): 원본 Idle 01 을 파츠(머리·몸통 / 왼팔·주먹 / 오른쪽 수정 팔 / 왼다리 / 오른다리)로 나눠 도트 단위로 옮겨 관절을 구부린다.
// 원본 도트는 하나도 새로 그리지 않고 옮기기만 한다(수정 배치·색 유지). 파츠 사이 틈은 모폴로지 닫힘으로 임시로 메우며, 최종 이음새 정리는 VARCO 가 하도록 안내 이미지로 쓴다.
const fs = require('fs'), path = require('path');
const p = require('../../PauseUI_VARCO/tools/pix.js');
const SHEET = 'C:/Users/MBC-501-15/Documents/Tetrigeon/Tetrigeon/Assets/@Resources/Enemies/AmethystSentinelIdle/T_AmethystSentinel_Idle.png';
const X0 = 8, Y0 = 14, BW = 80, BH = 73; // 원본 몸 영역 (셀 X 8~87, Y 14~86)
const orig = p.crop(p.decode(SHEET), 0, 0, 96, 96);
const body = p.crop(orig, X0, Y0, BW, BH); // 몸 영역만 (0,0)=(X0,Y0)
const A = (im, x, y) => (x < 0 || y < 0 || x >= im.w || y >= im.h) ? 0 : im.d[(y * im.w + x) * 4 + 3];
// 파츠 분류 (몸 영역 좌표). 겹치는 곳은 위쪽 우선순위: 오른팔 > 왼팔 > 머리·몸통 > 다리
const isRA = (x, y) => (y <= 53 && x >= 54) || (y >= 54 && y <= 56 && x >= 64);
const isLA = (x, y) => y >= 34 && y <= 62 && ((y <= 53 && x <= 21) || (y >= 54 && x <= 18)); // 주먹(왼쪽 다리 바깥쪽 위는 제외)
const isLegL = (x, y) => y >= 54 && x < 43;
const isLegR = (x, y) => y >= 54 && x >= 43;
const isH = (x, y) => y <= 17 && x >= 22 && x <= 46; // 머리(왕관 수정 포함): 몸통보다 조금 더 숙임
const partOf = (x, y) => isRA(x, y) ? 'RA' : isLA(x, y) ? 'LA' : (y >= 54 ? (isLegL(x, y) ? 'LL' : 'LR') : (isH(x, y) ? 'H' : 'T'));
const PARTS = ['LL', 'LR', 'T', 'H', 'LA', 'RA']; // 그리는 순서(뒤 → 앞)
// 자세 정의: 다리 높이 줄이기(삭제할 줄 범위), 파츠별 이동(dx,dy), 무릎 바깥 이동량
const POSES = {
  stand: { cut: null, T: [0, 0], H: [0, 0], LA: [0, 0], RA: [0, 0], knee: 0 },
  mid: { cut: [64, 67], T: [-2, 6], H: [-2, 8], LA: [4, 4], RA: [-2, 6], knee: 2 },   // 웅크리는 중간 (약 절반)
  hold: { cut: [62, 67], T: [-2, 12], H: [-4, 14], LA: [4, 8], RA: [-6, 12], knee: 4 }, // 웅크림 유지
  stunA: { cut: [60, 67], T: [-2, 15], H: [-6, 19], LA: [4, 10], RA: [-8, 15], knee: 5 }, // 스턴(힘 빠짐) 후보 A: 머리가 어깨 사이로 처지고 팔이 늘어짐
  stunC: { cut: [60, 67], T: [-2, 15], H: [-9, 20], LA: [2, 10], RA: [-8, 15], knee: 5 }, // 스턴 후보 C: A 에서 머리를 왼쪽으로 더 떨어뜨림(고개 꺾임)
  stunB: { cut: [59, 67], T: [-4, 17], H: [-8, 21], LA: [4, 11], RA: [-8, 17], knee: 6 } // 스턴 후보 B: 더 깊게 처짐
};
// cut=[a,b] 줄(몸 영역 y)을 지우고 그 위(y<a)의 다리 줄을 (b-a+1)만큼 내림. 위쪽 파츠는 따로 이동하므로 cut 높이가 기본 하강량
function build(name) {
  const P = POSES[name], out = p.blank(BW, BH + 8), put = (x, y, x0, y0, src) => { const X = x + x0, Y = y + y0; if (X < 0 || Y < 0 || X >= out.w || Y >= out.h) return; const s = (y * src.w + x) * 4; out.d.copy ? src.d.copy(out.d, (Y * out.w + X) * 4, s, s + 4) : 0; };
  const cutH = P.cut ? P.cut[1] - P.cut[0] + 1 : 0;
  const layer = {}; for (const k of PARTS) layer[k] = p.blank(out.w, out.h);
  const drop = (y) => P.cut ? (y < P.cut[0] ? cutH : y > P.cut[1] ? 0 : null) : 0; // 다리: 지운 줄 위는 cutH 만큼 내려오고 아래는 그대로
  for (let y = 0; y < BH; y++) for (let x = 0; x < BW; x++) {
    if (!A(body, x, y)) continue; const k = partOf(x, y), s = (y * BW + x) * 4; let dx = 0, dy = 0;
    if (k === 'LL' || k === 'LR') { const d = drop(y); if (d === null) continue; dy = d; const sgn = k === 'LL' ? -1 : 1, Y = y + dy, t = Math.max(0, Math.min(1, (70 - Y) / 8)); dx = Math.round(sgn * P.knee * t / 2) * 2; } // 발목(발 줄)은 고정, 무릎 쪽으로 갈수록 바깥으로 (짝수 이동)
    else { dx = P[k][0]; dy = P[k][1]; }
    const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= out.w || Y >= out.h) continue; body.d.copy(layer[k].d, (Y * out.w + X) * 4, s, s + 4);
  }
  for (const k of PARTS) for (let i = 0; i < out.w * out.h; i++) if (layer[k].d[i * 4 + 3]) layer[k].d.copy(out.d, i * 4, i * 4, i * 4 + 4);
  return { img: out, layer };
}
// 임시 틈 메우기: 닫힘(팽창 r → 침식 r). 새로 생긴 칸은 이웃 중 가장 흔한 돌 색, 바깥 한 겹은 윤곽색
function close(img, r) {
  const W = img.w, H = img.h, m = new Uint8Array(W * H); for (let i = 0; i < W * H; i++) m[i] = img.d[i * 4 + 3] ? 1 : 0;
  const dil = (a) => { const o = new Uint8Array(W * H); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let v = 0; for (let dy = -r; dy <= r && !v; dy++) for (let dx = -r; dx <= r; dx++) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < W && Y < H && a[Y * W + X]) { v = 1; break; } } o[y * W + x] = v; } return o; };
  const ero = (a) => { const o = new Uint8Array(W * H); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let v = 1; for (let dy = -r; dy <= r && v; dy++) for (let dx = -r; dx <= r; dx++) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= W || Y >= H || !a[Y * W + X]) { v = 0; break; } } o[y * W + x] = v; } return o; };
  const c = ero(dil(m)); let filled = 0;
  const out = { w: W, h: H, d: Buffer.from(img.d) };
  for (let pass = 0; pass < 6; pass++) for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!c[y * W + x] || out.d[(y * W + x) * 4 + 3]) continue; // 새 칸
    const cnt = {}; let best = null, bn = 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= W || Y >= H) continue; const q = (Y * W + X) * 4; if (!out.d[q + 3]) continue; const k = out.d[q] + ',' + out.d[q + 1] + ',' + out.d[q + 2]; cnt[k] = (cnt[k] || 0) + 1; if (cnt[k] > bn) { bn = cnt[k]; best = k; } }
    if (!best) continue; const [r0, g0, b0] = best.split(',').map(Number); const q = (y * W + x) * 4; out.d[q] = r0; out.d[q + 1] = g0; out.d[q + 2] = b0; out.d[q + 3] = 255; filled++;
  }
  return { img: out, filled };
}
module.exports = { build, close, POSES, body, BW, BH };
if (require.main === module) {
  const S = 5, W = 960, H = 540, ox = 280, oy = 88; // 기준 이미지(ref_idle01_x5_960x540)와 같은 배치
  const names = process.argv.slice(2).length ? process.argv.slice(2) : ['stand', 'mid', 'hold'];
  for (const n of names) {
    const b = build(n), c = close(b.img, 2); p.encode(b.img, path.join(__dirname, '..', 'work', 'guide_' + n + '_raw.png')); p.encode(c.img, path.join(__dirname, '..', 'work', 'guide_' + n + '_closed.png'));
    // 흰 바탕 16:9 x5 안내 이미지 (VARCO 입력용)
    const big = p.blank(W, H); big.d.fill(255);
    for (let y = 0; y < c.img.h; y++) for (let x = 0; x < c.img.w; x++) { const s = (y * c.img.w + x) * 4; if (!c.img.d[s + 3]) continue; for (let dy = 0; dy < S; dy++) for (let dx = 0; dx < S; dx++) { const X = ox + x * S + dx, Y = oy + y * S + dy; if (X >= W || Y >= H) continue; const o = (Y * W + X) * 4; big.d[o] = c.img.d[s]; big.d[o + 1] = c.img.d[s + 1]; big.d[o + 2] = c.img.d[s + 2]; big.d[o + 3] = 255; } }
    p.encode(big, path.join(__dirname, '..', 'work', 'guide_' + n + '_x5_960x540.png')); console.log(n, '닫힘으로 채운 칸', c.filled);
  }
}
