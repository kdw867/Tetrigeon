// 수정여왕 자세 안내 이미지 제작 (작업 폴더 전용): 원본 Idle 01 을 "발밑은 고정, 위로 갈수록 크게 기우는" 휨 변형으로 만든다.
// 몸통·날개·왕관이 한 덩어리로 같이 움직이므로 날개 뿌리에 빈틈이 생기지 않는다. 4배로 키워 변형한 뒤 4x4 블록 최빈색으로 줄여 도트가 깨지지 않게 한다.
const fs = require('fs'), path = require('path');
const p = require('../../PauseUI_VARCO/tools/pix.js');
const R = path.join(__dirname, '..');
const IDLE = 'C:/Users/MBC-501-15/Documents/Tetrigeon/Tetrigeon/Assets/@Resources/Enemies/CrystalQueenIdle/T_CrystalQueen_Idle.png';
const SS = 4, CW = 160, CH = 160; // 초과 표본 배율, 셀 크기
const smooth = t => t * t * (3 - 2 * t); // 부드러운 단계 함수

// params: { phi(도, +는 시계 방향=오른쪽(뒤)으로 기움, -는 왼쪽(앞)), dx, dy, px, py, yHi, yLo }
function warpCell(cell, prm) {
  const { phi, dx, dy, px, py, yHi, yLo } = Object.assign({ dx: 0, dy: 0, px: 90, py: 130, yHi: 100, yLo: 138 }, prm);
  const s = y => smooth(Math.max(0, Math.min(1, (yLo - y) / (yLo - yHi)))); // 위쪽 1, 발밑 0
  const big = p.blank(CW * SS, CH * SS);
  const inv = (X, Y) => { // 출력 좌표(셀 도트 단위) → 원본 좌표
    let x = X, y = Y;
    for (let it = 0; it < 6; it++) { const w = s(y), a = -phi * w * Math.PI / 180, c = Math.cos(a), sn = Math.sin(a), vx = X - px - dx * w, vy = Y - py - dy * w; x = px + c * vx - sn * vy; y = py + sn * vx + c * vy; }
    return [x, y];
  };
  for (let Y = 0; Y < CH * SS; Y++) for (let X = 0; X < CW * SS; X++) {
    const [x, y] = inv((X + 0.5) / SS, (Y + 0.5) / SS), sx = Math.floor(x), sy = Math.floor(y);
    if (sx < 0 || sy < 0 || sx >= CW || sy >= CH) continue;
    const si = (sy * CW + sx) * 4; if (!cell.d[si + 3]) continue;
    cell.d.copy(big.d, (Y * big.w + X) * 4, si, si + 4);
  }
  const out = p.blank(CW, CH);
  for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) { // 4x4 블록 최빈색, 불투명 8칸 이상일 때만 채움
    const cnt = new Map(); let op = 0;
    for (let j = 0; j < SS; j++) for (let i = 0; i < SS; i++) { const o = ((y * SS + j) * big.w + x * SS + i) * 4; if (!big.d[o + 3]) continue; op++; const k = big.d.readUInt32BE(o); cnt.set(k, (cnt.get(k) || 0) + 1); }
    if (op < 8) continue;
    let best = null, bn = 0; for (const [k, n] of cnt) { const lum = ((k >>> 24) + ((k >>> 16) & 255) + ((k >>> 8) & 255)); if (n > bn || (n === bn && lum < best.lum)) { bn = n; best = { k, lum }; } }
    const o = (y * CW + x) * 4; out.d.writeUInt32BE(best.k >>> 0, o);
  }
  return out;
}
function idleCell() { return p.crop(p.decode(IDLE), 0, 0, CW, CH); }
module.exports = { warpCell, idleCell, CW, CH };

if (require.main === module) {
  const name = process.argv[2], phi = +process.argv[3], dx = +(process.argv[4] || 0), dy = +(process.argv[5] || 0);
  const out = warpCell(idleCell(), { phi, dx, dy });
  const file = path.join(R, 'work', 'warp_' + name + '.png'); p.encode(out, file);
  let x0 = 999, x1 = -1, y0 = 999, y1 = -1, n = 0; for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) if (out.d[(y * CW + x) * 4 + 3]) { n++; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  console.log(name, 'phi', phi, 'dots', n, 'bbox x', x0, '-', x1, 'y', y0, '-', y1, 'margins L', x0, 'R', CW - 1 - x1, 'T', y0);
}
