// 센티넬 보호막 스킬 — 핵심 포즈 + 보호막 농도 비교 미리보기 (작업 폴더 전용, 합성 미리보기이며 실제 Unity 영상이 아님)
// 층: 본체(원본 Idle 01 / 웅크리는 중 / 웅크림 유지) → 보호막 면(fill) → 보호막 테두리(rim). 게임 화면 합성은 스테이지 10 배치(애벌레 · 센티넬 · 여왕)를 따른다.
const fs = require('fs'), path = require('path');
const p = require('../../PauseUI_VARCO/tools/pix.js'), L = require('../../CrystalQueenRotLock_VARCO/tools/lib_view.js'), LP = require('./lib_place.js'), SA = require('./shield_art.js');
const W = path.join(__dirname, '..', 'work'), OUT = path.join(__dirname, '..', 'output'), VER = 'v1';
const SHEET = 'C:/Users/MBC-501-15/Documents/Tetrigeon/Tetrigeon/Assets/@Resources/Enemies/AmethystSentinelIdle/T_AmethystSentinel_Idle.png';
const idle = p.blank(LP.CW, LP.CH); { const f = p.crop(p.decode(SHEET), 0, 0, 96, 96); for (let y = 0; y < 96; y++) for (let x = 0; x < 96; x++) if (f.d[(y * 96 + x) * 4 + 3]) f.d.copy(idle.d, ((y + LP.OY) * LP.CW + x + LP.OX) * 4, (y * 96 + x) * 4, (y * 96 + x) * 4 + 4); }
const POSES = [['stand', '기본', idle], ['mid', '웅크리는 중', p.decode(path.join(W, 'cell_mid_clean_mid_2.png'))], ['hold', '웅크림 유지', p.decode(path.join(W, 'cell_hold_clean_hold_3.png'))]];
const shield = SA.build(POSES[2][2]); // 보호막은 웅크림 유지 실루엣에 맞춤 (충전 중 크기·위치 고정)
const save = (img, name) => { const f = path.join(OUT, 'SentinelShield_' + name + '_' + VER + '.png'); p.encode(img, f); console.log(path.basename(f), img.w + 'x' + img.h); return f; };
const BG = [38, 44, 58], crop = (c) => p.crop(c, 8, 12, 128, 90);
const onBg = (cells, bg) => { const o = L.opaque(LP.CW, LP.CH, bg || BG); for (const c of cells) L.put(o, c, 0, 0, 1, [0, 0]); return o; };
// 1) 핵심 포즈 3장 (6배): 기본 → 웅크리는 중 → 웅크림 유지
save(L.grid(POSES.map(([, , c]) => p.nearestUp(crop(onBg([c])), 6)), 3, 8, ['1', '2', '3']), 'KeyPoses_3poses_x6');
// 2) 겹쳐 보기: 기본 자세 윤곽(청록 점선)을 웅크림 위에 겹쳐 발 위치·높이 변화 확인
{ const base = onBg([POSES[2][2]]), ol = (src, col) => { for (let y = 0; y < LP.CH; y++) for (let x = 0; x < LP.CW; x++) { const A = (xx, yy) => (xx < 0 || yy < 0 || xx >= LP.CW || yy >= LP.CH) ? 0 : src.d[(yy * LP.CW + xx) * 4 + 3]; if (A(x, y) && (!A(x - 1, y) || !A(x + 1, y) || !A(x, y - 1) || !A(x, y + 1)) && (x + y) % 2 === 0) { const q = (y * LP.CW + x) * 4; base.d[q] = col[0]; base.d[q + 1] = col[1]; base.d[q + 2] = col[2]; } } }; ol(idle, [49, 230, 239]); const mid = onBg([POSES[1][2]]); ol(idle, [49, 230, 239]); save(p.nearestUp(crop(base), 6), 'KeyPoses_overlay-on-standing_x6'); }
// 3) 보호막 농도 비교: 0 / 25 / 50 / 75 / 100 % (웅크림 유지 + 보호막, 6배와 4배)
const LEVELS = [0, 0.25, 0.5, 0.75, 1];
const comp = (pr, bg) => { const o = onBg([POSES[2][2]], bg); SA.blend(o, shield.fill, SA.A_FILL(pr)); SA.blend(o, shield.rim, SA.A_RIM(pr)); return o; };
save(L.grid(LEVELS.map(pr => p.nearestUp(crop(comp(pr)), 4)), 3, 8, ['0', '25', '50', '75', '100']), 'ShieldDensity_5levels_x4');
// 4) 보호막 두 층 따로 (확대) + 알파 값 표
{ const fo = (img) => { const o = L.opaque(LP.CW, LP.CH, [60, 62, 74]); L.put(o, img, 0, 0, 1, [0, 0]); return p.nearestUp(crop(o), 4); }; save(L.grid([fo(shield.fill), fo(shield.rim)], 2, 8, ['1', '2']), 'ShieldLayers_fill-rim_x4'); }
// 5) 실제 게임 화면 합성 (스테이지 10 배치: 애벌레 · 센티넬 · 여왕), 실제 표시 크기 ×1 과 ×2
const scr = L.SCR(), LC = require('../../CaterpillarAttack_VARCO/tools/lib_cat.js'), larvaIdle = (i) => LC.loadIdle(i);
const bg = { w: scr.w, h: scr.h, d: Buffer.from(scr.d) }; { const COX = 1533, COY = 155, mask = new Uint8Array(scr.w * scr.h); for (let i = 0; i < 10; i++) { const f = larvaIdle(i); for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) if (f.d[(y * 64 + x) * 4 + 3]) for (let dy = -1; dy < 3; dy++) for (let dx = -1; dx < 3; dx++) mask[(COY + y * 2 + dy) * scr.w + COX + x * 2 + dx] = 1; }
  for (let y = 0; y < scr.h; y++) { let x = 0; while (x < scr.w) { if (!mask[y * scr.w + x]) { x++; continue; } let e = x; while (e < scr.w && mask[y * scr.w + e]) e++; const l = x - 1, r = e; for (let k = x; k < e; k++) { const t = (k - l) / (r - l); for (let c = 0; c < 3; c++) bg.d[(y * scr.w + k) * 4 + c] = Math.round(scr.d[(y * scr.w + l) * 4 + c] * (1 - t) + scr.d[(y * scr.w + r) * 4 + c] * t); } x = e; } } }
