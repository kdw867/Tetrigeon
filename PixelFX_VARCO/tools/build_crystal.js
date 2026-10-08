// 수정 칸 파괴 이펙트 확정 프레임 만들기: VARCO 시트에서 뽑은 프레임(1,2,3,5,6,7,8번; 4번은 파편이 8개라 제외) + 마지막 빈 프레임
// 색은 게임 팔레트(청록 5단·보라 6단)로 정리, 프레임마다 중심을 맞춰 같은 크기 칸에 배치
const { p, R, C, hex, put, get, solid, up } = require('./lib_fx');
const raw = JSON.parse(require('fs').readFileSync(`${R}/work/crystal_raw_frames.json`, 'utf8')).map(o => ({ w: o.w, h: o.h, cx: o.cx, cy: o.cy, d: Buffer.from(o.d, 'base64') }));
const PURPLE = ['#2d1752', '#5a3194', '#7a45b8', '#b57be8', '#d9bdf7', '#f4ecff'], CYAN = ['#1d6f82', '#2a8ea0', '#3ec0d6', '#8cecf4', '#f4fbff'];
const lum = (c) => c[0] * 0.3 + c[1] * 0.59 + c[2] * 0.11;
const nearestByLum = (list, L) => { let b = list[0], bd = 1e9; for (const h of list) { const d = Math.abs(lum(hex(h)) - L); if (d < bd) { bd = d; b = h; } } return b; };
function snap(f) { // 청록 계열과 보라 계열로 나눠 밝기에 맞는 팔레트 색으로 교체
  const o = p.blank(f.w, f.h);
  for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) {
    const c = get(f, x, y); if (!c[3]) continue; const L = lum(c);
    const cyanish = c[1] > c[0] + 25 && c[2] > c[0] + 25 && c[1] >= c[2] - 40 && c[0] < 190; const white = c[0] > 215 && c[1] > 225 && c[2] > 225;
    if (white) put(o, x, y, C.white); else if (cyanish) put(o, x, y, nearestByLum(CYAN, L)); else put(o, x, y, nearestByLum(PURPLE, L));
  }
  return o;
}
// 중심: 이펙트가 네 방향 대칭이라 보이는 픽셀 전체의 경계 상자 가운데를 프레임 중심으로 삼음 (프레임 간 흔들림 방지)
function center(f) { let a = 1e9, c = -1, d = 1e9, e = -1; for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) if (get(f, x, y)[3]) { a = Math.min(a, x); c = Math.max(c, x); d = Math.min(d, y); e = Math.max(e, y); } return [Math.round((a + c) / 2), Math.round((d + e) / 2)]; }
const order = [0, 1, 2, 4, 5, 6, 7]; // 1,2,3,5,6,7,8번 칸
const S = +(process.argv[2] || 30), mid = Math.floor(S / 2);
let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9; const frames = [];
for (const i of order) {
  const f = snap(raw[i]), [cx, cy] = center(f), o = p.blank(S, S);
  for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) { const c = get(f, x, y); if (!c[3]) continue; const X = x - cx + mid, Y = y - cy + mid; if (X < 0 || Y < 0 || X >= S || Y >= S) { console.log('잘림 경고: 프레임', i + 1, X, Y); continue; } put(o, X, Y, c.slice(0, 3)); minX = Math.min(minX, X - mid); maxX = Math.max(maxX, X - mid); minY = Math.min(minY, Y - mid); maxY = Math.max(maxY, Y - mid); }
  frames.push(o); console.log('프레임', i + 1, '범위 x', minX, '~', maxX, ' y', minY, '~', maxY); minX = 1e9; maxX = -1e9; minY = 1e9; maxY = -1e9;
}
frames.push(p.blank(S, S)); // 마지막 빈 프레임: 재생이 끝나면 잔상이 남지 않음
console.log('칸', S + 'x' + S, '| 중심 기준 범위 x', minX, '~', maxX, ' y', minY, '~', maxY);
const sheet = p.blank(S * frames.length, S); frames.forEach((f, k) => { for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const c = get(f, x, y); if (c[3]) put(sheet, k * S + x, y, c.slice(0, 3)); } });
p.encode(sheet, `${R}/sheets/FX_CrystalBurst_sheet.png`);
require('fs').writeFileSync(`${R}/work/crystal_frames.json`, JSON.stringify(frames.map(o => ({ w: o.w, h: o.h, d: o.d.toString('base64') }))));
const chk = p.blank(sheet.w * 5, S * 5 + 0); const bg = solid(sheet.w * 5, S * 5, '#0e1726'); const u = up(sheet, 5); const { blit } = require('./lib_fx'); blit(bg, u, 0, 0, 1); p.encode(bg, `${R}/work/crystal_check.png`);
