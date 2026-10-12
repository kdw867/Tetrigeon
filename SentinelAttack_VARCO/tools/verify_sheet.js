// 저장된 시트를 다시 읽어 프레임별 검사 (작업 폴더 전용): 알파, 팔레트, 연결 덩어리, 안쪽 구멍, 여백, 겉 테두리의 밝은 점, 돌 색 분포(원본 대비), 시작·끝 일치
const p = require('../../PauseUI_VARCO/tools/pix.js');
const { ORIG, PAL } = require('./snap2.js');
const file = process.argv[2] || 'output/T_AmethystSentinel_Attack_v3.png';
const sheet = p.decode(file), CW = 144, CH = 104, COLS = sheet.w / CW, ROWS = sheet.h / CH, N = COLS * ROWS, PALS = new Set(PAL.map(c => c.join(',')));
const orig = p.crop(p.decode('C:/Users/MBC-501-15/Documents/Tetrigeon/Tetrigeon/Assets/@Resources/Enemies/AmethystSentinelIdle/T_AmethystSentinel_Idle.png'), 0, 0, 96, 96);
const cls = (r, g, b) => g > 140 && b > 180 && r < 150 && g > r + 60 ? 'cy' : (b - g > 55 && r > 40 && b > 90 ? 'pu' : 'st');
// 원본 돌 부류 색 분포 (팔레트 색별 비율)
const share = (cell, w, h, x0, y0) => { const m = new Map(); let n = 0; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const o = ((y + y0) * cell.w + x + x0) * 4; if (!cell.d[o + 3] || cls(cell.d[o], cell.d[o + 1], cell.d[o + 2]) !== 'st') continue; n++; const k = cell.d[o] + ',' + cell.d[o + 1] + ',' + cell.d[o + 2]; m.set(k, (m.get(k) || 0) + 1); } return { m, n }; };
const so = share(orig, 96, 96, 0, 0);
const lightRim = (r, g, b) => (Math.max(r, g, b) - Math.min(r, g, b) < 45 && r + g + b > 380) || (r > 200 && g > 140 && b > 220);
let bad = 0; const rows = [];
for (let f = 0; f < N; f++) {
  const c = p.crop(sheet, (f % COLS) * CW, Math.floor(f / COLS) * CH, CW, CH), A = (x, y) => x < 0 || y < 0 || x >= CW || y >= CH ? 0 : c.d[(y * CW + x) * 4 + 3];
  let n = 0, part = 0, off = 0, pu = 0, cy = 0, x0 = 999, x1 = -1, y0 = 999, y1 = -1, rim = 0, rimLight = 0;
  for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) { const o = (y * CW + x) * 4, a = c.d[o + 3]; if (!a) continue; n++; if (a !== 255) part++; if (!PALS.has(c.d[o] + ',' + c.d[o + 1] + ',' + c.d[o + 2])) off++; const k = cls(c.d[o], c.d[o + 1], c.d[o + 2]); if (k === 'pu') pu++; if (k === 'cy') cy++; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
    if (!A(x - 1, y) || !A(x + 1, y) || !A(x, y - 1) || !A(x, y + 1)) { rim++; if (lightRim(c.d[o], c.d[o + 1], c.d[o + 2])) rimLight++; } }
  const seen = new Uint8Array(CW * CH); let comps = 0;
  for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) { if (!A(x, y) || seen[y * CW + x]) continue; comps++; const st = [[x, y]]; seen[y * CW + x] = 1; while (st.length) { const [a, b] = st.pop(); for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = a + dx, Y = b + dy; if (A(X, Y) && !seen[Y * CW + X]) { seen[Y * CW + X] = 1; st.push([X, Y]); } } } }
  const o2 = new Uint8Array(CW * CH), st = []; for (let x = 0; x < CW; x++) st.push([x, 0], [x, CH - 1]); for (let y = 0; y < CH; y++) st.push([0, y], [CW - 1, y]);
  while (st.length) { const [x, y] = st.pop(); if (x < 0 || y < 0 || x >= CW || y >= CH || o2[y * CW + x] || A(x, y)) continue; o2[y * CW + x] = 1; st.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]); }
  let holes = 0; for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) if (!A(x, y) && !o2[y * CW + x]) holes++;
  // 돌 색 분포 차이: 원본 대비 팔레트 색별 비율 차의 최댓값(%p)
  const sf = share(c, CW, CH, 0, 0); let maxd = 0; for (const k of new Set([...so.m.keys(), ...sf.m.keys()])) maxd = Math.max(maxd, Math.abs((sf.m.get(k) || 0) / sf.n - (so.m.get(k) || 0) / so.n) * 100);
  const isOrig = f === 0 || f === N - 1;
  if (part || off || comps !== 1 || y1 !== 94 || x0 < 1 || y0 < 1 || x1 > CW - 2 || (!isOrig && rimLight > 0)) bad++;
  rows.push(`${String(f + 1).padStart(2)} | dots ${n} | 보라 ${pu} | 청록 ${cy} | 부분알파 ${part} | 팔레트밖 ${off} | 덩어리 ${comps} | 안쪽구멍 ${holes} | 여백 L${x0} R${CW - 1 - x1} T${y0} | 발바닥줄 ${y1} | 겉 ${rim}개 중 밝은 점 ${rimLight} | 돌 색 분포 최대 차 ${maxd.toFixed(1)}%p`);
}
console.log(rows.join('\n'));
const c1 = p.crop(sheet, 0, 0, CW, CH), cN = p.crop(sheet, ((N - 1) % COLS) * CW, Math.floor((N - 1) / COLS) * CH, CW, CH); let d = 0, dN = 0;
for (let y = 0; y < 96; y++) for (let x = 0; x < 96; x++) for (let k = 0; k < 4; k++) if (orig.d[(y * 96 + x) * 4 + k] !== c1.d[((y + 8) * CW + x + 24) * 4 + k]) d++;
for (let k = 0; k < c1.d.length; k++) if (c1.d[k] !== cN.d[k]) dN++;
console.log(`프레임1 vs 원본 Idle01 바이트 차이 ${d} | 프레임1 vs 프레임${N} 바이트 차이 ${dN} | 위반 프레임 수 ${bad}`);
if (d || dN || bad) process.exit(1);
