// B안 실제 게임 화면 확대 확인 (작업 폴더 전용 임시)
const path = require('path'), L = require('./lib_view.js'), { p, F } = L;
const scr = L.SCR(), ids = ['T07', 'T09', 'T11', 'T13'];
const tiles = ids.map(id => p.nearestUp(p.crop(L.onScreen(scr, L.bodyCell(id), F.buildFx(id)), 1640, 0, 240, 150), 4));
p.encode(L.grid(tiles, 2, 8, ids.map(s => +s.slice(1))), path.join(L.OUT, 'probe_B_game_x4.png'));
