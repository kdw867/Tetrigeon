// 캡처 일부를 잘라 정수배로 키움 (확인용): node zoom.js 입력 출력 x y w h 배율
const p = require('../../PauseUI_VARCO/tools/pix.js');
const [, , inp, out, x, y, w, h, k] = process.argv;
p.encode(p.nearestUp(p.crop(p.decode(inp), +x, +y, +w, +h), +k), out);
