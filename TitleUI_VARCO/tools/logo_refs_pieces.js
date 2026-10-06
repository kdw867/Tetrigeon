// 로고용 VARCO 레퍼런스: 현재 게임의 일반 미노 7종을 조각 그대로(스폰 방향) 원래 크기로 한 줄 배치 (작은 인덱스 PNG, 업로드용)
const path = require('path'), px = require('../../PauseUI_VARCO/tools/pix.js'), logo = require('./mino_logo.js'), { encode8 } = require('./png8.js');
const ROOT = path.join(__dirname, '..'), TYPES = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'], K = 1, gap = 8, bg = [24, 31, 43]; // 확대 배율, 조각 간격, 게임 칸 바탕색
const ps = TYPES.map(T => logo.renderPiece(T, 0).img);
const W = ps.reduce((a, p) => a + p.w * K + gap, gap), H = Math.max(...ps.map(p => p.h)) * K + gap * 2, out = px.blank(W, H);
for (let i = 0; i < W * H; i++) { out.d[i * 4] = bg[0]; out.d[i * 4 + 1] = bg[1]; out.d[i * 4 + 2] = bg[2]; out.d[i * 4 + 3] = 255; } // 바탕 채움
let x0 = gap;
for (const p of ps) { // 세로 가운데
  const y0 = gap + ((H - gap * 2 - p.h * K) >> 1);
  for (let y = 0; y < p.h * K; y++) for (let x = 0; x < p.w * K; x++) { const s = (Math.floor(y / K) * p.w + Math.floor(x / K)) * 4; if (p.d[s + 3] < 128) continue; p.d.copy(out.d, ((y0 + y) * W + x0 + x) * 4, s, s + 3); }
  x0 += p.w * K + gap;
}
encode8(px.kmeans(out, 40, 20), `${ROOT}/refs/u_NormalPieces.png`);
console.log(W + 'x' + H, require('fs').statSync(`${ROOT}/refs/u_NormalPieces.png`).size + 'B');
