// GIF 사전 양자화 (작업 폴더 전용): 256색 한계에서 이펙트·캐릭터·아이콘의 정확한 색은 그대로 두고, 배경(UI·동굴) 색만 줄인다. 공용 lib_fx.writeGif 는 5비트 칸 평균으로 팔레트를 만들기 때문에 보호 색이 서로 다른 칸에 있도록 맞춘 뒤 넘긴다.
const bin = (r, g, b) => ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
// frames: [{w,h,d}] 불투명 가정, protectedColors: [[r,g,b], ...] 정확히 보존할 색. 반환: 새 프레임 배열(원본 유지), 정보
function prequant(frames, protectedColors, maxColors = 255) {
  const P = new Map(); // 칸 → 보호 색 (칸마다 첫 색, 같은 칸의 다른 보호 색은 그 색으로 합쳐짐: 5비트 칸 안이라 차이 8 미만)
  const exact = new Set(); for (const c of protectedColors) { exact.add((c[0] << 16) | (c[1] << 8) | c[2]); const b = bin(c[0], c[1], c[2]); if (!P.has(b)) P.set(b, c); }
  const cnt = new Map(); // 보호 칸이 아닌 배경 칸의 빈도 + 색 합
  for (const f of frames) for (let i = 0; i < f.w * f.h; i++) { const o = i * 4, r = f.d[o], g = f.d[o + 1], b = f.d[o + 2]; if (exact.has((r << 16) | (g << 8) | b)) continue; const k = bin(r, g, b); if (P.has(k)) continue; const e = cnt.get(k) || [0, 0, 0, 0]; e[0]++; e[1] += r; e[2] += g; e[3] += b; cnt.set(k, e); }
  const room = maxColors - P.size, bg = [...cnt.entries()].sort((a, b) => b[1][0] - a[1][0]).slice(0, Math.max(0, room)).map(([k, e]) => ({ k, c: [Math.round(e[1] / e[0]), Math.round(e[2] / e[0]), Math.round(e[3] / e[0])] }));
  const pal = [...P.entries()].map(([k, c]) => ({ k, c })).concat(bg), bgByBin = new Map(bg.map(e => [e.k, e.c])), cache = new Map();
  const nearest = (r, g, b) => { const key = (r << 16) | (g << 8) | b; if (cache.has(key)) return cache.get(key); let best = pal[0].c, bd = 1e18; for (const e of pal) { const d = (e.c[0] - r) ** 2 + (e.c[1] - g) ** 2 + (e.c[2] - b) ** 2; if (d < bd) { bd = d; best = e.c; } } cache.set(key, best); return best; };
  const out = frames.map(f => { const n = { w: f.w, h: f.h, d: Buffer.from(f.d) }; for (let i = 0; i < f.w * f.h; i++) { const o = i * 4, r = f.d[o], g = f.d[o + 1], b = f.d[o + 2]; if (exact.has((r << 16) | (g << 8) | b)) continue; const k = bin(r, g, b); const c = P.has(k) ? P.get(k) : (bgByBin.get(k) || nearest(r, g, b)); n.d[o] = c[0]; n.d[o + 1] = c[1]; n.d[o + 2] = c[2]; } return n; });
  return { frames: out, info: { protected: P.size, background: bg.length, palette: pal.length } };
}
module.exports = { prequant };
