// 10단계: 결과 창 제목판 확정 후보를 PAUSE 제목판과 같은 글자 양옆 빈칸으로 다듬고, 결과 창 미리보기를 만든다 (Unity 적용 아님)
const p = require('./pix.js'), path = require('path'), fs = require('fs');
const R = path.join(__dirname, '..'), PART = R + '/parts', WORK = R + '/work', PRE = R + '/preview';
const [defName = 'result_title_DEFEAT_02', vicName = 'result_title_VICTORY_02'] = process.argv.slice(2);
const ld = n => p.decode(`${PART}/${n}.png`);
const cream = (im, x, y) => { const i = (y * im.w + x) * 4; return im.d[i + 3] && im.d[i] > 200 && im.d[i + 1] > 190 && im.d[i + 2] > 150 && im.d[i] - im.d[i + 2] < 60; };
const cyan = (im, x, y) => { const i = (y * im.w + x) * 4; return im.d[i + 3] && im.d[i + 2] > 170 && im.d[i + 1] > 170 && im.d[i] < 140; };
function metrics(im) { // 글자 가로 범위, 왼쪽 룬의 오른쪽 끝, 오른쪽 룬의 왼쪽 끝
  let tx0 = im.w, tx1 = -1, rl = -1, rr = im.w; for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) { if (cream(im, x, y)) { tx0 = Math.min(tx0, x); tx1 = Math.max(tx1, x); } }
  for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) if (cyan(im, x, y)) { if (x < tx0) rl = Math.max(rl, x); if (x > tx1) rr = Math.min(rr, x); }
  return { tx0, tx1, rl, rr, gapL: tx0 - rl - 1, gapR: rr - tx1 - 1 };
}
const pause = ld('T_Title_PAUSE'), pm = metrics(pause); console.log('PAUSE', pause.w + 'x' + pause.h, JSON.stringify(pm));
function trimGap(im, label) { // 글자와 룬 사이 빈칸이 PAUSE와 같아지도록 안쪽 열을 양쪽에서 제거
  const m = metrics(im), cutL = Math.max(0, m.gapL - pm.gapL), cutR = Math.max(0, m.gapR - pm.gapR); console.log(label, im.w + 'x' + im.h, JSON.stringify(m), '제거 열', cutL, cutR);
  const drop = new Set(); const sL = m.rl + 1 + Math.floor((m.gapL - cutL) / 2); for (let k = 0; k < cutL; k++) drop.add(sL + k); // 왼쪽 빈칸 한가운데에서 제거
  const sR = m.tx1 + 1 + Math.floor((m.gapR - cutR) / 2); for (let k = 0; k < cutR; k++) drop.add(sR + k); // 오른쪽 빈칸 한가운데에서 제거
  const W = im.w - drop.size, o = p.blank(W, im.h); let ox = 0; for (let x = 0; x < im.w; x++) { if (drop.has(x)) continue; for (let y = 0; y < im.h; y++) im.d.copy(o.d, (y * W + ox) * 4, (y * im.w + x) * 4, (y * im.w + x) * 4 + 4); ox++; }
  return o;
}
const defeat = p.decode(`${WORK}/${defName}.png`), victory = trimGap(p.decode(`${WORK}/${vicName}.png`), 'VICTORY');
p.encode(defeat, `${PART}/T_Title_DEFEAT.png`); p.encode(victory, `${PART}/T_Title_VICTORY.png`);
console.log('T_Title_DEFEAT', defeat.w + 'x' + defeat.h, 'colors', p.countColors(defeat), '| T_Title_VICTORY', victory.w + 'x' + victory.h, 'colors', p.countColors(victory));

