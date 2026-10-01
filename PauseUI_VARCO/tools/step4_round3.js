// 4단계(3차): 옵션·사운드·감도 창 파츠. 2차 파츠 팔레트(31색)에 맞춰 축소 후 분리
const p = require('./pix.js'), path = require('path'), fs = require('fs');
const R = path.join(__dirname, '..'), G = R + '/generated', OUT = R + '/parts', PRE = R + '/parts/preview';

// 2차 파츠에 쓰인 색을 공용 팔레트로 사용 (창마다 색이 달라지지 않게)
const ROUND2 = ['T_Panel_Blank', 'T_Title_PAUSE', 'T_Btn_RESUME', 'T_Btn_OPTION', 'T_Btn_RESTART', 'T_Slider_Track', 'T_Slider_Fill', 'T_Slider_Handle'];
const pal = new Set();
for (const f of ROUND2) { const im = p.decode(`${OUT}/${f}.png`); for (let i = 0; i < im.w * im.h; i++) if (im.d[i * 4 + 3]) pal.add(im.d.readUInt32BE(i * 4) >>> 8); }
const PAL = [...pal].map(k => [k >> 16 & 255, k >> 8 & 255, k & 255]);
function toPalette(src) { // 가장 가까운 팔레트 색으로 교체한 사본 (디더링 없음)
  const img = { w: src.w, h: src.h, d: Buffer.from(src.d) };
  for (let i = 0; i < img.w * img.h; i++) {
    let best = 0, bd = 1e9; const r = img.d[i * 4], g = img.d[i * 4 + 1], b = img.d[i * 4 + 2];
    PAL.forEach((c, j) => { const dd = (r - c[0]) ** 2 + (g - c[1]) ** 2 + (b - c[2]) ** 2; if (dd < bd) { bd = dd; best = j; } });
    img.d[i * 4] = PAL[best][0]; img.d[i * 4 + 1] = PAL[best][1]; img.d[i * 4 + 2] = PAL[best][2];
  }
  return img;
}
// 축소 원본(raw)과 팔레트 적용본(pal). 배경 판정은 raw로 해서 돌 홈이 배경으로 새지 않게 함
function load(name, F) {
  const raw = p.boxDown(p.decode(`${G}/${name}.png`), F), bg = [...raw.d.subarray(0, 3)]; // 왼쪽 위 모서리 = 단색 배경
  const isBg = i => Math.abs(raw.d[i * 4] - bg[0]) + Math.abs(raw.d[i * 4 + 1] - bg[1]) + Math.abs(raw.d[i * 4 + 2] - bg[2]) < 24;
  return { raw, pal: toPalette(raw), isBg };
}

// 명패·입력칸: 상자 테두리에서 연결된 배경만 지우고 중심과 연결된 덩어리만 남김
function plate(S, x0, y0, x1, y1) {
  const W = S.raw.w, c = p.crop(S.pal, x0, y0, x1 - x0, y1 - y0), { w, h, d } = c, bg = new Uint8Array(w * h), st = p.borderSeeds(c).map(([x, y]) => y * w + x);
  while (st.length) { const i = st.pop(); if (bg[i]) continue; const x = i % w, y = (i - x) / w; if (!S.isBg((y0 + y) * W + x0 + x)) continue; bg[i] = 1; if (x > 0) st.push(i - 1); if (x < w - 1) st.push(i + 1); if (y > 0) st.push(i - w); if (y < h - 1) st.push(i + w); }
  const keep = new Uint8Array(w * h), q = [(h >> 1) * w + (w >> 1)];
  while (q.length) { const i = q.pop(); if (keep[i] || bg[i]) continue; keep[i] = 1; const x = i % w, y = (i - x) / w; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < w && ny < h) q.push(ny * w + nx); } }
  for (let i = 0; i < w * h; i++) if (!keep[i]) d.fill(0, i * 4, i * 4 + 4);
  return p.trim(c).img;
}
// 라벨 글자: 배경색은 글자 안쪽 구멍까지 모두 지움
function word(S, x0, y0, x1, y1) {
  const W = S.raw.w, c = p.crop(S.pal, x0, y0, x1 - x0, y1 - y0);
  for (let y = 0; y < c.h; y++) for (let x = 0; x < c.w; x++) if (S.isBg((y0 + y) * W + x0 + x)) c.d.fill(0, (y * c.w + x) * 4, (y * c.w + x) * 4 + 4);
  return p.trim(c).img;
}
// 2차 파츠의 알파 모양을 틀로 같은 위치에서 잘라냄 (E_02는 A_01과 구도·좌표가 같음)
const POS = JSON.parse(fs.readFileSync(R + '/work/parts_pos.json', 'utf8'));
function stencil(S, from) {
  const m = p.decode(`${OUT}/${from}.png`), { x, y } = POS[from], c = p.crop(S.pal, x, y, m.w, m.h);
  for (let i = 0; i < m.w * m.h; i++) if (!m.d[i * 4 + 3]) c.d.fill(0, i * 4, i * 4 + 4);
  return c;
}
const parts = {};

// E_02: OPTION 제목판 + 버튼 3개를 PAUSE·RESUME·OPTION·RESTART 틀로 추출
const E = load('E_OptionWindow_02', 121 / 33);
parts.T_Title_OPTION = stencil(E, 'T_Title_PAUSE');
parts.T_Btn_SENSITIVITY = stencil(E, 'T_Btn_RESUME');
parts.T_Btn_SOUND = stencil(E, 'T_Btn_OPTION');
parts.T_Btn_BACK = stencil(E, 'T_Btn_RESTART');

// G_01: 수정·이끼 없는 단독 제목판 (A_01과 같은 1200x896 구도, SOUND는 PAUSE 자리·크기와 같음)
const T = load('G_Titles_01', 121 / 33);
parts.T_Title_SOUND = plate(T, 84, 28, 242, 82);
parts.T_Title_SENSITIVITY = plate(T, 52, 152, 275, 206);

// D_02: 큰 라벨은 RESUME 글자 높이, SLOW/FAST는 작은 글자
const D = load('D_Labels_02', 8.5);
Object.assign(parts, {
  T_Label_MUSIC: word(D, 9, 9, 66, 28), T_Label_ARR: word(D, 116, 9, 152, 28), T_Label_SFX: word(D, 10, 30, 46, 48),
  T_Label_DAS: word(D, 62, 42, 98, 60), T_Label_DCD: word(D, 10, 62, 46, 80), T_Label_SDF: word(D, 62, 62, 99, 80),
  T_Label_SLOW: word(D, 73, 9, 109, 23), T_Label_FAST: word(D, 73, 25, 106, 39),
});

// F_01: 단위가 새겨진 입력칸 (MS 글자 높이 약 9px)
const FI = load('F_InputBox_01', 9.1);
parts.T_Input_MS = plate(FI, 8, 15, 77, 40);
parts.T_Input_F = plate(FI, 83, 15, 143, 40);

for (const [k, img] of Object.entries(parts)) {
  if (img.w <= 0) throw new Error(k + ' 추출 실패 (빈 이미지)');
  p.encode(img, `${OUT}/${k}.png`); p.encode(p.nearestUp(img, 6, [255, 0, 255]), `${PRE}/${k}_x6.png`);
  console.log(k, img.w + 'x' + img.h, 'colors', p.countColors(img));
}
