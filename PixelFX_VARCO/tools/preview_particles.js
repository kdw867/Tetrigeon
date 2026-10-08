// 수정안 미리보기 (게임 실행 영상이 아닌 합성): LINE CLEAR를 짧은 파티클로 바꾼 장면을 실제 FHD 캡처의 보드 위에 합성
// LOCK 테두리·수정 파괴는 기존 확정 시트 그대로. 파티클은 particles_sim.js (Unity ParticleSystem 값과 같은 규칙)
const { p, R, ROOT, get, put, blit, clone, solid, up, writeGif } = require('./lib_fx');
const PS = require('./particles_sim.js').ClearParticles;
const board = require(`${ROOT}/StageBoardUI_VARCO/tools/lib_board.js`);
const fs = require('fs');
const CS = 27, BX = 825, BY = 990, CX0 = 790, CW = 340;
const info = JSON.parse(fs.readFileSync(`${R}/work/board_info.json`, 'utf8'));
const cap = p.decode(`${ROOT}/HpBarUI_VARCO/preview/Unity_NoStagePanel.png`);
const tile = (n) => p.decode(`${R}/work/tile_${n}.png`);
const TILES = { T: [0, 1, 2, 3].map(i => tile('T' + i)), O: [0, 1, 2, 3].map(i => tile('O' + i)) };
const crystalSrc = p.decode(`${ROOT}/Tetrigeon/Assets/@Resources/Resources/MinoSprites/Crystal/T_1.png`);
const CRY = p.blank(CS, CS); blit(CRY, p.boxDown(crystalSrc, crystalSrc.w / 24), 2, 1, 1);
const TYPES7 = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'], CRYT = {}, BURST = {};
for (const T of TYPES7) { const src = p.decode(`${ROOT}/Tetrigeon/Assets/@Resources/Resources/MinoSprites/Crystal/${T}_1.png`), t = p.blank(CS, CS); blit(t, p.boxDown(src, src.w / 24), 2, 1, 1); CRYT[T] = t; BURST[T] = p.decode(`${R}/sheets/FX_CrystalBurst_${T}.png`); }
const crystalType = (kind) => (kind.startsWith('X') ? (kind.split(':')[1] || 'T') : null);
const lockSheet = p.decode(`${R}/sheets/FX_Lock_sheet.png`), crystalSheet = p.decode(`${R}/sheets/FX_CrystalBurst_sheet.png`), oldClear = p.decode(`${R}/sheets/FX_LineClear_sheet.png`);
const TICK = 20, T0 = 4, N = 18; // 사건 후 14틱(0.28초)까지만 만들고 마지막 그림을 길게 유지
const delaysFor = (unit) => Array.from({ length: N }, (_, i) => i === 0 ? unit * 20 : i === N - 1 ? unit * 40 : unit); // 첫 그림 길게(사건 전), 끝 그림 길게 // ms, 사건 시작 틱, 프레임 수

