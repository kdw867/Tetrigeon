// VARCO 로고 격자 맞춤: 생성본의 블록을 하나씩 찾아 글자별 격자 칸(5줄)에 배정 → 모든 블록을 25도트 같은 크기로 반듯하게 다시 배치
// 수정 블록은 확정 수정(MinoCrystal_VARCO lesswhite)으로, 외곽선·그림자는 코드로 다시 그림. 화면에는 2배 (Unity에는 넣지 않음)
const path = require('path'), px = require('../../PauseUI_VARCO/tools/pix.js'), logo = require('./mino_logo.js');
const ROOT = path.join(__dirname, '..'), CRY = ROOT + '/../MinoCrystal_VARCO/work';
const VARIANT = process.argv[3] || '0'; const SRC = process.argv[2] || 'Logo_Grid_01', N = 25, ROWS = 5, LGAP = 14; // 블록 도트 크기, 줄 수, 글자 사이 간격(도트, 약 반 칸)
const WIDTH = { N: 4 }, PATTERN = { N: ['X..X', 'XX.X', 'X.XX', 'X..X', 'X..X'] };
if ((process.argv[3] || '0') === 'C') { WIDTH.G = 4; PATTERN.G = ['XXXX', 'X...', 'X.XX', 'X..X', 'XXXX']; } // G만 4칸 폭, 안쪽 가로대 두 칸 // 생성본이 대각선을 칸 사이에 그린 글자는 정해진 모양으로
const WORD = 'TETRIGEON';
const hsl = (d, i) => { const r = d[i] / 255, g = d[i + 1] / 255, b = d[i + 2] / 255, M = Math.max(r, g, b), m = Math.min(r, g, b), l = (M + m) / 2, dd = M - m; const s = dd ? dd / (1 - Math.abs(2 * l - 1)) : 0; let h = 0; if (dd) h = M === r ? ((g - b) / dd + 6) % 6 : M === g ? (b - r) / dd + 2 : (r - g) / dd + 4; return [h * 60, s, l]; };
function comps(w, h, test) { // 조건에 맞는 픽셀의 연결 영역 (사각 범위와 픽셀 수)
  const seen = new Uint8Array(w * h), out = [];
  for (let i = 0; i < w * h; i++) {
    if (seen[i] || !test(i)) continue;
    const st = [i]; seen[i] = 1; let n = 0, x0 = w, y0 = h, x1 = 0, y1 = 0;
    while (st.length) { const j = st.pop(), x = j % w, y = (j / w) | 0; n++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; for (const k of [x > 0 ? j - 1 : -1, x < w - 1 ? j + 1 : -1, j - w, j + w]) if (k >= 0 && k < w * h && !seen[k] && test(k)) { seen[k] = 1; st.push(k); } }
    out.push({ n, x0, y0, x1, y1, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 });
  }
  return out;
}
function resize(img, W, H) { // 면적 평균 축소
  const o = px.blank(W, H), fx = img.w / W, fy = img.h / H;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let r = 0, g = 0, b = 0, n = 0;
    for (let sy = Math.floor(y * fy); sy < Math.floor((y + 1) * fy); sy++) for (let sx = Math.floor(x * fx); sx < Math.floor((x + 1) * fx); sx++) { const i = (sy * img.w + sx) * 4; r += img.d[i]; g += img.d[i + 1]; b += img.d[i + 2]; n++; }
    const i = (y * W + x) * 4; o.d[i] = r / n; o.d[i + 1] = g / n; o.d[i + 2] = b / n; o.d[i + 3] = 255;
  }
  return o;
}

