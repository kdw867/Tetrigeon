// 만든 GIF를 직접 디코딩해 같은 시간의 합성 프레임과 비교 (작업 폴더 전용)
const fs = require('fs'), path = require('path');
const R = path.join(__dirname, '..');
const { decode } = require(path.join(R, '..', 'PixelFX_VARCO', 'tools', 'gif_check.js'));
const C = require('./compose_countdown.js'), p = require(path.join(R, '..', 'PauseUI_VARCO', 'tools', 'pix.js'));
for (const [name, crop, k] of [['Countdown_Preview_board_composite.gif', C.BOARD, 1], ['Countdown_Preview_zoom_x2_composite.gif', C.ZOOM, 2]]) {
  const g = decode(fs.readFileSync(path.join(R, 'output', name))); let worst = 0, sum = 0, n = 0, bad = 0;
  g.frames.forEach((f, i) => { let src = C.render(i / C.P.fps, crop); if (k > 1) src = p.nearestUp(src, k);
    for (let q = 0; q < g.W * g.H; q++) { const o = q * 4, d = Math.max(Math.abs(f.d[o] - src.d[o]), Math.abs(f.d[o + 1] - src.d[o + 1]), Math.abs(f.d[o + 2] - src.d[o + 2])); worst = Math.max(worst, d); sum += d; n++; if (d > 24) bad++; } });
  console.log(`${name}: ${g.W}x${g.H}, ${g.frames.length}프레임, 지연 ${[...new Set(g.frames.map(f => f.delay))].join('/')}ms, 평균 색 차이 ${(sum / n).toFixed(2)}, 최대 ${worst}, 24 넘게 다른 픽셀 ${bad}개 (${(bad / n * 100).toFixed(3)}%)`);
}