// 미리보기: 패널(9-slice로 세로를 버튼 2개 높이로 줄임) + 제목판 + 버튼 2개
const over = (dst, src, ox, oy) => { for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) { const X = ox + x, Y = oy + y; if (X < 0 || Y < 0 || X >= dst.w || Y >= dst.h) continue; const s = (y * src.w + x) * 4, d = (Y * dst.w + X) * 4, a = src.d[s + 3] / 255; for (let c = 0; c < 3; c++) dst.d[d + c] = Math.round(src.d[s + c] * a + dst.d[d + c] * (1 - a)); dst.d[d + 3] = Math.max(dst.d[d + 3], src.d[s + 3]); } };
const scaleNearest = (img, k) => { const W = Math.round(img.w * k), H = Math.round(img.h * k), o = p.blank(W, H); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) img.d.copy(o.d, (y * W + x) * 4, (Math.floor(y / k) * img.w + Math.floor(x / k)) * 4, (Math.floor(y / k) * img.w + Math.floor(x / k)) * 4 + 4); return o; };
const pos = JSON.parse(fs.readFileSync(R + '/work/parts_pos.json')), P = pos.T_Panel_Blank, panel = ld('T_Panel_Blank'), B = 62, H = Math.round(266.5 / 1.75); // Unity 패널 266.5px = 원본 152px
const small = p.blank(panel.w, H), mid = panel.h - 2 * B, nmid = H - 2 * B;
for (let y = 0; y < H; y++) { const sy = y < B ? y : y >= H - B ? y + (panel.h - H) : B + Math.floor((y - B) * mid / nmid); panel.d.copy(small.d, y * small.w * 4, sy * panel.w * 4, (sy + 1) * panel.w * 4); }
function windowFor(title) {
  const win = p.blank(small.w, small.h + 8); over(win, small, 0, 4);
  over(win, title, Math.round((small.w - title.w) / 2), 4); // 제목판은 위 테두리에 걸쳐 가운데
  const btn1 = ld('T_Btn_RESTART'), btn2 = ld('T_Btn_TITLE'), y1 = Math.round((133.25 - 13 - 28.875) / 1.75) , y2 = Math.round((133.25 + 53 - 28.875) / 1.75); // Unity 위치(13, -53)를 패널 위쪽 기준 원본 px로 환산
  over(win, btn1, Math.round((small.w - btn1.w) / 2) - 1, 4 + y1); over(win, btn2, Math.round((small.w - btn2.w) / 2), 4 + y2);
  return win;
}
const wd = windowFor(defeat), wv = windowFor(victory), sheet = p.blank(wd.w + wv.w + 40, wd.h + 6);
for (let i = 0; i < sheet.w * sheet.h; i++) { sheet.d[i * 4] = 20; sheet.d[i * 4 + 1] = 24; sheet.d[i * 4 + 2] = 36; sheet.d[i * 4 + 3] = 255; }
over(sheet, wd, 0, 0); over(sheet, wv, wd.w + 40, 0);
p.encode(p.nearestUp(sheet, 3), `${PRE}/Result_Window_x3.png`);
const shot = p.decode(R + '/refs/ref_ingame_full.png'); for (let i = 0; i < shot.w * shot.h; i++) for (let c = 0; c < 3; c++) shot.d[i * 4 + c] = Math.round(shot.d[i * 4 + c] * 0.45);
const sd = scaleNearest(wd, 1.75); over(shot, sd, (shot.w - sd.w) >> 1, 300); p.encode(shot, `${PRE}/InGame_Result_Defeat_1.75x.png`);
const shot2 = p.decode(R + '/refs/ref_ingame_full.png'); for (let i = 0; i < shot2.w * shot2.h; i++) for (let c = 0; c < 3; c++) shot2.d[i * 4 + c] = Math.round(shot2.d[i * 4 + c] * 0.45);
const sv = scaleNearest(wv, 1.75); over(shot2, sv, (shot2.w - sv.w) >> 1, 300); p.encode(shot2, `${PRE}/InGame_Result_Victory_1.75x.png`);
console.log('window', wd.w + 'x' + wd.h, '-> 1.75x', sd.w + 'x' + sd.h);
