// GIF 미리보기용 중앙값 분할(median-cut) 색 줄이기 (작업 폴더 전용): 렌더 캡처는 고유 색이 수천 개라 256색 한계에서 오차가 크므로, 전체 프레임의 색 분포에 맞춘 팔레트를 만든다. 이펙트 색은 정확히 보존.
const key = (r, g, b) => (r << 16) | (g << 8) | b;
function quantize(frames, protectedColors, N = 256) {
  const hist = new Map(); for (const f of frames) for (let i = 0; i < f.w * f.h; i++) { const k = key(f.d[i * 4], f.d[i * 4 + 1], f.d[i * 4 + 2]); hist.set(k, (hist.get(k) || 0) + 1); }
  const prot = new Set(protectedColors.map(c => key(c[0], c[1], c[2]))), items = []; for (const [k, n] of hist) if (!prot.has(k)) items.push({ r: k >> 16, g: (k >> 8) & 255, b: k & 255, n });
  let boxes = [items]; const room = N - prot.size;
  while (boxes.length < room) { // 가장 크게(픽셀 수 × 범위) 퍼진 상자를 중앙값에서 가름
    let bi = -1, bs = -1, bc = 0; boxes.forEach((bx, i) => { if (bx.length < 2) return; for (const c of ['r', 'g', 'b']) { let lo = 255, hi = 0, w = 0; for (const it of bx) { lo = Math.min(lo, it[c]); hi = Math.max(hi, it[c]); w += it.n; } const s = (hi - lo) * Math.sqrt(w); if (s > bs) { bs = s; bi = i; bc = c; } } });
    if (bi < 0) break; const bx = boxes[bi]; bx.sort((a, b) => a[bc] - b[bc]); let tot = 0; for (const it of bx) tot += it.n; let acc = 0, cut = 1; for (let i = 0; i < bx.length; i++) { acc += bx[i].n; if (acc >= tot / 2) { cut = Math.min(Math.max(1, i + 1), bx.length - 1); break; } }
    boxes.splice(bi, 1, bx.slice(0, cut), bx.slice(cut)); }
  const pal = boxes.map(bx => { let r = 0, g = 0, b = 0, w = 0; for (const it of bx) { r += it.r * it.n; g += it.g * it.n; b += it.b * it.n; w += it.n; } return [Math.round(r / w), Math.round(g / w), Math.round(b / w)]; }).concat(protectedColors.map(c => c.slice()));
  const cache = new Map(), nearest = (r, g, b) => { const k = key(r, g, b); let c = cache.get(k); if (c) return c; let bd = 1e18; for (const e of pal) { const d = (e[0] - r) ** 2 + (e[1] - g) ** 2 + (e[2] - b) ** 2; if (d < bd) { bd = d; c = e; } } cache.set(k, c); return c; };
  return { frames: frames.map(f => { const n = { w: f.w, h: f.h, d: Buffer.from(f.d) }; for (let i = 0; i < f.w * f.h; i++) { const k = key(f.d[i * 4], f.d[i * 4 + 1], f.d[i * 4 + 2]); if (prot.has(k)) continue; const c = nearest(f.d[i * 4], f.d[i * 4 + 1], f.d[i * 4 + 2]); n.d[i * 4] = c[0]; n.d[i * 4 + 1] = c[1]; n.d[i * 4 + 2] = c[2]; } return n; }), palette: pal.length };
}
module.exports = { quantize };
