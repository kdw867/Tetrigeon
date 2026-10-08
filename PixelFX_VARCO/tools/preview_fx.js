// 컨펌용 합성 미리보기 (게임 실행 영상이 아님): 실제 FHD 캡처의 보드 위에 확정 스프라이트 시트의 프레임을 시간 순서대로 합성
// 보드 좌표: 칸 (c, r) = 왼쪽부터 c, 아래부터 r. 화면 위치 x = 825 + 27c, y = 990 - 27(r+1) (캡처에서 측정)
const { p, R, ROOT, get, put, blit, clone, solid, up, writeGif } = require('./lib_fx');
const fs = require('fs');
const CS = 27, BX = 825, BY = 990;
const CROP = { x: 790, y: 640, w: 340, h: 360 }; // 보드 아래쪽 13줄을 실제 크기로
const info = JSON.parse(fs.readFileSync(`${R}/work/board_info.json`, 'utf8'));

// ---------- 배경: 캡처의 보드 아래쪽을 빈 격자로 다시 그림 ----------
const cap = p.decode(`${ROOT}/HpBarUI_VARCO/preview/Unity_NoStagePanel.png`);
const base = p.blank(CROP.w, CROP.h);
for (let y = 0; y < CROP.h; y++) for (let x = 0; x < CROP.w; x++) { const o = ((CROP.y + y) * cap.w + CROP.x + x) * 4, d = (y * CROP.w + x) * 4; for (let c = 0; c < 4; c++) base.d[d + c] = cap.d[o + c]; }
const inBoard = (x, y) => x >= 827 && x <= 1092 && y >= 640 && y <= 988;
for (let y = 640; y <= 988; y++) for (let x = 827; x <= 1092; x++) put(base, x - CROP.x, y - CROP.y, '#0d1828'); // 블록 지우기
for (const x of info.vlines) for (let y = 640; y <= 988; y++) if (inBoard(x, y)) put(base, x - CROP.x, y - CROP.y, '#23364c');
for (const y of info.hlines) for (let x = 827; x <= 1092; x++) if (y >= 640 && y <= 988) put(base, x - CROP.x, y - CROP.y, '#23364c');
// ---------- 블록 그림 (실제 캡처에서 뽑은 T·O 타일 + 게임의 수정 칸 그림) ----------
const tile = (n) => p.decode(`${R}/work/tile_${n}.png`);
const TILES = { T: [0, 1, 2, 3].map(i => tile('T' + i)), O: [0, 1, 2, 3].map(i => tile('O' + i)) };
const crystalSrc = p.decode(`${ROOT}/Tetrigeon/Assets/@Resources/Resources/MinoSprites/Crystal/T_1.png`);
const cry = p.boxDown(crystalSrc, crystalSrc.w / 24); // 24칸 정도로 줄여 한 칸 안에 그림
const CRY = p.blank(CS, CS); blit(CRY, cry, 2, 1, 1);
const cellXY = (c, r) => [BX + 27 * c - CROP.x, BY - 27 * (r + 1) - CROP.y]; // 크롭 좌표의 칸 왼쪽 위
function drawBlock(img, c, r, kind) { const [x, y] = cellXY(c, r); const t = kind === 'X' ? CRY : TILES[kind[0]][(c + 2 * r) % 4]; blit(img, t, x, y, 1); }

