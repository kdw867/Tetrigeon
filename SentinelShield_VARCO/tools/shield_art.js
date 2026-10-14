// 센티넬 보호막 아트 (작업 폴더 전용, Unity와 무관): 웅크린 센티넬 실루엣을 감싸는 보라색 수정 돔. 본체와 별도 두 층 = 면(fill, 수정 면) + 테두리(rim, 얇은 룬 테두리).
// 센티넬 도트 밀도에 맞춰 2x2 블록(텍스처 2px) 격자로 그린다. 농도는 아트를 바꾸지 않고 층별 알파로만 조절(충전 진행도 p: 0~1).
const fs = require('fs'), path = require('path');
const p = require('../../PauseUI_VARCO/tools/pix.js');
const CW = 144, CH = 104, BWID = CW / 2, BHEI = CH / 2; // 블록 격자 72x52
const hex = (s) => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
const TONE = ['#3C1668', '#531990', '#6D1AAD', '#851FCA', '#9C2FDB', '#B547E8', '#D374F2', '#EBA5F9'].map(hex); // 센티넬 수정 팔레트(어두움 → 밝음)
// 실루엣에서 돔 크기 결정: 몸 실루엣의 가로 범위·맨 위, 여백 (좌우 mx 블록, 위 mt 블록), 바닥 = 발 줄 블록
function fit(cell, mx = 3, mt = 4) {
  let x0 = 999, x1 = -1, y0 = 999; for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) if (cell.d[(y * CW + x) * 4 + 3]) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); }
  const bl = Math.floor(x0 / 2) - mx, br = Math.floor(x1 / 2) + mx, bt = Math.floor(y0 / 2) - mt, bb = 47; // 블록 좌표 (bb = 발 줄 94~95)
  return { bl, br, bt, bb, cx: (bl + br) / 2, w: br - bl + 1, h: bb - bt + 1 };
}
// 돔 외곽(수정 돔: 모서리를 깎은 다각형). 블록 좌표 점들 (시계 방향)
function outline(f) { // 초타원(지수 2.6) 돔 + 평평한 바닥: 모서리가 둥글고 위가 약간 뾰족한 보석 돔
  const { cx, bb } = f, rx = f.w / 2, ry = f.h, n = 2.6, pts = [[f.bl, bb]];
  const N = 16; for (let k = 0; k <= N; k++) { const th = Math.PI * (1 - k / N), c = Math.cos(th), sn = Math.sin(th); pts.push([cx + rx * Math.sign(c) * Math.pow(Math.abs(c), 2 / n), bb + 1 - ry * Math.pow(Math.abs(sn), 2 / n)]); }
  pts.push([f.br, bb]); return pts;
}
const inPoly = (pt, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if (((yi > pt[1]) !== (yj > pt[1])) && (pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi) + xi)) c = !c; } return c; };
const segDist = (pt, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], t = Math.max(0, Math.min(1, ((pt[0] - a[0]) * dx + (pt[1] - a[1]) * dy) / (dx * dx + dy * dy || 1))); return Math.hypot(pt[0] - a[0] - t * dx, pt[1] - a[1] - t * dy); };
const edgeDist = (pt, poly) => { let m = 1e9; for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length]; if (a[1] === b[1] && a[1] === poly[0][1] && a[0] !== b[0] && i === poly.length - 1) continue; m = Math.min(m, segDist(pt, a, b)); } return m; };
function rnd(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
// 두 층 생성. 반환: { fill, rim } (둘 다 144x104 RGBA, 알파 0/255), 돔 정보
function build(cell, mx, mt) { // mx·mt: 좌우·위 여백(블록), 생략하면 기본 3·4 (폭발 "부풀기" 프레임은 더 크게)
  const f = fit(cell, mx, mt), poly = outline(f), R = rnd(20261014), seeds = [];
  // 면 시드: 돔 안쪽에 지터가 있는 격자 (가로 5 x 세로 4), 수정 면처럼 불규칙한 다각형 면이 됨
  const rx = f.w / 2, ry = f.h, mk = (rf, th) => [f.cx + rx * rf * Math.cos(th), f.bb + 1 - ry * rf * Math.sin(th)];
  for (let k = 0; k < 9; k++) seeds.push(mk(0.80, Math.PI * (k + 0.5) / 9 + (R() - 0.5) * 0.08)); // 바깥 고리 9
  for (let k = 0; k < 5; k++) seeds.push(mk(0.42, Math.PI * (k + 0.5) / 5 + (R() - 0.5) * 0.10)); // 안쪽 고리 5
  seeds.push(mk(0.05, Math.PI / 2)); seeds.push(mk(0.62, 0.12), mk(0.62, Math.PI - 0.12)); // 가운데·아래 양옆
  // 시드별 색: 빛은 왼쪽 위에서 → 왼쪽·위 면이 밝고 오른쪽·아래 면이 어두움. 한 면만 가장 밝은 하이라이트 면
  const tone = seeds.map(([sx, sy]) => { const lx = (sx - f.cx) / (f.w / 2), ly = (sy - (f.bt + f.h / 2)) / (f.h / 2), l = 0.5 - 0.30 * lx - 0.30 * ly + (R() - 0.5) * 0.25; return Math.max(1, Math.min(5, Math.round(1 + l * 4.2))); });
  const hi = seeds.reduce((b, s, i) => (s[0] + s[1] * 1.2 < seeds[b][0] + seeds[b][1] * 1.2 ? i : b), 0); tone[hi] = 6; // 맨 왼쪽 위 면 = 연보라 하이라이트
  const fill = p.blank(CW, CH), rim = p.blank(CW, CH);
  const put = (img, bx, by, c) => { for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) { const X = bx * 2 + x, Y = by * 2 + y; if (X < 0 || Y < 0 || X >= CW || Y >= CH) continue; const o = (Y * CW + X) * 4; img.d[o] = c[0]; img.d[o + 1] = c[1]; img.d[o + 2] = c[2]; img.d[o + 3] = 255; } };
  const near = (x, y) => { let b = 0, bd = 1e9, b2 = 0, d2 = 1e9; seeds.forEach(([sx, sy], i) => { const d = Math.hypot(x - sx, y - sy); if (d < bd) { b2 = b; d2 = bd; b = i; bd = d; } else if (d < d2) { b2 = i; d2 = d; } }); return [b, b2, d2 - bd]; };
  const inside = (x, y) => inPoly([x + 0.5, y + 0.5], poly) || (y >= poly[0][1] - 0 && x >= f.bl && x <= f.br && y <= f.bb && inPoly([x + 0.5, Math.min(y, poly[1][1]) + 0.5], poly));
  for (let by = 0; by < BHEI; by++) for (let bx = 0; bx < BWID; bx++) {
    if (!inside(bx, by)) continue; const d = edgeDist([bx + 0.5, by + 0.5], poly), [i, , gap] = near(bx, by);
    if (d < 1.0) continue; // 가장자리 한 겹은 테두리 층 몫
    let t = tone[i]; if (gap < 0.9) t = Math.min(7, t + 2); // 면과 면 사이 모서리선은 두 단계 밝게 (수정 면 모서리)
    put(fill, bx, by, TONE[t]);
  }
  // 테두리: 외곽 한 겹(위·왼쪽은 밝게, 아래·오른쪽은 어둡게) + 안쪽 점선(룬 테두리) + 작은 눈금 3개
  const mid = [f.cx, f.bt + f.h / 2];
  for (let by = 0; by < BHEI; by++) for (let bx = 0; bx < BWID; bx++) {
    if (by === f.bb && bx >= f.bl && bx <= f.br) { put(rim, bx, by, TONE[5]); continue; } // 바닥 선 (가로 전체)
    if (!inside(bx, by)) continue; const pt = [bx + 0.5, by + 0.5], d = edgeDist(pt, poly);
    if (d < 1.0) { const lit = (pt[0] - mid[0]) / (f.w / 2) * -0.6 + (pt[1] - mid[1]) / (f.h / 2) * -0.4 > 0.05; put(rim, bx, by, lit ? TONE[7] : TONE[4]); continue; }
    if (d >= 3.0 && d < 4.0) { const ang = Math.atan2(pt[1] - mid[1], pt[0] - mid[0]), seg = Math.floor(((ang + Math.PI) / (2 * Math.PI)) * 44); if (seg % 2 === 0 && by < f.bb - 1) put(rim, bx, by, TONE[6]); }
  }
  return { fill, rim, info: f, poly };
}
// 층별 알파 합성 (충전 진행도 p: 0~1). 반환: 합성 이미지(불투명 바탕 위)
const A_FILL = (pr) => 0.20 + 0.80 * pr, A_RIM = (pr) => 0.60 + 0.40 * pr;
function blend(dst, layer, alpha) { for (let i = 0; i < dst.w * dst.h; i++) { const a = layer.d[i * 4 + 3] / 255 * alpha; if (!a) continue; for (let c = 0; c < 3; c++) dst.d[i * 4 + c] = Math.round(dst.d[i * 4 + c] * (1 - a) + layer.d[i * 4 + c] * a); dst.d[i * 4 + 3] = 255; } }
module.exports = { build, fit, outline, A_FILL, A_RIM, blend, CW, CH };
if (require.main === module) {
  const W = path.join(__dirname, '..', 'work'), cell = p.decode(path.join(W, process.argv[2] || 'cell_hold_clean_hold_3.png')), s = build(cell);
  p.encode(s.fill, path.join(W, 'shield_fill.png')); p.encode(s.rim, path.join(W, 'shield_rim.png')); console.log('돔', JSON.stringify(s.info), '외곽', JSON.stringify(s.poly));
}
