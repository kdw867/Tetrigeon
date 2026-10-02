// 수정 칸 합성: 생성한 수정 블록 7종을 기존 강화 칸(종류별 4칸)의 돌 부분에만 넣음. 외곽선·이음선은 원본 픽셀 그대로 (Unity에는 넣지 않음)
const p = require('../../PauseUI_VARCO/tools/pix.js'), path = require('path'), fs = require('fs');
const R = path.join(__dirname, '..'), U = R + '/../Tetrigeon/Assets/@Resources/Resources/MinoSprites/Upgraded';
const SRC = process.argv[2] || 'Crystal_Gpt_01'; // 사용할 생성 시트
const MODE = process.argv[3] || 'none'; // 색 보정: none(생성 색 그대로) / lesswhite(흰빛 줄이기) / seam(미노 색조) / deep(진한 보석색) / muted(차분하게)
const OUT = R + '/' + (process.argv[4] || 'parts/Crystal'); fs.mkdirSync(OUT, { recursive: true }); // 비교용 후보는 work 아래로
const TYPES = ['I', 'J', 'L', 'O', 'S', 'T', 'Z']; // 시트의 왼쪽부터 순서 (게임 TetrominoType 순서와 같음)
const N = 25; // 수정 블록 도트 크기 (강화 칸과 같은 약 25도트)
const mx = (d, i) => Math.max(d[i], d[i + 1], d[i + 2]), mn = (d, i) => Math.min(d[i], d[i + 1], d[i + 2]);
const isDark = (d, i) => d[i + 3] < 128 || mx(d, i) < 75; // 수정 블록의 외곽선 (또는 투명)

