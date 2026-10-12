// 핵심 장면 레이어 검증 (작업 폴더 전용): 저장된 PNG를 다시 읽어 캐릭터 레이어(알파·팔레트·덩어리·여백·발바닥·밝은 테두리)와 이펙트 레이어(알파·팔레트·경계 여유·캐릭터 비침범 확인)를 검사
const fs = require('fs'), path = require('path');
const p = require('../../PauseUI_VARCO/tools/pix.js');
const { PAL } = require('./snapq.js'), FXP = require('./fx_queen.js').PAL;
const OUT = path.join(__dirname, '..', 'output'), keys = ['1_rest', '2_cross', '3_spawn', '4_fire'];
const PALS = new Set(PAL.map(c => c.join(','))), FXS = new Set(Object.values(FXP).map(c => c.join(',')));
const lightRim = (r, g, b) => (Math.max(r, g, b) - Math.min(r, g, b) < 45 && r + g + b > 380) || (r > 200 && g > 140 && b > 220);
let bad = 0;
for (const k of keys) {
  const c = p.decode(path.join(OUT, 'KeyScenes_v1_cells', `CrystalQueen_Scene_${k}_character.png`)), f = p.decode(path.join(OUT, 'KeyScenes_v1_fx', `CrystalQueen_Scene_${k}_fx.png`));
  const A = (im, x, y) => x < 0 || y < 0 || x >= 160 || y >= 160 ? 0 : im.d[(y * 160 + x) * 4 + 3];
  let n = 0, part = 0, off = 0, x0 = 999, x1 = -1, y0 = 999, y1 = -1, rim = 0, rl = 0;
  for (let y = 0; y < 160; y++) for (let x = 0; x < 160; x++) { const o = (y * 160 + x) * 4, a = c.d[o + 3]; if (!a) continue; n++; if (a !== 255) part++; if (!PALS.has(c.d[o] + ',' + c.d[o + 1] + ',' + c.d[o + 2])) off++; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); if (!A(c, x - 1, y) || !A(c, x + 1, y) || !A(c, x, y - 1) || !A(c, x, y + 1)) { rim++; if (lightRim(c.d[o], c.d[o + 1], c.d[o + 2])) rl++; } }
  const seen = new Uint8Array(25600); let comps = 0; for (let y = 0; y < 160; y++) for (let x = 0; x < 160; x++) { if (!A(c, x, y) || seen[y * 160 + x]) continue; comps++; const st = [[x, y]]; seen[y * 160 + x] = 1; while (st.length) { const [a, b] = st.pop(); for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = a + dx, Y = b + dy; if (A(c, X, Y) && !seen[Y * 160 + X]) { seen[Y * 160 + X] = 1; st.push([X, Y]); } } } }
  let fn = 0, fpart = 0, foff = 0, fx0 = 999, fx1 = -1, fy0 = 999, fy1 = -1, overlap = 0;
  for (let y = 0; y < 160; y++) for (let x = 0; x < 160; x++) { const o = (y * 160 + x) * 4, a = f.d[o + 3]; if (!a) continue; fn++; if (a !== 255) fpart++; if (!FXS.has(f.d[o] + ',' + f.d[o + 1] + ',' + f.d[o + 2])) foff++; fx0 = Math.min(fx0, x); fx1 = Math.max(fx1, x); fy0 = Math.min(fy0, y); fy1 = Math.max(fy1, y); if (A(c, x, y)) overlap++; }
  const isRest = k === '1_rest'; if (part || off || comps !== 1 || y1 !== 147 || x0 < 1 || x1 > 158 || y0 < 1 || (!isRest && rl > 0) || fpart || foff || (fn && (fx0 < 1 || fx1 > 158 || fy0 < 1 || fy1 > 158))) bad++;
  console.log(`${k} | 캐릭터 dots ${n} 부분알파 ${part} 팔레트밖 ${off} 덩어리 ${comps} 여백 L${x0} R${159 - x1} T${y0} 발바닥 ${y1} 밝은 점 ${rl}/${rim} | 이펙트 dots ${fn} 부분알파 ${fpart} 팔레트밖 ${foff} ${fn ? 'X' + fx0 + '-' + fx1 + ' Y' + fy0 + '-' + fy1 : '없음'} 캐릭터와 겹침 ${overlap}`);
}
const base = p.crop(p.decode('C:/Users/MBC-501-15/Documents/Tetrigeon/Tetrigeon/Assets/@Resources/Enemies/CrystalQueenIdle/T_CrystalQueen_Idle.png'), 0, 0, 160, 160), r1 = p.decode(path.join(OUT, 'KeyScenes_v1_cells', 'CrystalQueen_Scene_1_rest_character.png')); let d = 0; for (let i = 0; i < base.d.length; i++) if (base.d[i] !== r1.d[i]) d++;
console.log(`기본 자세 vs 원본 Idle 01 바이트 차이 ${d} | 위반 장면 수 ${bad}`); if (d || bad) process.exit(1);
