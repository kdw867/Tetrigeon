// LOCK(칸 테두리 점등)과 LINE CLEAR(가로빛)를 VARCO 시트(lock_v1, clear_v1)의 디자인대로, 실제 칸·보드 크기에 정확히 맞춰 만든다
// - LOCK: 칸 27x27, 8프레임, 가장자리 변 노출 여부(북1·동2·남4·서8)에 따른 16가지 변형 (같은 미노끼리 맞닿은 변에는 테두리를 그리지 않아 겹쳐 밝아지지 않음)
// - LINE CLEAR: 보드 폭 270 x 31, 10프레임 (한 칸 그림을 늘리지 않고 실제 폭에서 직접 그림)
const { p, R, C, put, get, solid, up, blit } = require('./lib_fx');
const fs = require('fs');
const CELL = 27;

// ================= LOCK =================
const N = 1, E = 2, S = 4, W = 8;
// 프레임별 테두리 정의: 두께, 바깥/안쪽 색, 모서리 흰 점, 점선 패턴
const LOCK = [
  { t: 2, c: [C.tealBright, C.tealMid], corner: 'white2' },
  { t: 2, c: [C.tealMid, C.tealDim], corner: 'white1' },
  { t: 2, c: [C.tealDim, C.tealDeep], corner: null },
  { t: 1, c: [C.tealDeep], corner: null },
  { t: 1, c: [C.tealDeep], dash: [5, 3] },
  { t: 1, c: [C.tealDeep], dash: [3, 5] },
  { t: 0, c: [], cornerOnly: C.tealDim },
  null, // 마지막: 완전 투명 (잔상 없음)
];
function lockFrame(mask, fr) {
  const img = p.blank(CELL, CELL), d = LOCK[fr]; if (!d) return img;
  const on = (bit) => (mask & bit) !== 0;
  const dashOn = (i) => !d.dash || (i % (d.dash[0] + d.dash[1])) < d.dash[0]; // 변을 따라가며 켜졌다 꺼짐
  for (let layer = 0; layer < d.t; layer++) { const col = d.c[layer];
    for (let i = layer; i < CELL - layer; i++) { if (!dashOn(i)) continue;
      if (on(N)) put(img, i, layer, col); if (on(S)) put(img, i, CELL - 1 - layer, col);
      if (on(W)) put(img, layer, i, col); if (on(E)) put(img, CELL - 1 - layer, i, col);
    }
  }
  // 볼록한 모서리(맞닿은 두 변이 모두 노출)에만 하이라이트
  const corners = [[N | W, 0, 0], [N | E, CELL - 1, 0], [S | W, 0, CELL - 1], [S | E, CELL - 1, CELL - 1]];
  for (const [bits, x, y] of corners) { if ((mask & bits) !== bits) continue;
    if (d.corner === 'white2') { put(img, x, y, C.white); put(img, x + (x ? -1 : 1), y, C.white); put(img, x, y + (y ? -1 : 1), C.white); }
    else if (d.corner === 'white1') put(img, x, y, C.white);
    else if (d.cornerOnly) { put(img, x, y, d.cornerOnly); put(img, x + (x ? -1 : 1), y, d.cornerOnly); put(img, x, y + (y ? -1 : 1), d.cornerOnly); }
  }
  return img;
}
const lockSheet = p.blank(CELL * 8, CELL * 16);
for (let m = 0; m < 16; m++) for (let f = 0; f < 8; f++) { const fi = lockFrame(m, f); for (let y = 0; y < CELL; y++) for (let x = 0; x < CELL; x++) { const c = get(fi, x, y); if (c[3]) put(lockSheet, f * CELL + x, m * CELL + y, c.slice(0, 3)); } }
p.encode(lockSheet, `${R}/sheets/FX_Lock_sheet.png`); // 행 = 노출 변 마스크 0~15, 열 = 프레임 0~7
const lockFull = p.blank(CELL * 8, CELL); for (let f = 0; f < 8; f++) { const fi = lockFrame(15, f); for (let y = 0; y < CELL; y++) for (let x = 0; x < CELL; x++) { const c = get(fi, x, y); if (c[3]) put(lockFull, f * CELL + x, y, c.slice(0, 3)); } }
p.encode(lockFull, `${R}/sheets/FX_Lock_full_strip.png`); // 네 변 모두 노출(혼자 있는 칸) 한 줄 시트

