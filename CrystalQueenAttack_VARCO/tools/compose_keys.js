// 핵심 자세 4장 저장 + 나란히 비교 이미지 (작업 폴더 전용). 기본 자세는 원본 Idle 01 을 그대로 쓴다.
const fs = require('fs'), path = require('path');
const p = require('../../PauseUI_VARCO/tools/pix.js');
const R = path.join(__dirname, '..'), OUT = path.join(R, 'output'), CELLS = path.join(OUT, 'KeyPoses_v1_cells'), SRC = path.join(OUT, 'varco_sources');
fs.mkdirSync(CELLS, { recursive: true }); fs.mkdirSync(SRC, { recursive: true });
const IDLE = 'C:/Users/MBC-501-15/Documents/Tetrigeon/Tetrigeon/Assets/@Resources/Enemies/CrystalQueenIdle/T_CrystalQueen_Idle.png';
const KEYS = [['1_rest', null, '기본(원본 Idle 01)'], ['2_windup', 'work/snapcqd_windup_1.png', '준비'], ['3_strike', 'work/snapcqd_strike_4.png', '타격'], ['4_recoil', 'work/snapcqd_recoil_2.png', '반동']];
const cells = KEYS.map(([n, f]) => f ? p.decode(path.join(R, f)) : p.crop(p.decode(IDLE), 0, 0, 160, 160));
KEYS.forEach(([n], i) => p.encode(cells[i], path.join(CELLS, 'CrystalQueen_Key_' + n + '.png')));
// VARCO 원본(가공 전) 보존
for (const [from, to] of [['work/round2/windup_1.png', 'windup_r2_1.png'], ['work/round3/strike_4.png', 'strike_r3_4.png'], ['work/round3/recoil_2.png', 'recoil_r3_2.png'], ['work/guide_windup.png', 'guide_windup.png'], ['work/guide_strike.png', 'guide_strike.png'], ['work/guide_recoil.png', 'guide_recoil.png']]) fs.copyFileSync(path.join(R, from), path.join(SRC, to));
const CX0 = 30, CY0 = 20, CW = 130, CH = 131, BG = [40, 46, 60];
const A = (c, x, y) => (x < 0 || y < 0 || x >= 160 || y >= 160) ? 0 : c.d[(y * 160 + x) * 4 + 3];
function sheet(k, overlay, gap) {
  const W = CW * k * 4 + gap * 3, o = p.blank(W, CH * k); for (let i = 0; i < W * CH * k; i++) { o.d[i * 4] = BG[0]; o.d[i * 4 + 1] = BG[1]; o.d[i * 4 + 2] = BG[2]; o.d[i * 4 + 3] = 255; }
  cells.forEach((c, i) => {
    const ox = i * (CW * k + gap);
    for (let y = 0; y < CH * k; y++) for (let x = 0; x < CW * k; x++) { const sx = CX0 + (x / k | 0), sy = CY0 + (y / k | 0), si = (sy * 160 + sx) * 4; if (c.d[si + 3]) c.d.copy(o.d, (y * o.w + ox + x) * 4, si, si + 4); }
    if (overlay && i > 0) { const r = cells[0]; for (let y = CY0; y < CY0 + CH; y++) for (let x = CX0; x < CX0 + CW; x++) { if (!A(r, x, y) || (A(r, x - 1, y) && A(r, x + 1, y) && A(r, x, y - 1) && A(r, x, y + 1))) continue; const px = ox + (x - CX0) * k + (k >> 1) - 1, py = (y - CY0) * k + (k >> 1) - 1; for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) { const q = ((py + dy) * o.w + px + dx) * 4; o.d[q] = 255; o.d[q + 1] = 216; o.d[q + 2] = 74; o.d[q + 3] = 255; } } }
  });
  return o;
}
p.encode(sheet(4, false, 8), path.join(OUT, 'CrystalQueen_Attack_KeyPoses_v1_4poses_x4.png'));
p.encode(sheet(4, true, 8), path.join(OUT, 'CrystalQueen_Attack_KeyPoses_v1_4poses_overlay_x4.png'));
p.encode(sheet(2, false, 4), path.join(OUT, 'CrystalQueen_Attack_KeyPoses_v1_actual-size_x2.png'));
console.log('saved key poses', KEYS.map(k => k[0]).join(' '));
