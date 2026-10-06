// TETRIGEON 로고: 글자마다 실제 테트로미노 7종으로 빈칸 없이 채우고, 게임의 돌 미노 아트(T_Mino_Connected)로 그린다.
// 게임과 같은 회전 규칙(TetrominoData 칸 순서 + PieceVisuals.GetArtRotation)을 따른다. 외부 의존성 없음.
const path = require('path');
const px = require('../../PauseUI_VARCO/tools/pix.js');
const ROOT = path.join(__dirname, '..');
const SHEET = path.join(ROOT, '../Tetrigeon/Assets/@Resources/Resources/MinoSprites/T_Mino_Connected.png');
const cells = require(path.join(ROOT, 'data/cells.json')); // 종류별 회전 4개의 칸 좌표 (Unity에서 추출, y 위쪽 +)
const rects = require(path.join(ROOT, 'data/sprites.json')); // 칸별 스프라이트 영역 (Unity 좌표, y 아래쪽 0)

const CELL = 25; // 게임 보드 미노와 같은 FHD 화면 크기 (27px 칸 안의 25px 아트)
const TYPES = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];

// 글자 모양 (X = 블록, 높이 6칸, 세로획 2칸·가로획 1칸). 칸 수가 4의 배수여야 테트로미노로 빈칸 없이 채워진다.
const FONT = {
  T: ['XXXXXX', '..XX..', '..XX..', '..XX..', '..XX..', '..XX..'],
  E: ['XXXXX', 'XX...', 'XXXX.', 'XX...', 'XX...', 'XXXXX'],
  R: ['XXXX.', 'XX.XX', 'XXXX.', 'XX.XX', 'XX.XX', 'XX.XX'],
  I: ['XXXX', '.XX.', '.XX.', '.XX.', '.XX.', 'XXXX'],
  G: ['XXXXX', 'XX...', 'XX.XX', 'XX.XX', 'XX.XX', 'XXXXX'],
  O: ['XXXX.', 'XX.XX', 'XX.XX', 'XX.XX', 'XX.XX', '.XXXX'],
  N: ['XX..XX', 'XXX.XX', 'XXXXXX', 'XX.XXX', 'XX..XX', 'XX..XX'],
};

// 시트에서 칸 하나를 잘라 CELL×CELL로 최근접 샘플링 (Unity Point 필터와 같은 방식)
const sheet = px.decode(SHEET);
const UPGRADED = path.join(path.dirname(SHEET), 'Upgraded'); // 강화 미노 칸 아트 (종류_칸번호.png, 일반 미노와 같은 칸 순서)
const CRYSTAL = path.join(ROOT, '../MinoCrystal_VARCO/parts/Crystal'); // 확정한 수정 칸 아트 (강화 칸과 같은 크기·이름)
function cellTile(name, upgraded) { // upgraded: false/'N' 일반, true/'U' 강화, 'C' 수정
  let src = sheet, x, y, w, h;
  if (upgraded && upgraded !== 'N') { src = px.decode(path.join(upgraded === 'C' ? CRYSTAL : UPGRADED, name + '.png')); x = 0; y = 0; w = src.w; h = src.h; }
  else { [x, y, w, h] = rects[name]; y = sheet.h - (y + h); } // 시트 영역은 Unity 좌표(아래 0)라 위 기준으로 변환
  const o = px.blank(CELL, CELL);
  for (let Y = 0; Y < CELL; Y++) for (let X = 0; X < CELL; X++) {
    const sx = x + Math.floor((X + 0.5) * w / CELL), sy = y + Math.floor((Y + 0.5) * h / CELL);
    src.d.copy(o.d, (Y * CELL + X) * 4, (sy * src.w + sx) * 4, (sy * src.w + sx) * 4 + 4);
  }
  return o;
}
function rotCCW(t) { // 화면 기준 반시계 90도
  const n = t.w, o = px.blank(n, n);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) t.d.copy(o.d, (y * n + x) * 4, (x * n + (n - 1 - y)) * 4, (x * n + (n - 1 - y)) * 4 + 4);
  return o;
}
const tileCache = {};
function tile(type, index, rotation, upgraded = false) { // GetArtRotation: (L ? 90 : 0) - 90 * rotationState (반시계 +)
  const key = type + index + rotation + (upgraded === true ? 'U' : upgraded || ''); // 단계별로 따로 캐시
  if (tileCache[key]) return tileCache[key];
  let t = cellTile(type + '_' + index, upgraded), turns = (((type === 'L' ? 90 : 0) - 90 * rotation) % 360 + 360) % 360 / 90;
  for (let i = 0; i < turns; i++) t = rotCCW(t);
  return (tileCache[key] = t);
}

