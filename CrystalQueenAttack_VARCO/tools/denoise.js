// 회색 돌 두 톤 사이의 고립 점만 정리 (작업 폴더 전용): 회색 계열 픽셀의 4방향 이웃 중 3개 이상이 같은 "다른 회색"이면 그 회색으로 바꿈
const p = require('../../PauseUI_VARCO/tools/pix.js');
const GRAY = new Set(['72,79,97', '116,119,129', '88,94,108']);
function denoise(img) {
  const W = img.w, H = img.h, d = img.d, key = (x, y) => { if (x < 0 || y < 0 || x >= W || y >= H) return null; const o = (y * W + x) * 4; return d[o + 3] ? d[o] + ',' + d[o + 1] + ',' + d[o + 2] : null; };
  let total = 0;
  for (let pass = 0; pass < 2; pass++) { const ch = []; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const k = key(x, y); if (!k || !GRAY.has(k)) continue; const cnt = new Map(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const q = key(x + dx, y + dy); if (q && GRAY.has(q) && q !== k) cnt.set(q, (cnt.get(q) || 0) + 1); } for (const [q, n] of cnt) if (n >= 3) ch.push([x, y, q.split(',').map(Number)]); } for (const [x, y, c] of ch) { const o = (y * W + x) * 4; d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; } total += ch.length; }
  return total;
}
module.exports = { denoise };
if (require.main === module) { const im = p.decode(process.argv[2]); const n = denoise(im); p.encode(im, process.argv[3]); console.log('denoised', n); }
