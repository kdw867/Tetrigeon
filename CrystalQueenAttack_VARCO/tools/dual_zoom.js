// 같은 영역을 Idle(왼쪽)과 원화(오른쪽)로 나란히 확대, 5도트 격자(10의 배수 굵게) (작업 폴더 전용)
// 사용: node tools/dual_zoom.js <x0,y0,x1,y1 Idle 도트 좌표> <k 도트당 px> <out> [idle셀 파일]
const p = require('../../PauseUI_VARCO/tools/pix.js');
const [box, ks, out, cellFile] = process.argv.slice(2), [x0, y0, x1, y1] = box.split(',').map(Number), k = +ks, w = x1 - x0 + 1, h = y1 - y0 + 1;
const idle = cellFile ? p.decode(cellFile) : p.crop(p.decode('C:/Users/MBC-501-15/Documents/Tetrigeon/Tetrigeon/Assets/@Resources/Enemies/CrystalQueenIdle/T_CrystalQueen_Idle.png'), 0, 0, 160, 160);
const t = p.decode('C:/Users/MBC-501-15/Documents/Tetrigeon/Tetrigeon/Assets/@Resources/Enemies/T_CrystalQueen.png'), sx = 1002 / 80, sy = 1446 / 119;
const o = p.blank(w * k * 2 + 8, h * k); for (let i = 0; i < o.w * o.h; i++) { o.d[i * 4] = 40; o.d[i * 4 + 1] = 46; o.d[i * 4 + 2] = 60; o.d[i * 4 + 3] = 255; }
for (let y = 0; y < h * k; y++) for (let x = 0; x < w * k; x++) {
  const X = x0 + (x / k | 0), Y = y0 + (y / k | 0), gx = (x % k === 0 && X % 5 === 0), gy = (y % k === 0 && Y % 5 === 0), br = (gx && X % 10 === 0) || (gy && Y % 10 === 0), line = (gx || gy) ? (br ? [255, 210, 40] : [110, 100, 50]) : null;
  let di = (y * o.w + x) * 4, si = (Y * 160 + X) * 4; if (idle.d[si + 3]) idle.d.copy(o.d, di, si, si + 4); if (line) { o.d[di] = line[0]; o.d[di + 1] = line[1]; o.d[di + 2] = line[2]; }
  const ox = Math.min(t.w - 1, Math.round(58 + ((x0 * 1) - 52 + x / k) * sx)), oy = Math.min(t.h - 1, Math.round(24 + (y0 - 29 + y / k) * sy)); si = (oy * t.w + ox) * 4; di = (y * o.w + w * k + 8 + x) * 4; const a = t.d[si + 3] / 255; if (a > 0.5) t.d.copy(o.d, di, si, si + 3); if (line) { o.d[di] = line[0]; o.d[di + 1] = line[1]; o.d[di + 2] = line[2]; }
}
p.encode(o, out); console.log(out, o.w + 'x' + o.h);
