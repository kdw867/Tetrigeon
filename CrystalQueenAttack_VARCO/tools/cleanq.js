// 스냅한 스프라이트 정리 (작업 폴더 전용): 떨어진 점 제거, 바깥에 붙은 옅은 분홍 잔상 제거, 안쪽에 갇힌 구멍 메우기
const p = require('../../PauseUI_VARCO/tools/pix.js');
const DARK = [15, 23, 54];
const lum = (d, o) => d[o] + d[o + 1] + d[o + 2];
// 잔상 색: 채도 낮은 밝은 회색, 또는 연분홍(수정 하이라이트와 같은 색이라 이웃이 몸 색일 때만 남김)
const halo = (d, o) => { const r = d[o], g = d[o + 1], b = d[o + 2]; return (Math.max(r, g, b) - Math.min(r, g, b) < 45 && r + g + b > 380) || (r > 200 && g > 140 && b > 220); };
function clean(img) {
  const W = img.w, H = img.h, d = img.d;
  const A = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? 0 : d[(y * W + x) * 4 + 3];
  const clear = (x, y) => { d[(y * W + x) * 4 + 3] = 0; };
  // 1) 8방향 연결 덩어리 중 가장 큰 것만 남김 (떨어진 점·잔상 조각 제거). 잔상 제거 뒤에 한 번 더 호출함
  let removed = 0;
  const keepMain = () => {
  const lab = new Int32Array(W * H).fill(-1); const sizes = [];
  for (let y0 = 0; y0 < H; y0++) for (let x0 = 0; x0 < W; x0++) {
    if (!A(x0, y0) || lab[y0 * W + x0] >= 0) continue;
    const id = sizes.length; let n = 0; const st = [[x0, y0]]; lab[y0 * W + x0] = id;
    while (st.length) { const [x, y] = st.pop(); n++; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = x + dx, Y = y + dy; if (A(X, Y) && lab[Y * W + X] < 0) { lab[Y * W + X] = id; st.push([X, Y]); } } }
    sizes.push(n);
  }
  const main = sizes.indexOf(Math.max(...sizes));
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (A(x, y) && lab[y * W + x] !== main) { clear(x, y); removed++; }
  };
  keepMain();
  // 2) 바깥 잔상: 겉(4방향 이웃 중 투명이 있는) 픽셀이 옅은 분홍이고 연결 이웃이 적으면 반복 제거
  let fringe = 0;
  for (let pass = 0; pass < 4; pass++) for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!A(x, y)) continue; const o = (y * W + x) * 4;
    const edge = !A(x - 1, y) || !A(x + 1, y) || !A(x, y - 1) || !A(x, y + 1); if (!edge) continue;
    if (!halo(d, o)) continue; // 잔상 색(밝은 회색·연분홍)이 아니면 윤곽이라 유지
    // 이웃 중 "몸 색"(어둡지도 분홍도 아닌 색)이 하나도 없으면 윤곽 바깥에 붙은 잔상으로 보고 제거
    let body = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!(dx || dy) || !A(x + dx, y + dy)) continue; const q = ((y + dy) * W + x + dx) * 4; const dk = lum(d, q) < 110; if (!dk && !halo(d, q)) body++; }
    if (body === 0) { clear(x, y); fringe++; }
  }
  keepMain(); // 잔상을 지운 뒤 새로 떨어진 조각 제거
  // 3) 안쪽 구멍 메우기: 바깥과 이어지지 않은 투명 칸은 가장 가까운 윤곽색으로 채움
  const out = new Uint8Array(W * H), st = [];
  for (let x = 0; x < W; x++) { st.push([x, 0], [x, H - 1]); } for (let y = 0; y < H; y++) { st.push([0, y], [W - 1, y]); }
  while (st.length) { const [x, y] = st.pop(); if (x < 0 || y < 0 || x >= W || y >= H || out[y * W + x] || A(x, y)) continue; out[y * W + x] = 1; st.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]); }
  let holes = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!A(x, y) && !out[y * W + x]) { const o = (y * W + x) * 4; d[o] = DARK[0]; d[o + 1] = DARK[1]; d[o + 2] = DARK[2]; d[o + 3] = 255; holes++; }
  return { removed, fringe, holes };
}
module.exports = { clean };
if (require.main === module) {
  const f = process.argv[2], img = p.decode(f); const r = clean(img); p.encode(img, process.argv[3] || f); console.log('clean', JSON.stringify(r));
}
