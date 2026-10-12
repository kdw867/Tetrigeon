// 지정한 동작표의 10프레임을 5x2 격자 확대 이미지로 저장 (작업 폴더 전용)
const path = require('path');
const L = require('./lib_cat.js');
const { frames } = require('./build_attack.js');
const g = L.grid(frames, 7, 5, [226, 226, 232], [0, 21, 56, 35], { x: [8, 49], y: [52] });
L.p.encode(g, path.join(L.R, 'work', 'attack_' + (process.argv[2] || 'v1') + '_grid_x7.png'));
console.log('saved grid', g.w + 'x' + g.h);
