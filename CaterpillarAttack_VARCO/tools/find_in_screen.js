// 이전에 캡처한 게임 화면(FHD)에서 Idle 애벌레의 위치를 찾음: 2배 확대한 Idle 10프레임을 화면 영역에 대고 가장 잘 맞는 위치를 계산 (작업 폴더 전용)
const path = require('path');
const L = require('./lib_cat.js');
const scr = L.p.decode('C:/Users/MBC-501-15/Documents/Tetrigeon/CountdownUI_VARCO/work/game_screen_empty_board.png');
console.log('screen', scr.w, scr.h);
// 확대 확인용 저장
L.p.encode(L.p.crop(scr, 1480, 170, 240, 120), path.join(L.R, 'work', 'screen_enemy_region.png'));
const sx0 = 1500, sy0 = 110, sw = 100, sh = 110; // 탐색 영역
let best = { score: 1e18 };
for (let fi = 0; fi < 10; fi++) {
  const cell = L.loadIdle(fi); // 64x64
  // 불투명 픽셀만 비교 (2배 확대 → 128x128)
  for (let oy = sy0; oy < sy0 + sh; oy++) for (let ox = sx0; ox < sx0 + sw; ox++) {
    let sum = 0, n = 0;
    for (let y = 24; y < 54; y += 2) for (let x = 6; x < 52; x += 2) {
      const i = (y * 64 + x) * 4; if (!cell.d[i + 3]) continue;
      const px = ox + x * 2, py = oy + y * 2, j = (py * scr.w + px) * 4;
      sum += Math.abs(cell.d[i] - scr.d[j]) + Math.abs(cell.d[i + 1] - scr.d[j + 1]) + Math.abs(cell.d[i + 2] - scr.d[j + 2]); n++;
    }
    const score = sum / n; if (score < best.score) best = { score, fi, ox, oy };
  }
}
console.log('best match (cell origin in screen px, 2x):', JSON.stringify(best));
