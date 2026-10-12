// 전신 기울이기 v2 (작업 폴더 전용): 줄 밀기(shear)가 만드는 가로 "층"(모든 줄이 같은 높이에서 한꺼번에 어긋남)을 없애기 위해,
// 몸을 하나의 곡선(중심선)으로 보고 높이에 따라 기울기가 0(발바닥)→θ(허리 위)로 부드럽게 변하게 휘는(bend) 방식. 발바닥(Y=147)은 그대로.
// 결과는 원본과 같은 "2x2 스프라이트 픽셀 = 도트 1칸" 격자(블록 위상 (1,1))로 다시 찍는다: 도트마다 8x8 지점을 역변환해 원본에서 읽고 가장 많은 색(불투명이 절반 이상이어야 채움)을 고른다.
// deg > 0 = 앞(화면 왼쪽, 레미 방향)으로 기울임, deg < 0 = 뒤(화면 오른쪽).
const GROUND = 148; // 발바닥 바닥 경계 (Y=147 줄의 아래쪽 경계)
const RAMP = 50; // 기울기가 0 에서 θ 까지 변하는 높이(px): 발바닥에서 약 50px (허리)까지 서서히
const smooth = (t) => { t = Math.max(0, Math.min(1, t / RAMP)); return t * t * (3 - 2 * t); };
function makeCurve(deg) { // 높이 t(px)별 기울기 φ(t) 와 중심선 위치 C(t)=(x 이동, 높이) 를 0.25px 간격으로 적분
  const th = deg * Math.PI / 180, N = 800, dt = 0.25, cx = new Float64Array(N + 1), cy = new Float64Array(N + 1), ph = new Float64Array(N + 1);
  for (let n = 0; n <= N; n++) ph[n] = th * smooth(n * dt);
  for (let n = 1; n <= N; n++) { const f = (ph[n - 1] + ph[n]) / 2; cx[n] = cx[n - 1] - Math.sin(f) * dt; cy[n] = cy[n - 1] + Math.cos(f) * dt; }
  const at = (a, t) => { if (t <= 0) return a === cy ? t : a[0]; const k = Math.min(N - 1, Math.floor(t / dt)), r = t / dt - k; return a[k] * (1 - r) + a[k + 1] * r; };
  const phi = (t) => th * smooth(Math.max(0, t));
  return { Cx: (t) => t <= 0 ? 0 : at(cx, t), Cy: (t) => t <= 0 ? t : at(cy, t), phi };
}
// 원본 점 (x, y) 가 휜 뒤 가는 위치 (px, 연속 좌표). x0 = 몸 중심축 x
function forward(curve, x0, x, y) { const t = GROUND - y, f = curve.phi(t), r = x - x0; return [x0 + curve.Cx(t) + r * Math.cos(f), GROUND - (curve.Cy(t) + r * Math.sin(f))]; }
// 결과 점 (X, Y) 가 원본 어디서 왔는지 (역변환, 반복 풀이)
function inverse(curve, x0, X, Y) {
  const U = X - x0, V = GROUND - Y; let t = V, r = U;
  for (let n = 0; n < 12; n++) { const f = curve.phi(t), px = U - curve.Cx(t), py = V - curve.Cy(t); r = px * Math.cos(f) + py * Math.sin(f); t += -px * Math.sin(f) + py * Math.cos(f); }
  return [x0 + r, GROUND - t];
}
const W = 160, SUB = 8;
function bend(img, deg, x0) {
  const curve = makeCurve(deg), o = { w: W, h: W, d: Buffer.alloc(W * W * 4) };
  for (let j = 0; j < 79; j++) for (let i = 0; i < 79; i++) {
    const cnt = new Map(); let empty = 0;
    for (let b = 0; b < SUB; b++) for (let a = 0; a < SUB; a++) {
      const [xs, ys] = inverse(curve, x0, 2 * i + 1 + (a + 0.5) / SUB * 2, 2 * j + 1 + (b + 0.5) / SUB * 2), sx = Math.floor(xs), sy = Math.floor(ys);
      if (sx < 0 || sy < 0 || sx >= W || sy >= W) { empty++; continue; } const q = (sy * W + sx) * 4; if (!img.d[q + 3]) { empty++; continue; }
      const k = img.d[q] + ',' + img.d[q + 1] + ',' + img.d[q + 2]; cnt.set(k, (cnt.get(k) || 0) + 1);
    }
    const filled = SUB * SUB - empty; if (filled * 2 < SUB * SUB || !cnt.size) continue; // 불투명이 절반 미만이면 투명
    let best = null, bn = 0; for (const [k, n] of cnt) if (n > bn) { bn = n; best = k; }
    const c = best.split(',').map(Number); for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) { const q = ((2 * j + 1 + y) * W + 2 * i + 1 + x) * 4; o.d[q] = c[0]; o.d[q + 1] = c[1]; o.d[q + 2] = c[2]; o.d[q + 3] = 255; }
  }
  return o;
}
// 점 (x, y) 가 기울이기로 움직인 양 [dx, dy] (px)
const disp = (deg, x0, x, y) => { const [X, Y] = forward(makeCurve(deg), x0, x, y); return [X - x, Y - y]; };
module.exports = { bend, disp, forward, inverse, makeCurve, GROUND, RAMP };