// 회전별 모양: 화면 좌표(y 아래 +)로 바꾸고 왼쪽 위를 (0,0)으로 정규화. 같은 모양 중복 회전은 하나만 남김.
const SHAPES = [];
for (const type of TYPES) {
  const seen = new Set();
  cells[type].forEach((cs, rot) => {
    const pts = cs.map(([x, y], index) => ({ x, y: -y, index }));
    const mx = Math.min(...pts.map(p => p.x)), my = Math.min(...pts.map(p => p.y));
    pts.forEach(p => { p.x -= mx; p.y -= my; });
    const sig = pts.map(p => p.x + ',' + p.y).sort().join(' ');
    if (seen.has(sig)) return;
    seen.add(sig);
    SHAPES.push({ type, rot, pts });
  });
}

let seed = 7;
const rand = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);

// 글자 칸을 테트로미노로 정확히 덮는 배치 찾기 (빈 칸 중 가장 위·왼쪽부터 채우는 백트래킹)
// 여러 해를 뽑아 종류가 다양하고 이웃끼리 같은 종류가 적은 배치를 고른다.
function tileLetter(rows, tries = 400) {
  const H = rows.length, W = rows[0].length, filled = [];
  rows.forEach((r, y) => [...r].forEach((c, x) => { if (c === 'X') filled.push([x, y]); }));
  if (filled.length % 4) throw new Error('칸 수가 4의 배수가 아님: ' + rows.join('/') + ' = ' + filled.length);
  let best = null, bestScore = -1e9;
  for (let t = 0; t < tries; t++) {
    const owner = rows.map(r => [...r].map(c => (c === 'X' ? -1 : -2))), pieces = [];
    const order = SHAPES.slice().sort(() => rand() - 0.5);
    const solve = () => {
      let fx = -1, fy = -1;
      for (let y = 0; y < H && fx < 0; y++) for (let x = 0; x < W; x++) if (owner[y][x] === -1) { fx = x; fy = y; break; }
      if (fx < 0) return true;
      for (const s of order) for (const a of s.pts) {
        const ox = fx - a.x, oy = fy - a.y;
        if (!s.pts.every(p => owner[oy + p.y] && owner[oy + p.y][ox + p.x] === -1)) continue;
        s.pts.forEach(p => (owner[oy + p.y][ox + p.x] = pieces.length));
        pieces.push({ ...s, ox, oy });
        if (solve()) return true;
        pieces.pop();
        s.pts.forEach(p => (owner[oy + p.y][ox + p.x] = -1));
      }
      return false;
    };
    if (!solve()) throw new Error('채울 수 없는 글자: ' + rows.join('/'));
    const types = new Set(pieces.map(p => p.type));
    let same = 0; // 맞닿은 서로 다른 조각끼리 종류가 같으면 감점
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const o = owner[y][x];
      if (o < 0) continue;
      for (const [dx, dy] of [[1, 0], [0, 1]]) { const n = owner[y + dy] && owner[y + dy][x + dx]; if (n >= 0 && n !== o && pieces[n].type === pieces[o].type) same++; }
    }
    const score = types.size * 10 - same * 6;
    if (score > bestScore) { bestScore = score; best = pieces; }
  }
  return best;
}

// 단어를 그림으로: 글자 사이 1칸 띄움. lines = ['TETRIGEON'] 또는 ['TETRI', 'GEON']
// 글자마다 조각 1개(조각 6개 이상이면 2개)를 강화 미노로 고른다.
// 같은 글자 안에서 강화 조각끼리 닿지 않게 하고, 아직 안 쓴 종류(색)를 먼저 써서 7색이 고루 나오게 한다.
function pickUpgrades(laid) {
  const usedTypes = new Set();
  const cellsOf = p => p.pts.map(c => [p.ox + c.x, p.oy + c.y]);
  const touches = (a, b) => cellsOf(a).some(([x, y]) => cellsOf(b).some(([X, Y]) => Math.abs(x - X) + Math.abs(y - Y) === 1));
  laid.forEach((l, li) => {
    l.upgraded = new Set();
    const n = l.pieces.length >= 6 ? 2 : 1, count = l.pieces.length;
    for (let k = 0; k < n; k++) {
      const cand = l.pieces.map((p, i) => i).filter(i => !l.upgraded.has(i) && ![...l.upgraded].some(j => touches(l.pieces[i], l.pieces[j])));
      cand.sort((a, b) => (usedTypes.has(l.pieces[a].type) - usedTypes.has(l.pieces[b].type)) || ((a + li * 3) % count) - ((b + li * 3) % count)); // 같은 글자가 반복돼도 다른 조각을 고름
      if (!cand.length) break;
      l.upgraded.add(cand[0]);
      usedTypes.add(l.pieces[cand[0]].type);
    }
  });
}

