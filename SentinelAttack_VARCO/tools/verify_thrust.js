// 새 모션 시트 검증 (작업 폴더 전용): 저장한 PNG를 다시 읽어 프레임별 알파·팔레트·덩어리·여백·밝은 테두리·원본 대조
const p = require('../../PauseUI_VARCO/tools/pix.js');
const { palette } = require('./snap.js');
const file = process.argv[2], n = +process.argv[3], CW = 144, CH = 104, cols = 5;
const PALS = new Set(palette().map(c => c.join(',')));
const s = p.decode(file), COLS = s.w / CW;
const cls = (r, g, b) => g > 140 && b > 180 && r < 150 && g > r + 60 ? 'cy' : (b - g > 55 && r > 40 && b > 90 ? 'pu' : 'st');
const lightRim = (r, g, b) => (Math.max(r, g, b) - Math.min(r, g, b) < 45 && r + g + b > 380) || (r > 200 && g > 140 && b > 220);
let bad = 0; const rows = [];
for (let f = 0; f < n; f++) {
  const c = p.crop(s, (f % COLS) * CW, Math.floor(f / COLS) * CH, CW, CH), A = (x, y) => x < 0 || y < 0 || x >= CW || y >= CH ? 0 : c.d[(y * CW + x) * 4 + 3];
  let cnt = 0, part = 0, off = 0, pu = 0, cy = 0, x0 = 999, x1 = -1, y0 = 999, y1 = -1, rl = 0, rim = 0;
  for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) { const o = (y * CW + x) * 4, a = c.d[o + 3]; if (!a) continue; cnt++; if (a !== 255) part++; if (!PALS.has(c.d[o] + ',' + c.d[o + 1] + ',' + c.d[o + 2])) off++; const k = cls(c.d[o], c.d[o + 1], c.d[o + 2]); if (k === 'pu') pu++; if (k === 'cy') cy++; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); if (!A(x - 1, y) || !A(x + 1, y) || !A(x, y - 1) || !A(x, y + 1)) { rim++; if (lightRim(c.d[o], c.d[o + 1], c.d[o + 2])) rl++; } }
  const seen = new Uint8Array(CW * CH); let comps = 0;
  for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) { if (!A(x, y) || seen[y * CW + x]) continue; comps++; const st = [[x, y]]; seen[y * CW + x] = 1; while (st.length) { const [a, b] = st.pop(); for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = a + dx, Y = b + dy; if (A(X, Y) && !seen[Y * CW + X]) { seen[Y * CW + X] = 1; st.push([X, Y]); } } } }
  const isRest = f === 0;
  if (part || off || comps !== 1 || y1 !== 94 || x0 < 1 || y0 < 1 || x1 > CW - 2 || (!isRest && rl > 0)) bad++;
  rows.push(`${String(f + 1).padStart(2)} | dots ${cnt} | 보라 ${pu} | 청록 ${cy} | 부분알파 ${part} | 팔레트밖 ${off} | 덩어리 ${comps} | 여백 L${x0} R${CW - 1 - x1} T${y0} | 발바닥줄 ${y1} | 겉 밝은 점 ${rl}/${rim}`);
}
console.log(rows.join('\n'));
// 프레임 1 = 원본 Idle 01
const orig = p.crop(p.decode('C:/Users/MBC-501-15/Documents/Tetrigeon/Tetrigeon/Assets/@Resources/Enemies/AmethystSentinelIdle/T_AmethystSentinel_Idle.png'), 0, 0, 96, 96), c1 = p.crop(s, 0, 0, CW, CH); let d = 0;
for (let y = 0; y < 96; y++) for (let x = 0; x < 96; x++) for (let k = 0; k < 4; k++) if (orig.d[(y * 96 + x) * 4 + k] !== c1.d[((y + 8) * CW + x + 24) * 4 + k]) d++;
console.log(`프레임1 vs 원본 Idle01 바이트 차이 ${d} | 위반 프레임 수 ${bad}`);
if (d || bad) process.exit(1);