// 1. 블록 면 찾기: 바탕(거의 흰색)·어두운 외곽선이 아닌 픽셀 → 2px 깎아 붙은 블록 분리 → 연결 영역
const src = px.decode(`${ROOT}/generated/${SRC}.png`), { w, h, d } = src;
const face = new Uint8Array(w * h);
for (let i = 0; i < w * h; i++) { const r = d[i * 4], g = d[i * 4 + 1], b = d[i * 4 + 2]; face[i] = Math.max(r, g, b) > 75 && !(r >= 232 && g >= 232 && b >= 232) ? 1 : 0; }
const ER = 3, er = new Uint8Array(w * h); // 이음선이 블록을 잇지 않게 3px 깎음
for (let y = ER; y < h - ER; y++) for (let x = ER; x < w - ER; x++) { let ok = 1; for (let k = -ER; k <= ER && ok; k++) if (!face[y * w + x + k] || !face[(y + k) * w + x]) ok = 0; er[y * w + x] = ok; }
let blocks = comps(w, h, i => er[i]).filter(c => c.n > 300).map(c => ({ ...c, x0: c.x0 - ER, y0: c.y0 - ER, x1: c.x1 + ER, y1: c.y1 + ER }));
const P = (() => { const s = blocks.map(b => b.y1 - b.y0 + 1).sort((a, b) => a - b); return s[s.length >> 1]; })(); // 블록 면 크기 중앙값 (붙은 블록 나누는 기준)
blocks = blocks.flatMap(b => { // 가로·세로로 붙은 블록은 크기로 나눔
  const nx = Math.max(1, Math.round((b.x1 - b.x0 + 1) / P)), ny = Math.max(1, Math.round((b.y1 - b.y0 + 1) / P)), out = [];
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const x0 = b.x0 + Math.round(i * (b.x1 - b.x0 + 1) / nx), y0 = b.y0 + Math.round(j * (b.y1 - b.y0 + 1) / ny), x1 = b.x0 + Math.round((i + 1) * (b.x1 - b.x0 + 1) / nx) - 1, y1 = b.y0 + Math.round((j + 1) * (b.y1 - b.y0 + 1) / ny) - 1; out.push({ x0, y0, x1, y1, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 }); }
  return out;
});

// 2. 글자 나누기: 블록 중심 x를 정렬해 큰 틈(블록 크기의 0.35배 넘게, 글자 안 블록 틈은 약 6px)에서 끊음 → 9글자
blocks.sort((a, b) => a.cx - b.cx);
const letters = [[]]; blocks.forEach((b, i) => { if (i && b.x0 - Math.max(...letters[letters.length - 1].map(q => q.x1)) > P * 0.35) letters.push([]); letters[letters.length - 1].push(b); });
if (letters.length !== WORD.length) throw new Error('글자 수 ' + letters.length + ' (블록 ' + blocks.length + ')');
const top = Math.min(...blocks.map(b => b.y0)), bot = Math.max(...blocks.map(b => b.y1)), rowH = (bot - top + 1) / ROWS; // 단어 전체 5줄

// 3. 확정 수정 블록 25×25 (×8 미리보기를 칸 중심에서 샘플, 미리보기 바탕색은 투명)
const TYPE_BY_HUE = [[183, 'I'], [225, 'J'], [30, 'L'], [54, 'O'], [102, 'S'], [275, 'T'], [3, 'Z']];
const tiles = {};
for (const [, T] of TYPE_BY_HUE) {
  const s = px.decode(`${CRY}/tile_${T}_x8.png`), o = px.blank(N, N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const i = ((y * 8 + 4) * s.w + x * 8 + 4) * 4; if (s.d[i] === 30 && s.d[i + 1] === 40 && s.d[i + 2] === 62) continue; s.d.copy(o.d, (y * N + x) * 4, i, i + 3); o.d[(y * N + x) * 4 + 3] = 255; }
  tiles[T] = o;
}
const hueDist = (a, b) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b));

