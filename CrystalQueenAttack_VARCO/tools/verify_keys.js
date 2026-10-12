// 저장된 핵심 자세 셀을 다시 읽어 검사 (작업 폴더 전용): 알파, 팔레트, 덩어리, 안쪽 구멍, 여백, 발바닥 줄, 발밑 겹침, 겉 밝은 점, 눈, 원본 일치
const fs = require('fs'), path = require('path');
const p = require('../../PauseUI_VARCO/tools/pix.js');
const { PAL } = require('./snapq.js');
const D = path.join(__dirname, '..', 'output', 'KeyPoses_v1_cells'), names = ['1_rest', '2_windup', '3_strike', '4_recoil'];
const PALS = new Set(PAL.map(c => c.join(',')));
const cls = (r, g, b) => g > 140 && b > 180 && r < 150 && g > r + 60 ? 'cy' : (b - g > 55 && r > 40 && b > 90 ? 'pu' : 'st');
const lightRim = (r, g, b) => (Math.max(r, g, b) - Math.min(r, g, b) < 45 && r + g + b > 380) || (r > 200 && g > 140 && b > 220);
const cells = names.map(n => p.decode(path.join(D, 'CrystalQueen_Key_' + n + '.png')));
let bad = 0;
cells.forEach((c, f) => {
  const A = (x, y) => x < 0 || y < 0 || x >= 160 || y >= 160 ? 0 : c.d[(y * 160 + x) * 4 + 3];
  let n = 0, part = 0, off = 0, pu = 0, cy = 0, x0 = 999, x1 = -1, y0 = 999, y1 = -1, rim = 0, rl = 0, ex = 0, ey = 0;
  for (let y = 0; y < 160; y++) for (let x = 0; x < 160; x++) { const o = (y * 160 + x) * 4, a = c.d[o + 3]; if (!a) continue; n++; if (a !== 255) part++; if (!PALS.has(c.d[o] + ',' + c.d[o + 1] + ',' + c.d[o + 2])) off++; const k = cls(c.d[o], c.d[o + 1], c.d[o + 2]); if (k === 'pu') pu++; if (k === 'cy') { cy++; ex += x; ey += y; } x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); if (!A(x - 1, y) || !A(x + 1, y) || !A(x, y - 1) || !A(x, y + 1)) { rim++; if (lightRim(c.d[o], c.d[o + 1], c.d[o + 2])) rl++; } }
  const seen = new Uint8Array(25600); let comps = 0; for (let y = 0; y < 160; y++) for (let x = 0; x < 160; x++) { if (!A(x, y) || seen[y * 160 + x]) continue; comps++; const st = [[x, y]]; seen[y * 160 + x] = 1; while (st.length) { const [a, b] = st.pop(); for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = a + dx, Y = b + dy; if (A(X, Y) && !seen[Y * 160 + X]) { seen[Y * 160 + X] = 1; st.push([X, Y]); } } } }
  const out = new Uint8Array(25600), st = []; for (let x = 0; x < 160; x++) st.push([x, 0], [x, 159]); for (let y = 0; y < 160; y++) st.push([0, y], [159, y]);
  while (st.length) { const [x, y] = st.pop(); if (x < 0 || y < 0 || x >= 160 || y >= 160 || out[y * 160 + x] || A(x, y)) continue; out[y * 160 + x] = 1; st.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]); }
  let holes = 0; for (let y = 0; y < 160; y++) for (let x = 0; x < 160; x++) if (!A(x, y) && !out[y * 160 + x]) holes++;
  // 발밑 겹침: 아래 10줄(Y 138~147)이 기본 자세와 같은 도트인 비율
  let same = 0, tot = 0; for (let y = 138; y <= 147; y++) for (let x = 0; x < 160; x++) { const a = cells[0].d[(y * 160 + x) * 4 + 3] ? 1 : 0, b = A(x, y) ? 1 : 0; if (a || b) { tot++; if (a && b) same++; } }
  if (part || off || comps !== 1 || y1 !== 147 || x0 < 1 || y0 < 1 || x1 > 158 || (f > 0 && rl > 0) || cy !== 8 && f > 0 && cy < 5) bad++;
  console.log(`${names[f]} | dots ${n} | 보라 ${pu} | 청록 ${cy} (눈 중심 ${(ex / cy).toFixed(1)},${(ey / cy).toFixed(1)}) | 부분알파 ${part} | 팔레트밖 ${off} | 덩어리 ${comps} | 안쪽구멍 ${holes} | 여백 L${x0} R${159 - x1} T${y0} B${159 - y1} | 발바닥줄 ${y1} | 발밑 10줄 겹침 ${(same / tot * 100).toFixed(1)}% | 겉 ${rim}개 중 밝은 점 ${rl}`);
});
const o = p.crop(p.decode('C:/Users/MBC-501-15/Documents/Tetrigeon/Tetrigeon/Assets/@Resources/Enemies/CrystalQueenIdle/T_CrystalQueen_Idle.png'), 0, 0, 160, 160); let d = 0; for (let k = 0; k < o.d.length; k++) if (o.d[k] !== cells[0].d[k]) d++;
console.log(`기본 자세 vs 원본 Idle 01 바이트 차이 ${d} | 위반 셀 수 ${bad}`);
