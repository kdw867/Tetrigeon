// 1단계: 카드 틀(K_Card_02) 후처리. 바깥 배경 제거 → 도트 피치(6px)로 축소 → 공용 팔레트 → 좌우·상하 대칭 → 안쪽 장식 그리기
const p = require('../../PauseUI_VARCO/tools/pix.js'), path = require('path');
const R = path.join(__dirname, '..'), PAUSE = R + '/../PauseUI_VARCO/parts', G = R + '/generated', PART = R + '/parts', WORK = R + '/work';
const [src = 'K_Card_02', FS = '6'] = process.argv.slice(2);
const F = +FS;

// 일시정지 창 파츠 8개의 31색을 공용 팔레트로 사용 (창마다 색이 달라지지 않게)
const ROUND2 = ['T_Panel_Blank', 'T_Title_PAUSE', 'T_Btn_RESUME', 'T_Btn_OPTION', 'T_Btn_RESTART', 'T_Slider_Track', 'T_Slider_Fill', 'T_Slider_Handle'];
const pal = new Set();
for (const f of ROUND2) { const im = p.decode(`${PAUSE}/${f}.png`); for (let i = 0; i < im.w * im.h; i++) if (im.d[i * 4 + 3]) pal.add(im.d.readUInt32BE(i * 4) >>> 8); }
const PAL = [...pal].map(k => [k >> 16 & 255, k >> 8 & 255, k & 255]);
const toPalette = (src) => { const img = { w: src.w, h: src.h, d: Buffer.from(src.d) }; for (let i = 0; i < img.w * img.h; i++) { let best = 0, bd = 1e9; const r = img.d[i * 4], g = img.d[i * 4 + 1], b = img.d[i * 4 + 2]; PAL.forEach((c, j) => { const dd = (r - c[0]) ** 2 + (g - c[1]) ** 2 + (b - c[2]) ** 2; if (dd < bd) { bd = dd; best = j; } }); img.d[i * 4] = PAL[best][0]; img.d[i * 4 + 1] = PAL[best][1]; img.d[i * 4 + 2] = PAL[best][2]; } return img; };

const im = p.decode(`${G}/${src}.png`), bg = [...im.d.subarray(0, 3)];
// 카드 바운딩 박스: 바깥 배경과 충분히 다른 픽셀 (카드 바깥 가장자리는 어두운 외곽선)
const isFg = (x, y) => { const i = (y * im.w + x) * 4; return Math.abs(im.d[i] - bg[0]) + Math.abs(im.d[i + 1] - bg[1]) + Math.abs(im.d[i + 2] - bg[2]) > 40; };
let x0 = im.w, y0 = im.h, x1 = -1, y1 = -1; for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) if (isFg(x, y)) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
console.log('카드 박스', x0, y0, x1, y1, '=', x1 - x0 + 1, 'x', y1 - y0 + 1);
const W = Math.round((x1 - x0 + 1) / F), H = Math.round((y1 - y0 + 1) / F);
// 박스 크기를 F의 정수배로 맞춰 자름 (박스 중심 기준)
const cw = Math.round(W * F), ch = Math.round(H * F), cx = Math.round((x0 + x1) / 2 - cw / 2 + 0.5), cy = Math.round((y0 + y1) / 2 - ch / 2 + 0.5);
const raw = p.boxDown(p.crop(im, cx, cy, cw, ch), F), pl = toPalette(raw);
console.log('축소', raw.w, 'x', raw.h);
// 바깥 배경 제거: 가장자리에서 이어진 배경색(팔레트 적용 전 기준)
const isBg = i => Math.abs(raw.d[i * 4] - bg[0]) + Math.abs(raw.d[i * 4 + 1] - bg[1]) + Math.abs(raw.d[i * 4 + 2] - bg[2]) < 40;
const c = { w: pl.w, h: pl.h, d: Buffer.from(pl.d) }, bgm = new Uint8Array(c.w * c.h), st = p.borderSeeds(c).map(([x, y]) => y * c.w + x);
while (st.length) { const i = st.pop(); if (bgm[i]) continue; const x = i % c.w, y = (i - x) / c.w; if (!isBg(i)) continue; bgm[i] = 1; if (x > 0) st.push(i - 1); if (x < c.w - 1) st.push(i + 1); if (y > 0) st.push(i - c.w); if (y < c.h - 1) st.push(i + c.w); }
for (let i = 0; i < c.w * c.h; i++) if (bgm[i]) c.d.fill(0, i * 4, i * 4 + 4);
const t = p.trim(c).img;
p.encode(t, `${WORK}/card_${src}_raw.png`);
console.log('트림', t.w, 'x', t.h, 'colors', p.countColors(t));
