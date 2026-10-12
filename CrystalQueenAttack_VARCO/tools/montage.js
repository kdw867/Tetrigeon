// 160x160 셀 PNG 여러 장을 k배 확대해 가로로 나란히 (어두운 청회색 바탕) (작업 폴더 전용)
// 사용: node tools/montage.js <출력.png> <k> <cropX0,Y0,X1,Y1 또는 -> <파일>...
const p = require('../../PauseUI_VARCO/tools/pix.js');
const out = process.argv[2], k = +process.argv[3], crop = process.argv[4] === '-' ? [0, 0, 159, 159] : process.argv[4].split(',').map(Number), files = process.argv.slice(5);
const cw = crop[2] - crop[0] + 1, ch = crop[3] - crop[1] + 1, o = p.blank(cw * k * files.length + 4 * (files.length - 1), ch * k);
for (let i = 0; i < o.w * o.h; i++) { o.d[i * 4] = 40; o.d[i * 4 + 1] = 46; o.d[i * 4 + 2] = 60; o.d[i * 4 + 3] = 255; }
files.forEach((f, i) => { const c = p.decode(f), ox = i * (cw * k + 4); for (let y = 0; y < ch * k; y++) for (let x = 0; x < cw * k; x++) { const si = ((crop[1] + (y / k | 0)) * c.w + crop[0] + (x / k | 0)) * 4; if (c.d[si + 3]) c.d.copy(o.d, (y * o.w + ox + x) * 4, si, si + 4); } });
p.encode(o, out); console.log(out, o.w + 'x' + o.h);
