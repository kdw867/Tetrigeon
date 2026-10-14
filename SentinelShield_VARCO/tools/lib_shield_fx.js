// 센티넬 보호막 스킬 이펙트 생성기 (작업 폴더 전용, Unity와 무관). 보호막 생성 / 폭발 / 중간 파손 / 녹아내림 / 스턴 별을 도트로 직접 그린다 (VARCO 는 투명 출력이 없어 코드로 그림).
// 도트 밀도는 센티넬과 같은 2x2 텍스처 px 블록. 이펙트 캔버스 208x136 px = 블록 104x68, 셀(144x104) 의 (0,0) 은 이펙트 캔버스 블록 (16,16) = 텍스처 (32,32). 발 기준점은 셀 (72,94) → 이펙트 (104,126).
// 블록 격자(bgrid)는 Uint8Array(BW*BH*4) RGBA. 폭발·녹아내림·별은 알파 0/255, 보호막 생성·농도만 반투명.
const fs = require('fs'), path = require('path');
const p = require('../../PauseUI_VARCO/tools/pix.js'), SA = require('./shield_art.js');
const CELLS = path.join(__dirname, '..', 'output', 'SentinelShield_cells_v1');
const FW = 208, FH = 136, BW = 104, BH = 68, OB = 16; // 이펙트 캔버스(텍스처 px), 블록 격자, 셀 → 이펙트 블록 오프셋
const hex = (s) => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
const TONE = ['#3C1668', '#531990', '#6D1AAD', '#851FCA', '#9C2FDB', '#B547E8', '#D374F2', '#EBA5F9'].map(hex); // 센티넬 수정 팔레트(어두움 → 밝음)
const COL = { pale: hex('#F6E4FF'), white: hex('#F4FBFF'), star1: hex('#FFF6B0'), star2: hex('#FFD84A'), star3: hex('#E8A21C'), star4: hex('#A8651A') };
const LIM = { x0: 18, x1: 83, y0: 22 }; // 이웃·화살표를 피하는 이펙트 허용 구간(이펙트 블록): 화면 x 1438~1698, 맨 위 y 95. 아래쪽은 돔 바닥 줄(bb)까지.
function rnd(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
const G = () => new Uint8Array(BW * BH * 4), inb = (x, y) => x >= 0 && y >= 0 && x < BW && y < BH;
function bset(g, x, y, c, a = 255) { x = Math.round(x); y = Math.round(y); if (!inb(x, y)) return; const o = (y * BW + x) * 4; g[o] = c[0]; g[o + 1] = c[1]; g[o + 2] = c[2]; g[o + 3] = a; }
const bget = (g, x, y) => { if (!inb(x, y)) return [0, 0, 0, 0]; const o = (y * BW + x) * 4; return [g[o], g[o + 1], g[o + 2], g[o + 3]]; };
const has = (g, x, y) => inb(x, y) && g[(y * BW + x) * 4 + 3] > 0;
function bover(dst, src, alpha = 1) { for (let i = 0; i < BW * BH; i++) { const o = i * 4, a = src[o + 3] / 255 * alpha; if (!a) continue; const da = dst[o + 3] / 255, oa = a + da * (1 - a); for (let c = 0; c < 3; c++) dst[o + c] = Math.round((src[o + c] * a + dst[o + c] * da * (1 - a)) / oa); dst[o + 3] = Math.round(oa * 255); } }
function toImage(g) { const im = p.blank(FW, FH); for (let by = 0; by < BH; by++) for (let bx = 0; bx < BW; bx++) { const o = (by * BW + bx) * 4; if (!g[o + 3]) continue; for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) { const q = ((by * 2 + y) * FW + bx * 2 + x) * 4; im.d[q] = g[o]; im.d[q + 1] = g[o + 1]; im.d[q + 2] = g[o + 2]; im.d[q + 3] = g[o + 3]; } } return im; }
function fromCell(img) { const g = G(); for (let cy = 0; cy < 52; cy++) for (let cx = 0; cx < 72; cx++) { const o = ((cy * 2) * img.w + cx * 2) * 4; if (img.d[o + 3]) bset(g, cx + OB, cy + OB, [img.d[o], img.d[o + 1], img.d[o + 2]], img.d[o + 3]); } return g; }
const mix = (a, b, t) => [0, 1, 2].map(i => Math.round(a[i] * (1 - t) + b[i] * t));
const nearTone = (c) => { let b = 0, bd = 1e9; TONE.forEach((t, i) => { const d = (t[0] - c[0]) ** 2 + (t[1] - c[1]) ** 2 + (t[2] - c[2]) ** 2; if (d < bd) { bd = d; b = i; } }); return b; };
const PALS = () => [...TONE, COL.pale, COL.white], snapPal = (c) => { let b = null, bd = 1e9; for (const t of PALS()) { const d = (t[0] - c[0]) ** 2 + (t[1] - c[1]) ** 2 + (t[2] - c[2]) ** 2; if (d < bd) { bd = d; b = t; } } return b; }; // 이펙트 팔레트: 센티넬 수정 8색 + 연보라 + 흰색
const shade = (c, s) => TONE[Math.max(0, nearTone(c) - s)];
function recolor(g, fn) { for (let by = 0; by < BH; by++) for (let bx = 0; bx < BW; bx++) { const o = (by * BW + bx) * 4; if (!g[o + 3]) continue; const c = fn([g[o], g[o + 1], g[o + 2]], bx, by); g[o] = c[0]; g[o + 1] = c[1]; g[o + 2] = c[2]; } }
function count(g) { let n = 0; for (let i = 0; i < BW * BH; i++) if (g[i * 4 + 3]) n++; return n; }