// 4. 글자마다 칸 배정 → 블록 그림: 수정이면 확정 수정, 아니면 생성본 블록을 잘라 25×25로
const GAPC = [9, 12, 19]; // 블록 사이 틈 색 (확정 수정 둥근 모서리 바깥도 이 색)
const cellsOut = []; let cursor = 0; const report = [];
letters.forEach((L, li) => {
  const ch = WORD[li], x0 = Math.min(...L.map(b => b.x0)), x1 = Math.max(...L.map(b => b.x1)), nc = WIDTH[ch] || Math.max(1, Math.round((x1 - x0 + 1) / rowH)), colW = (x1 - x0 + 1) / nc;
  const grid = {};
  for (const b of L) {
    const r = Math.min(ROWS - 1, Math.floor((b.cy - top) / rowH)), c = Math.min(nc - 1, Math.floor((b.cx - x0) / colW)), k = r + ',' + c;
    if (PATTERN[ch] && PATTERN[ch][r][c] !== 'X') continue; // 정해진 모양 밖의 블록은 버림
    if (!grid[k]) grid[k] = b; // 같은 칸에 둘이면 먼저 것
  }
  if (PATTERN[ch]) PATTERN[ch].forEach((row, r) => [...row].forEach((v, c) => { if (v === 'X' && !grid[r + ',' + c]) { const near = L.filter(b => Math.floor((b.cy - top) / rowH) === r).sort((a, b) => Math.abs(a.cx - (x0 + (c + 0.5) * colW)) - Math.abs(b.cx - (x0 + (c + 0.5) * colW)))[0]; if (near) grid[r + ',' + c] = near; } })); // 빈 칸은 같은 줄의 가장 가까운 블록 그림으로
  const kinds = [];
  for (const [k, b] of Object.entries(grid)) {
    const [r, c] = k.split(',').map(Number);
    let cry = 0, n = 0; const hues = [];
    for (let y = b.y0; y <= b.y1; y++) for (let x = b.x0; x <= b.x1; x++) { const [hh, s, l] = hsl(d, (y * w + x) * 4); n++; if (s > 0.45 && l > 0.35 && l < 0.92) { cry++; hues.push(hh); } }
    let tile;
    if (cry / n > 0.55) { hues.sort((a, b) => a - b); const hue = hues[hues.length >> 1], T = TYPE_BY_HUE.slice().sort((a, b) => hueDist(a[0], hue) - hueDist(b[0], hue))[0][1]; tile = tiles[T]; kinds.push(T); }
    else { const m = Math.round(rowH * 0.06); tile = resize(px.crop(src, b.x0 - m, b.y0 - m, b.x1 - b.x0 + 1 + 2 * m, b.y1 - b.y0 + 1 + 2 * m), N, N); kinds.push('s'); } // 블록 면 + 둘레 이음선 조금
    cellsOut.push({ x: cursor + c * N, y: r * N, tile });
  }
  if (ch === 'G' && VARIANT === 'C') { const bar = cellsOut.find(c => c.x === cursor + 2 * N && c.y === 2 * N); if (bar) bar.tile = tiles.S; kinds.push('S'); } // 가로대 첫 칸을 초록 수정으로
  else if (ch === 'G' && VARIANT !== '0') { // G 가운데 칸(2줄째, 가운데 열)에 확정 초록 수정 추가
    cellsOut.push({ x: cursor + 1 * N, y: 2 * N, tile: tiles.S }); kinds.push('S');
    if (VARIANT === 'B') { const stone = cellsOut.find(c => c.x === cursor + 2 * N && c.y === 2 * N), cry = cellsOut.find(c => c.x === cursor + 2 * N && c.y === 3 * N); if (stone && cry) cry.tile = stone.tile; } // 오른쪽 아래 수정은 위 돌과 같은 돌로
  }
  report.push(`${ch}:${nc}x${ROWS} ${Object.keys(grid).length}칸 [${kinds.join('')}]`);
  cursor += nc * N + LGAP;
});

// 5. 그리기: 칸 틈 색 바탕 위에 블록 → 외곽선 4도트 + 그림자 4도트 (생성본에서 잰 남색)
const W = cursor - LGAP, img = px.blank(W, ROWS * N);
for (const { x, y, tile } of cellsOut) for (let yy = 0; yy < N; yy++) for (let xx = 0; xx < N; xx++) {
  const s = (yy * N + xx) * 4, di = ((y + yy) * W + x + xx) * 4;
  if (tile.d[s + 3] < 128) { img.d[di] = GAPC[0]; img.d[di + 1] = GAPC[1]; img.d[di + 2] = GAPC[2]; } else tile.d.copy(img.d, di, s, s + 3);
  img.d[di + 3] = 255;
}
const out = logo.dropShadow(logo.ring(img, 4, [21, 28, 39]), 4, GAPC); // 외곽선 4도트 + 그림자 4도트
const pad = px.blank(out.w + 2, out.h + 2); for (let y = 0; y < out.h; y++) out.d.copy(pad.d, ((y + 1) * pad.w + 1) * 4, y * out.w * 4, (y + 1) * out.w * 4); // 가장자리 1도트 여백
px.encode(pad, `${ROOT}/work/T_Title_Logo_G_${VARIANT}.png`); // 확정본(parts)은 덮어쓰지 않음
px.encode(px.nearestUp(pad, 4, [30, 40, 62]), `${ROOT}/work/T_Title_Logo_G_${VARIANT}_x4.png`);

// 6. 타이틀 미리보기에 2배로 (화면 위쪽 가운데)
const bg = px.decode(`${ROOT}/preview/Title_Layers_FHD.png`), C = 2, ox = (bg.w - pad.w * C) >> 1, oy = 50;
for (let y = 0; y < pad.h * C; y++) for (let x = 0; x < pad.w * C; x++) { const s = (((y / C) | 0) * pad.w + ((x / C) | 0)) * 4; if (!pad.d[s + 3]) continue; pad.d.copy(bg.d, ((oy + y) * bg.w + ox + x) * 4, s, s + 3); }
px.encode(bg, `${ROOT}/preview/Title_Logo_G_${VARIANT}_FHD.png`);
console.log(SRC, 'blocks', blocks.length, 'face', P, 'rowH', rowH.toFixed(1), '\n' + report.join('\n'), '\nlogo', pad.w + 'x' + pad.h, 'screen', pad.w * C + 'x' + pad.h * C, 'at', ox + ',' + oy);