function makeBase(cy, ch) { // 캡처에서 보드 영역을 잘라 블록을 지우고 빈 격자를 다시 그림
  const b = p.blank(CW, ch);
  for (let y = 0; y < ch; y++) for (let x = 0; x < CW; x++) { const o = ((cy + y) * cap.w + CX0 + x) * 4, d = (y * CW + x) * 4; for (let c = 0; c < 4; c++) b.d[d + c] = cap.d[o + c]; }
  for (let y = Math.max(cy, 398); y < cy + ch && y <= 988; y++) for (let x = 827; x <= 1092; x++) put(b, x - CX0, y - cy, '#0d1828');
  for (const x of info.vlines) for (let y = Math.max(cy, 398); y < cy + ch && y <= 988; y++) put(b, x - CX0, y - cy, '#23364c');
  for (const y of info.hlines) if (y >= cy && y < cy + ch) for (let x = 827; x <= 1092; x++) put(b, x - CX0, y - cy, '#23364c');
  return b;
}
const cellXY = (c, r, cy) => [BX + CS * c - CX0, BY - CS * (r + 1) - cy];
const inBoard = (x, y, cy) => x + CX0 >= 827 && x + CX0 <= 1092 && y + cy >= 398 && y + cy <= 988;
function drawBlock(img, c, r, kind, cy) { const [x, y] = cellXY(c, r, cy); const t = kind.startsWith('X') ? CRYT[crystalType(kind)] : TILES[kind[0]][(c + 2 * r) % 4]; blit(img, t, x, y, 1); }
const lockF = (ev) => Math.floor(ev * TICK / 1000 * 60), crystalF = (ev) => Math.floor(ev * TICK / 1000 * 30), oldClearF = (ev) => Math.floor(ev * TICK / 1000 * 50);
function drawLock(img, c, r, mask, ev, cy) { const f = lockF(ev); if (f < 0 || f > 7 || !mask) return; const [x, y] = cellXY(c, r, cy); blit(img, p.crop(lockSheet, f * CS, mask * CS, CS, CS), x, y, 1); }
function drawCrystal(img, c, r, ev, cy, type) { const f = crystalF(ev); if (f < 0 || f > 7) return; const [x, y] = cellXY(c, r, cy); blit(img, p.crop(type ? BURST[type] : crystalSheet, f * 27, 0, 27, 27), x + 13 - 27, y + 13 - 27, 2); }
function drawOldBeam(img, r, ev, cy) { const f = oldClearF(ev); if (f < 0 || f > 9) return; const [, y] = cellXY(0, r, cy); blit(img, p.crop(oldClear, 0, f * 31, 270, 31), BX - CX0, y - 2, 1); }
function masks(cells) { const s = new Set(cells.map(([c, r]) => c + ',' + r)); return cells.map(([c, r]) => ({ c, r, mask: (s.has(c + ',' + (r + 1)) ? 0 : 1) | (s.has((c + 1) + ',' + r) ? 0 : 2) | (s.has(c + ',' + (r - 1)) ? 0 : 4) | (s.has((c - 1) + ',' + r) ? 0 : 8) })); }
function settle(map) { // 꽉 찬 줄 삭제 + 위 줄 압축 (게임과 같은 규칙)
  const full = []; for (let r = 0; r < 22; r++) { let n = 0; for (let c = 0; c < 10; c++) if (map.has(c + ',' + r)) n++; if (n === 10) full.push(r); }
  const out = new Map(), moved = new Map(); let shift = 0;
  for (let r = 0; r < 22; r++) { if (full.includes(r)) { shift++; continue; } for (let c = 0; c < 10; c++) { const k = c + ',' + r; if (map.has(k)) { out.set(c + ',' + (r - shift), map.get(k)); moved.set(k, [c, r - shift]); } } }
  return { map: out, full, moved };
}
const mk = (spec) => { const m = new Map(); for (const [c, r, k] of spec) m.set(c + ',' + r, k); return m; };
const kindAt = (c, r) => ((c + r) % 2 ? 'T' : 'O');
const fill = (rows) => { const o = []; for (const [r, cols] of rows) for (const c of cols) o.push([c, r, kindAt(c, r)]); return o; };

const scenarios = [
  { id: 1, name: '1줄 삭제 후 위 블록이 즉시 내려옴', cropY: 770, cropH: 230, focus: [0, 0, 10, 5],
    pre: mk([...fill([[0, [0, 1, 2, 7, 8, 9]], [1, [0, 1, 2, 3, 5, 6, 8, 9]], [2, [0, 1, 3, 6, 9]], [3, [0, 3, 9]], [4, [0, 9]]]), [3, 0, 'T'], [4, 0, 'T'], [5, 0, 'T'], [6, 0, 'T']]) },
  { id: 2, name: '2줄 동시 삭제', cropY: 770, cropH: 230, focus: [0, 0, 10, 5],
    pre: mk([...fill([[0, [0, 1, 2, 3, 6, 7, 8, 9]], [1, [0, 1, 2, 3, 6, 7, 8, 9]], [2, [0, 1, 2, 7, 8]], [3, [0, 1, 8]], [4, [0, 8]]]), [4, 0, 'T'], [5, 0, 'T'], [4, 1, 'T'], [5, 1, 'T']]) },
  { id: 3, name: '4줄 동시 삭제', cropY: 700, cropH: 300, focus: [0, 0, 10, 7],
    pre: mk([...fill([[0, [0, 1, 2, 3, 5, 6, 7, 8, 9]], [1, [0, 1, 2, 3, 5, 6, 7, 8, 9]], [2, [0, 1, 2, 3, 5, 6, 7, 8, 9]], [3, [0, 1, 2, 3, 5, 6, 7, 8, 9]], [4, [0, 1, 2, 6, 7]], [5, [0, 1, 7]], [6, [0, 7, 8]]]), [4, 0, 'T'], [4, 1, 'T'], [4, 2, 'T'], [4, 3, 'T']]) },
  { id: 4, name: '높은 위치의 행 삭제', cropY: 470, cropH: 450, focus: [0, 5, 10, 15],
    pre: mk([...fill([[0, [0, 1, 2, 3, 4, 6, 7, 8, 9]], [1, [0, 1, 2, 3, 4, 6, 7, 8, 9]], [2, [0, 1, 2, 3, 4, 6, 7, 8, 9]], [3, [0, 1, 2, 3, 4, 6, 7, 8, 9]], [4, [0, 1, 2, 3, 4, 6, 7, 8, 9]], [5, [0, 1, 2, 3, 4, 6, 7, 8, 9]], [6, [0, 1, 2, 3, 4, 6, 7, 8, 9]], [7, [0, 1, 2, 3, 4, 6, 7, 8, 9]], [8, [0, 1, 2, 3, 4, 6, 7, 8, 9]], [9, [0, 1, 2, 3, 4, 6, 7, 8, 9]], [10, [0, 1, 2, 7, 8, 9]], [11, [0, 1, 2, 8, 9]], [12, [0, 1, 9]], [13, [0, 9]], [14, [0]]]), [3, 10, 'T'], [4, 10, 'T'], [5, 10, 'T'], [6, 10, 'T']]) },
  { id: 5, name: '수정 칸 파괴와 동시 실행', cropY: 770, cropH: 230, focus: [0, 0, 10, 5], delayCrystal: 3,
    pre: mk([...fill([[0, [0, 1, 3, 4, 5, 6, 9]], [1, [0, 1, 2, 8, 9]], [2, [0, 1, 8, 9]], [3, [0, 9]]]), [2, 0, 'X'], [8, 0, 'X'], [7, 0, 'T'], [7, 1, 'T']]), lock: [[7, 1]] },
  { id: 6, name: '7색 수정 동시 파괴', cropY: 770, cropH: 230, focus: [0, 0, 10, 5], delayCrystal: 3, perType: true,
    pre: mk([...fill([[0, [0, 2, 3, 5, 6, 8, 9]], [1, [0, 1, 3, 4, 6, 7, 9]], [2, [0, 1, 4, 9]], [3, [0, 9]]]), [1, 0, 'X:I'], [4, 0, 'X:J'], [7, 0, 'X:L'], [2, 1, 'X:S'], [5, 1, 'X:T'], [8, 1, 'X:Z'], [4, 2, 'T'], [5, 2, 'T']]) },
];