// ---------- 돔(보호막) ----------
const holdCell = p.decode(path.join(CELLS, 'Sentinel_hold.png')), domes = {};
function dome(e = 0) { // e: 부풀기 단계(블록). 같은 면 구조를 더 크게 다시 그림, 바닥 줄 높이(bb)는 그대로
  if (domes[e]) return domes[e]; const s = SA.build(holdCell, 3 + e, 4 + e), f = s.info;
  const D = { e, fill: fromCell(s.fill), rim: fromCell(s.rim), bl: f.bl + OB, br: f.br + OB, bt: f.bt + OB, bb: f.bb + OB };
  D.ccx = (D.bl + D.br + 1) / 2; D.rx = (D.br - D.bl + 1) / 2; D.ry = D.bb - D.bt + 1;
  D.rn = (bx, by) => Math.pow(Math.pow(Math.abs(bx + 0.5 - D.ccx) / D.rx, 2.6) + Math.pow(Math.abs(D.bb + 1 - (by + 0.5)) / D.ry, 2.6), 1 / 2.6); // 돔 가장자리 = 1
  return domes[e] = D;
}
function solid(D) { const g = G(); bover(g, D.fill, 1); bover(g, D.rim, 1); return g; }
function held(D, pr) { const g = G(); bover(g, D.fill, SA.A_FILL(pr)); bover(g, D.rim, SA.A_RIM(pr)); return g; } // 보호막 농도 (본체 위에 겹쳐 그림)

