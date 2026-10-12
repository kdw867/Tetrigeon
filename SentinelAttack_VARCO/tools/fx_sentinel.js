// 센티넬 공격 이펙트 2종을 코드로 그림 (작업 폴더 전용, Unity와 무관): 기 모으기(3단계 x 6프레임 루프), 터짐(8프레임)
// 팔레트는 센티넬의 청록(코어)·보라(수정) 계열만, 흰색은 중심 1~2도트에만 사용. 알파 0/255.
const fs = require('fs'), path = require('path');
const p = require('../../PauseUI_VARCO/tools/pix.js');
const R = path.join(__dirname, '..'), OUT = path.join(R, 'output', 'fx');
fs.mkdirSync(OUT, { recursive: true });
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const C = { white: '#F4FBFF', c1: '#6DF7FB', c2: '#31E6EF', c3: '#1BCAD7', p1: '#EBA5F9', p2: '#D374F2', p3: '#B547E8', p4: '#9C2FDB', p5: '#6D1AAD', p6: '#3C1668' };
function put(img, x, y, col) { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= img.w || y >= img.h) return; const c = hex(col), o = (y * img.w + x) * 4; img.d[o] = c[0]; img.d[o + 1] = c[1]; img.d[o + 2] = c[2]; img.d[o + 3] = 255; }
function disc(img, cx, cy, r, col) { const R2 = r * r; for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) if ((x - cx) ** 2 + (y - cy) ** 2 <= R2) put(img, x, y, col); }
function ring(img, cx, cy, r, th, col, skip) { const a = (r - th) ** 2, b = r * r; let k = 0; for (let y = Math.floor(cy - r) - 1; y <= Math.ceil(cy + r) + 1; y++) for (let x = Math.floor(cx - r) - 1; x <= Math.ceil(cx + r) + 1; x++) { const d = (x - cx) ** 2 + (y - cy) ** 2; if (d > a && d <= b) { k++; if (skip && (x + y) % skip === 0) continue; put(img, x, y, col); } } }
function line(img, x0, y0, x1, y1, col) { x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1); const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let err = dx + dy; for (;;) { put(img, x0, y0, col); if (x0 === x1 && y0 === y1) break; const e2 = 2 * err; if (e2 >= dy) { err += dy; x0 += sx; } if (e2 <= dx) { err += dx; y0 += sy; } } }
function diamond(img, cx, cy, s, col, center) { for (let dy = -s; dy <= s; dy++) for (let dx = -s; dx <= s; dx++) if (Math.abs(dx) + Math.abs(dy) <= s) put(img, cx + dx, cy + dy, col); if (center) put(img, cx, cy, center); }
const TAU = Math.PI * 2;

