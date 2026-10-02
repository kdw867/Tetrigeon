// 가로·세로로 같은 색이 이어지는 길이의 분포 → 도트 한 칸 크기의 배수에서 봉우리
const p = require('../../PauseUI_VARCO/tools/pix.js');
const [file, x0 = 0, y0 = 0, w = 0, h = 0] = process.argv.slice(2).map((v, i) => i ? +v : v);
const img = p.decode(file), W = w || img.w - x0, H = h || img.h - y0;
const c = (x, y) => { const i = ((y0 + y) * img.w + x0 + x) * 4; return [img.d[i], img.d[i + 1], img.d[i + 2]]; };
const same = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) < 30;
const hist = new Array(80).fill(0);
for (let y = 0; y < H; y += 3) { let run = 1; for (let x = 1; x < W; x++) { if (same(c(x, y), c(x - 1, y))) run++; else { if (run < 80) hist[run]++; run = 1; } } }
for (let x = 0; x < W; x += 3) { let run = 1; for (let y = 1; y < H; y++) { if (same(c(x, y), c(x, y - 1))) run++; else { if (run < 80) hist[run]++; run = 1; } } }
const max = Math.max(...hist.slice(3));
console.log(hist.map((n, i) => i >= 3 && n > max * 0.25 ? i + ':' + n : '').filter(Boolean).join(' '));