// ---------- 보호막 생성 (7프레임: 바닥 룬 선에서 돔이 자라남, 밝은 선두 띠, 불꽃, 안정) ----------
const CT = [0.16, 0.34, 0.52, 0.70, 0.88, 1.0, 1.0], CFA = [0.55, 0.55, 0.55, 0.55, 0.55, 0.50, 0.32], CRA = [0.95, 0.95, 0.95, 0.95, 0.95, 1.0, 0.85];
function create(i) {
  const D = dome(0), T = CT[i], R = rnd(31 + i), g = G(), part = (src) => { const o = G(); for (let by = 0; by < BH; by++) for (let bx = 0; bx < BW; bx++) if (has(src, bx, by) && (T >= 1 || D.rn(bx, by) <= T + 1e-9)) { const c = bget(src, bx, by); const lead = i < 5 && D.rn(bx, by) > T - 0.12; bset(o, bx, by, lead ? TONE[7] : [c[0], c[1], c[2]], 255); } return o; };
  bover(g, part(D.fill), CFA[i]); bover(g, part(D.rim), CRA[i]);
  if (i === 5) recolor(g, (c) => snapPal(mix(c, COL.pale, 0.55))); // 완성 순간 번쩍임
  if (i < 5) for (let k = 0; k < 6; k++) { const th = Math.PI * (0.05 + 0.9 * R()), r = T + 0.12 + 0.2 * R(); bset(g, D.ccx + D.rx * r * Math.cos(th), D.bb + 1 - D.ry * r * Math.sin(th) * 0.95, k % 2 ? COL.pale : TONE[7]); } // 선두 바깥 불씨
  return g;
}

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
// ---------- 폭발 (실패 분기) ----------
function expand(level) { const D = dome(level); const g = solid(D); if (level === 2) cracks(g, D, 5, 11, 2026); return g; } // level 0/1/2: 부풀기 단계, 2는 금이 감
function burstFlash() { const D = dome(2), g = solid(D); recolor(g, (c, x, y) => nearTone(c) >= 6 ? COL.white : snapPal(mix(c, COL.pale, 0.62))); const cy = D.bb + 1 - D.ry * 0.45; for (let a = 0; a < 8; a++) { const th = a * Math.PI / 4, ln = a % 2 ? 6 : 10; for (let s = 2; s <= ln; s++) bset(g, D.ccx + Math.cos(th) * s * 1.2, cy + Math.sin(th) * s * 0.7, s > ln - 2 ? TONE[7] : COL.pale); } return g; }
const DRAG = [1, 1.55, 1.85, 2.0, 2.1, 2.2]; // 처음에 빠르게 튀어 나가다 속도가 줄어드는 이동량 배율
let SHARD = null;
function makeShards() {
  if (SHARD) return SHARD; const D = dome(2), S = solid(D), R = rnd(777), seeds = [], mk = (rf, th) => [D.ccx + D.rx * rf * Math.cos(th), D.bb + 1 - D.ry * rf * Math.sin(th)];
  [[0.12, 2], [0.32, 5], [0.55, 8], [0.78, 10], [0.97, 9]].forEach(([rf, n]) => { for (let k = 0; k < n; k++) seeds.push(mk(rf, Math.PI * (k + 0.5) / n + (R() - 0.5) * 0.15)); });
  const sh = seeds.map(() => ({ b: [] }));
  for (let by = 0; by < BH; by++) for (let bx = 0; bx < BW; bx++) if (has(S, bx, by)) { let b = 0, bd = 1e9; seeds.forEach(([sx, sy], i) => { const d = Math.hypot(bx + 0.5 - sx, (by + 0.5 - sy) * 1.15); if (d < bd) { bd = d; b = i; } }); const c = bget(S, bx, by); sh[b].b.push({ x: bx, y: by, c: [c[0], c[1], c[2]], k: R() }); }
  const cyc = D.bb + 1 - 0.4 * D.ry; const out = [];
  for (const s of sh) { if (!s.b.length) continue; s.cx = s.b.reduce((a, q) => a + q.x, 0) / s.b.length; s.cy = s.b.reduce((a, q) => a + q.y, 0) / s.b.length; const dx = s.cx - D.ccx, dy = s.cy - cyc, ln = Math.hypot(dx, dy) || 1, sp = 1.9 + 1.6 * R() + 1.3 * Math.min(1, Math.abs(dx) / D.rx); s.mid = 1 - Math.min(1, Math.abs(dx) / (D.rx * 0.55)); // 가운데 조각은 멀리 못 가니 빨리 가루가 됨
    s.vx = dx / ln * sp * 1.1; s.vy = s.cy > D.bb - 6 ? -0.25 * R() : dy / ln * sp * 0.4 - 0.25; s.b.sort((a, c) => (Math.hypot(c.x - s.cx, c.y - s.cy) + c.k) - (Math.hypot(a.x - s.cx, a.y - s.cy) + a.k));
    const xs = s.b.map(q => q.x), ys = s.b.map(q => q.y), fin = DRAG[5]; if (Math.max(...xs) + s.vx * fin > LIM.x1) s.vx = (LIM.x1 - Math.max(...xs)) / fin; if (Math.min(...xs) + s.vx * fin < LIM.x0) s.vx = (LIM.x0 - Math.min(...xs)) / fin; if (Math.min(...ys) + s.vy * fin < LIM.y0) s.vy = (LIM.y0 - Math.min(...ys)) / fin; out.push(s); } // 끝까지 가도 허용 구간 안에 남도록 속도 보정 // 바깥 도트부터 부서지는 순서
  let ps = []; for (let k = 0; k < 34; k++) { const th = Math.PI * (0.04 + 0.92 * R()), r = 0.35 + 0.65 * R(), sp = 1.8 + 2.4 * R(); ps.push({ x: D.ccx + D.rx * r * Math.cos(th), y: D.bb + 1 - D.ry * r * Math.sin(th) * 0.9, vx: Math.max(-(D.ccx + D.rx * r * Math.cos(th) - LIM.x0) / 5.5, Math.min((LIM.x1 - (D.ccx + D.rx * r * Math.cos(th))) / 5.5, Math.cos(th) * sp * 1.1)), vy: -Math.sin(th) * sp * 0.38 - 0.15, life: 3 + Math.floor(3 * R()), plus: k < 7 }); }
  return SHARD = { D, shards: out, particles: ps };
}
const ER = [0, 0.14, 0.32, 0.55, 0.78, 0.95], SH = [0, 0, 0, 1, 1, 2], WH = [0.40, 0.15, 0, 0, 0, 0];
let CLIPPED = 0, CLIPS = 0, CLIPP = 0;
function shatter(k) { // k = 1..6
  const { D, shards, particles } = makeShards(), g = G();
  for (const s of shards) { const ys = s.b.map(q => q.y); let dx = Math.round(s.vx * DRAG[k - 1]), dy = Math.round(s.vy * DRAG[k - 1] + 0.5 * 0.28 * k * k); const maxY = Math.max(...ys) + dy; if (maxY > D.bb) dy -= (maxY - D.bb); // 바닥에 닿으면 바닥 줄 위에 얹힘
    const keep = s.b.length - Math.floor(Math.min(1, ER[k - 1] * (1 + 0.9 * s.mid)) * s.b.length);
    for (let i = 0; i < keep; i++) { const q = s.b[s.b.length - 1 - i]; const X = q.x + dx, Y = q.y + dy; if (X < LIM.x0 || X > LIM.x1 || Y < LIM.y0 || Y > D.bb) { CLIPPED++; CLIPS++; continue; } let c = SH[k - 1] ? shade(q.c, SH[k - 1]) : q.c; if (WH[k - 1]) c = snapPal(mix(c, COL.pale, WH[k - 1])); bset(g, X, Y, c); } }
  for (const q of particles) { if (k > q.life) continue; const X = Math.round(q.x + q.vx * k), Y = Math.round(q.y + q.vy * k + 0.5 * 0.12 * k * k); if (X < LIM.x0 || X > LIM.x1 || Y < LIM.y0 || Y > D.bb) { CLIPPED++; CLIPP++; continue; } const age = k - 1, col = [COL.white, TONE[7], TONE[6], TONE[5], TONE[4]][Math.min(4, age + (q.plus ? 0 : 1))]; if (q.plus && k <= 2) star(g, X, Y, 1, col, COL.white); else bset(g, X, Y, col); }
  return g;
}

