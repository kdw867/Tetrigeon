// Unity 재생 확인 시트 (작업 폴더 전용): Unity 카메라 렌더 캡처(1920x1080) 에서 수호자 둘레를 같은 크기로 잘라 번호를 붙여 한 장으로 만든다. 사용: node unity_playcheck_sheet.js <캡처 폴더> <접두사(F|S)> <출력 이름>
const fs = require('fs'), path = require('path');
const p = require('../../PauseUI_VARCO/tools/pix.js'), L = require('../../CrystalQueenRotLock_VARCO/tools/lib_view.js');
const [dir, prefix, outName] = process.argv.slice(2), files = fs.readdirSync(dir).filter(n => n.startsWith(prefix) && n.endsWith('.png')).sort();
const X0 = 1300, Y0 = 0, W = 480, H = 290; // 미리보기 합성(게임 화면 x1)과 같은 자르기 영역 [1300,0,480,290] (발 기준점 화면 (1574,259))
const tiles = files.map(f => p.crop(p.decode(path.join(dir, f)), X0, Y0, W, H));
const g = L.grid(tiles, 4, 8, files.map((f, i) => String(i)));
const out = path.join(__dirname, '..', 'output', 'Frames_v1', outName); p.encode(g, out); console.log(out, g.w + 'x' + g.h, files.length + '장', 'crop', X0, Y0);
