// 5단계(3차): OPTION·SOUND·SENSITIVITY 창 미리보기 (원본 x3 / 게임 화면 1.75배 합성). Unity에는 넣지 않음
const p = require('./pix.js'), path = require('path'), fs = require('fs');
const R = path.join(__dirname, '..'), PART = R + '/parts', PRE = R + '/preview';
const pos = JSON.parse(fs.readFileSync(R + '/work/parts_pos.json'));
const ld = n => p.decode(`${PART}/${n}.png`);

function over(dst, src, ox, oy) { // 알파 합성
  for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
    const X = ox + x, Y = oy + y; if (X < 0 || Y < 0 || X >= dst.w || Y >= dst.h) continue;
    const s = (y * src.w + x) * 4, d = (Y * dst.w + X) * 4, a = src.d[s + 3] / 255;
    for (let c = 0; c < 3; c++) dst.d[d + c] = Math.round(src.d[s + c] * a + dst.d[d + c] * (1 - a));
    dst.d[d + 3] = Math.max(dst.d[d + 3], src.d[s + 3]);
  }
}
function scaleNearest(img, k) { // 실수 배율 최근접 (Unity Point 필터 표시 흉내)
  const W = Math.round(img.w * k), H = Math.round(img.h * k), o = p.blank(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) img.d.copy(o.d, (y * W + x) * 4, (Math.floor(y / k) * img.w + Math.floor(x / k)) * 4, (Math.floor(y / k) * img.w + Math.floor(x / k)) * 4 + 4);
  return o;
}
// 빈 패널 9-slice (Unity Sliced + Point 필터와 같음): 모서리 62px 고정, 변·가운데만 늘림
function panel9(W, H, B = 62) {
  const s = ld('T_Panel_Blank'), o = p.blank(W, H);
  const map = (v, n, N) => v < B ? v : v >= N - B ? n - (N - v) : B + Math.floor((v - B) * (n - 2 * B) / (N - 2 * B));
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const si = (map(y, s.h, H) * s.w + map(x, s.w, W)) * 4; s.d.copy(o.d, (y * W + x) * 4, si, si + 4); }
  return o;
}
const center = (dst, img, y) => over(dst, img, (dst.w - img.w) >> 1, y);

// 슬라이더: 2차 미리보기와 같은 조립 (트랙 + 왼쪽부터 채움 + 손잡이)
const tr = ld('T_Slider_Track'), fl = ld('T_Slider_Fill'), hd = ld('T_Slider_Handle');
function slider(t) {
  const sl = p.blank(tr.w, Math.max(tr.h, hd.h)), ty = (sl.h - tr.h) >> 1; over(sl, tr, 0, ty);
  const fw = Math.max(1, Math.round((tr.w - 26) * t)), fc = p.crop(fl, 0, 0, Math.min(fw, fl.w), fl.h);
  over(sl, fc, 13, ty + ((tr.h - fl.h) >> 1)); over(sl, hd, 13 + fc.w - (hd.w >> 1), (sl.h - hd.h) >> 1);
  return sl;
}
// 숫자 자리 표시용 5x7 도트 글꼴 (실제 게임에서는 Unity 텍스트)
const DIG = { 0: ['.XXX.', 'X...X', 'X..XX', 'X.X.X', 'XX..X', 'X...X', '.XXX.'], 1: ['..X..', '.XX..', '..X..', '..X..', '..X..', '..X..', '.XXX.'], 2: ['.XXX.', 'X...X', '....X', '...X.', '..X..', '.X...', 'XXXXX'], 3: ['XXXX.', '....X', '....X', '.XXX.', '....X', '....X', 'XXXX.'], 6: ['.XXX.', 'X....', 'X....', 'XXXX.', 'X...X', 'X...X', '.XXX.'], 7: ['XXXXX', '....X', '...X.', '..X..', '..X..', '..X..', '..X..'], '.': ['.', '.', '.', '.', '.', '.', 'X'], X: ['X...X', 'X...X', '.X.X.', '..X..', '.X.X.', 'X...X', 'X...X'], ' ': ['..', '..', '..', '..', '..', '..', '..'] };
function num(dst, str, x, y) {
  const cream = [227, 217, 191], dark = [11, 14, 31];
  for (const [dx, dy, col] of [[1, 1, dark], [0, 0, cream]]) { let cx = x; for (const ch of str) { const g = DIG[ch]; g.forEach((row, ry) => [...row].forEach((c, rx) => { if (c === 'X') { const i = ((y + ry + dy) * dst.w + cx + rx + dx) * 4; dst.d[i] = col[0]; dst.d[i + 1] = col[1]; dst.d[i + 2] = col[2]; dst.d[i + 3] = 255; } })); cx += g[0].length + 1; } }
}