// ---------- 이펙트 시트 ----------
const lockSheet = p.decode(`${R}/sheets/FX_Lock_sheet.png`); // 8열 x 16행 (행 = 노출 변 마스크)
const clearSheet = p.decode(`${R}/sheets/FX_LineClear_sheet.png`); // 270 x 310 (10프레임)
const crystalSheet = p.decode(`${R}/sheets/FX_CrystalBurst_sheet.png`); // 216 x 27 (8프레임)
const TICK = 20; // ms (GIF 지연 단위)
const lockFrameAt = (t) => Math.floor(t * TICK / 1000 * 60); // 60fps, 8프레임 (0.133초)
const clearFrameAt = (t) => Math.floor(t * TICK / 1000 * 50); // 50fps, 10프레임 (0.2초)
const crystalFrameAt = (t) => Math.floor(t * TICK / 1000 * 30); // 30fps, 8프레임 (0.267초)
function drawLock(img, c, r, mask, t) { const f = lockFrameAt(t); if (f < 0 || f > 7 || !mask) return; const [x, y] = cellXY(c, r); const fr = p.crop(lockSheet, f * CS, mask * CS, CS, CS); blit(img, fr, x, y, 1); }
function drawClear(img, r, t) { const f = clearFrameAt(t); if (f < 0 || f > 9) return; const fr = p.crop(clearSheet, 0, f * 31, 270, 31); const [, y] = cellXY(0, r); blit(img, fr, BX - CROP.x, y - 2, 1); } // 행 위아래 2칸 여백
function drawCrystal(img, c, r, t) { const f = crystalFrameAt(t); if (f < 0 || f > 7) return; const [x, y] = cellXY(c, r); const fr = p.crop(crystalSheet, f * 27, 0, 27, 27); blit(img, fr, x + 13 - 27, y + 13 - 27, 2); } // 27x27 그림을 2배(54px)로 칸 중심에 맞춤
// 같은 미노끼리 맞닿은 변에는 LOCK 테두리를 그리지 않음 (북1 동2 남4 서8 = 노출된 변)
function masks(cells) { const set = new Set(cells.map(([c, r]) => c + ',' + r)); return cells.map(([c, r]) => ({ c, r, mask: (set.has(c + ',' + (r + 1)) ? 0 : 1) | (set.has((c + 1) + ',' + r) ? 0 : 2) | (set.has(c + ',' + (r - 1)) ? 0 : 4) | (set.has((c - 1) + ',' + r) ? 0 : 8) })); }
// 꽉 찬 줄 삭제 + 위쪽 줄 압축. 반환: 줄 지운 뒤의 칸 맵, 지워진 줄(압축 전 행), 지워진 수정 칸(압축 전 좌표), 원래 칸 → 새 칸 대응
function settle(map) {
  const full = []; for (let r = 0; r < 22; r++) { let n = 0; for (let c = 0; c < 10; c++) if (map.has(c + ',' + r)) n++; if (n === 10) full.push(r); }
  const crystals = []; for (const r of full) for (let c = 0; c < 10; c++) if (map.get(c + ',' + r) === 'X') crystals.push([c, r]);
  const out = new Map(), moved = new Map(); let shift = 0;
  for (let r = 0; r < 22; r++) { if (full.includes(r)) { shift++; continue; } for (let c = 0; c < 10; c++) { const k = c + ',' + r; if (map.has(k)) { out.set(c + ',' + (r - shift), map.get(k)); moved.set(k, [c, r - shift]); } } }
  return { map: out, full, crystals, moved };
}
const mk = (spec) => { const m = new Map(); for (const [c, r, k] of spec) m.set(c + ',' + r, k); return m; };
const kindAt = (c, r) => ((c + r) % 2 ? 'T' : 'O');
const fill = (rows) => { const out = []; for (const [r, cols] of rows) for (const c of cols) out.push([c, r, kindAt(c, r)]); return out; };

// ---------- 시나리오 ----------
const T0 = 4; // 사건 시작 틱 (그 전에는 사건 직전 화면)
const scenarios = [
  { id: 1, name: 'LOCK 단독', desc: 'T 미노가 바닥 위에 고정 (줄 삭제 없음)',
    pre: mk([...fill([[0, [0, 1, 2, 3, 4, 5, 7, 8, 9]], [1, [0, 1, 2, 3, 4, 5, 8, 9]]]), [3, 2, 'T'], [4, 2, 'T'], [5, 2, 'T'], [4, 3, 'T']]),
    lock: [[3, 2], [4, 2], [5, 2], [4, 3]], focus: [2, 1, 7, 4] },
  { id: 2, name: '1줄 CLEAR', desc: 'I 미노가 빈 4칸을 채워 한 줄 삭제 (남는 칸 없음)',
    pre: mk([...fill([[0, [0, 1, 2, 7, 8, 9]], [1, [0, 1, 8, 9]], [2, [0, 9]]]), [3, 0, 'T'], [4, 0, 'T'], [5, 0, 'T'], [6, 0, 'T']]), clear: true, focus: [0, 0, 10, 3] },
  { id: 3, name: '여러 줄 동시 CLEAR (4줄)', desc: 'I 미노 세로로 4줄 동시 삭제',
    pre: mk([...fill([[0, [0, 1, 2, 3, 5, 6, 7, 8, 9]], [1, [0, 1, 2, 3, 5, 6, 7, 8, 9]], [2, [0, 1, 2, 3, 5, 6, 7, 8, 9]], [3, [0, 1, 2, 3, 5, 6, 7, 8, 9]], [4, [0, 1, 2]]]), [4, 0, 'T'], [4, 1, 'T'], [4, 2, 'T'], [4, 3, 'T']]), clear: true, focus: [0, 0, 10, 5] },
  { id: 4, name: '수정 칸 1개 파괴', desc: '수정 파괴 이펙트만 (줄 삭제 가로빛 없이)',
    pre: mk([...fill([[0, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]], [1, [0, 1, 2, 3, 4, 5, 6, 7, 8]]]), [6, 1, 'X']]), crystalsOnly: [[6, 1]], focus: [3, 0, 10, 3] },
  { id: 5, name: '수정 칸 여러 개 동시 파괴', desc: '수정 5개가 동시에 파괴 (가까운 칸 포함)',
    pre: mk([...fill([[0, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]], [1, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]], [2, [1, 2, 3, 4, 5, 6, 7, 8]]]), [2, 1, 'X'], [4, 1, 'X'], [6, 1, 'X'], [7, 0, 'X'], [4, 2, 'X']]), crystalsOnly: [[2, 1], [4, 1], [6, 1], [7, 0], [4, 2]], focus: [0, 0, 10, 4] },
  { id: 6, name: 'LOCK과 CLEAR 동시', desc: 'L 미노 3칸이 줄을 완성해 삭제, 남은 1칸은 아래로 내려와 LOCK (삭제 칸에는 LOCK 없음)',
    pre: mk([...fill([[0, [0, 1, 2, 3, 4, 8, 9]], [1, [0, 1, 2, 3, 8, 9]], [2, [0, 1]]]), [5, 0, 'T'], [6, 0, 'T'], [7, 0, 'T'], [7, 1, 'T']]), clear: true, lock: [[7, 1]], focus: [0, 0, 10, 4] },
  { id: 7, name: 'LINE CLEAR와 수정 파괴 동시', desc: '삭제되는 줄에 수정 2개: 가로빛 → 수정 파편이 3틱(0.06초) 늦게 (연출 시간차만)',
    pre: mk([...fill([[0, [0, 1, 3, 4, 5, 6, 9]], [1, [0, 1, 2, 8, 9]], [2, [0, 9]]]), [2, 0, 'X'], [8, 0, 'X'], [7, 0, 'T'], [7, 1, 'T']]), clear: true, delayCrystal: 3, focus: [0, 0, 10, 4] },
];