// 1. 시트에서 블록 7개 찾기 (흰 바탕이 아닌 열 구간)
const sheet = p.decode(`${R}/generated/${SRC}.png`);
const ink = (x, y) => { const i = (y * sheet.w + x) * 4; return sheet.d[i] < 200 || sheet.d[i + 1] < 200 || sheet.d[i + 2] < 200; };
const rects = []; { let on = false, s = 0; for (let x = 0; x <= sheet.w; x++) { let c = 0; if (x < sheet.w) for (let y = 0; y < sheet.h; y++) if (ink(x, y)) c++; const hit = c > 5; if (hit && !on) { s = x; on = true; } if (!hit && on) { rects.push([s, x - 1]); on = false; } } }
if (rects.length !== 7) throw new Error('블록 수가 7이 아님: ' + rects.length);
function clearWhite(img, min = 232) { // 테두리와 이어진 거의 흰색 픽셀만 투명화
  const { w, h, d } = img, seen = new Uint8Array(w * h), st = p.borderSeeds(img).map(([x, y]) => y * w + x);
  while (st.length) {
    const i = st.pop(); if (seen[i]) continue; seen[i] = 1;
    if (!(d[i * 4] >= min && d[i * 4 + 1] >= min && d[i * 4 + 2] >= min)) continue;
    d.fill(0, i * 4, i * 4 + 4); const x = i % w, y = (i - x) / w;
    if (x > 0) st.push(i - 1); if (x < w - 1) st.push(i + 1); if (y > 0) st.push(i - w); if (y < h - 1) st.push(i + w);
  }
}
function resize(img, W, H) { // 면적 평균 축소 (알파 가중)
  const o = p.blank(W, H), fx = img.w / W, fy = img.h / H;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let r = 0, g = 0, b = 0, a = 0, n = 0;
    for (let sy = Math.floor(y * fy); sy < Math.floor((y + 1) * fy); sy++) for (let sx = Math.floor(x * fx); sx < Math.floor((x + 1) * fx); sx++) { const i = (sy * img.w + sx) * 4, al = img.d[i + 3]; r += img.d[i] * al; g += img.d[i + 1] * al; b += img.d[i + 2] * al; a += al; n++; }
    const i = (y * W + x) * 4; if (a) { o.d[i] = r / a; o.d[i + 1] = g / a; o.d[i + 2] = b / a; } o.d[i + 3] = a / n >= 128 ? 255 : 0;
  }
  return o;
}
const tiles = rects.map(([x0, x1]) => { // 블록 → 흰 바탕 투명화 → 25×25 도트 → 블록마다 10색
  let t = sheet.h, b = 0; for (let y = 0; y < sheet.h; y++) for (let x = x0; x <= x1; x++) if (ink(x, y)) { t = Math.min(t, y); b = Math.max(b, y); }
  const c = p.crop(sheet, x0, t, x1 - x0 + 1, b - t + 1);
  clearWhite(c); // 테두리와 이어진 흰 바탕만 투명화 (외곽선 안 하이라이트는 보존)
  return p.kmeans(resize(c, N, N), 10, 20);
});
// 1-1. 색 보정: 색조는 그 미노 이음선 색(가장 선명한 픽셀)에 맞추고, 밝기 단계(면 모양)는 그대로 둠
function rgb2hsl(r, g, b) { r /= 255; g /= 255; b /= 255; const M = Math.max(r, g, b), m = Math.min(r, g, b), l = (M + m) / 2, d = M - m; if (!d) return [0, 0, l]; const s = d / (1 - Math.abs(2 * l - 1)); const h = M === r ? ((g - b) / d + 6) % 6 : M === g ? (b - r) / d + 2 : (r - g) / d + 4; return [h * 60, s, l]; }
function hsl2rgb(h, s, l) { const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2; const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]; return [r, g, b].map(v => Math.round((v + m) * 255)); }
const seamHue = T => { // 그 미노 강화 칸 4장에서 채도×밝기가 가장 큰 픽셀의 색조
  let best = -1, hue = 0;
  for (let k = 0; k < 4; k++) { const o = p.decode(`${U}/${T}_${k}.png`); for (let i = 0; i < o.w * o.h * 4; i += 4) { const M = mx(o.d, i), sc = (M - mn(o.d, i)) * M; if (sc > best) { best = sc; hue = rgb2hsl(o.d[i], o.d[i + 1], o.d[i + 2])[0]; } } }
  return hue;
};
if (MODE === 'lesswhite') tiles.forEach(tile => { // 흰빛 줄이기: 색조는 그대로, 왼쪽 위 반짝임만 남기고 흰빛 띠·컷 선을 블록 색의 밝은 톤으로
  const px = [];
  for (let i = 0; i < tile.w * tile.h * 4; i += 4) if (tile.d[i + 3] >= 128) px.push(rgb2hsl(tile.d[i], tile.d[i + 1], tile.d[i + 2]));
  const mids = px.filter(([, , l]) => l > 0.4 && l < 0.75).map(([, s]) => s).sort((a, b) => a - b), sMid = mids[mids.length >> 1]; // 중간 밝기 면의 채도
  for (let y = 0; y < tile.h; y++) for (let x = 0; x < tile.w; x++) {
    const i = (y * tile.w + x) * 4; if (tile.d[i + 3] < 128) continue;
    let [h, s, l] = rgb2hsl(tile.d[i], tile.d[i + 1], tile.d[i + 2]);
    if (l <= 0.78) continue; // 색이 있는 면은 그대로
    if (l > 0.9 && x < 9 && y < 9) continue; // 왼쪽 위 반짝임 유지
    l = l > 0.85 ? 0.78 : 0.72; s = Math.max(s, sMid); // 흰빛 → 밝은 색 톤 (두 단계 유지)
    [tile.d[i], tile.d[i + 1], tile.d[i + 2]] = hsl2rgb(h, s, l);
  }
});
if (MODE !== 'none' && MODE !== 'lesswhite') TYPES.forEach((T, ti) => {
  const tile = tiles[ti], hue = seamHue(T);
  for (let i = 0; i < tile.w * tile.h * 4; i += 4) {
    if (tile.d[i + 3] < 128) continue;
    let [h, s, l] = rgb2hsl(tile.d[i], tile.d[i + 1], tile.d[i + 2]);
    if (l < 0.18 || (s < 0.15 && l > 0.88)) continue; // 외곽선과 흰 반짝임은 그대로
    h = hue; // 미노 색조로 통일
    if (MODE === 'seam') s = Math.max(s, 0.9); // 밝기는 그대로, 색만 선명하게
    if (MODE === 'deep') { s = Math.min(1, s * 1.3 + 0.15); if (l < 0.9) l = 0.12 + (l - 0.12) * 0.72; } // 더 진한 보석색, 하이라이트는 유지
    if (MODE === 'muted') { s *= 0.55; l *= 0.92; } // 게임의 차분한 돌 색에 가깝게
    [tile.d[i], tile.d[i + 1], tile.d[i + 2]] = hsl2rgb(h, s, l);
  }
  console.log(T, 'hue', Math.round(hue));
});
const rotCW = (img) => { const o = p.blank(img.h, img.w); for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) img.d.copy(o.d, (x * o.w + (img.h - 1 - y)) * 4, (y * img.w + x) * 4, (y * img.w + x) * 4 + 4); return o; };

