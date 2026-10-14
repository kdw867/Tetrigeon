// Unity 플레이 모드 렌더 확인 시트 (작업 폴더 전용): execute_code 로 저장한 게임 화면 크롭(보스 자리 320x310)을 ×2 로 모아 번호를 붙인다.
const path = require('path'), L = require('./lib_view.js'), { p, OUT } = L;
const dir = 'C:/Users/MBC-501-15/AppData/Local/Temp/claude/C--Users-MBC-501-15-Documents-Tetrigeon/1c733b5f-5eba-4df7-aeda-bb7d619f695f/scratchpad/', ids = ['T05', 'T07', 'T09', 'T11', 'T12', 'T13'];
const tiles = ids.map(id => p.nearestUp(p.decode(dir + 'unity_rotlock_' + id + '.png'), 2));
const f = path.join(OUT, 'CrystalQueenRotLock_UnityPlayCheck_stage10_6scenes_x2.png'); p.encode(L.grid(tiles, 3, 8, ids.map(s => +s.slice(1))), f); console.log(path.basename(f));