// OPTION 창: PAUSE 창 배치 그대로 (제목판·버튼 자리 동일)
const P = pos.T_Panel_Blank, opt = p.blank(P.w, P.h + 8), at = n => [pos[n].x - P.x, pos[n].y - P.y + 4];
over(opt, ld('T_Panel_Blank'), 0, 4);
over(opt, ld('T_Title_OPTION'), ...at('T_Title_PAUSE'));
over(opt, ld('T_Btn_SENSITIVITY'), ...at('T_Btn_RESUME'));
over(opt, ld('T_Btn_SOUND'), ...at('T_Btn_OPTION'));
over(opt, ld('T_Btn_BACK'), ...at('T_Btn_RESTART'));

// SOUND 창: 제목판 / MUSIC + 슬라이더 / SFX + 슬라이더 / BACK
const snd = panel9(420, 280);
center(snd, ld('T_Title_SOUND'), 0);
center(snd, ld('T_Label_MUSIC'), 56); center(snd, slider(0.8), 76);
center(snd, ld('T_Label_SFX'), 132); center(snd, slider(0.6), 152);
center(snd, ld('T_Btn_BACK'), 223);

// SENSITIVITY 창: 줄마다 라벨 / 슬라이더(아래 SLOW·FAST) / MS·F 입력칸 (SDF는 현재값 문구)
const sen = panel9(600, 390), slow = ld('T_Label_SLOW'), fast = ld('T_Label_FAST'), ms = ld('T_Input_MS'), fi = ld('T_Input_F');
center(sen, ld('T_Title_SENSITIVITY'), 0);
[['ARR', 0.4, '33', '2.0'], ['DAS', 0.6, '167', '10.0'], ['DCD', 0.2, '17', '1.0'], ['SDF', 1.0, null, '20 X']].forEach(([lab, t, msv, fv], i) => {
  const y = 58 + i * 66, sx = 82, l = ld('T_Label_' + lab);
  over(sen, l, 34, y + ((47 - l.h) >> 1));
  over(sen, slider(t), sx, y);
  over(sen, slow, sx + 14, y + 48); over(sen, fast, sx + tr.w - 14 - fast.w, y + 48);
  if (msv) { // 숫자는 단위 왼쪽에 오른쪽 정렬
    const bx = sx + tr.w + 10, by = y + ((47 - ms.h) >> 1);
    over(sen, ms, bx, by); num(sen, msv, bx + 40 - msv.length * 6, by + 8);
    over(sen, fi, bx + ms.w + 6, by); num(sen, fv, bx + ms.w + 6 + 40 - fv.length * 6 + (fv.includes('.') ? 4 : 0), by + 8);
  } else num(sen, fv, sx + tr.w + 20, y + 20); // SDF 현재값
});
center(sen, ld('T_Btn_BACK'), 334);

// 저장: 원본 크기 x3 + 게임 화면 1.75배 합성(창마다 한 장)
const shot0 = p.decode(R + '/refs/ref_ingame_full.png');
for (const [name, win] of [['Option', opt], ['Sound', snd], ['Sensitivity', sen]]) {
  p.encode(p.nearestUp(win, 3, [20, 24, 36]), `${PRE}/${name}_x3.png`);
  const shot = { w: shot0.w, h: shot0.h, d: Buffer.from(shot0.d) };
  for (let i = 0; i < shot.w * shot.h; i++) for (let c = 0; c < 3; c++) shot.d[i * 4 + c] = Math.round(shot.d[i * 4 + c] * 0.45); // 일시정지 시 어둡게
  const ws = scaleNearest(win, 1.75); over(shot, ws, (shot.w - ws.w) >> 1, (shot.h - ws.h) >> 1);
  p.encode(shot, `${PRE}/InGame_${name}_1.75x.png`);
  console.log(name, win.w + 'x' + win.h, '-> 1.75x', ws.w + 'x' + ws.h);
}