// 2. 수정 블록의 외곽선 안쪽 범위 (가운데 줄에서 바깥 어두운 픽셀을 건너뜀)
function innerOf(img, dark) {
  const { w, h, d } = img, my = h >> 1, mxx = w >> 1, at = (x, y) => (y * w + x) * 4;
  let l = 0; while (l < w && dark(d, at(l, my))) l++;
  let r = w - 1; while (r >= 0 && dark(d, at(r, my))) r--;
  let t = 0; while (t < h && dark(d, at(mxx, t))) t++;
  let b = h - 1; while (b >= 0 && dark(d, at(mxx, b))) b--;
  return [l, t, r, b];
}
// 강화 칸의 돌 범위: 가장자리에서 안쪽 40px 안의 마지막 선명한 이음선 색 다음, 어두운 외곽선(밝기 90 미만)까지 건너뛴 지점
const vivid = (d, i) => mx(d, i) > 120 && (mx(d, i) - mn(d, i)) / mx(d, i) > 0.4; // 이음선 본색 (흰빛 줄은 이 안쪽에 끼어 있음)
const outlineDark = (d, i) => d[i + 3] < 128 || mx(d, i) < 90; // 청회색 외곽선 (57,66,81 등)
function stoneRect(img) {
  const { w, h, d } = img, at = (x, y) => (y * w + x) * 4;
  const edge = (pt, len) => { // pt(k): 가장자리에서 k번째 픽셀 위치
    let s = 0; for (let k = 0; k < Math.min(40, len); k++) if (vivid(d, pt(k))) s = k + 1; // 마지막 이음선 색 다음
    while (s < len && outlineDark(d, pt(s))) s++; // 외곽선 건너뜀
    return s;
  };
  const my = h >> 1, mxx = w >> 1;
  return [edge(k => at(k, my), w), edge(k => at(mxx, k), h), w - 1 - edge(k => at(w - 1 - k, my), w), h - 1 - edge(k => at(mxx, h - 1 - k), h)];
}

// 3. 종류별 4칸 합성: 돌 범위 안은 수정 블록 안쪽을 최근접으로 채움, 바깥(외곽선·이음선)은 원본
const result = {};
TYPES.forEach((T, ti) => {
  let tile = tiles[ti]; if (T === 'L') tile = rotCW(tile); // L 원본은 게임에서 90° 돌려 쓰므로 미리 반대로 돌려 하이라이트를 왼쪽 위로 맞춤
  const [il, it, ir, ib] = innerOf(tile, isDark);
  for (let k = 0; k < 4; k++) {
    const o = p.decode(`${U}/${T}_${k}.png`), out = p.blank(o.w, o.h); o.d.copy(out.d);
    const [l, t, r, b] = stoneRect(o);
    for (let y = t; y <= b; y++) for (let x = l; x <= r; x++) {
      const tx = il + Math.min(ir - il, Math.floor((x - l + 0.5) / (r - l + 1) * (ir - il + 1))), ty = it + Math.min(ib - it, Math.floor((y - t + 0.5) / (b - t + 1) * (ib - it + 1)));
      const s = (ty * tile.w + tx) * 4; if (tile.d[s + 3] < 128) continue; // 수정 블록의 둥근 모서리 바깥은 원본 유지
      tile.d.copy(out.d, (y * o.w + x) * 4, s, s + 3); out.d[(y * o.w + x) * 4 + 3] = 255;
    }
    p.encode(out, `${OUT}/${T}_${k}.png`);
    result[`${T}_${k}`] = { size: [o.w, o.h], stone: [l, t, r, b], tileInner: [il, it, ir, ib] };
  }
});
if (!process.argv[4]) fs.writeFileSync(R + '/work/crystal_cells.json', JSON.stringify(result, null, 1)); // 확정 출력일 때만 기록
TYPES.forEach(T => p.encode(p.nearestUp(tiles[TYPES.indexOf(T)], 8, [30, 40, 62]), `${R}/work/tile_${T}_x8.png`)); // 블록 확인용
console.log(SRC, 'rects', JSON.stringify(rects), '\n' + TYPES.map(T => `${T}: stone ${result[T + '_0'].stone} tileInner ${result[T + '_0'].tileInner}`).join('\n'));