// 방출: 사건 시작 순간 한 번, 지워지는 칸의 월드(화면) 좌표 기준 (압축 전 위치, 이후 압축이나 블록 이동을 따라가지 않음)
function emitFor(sc, params) {
  const s = settle(sc.pre), cells = [];
  for (const r of s.full) { let crystalRow = false; for (let c = 0; c < 10; c++) if ((sc.pre.get(c + ',' + r) || '').startsWith('X')) crystalRow = true;
    for (let c = 0; c < 10; c++) cells.push({ x: BX + CS * c + 13.5, y: BY - CS * (r + 1) + 13.5, crystal: (sc.pre.get(c + ',' + r) || '').startsWith('X'), crystalRow }); }
  return PS.emit(cells, s.full.length, params, sc.id * 7919);
}
function frameAt(sc, base, parts, mode, t, params) {
  const img = clone(base), ev = t - T0, after = ev >= 0, cy = sc.cropY;
  let cells = sc.pre, moved = null, s = null;
  if (after) { s = settle(sc.pre); cells = s.map; moved = s.moved; }
  for (const [k, kind] of cells) { const [c, r] = k.split(',').map(Number); drawBlock(img, c, r, kind, cy); }
  if (!after) return img;
  if (sc.lock) { const pos = sc.lock.map(([c, r]) => moved.get(c + ',' + r)).filter(Boolean); for (const m of masks(pos)) drawLock(img, m.c, m.r, m.mask, ev, cy); }
  if (mode === 'old') for (const r of s.full) drawOldBeam(img, r, ev, cy);
  else { const sec = ev * TICK / 1000; for (const q of parts) { const st = PS.stateAt(q, sec); if (!st) continue; const px = Math.round(st.x - CX0 - st.size / 2), py = Math.round(st.y - cy - st.size / 2); for (let yy = 0; yy < st.size; yy++) for (let xx = 0; xx < st.size; xx++) if (inBoard(px + xx, py + yy, cy)) put(img, px + xx, py + yy, st.color); } }
  const delay = sc.delayCrystal || 0;
  for (const r of s.full) for (let c = 0; c < 10; c++) { const k = sc.pre.get(c + ',' + r) || ''; if (k.startsWith('X')) drawCrystal(img, c, r, ev - delay, cy, sc.perType ? crystalType(k) : null); } // perType: 종류별 수정 시트 사용
  return img;
}
function focusRect(sc) { const [c0, r0, c1, r1] = sc.focus, x = BX + CS * c0 - CX0 - 14, y = BY - CS * (r1 + 1) - sc.cropY - 14, w = CS * (c1 - c0) + 28, h = CS * (r1 - r0 + 1) + 28; const rx = Math.max(0, x), ry = Math.max(0, y); return [rx, ry, Math.min(CW - rx, w), Math.min(sc.cropH - ry, h)]; }