function frameAt(sc, t) {
  const img = clone(base), ev = t - T0, after = ev >= 0;
  let cells = sc.pre, moved = null, info2 = null;
  if (after && sc.clear) { info2 = settle(sc.pre); cells = info2.map; moved = info2.moved; }
  if (after && sc.crystalsOnly) cells = new Map([...cells].filter(([k]) => !sc.crystalsOnly.some(([c, r]) => k === c + ',' + r))); // 터진 수정 칸 블록은 사라짐
  for (const [k, kind] of cells) { const [c, r] = k.split(',').map(Number); drawBlock(img, c, r, kind); }
  if (!after) return img;
  if (sc.lock) { const pos = sc.lock.map(([c, r]) => { const m = moved ? moved.get(c + ',' + r) : [c, r]; return m; }).filter(Boolean); for (const m of masks(pos)) drawLock(img, m.c, m.r, m.mask, ev); } // 삭제된 칸은 제외, 남는 칸은 압축 후 위치
  if (sc.lock && !sc.clear) { /* 위에서 처리 */ }
  if (info2) for (const r of info2.full) drawClear(img, r, ev);
  const delay = sc.delayCrystal || 0;
  const cs = sc.crystalsOnly || (info2 ? info2.crystals : []);
  for (const [c, r] of cs) drawCrystal(img, c, r, ev - delay);
  return img;
}
const outDir = `${R}/preview`;
const keyTicks = [-1, 0, 1, 2, 3, 5, 7]; // 사건 시작 전, 시작 직후부터
for (const sc of scenarios) {
  const frames = [], N = 34;
  for (let t = 0; t < N; t++) frames.push(frameAt(sc, t));
  // 실제 크기 GIF (보드 아래 13줄 그대로)
  writeGif(`${outDir}/Scenario${sc.id}_actual.gif`, frames, TICK);
  // 확대 GIF: 관심 영역 4배
  const [c0, r0, c1, r1] = sc.focus; const fx = BX + 27 * c0 - CROP.x - 14, fy = BY - 27 * (r1 + 1) - CROP.y - 14 - 12, fw = 27 * (c1 - c0) + 28, fh = 27 * (r1 - r0 + 1) + 28 + 12;
  const rx = Math.max(0, fx), ry = Math.max(0, fy), rw = Math.min(CROP.w - rx, fw), rh = Math.min(CROP.h - ry, fh);
  const zoom = frames.map(f => up(p.crop(f, rx, ry, rw, rh), 4));
  writeGif(`${outDir}/Scenario${sc.id}_x4.gif`, zoom, TICK);
  for (const d of (process.argv[2] || '').split(',').filter(Boolean)) { const [sid, ev] = d.split(':').map(Number); if (sid !== sc.id) continue; p.encode(zoom[T0 + ev], `${R}/work/dump_S${sid}_t${ev}.png`); p.encode(up(p.crop(frames[T0 + ev], rx, ry, rw, rh), 2), `${R}/work/dump2_S${sid}_t${ev}.png`); } // 확인용: 시나리오:사건 후 틱
  // 정지 이미지: 핵심 틱을 가로로 이어 붙임 (실제 크기 / 확대 3배)
  const picks = keyTicks.map(k => T0 + k);
  const mkStrip = (list, scale) => { const w = list[0].w * scale, h = list[0].h * scale, g = 6, o = solid(list.length * (w + g) + g, h + 2 * g, '#070c14'); list.forEach((im, i) => blit(o, scale > 1 ? up(im, scale) : im, g + i * (w + g), g, 1)); return o; };
  p.encode(mkStrip(picks.map(t => p.crop(frameAt(sc, t), rx, ry, rw, rh)), 3), `${outDir}/Scenario${sc.id}_keyframes_x3.png`);
  p.encode(mkStrip([frameAt(sc, T0 + 1)].concat([]), 1), `${outDir}/Scenario${sc.id}_actual_still.png`);
  console.log(`시나리오 ${sc.id} ${sc.name}: 프레임 ${frames.length}, 실제 ${frames[0].w}x${frames[0].h}, 확대 ${zoom[0].w}x${zoom[0].h}`);
}
