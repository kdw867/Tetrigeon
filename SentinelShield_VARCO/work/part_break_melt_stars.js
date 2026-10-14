// ---------- 중간 파손 (성공 분기) ----------
let CRKD = null;
function crackedSolid() { if (CRKD) return CRKD; const D = dome(0), g = solid(D), [ix, iy] = impactPoint(D); cracksFrom(g, D, Math.round(ix), Math.round(iy), 5, 13, 91); pit(g, Math.round(ix), Math.round(iy), 2.4); return CRKD = g; } // 금 5줄 + 맞은 자리 파임: 파손 마지막 장면 = 녹아내림 첫 장면
function hitFlash() { const D = dome(0), g = solid(D); recolor(g, (c) => mix(c, COL.pale, 0.72)); const [ix, iy] = impactPoint(D); star(g, Math.round(ix), Math.round(iy), 4, COL.white, COL.white); return g; }
function chipsAt(g, D, k, n) { const R = rnd(4242), [ix, iy] = impactPoint(D); for (let i = 0; i < n; i++) { const a = Math.PI + 0.15 + 1.2 * (i / Math.max(1, n - 1)) + (R() - 0.5) * 0.2, sp = 1.5 + 1.7 * R(), sz = i % 3 === 0 ? 2 : 1, c = [COL.pale, TONE[7], TONE[6]][i % 3], X = ix + Math.cos(a) * sp * k, Y = iy + Math.sin(a) * sp * k + 0.5 * 0.4 * k * k; for (let a2 = 0; a2 < sz; a2++) for (let b2 = 0; b2 < sz; b2++) { const x = Math.round(X) + a2, y = Math.round(Y) + b2; if (x >= LIM.x0 && y >= LIM.y0 && y <= D.bb) bset(g, x, y, c); } } }
function midBreak(k) { // k = 1 (금 3줄·조각 6) / 2 (금 5줄·조각 9)
  const D = dome(0), [ix, iy] = impactPoint(D); let g; if (k === 1) { g = solid(D); cracksFrom(g, D, Math.round(ix), Math.round(iy), 3, 6, 91); pit(g, Math.round(ix), Math.round(iy), 1.6); star(g, Math.round(ix), Math.round(iy), 2, COL.pale, COL.white); } else g = Uint8Array.from(crackedSolid());
  chipsAt(g, D, k, k === 1 ? 6 : 9); return g;
}

// ---------- 녹아내림 (성공 분기): 위에서부터 내려앉으며 각진 도트 방울이 떨어지고 바닥에 고였다가 증발 ----------
const DROPS = { dia: [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]], tri: [[0, 0], [1, 0], [0, 1]], tri2: [[0, 0], [-1, 0], [0, 1]], bar: [[0, 0], [0, 1]], zig: [[0, 0], [0, 1], [1, 1]], zag: [[0, 0], [0, 1], [-1, 1]] };
let MELT = null;
function meltAll(n = 10) {
  if (MELT) return MELT; const D = dome(0), R = rnd(555), cracked = crackedSolid(), plain = solid(D), cols = []; for (let bx = D.bl; bx <= D.br; bx++) cols.push(bx);
  const top = {}, raw = {}; for (const bx of cols) { for (let by = D.bt; by <= D.bb; by++) if (has(plain, bx, by)) { top[bx] = by; break; } raw[bx] = R(); }
  const rate = {}; for (const bx of cols) { let s = 0, c = 0; for (let d = -3; d <= 3; d++) if (raw[bx + d] !== undefined) { s += raw[bx + d]; c++; } rate[bx] = 1.0 + 0.7 * (s / c); } // 이웃과 섞어 완만한 물결: 열마다 1.0~1.7배 속도
  let drops = [], frames = [], prevCut = {};
  for (let m = 0; m < n; m++) {
    const tm = m / (n - 4), g = G(), cut = {}, src = m === 0 ? cracked : plain;
    for (const bx of cols) { if (top[bx] === undefined) continue; const h = D.bb - 1 - top[bx]; cut[bx] = top[bx] + h * Math.min(1, tm * rate[bx]); }
    if (m > 0) for (const bx of cols) { if (top[bx] === undefined) continue; const c0 = Math.ceil(cut[bx] - 1e-9); for (let by = c0; by <= D.bb - 2; by++) { if (!has(src, bx, by)) continue; const b = bget(src, bx, by); bset(g, bx, by, by === c0 ? TONE[7] : [b[0], b[1], b[2]]); } }
    else for (let i = 0; i < BW * BH * 4; i++) g[i] = src[i];
    const movers = cols.filter(bx => top[bx] !== undefined && m > 0 && cut[bx] - (prevCut[bx] ?? cut[bx]) >= 0.7); // 이번에 많이 내려앉은 열에서 방울이 떨어짐
    for (let k = 0; k < (m > 0 && m < n - 3 ? 4 : 0) && movers.length; k++) { const bx = movers[Math.floor(R() * movers.length)], ks = Object.keys(DROPS); drops.push({ x: bx, y: Math.ceil(cut[bx]) + 1, vy: 0.6 + R() * 0.5, shape: ks[Math.floor(R() * ks.length)], c: [COL.pale, TONE[7], TONE[6], TONE[5]][Math.floor(R() * 4)] }); }
    drops = drops.filter(d => d.y < D.bb - 2);
    for (const d of drops) { for (const [dx, dy] of DROPS[d.shape]) { const Y = Math.round(d.y) + dy; if (Y < D.bb - 1) bset(g, d.x + dx, Y, d.c); } if (d.vy > 1.2) bset(g, d.x, Math.round(d.y) - 1, shade(d.c, 2)); } // 빠른 방울은 위로 꼬리 한 칸
    const pw = Math.min(1, 0.15 + tm * 0.9);
    if (m >= 1 && m < n - 3) for (let bx = D.bl - 1; bx <= D.br + 1; bx++) { const f = Math.abs(bx + 0.5 - D.ccx) / (D.rx + 1); if (f <= pw) { bset(g, bx, D.bb - 1, f > pw - 0.1 ? TONE[6] : TONE[3]); if (f <= pw * 0.7) bset(g, bx, D.bb - 2, (bx % 3 === 0) ? TONE[5] : TONE[2]); } } // 바닥에 고인 웅덩이
    for (const d of drops) { d.y += d.vy; d.vy += 0.45; }
    for (let bx = D.bl - 1; bx <= D.br + 1; bx++) { const keepP = m < n - 3 ? 1 : [0.65, 0.3, 0][m - (n - 3)]; if (R() < keepP) bset(g, bx, D.bb, m < n - 3 ? TONE[5] : (R() < 0.5 ? TONE[5] : TONE[3])); } // 바닥 줄: 마지막 3프레임 증발
    if (m >= n - 3) for (let k = 0; k < 7; k++) { const bx = Math.round(D.ccx + (R() - 0.5) * D.rx * 1.6), up = (m - (n - 3) + 1) * (1 + R() * 1.5); bset(g, bx, D.bb - 2 - up, k % 2 ? COL.pale : TONE[6]); } // 증발하는 불씨
    prevCut = cut; frames.push(g);
  }
  return MELT = frames;
}

