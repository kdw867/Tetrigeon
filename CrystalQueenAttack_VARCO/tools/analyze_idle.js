// 수정여왕 현재 Idle 시트 측정 (작업 폴더 전용): 셀별 바운딩 박스, 알파, 색 수, 발바닥 줄, 프레임 간 차이
const p = require('../../PauseUI_VARCO/tools/pix.js');
const IDLE = 'C:/Users/MBC-501-15/Documents/Tetrigeon/Tetrigeon/Assets/@Resources/Enemies/CrystalQueenIdle/T_CrystalQueen_Idle.png';
const s = p.decode(IDLE), CW = 160, CH = 160, COLS = 5;
console.log('sheet', s.w, s.h);
const cells = [];
for (let f = 0; f < 10; f++) {
  const c = p.crop(s, (f % COLS) * CW, Math.floor(f / COLS) * CH, CW, CH); cells.push(c);
  let n = 0, part = 0, x0 = 999, x1 = -1, y0 = 999, y1 = -1; const cols = new Set();
  for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) { const o = (y * CW + x) * 4, a = c.d[o + 3]; if (!a) continue; n++; if (a !== 255) part++; cols.add(c.d.readUInt32BE(o)); x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  console.log(`f${f + 1} dots ${n} partialAlpha ${part} colors ${cols.size} bbox x${x0}-${x1} y${y0}-${y1} (${x1 - x0 + 1}x${y1 - y0 + 1}) margins L${x0} R${CW - 1 - x1} T${y0} B${CH - 1 - y1}`);
}
// 프레임 1 대비 다른 점 수
for (let f = 1; f < 10; f++) { let d = 0; for (let i = 0; i < CW * CH; i++) { const o = i * 4; if (cells[0].d.compare(cells[f].d, o, o + 4, o, o + 4) !== 0) d++; } console.log(`f${f + 1} vs f1 differing dots ${d}`); }
// 바닥 줄: 가장 아래 불투명 행의 가로 범위
const c = cells[0]; for (let y = CH - 1; y >= 0; y--) { let n = 0, a = 999, b = -1; for (let x = 0; x < CW; x++) if (c.d[(y * CW + x) * 4 + 3]) { n++; a = Math.min(a, x); b = Math.max(b, x); } if (n) { console.log('f1 lowest opaque row', y, 'count', n, 'x', a, '-', b); break; } }
// 업스케일 확인 (1 도트가 정수 격자인지): 가로 연속 같은 색 런 길이 최빈값
const runs = {}; for (let y = 0; y < CH; y++) { let r = 1; for (let x = 1; x <= CW; x++) { const same = x < CW && c.d.compare(c.d, (y * CW + x) * 4, (y * CW + x) * 4 + 4, (y * CW + x - 1) * 4, (y * CW + x) * 4) === 0 && c.d[(y * CW + x) * 4 + 3]; if (same) r++; else { if (c.d[(y * CW + x - 1) * 4 + 3]) runs[r] = (runs[r] || 0) + 1; r = 1; } } }
console.log('f1 horizontal same-colour run lengths', JSON.stringify(runs));
// 확대 프레임 1·5 저장
const up = (img, k) => { const o = p.blank(img.w * k, img.h * k); for (let y = 0; y < o.h; y++) for (let x = 0; x < o.w; x++) { const si = (Math.floor(y / k) * img.w + Math.floor(x / k)) * 4, di = (y * o.w + x) * 4; const a = img.d[si + 3]; if (a) img.d.copy(o.d, di, si, si + 4); else { o.d[di] = 40; o.d[di + 1] = 46; o.d[di + 2] = 60; o.d[di + 3] = 255; } } return o; };
p.encode(up(cells[0], 5), 'work/idle_f1_x5.png');
