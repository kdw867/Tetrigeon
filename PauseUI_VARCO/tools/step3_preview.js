// 3단계: 분리한 파츠를 다시 조립해 미리보기 (원본 크기 / x4 / 게임 화면 1.75배 합성)
const p = require('./pix.js'), path = require('path'), fs = require('fs');
const R = path.join(__dirname, '..'), PART = R + '/parts', PRE = R + '/preview';
fs.mkdirSync(PRE, { recursive: true });
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

// PAUSE 창: 시안의 원래 배치 그대로 조립
const P = pos.T_Panel_Blank, pause = p.blank(P.w, P.h + 8);
const at = n => [pos[n].x - P.x, pos[n].y - P.y + 4];
over(pause, ld('T_Panel_Blank'), 0, 4);
for (const n of ['T_Title_PAUSE', 'T_Btn_RESUME', 'T_Btn_OPTION', 'T_Btn_RESTART']) over(pause, ld(n), ...at(n));
p.encode(pause, `${PRE}/Pause_native.png`);
p.encode(p.nearestUp(pause, 4, [20, 24, 36]), `${PRE}/Pause_x4.png`);

// 슬라이더 예시: 트랙 + 채움(60%) + 손잡이
const tr = ld('T_Slider_Track'), fl = ld('T_Slider_Fill'), hd = ld('T_Slider_Handle'), sl = p.blank(tr.w, Math.max(tr.h, hd.h));
const ty = (sl.h - tr.h) >> 1; over(sl, tr, 0, ty);
const fillW = Math.round((tr.w - 26) * 0.6), fillCrop = p.crop(fl, 0, 0, Math.min(fillW, fl.w), fl.h); // 채움 왼쪽부터 60%
over(sl, fillCrop, 13, ty + ((tr.h - fl.h) >> 1));
over(sl, hd, 13 + fillCrop.w - (hd.w >> 1), (sl.h - hd.h) >> 1);
p.encode(sl, `${PRE}/Slider_native.png`);
p.encode(p.nearestUp(sl, 4, [20, 24, 36]), `${PRE}/Slider_x4.png`);

// 게임 화면(1920x1080) 위에 1.75배로 합성: 중앙에 PAUSE 창, 그 아래 슬라이더
const shot = p.decode(R + '/refs/ref_ingame_full.png');
for (let i = 0; i < shot.w * shot.h; i++) for (let c = 0; c < 3; c++) shot.d[i * 4 + c] = Math.round(shot.d[i * 4 + c] * 0.45); // 일시정지 시 어둡게
const ps = scaleNearest(pause, 1.75), ss = scaleNearest(sl, 1.75);
over(shot, ps, (shot.w - ps.w) >> 1, 160); over(shot, ss, (shot.w - ss.w) >> 1, 160 + ps.h + 40);
p.encode(shot, `${PRE}/InGame_1.75x.png`);
console.log('pause', pause.w + 'x' + pause.h, '-> 1.75x', ps.w + 'x' + ps.h, '| slider', sl.w + 'x' + sl.h, '-> 1.75x', ss.w + 'x' + ss.h);