// ---------- 중간 파손 (성공 분기) ----------
let CRKD = null;
function crackedSolid() { if (CRKD) return CRKD; const D = dome(0), g = solid(D), [ix, iy] = impactPoint(D); cracksFrom(g, D, Math.round(ix), Math.round(iy), 5, 13, 91); pit(g, Math.round(ix), Math.round(iy), 2.4); return CRKD = g; } // 금 5줄 + 맞은 자리 파임: 파손 마지막 장면 = 녹아내림 첫 장면
function hitFlash() { const D = dome(0), g = solid(D); recolor(g, (c) => snapPal(mix(c, COL.pale, 0.72))); const [ix, iy] = impactPoint(D); star(g, Math.round(ix), Math.round(iy), 4, COL.white, COL.white); return g; }
function chipsAt(g, D, k, n) { const R = rnd(4242), [ix, iy] = impactPoint(D); for (let i = 0; i < n; i++) { const a = Math.PI + 0.15 + 1.2 * (i / Math.max(1, n - 1)) + (R() - 0.5) * 0.2, sp = 1.5 + 1.7 * R(), sz = i % 3 === 0 ? 2 : 1, c = [COL.pale, TONE[7], TONE[6]][i % 3], X = ix + Math.cos(a) * (sp * k + 3), Y = iy + Math.sin(a) * (sp * k + 3) + 0.5 * 0.4 * k * k; for (let a2 = 0; a2 < sz; a2++) for (let b2 = 0; b2 < sz; b2++) { const x = Math.round(X) + a2, y = Math.round(Y) + b2; if (x >= LIM.x0 && y >= LIM.y0 && y <= D.bb) bset(g, x, y, c); } } }
function midBreak(k) { // k = 1 (금 3줄·조각 6) / 2 (금 5줄·조각 9)
  const D = dome(0), [ix, iy] = impactPoint(D); let g; if (k === 1) { g = solid(D); cracksFrom(g, D, Math.round(ix), Math.round(iy), 3, 6, 91); pit(g, Math.round(ix), Math.round(iy), 1.6); star(g, Math.round(ix), Math.round(iy), 2, COL.pale, COL.white); } else g = Uint8Array.from(crackedSolid());
  chipsAt(g, D, k, k === 1 ? 6 : 9); return g;
}