function renderWord(lines, gap = 1, lineGap = 1, upgrade = false) {
  const H = FONT.T.length, laid = [];
  let maxW = 0;
  lines.forEach((word, li) => {
    let cx = 0;
    for (const ch of word) {
      const rows = FONT[ch];
      laid.push({ ch, rows, x: cx, y: li * (H + lineGap), pieces: null });
      cx += rows[0].length + gap;
    }
    maxW = Math.max(maxW, cx - gap);
  });
  lines.forEach((word, li) => { // 줄마다 가운데 정렬
    const ls = laid.filter(l => l.y === li * (H + lineGap)), w = ls[ls.length - 1].x + ls[ls.length - 1].rows[0].length;
    const shift = Math.floor((maxW - w) / 2);
    ls.forEach(l => (l.x += shift));
  });
  const cache = {}; // 같은 글자는 같은 배치를 써서 통일감 유지
  laid.forEach(l => (l.pieces = cache[l.ch] || (cache[l.ch] = tileLetter(l.rows))));
  let tierOf = upgrade; // 함수면 칸마다 단계('N'/'U'/'C')를 직접 정함: (글자 번호, 글자, 조각 번호, 칸 번호)
  if (typeof upgrade !== 'function') { if (upgrade) pickUpgrades(laid); else laid.forEach(l => (l.upgraded = new Set())); tierOf = (li, l, pi) => l.upgraded.has(pi); }
  const gridH = lines.length * H + (lines.length - 1) * lineGap, pad = 16;
  const img = px.blank(maxW * CELL + pad * 2, gridH * CELL + pad * 2);
  laid.forEach((l, li) => l.pieces.forEach((p, pi) => p.pts.forEach(c => {
    const t = tile(p.type, c.index, p.rot, tierOf(li, l, pi, c.index)), X = pad + (l.x + p.ox + c.x) * CELL, Y = pad + (l.y + p.oy + c.y) * CELL;
    for (let y = 0; y < CELL; y++) for (let x = 0; x < CELL; x++) {
      const si = (y * CELL + x) * 4;
      if (t.d[si + 3] < 128) continue; // 이진 알파
      const di = ((Y + y) * img.w + X + x) * 4;
      t.d.copy(img.d, di, si, si + 4);
      img.d[di + 3] = 255;
    }
  })));
  return { img, laid };
}

// 단색 테두리 (흐림·그라데이션 없이 한 색으로 r픽셀 두께). 이미 칠한 픽셀은 건드리지 않는다.
function ring(img, r, color) {
  const o = { w: img.w, h: img.h, d: Buffer.from(img.d) };
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
    if (img.d[(y * img.w + x) * 4 + 3]) continue;
    let near = false;
    for (let dy = -r; dy <= r && !near; dy++) for (let dx = -r; dx <= r; dx++) {
      if (Math.abs(dx) + Math.abs(dy) > r + 1) continue; // 모서리를 계단식으로 깎은 마름모에 가까운 두께
      const X = x + dx, Y = y + dy;
      if (X >= 0 && Y >= 0 && X < img.w && Y < img.h && img.d[(Y * img.w + X) * 4 + 3]) { near = true; break; }
    }
    if (near) { const i = (y * img.w + x) * 4; o.d[i] = color[0]; o.d[i + 1] = color[1]; o.d[i + 2] = color[2]; o.d[i + 3] = 255; }
  }
  return o;
}

// 아래로 offset 픽셀 밀린 단색 그림자를 뒤에 깐다
function dropShadow(img, offset, color) {
  const o = px.blank(img.w, img.h + offset);
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) if (img.d[(y * img.w + x) * 4 + 3]) { const i = ((y + offset) * o.w + x) * 4; o.d[i] = color[0]; o.d[i + 1] = color[1]; o.d[i + 2] = color[2]; o.d[i + 3] = 255; }
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) { const si = (y * img.w + x) * 4; if (img.d[si + 3]) img.d.copy(o.d, (y * o.w + x) * 4, si, si + 4); }
  return o;
}

