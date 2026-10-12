// VARCO 원본 결과를 열=자세, 행=후보로 모아 한 장으로 (작업 폴더 전용)
const p = require('../../PauseUI_VARCO/tools/pix.js');
const args = process.argv.slice(2); const out = args.shift(); const cols = +args.shift();
const X = 200, Y = 40, CW = 960, CH = 630, F = 2;
const imgs = args.map(f => p.boxDown(p.crop(p.decode(f), X, Y, CW, CH), F));
const w = CW / F, h = CH / F, rows = Math.ceil(imgs.length / cols);
const g = p.blank(w * cols + (cols - 1) * 6, h * rows + (rows - 1) * 6); g.d.fill(255);
imgs.forEach((im, i) => { const ox = (i % cols) * (w + 6), oy = Math.floor(i / cols) * (h + 6); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const s = (y * im.w + x) * 4, t = ((oy + y) * g.w + ox + x) * 4; g.d[t] = im.d[s]; g.d[t + 1] = im.d[s + 1]; g.d[t + 2] = im.d[s + 2]; g.d[t + 3] = 255; } });
p.encode(g, out); console.log('saved', out, g.w + 'x' + g.h);
