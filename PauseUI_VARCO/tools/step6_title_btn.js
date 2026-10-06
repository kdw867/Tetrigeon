// 6단계: TITLE 버튼 후보. 생성 시트(버튼 3개)에서 버튼을 잘라 기존 버튼과 같은 높이(33px)로 축소하고 공용 팔레트로 맞춤
const p = require('./pix.js'), path = require('path'), fs = require('fs');
const R = path.join(__dirname, '..'), G = R + '/generated', OUT = R + '/parts', WORK = R + '/work';
const SHEETS = process.argv.slice(2).length ? process.argv.slice(2) : ['H_TitleBtn_01', 'H_TitleBtn_02'];
const BTN_H = 33; // 기존 RESUME / OPTION / RESTART 원본 높이

// 2차 파츠에 쓰인 색을 공용 팔레트로 사용 (창마다 색이 달라지지 않게, step4_round3와 같은 방식)
const ROUND2 = ['T_Panel_Blank', 'T_Title_PAUSE', 'T_Btn_RESUME', 'T_Btn_OPTION', 'T_Btn_RESTART', 'T_Slider_Track', 'T_Slider_Fill', 'T_Slider_Handle'];
const pal = new Set();
for (const f of ROUND2) { const im = p.decode(`${OUT}/${f}.png`); for (let i = 0; i < im.w * im.h; i++) if (im.d[i * 4 + 3]) pal.add(im.d.readUInt32BE(i * 4) >>> 8); }
const PAL = [...pal].map(k => [k >> 16 & 255, k >> 8 & 255, k & 255]);
function toPalette(src) { // 가장 가까운 팔레트 색으로 교체 (디더링 없음)
  const img = { w: src.w, h: src.h, d: Buffer.from(src.d) };
  for (let i = 0; i < img.w * img.h; i++) {
    let best = 0, bd = 1e9; const r = img.d[i * 4], g = img.d[i * 4 + 1], b = img.d[i * 4 + 2];
    PAL.forEach((c, j) => { const dd = (r - c[0]) ** 2 + (g - c[1]) ** 2 + (b - c[2]) ** 2; if (dd < bd) { bd = dd; best = j; } });
    img.d[i * 4] = PAL[best][0]; img.d[i * 4 + 1] = PAL[best][1]; img.d[i * 4 + 2] = PAL[best][2];
  }
  return img;
}

// 시트에서 버튼 세로 띠 3개를 찾음: 배경색과 다른 픽셀이 있는 행 구간
function bands(img, bg, tol) {
  const diff = (x, y) => { const i = (y * img.w + x) * 4; return Math.abs(img.d[i] - bg[0]) + Math.abs(img.d[i + 1] - bg[1]) + Math.abs(img.d[i + 2] - bg[2]) > tol; };
  const rows = []; for (let y = 0; y < img.h; y++) { let c = 0; for (let x = 0; x < img.w; x += 2) if (diff(x, y)) c++; rows.push(c > 12); }
  const out = []; let s = -1;
  for (let y = 0; y <= img.h; y++) { if (y < img.h && rows[y]) { if (s < 0) s = y; } else if (s >= 0) { if (y - s > 40) out.push([s, y - 1]); s = -1; } }
  return out.map(([y0, y1]) => { let x0 = img.w, x1 = -1; for (let y = y0; y <= y1; y++) for (let x = 0; x < img.w; x++) if (diff(x, y)) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); } return { x0, y0, x1, y1 }; });
}

const cands = [];
for (const name of SHEETS) {
  const src = p.decode(`${G}/${name}.png`), bg = [...src.d.subarray(0, 3)];
  const bs = bands(src, bg, 28); // 아래 그림자까지 포함한 전체 높이 기준
  console.log(name, 'bands', bs.map(b => `${b.x0},${b.y0}-${b.x1},${b.y1} (${b.x1 - b.x0 + 1}x${b.y1 - b.y0 + 1})`).join(' | '));
  bs.forEach((b, k) => {
    const m = 6, x0 = Math.max(0, b.x0 - m), y0 = Math.max(0, b.y0 - m), w = Math.min(src.w, b.x1 + m + 1) - x0, h = Math.min(src.h, b.y1 + m + 1) - y0;
    const F = (b.y1 - b.y0 + 1) / BTN_H, raw = p.boxDown(p.crop(src, x0, y0, w, h), F), pl = toPalette(raw); // 버튼 높이가 33px이 되는 배율
    const isBg = i => Math.abs(raw.d[i * 4] - bg[0]) + Math.abs(raw.d[i * 4 + 1] - bg[1]) + Math.abs(raw.d[i * 4 + 2] - bg[2]) < 40;
    const c = { w: pl.w, h: pl.h, d: Buffer.from(pl.d) }, bgm = new Uint8Array(c.w * c.h), st = p.borderSeeds(c).map(([x, y]) => y * c.w + x);
    while (st.length) { const i = st.pop(); if (bgm[i]) continue; const x = i % c.w, y = (i - x) / c.w; if (!isBg(i)) continue; bgm[i] = 1; if (x > 0) st.push(i - 1); if (x < c.w - 1) st.push(i + 1); if (y > 0) st.push(i - c.w); if (y < c.h - 1) st.push(i + c.w); }
    for (let i = 0; i < c.w * c.h; i++) if (bgm[i]) c.d.fill(0, i * 4, i * 4 + 4);
    const t = p.trim(c).img; const id = `${name.slice(-2)}_${k + 1}`;
    p.encode(t, `${WORK}/title_btn_${id}.png`); cands.push({ id, img: t });
    console.log(' ', id, `F=${F.toFixed(3)}`, t.w + 'x' + t.h, 'colors', p.countColors(t));
  });
}

// 비교 시트: 기존 버튼 3개 + 후보들을 6배 확대해 세로로 나열
const refs = ['T_Btn_RESUME', 'T_Btn_OPTION', 'T_Btn_RESTART'].map(n => ({ id: n, img: p.decode(`${OUT}/${n}.png`) }));
const all = refs.concat(cands), K = 5, W = Math.max(...all.map(a => a.img.w)) * K + 20, rowH = 33 * K + 14, sheet = p.blank(W, all.length * rowH + 10);
for (let i = 0; i < sheet.w * sheet.h; i++) { sheet.d[i * 4] = 28; sheet.d[i * 4 + 1] = 34; sheet.d[i * 4 + 2] = 48; sheet.d[i * 4 + 3] = 255; }
all.forEach((a, n) => { const up = p.nearestUp(a.img, K); for (let y = 0; y < up.h; y++) for (let x = 0; x < up.w; x++) { const s = (y * up.w + x) * 4; if (!up.d[s + 3]) continue; up.d.copy(sheet.d, ((10 + n * rowH + y) * sheet.w + 10 + x) * 4, s, s + 4); } });
p.encode(sheet, `${WORK}/title_btn_compare.png`);
console.log('compare sheet', sheet.w + 'x' + sheet.h);
