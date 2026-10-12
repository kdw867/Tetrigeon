// 수정 팔 위치 측정 (작업 폴더 전용): 셀에서 눈(청록 작은 덩어리) 중심을 기준으로, 가장 큰 보라 덩어리(수정 팔)의 무게중심 벡터와 가장 먼 끝점을 잰다.
const L = require('./lib_place.js');
const { CW, CH } = L;
const kind = (r, g, b) => (g > 140 && b > 180 && r < 150 && g > r + 60) ? 'cyan' : ((b - g > 55 && r > 40 && b > 90) ? 'purple' : 'stone');
function comps(cell, want) { // 8방향 연결 덩어리 목록
  const seen = new Uint8Array(CW * CH), out = [];
  const ok = (x, y) => x >= 0 && y >= 0 && x < CW && y < CH && cell.d[(y * CW + x) * 4 + 3] && kind(cell.d[(y * CW + x) * 4], cell.d[(y * CW + x) * 4 + 1], cell.d[(y * CW + x) * 4 + 2]) === want;
  for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) { if (!ok(x, y) || seen[y * CW + x]) continue; const px = [], st = [[x, y]]; seen[y * CW + x] = 1; while (st.length) { const [a, b] = st.pop(); px.push([a, b]); for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = a + dx, Y = b + dy; if (ok(X, Y) && !seen[Y * CW + X]) { seen[Y * CW + X] = 1; st.push([X, Y]); } } } out.push(px); }
  return out;
}
const cen = (px) => [px.reduce((s, q) => s + q[0], 0) / px.length, px.reduce((s, q) => s + q[1], 0) / px.length];
function measure(cell) {
  const cy = comps(cell, 'cyan').sort((a, b) => a.length - b.length);
  // 눈: 가장 작은 두 덩어리의 중심 (코어는 가장 큼). 눈이 가려진 프레임이면 null
  const eyes = cy.length >= 2 ? cen([...cy[0], ...cy[1]]) : (cy.length ? cen(cy[0]) : null);
  const pu = comps(cell, 'purple').sort((a, b) => b.length - a.length);
  const arm = pu[0]; const ac = cen(arm);
  const ref = eyes || [64, 40];
  // 가장 먼 끝점: 눈에서 가장 멀리 있는 팔 픽셀
  let far = arm[0], fd = -1; arm.forEach(q => { const d = (q[0] - ref[0]) ** 2 + (q[1] - ref[1]) ** 2; if (d > fd) { fd = d; far = q; } });
  return { eyes: ref, armCentroid: [ac[0] - ref[0], ac[1] - ref[1]], armTip: [far[0] - ref[0], far[1] - ref[1]], armSize: arm.length, eyesOk: !!eyes };
}
module.exports = { measure, comps };
if (require.main === module) {
  const B = require('./build_v2.js');
  B.cells.forEach((c, i) => { const m = measure(c); console.log(String(i + 1).padStart(2), B.FRAMES[i].src || 'idle01', '팔 무게중심(눈 기준) dx', m.armCentroid[0].toFixed(0), 'dy', m.armCentroid[1].toFixed(0), '| 끝점 dx', m.armTip[0], 'dy', m.armTip[1], '| 팔 도트', m.armSize, m.eyesOk ? '' : '(눈 가림)'); });
}
