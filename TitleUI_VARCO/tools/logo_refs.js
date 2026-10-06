// 로고용 VARCO 레퍼런스: 현재 게임의 일반 / 강화 / 확정 수정 칸 7종을 한 줄씩 ×4 (작은 인덱스 PNG, 업로드용)
const path = require('path'), px = require('../../PauseUI_VARCO/tools/pix.js'), logo = require('./mino_logo.js'), { encode8 } = require('./png8.js');
const ROOT = path.join(__dirname, '..'), TYPES = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'], K = 4, gap = 8, bg = [24, 31, 43]; // 확대 배율, 칸 간격, 게임 칸 바탕색
for (const [tier, name] of [['N', 'u_NormalCells'], ['C', 'u_CrystalCells']]) {
  const C = logo.CELL, W = gap + TYPES.length * (C * K + gap), H = C * K + gap * 2, out = px.blank(W, H);
  for (let i = 0; i < W * H; i++) { out.d[i * 4] = bg[0]; out.d[i * 4 + 1] = bg[1]; out.d[i * 4 + 2] = bg[2]; out.d[i * 4 + 3] = 255; } // 바탕 채움
  TYPES.forEach((T, n) => { // 칸 1번, 스폰 방향
    const t = logo.tile(T, 1, 0, tier), x0 = gap + n * (C * K + gap);
    for (let y = 0; y < C * K; y++) for (let x = 0; x < C * K; x++) { const s = (Math.floor(y / K) * C + Math.floor(x / K)) * 4; if (t.d[s + 3] < 128) continue; t.d.copy(out.d, ((gap + y) * W + x0 + x) * 4, s, s + 3); }
  });
  encode8(px.kmeans(out, 128, 20), `${ROOT}/refs/${name}.png`); // 128색 (미노 색이 섞이지 않을 만큼)
  console.log(name, W + 'x' + H, require('fs').statSync(`${ROOT}/refs/${name}.png`).size + 'B');
}
