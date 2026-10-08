// 카운트다운 합성 미리보기: 실제 게임 화면(빈 보드) 캡처 위에 숫자 3장을 크기·투명도만 바꿔 얹는다 (Unity 실행 영상 아님, 작업 폴더 전용)
// 사용: node compose_countdown.js   (옵션 환경변수: SEC=0.7 HOLD=0.15 SMAX=1.4 FPS=50)
const fs = require('fs'), path = require('path');
const R = path.join(__dirname, '..');
const L = require(path.join(R, '..', 'PixelFX_VARCO', 'tools', 'lib_fx.js')); // GIF 인코더 재사용
const p = L.p;
const P = { sec: +(process.env.SEC || 0.7), hold: +(process.env.HOLD || 0.15), smax: +(process.env.SMAX || 1.4), fps: +(process.env.FPS || 50), lead: 0.3, tail: 0.5, dot: 2 };
const bg = p.decode(path.join(R, 'work', 'game_screen_empty_board.png'));
const dig = { 3: p.decode(path.join(R, 'output', 'T_Countdown_3.png')), 2: p.decode(path.join(R, 'output', 'T_Countdown_2.png')), 1: p.decode(path.join(R, 'output', 'T_Countdown_1.png')) };
const CX = 960, CY = 693; // 보드 안쪽(825~1095, 396~990)의 가운데
// 시간 t(초)의 상태: 숫자와 배율·불투명도 (처음 hold 동안 선명, 이후 배율 1→smax, 알파 1→0, 숫자 사이 겹침 없음)
function stateAt(t) {
  const tt = t - P.lead; if (tt < 0 || tt >= 3 * P.sec) return null;
  const i = Math.floor(tt / P.sec), lt = tt - i * P.sec, n = [3, 2, 1][i];
  if (lt < P.hold) return { n, s: 1, a: 1 };
  const k = (lt - P.hold) / (P.sec - P.hold); return { n, s: 1 + (P.smax - 1) * k, a: 1 - k };
}
// 화면 한 장: 배경 복사 후 숫자를 가장 가까운 점 표본(Point 필터와 같게)으로 확대해 알파 합성
function render(t, crop) {
  const [x0, y0, w, h] = crop, out = p.blank(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const s = ((y0 + y) * bg.w + x0 + x) * 4, d = (y * w + x) * 4; out.d[d] = bg.d[s]; out.d[d + 1] = bg.d[s + 1]; out.d[d + 2] = bg.d[s + 2]; out.d[d + 3] = 255; }
  const st = stateAt(t); if (!st) return out;
  const im = dig[st.n], k = P.dot * st.s, W = im.w * k, H = im.h * k, left = CX - W / 2, top = CY - H / 2;
  for (let y = Math.max(y0, Math.floor(top)); y < Math.min(y0 + h, Math.ceil(top + H)); y++) for (let x = Math.max(x0, Math.floor(left)); x < Math.min(x0 + w, Math.ceil(left + W)); x++) {
    const u = Math.floor((x + 0.5 - left) / k), v = Math.floor((y + 0.5 - top) / k); if (u < 0 || v < 0 || u >= im.w || v >= im.h) continue;
    const s = (v * im.w + u) * 4; if (!im.d[s + 3]) continue; const d = ((y - y0) * w + x - x0) * 4;
    for (let c = 0; c < 3; c++) out.d[d + c] = Math.round(im.d[s + c] * st.a + out.d[d + c] * (1 - st.a));
  }
  return out;
}
const total = P.lead + 3 * P.sec + P.tail, nFrames = Math.round(total * P.fps);
const BOARD = [820, 391, 280, 604]; // 보드 안쪽과 약간의 여백 (테두리 석재 색을 줄여 GIF 색 손실을 줄임)
const ZOOM = [820, 553, 280, 280];  // 숫자 주변 (확대 확인용)
module.exports = { render, stateAt, P, BOARD, ZOOM, nFrames }; // 검증 스크립트에서 불러 쓰기
if (require.main !== module) return; // 불러온 경우에는 파일을 만들지 않음
function gif(name, crop, k) {
  const frames = []; for (let f = 0; f < nFrames; f++) { const im = render(f / P.fps, crop); frames.push(k > 1 ? p.nearestUp(im, k) : im); }
  L.writeGif(path.join(R, 'output', name), frames, 1000 / P.fps, { diff: true });
  console.log(name, frames[0].w + 'x' + frames[0].h, nFrames + '프레임', (fs.statSync(path.join(R, 'output', name)).size / 1024).toFixed(0) + 'KB');
}
if (process.argv[2] !== 'stills') { gif('Countdown_Preview_board_composite.gif', BOARD, 1); gif('Countdown_Preview_zoom_x2_composite.gif', ZOOM, 2); }
// 정지 장면: 숫자마다 4시점 (처음 / 선명 구간 끝 / 중간 / 거의 사라질 때), 실제 크기 1배와 확대 2배
const times = [0, P.hold, (P.hold + P.sec) / 2, P.sec - 0.05];
const rows1 = [], rowsZ = [];
[0, 1, 2].forEach(i => times.forEach(lt => { const t = P.lead + i * P.sec + lt; rows1.push(render(t, [825, 540, 270, 300])); rowsZ.push(p.nearestUp(render(t, [840, 573, 240, 240]), 2)); }));
function grid(imgs, cols, gap) { const w = imgs[0].w, h = imgs[0].h, rws = Math.ceil(imgs.length / cols), out = p.blank(cols * w + (cols + 1) * gap, rws * h + (rws + 1) * gap); for (let i = 0; i < out.w * out.h; i++) { out.d[i * 4] = 8; out.d[i * 4 + 1] = 12; out.d[i * 4 + 2] = 20; out.d[i * 4 + 3] = 255; } imgs.forEach((im, k) => { const ox = gap + (k % cols) * (w + gap), oy = gap + Math.floor(k / cols) * (h + gap); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const s = (y * w + x) * 4, d = ((oy + y) * out.w + ox + x) * 4; out.d[d] = im.d[s]; out.d[d + 1] = im.d[s + 1]; out.d[d + 2] = im.d[s + 2]; out.d[d + 3] = 255; } }); return out; }
p.encode(grid(rows1, 4, 8), path.join(R, 'output', 'Countdown_Stills_actual_size_composite.png'));
p.encode(grid(rowsZ, 4, 8), path.join(R, 'output', 'Countdown_Stills_zoom_x2_composite.png'));
console.log('stills 저장, 시점(초)', times.map(v => v.toFixed(3)).join(' / '), '| 길이', total.toFixed(2) + '초 (카운트다운 ' + (3 * P.sec).toFixed(2) + '초)');