const FOOT_X = 1574, SX = FOOT_X - 72 * 2, SY = 259 - 94 * 2; // 센티넬 셀 원점 (발 기준점 셀 (72,94) → 화면 (1574,259))
const queen = p.decode(path.join('C:/Users/MBC-501-15/Documents/Tetrigeon/CrystalQueenAttack_VARCO/output/CastFrames_v3_cells', 'CrystalQueen_CastFrame_0_rest.png'));
const larva = larvaIdle(0), put2 = (o, c, ox, oy, k) => L.put(o, c, ox, oy, k, [0, 0]);
function scene(layers, opts = {}) { const o = { w: bg.w, h: bg.h, d: Buffer.from(bg.d) }; put2(o, larva, 1380 - 64, 259 - 104, 2); put2(o, queen, 1608, -37, 2); for (const [c, a] of layers) { if (a === 1) put2(o, c, SX, SY, 2); else { const t = { w: c.w, h: c.h, d: Buffer.from(c.d) }; for (let i = 0; i < t.w * t.h; i++) t.d[i * 4 + 3] = Math.round(t.d[i * 4 + 3] * a); sblend(o, t, SX, SY); } } return o; }
function sblend(o, c, ox, oy) { for (let y = 0; y < c.h; y++) for (let x = 0; x < c.w; x++) { const s = (y * c.w + x) * 4, a = c.d[s + 3] / 255; if (!a) continue; for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) { const q = ((oy + y * 2 + dy) * o.w + ox + x * 2 + dx) * 4; for (let k = 0; k < 3; k++) o.d[q + k] = Math.round(o.d[q + k] * (1 - a) + c.d[s + k] * a); } } }
const CR = [1300, 30, 480, 260]; // 애벌레 오른쪽 · 센티넬 · 여왕 왼쪽이 보이는 영역
const gameTiles = POSES.map(([, , c]) => p.crop(scene([[c, 1]]), ...CR));
const dens = LEVELS.map(pr => p.crop(scene([[POSES[2][2], 1], [shield.fill, SA.A_FILL(pr)], [shield.rim, SA.A_RIM(pr)]]), ...CR));
save(L.grid(gameTiles, 3, 8, ['1', '2', '3']), 'KeyPoses_game-screen_actual-size_x1'); save(p.nearestUp(L.grid(gameTiles, 3, 8, ['1', '2', '3']), 2), 'KeyPoses_game-screen_x2');
save(L.grid(dens, 3, 8, ['0', '25', '50', '75', '100']), 'ShieldDensity_game-screen_actual-size_x1'); save(p.nearestUp(L.grid(dens, 3, 8, ['0', '25', '50', '75', '100']), 2), 'ShieldDensity_game-screen_x2');
// 6) 셀 파일 저장 (본체 3장, 보호막 2층)
const CD = path.join(OUT, 'SentinelShield_cells_' + VER); fs.mkdirSync(CD, { recursive: true });
POSES.forEach(([k, , c]) => p.encode(c, path.join(CD, 'Sentinel_' + k + '.png'))); p.encode(shield.fill, path.join(CD, 'Shield_fill.png')); p.encode(shield.rim, path.join(CD, 'Shield_rim.png'));
// 7) 검사 수치
const A = (im, x, y) => (x < 0 || y < 0 || x >= im.w || y >= im.h) ? 0 : im.d[(y * im.w + x) * 4 + 3];
const origPal = new Set(); for (let i = 0; i < LP.CW * LP.CH; i++) if (idle.d[i * 4 + 3]) origPal.add(idle.d[i * 4] + ',' + idle.d[i * 4 + 1] + ',' + idle.d[i * 4 + 2]);
const report = { poses: {} };
for (const [k, name, c] of POSES) {
  let x0 = 999, x1 = -1, y0 = 999, y1 = -1, nb = 0, off = 0, bad = 0, n = 0; const foot = []; for (let y = 0; y < LP.CH; y++) for (let x = 0; x < LP.CW; x++) { const o = (y * LP.CW + x) * 4, a = c.d[o + 3]; if (!a) continue; n++; if (a !== 255) nb++; if (!origPal.has(c.d[o] + ',' + c.d[o + 1] + ',' + c.d[o + 2])) off++; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  for (let x = 0; x < LP.CW; x++) if (A(c, x, y1)) foot.push(x); let s = foot[0], runs = []; for (let i = 1; i <= foot.length; i++) if (i === foot.length || foot[i] !== foot[i - 1] + 1) { runs.push([s, foot[i - 1]]); s = foot[i]; }
  report.poses[k] = { name, dots: n, bbox: [x0, y0, x1, y1], height: y1 - y0 + 1, width: x1 - x0 + 1, bottomRow: y1, nonBinaryAlpha: nb, offPaletteColors: off, edgeTouch: (x0 <= 0 || y0 <= 0 || x1 >= LP.CW - 1) ? 1 : 0, bottomRuns: runs };
}
// 보호막 화면 크기와 이웃·UI 여백 (화면 px)
{ const f = shield.info, sx0 = SX + f.bl * 4, sx1 = SX + (f.br + 1) * 4, sy0 = SY + f.bt * 4, sy1 = SY + (f.bb + 1) * 4;
  let qL = 9999, lR = -1; for (let y = 0; y < queen.h; y++) for (let x = 0; x < queen.w; x++) if (queen.d[(y * queen.w + x) * 4 + 3] && y >= 20 && y <= 150) { const X = 1608 + x * 2; if (X < qL && -37 + y * 2 >= sy0 && -37 + y * 2 <= sy1) qL = X; }
  for (let y = 0; y < larva.h; y++) for (let x = 0; x < larva.w; x++) if (larva.d[(y * 64 + x) * 4 + 3]) lR = Math.max(lR, 1316 + x * 2);
  report.shield = { screenRect: [sx0, sy0, sx1, sy1], widthPx: sx1 - sx0, heightPx: sy1 - sy0, queenLeftEdgeX: qL, gapToQueenPx: qL - sx1, larvaRightEdgeX: lR, gapToLarvaPx: sx0 - lR, hpBarTopY: 268, gapAboveHpBarPx: 268 - sy1, topY: sy0 };
  report.shield.layers = { fillDots: [...Array(1)].map(() => { let n = 0; for (let i = 0; i < LP.CW * LP.CH; i++) if (shield.fill.d[i * 4 + 3]) n++; return n; })[0], rimDots: (() => { let n = 0; for (let i = 0; i < LP.CW * LP.CH; i++) if (shield.rim.d[i * 4 + 3]) n++; return n; })() }; }
report.alpha = { fill: LEVELS.map(pr => +SA.A_FILL(pr).toFixed(3)), rim: LEVELS.map(pr => +SA.A_RIM(pr).toFixed(3)), levels: LEVELS };
fs.writeFileSync(path.join(OUT, 'SentinelShield_KeyPoses_report_' + VER + '.json'), JSON.stringify(report, null, 1)); console.log(JSON.stringify(report.poses)); console.log(JSON.stringify(report.shield));
