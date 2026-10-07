// 몬스터 그림의 실제 몸통 범위(투명 여백 제외)를 측정. 좌표는 스프라이트 셀의 왼쪽 아래 기준(유니티 스프라이트 rect와 같은 방향)
const { p, ROOT } = require('./lib_board');
const E = `${ROOT}/Tetrigeon/Assets/@Resources/Enemies/`;
function bbox(img, x0, y0, w, h) { let a = 1e9, b = 1e9, c = -1, d = -1; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (img.d[((y0 + y) * img.w + x0 + x) * 4 + 3] > 20) { a = Math.min(a, x); c = Math.max(c, x); b = Math.min(b, y); d = Math.max(d, y); } return { x: a, yTop: b, w: c - a + 1, h: d - b + 1, yBottomOrigin: h - 1 - d }; }
const out = {};
for (const [k, file, cell] of [['normal', 'CrystalLarvaIdle/T_CrystalLarva_Idle.png', 64], ['epic', 'AmethystSentinelIdle/T_AmethystSentinel_Idle.png', 96], ['boss', 'CrystalQueenIdle/T_CrystalQueen_Idle.png', 160]]) {
  const img = p.decode(E + file); const b = bbox(img, 0, 0, cell, cell); // 첫 프레임 (왼쪽 위 셀)
  out[k + 'Alive'] = { cell, x: b.x, y: b.yBottomOrigin, w: b.w, h: b.h };
}
for (const [k, file] of [['normal', 'T_CrystalLarva_Death.png'], ['epic', 'T_AmethystSentinel_Death.png'], ['boss', 'T_CrystalQueen_Death.png']]) {
  const img = p.decode(E + file); const b = bbox(img, 0, 0, img.w, img.h);
  out[k + 'Dead'] = { cellW: img.w, cellH: img.h, x: b.x, y: b.yBottomOrigin, w: b.w, h: b.h };
}
console.log(JSON.stringify(out, null, 1));
