// 2단계: 레미 HP바를 레이어로 분리 (Frame 돌 틀 / Track 빈 칸 / Fill 초록 채움). 작업 폴더에만 저장, Unity 적용 아님
// 컨셉의 채움은 72%만 차 있어서, 채움은 같은 무늬를 한 주기(8칸=115px)씩 밀어 복사해 100% 길이로 만들고, 빈 칸은 같은 칸 간격으로 직접 그린다
const p = require('../../PauseUI_VARCO/tools/pix.js'), path = require('path');
const R = path.join(__dirname, '..'), WORK = R + '/work', PART = R + '/parts', LAY = R + '/parts/layers';
require('fs').mkdirSync(LAY, { recursive: true });
const raw = p.decode(`${WORK}/lemy_bar_raw.png`);
const BG = [...p.decode(`${R}/refs/ref_concept_hpbars.png`).d.subarray(0, 3)];

// 바깥 배경 제거 (가장자리에서 이어진 배경색)
const isBg = i => Math.abs(raw.d[i * 4] - BG[0]) + Math.abs(raw.d[i * 4 + 1] - BG[1]) + Math.abs(raw.d[i * 4 + 2] - BG[2]) < 38;
const img = { w: raw.w, h: raw.h, d: Buffer.from(raw.d) }, mark = new Uint8Array(img.w * img.h), st = p.borderSeeds(img).map(([x, y]) => y * img.w + x);
for (let i = 0; i < img.w * img.h; i++) img.d[i * 4 + 3] = 255;
while (st.length) { const i = st.pop(); if (mark[i]) continue; const x = i % img.w, y = (i - x) / img.w; if (!isBg(i)) continue; mark[i] = 1; if (x > 0) st.push(i - 1); if (x < img.w - 1) st.push(i + 1); if (y > 0) st.push(i - img.w); if (y < img.h - 1) st.push(i + img.w); }
for (let i = 0; i < img.w * img.h; i++) if (mark[i]) img.d.fill(0, i * 4, i * 4 + 4);
// 창(채움이 보이는 안쪽): x 43..252, y 11..23 (컨셉 막대 270x36 기준)
const WX = 43, WY = 11, WW = 210, WH = 13, FILLED = 150, PERIOD = 115;
// 틀과 창 안쪽은 따로 색을 줄인다 (같이 하면 청록 보석이 초록 채움 색에 섞여 버림)
const frameSrc = { w: img.w, h: img.h, d: Buffer.from(img.d) }, winSrc = p.crop(img, WX, WY, WW, WH);
for (let y = WY; y < WY + WH; y++) for (let x = WX; x < WX + WW; x++) frameSrc.d.fill(0, (y * img.w + x) * 4, (y * img.w + x) * 4 + 4); // 창은 비움
const frame = p.kmeans(frameSrc, 26); // 틀: 돌·보석·룬 26색
const win = p.kmeans(winSrc, 12); // 창 안: 초록 채움·어두운 빈 칸
const q = { w: win.w, h: win.h, d: win.d }; // 아래 코드가 창 좌표(WX,WY 오프셋 없이)로 읽도록 맞춤
p.encode(frame, `${LAY}/T_HpLemy_Frame.png`);

const fill = p.blank(WW, WH);
for (let y = 0; y < WH; y++) for (let x = 0; x < WW; x++) { const sx = x < FILLED ? x : x - PERIOD; win.d.copy(fill.d, (y * WW + x) * 4, (y * WW + sx) * 4, (y * WW + sx) * 4 + 4); }
p.encode(fill, `${LAY}/T_HpLemy_Fill.png`);

// 빈 칸: 빈 영역(오른쪽 끝) 한 열의 세로 색 변화를 그대로 쓰고, 칸 나눔선만 채움과 같은 간격(14.375px)으로 어둡게
const track = p.blank(WW, WH), col = 190; // 빈 영역 안의 한 열
const rowCol = y => { const o = (y * WW + col) * 4; return [win.d[o], win.d[o + 1], win.d[o + 2]]; };
const divs = new Set(); for (let k = 0; k < 15; k++) divs.add(Math.round(58 - WX + 14.375 * k)); // 채움의 칸 나눔선 위치(창 기준)
for (let y = 0; y < WH; y++) for (let x = 0; x < WW; x++) { const c = rowCol(y), d = divs.has(x) ? 0.62 : 1, o = (y * WW + x) * 4; track.d[o] = Math.round(c[0] * d); track.d[o + 1] = Math.round(c[1] * d); track.d[o + 2] = Math.round(c[2] * d); track.d[o + 3] = 255; }
p.encode(track, `${LAY}/T_HpLemy_Track.png`);

// 합성 확인(72%): Track → Fill(왼쪽 72%) → Frame
const out = p.blank(frame.w, frame.h), over = (dst, src, ox, oy, cw) => { for (let y = 0; y < src.h; y++) for (let x = 0; x < (cw ?? src.w); x++) { const s = (y * src.w + x) * 4; if (!src.d[s + 3]) continue; src.d.copy(dst.d, ((oy + y) * dst.w + ox + x) * 4, s, s + 4); } };
over(out, track, WX, WY); over(out, fill, WX, WY, Math.round(WW * 0.72)); over(out, frame, 0, 0);
p.encode(out, `${PART}/Lemy_HpBar_72.png`); p.encode(p.nearestUp(out, 4, [14, 24, 45]), `${WORK}/lemy_layers_check_x4.png`);
console.log('Frame', frame.w + 'x' + frame.h, 'colors', p.countColors(frame), '| Fill', fill.w + 'x' + fill.h, 'colors', p.countColors(fill), '| Track', p.countColors(track));