// ---------- 녹아내림 (성공 분기): 위에서부터 내려앉으며 각진 도트 방울이 떨어지고 바닥에 고였다가 증발 ----------
const DROPS = { dia: [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]], tri: [[0, 0], [1, 0], [0, 1]], tri2: [[0, 0], [-1, 0], [0, 1]], bar: [[0, 0], [0, 1]], zig: [[0, 0], [0, 1], [1, 1]], zag: [[0, 0], [0, 1], [-1, 1]], big: [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [0, 2]], big2: [[0, 0], [1, 0], [2, 0], [1, 1], [2, 1], [2, 2]] }; // 각진 조각들: 삼각·계단·마름모
let MELT = null;
function meltAll(n = 12) {
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
    for (let k = 0; k < (m > 0 && m < n - 3 ? (m < 6 ? 9 : 3) : 0) && movers.length; k++) { const bx = movers[Math.floor(R() * movers.length)], ks = ['big', 'big2', 'dia', 'tri', 'tri2', 'zig', 'zag', 'big', 'big2']; drops.push({ x: bx, y: Math.ceil(cut[bx]) + 1, vy: 0.6 + R() * 0.5, shape: ks[Math.floor(R() * ks.length)], c: [COL.pale, TONE[7], TONE[6], TONE[7]][Math.floor(R() * 4)] }); }
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
  const cx = Math.round((hx + 32) / 2), cy = Math.round((top + 32) / 2) - 6, rx = 10, ry = 2.6, out = [], OFF = [0, 100, 215].map(a => a * Math.PI / 180);
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
module.exports = { FW, FH, BW, BH, OB, LIM, TONE, COL, G, bset, bget, has, bover, toImage, mix, recolor, count, dome, solid, held, create, expand, burstFlash, shatter, hitFlash, midBreak, meltAll, starFrames, makeShards, clipped: () => CLIPPED, clippedShards: () => CLIPS, clippedParticles: () => CLIPP, impactPoint };
