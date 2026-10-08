// Unity가 실제로 그린 카운트다운 프레임(work/unity_frames/b_###.png)과 합성 미리보기를 같은 시간끼리 비교하고, 실제 프레임으로 GIF를 만든다 (작업 폴더 전용)
const fs = require('fs'), path = require('path');
const R = path.join(__dirname, '..');
const L = require(path.join(R, '..', 'PixelFX_VARCO', 'tools', 'lib_fx.js')), p = L.p;
const C = require('./compose_countdown.js');
const frames = []; let worst = 0, sum = 0, n = 0, bad = 0, badFrames = 0, perFrameMax = [];
for (let k = 0; k < 105; k++) {
  const u = p.decode(path.join(R, 'work', 'unity_frames', `b_${String(k).padStart(3, '0')}.png`));
  // Unity 캡처는 RGB(알파 없음) → 불투명 처리, 위아래 뒤집힘 없음(ReadPixels는 아래 기준이지만 PNG 저장 시 위가 위로 저장됨)
  const f = p.blank(u.w, u.h); u.d.copy(f.d); for (let i = 0; i < u.w * u.h; i++) f.d[i * 4 + 3] = 255; frames.push(f);
  const c = C.render(C.P.lead + k * 0.02, C.BOARD); let fm = 0, fb = 0;
  for (let i = 0; i < u.w * u.h; i++) { const o = i * 4, d = Math.max(Math.abs(u.d[o] - c.d[o]), Math.abs(u.d[o + 1] - c.d[o + 1]), Math.abs(u.d[o + 2] - c.d[o + 2])); worst = Math.max(worst, d); fm = Math.max(fm, d); sum += d; n++; if (d > 40) { bad++; fb++; } }
  if (fb) badFrames++; perFrameMax.push(fm);
}
console.log(`Unity 실제 프레임 105장 vs 합성: 크기 ${frames[0].w}x${frames[0].h}, 평균 색 차이 ${(sum / n).toFixed(3)}, 최대 ${worst}, 40 넘게 다른 픽셀 ${bad}개 (${(bad / n * 100).toFixed(4)}%), 그런 픽셀이 있는 프레임 ${badFrames}장`);
L.writeGif(path.join(R, 'output', 'Countdown_Unity_actual_board.gif'), frames, 20, { diff: true });
console.log('GIF', (fs.statSync(path.join(R, 'output', 'Countdown_Unity_actual_board.gif')).size / 1024).toFixed(0) + 'KB');
const worstIdx = perFrameMax.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]).slice(0, 5); console.log('프레임별 최대 차이 상위', worstIdx.map(([v, i]) => `#${i}:${v}`).join(' '));
