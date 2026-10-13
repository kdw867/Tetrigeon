// 게임 UI 금색 룬에서 금색 후보를 뽑는다 (읽기 전용)
const p = require('../../PauseUI_VARCO/tools/pix.js');
const img = p.decode('C:/Users/MBC-501-15/Documents/Tetrigeon/Tetrigeon/Assets/@Resources/UI/HpBars/Layers/T_SkillRune_Gold.png');
const m = new Map(); for (let i = 0; i < img.w * img.h; i++) { if (img.d[i * 4 + 3] < 255) continue; const k = [img.d[i * 4], img.d[i * 4 + 1], img.d[i * 4 + 2]].join(','); m.set(k, (m.get(k) || 0) + 1); }
console.log(img.w + 'x' + img.h, [...m].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, n]) => k + ' x' + n).join(' | '));
