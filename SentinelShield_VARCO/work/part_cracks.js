// ---------- 금(균열): 맞은 곳(왼쪽 위 테두리)에서 안쪽으로 뻗는 선. 같은 시드라 짧은 단계는 긴 단계의 앞부분 ----------
const CRK_ANG = [0, -0.6, 0.6, -1.1, 1.1, -0.3, 0.9];
function cracksFrom(g, D, ix, iy, n, len, seed, col = COL.pale) {
  const tx = D.ccx, ty = D.bb + 1 - 0.4 * D.ry, base = Math.atan2(ty - iy, tx - ix);
  for (let k = 0; k < n; k++) { const R = rnd(seed + k * 17); let x = ix, y = iy, a = base + CRK_ANG[k], L = len * (0.7 + 0.5 * R());
    for (let s = 0; s < L; s++) { const X = Math.round(x), Y = Math.round(y); if (has(g, X, Y)) { const o = (Y * BW + X) * 4; g[o] = col[0]; g[o + 1] = col[1]; g[o + 2] = col[2]; g[o + 3] = 255; } x += Math.cos(a); y += Math.sin(a); a += (R() - 0.5) * 0.35; } }
}
function cracks(g, D, n, len, seed, col = COL.pale) { const [ix, iy] = impactPoint(D); cracksFrom(g, D, Math.round(ix), Math.round(iy), n, len, seed, col); } // 폭발 직전 금(부풀기 2단계 돔에서도 같은 방식)
function star(g, cx, cy, r, col, core) { for (let k = -r; k <= r; k++) { bset(g, cx + k, cy, col); bset(g, cx, cy + k, col); } bset(g, cx, cy, core || COL.white); } // 십자 불꽃
function impactPoint(D) { const th = 2.3; return [D.ccx + D.rx * 0.93 * Math.cos(th), D.bb + 1 - D.ry * 0.93 * Math.sin(th)]; } // 맞은 곳: 돔 왼쪽 위 테두리
function pit(g, ix, iy, r) { for (let y = Math.floor(iy - r); y <= Math.ceil(iy + r); y++) for (let x = Math.floor(ix - r); x <= Math.ceil(ix + r); x++) if (Math.hypot(x - ix, y - iy) <= r && inb(x, y)) g[(y * BW + x) * 4 + 3] = 0; } // 맞은 자리 파임
