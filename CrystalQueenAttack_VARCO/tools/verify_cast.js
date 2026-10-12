// 시전 장면 검증 (작업 폴더 전용): 저장된 캐릭터·이펙트 셀을 다시 읽어 격자(2x2 블록)·팔레트·보존 영역·이펙트 범위를 검사
const fs = require('fs'), path = require('path');
const p = require('../../PauseUI_VARCO/tools/pix.js');
const { PAL } = require('./snapq.js'), FX = require('./fx_cast.js');
const OUT = path.join(__dirname, '..', 'output'), VER = process.env.VER || 'v2', CD = path.join(OUT, 'CastScenes_' + VER + '_cells'), FD = path.join(OUT, 'CastScenes_' + VER + '_fx');
const IDLE = 'C:/Users/MBC-501-15/Documents/Tetrigeon/Tetrigeon/Assets/@Resources/Enemies/CrystalQueenIdle/T_CrystalQueen_Idle.png';
const base = p.crop(p.decode(IDLE), 0, 0, 160, 160), keys = ['1_clasp', '2_spark', '3_spawn', '4_reach', '5_fire'];
const PALS = new Set(PAL.map(c => c.join(','))), FXS = new Set(Object.values(FX.PAL).map(c => c.join(',')));
const px = (im, x, y) => { const o = (y * 160 + x) * 4; return [im.d[o], im.d[o + 1], im.d[o + 2], im.d[o + 3]].join(','); };
const inBox = (x, y) => x >= 36 && x <= 116 && y >= 82 && y <= 126; // 팔 영역(두 자세의 팔이 닿는 범위)
// 2x2 블록(위상 (1,1)) 단색 비율, 같은 색 가로 런 길이 분포 (영역 안만)
function grid(im, test) { let tb = 0, ub = 0; const runs = {}; for (let j = 0; j < 79; j++) for (let i = 0; i < 79; i++) { const x = 2 * i + 1, y = 2 * j + 1; if (!test(x, y)) continue; const c = [px(im, x, y), px(im, x + 1, y), px(im, x, y + 1), px(im, x + 1, y + 1)]; if (c.every(s => s.endsWith(',0'))) continue; tb++; if (c.every(s => s === c[0])) ub++; }
  for (let y = 0; y < 160; y++) { let r = 0, prev = null; for (let x = 0; x <= 160; x++) { const s = x < 160 && test(x, y) && !px(im, x, y).endsWith(',0') ? px(im, x, y) : null; if (s !== null && s === prev) r++; else { if (prev !== null) runs[r] = (runs[r] || 0) + 1; r = s === null ? 0 : 1; } prev = s; } }
  return { pct: (ub / tb * 100).toFixed(1), runs: Object.entries(runs).sort((a, b) => b[1] - a[1]).slice(0, 5).map(e => e.join(':')).join(' ') }; }
let bad = 0;
console.log('원본 팔 영역', JSON.stringify(grid(base, inBox)));
for (const k of keys) {
  const c = p.decode(path.join(CD, 'CrystalQueen_Cast_' + k + '_character.png')), f = p.decode(path.join(FD, 'CrystalQueen_Cast_' + k + '_fx.png'));
  let part = 0, off = 0, outDiff = 0, protDiff = 0, coreDiff = 0, y1 = -1, x0 = 999, x1 = -1;
  for (let y = 0; y < 160; y++) for (let x = 0; x < 160; x++) { const o = (y * 160 + x) * 4, a = c.d[o + 3]; if (a) { if (a !== 255) part++; if (!PALS.has(c.d[o] + ',' + c.d[o + 1] + ',' + c.d[o + 2])) off++; y1 = Math.max(y1, y); x0 = Math.min(x0, x); x1 = Math.max(x1, x); } const diff = px(c, x, y) !== px(base, x, y); if (diff && !inBox(x, y)) outDiff++; if (diff && x >= 70 && x <= 90 && y >= 56 && y <= 92) protDiff++; if (diff && x >= 76 && x <= 81 && y >= 86 && y <= 90) coreDiff++; }
  const A = (x, y) => x >= 0 && y >= 0 && x < 160 && y < 160 && c.d[(y * 160 + x) * 4 + 3] > 0, seen = new Uint8Array(25600); let comps = 0;
  for (let y = 0; y < 160; y++) for (let x = 0; x < 160; x++) { if (!A(x, y) || seen[y * 160 + x]) continue; comps++; const st = [[x, y]]; seen[y * 160 + x] = 1; while (st.length) { const [a, b] = st.pop(); for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = a + dx, Y = b + dy; if (A(X, Y) && !seen[Y * 160 + X]) { seen[Y * 160 + X] = 1; st.push([X, Y]); } } } }
  // 이펙트: 알파 0/255, 팔레트, 모든 불투명 픽셀이 위상 (1,1) 의 단색 2x2 블록
  let fxN = 0, fxPart = 0, fxOff = 0, fxBad = 0, edge = 0;
  for (let y = 0; y < 160; y++) for (let x = 0; x < 160; x++) { const o = (y * 160 + x) * 4, a = f.d[o + 3]; if (!a) continue; fxN++; if (a !== 255) fxPart++; if (!FXS.has(f.d[o] + ',' + f.d[o + 1] + ',' + f.d[o + 2])) fxOff++; if (x === 0 || y === 0) edge++; const bx = x - ((x - 1) & 1), by = y - ((y - 1) & 1); if (x >= 1 && y >= 1 && !(px(f, bx, by) === px(f, bx + 1, by) && px(f, bx, by) === px(f, bx, by + 1) && px(f, bx, by) === px(f, bx + 1, by + 1))) fxBad++; }
  const g = grid(c, inBox);
  if (part || off || comps !== 1 || y1 !== 147 || outDiff || protDiff || coreDiff || fxPart || fxOff || fxBad || edge) bad++;
  console.log(`${k} | 캐릭터: 부분알파 ${part} 팔레트밖 ${off} 덩어리 ${comps} 발바닥 ${y1} 좌우끝 ${x0}~${x1} | 팔 영역 밖 차이 ${outDiff} 얼굴·목·코어 보호영역 차이 ${protDiff} 코어 8도트 차이 ${coreDiff} | 팔 영역 2x2 단색 ${g.pct}% 런 ${g.runs} | 이펙트: 도트 ${fxN} 부분알파 ${fxPart} 팔레트밖 ${fxOff} 격자 어긋남 ${fxBad} 가장자리(x/y=0) ${edge}`);
}
console.log('위반 장면 수', bad); if (bad) process.exit(1);
