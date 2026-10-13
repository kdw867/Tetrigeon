// 여왕이 타겟(▼)일 때 증식 연출 확인용: 두 시점을 오려 x3 으로 나란히 저장 (작업 폴더 전용)
const path = require('path'), p = require('../../PauseUI_VARCO/tools/pix.js');
const SCR = 'C:/Users/MBC-501-15/AppData/Local/Temp/claude/C--Users-MBC-501-15-Documents-Tetrigeon/1c733b5f-5eba-4df7-aeda-bb7d619f695f/scratchpad/', OUT = path.join(__dirname, '..', 'output');
const tiles = ['050', '063'].map(t => p.nearestUp(p.crop(p.decode(SCR + 'unity_skill_targeted_t' + t + '.png'), 1640, 0, 240, 150), 3));
const o = p.blank(tiles[0].w * 2 + 6, tiles[0].h); o.d.fill(12); for (let i = 0; i < o.w * o.h; i++) o.d[i * 4 + 3] = 255;
tiles.forEach((t, i) => { for (let y = 0; y < t.h; y++) t.d.copy(o.d, (y * o.w + i * (t.w + 6)) * 4, y * t.w * 4, (y + 1) * t.w * 4); });
p.encode(o, path.join(OUT, 'CrystalQueen_Skill_UnityPlayCheck_stage10_targeted_x3.png')); console.log(o.w + 'x' + o.h);
