// 2단계: 축소본에서 파츠 분리 + 투명 배경
const p = require('./pix.js'), path = require('path'), fs = require('fs');
const R = path.join(__dirname, '..'), OUT = R + '/parts', PRE = R + '/parts/preview';
fs.mkdirSync(PRE, { recursive: true });
const A = p.decode(R + '/work/A01_down.png'), B = p.decode(R + '/work/B01_down.png');
const L = (img, i) => img.d[i * 4] * 0.3 + img.d[i * 4 + 1] * 0.59 + img.d[i * 4 + 2] * 0.11;
// 배경/패널 안쪽 남색 판정 (밝기 낮고 파랑 우세)
const isNavy = (c, i) => { const l = L(c, i); return l >= 28 && l <= 52 && c.d[i * 4 + 2] > c.d[i * 4] + 15; };

// 대략 박스 안에서, 테두리에서 연결된 남색만 지운 뒤 중심과 연결된 덩어리만 남김
function extract(img, x0, y0, x1, y1) {
  const c = p.crop(img, x0, y0, x1 - x0, y1 - y0), { w, h, d } = c, seen = new Uint8Array(w * h), st = [];
  for (const [x, y] of p.borderSeeds(c)) st.push(y * w + x);
  while (st.length) { // 남색 배경만 따라 바깥 제거 (돌 테두리에서 멈춤)
    const i = st.pop(); if (seen[i]) continue; seen[i] = 1;
    if (!isNavy(c, i)) continue;
    d[i * 4 + 3] = 0;
    const x = i % w, y = (i - x) / w;
    if (x > 0) st.push(i - 1); if (x < w - 1) st.push(i + 1); if (y > 0) st.push(i - w); if (y < h - 1) st.push(i + w);
  }
  const keep = new Uint8Array(w * h), q = [((h >> 1) * w + (w >> 1))]; // 중심 연결 성분 (8방향)
  while (q.length) {
    const i = q.pop(); if (keep[i] || !d[i * 4 + 3]) continue; keep[i] = 1;
    const x = i % w, y = (i - x) / w;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < w && ny < h) q.push(ny * w + nx); }
  }
  for (let i = 0; i < w * h; i++) if (!keep[i]) d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = d[i * 4 + 3] = 0;
  const t = p.trim(c); return { img: t.img, x: x0 + t.x0, y: y0 + t.y0 };
}

const save = (name, img) => { p.encode(img, `${OUT}/${name}.png`); p.encode(p.nearestUp(img, 6, [255, 0, 255]), `${PRE}/${name}_x6.png`); console.log(name, img.w + 'x' + img.h, 'colors', p.countColors(img)); };

const parts = {
  T_Title_PAUSE: extract(A, 86, 30, 241, 80),
  T_Btn_RESUME: extract(A, 99, 82, 228, 123),
  T_Btn_OPTION: extract(A, 99, 121, 228, 161),
  T_Btn_RESTART: extract(A, 99, 160, 228, 200),
  T_Slider_Track: extract(B, 17, 9, 358, 64),
  T_Slider_Handle: extract(B, 165, 148, 211, 196),
};
// 제목판 양 끝에 붙은 패널 테두리 조각 제거 (crop 기준 x<=5, x>=149)
{ const t = parts.T_Title_PAUSE, ox = t.x - 86; for (let y = 0; y < t.img.h; y++) for (let x = 0; x < t.img.w; x++) { const cx = x + ox; if (cx <= 5 || cx >= 149) t.img.d.fill(0, (y * t.img.w + x) * 4, (y * t.img.w + x) * 4 + 4); } const tt = p.trim(t.img); t.img = tt.img; t.x += tt.x0; t.y += tt.y0; }

// 슬라이더 채움: 채워진 트랙에서 청록색 막대만 추출
{ const c = p.crop(B, 34, 89, 204, 30); for (let i = 0; i < c.w * c.h; i++) { const r = c.d[i * 4], g = c.d[i * 4 + 1], b = c.d[i * 4 + 2]; if (!(g > r + 40 && b > r + 40)) c.d.fill(0, i * 4, i * 4 + 4); } const t = p.trim(c); parts.T_Slider_Fill = { img: t.img, x: 34 + t.x0, y: 89 + t.y0 }; }

for (const [k, v] of Object.entries(parts)) { save(k, v.img); console.log('  at', v.x, v.y); }

// 빈 패널: 바깥 배경 제거 후 버튼·제목판 자리를 안쪽 남색/테두리로 메움
{
  const P = { w: A.w, h: A.h, d: Buffer.from(A.d) }, idx = (x, y) => y * P.w + x;
  const st = p.borderSeeds(P).map(([x, y]) => idx(x, y)), seen = new Uint8Array(P.w * P.h);
  while (st.length) { const i = st.pop(); if (seen[i]) continue; seen[i] = 1; if (!isNavy(P, i)) continue; P.d.fill(0, i * 4, i * 4 + 4); const x = i % P.w, y = (i - x) / P.w; if (x > 0) st.push(i - 1); if (x < P.w - 1) st.push(i + 1); if (y > 0) st.push(i - P.w); if (y < P.h - 1) st.push(i + P.w); }
  const hist = {}; for (let y = 90; y < 200; y++) for (let x = 60; x < 100; x++) { const i = idx(x, y); if (isNavy(P, i)) { const k = P.d.readUInt32BE(i * 4); hist[k] = (hist[k] || 0) + 1; } }
  const navy = +Object.entries(hist).sort((a, b) => b[1] - a[1])[0][0]; // 안쪽 최빈 남색
  const fillMask = (part, fn) => { for (let y = 0; y < part.img.h; y++) for (let x = 0; x < part.img.w; x++) if (part.img.d[(y * part.img.w + x) * 4 + 3]) fn(part.x + x, part.y + y); };
  const navyAt = (x, y) => P.d.writeUInt32BE(navy >>> 0, idx(x, y) * 4);
  for (const k of ['T_Btn_RESUME', 'T_Btn_OPTION', 'T_Btn_RESTART']) { const b = parts[k]; for (let y = b.y - 1; y <= b.y + b.img.h; y++) for (let x = b.x - 1; x <= b.x + b.img.w; x++) navyAt(x, y); } // 버튼 자리 + 1px 여유
  // 제목판 자리: 이음매 없는 위 테두리 열(x=81)을 복사 (y<62: 투명·돌·외곽선 그대로), 그 아래는 남색
  const SRC = 81, BOT = 62, t = parts.T_Title_PAUSE;
  for (let x = t.x - 2; x < t.x + t.img.w + 2; x++) for (let y = t.y - 1; y < t.y + t.img.h + 2; y++) {
    if (y < BOT) P.d.copy(P.d, idx(x, y) * 4, idx(SRC, y) * 4, idx(SRC, y) * 4 + 4); else navyAt(x, y);
  }
  const tp = p.trim(P); save('T_Panel_Blank', tp.img);
  parts.T_Panel_Blank = { img: tp.img, x: tp.x0, y: tp.y0 }; // 아래에서 위치 기록
}
fs.writeFileSync(R + '/work/parts_pos.json', JSON.stringify(Object.fromEntries(Object.entries(parts).map(([k, v]) => [k, { x: v.x, y: v.y, w: v.img.w, h: v.img.h }])), null, 1));
