// 애벌레 공격 프레임 제작용 공용 함수 (작업 폴더 전용, Unity와 무관)
// Idle 01(휴식 자세)을 머리·가운데·뒤 세 마디로 나눠 정수 픽셀로만 옮겨 합성한다.
const fs = require('fs'), path = require('path');
const p = require('../../PauseUI_VARCO/tools/pix.js');
const R = path.join(__dirname, '..');

const SHEET = 'C:/Users/MBC-501-15/Documents/Tetrigeon/Tetrigeon/Assets/@Resources/Enemies/CrystalLarvaIdle/T_CrystalLarva_Idle.png';
const CELL = 64;
const OUTLINE = [16, 18, 31]; // 기존 외곽선 색 (Idle 팔레트의 가장 어두운 색)

function loadIdle(i) { const s = p.decode(SHEET); return p.crop(s, (i % 5) * CELL, Math.floor(i / 5) * CELL, CELL, CELL); }
const A = (img, x, y) => (x < 0 || y < 0 || x >= img.w || y >= img.h) ? 0 : img.d[(y * img.w + x) * 4 + 3];

// 마디 구분: 돔·받침(윗부분)은 가로 경계 27/39, 다리(아랫부분 Y>=47)는 발 사이 틈 24/36 기준 (실제 그림의 윤곽을 보고 정함)
function label(x, y, cfg) {
  if (y >= cfg.legRow) return x <= cfg.legH ? 'H' : x <= cfg.legM ? 'M' : 'R';
  return x <= cfg.domeH ? 'H' : x <= cfg.domeM ? 'M' : 'R';
}

// 마디별 레이어 = 원래 픽셀 + 이웃 아래에 숨어 있다가 마디가 벌어질 때 드러나는 보충 픽셀(외곽선 2칸)
function buildLayers(base, cfg) {
  const L = { H: [], M: [], R: [] }, own = new Map();
  for (let y = 0; y < CELL; y++) for (let x = 0; x < CELL; x++) {
    if (!A(base, x, y)) continue;
    const k = label(x, y, cfg), o = (y * CELL + x) * 4;
    L[k].push([x, y, base.d[o], base.d[o + 1], base.d[o + 2]]);
    own.set(x + ',' + y, k);
  }
  const ext = { H: [], M: [], R: [] };
  // 가운데 마디는 머리 아래, 뒤 마디는 가운데 마디 아래에 보충 (왼쪽으로 cfg.ext 칸, 이웃이 덮고 있는 칸에만)
  for (const [seg, under] of [['M', 'H'], ['R', 'M']]) {
    const rows = new Map();
    L[seg].forEach(([x, y]) => { if (!rows.has(y) || x < rows.get(y)) rows.set(y, x); });
    rows.forEach((x0, y) => {
      for (let k = 1; k <= cfg.ext; k++) {
        const x = x0 - k;
        if (own.get(x + ',' + y) !== under) break; // 이웃이 덮고 있지 않으면(투명) 그 줄은 여기서 끝 → 떠 있는 점 방지
        ext[seg].push([x, y, OUTLINE[0], OUTLINE[1], OUTLINE[2]]);
      }
    });
  }
  return { L, ext, own };
}

// off = {H:[dx,dy], M:[dx,dy], R:[dx,dy]} → 64x64 프레임. 그리는 순서는 항상 뒤마디 → 가운데 → 머리(앞)
function compose(layers, off) {
  const out = p.blank(CELL, CELL);
  const put = (x, y, r, g, b) => { if (x < 0 || y < 0 || x >= CELL || y >= CELL) throw new Error('셀 밖: ' + x + ',' + y); const o = (y * CELL + x) * 4; out.d[o] = r; out.d[o + 1] = g; out.d[o + 2] = b; out.d[o + 3] = 255; };
  for (const seg of ['R', 'M', 'H']) {
    const [dx, dy] = off[seg];
    // 보충 픽셀이 먼저(아래), 그 위에 마디 원래 픽셀
    layers.ext[seg].forEach(([x, y, r, g, b]) => put(x + dx, y + dy, r, g, b));
    layers.L[seg].forEach(([x, y, r, g, b]) => put(x + dx, y + dy, r, g, b));
  }
  return out;
}

// 검사: 8방향 연결 덩어리 수, 안쪽에 갇힌 투명 구멍 수, 외곽 상자
function inspect(img) {
  const W = img.w, H = img.h, seen = new Uint8Array(W * H);
  let comps = 0;
  for (let i = 0; i < W * H; i++) if (img.d[i * 4 + 3] && !seen[i]) {
    comps++; const st = [i]; seen[i] = 1;
    while (st.length) { const c = st.pop(), cx = c % W, cy = (c / W) | 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = cx + dx, ny = cy + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const n = ny * W + nx; if (img.d[n * 4 + 3] && !seen[n]) { seen[n] = 1; st.push(n); } } }
  }
  const ext = new Uint8Array(W * H), st = [];
  for (let x = 0; x < W; x++) { st.push(x, (H - 1) * W + x); } for (let y = 0; y < H; y++) { st.push(y * W, y * W + W - 1); }
  while (st.length) { const c = st.pop(); if (ext[c] || img.d[c * 4 + 3]) continue; ext[c] = 1; const cx = c % W, cy = (c / W) | 0; if (cx > 0) st.push(c - 1); if (cx < W - 1) st.push(c + 1); if (cy > 0) st.push(c - W); if (cy < H - 1) st.push(c + W); }
  let holes = 0, partial = 0, x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let i = 0; i < W * H; i++) { const a = img.d[i * 4 + 3]; if (!a && !ext[i]) holes++; if (a && a !== 255) partial++; if (a) { const x = i % W, y = (i / W) | 0; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } }
  return { comps, holes, partial, bbox: [x0, y0, x1, y1] };
}