module.exports = { scenarios, makeBase, emitFor, frameAt, focusRect, TICK, T0, N, CW };
if (require.main === module) {
  const out = `${R}/preview`; const params = {};
  const keys = [0, 1, 2, 3, 4, 6]; // 사건 시작 후 틱 (0, 20, 40, 60, 80, 120ms)
  for (const sc of scenarios) {
    if (process.env.ONLY && +process.env.ONLY !== sc.id) { sc.keys = [up(solid(2, 2, '#000000'), 1)]; continue; }
    const base = makeBase(sc.cropY, sc.cropH), parts = emitFor(sc, params), frames = [];
    for (let t = 0; t < N; t++) frames.push(frameAt(sc, base, parts, 'new', t, params));
    writeGif(`${out}/Particles_S${sc.id}_actual.gif`, frames, delaysFor(TICK), { diff: true });
    const [rx, ry, rw, rh] = focusRect(sc);
    const slow = frames.map(f => up(p.crop(f, rx, ry, rw, rh), 3));
    writeGif(`${out}/Particles_S${sc.id}_slow_x3.gif`, slow, delaysFor(TICK * 4), { diff: true }); // 4배 느리게, 3배 확대
    sc.keys = keys.map(k => up(p.crop(frames[T0 + k], rx, ry, rw, rh), 2)); sc.parts = parts.length;
    console.log(`S${sc.id} ${sc.name}: 파편 ${parts.length}개, 실제 ${CW}x${sc.cropH}, 확대 ${slow[0].w}x${slow[0].h}`);
  }
  // 이전(긴 가로빛) 대 새 방식 비교 — 장면 1
  { const sc = scenarios[0], base = makeBase(sc.cropY, sc.cropH), parts = emitFor(sc, params), fr = [];
    const [rx, ry, rw, rh] = focusRect(sc); const font = board.loadFont(`${ROOT}/RewardUI_VARCO/font/PixelFont.json`, `${ROOT}/RewardUI_VARCO/font/PixelFont_cream.png`);
    for (let t = 0; t < N; t++) { const a = up(p.crop(frameAt(sc, base, parts, 'old', t, params), rx, ry, rw, rh), 2), b = up(p.crop(frameAt(sc, base, parts, 'new', t, params), rx, ry, rw, rh), 2);
      const o = solid(a.w * 2 + 30, a.h + 40, '#070c14'); blit(o, a, 10, 30, 1); blit(o, b, 20 + a.w, 30, 1); board.drawText(o, font, 'BEFORE  LONG BEAM', 10, 8, 2, 'l'); board.drawText(o, font, 'AFTER  PARTICLES', 20 + a.w, 8, 2, 'l'); fr.push(o); }
    writeGif(`${out}/Particles_Compare_slow.gif`, fr, delaysFor(TICK * 4), { diff: true }); writeGif(`${out}/Particles_Compare.gif`, fr, delaysFor(TICK), { diff: true });
    p.encode(fr[T0 + 2], `${out}/Particles_Compare_t2.png`); p.encode(fr[T0 + 4], `${out}/Particles_Compare_t4.png`); }
  // 장면 한눈에: 장면마다 핵심 순간 6장을 가로로 (2배)
  const g = 8; let W = 0, H = g; for (const sc of scenarios) { W = Math.max(W, sc.keys.reduce((s, k) => s + k.w + g, g)); H += sc.keys[0].h + 28 + g; }
  const sheet = solid(W, H, '#070c14'); const font = board.loadFont(`${ROOT}/RewardUI_VARCO/font/PixelFont.json`, `${ROOT}/RewardUI_VARCO/font/PixelFont_cream.png`); let y = g;
  for (const sc of scenarios) { board.drawText(sheet, font, `${sc.id} ${['ONE LINE + BLOCKS DROP', 'TWO LINES', 'FOUR LINES', 'HIGH ROW', 'WITH CRYSTAL BURST'][sc.id - 1]}   (0 / 20 / 40 / 60 / 80 / 120 ms)`, g, y + 4, 2, 'l'); y += 28; let x = g; for (const k of sc.keys) { blit(sheet, k, x, y, 1); x += k.w + g; } y += sc.keys[0].h + g; }
  p.encode(sheet, `${out}/Particles_contact_x2.png`); console.log('contact', sheet.w + 'x' + sheet.h);
}
