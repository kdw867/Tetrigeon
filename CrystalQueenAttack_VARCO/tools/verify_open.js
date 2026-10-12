// 양팔 벌리기 자세 검증 (작업 폴더 전용): 저장된 셀을 다시 읽어 해상도(도트 격자)·팔레트·보존 영역·팔 잔여를 검사
const path = require('path');
const p = require('../../PauseUI_VARCO/tools/pix.js');
const { PAL } = require('./snapq.js');
const VER = process.env.VER || 'v1', D = path.join(__dirname, '..', 'output', 'OpenArms_' + VER + '_cells'), names = ['1_rest', '2_mid', '3_final'];
const IDLE = 'C:/Users/MBC-501-15/Documents/Tetrigeon/Tetrigeon/Assets/@Resources/Enemies/CrystalQueenIdle/T_CrystalQueen_Idle.png';
const base = p.crop(p.decode(IDLE), 0, 0, 160, 160), cells = names.map(n => p.decode(path.join(D, 'CrystalQueen_OpenArms_' + n + '.png')));
const PALS = new Set(PAL.map(c => c.join(',')));
const same = (a, b, o) => a.d[o] === b.d[o] && a.d[o + 1] === b.d[o + 1] && a.d[o + 2] === b.d[o + 2] && a.d[o + 3] === b.d[o + 3];
const inArm = (x, y) => (x >= 48 && x <= 82 && y >= 82 && y <= 126) || (x >= 84 && x <= 116 && y >= 84 && y <= 126); // 팔 영역 상자
const runs = (im, x0, y0, x1, y1) => { const h = {}; for (let y = y0; y <= y1; y++) { let r = 0; for (let x = x0; x <= x1 + 1; x++) { const a = x <= x1 && im.d[(y * 160 + x) * 4 + 3] && (r === 0 || same(im, im, 0) && im.d.compare(im.d, (y * 160 + x) * 4, (y * 160 + x) * 4 + 3, (y * 160 + x - 1) * 4, (y * 160 + x - 1) * 4 + 3) === 0); if (a) r++; else { if (r) h[r] = (h[r] || 0) + 1; r = (x <= x1 && im.d[(y * 160 + x) * 4 + 3]) ? 1 : 0; } } } return h; };
const top = (h) => Object.entries(h).sort((a, b) => b[1] - a[1]).slice(0, 6).map(e => e.join(':')).join(' ');
let bad = 0;
cells.forEach((c, f) => {
  let n = 0, part = 0, off = 0, outsideDiff = 0, inDiff = 0, x0 = 999, x1 = -1, y0 = 999, y1 = -1;
  for (let y = 0; y < 160; y++) for (let x = 0; x < 160; x++) { const o = (y * 160 + x) * 4, a = c.d[o + 3]; if (a) { n++; if (a !== 255) part++; if (!PALS.has(c.d[o] + ',' + c.d[o + 1] + ',' + c.d[o + 2])) off++; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } if (!same(c, base, o)) { if (inArm(x, y)) inDiff++; else outsideDiff++; } }
  const A = (x, y) => x < 0 || y < 0 || x >= 160 || y >= 160 ? 0 : c.d[(y * 160 + x) * 4 + 3], seen = new Uint8Array(25600); let comps = 0;
  for (let y = 0; y < 160; y++) for (let x = 0; x < 160; x++) { if (!A(x, y) || seen[y * 160 + x]) continue; comps++; const st = [[x, y]]; seen[y * 160 + x] = 1; while (st.length) { const [a, b] = st.pop(); for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = a + dx, Y = b + dy; if (A(X, Y) && !seen[Y * 160 + X]) { seen[Y * 160 + X] = 1; st.push([X, Y]); } } } }
  // 얼굴·눈·왕관·가슴 코어 영역이 원본과 같은지
  let faceDiff = 0, coreDiff = 0; for (let y = 56; y <= 82; y++) for (let x = 70; x <= 90; x++) if (!same(c, base, (y * 160 + x) * 4)) faceDiff++; for (let y = 86; y <= 90; y++) for (let x = 76; x <= 81; x++) if (!same(c, base, (y * 160 + x) * 4)) coreDiff++;
  let ub = 0, tb = 0, ubA = 0, tbA = 0; // 2x2 단색 블록 비율 (블록 위상 (1,1)): 전체 / 팔 영역
  for (let j = 0; j < 79; j++) for (let i = 0; i < 79; i++) { const x = 2 * i + 1, y = 2 * j + 1, o = (y * 160 + x) * 4, ops = [0, 4, 640, 644].map(d => c.d[o + d + 3]).filter(Boolean).length; if (!ops) continue; const u = [4, 640, 644].every(d => c.d[o + d] === c.d[o] && c.d[o + d + 1] === c.d[o + 1] && c.d[o + d + 2] === c.d[o + 2] && c.d[o + d + 3] === c.d[o + 3]); tb++; if (u) ub++; if (inArm(x, y)) { tbA++; if (u) ubA++; } }
  const pb = []; for (let y = 84; y <= 92; y++) for (let x = 74; x <= 82; x++) { const o = (y * 160 + x) * 4; if (c.d[o + 3] && c.d[o] === 188 && c.d[o + 1] === 199 && c.d[o + 2] === 245) pb.push(x + ',' + y); }
  if (part || off || comps !== 1 || y1 !== 147 || outsideDiff || faceDiff || coreDiff) bad++;
  console.log(`${names[f]} | dots ${n} 부분알파 ${part} 팔레트밖 ${off} 덩어리 ${comps} 발바닥 ${y1} 여백 L${x0} R${159 - x1} | 팔 영역 밖 원본과 다른 도트 ${outsideDiff} | 팔 영역 안 달라진 도트 ${inDiff} | 얼굴·왕관 영역 차이 ${faceDiff} 코어 영역 차이 ${coreDiff} (코어 연청 ${pb.length}도트) | 2x2 단색 블록 전체 ${(ub / tb * 100).toFixed(1)}% 팔 영역 ${(ubA / tbA * 100).toFixed(1)}% | 가로 같은 색 런 길이(팔 영역) ${top(runs(c, 50, 84, 114, 124))}`);
});
console.log(`원본 팔 영역 런 길이 ${top(runs(base, 50, 84, 114, 124))}`);
console.log(`기본 자세 vs 원본 Idle 01 바이트 차이 ${(() => { let d = 0; for (let i = 0; i < base.d.length; i++) if (base.d[i] !== cells[0].d[i]) d++; return d; })()} | 위반 자세 수 ${bad}`);
if (bad) process.exit(1);
