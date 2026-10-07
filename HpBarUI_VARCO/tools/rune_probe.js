// 룬 참조 이미지 분석 (일회용): 배경 제외 경계와 한 칸 크기 추정
const p = require('../../PauseUI_VARCO/tools/pix.js');
for (const n of ['blue', 'gold']) {
  const a = p.decode(`${__dirname}/../refs/ref_rune_${n}.png`);
  const isBg = (i) => a.d[i + 3] < 10 || (a.d[i] > 235 && a.d[i + 1] > 235 && a.d[i + 2] > 235);
  let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
  for (let y = 0; y < a.h; y++) for (let x = 0; x < a.w; x++) if (!isBg((y * a.w + x) * 4)) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  // 가운데 줄의 같은 색 연속 길이
  const my = Math.round((y0 + y1) / 2), runs = []; let start = x0;
  const col = (x) => [...a.d.subarray((my * a.w + x) * 4, (my * a.w + x) * 4 + 3)];
  for (let x = x0 + 1; x <= x1 + 1; x++) { const c = col(x), c0 = col(x - 1); if (Math.abs(c[0] - c0[0]) + Math.abs(c[1] - c0[1]) + Math.abs(c[2] - c0[2]) > 40) { runs.push(x - start); start = x; } }
  console.log(n, 'bbox', x0, y0, x1, y1, 'size', x1 - x0 + 1, y1 - y0 + 1, 'runs(mid row)', runs.join(','));
}
