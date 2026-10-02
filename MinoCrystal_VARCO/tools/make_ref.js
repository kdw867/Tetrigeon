// VARCO 업로드용 레퍼런스: 강화 미노 칸 7종(I J L O S T Z)을 실제 도트 격자로 줄여 ×4로 한 줄 배치 (작은 인덱스 PNG)
const p = require('../../PauseUI_VARCO/tools/pix.js'), { encode8 } = require('../../TitleUI_VARCO/tools/png8.js'), path = require('path');
const R = path.join(__dirname, '..'), U = R + '/../Tetrigeon/Assets/@Resources/Resources/MinoSprites/Upgraded';
const grid = { I: 5.5, J: 5.25, L: 5.5, O: 5.75, S: 5.25, T: 5.75, Z: 5.25 }; // tools/grid.js로 잰 종류별 도트 한 칸 크기 (원본 px)
const K = 4, gap = 8, bg = [24, 31, 43]; // 확대 배율, 칸 사이 간격, 게임 칸 바탕색
const cells = Object.entries(grid).map(([n, g]) => { // 칸 중심 샘플링으로 도트 해상도 복원
  const s = p.decode(`${U}/${n}_1.png`), w = Math.round(s.w / g), h = Math.round(s.h / g), o = p.blank(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const sx = Math.min(s.w - 1, Math.floor((x + 0.5) * g)), sy = Math.min(s.h - 1, Math.floor((y + 0.5) * g)); s.d.copy(o.d, (y * w + x) * 4, (sy * s.w + sx) * 4, (sy * s.w + sx) * 4 + 4); }
  return o;
});
const H = Math.max(...cells.map(c => c.h)) * K + gap * 2, W = cells.reduce((a, c) => a + c.w * K + gap, gap), out = p.blank(W, H);
for (let i = 0; i < W * H; i++) { out.d[i * 4] = bg[0]; out.d[i * 4 + 1] = bg[1]; out.d[i * 4 + 2] = bg[2]; out.d[i * 4 + 3] = 255; } // 바탕 채움
let x0 = gap;
for (const c of cells) { // 최근접 ×4 배치 (반투명은 바탕과 합성하지 않고 불투명만)
  for (let y = 0; y < c.h * K; y++) for (let x = 0; x < c.w * K; x++) { const s = (Math.floor(y / K) * c.w + Math.floor(x / K)) * 4; if (c.d[s + 3] < 128) continue; c.d.copy(out.d, ((gap + y) * W + x0 + x) * 4, s, s + 3); }
  x0 += c.w * K + gap;
}
const q = p.kmeans(out, 128, 20); // 업로드 용량을 줄이려 128색으로 (미노 색이 섞이지 않을 만큼)
encode8(q, R + '/refs/u_UpgradedCells.png');
console.log(W + 'x' + H, cells.map(c => c.w + 'x' + c.h).join(' '), require('fs').statSync(R + '/refs/u_UpgradedCells.png').size + 'B');
