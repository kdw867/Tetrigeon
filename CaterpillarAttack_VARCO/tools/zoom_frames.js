// 동작표에서 고른 프레임을 크게 확대해 이음매 검사 (작업 폴더 전용)
const path = require('path');
const L = require('./lib_cat.js');
const { frames } = require('./build_attack.js');
const pick = (process.argv[3] || '4,6,7').split(',').map(n => frames[+n - 1]);
const g = L.grid(pick, +(process.argv[4] || 12), pick.length > 2 ? 2 : pick.length, [226, 226, 232], [0, 22, 54, 33], { x: [8, 49], y: [52] });
L.p.encode(g, path.join(L.R, 'work', 'zoom_' + process.argv[2] + '.png'));
console.log('saved', g.w + 'x' + g.h);
