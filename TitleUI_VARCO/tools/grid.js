// 생성 이미지의 실제 도트 한 칸 크기(원본 px) 추정: 배율·격자 위치별로 블록 평균 재구성 오차가 가장 작은 값을 찾음
const p = require('../../PauseUI_VARCO/tools/pix.js');
const [file, x0 = 0, y0 = 0, w = 0, h = 0] = process.argv.slice(2).map((v, i) => i ? +v : v);
const img = p.decode(file), W = w || img.w, H = h || img.h;
const lum = (x, y) => { const i = ((y0 + y) * img.w + x0 + x) * 4; return img.d[i] * 0.3 + img.d[i + 1] * 0.59 + img.d[i + 2] * 0.11; };
const res = [];
for (let f = 3; f <= 20; f += 0.25) {
  let best = 1e9;
  for (let ox = 0; ox < f; ox += f / 4) for (let oy = 0; oy < f; oy += f / 4) { // 격자 시작 위치
    let err = 0, n = 0;
    for (let gy = oy; gy + f <= H; gy += f) for (let gx = ox; gx + f <= W; gx += f) {
      const ax = Math.ceil(gx), bx = Math.floor(gx + f), ay = Math.ceil(gy), by = Math.floor(gy + f); // 칸 안쪽 픽셀만
      if (bx - ax < 2 || by - ay < 2) continue;
      let s = 0, c = 0; for (let y = ay; y < by; y++) for (let x = ax; x < bx; x++) { s += lum(x, y); c++; }
      const m = s / c; for (let y = ay; y < by; y++) for (let x = ax; x < bx; x++) err += Math.abs(lum(x, y) - m);
      n += c;
    }
    if (n) best = Math.min(best, err / n);
  }
  res.push([f, best]);
}
// 오차는 배율이 커질수록 자연히 커지므로, 이웃 배율보다 확실히 낮은 지점(골짜기)을 후보로 표시
res.forEach(([f, e], i) => { const a = res[i - 1], b = res[i + 1]; const dip = a && b && e < a[1] && e < b[1]; console.log(f.toFixed(2), e.toFixed(2), dip ? '<' : ''); });
