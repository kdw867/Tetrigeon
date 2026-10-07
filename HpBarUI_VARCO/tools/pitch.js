// 생성 이미지의 도트 한 칸 크기(픽셀 피치) 추정: 가로·세로 색 변화 위치가 가장 잘 모이는 주기를 찾는다
const p = require('../../PauseUI_VARCO/tools/pix.js');
const [file, x0 = 0, y0 = 0, x1 = 99999, y1 = 99999] = process.argv.slice(2);
const im = p.decode(file), X1 = Math.min(+x1, im.w), Y1 = Math.min(+y1, im.h);
const diff = (a, b) => Math.abs(im.d[a] - im.d[b]) + Math.abs(im.d[a + 1] - im.d[b + 1]) + Math.abs(im.d[a + 2] - im.d[b + 2]);
const ex = new Float64Array(im.w + 1), ey = new Float64Array(im.h + 1); // 열/행별 경계 강도
for (let y = +y0; y < Y1; y++) for (let x = +x0 + 1; x < X1; x++) { const dd = diff((y * im.w + x) * 4, (y * im.w + x - 1) * 4); if (dd > 45) ex[x] += 1; }
for (let y = +y0 + 1; y < Y1; y++) for (let x = +x0; x < X1; x++) { const dd = diff((y * im.w + x) * 4, ((y - 1) * im.w + x) * 4); if (dd > 45) ey[y] += 1; }
function best(e, lo, hi, n) { // 주기 p와 위상 ph에서 경계 강도 합이 최대인 주기를 찾음
  const res = [];
  for (let per = 3; per <= 12; per += 0.05) { let bestPh = 0, bestV = -1; for (let ph = 0; ph < per; ph += 0.25) { let v = 0, c = 0; for (let k = ph; k < n; k += per) { const i = Math.round(k); if (i > lo && i < hi) { v += e[i] + 0.5 * (e[i - 1] + e[i + 1]); c++; } } v /= Math.max(c, 1); if (v > bestV) { bestV = v; bestPh = ph; } } res.push([per, bestV, bestPh]); }
  return res.sort((a, b) => b[1] - a[1]).slice(0, 4).map(r => `${r[0].toFixed(2)}(${r[1].toFixed(1)})`).join('  ');
}
console.log('가로 주기', best(ex, +x0, X1, im.w), '| 세로 주기', best(ey, +y0, Y1, im.h));
