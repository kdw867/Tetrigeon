// 9단계: 결과 창 제목판(DEFEAT, VICTORY) 후보. 생성 시트(제목판 2개)에서 잘라 PAUSE 제목판과 같은 높이(42px)로 축소하고 공용 팔레트로 맞춤
const p = require('./pix.js'), path = require('path');
const R = path.join(__dirname, '..'), G = R + '/generated', OUT = R + '/parts', WORK = R + '/work';
const SHEETS = process.argv.slice(2).length ? process.argv.slice(2) : ['J_ResultTitles_01', 'J_ResultTitles_02'];
const TITLE_H = 42; // 기존 T_Title_PAUSE 높이 (원본 px)

const ROUND2 = ['T_Panel_Blank', 'T_Title_PAUSE', 'T_Btn_RESUME', 'T_Btn_OPTION', 'T_Btn_RESTART', 'T_Slider_Track', 'T_Slider_Fill', 'T_Slider_Handle']; // 공용 팔레트 (step4_round3와 같음)
const pal = new Set();
for (const f of ROUND2) { const im = p.decode(`${OUT}/${f}.png`); for (let i = 0; i < im.w * im.h; i++) if (im.d[i * 4 + 3]) pal.add(im.d.readUInt32BE(i * 4) >>> 8); }
const PAL = [...pal].map(k => [k >> 16 & 255, k >> 8 & 255, k & 255]);
function toPalette(src) {
  const img = { w: src.w, h: src.h, d: Buffer.from(src.d) };
  for (let i = 0; i < img.w * img.h; i++) {
    let best = 0, bd = 1e9; const r = img.d[i * 4], g = img.d[i * 4 + 1], b = img.d[i * 4 + 2];
    PAL.forEach((c, j) => { const dd = (r - c[0]) ** 2 + (g - c[1]) ** 2 + (b - c[2]) ** 2; if (dd < bd) { bd = dd; best = j; } });
    img.d[i * 4] = PAL[best][0]; img.d[i * 4 + 1] = PAL[best][1]; img.d[i * 4 + 2] = PAL[best][2];
  }
  return img;
}
// 시트에서 배경과 다른 덩어리를 세로 띠로 찾고, 각 띠의 가로 범위를 구함. 띠가 3개 이상이면 창 테두리 등이 섞인 것
function bands(img, bg, tol) {
  const diff = (x, y) => { const i = (y * img.w + x) * 4; return Math.abs(img.d[i] - bg[0]) + Math.abs(img.d[i + 1] - bg[1]) + Math.abs(img.d[i + 2] - bg[2]) > tol; };
  const rows = []; for (let y = 0; y < img.h; y++) { let c = 0; for (let x = 0; x < img.w; x += 2) if (diff(x, y)) c++; rows.push(c > 12); }
  const out = []; let s = -1;
  for (let y = 0; y <= img.h; y++) { if (y < img.h && rows[y]) { if (s < 0) s = y; } else if (s >= 0) { if (y - s > 40) out.push([s, y - 1]); s = -1; } }
  return out.map(([y0, y1]) => { let x0 = img.w, x1 = -1; for (let y = y0; y <= y1; y++) for (let x = 0; x < img.w; x++) if (diff(x, y)) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); } return { x0, y0, x1, y1 }; });
}
const cands = [];
for (const name of SHEETS) {
  const src = p.decode(`${G}/${name}.png`), bg = [...src.d.subarray(0, 3)], bs = bands(src, bg, 28);
  console.log(name, 'bands', bs.map(b => `${b.x0},${b.y0}-${b.x1},${b.y1} (${b.x1 - b.x0 + 1}x${b.y1 - b.y0 + 1})`).join(' | '));
  bs.forEach((b, k) => {
    const label = k === 0 ? 'DEFEAT' : 'VICTORY', m = 6, x0 = Math.max(0, b.x0 - m), y0 = Math.max(0, b.y0 - m), w = Math.min(src.w, b.x1 + m + 1) - x0, h = Math.min(src.h, b.y1 + m + 1) - y0;
    const F = (b.y1 - b.y0 + 1) / TITLE_H, raw = p.boxDown(p.crop(src, x0, y0, w, h), F), pl = toPalette(raw); // 제목판 높이가 42px이 되는 배율
    const isBg = i => Math.abs(raw.d[i * 4] - bg[0]) + Math.abs(raw.d[i * 4 + 1] - bg[1]) + Math.abs(raw.d[i * 4 + 2] - bg[2]) < 40;
    const c = { w: pl.w, h: pl.h, d: Buffer.from(pl.d) }, bgm = new Uint8Array(c.w * c.h), st = p.borderSeeds(c).map(([x, y]) => y * c.w + x);
    while (st.length) { const i = st.pop(); if (bgm[i]) continue; const x = i % c.w, y = (i - x) / c.w; if (!isBg(i)) continue; bgm[i] = 1; if (x > 0) st.push(i - 1); if (x < c.w - 1) st.push(i + 1); if (y > 0) st.push(i - c.w); if (y < c.h - 1) st.push(i + c.w); }
    for (let i = 0; i < c.w * c.h; i++) if (bgm[i]) c.d.fill(0, i * 4, i * 4 + 4);
    const t = p.trim(c).img, id = `${label}_${name.slice(-2)}`;
    p.encode(t, `${WORK}/result_title_${id}.png`); cands.push({ id, img: t });
    console.log(' ', id, `F=${F.toFixed(3)}`, t.w + 'x' + t.h, 'colors', p.countColors(t));
  });
}
// 비교 시트: PAUSE 제목판 + 후보들을 5배 확대
const all = [{ id: 'T_Title_PAUSE', img: p.decode(`${OUT}/T_Title_PAUSE.png`) }].concat(cands), K = 5, W = Math.max(...all.map(a => a.img.w)) * K + 20, rowH = 42 * K + 14, sheet = p.blank(W, all.length * rowH + 10);
for (let i = 0; i < sheet.w * sheet.h; i++) { sheet.d[i * 4] = 28; sheet.d[i * 4 + 1] = 34; sheet.d[i * 4 + 2] = 48; sheet.d[i * 4 + 3] = 255; }
all.forEach((a, n) => { const up = p.nearestUp(a.img, K); for (let y = 0; y < up.h; y++) for (let x = 0; x < up.w; x++) { const s = (y * up.w + x) * 4; if (!up.d[s + 3]) continue; up.d.copy(sheet.d, ((10 + n * rowH + y) * sheet.w + 10 + x) * 4, s, s + 4); } });
p.encode(sheet, `${WORK}/result_titles_compare.png`);
console.log('compare sheet', sheet.w + 'x' + sheet.h);