// ---------- 기 모으기: 3단계(약/중/강) x 6프레임 루프, 56x56, 중심 (27.5,27.5) = 팔 끝 ----------
function chargeFrame(stage, f) {
  const S = 56, img = p.blank(S, S), cx = 27.5, cy = 27.5, ph = f / 6;
  const R0 = [3, 5, 7][stage], pulse = [0, 0.5, 1, 0.5, 0, -0.5][f], r = R0 + pulse;
  // 안쪽으로 모이는 입자 (바깥에서 중심으로, 약한 소용돌이)
  const N = [6, 8, 10][stage];
  for (let i = 0; i < N; i++) {
    const t = (ph + i / N) % 1, rad = 22 - 18 * t, ang = TAU * i / N + 1.2 * t + stage * 0.3;
    const x = cx + Math.cos(ang) * rad, y = cy + Math.sin(ang) * rad, col = [C.p1, C.c1, C.p2][i % 3];
    const tx = cx + Math.cos(ang - 0.25) * (rad + 3), ty = cy + Math.sin(ang - 0.25) * (rad + 3); // 한 칸 뒤 꼬리
    if (rad > 7) put(img, tx, ty, C.p4);
    if (rad > 12) { put(img, x, y, col); put(img, x + 1, y, col); put(img, x, y + 1, col); put(img, x + 1, y + 1, col); } else put(img, x, y, col);
  }
  // 줄어드는 점선 고리 (2단계부터)
  if (stage >= 1) ring(img, cx, cy, 19 - 13 * ph, 1, stage === 1 ? C.p4 : C.p2, 2);
  // 빛나는 구: 바깥부터 안쪽으로 색 겹침 (보라 후광 → 청록 → 밝은 청록 → 흰 점)
  if (stage >= 1) ring(img, cx, cy, r + 2.2, 1.2, C.p4, 2);
  disc(img, cx, cy, r, C.c3); disc(img, cx, cy, r - 1.5, C.c2); if (r - 3 >= 1) disc(img, cx, cy, r - 3, C.c1);
  if (r >= 4) disc(img, cx, cy, 1.2, C.white);
  // 3단계: 결정 파편이 구 주위를 돌고, 대각선 불꽃이 번갈아 튐
  if (stage === 2) {
    for (let k = 0; k < 4; k++) { const a = TAU * (k / 4 + f / 24), x = cx + Math.cos(a) * 13, y = cy + Math.sin(a) * 13; diamond(img, Math.round(x), Math.round(y), 2, C.p3, C.p1); }
    const L = f % 2 ? 9 : 6; for (const [dx, dy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) line(img, cx + dx * (r + 1), cy + dy * (r + 1), cx + dx * (r + L), cy + dy * (r + L), C.c1);
  }
  return img;
}

// ---------- 터짐: 8프레임, 72x72, 중심 (36,36) = 충격 지점 ----------
function burstFrame(f) {
  const S = 72, img = p.blank(S, S), cx = 35.5, cy = 35.5;
  const spikes = (len, th, colMain, colEdge, diagLen) => { // 십자 + 대각 별빛
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) for (let t = 0; t <= len; t++) { const w = Math.max(0, Math.round(th * (1 - t / len))); for (let o = -w; o <= w; o++) { const x = cx + dx * t + (dy ? o : 0), y = cy + dy * t + (dx ? o : 0); put(img, x, y, Math.abs(o) === w && w > 0 ? colEdge : colMain); } }
    if (diagLen) for (const [dx, dy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) line(img, cx + dx * 2, cy + dy * 2, cx + dx * diagLen, cy + dy * diagLen, colEdge);
  };
  const shards = (n, rad, s, col, cen, off = 0) => { for (let k = 0; k < n; k++) { const a = TAU * (k / n) + off; diamond(img, Math.round(cx + Math.cos(a) * rad), Math.round(cy + Math.sin(a) * rad), s, col, cen); } };
  const sparks = (n, rad, col, off = 0, twin) => { for (let k = 0; k < n; k++) { const a = TAU * (k / n) + off, x = cx + Math.cos(a) * rad, y = cy + Math.sin(a) * rad; put(img, x, y, col); if (twin) put(img, x + 1, y, col); } };
  if (f === 0) { spikes(12, 2, C.white, C.c1, 7); disc(img, cx, cy, 5, C.c2); disc(img, cx, cy, 4, C.c1); disc(img, cx, cy, 2, C.white); }
  if (f === 1) { spikes(18, 2, C.c1, C.c2, 10); ring(img, cx, cy, 9, 2, C.c1); disc(img, cx, cy, 6, C.c2); disc(img, cx, cy, 4, C.c1); disc(img, cx, cy, 1.5, C.white); shards(8, 11, 1, C.p2, C.p1, 0.2); }
  if (f === 2) { ring(img, cx, cy, 15, 2, C.c2); ring(img, cx, cy, 11, 1, C.p3, 2); shards(8, 17, 2, C.p3, C.p1, 0.2); sparks(8, 21, C.c1, 0.5); disc(img, cx, cy, 3, C.c1); disc(img, cx, cy, 1.5, C.white); }
  if (f === 3) { ring(img, cx, cy, 21, 2, C.p4, 3); shards(8, 24, 2, C.p3, C.p2, 0.2); sparks(12, 27, C.p1, 0.1, true); disc(img, cx, cy, 2, C.c2); }
  if (f === 4) { ring(img, cx, cy, 27, 1, C.p5, 2); shards(8, 30, 1, C.p4, C.p2, 0.2); sparks(12, 31, C.p2, 0.4); }
  if (f === 5) { shards(6, 32, 1, C.p5, null, 0.3); sparks(12, 33, C.p4, 0.2); }
  if (f === 6) { sparks(8, 34, C.p5, 0.5); sparks(6, 30, C.p6, 0.1); }
  // f === 7: 빈 프레임
  return img;
}

function sheet(frames, cols, S) { const rows = Math.ceil(frames.length / cols), o = p.blank(cols * S, rows * (S)); frames.forEach((fr, i) => { const ox = (i % cols) * S, oy = Math.floor(i / cols) * S; for (let y = 0; y < S; y++) fr.d.copy(o.d, ((oy + y) * o.w + ox) * 4, y * S * 4, (y + 1) * S * 4); }); return o; }
const charge = []; for (let s = 0; s < 3; s++) for (let f = 0; f < 6; f++) charge.push(chargeFrame(s, f));
const burst = Array.from({ length: 8 }, (_, f) => burstFrame(f));
module.exports = { chargeFrame, burstFrame, charge, burst };
if (require.main === module) {
  p.encode(sheet(charge, 6, 56), path.join(OUT, 'FX_SentinelCharge_sheet.png'));
  p.encode(sheet(burst, 8, 72), path.join(OUT, 'FX_SentinelBurst_sheet.png'));
  // 확대 미리보기 (검은 바탕 대신 어두운 청회색): 기 모으기 3단계 한 줄, 터짐 한 줄
  const bg = [26, 32, 46], up = (img, k) => { const o = p.blank(img.w * k, img.h * k); for (let i = 0; i < o.w * o.h; i++) { o.d[i * 4] = bg[0]; o.d[i * 4 + 1] = bg[1]; o.d[i * 4 + 2] = bg[2]; o.d[i * 4 + 3] = 255; } for (let y = 0; y < o.h; y++) for (let x = 0; x < o.w; x++) { const s = (Math.floor(y / k) * img.w + Math.floor(x / k)) * 4; if (img.d[s + 3]) img.d.copy(o.d, (y * o.w + x) * 4, s, s + 4); } return o; };
  p.encode(up(sheet(charge, 6, 56), 5), path.join(OUT, 'FX_SentinelCharge_preview_x5.png'));
  p.encode(up(sheet(burst, 8, 72), 3), path.join(OUT, 'FX_SentinelBurst_preview_x3.png'));
  let colors = new Set(); [...charge, ...burst].forEach(im => { for (let i = 0; i < im.w * im.h; i++) if (im.d[i * 4 + 3]) colors.add(im.d.readUInt32BE(i * 4)); }); console.log('saved FX sheets, colors', colors.size);
}
