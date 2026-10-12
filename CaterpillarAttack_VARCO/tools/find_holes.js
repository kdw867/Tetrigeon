// 타격 자세에서 갇힌 투명 칸 좌표를 찾고, 그 주변을 확대 저장 (작업 폴더 전용)
const L = require('./lib_cat.js');
const cfg = { domeH: 27, domeM: 39, legRow: 47, legH: 24, legM: 36, ext: 2 };
const layers = L.buildLayers(L.loadIdle(0), cfg);
const f = L.compose(layers, { H: [-5, -1], M: [-3, -1], R: [-1, 0] });
const W = 64, H = 64, ext = new Uint8Array(W * H), st = [];
for (let x = 0; x < W; x++) st.push(x, (H - 1) * W + x); for (let y = 0; y < H; y++) st.push(y * W, y * W + W - 1);
while (st.length) { const c = st.pop(); if (ext[c] || f.d[c * 4 + 3]) continue; ext[c] = 1; const cx = c % W, cy = (c / W) | 0; if (cx > 0) st.push(c - 1); if (cx < W - 1) st.push(c + 1); if (cy > 0) st.push(c - W); if (cy < H - 1) st.push(c + W); }
const holes = []; for (let i = 0; i < W * H; i++) if (!f.d[i * 4 + 3] && !ext[i]) holes.push((i % W) + ',' + ((i / W) | 0));
console.log('holes', holes.join(' '));
L.p.encode(L.strip([f], 16, [226, 226, 232], [0, 22, 52, 34]), L.R + '/work/test_strike_x16.png');