// ================= LINE CLEAR =================
const W_ = 270, H_ = 31, MID = 15; // 보드 폭, 행(27) + 위아래 2, 가운데 줄
let seed = 12345; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const bar = (img, half, thick, core) => { // 가운데에서 좌우 half 만큼, thick 줄 두께의 가로빛 (가운데 흰 줄 + 청록 가장자리)
  const x0 = Math.max(0, Math.round(W_ / 2 - half)), x1 = Math.min(W_ - 1, Math.round(W_ / 2 + half) - 1);
  const rows = thick === 5 ? [C.tealMid, C.tealBright, core, C.tealBright, C.tealMid] : thick === 3 ? [C.tealDeep, C.tealDim, C.tealDeep] : [C.tealDim];
  const r0 = MID - Math.floor(rows.length / 2);
  for (let x = x0; x <= x1; x++) { const edge = Math.min(x - x0, x1 - x); // 끝에서 몇 칸째인지
    rows.forEach((col, i) => { let c = col; if (edge < 3 && (i === 0 || i === rows.length - 1)) return; // 끝 3칸은 위아래 가장자리 줄을 빼서 뾰족하게
      if (edge < 1 && rows.length === 5 && i !== 2) c = C.tealDim; put(img, x, r0 + i, c); });
  }
  // 끝 꼬리: 가운데 한 줄만 청록 → 어두운 청록으로 3칸
  if (half < W_ / 2) for (let k = 1; k <= 3; k++) { const col = k < 3 ? C.tealDim : C.tealDeep; put(img, x0 - k, MID, col); put(img, x1 + k, MID, col); }
};
const particles = []; // 위아래로 조금 흩어지는 입자 (고정 시드): 시작 프레임, x, 방향, 색
for (let i = 0; i < 14; i++) particles.push({ sf: 2 + Math.floor(rnd() * 4), x: 10 + Math.floor(rnd() * (W_ - 20)), dir: rnd() < 0.5 ? -1 : 1, off: 3 + Math.floor(rnd() * 2), col: rnd() < 0.4 ? C.white : (rnd() < 0.5 ? C.tealBright : C.tealMid), life: 4 + Math.floor(rnd() * 2) });
function clearFrame(f) {
  const img = p.blank(W_, H_);
  if (f === 0) bar(img, 14, 5, C.white);
  else if (f === 1) bar(img, 44, 5, C.white);
  else if (f === 2) bar(img, 82, 5, C.white);
  else if (f === 3) bar(img, 118, 5, C.white);
  else if (f === 4) bar(img, W_ / 2, 5, C.white); // 보드 폭 전체
  else if (f === 5) { bar(img, W_ / 2, 3, null); for (let i = 0; i < 18; i++) put(img, 8 + Math.floor(rnd() * (W_ - 16)), MID, C.tealBright); } // 얇고 어두워진 가로빛에 밝은 점 몇 개
  else if (f === 6) { let x = 0; while (x < W_) { const len = 3 + Math.floor(rnd() * 8), gap = 3 + Math.floor(rnd() * 6); for (let k = 0; k < len && x + k < W_; k++) put(img, x + k, MID, rnd() < 0.5 ? C.tealMid : C.tealDeep); x += len + gap; } } // 끊어진 점선
  for (const q of particles) { const age = f - q.sf; if (age < 0 || age >= q.life) continue; const y = MID + q.dir * (q.off + Math.floor(age * 2)); put(img, q.x, y, age >= q.life - 1 ? C.tealDeep : q.col); } // 입자: 위/아래로 프레임마다 2칸씩 (최대 13칸으로 자기 행 안)
  return img;
}
const clearFrames = []; for (let f = 0; f < 10; f++) clearFrames.push(clearFrame(f)); // 9번째(인덱스 9)는 비어 있음
const clearSheet = p.blank(W_, H_ * 10); clearFrames.forEach((fi, k) => { for (let y = 0; y < H_; y++) for (let x = 0; x < W_; x++) { const c = get(fi, x, y); if (c[3]) put(clearSheet, x, k * H_ + y, c.slice(0, 3)); } });
p.encode(clearSheet, `${R}/sheets/FX_LineClear_sheet.png`); // 세로로 10프레임, 각 270x31
fs.writeFileSync(`${R}/work/clear_frames.json`, JSON.stringify(clearFrames.map(o => ({ w: o.w, h: o.h, d: o.d.toString('base64') }))));
// 확인용
const chk = solid(W_ * 2 + 20, H_ * 10 * 2 + 20, '#0e1726'); blit(chk, clearSheet, 10, 10, 2); p.encode(chk, `${R}/work/clear_check.png`);
const chk2 = solid(lockSheet.w * 4 + 20, lockSheet.h * 4 + 20, '#0e1726'); blit(chk2, lockSheet, 10, 10, 4); p.encode(chk2, `${R}/work/lock_check.png`);
console.log('LOCK 시트', lockSheet.w + 'x' + lockSheet.h, '| LINE CLEAR 시트', clearSheet.w + 'x' + clearSheet.h);
