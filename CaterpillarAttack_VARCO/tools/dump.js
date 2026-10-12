// 기존 Idle 시트의 프레임을 읽어 색 번호 지도와 격자 확대 이미지로 저장 (작업 폴더 전용)
const fs = require('fs'), path = require('path');
const p = require('../../PauseUI_VARCO/tools/pix.js');
const R = path.join(__dirname, '..');
const sheet = p.decode('C:/Users/MBC-501-15/Documents/Tetrigeon/Tetrigeon/Assets/@Resources/Enemies/CrystalLarvaIdle/T_CrystalLarva_Idle.png');
console.log('sheet', sheet.w, sheet.h);
const cell = (i) => p.crop(sheet, (i % 5) * 64, Math.floor(i / 5) * 64, 64, 64);
const f0 = cell(0);
// 색 목록
const cols = new Map();
for (let i = 0; i < 64 * 64; i++) if (f0.d[i * 4 + 3]) { const k = [f0.d[i * 4], f0.d[i * 4 + 1], f0.d[i * 4 + 2]].join(','); cols.set(k, (cols.get(k) || 0) + 1); }
const list = [...cols.entries()].sort((a, b) => b[1] - a[1]);
const sym = '0123456789abcdefghijklmnopqrstuvwxyz';
const idx = new Map(list.map(([k], i) => [k, sym[i]]));
console.log('colors', list.length); list.forEach(([k, n], i) => console.log(sym[i], k, n));
let bb = [64, 64, -1, -1];
const lines = [];
for (let y = 0; y < 64; y++) { let s = ''; for (let x = 0; x < 64; x++) { const o = (y * 64 + x) * 4; if (!f0.d[o + 3]) { s += '.'; continue; } s += idx.get([f0.d[o], f0.d[o + 1], f0.d[o + 2]].join(',')); bb = [Math.min(bb[0], x), Math.min(bb[1], y), Math.max(bb[2], x), Math.max(bb[3], y)]; } lines.push(s); }
console.log('bbox', bb);
console.log('     ' + [...Array(64).keys()].map(x => x % 10 === 0 ? String(x / 10 | 0) : ' ').join(''));
console.log('     ' + [...Array(64).keys()].map(x => x % 10).join(''));
lines.forEach((s, y) => { if (y >= 20 && y <= 56) console.log(String(y).padStart(3) + '  ' + s); });
// 같은 위치 비교: 프레임 1/9/10 동일한지
const eq = (a, b) => Buffer.compare(a.d, b.d) === 0;
console.log('f1==f9', eq(cell(0), cell(8)), 'f1==f10', eq(cell(0), cell(9)));
// 확대 + 격자
const Z = 16, big = p.blank(64 * Z, 64 * Z);
for (let y = 0; y < 64 * Z; y++) for (let x = 0; x < 64 * Z; x++) {
  const sx = x / Z | 0, sy = y / Z | 0, o = (sy * 64 + sx) * 4, q = (y * 64 * Z + x) * 4;
  let c = f0.d[o + 3] ? [f0.d[o], f0.d[o + 1], f0.d[o + 2]] : ((sx + sy) % 2 ? [226, 226, 230] : [238, 238, 242]);
  const gx = x % Z === 0, gy = y % Z === 0, g10 = (sx % 10 === 0 && x % Z === 0) || (sy % 10 === 0 && y % Z === 0);
  if (g10) c = [255, 60, 60]; else if (gx || gy) c = c.map(v => Math.round(v * 0.78));
  big.d[q] = c[0]; big.d[q + 1] = c[1]; big.d[q + 2] = c[2]; big.d[q + 3] = 255;
}
const crop = p.crop(big, 0 * Z, 20 * Z, 56 * Z, 36 * Z);
p.encode(crop, path.join(R, 'work', 'idle01_grid_x16.png'));
