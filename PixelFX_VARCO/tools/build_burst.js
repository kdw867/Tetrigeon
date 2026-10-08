// 색별 수정 파괴 확정 프레임 만들기: 팔레트(수정 색 단계)로 색 정리 → 파편 4개의 중심으로 프레임 중심 정렬 → 27x27 칸 8프레임(마지막은 빈 프레임)
// 사용: node build_burst.js <I|J|L|O|S|T|Z>
const { p, R, hex, put, get, blit, solid, up } = require('./lib_fx');
const T = process.argv[2], S = 27, mid = 13;
const PAL = { // 어두운 외곽선 → 어두움 → 중간 → 밝음 → 옅음, 흰색, (보조색)
  I: ['#0b3a46', '#349199', '#1fd6dc', '#7cf1f1', '#f4fbff'],
  J: ['#101a5c', '#1c2f8f', '#3d65e4', '#849ffc', '#c9d6ff', '#f4fbff'],
  L: ['#4a1a04', '#8a2a05', '#dd7f26', '#fdae5a', '#ffe27a', '#fff3c4', '#f4fbff'],
  O: ['#4a3a03', '#b48305', '#f8e22d', '#fbf473', '#fffbc2', '#f4fbff'],
  S: ['#07460b', '#0f7a14', '#3dd63a', '#94ed67', '#d4ffb8', '#f4fbff'],
  T: ['#2d1752', '#5a3194', '#7a45b8', '#b57be8', '#d9bdf7', '#f4ecff', '#e040c8', '#f58be6'],
  Z: ['#4a0505', '#8a0a0a', '#fa3938', '#fd8283', '#ff9a3c', '#ffd45a', '#fff0dc', '#f4fbff'],
}[T].map(hex);
const raw = JSON.parse(require('fs').readFileSync(`${R}/work/burst_raw_${T}.json`, 'utf8')).map(o => ({ w: o.w, h: o.h, cx: o.cx, cy: o.cy, d: Buffer.from(o.d, 'base64') }));
function snap(f) { // 가장 가까운 팔레트 색으로 (가중 RGB 거리)
  const o = p.blank(f.w, f.h);
  for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) { const c = get(f, x, y); if (!c[3]) continue; let b = PAL[0], bd = 1e18; for (const q of PAL) { const d = (c[0] - q[0]) ** 2 * 0.3 + (c[1] - q[1]) ** 2 * 0.59 + (c[2] - q[2]) ** 2 * 0.11; if (d < bd) { bd = d; b = q; } } put(o, x, y, b); }
  return o;
}
function comps(f) { // 연결 영역(8방향)의 개수·중심
  const seen = new Uint8Array(f.w * f.h), out = [];
  for (let i = 0; i < f.w * f.h; i++) { if (seen[i] || !f.d[i * 4 + 3]) continue; const st = [i]; seen[i] = 1; let n = 0, sx = 0, sy = 0;
    while (st.length) { const j = st.pop(), x = j % f.w, y = (j / f.w) | 0; n++; sx += x; sy += y; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= f.w || Y >= f.h) continue; const k = Y * f.w + X; if (!seen[k] && f.d[k * 4 + 3]) { seen[k] = 1; st.push(k); } } }
    out.push({ n, cx: sx / n, cy: sy / n }); }
  return out;
}
// 프레임 중심: 가장 큰 연결 영역 4개(파편)의 중심 평균. 4개가 안 되면 모든 픽셀의 중심
function center(f) { const c = comps(f).sort((a, b) => b.n - a.n); if (c.length >= 4 && c[3].n >= 4) { const q = c.slice(0, 4); return [Math.round(q.reduce((s, v) => s + v.cx, 0) / 4), Math.round(q.reduce((s, v) => s + v.cy, 0) / 4)]; } let sx = 0, sy = 0, n = 0; for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) if (f.d[(y * f.w + x) * 4 + 3]) { sx += x; sy += y; n++; } return n ? [Math.round(sx / n), Math.round(sy / n)] : [Math.round(f.w / 2), Math.round(f.h / 2)]; }
const order = [0, 1, 2, 3, 4, 5, 6]; // 1~7번 칸 (8번은 거의 빈 칸이라 빈 프레임으로 대체)
const frames = []; let minX = 99, maxX = -99, minY = 99, maxY = -99, clipped = 0;
for (const i of order) {
  const f = snap(raw[i]), [cx, cy] = center(f), o = p.blank(S, S);
  // 칸 밖으로 나가는 조각이 있으면 잘라내지 않고 그 조각(연결 영역) 전체를 뺌
  const lab = new Int32Array(f.w * f.h).fill(-1), bad = new Set(); let nl = 0;
  for (let q = 0; q < f.w * f.h; q++) { if (lab[q] >= 0 || !f.d[q * 4 + 3]) continue; const st = [q]; lab[q] = nl; let out = false; while (st.length) { const j = st.pop(), x = j % f.w, y = (j / f.w) | 0; const X = x - cx + mid, Y = y - cy + mid; if (X < 0 || Y < 0 || X >= S || Y >= S) out = true; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X2 = x + dx, Y2 = y + dy; if (X2 < 0 || Y2 < 0 || X2 >= f.w || Y2 >= f.h) continue; const k = Y2 * f.w + X2; if (lab[k] < 0 && f.d[k * 4 + 3]) { lab[k] = nl; st.push(k); } } } if (out) bad.add(nl); nl++; }
  for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) { const c = get(f, x, y); if (!c[3]) continue; if (bad.has(lab[y * f.w + x])) { clipped++; continue; } const X = x - cx + mid, Y = y - cy + mid; if (X < 0 || Y < 0 || X >= S || Y >= S) { clipped++; continue; } put(o, X, Y, c.slice(0, 3)); minX = Math.min(minX, X - mid); maxX = Math.max(maxX, X - mid); minY = Math.min(minY, Y - mid); maxY = Math.max(maxY, Y - mid); }
  frames.push(o);
}
frames.push(p.blank(S, S));
const sheet = p.blank(S * frames.length, S); frames.forEach((f, k) => { for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const c = get(f, x, y); if (c[3]) put(sheet, k * S + x, y, c.slice(0, 3)); } });
p.encode(sheet, `${R}/sheets/FX_CrystalBurst_${T}.png`);
require('fs').writeFileSync(`${R}/work/burst_frames_${T}.json`, JSON.stringify(frames.map(o => ({ w: o.w, h: o.h, d: o.d.toString('base64') }))));
console.log(`${T}: 범위 x ${minX}~${maxX} y ${minY}~${maxY}, 칸 밖으로 나가 잘린 픽셀 ${clipped}개`);
