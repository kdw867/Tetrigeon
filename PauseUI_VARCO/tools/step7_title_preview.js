// 7단계: TITLE 버튼 확정 후보를 기존 버튼 폭(121)으로 맞추고, 버튼 4개짜리 일시정지 창 미리보기를 만든다 (Unity 적용 아님)
const p = require('./pix.js'), path = require('path'), fs = require('fs');
const R = path.join(__dirname, '..'), PART = R + '/parts', WORK = R + '/work', PRE = R + '/preview';
const PICK = process.argv[2] || 'title_btn_02_2'; // work/ 안의 후보 이름
const TARGET_W = 121; // OPTION 버튼과 같은 폭
const over = (dst, src, ox, oy) => { for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) { const X = ox + x, Y = oy + y; if (X < 0 || Y < 0 || X >= dst.w || Y >= dst.h) continue; const s = (y * src.w + x) * 4, d = (Y * dst.w + X) * 4, a = src.d[s + 3] / 255; for (let c = 0; c < 3; c++) dst.d[d + c] = Math.round(src.d[s + c] * a + dst.d[d + c] * (1 - a)); dst.d[d + 3] = Math.max(dst.d[d + 3], src.d[s + 3]); } };
const scaleNearest = (img, k) => { const W = Math.round(img.w * k), H = Math.round(img.h * k), o = p.blank(W, H); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) img.d.copy(o.d, (y * W + x) * 4, (Math.floor(y / k) * img.w + Math.floor(x / k)) * 4, (Math.floor(y / k) * img.w + Math.floor(x / k)) * 4 + 4); return o; };

// 1) 폭 맞추기: 글자와 룬 사이의 안쪽 빈 열을 양쪽에 같은 수만큼 복제 (도트 크기는 그대로)
const src = p.decode(`${WORK}/${PICK}.png`), extra = TARGET_W - src.w;
if (extra < 0 || extra % 2) throw new Error(`폭 ${src.w} -> ${TARGET_W} 차이 ${extra}: 짝수 양수만 지원`);
const cream = (x, y) => { const i = (y * src.w + x) * 4; return src.d[i + 3] && src.d[i] > 200 && src.d[i + 1] > 190 && src.d[i + 2] > 150 && src.d[i] - src.d[i + 2] < 60; }; // 크림색 글자
let tx0 = src.w, tx1 = -1; for (let y = 8; y < src.h - 8; y++) for (let x = 0; x < src.w; x++) if (cream(x, y)) { tx0 = Math.min(tx0, x); tx1 = Math.max(tx1, x); }
const cl = tx0 - 4, cr = tx1 + 4, add = extra / 2; // 글자 왼쪽/오른쪽 4열 바깥의 안쪽 빈 열
const out = p.blank(TARGET_W, src.h); let ox = 0;
for (let x = 0; x < src.w; x++) { const n = x === cl || x === cr ? 1 + add : 1; for (let k = 0; k < n; k++, ox++) for (let y = 0; y < src.h; y++) src.d.copy(out.d, (y * out.w + ox) * 4, (y * src.w + x) * 4, (y * src.w + x) * 4 + 4); }
p.encode(out, `${WORK}/T_Btn_TITLE_candidate.png`);
console.log('글자 구간', tx0, tx1, '복제 열', cl, cr, '결과', out.w + 'x' + out.h, 'colors', p.countColors(out));

// 2) 미리보기: 패널을 세로로 늘린 4버튼 PAUSE 창 (Unity Sliced와 같은 방식: 위아래 62px 테두리 유지, 가운데 띠를 늘림)
const pos = JSON.parse(fs.readFileSync(R + '/work/parts_pos.json')), P = pos.T_Panel_Blank, ld = n => p.decode(`${PART}/${n}.png`);
const GROW = 38, B = 62, panel = ld('T_Panel_Blank'), tall = p.blank(panel.w, panel.h + GROW), mid = panel.h - 2 * B;
for (let y = 0; y < tall.h; y++) { const sy = y < B ? y : y >= tall.h - B ? y - GROW : B + Math.floor((y - B) * mid / (mid + GROW)); panel.d.copy(tall.d, y * tall.w * 4, sy * panel.w * 4, (sy + 1) * panel.w * 4); }
const rel = n => [pos[n].x - P.x, pos[n].y - P.y];
const mk = (withTitle) => { const w = withTitle ? tall : panel, win = p.blank(w.w, w.h + 8); over(win, w, 0, 4); for (const n of ['T_Title_PAUSE', 'T_Btn_RESUME', 'T_Btn_OPTION', 'T_Btn_RESTART']) { const [x, y] = rel(n); over(win, ld(n), x, y + 4); } if (withTitle) { const [x, y] = rel('T_Btn_RESTART'); over(win, out, x + 1 - 0, y + 38 + 4); } return win; };
const before = mk(false), after = mk(true);
const sheet = p.blank(before.w + after.w + 30, after.h + 6); for (let i = 0; i < sheet.w * sheet.h; i++) { sheet.d[i * 4] = 20; sheet.d[i * 4 + 1] = 24; sheet.d[i * 4 + 2] = 36; sheet.d[i * 4 + 3] = 255; }
over(sheet, before, 0, 0); over(sheet, after, before.w + 30, 0);
p.encode(p.nearestUp(sheet, 3), `${PRE}/Pause_Title_before_after_x3.png`);
p.encode(p.nearestUp(after, 4, [20, 24, 36]), `${PRE}/Pause_Title_x4.png`);
// 3) 게임 화면 위 1.75배 합성 (실제 표시 크기 확인)
const shot = p.decode(R + '/refs/ref_ingame_full.png'); for (let i = 0; i < shot.w * shot.h; i++) for (let c = 0; c < 3; c++) shot.d[i * 4 + c] = Math.round(shot.d[i * 4 + c] * 0.45);
const as = scaleNearest(after, 1.75); over(shot, as, (shot.w - as.w) >> 1, 120);
p.encode(shot, `${PRE}/InGame_Pause_Title_1.75x.png`);
console.log('window', after.w + 'x' + after.h, '-> 1.75x', as.w + 'x' + as.h);