// 시트에서 색을 뽑는다: 미노 외곽선(가장 어두운 불투명색), I 미노 균열의 청록
function sampleColors() {
  let dark = null, darkL = 1e9, cyan = null, cyanS = -1;
  const [x0, y0, w, h] = rects.I_1, top = sheet.h - (y0 + h);
  for (let y = top; y < top + h; y++) for (let x = x0; x < x0 + w; x++) {
    const i = (y * sheet.w + x) * 4, r = sheet.d[i], g = sheet.d[i + 1], b = sheet.d[i + 2];
    if (sheet.d[i + 3] < 200) continue;
    const l = r * 0.3 + g * 0.59 + b * 0.11;
    if (l < darkL) { darkL = l; dark = [r, g, b]; }
    const s = b + g - 2 * r; // 청록일수록 큼
    if (s > cyanS) { cyanS = s; cyan = [r, g, b]; }
  }
  return { dark, cyan };
}

function onBackground(img, bgFile, scale, bgColor) { // 미리보기용 합성 (로고는 화면 위쪽 가운데)
  const W = 1920, H = 1080, out = px.blank(W, H);
  for (let i = 0; i < W * H; i++) { out.d[i * 4] = bgColor[0]; out.d[i * 4 + 1] = bgColor[1]; out.d[i * 4 + 2] = bgColor[2]; out.d[i * 4 + 3] = 255; }
  if (bgFile) {
    const bg = px.decode(bgFile);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const sx = Math.min(bg.w - 1, Math.floor(x * bg.w / W)), sy = Math.min(bg.h - 1, Math.floor(y * bg.h / H));
      bg.d.copy(out.d, (y * W + x) * 4, (sy * bg.w + sx) * 4, (sy * bg.w + sx) * 4 + 4);
      out.d[(y * W + x) * 4 + 3] = 255;
    }
  }
  const ox = Math.floor((W - img.w * scale) / 2), oy = 150;
  for (let y = 0; y < img.h * scale; y++) for (let x = 0; x < img.w * scale; x++) {
    const si = (Math.floor(y / scale) * img.w + Math.floor(x / scale)) * 4;
    if (img.d[si + 3] === 0) continue;
    img.d.copy(out.d, ((oy + y) * W + ox + x) * 4, si, si + 4);
  }
  return out;
}

// 조각 하나를 그린다 (떨어지는 미노 연출용). 반환: 이미지와 칸 좌표
function renderPiece(type, rot) {
  const s = SHAPES.find(p => p.type === type && p.rot === rot) || SHAPES.find(p => p.type === type);
  const w = Math.max(...s.pts.map(p => p.x)) + 1, h = Math.max(...s.pts.map(p => p.y)) + 1, img = px.blank(w * CELL, h * CELL);
  for (const c of s.pts) {
    const t = tile(type, c.index, s.rot);
    for (let y = 0; y < CELL; y++) for (let x = 0; x < CELL; x++) {
      const si = (y * CELL + x) * 4;
      if (t.d[si + 3] < 128) continue;
      const di = ((c.y * CELL + y) * img.w + c.x * CELL + x) * 4;
      t.d.copy(img.d, di, si, si + 4);
      img.d[di + 3] = 255;
    }
  }
  return { img, pts: s.pts };
}

module.exports = { FONT, CELL, renderWord, renderPiece, onBackground, tileLetter, ring, dropShadow, sampleColors, tile };

if (require.main === module) {
  const bg = path.join('C:/Users/MBC-501-15/.codex/worktrees/9449/Tetrigeon/output/art/T_DungeonCave_4x3_v4.png');
  const { dark, cyan } = sampleColors();
  console.log('sampled outline', dark, 'cyan', cyan);
  for (const [name, lines, upgrade] of [['oneLine', ['TETRIGEON'], false], ['twoLines', ['TETRI', 'GEON'], false], ['oneLine_Up', ['TETRIGEON'], true], ['twoLines_Up', ['TETRI', 'GEON'], true]]) {
    const { img, laid } = renderWord(lines, 1, 1, upgrade);
    const outlined = dropShadow(ring(img, 3, dark), 6, dark); // A: 외곽선 + 그림자
    const rimmed = dropShadow(ring(ring(img, 3, dark), 2, cyan), 6, dark); // B: 외곽선 바깥에 청록 테두리
    for (const [v, im] of [['A', outlined], ['B', rimmed]]) {
      px.encode(im, path.join(ROOT, 'parts', 'T_Logo_Mino_' + name + '_' + v + '.png'));
      px.encode(onBackground(im, bg, 1, [10, 18, 30]), path.join(ROOT, 'preview', 'Logo_Mino_' + name + '_' + v + '_FHD.png'));
    }
    const used = {};
    laid.forEach(l => l.pieces.forEach(p => (used[p.type] = (used[p.type] || 0) + 1)));
    console.log(name, img.w + 'x' + img.h, 'pieces by type', JSON.stringify(used));
  }
}