// ---------- 스턴 별 (12프레임 루프): 머리 위 타원 궤도를 도는 노란 별 3개와 짧은 꼬리. 앞(아래쪽)별은 5x5 블록 별, 뒤(위쪽)별은 3x3 십자 ----------
const STAR5 = ['..#..', '.###.', '#####', '.###.', '.#.#.'], STAR5C = [[2, 2]];
function starFrames(stunCell, n = 12) {
  let ex = 0, en = 0, top = 999; for (let y = 0; y < 60; y++) for (let x = 0; x < 144; x++) { const o = (y * 144 + x) * 4; if (stunCell.d[o + 3] && stunCell.d[o + 1] > 160 && stunCell.d[o + 2] > 180 && stunCell.d[o] < 130) { ex += x; en++; } } const hx = ex / en;
  for (let y = 0; y < 104 && top === 999; y++) for (let x = Math.round(hx) - 14; x <= Math.round(hx) + 14; x++) if (stunCell.d[(y * 144 + x) * 4 + 3]) { top = y; break; }
  const cx = Math.round((hx + 32) / 2), cy = Math.round((top + 32) / 2) - 6, rx = 10, ry = 2.4, out = [], OFF = [0, 115, 235].map(a => a * Math.PI / 180);
  for (let f = 0; f < n; f++) { const g = G(), items = OFF.map(o => ({ th: 2 * Math.PI * f / n + o })); items.forEach(s => s.front = Math.sin(s.th) > 0);
    items.sort((a, b) => Math.sin(a.th) - Math.sin(b.th)); // 뒤쪽 별 먼저 그림
    for (const s of items) { const at = (t) => [cx + rx * Math.cos(t), cy + ry * Math.sin(t)], tl = s.front ? 3 : 2;
      for (let t = tl; t >= 1; t--) { const [tx, ty] = at(s.th - t * (2 * Math.PI / n) * 0.5); bset(g, tx, ty, [COL.star3, COL.star3, COL.star4][t - 1] || COL.star4); } // 꼬리(진행 반대 방향)
      const [x, y] = at(s.th), X = Math.round(x), Y = Math.round(y);
      if (s.front) { STAR5.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === '#') bset(g, X - 2 + i, Y - 2 + j, j === 4 ? COL.star3 : COL.star2); })); bset(g, X, Y, COL.star1); bset(g, X - 1, Y - 1, COL.star1); }
      else { for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) bset(g, X + dx, Y + dy, COL.star3); bset(g, X, Y, COL.star2); } }
    out.push(g); }
  return { frames: out, info: { cx, cy, rx, ry, headTop: top, headX: hx } };
}
