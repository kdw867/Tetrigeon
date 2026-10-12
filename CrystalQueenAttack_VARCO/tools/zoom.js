// 셀 PNG 일부를 k배 확대하고 5도트 격자선(10의 배수는 밝게)을 그림 (작업 폴더 전용). 사용: node tools/zoom.js <in> <out> <x0,y0,x1,y1> <k> [gray]
const p = require('../../PauseUI_VARCO/tools/pix.js');
const [inp, out, box, ks, mode] = process.argv.slice(2), [x0, y0, x1, y1] = box.split(',').map(Number), k = +ks, w = x1 - x0 + 1, h = y1 - y0 + 1;
const c = p.decode(inp), o = p.blank(w * k, h * k), GR = new Set(['72,79,97', '116,119,129', '88,94,108']);
for (let y = 0; y < h * k; y++) for (let x = 0; x < w * k; x++) {
  const X = x0 + (x / k | 0), Y = y0 + (y / k | 0), si = (Y * c.w + X) * 4, di = (y * o.w + x) * 4; let col = [24, 28, 40];
  if (c.d[si + 3]) { const key = c.d[si] + ',' + c.d[si + 1] + ',' + c.d[si + 2]; col = (mode === 'gray' && !GR.has(key) && !(c.d[si + 1] > 200 && c.d[si + 2] > 200 && c.d[si] < 100)) ? [c.d[si] * 0.45 | 0, c.d[si + 1] * 0.45 | 0, c.d[si + 2] * 0.45 | 0] : [c.d[si], c.d[si + 1], c.d[si + 2]]; }
  if ((x % k === 0 && X % 5 === 0) || (y % k === 0 && Y % 5 === 0)) { const br = (x % k === 0 && X % 5 === 0 && X % 10 === 0) || (y % k === 0 && Y % 5 === 0 && Y % 10 === 0); col = br ? [255, 210, 40] : [120, 110, 50]; }
  o.d[di] = col[0]; o.d[di + 1] = col[1]; o.d[di + 2] = col[2]; o.d[di + 3] = 255;
}
p.encode(o, out); console.log(out, o.w + 'x' + o.h, 'origin', x0, y0);
