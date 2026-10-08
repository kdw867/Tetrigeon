// 7종 수정 칸 그림에서 색 단계(어두움→밝음)를 뽑는다. 사용: node ramps.js
const { p, R, ROOT } = require('./lib_fx');
const types = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'], out = {};
for (const T of types) {
  const img = p.decode(`${ROOT}/Tetrigeon/Assets/@Resources/Resources/MinoSprites/Crystal/${T}_1.png`);
  const px = []; for (let i = 0; i < img.w * img.h; i++) { const r = img.d[i * 4], g = img.d[i * 4 + 1], b = img.d[i * 4 + 2], a = img.d[i * 4 + 3]; if (a < 200) continue; const M = Math.max(r, g, b), m = Math.min(r, g, b); if ((M - m) / (M || 1) > 0.45 && M > 70) px.push([r, g, b]); }
  const q = p.blank(px.length, 1); px.forEach((c, i) => { q.d[i * 4] = c[0]; q.d[i * 4 + 1] = c[1]; q.d[i * 4 + 2] = c[2]; q.d[i * 4 + 3] = 255; });
  const k = p.kmeans(q, 6), cnt = {}; for (let i = 0; i < px.length; i++) { const key = [k.d[i * 4], k.d[i * 4 + 1], k.d[i * 4 + 2]].map(v => v.toString(16).padStart(2, '0')).join(''); cnt[key] = (cnt[key] || 0) + 1; }
  const ramp = Object.keys(cnt).map(h => '#' + h).sort((a, b) => lum(a) - lum(b)); out[T] = ramp;
  console.log(T, '채도 픽셀', px.length, ramp.join(' '));
}
function lum(h) { const r = parseInt(h.slice(1, 3), 16), g = parseInt(h.slice(3, 5), 16), b = parseInt(h.slice(5, 7), 16); return r * 0.3 + g * 0.59 + b * 0.11; }
require('fs').writeFileSync(`${R}/work/crystal_ramps.json`, JSON.stringify(out, null, 1));
