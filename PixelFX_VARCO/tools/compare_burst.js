// 7색 수정 파괴 시트를 한 장에 (행 = 종류 순서 I J L O S T Z, 열 = 프레임 8장), 정수 배율
const { p, R, blit, solid, up } = require('./lib_fx');
const board = require('../../StageBoardUI_VARCO/tools/lib_board.js');
const k = +(process.argv[2] || 3), out = process.argv[3] || `${R}/work/burst7_compare.png`;
const TYPES = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'], NAME = { I: 'I  CYAN  PIERCE', J: 'J  BLUE  FREEZE', L: 'L  ORANGE  CRITICAL', O: 'O  YELLOW  SHIELD', S: 'S  GREEN  HEAL', T: 'T  PURPLE  POISON', Z: 'Z  RED  EXPLOSION' };
const font = board.loadFont(`${R}/../RewardUI_VARCO/font/PixelFont.json`, `${R}/../RewardUI_VARCO/font/PixelFont_cream.png`);
const rowH = 27 * k + 30, W = 8 * 27 * k + 20, o = solid(W, TYPES.length * rowH + 10, '#0d1828');
TYPES.forEach((T, i) => { const s = p.decode(`${R}/sheets/FX_CrystalBurst_${T}.png`); board.drawText(o, font, NAME[T], 10, i * rowH + 8, 2, 'l'); blit(o, up(s, k), 10, i * rowH + 28, 1); });
p.encode(o, out); console.log(o.w + 'x' + o.h);