// 확대 이미지(체크 배경) 저장용: 프레임 여러 장을 가로로 늘어놓음
function strip(frames, scale, bg, crop) {
  const [cx, cy, cw, ch] = crop || [0, 0, CELL, CELL], gap = 2, W = frames.length * (cw * scale + gap), H = ch * scale;
  const o = p.blank(W, H);
  frames.forEach((f, k) => { for (let y = 0; y < ch * scale; y++) for (let x = 0; x < cw * scale; x++) { const sx = cx + (x / scale | 0), sy = cy + (y / scale | 0), i = (sy * CELL + sx) * 4, q = (y * W + k * (cw * scale + gap) + x) * 4; const a = f.d[i + 3]; const c = a ? [f.d[i], f.d[i + 1], f.d[i + 2]] : bg; o.d[q] = c[0]; o.d[q + 1] = c[1]; o.d[q + 2] = c[2]; o.d[q + 3] = 255; } });
  return o;
}

module.exports = { p, R, CELL, OUTLINE, loadIdle, A, label, buildLayers, compose, inspect, strip };

// 갇힌 투명 칸(구멍)을 주변 4방향 이웃의 가장 흔한 색으로 메움 (마디가 어긋나며 드러난 받침 부분을 주변 재질로 채우는 처리). 반환: 메운 칸 수
function fillHoles(img, maxFill) {
  const W = img.w, H = img.h, ext = new Uint8Array(W * H), st = [];
  for (let x = 0; x < W; x++) st.push(x, (H - 1) * W + x); for (let y = 0; y < H; y++) st.push(y * W, y * W + W - 1);
  while (st.length) { const c = st.pop(); if (ext[c] || img.d[c * 4 + 3]) continue; ext[c] = 1; const cx = c % W, cy = (c / W) | 0; if (cx > 0) st.push(c - 1); if (cx < W - 1) st.push(c + 1); if (cy > 0) st.push(c - W); if (cy < H - 1) st.push(c + W); }
  const holes = []; for (let i = 0; i < W * H; i++) if (!img.d[i * 4 + 3] && !ext[i]) holes.push(i);
  if (holes.length > maxFill) throw new Error('구멍이 너무 많음: ' + holes.length);
  const snap = Buffer.from(img.d);
  holes.forEach(i => {
    const x = i % W, y = (i / W) | 0, cnt = new Map();
    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const n = ((y + dy) * W + x + dx) * 4; if (snap[n + 3]) { const k = snap[n] + ',' + snap[n + 1] + ',' + snap[n + 2]; cnt.set(k, (cnt.get(k) || 0) + 1); } });
    let best = null, bc = 0; cnt.forEach((c, k) => { if (c > bc) { bc = c; best = k; } });
    const c = best.split(',').map(Number); img.d[i * 4] = c[0]; img.d[i * 4 + 1] = c[1]; img.d[i * 4 + 2] = c[2]; img.d[i * 4 + 3] = 255;
  });
  return holes.length;
}
module.exports.fillHoles = fillHoles;

// 5열 2행 검사용 격자: 휴식 자세의 좌우 끝(X 8, 49)과 발바닥(Y 52) 위치를 연한 선으로 깔아 이동량이 보이게 함
function grid(frames, scale, cols, bg, crop, guides) {
  const [cx, cy, cw, ch] = crop, gap = 6, rows = Math.ceil(frames.length / cols), cwp = cw * scale, chp = ch * scale;
  const W = cols * (cwp + gap) - gap, H = rows * (chp + gap) - gap, o = p.blank(W, H); o.d.fill(255);
  frames.forEach((f, k) => {
    const ox = (k % cols) * (cwp + gap), oy = Math.floor(k / cols) * (chp + gap);
    for (let y = 0; y < chp; y++) for (let x = 0; x < cwp; x++) {
      const sx = cx + (x / scale | 0), sy = cy + (y / scale | 0), i = (sy * CELL + sx) * 4, q = ((oy + y) * W + ox + x) * 4;
      let c = f.d[i + 3] ? [f.d[i], f.d[i + 1], f.d[i + 2]] : bg;
      if (!f.d[i + 3] && guides && (guides.x.includes(sx) || guides.y.includes(sy))) c = [255, 196, 196];
      o.d[q] = c[0]; o.d[q + 1] = c[1]; o.d[q + 2] = c[2]; o.d[q + 3] = 255;
    }
  });
  return o;
}
module.exports.grid = grid;
