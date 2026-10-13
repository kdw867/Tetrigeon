// Unity 플레이 모드에서 렌더한 게임 화면(스테이지 10 여왕 증식 연출)을 오려 확인용 이미지로 만든다 (작업 폴더 전용, 읽기 전용 입력)
const fs = require('fs'), path = require('path');
const p = require('../../PauseUI_VARCO/tools/pix.js');
const SCR = 'C:/Users/MBC-501-15/AppData/Local/Temp/claude/C--Users-MBC-501-15-Documents-Tetrigeon/1c733b5f-5eba-4df7-aeda-bb7d619f695f/scratchpad/', OUT = path.join(__dirname, '..', 'output');
const TIMES = ['000', '023', '034', '050', '060', '063', '069', '075', '089'], TIGHT = [1600, 0, 320, 310];
const tiles = TIMES.map(t => p.crop(p.decode(SCR + 'unity_skill_t' + t + '.png'), ...TIGHT));
const DIG = ['111101101101111', '010110010010111', '111001111100111', '111001111001111', '101101111001001', '111100111001111', '111100111101111', '111001001001001', '111101111101111', '111101111001111'];
const label = (o, x, y, text, k) => { [...String(text)].forEach((ch, n) => { const g = DIG[+ch]; for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) if (g[j * 3 + i] === '1') for (let dy = 0; dy < k; dy++) for (let dx = 0; dx < k; dx++) { const q = ((y + j * k + dy) * o.w + x + (n * 4 + i) * k + dx) * 4; o.d[q] = 255; o.d[q + 1] = 255; o.d[q + 2] = 255; o.d[q + 3] = 255; } }); };
function grid(list, cols, k, name) {
  const ups = list.map(t => p.nearestUp(t, k)), tw = ups[0].w, th = ups[0].h, rows = Math.ceil(ups.length / cols), o = p.blank(cols * tw + (cols - 1) * 6, rows * th + (rows - 1) * 6); o.d.fill(12);
  for (let i = 0; i < o.w * o.h; i++) o.d[i * 4 + 3] = 255;
  ups.forEach((t, i) => { const ox = (i % cols) * (tw + 6), oy = Math.floor(i / cols) * (th + 6); for (let y = 0; y < th; y++) t.d.copy(o.d, ((oy + y) * o.w + ox) * 4, y * t.w * 4, (y + 1) * t.w * 4); label(o, ox + 6, oy + 6, TIMES[list === tiles ? i : i] , 2); });
  const f = path.join(OUT, name); p.encode(o, f); console.log(path.basename(f), o.w + 'x' + o.h);
}
grid(tiles, 3, 1, 'CrystalQueen_Skill_UnityPlayCheck_stage10_all_x1.png'); // 9개 시점 (표시 숫자 = 시각 x100 초)
const pick = [2, 3, 5, 7].map(i => tiles[i]); // 0.34 / 0.50 / 0.63 / 0.75
const o = pick.map(t => p.nearestUp(t, 2)); const W = o[0].w * 2 + 6, H = o[0].h * 2 + 6, g = p.blank(W, H); g.d.fill(12); for (let i = 0; i < W * H; i++) g.d[i * 4 + 3] = 255;
o.forEach((t, i) => { const ox = (i % 2) * (t.w + 6), oy = Math.floor(i / 2) * (t.h + 6); for (let y = 0; y < t.h; y++) t.d.copy(g.d, ((oy + y) * W + ox) * 4, y * t.w * 4, (y + 1) * t.w * 4); });
p.encode(g, path.join(OUT, 'CrystalQueen_Skill_UnityPlayCheck_stage10_4scenes_x2.png')); console.log('4scenes_x2', W + 'x' + H);
