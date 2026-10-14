// 게임 화면 합성 도구 (작업 폴더 전용, 합성 미리보기이며 실제 Unity 영상이 아님). preview_keys.js 의 스테이지 10 배치(애벌레 · 센티넬 · 여왕)를 재사용 가능한 형태로 옮김.
// 센티넬 발 기준점 화면 (1574,259), 셀 원점 (SX,SY) = (1430,71), 배율 2 (텍스처 1px = 화면 2px). 이펙트 캔버스 원점 = 셀 원점 − (64,64).
const path = require('path');
const p = require('../../PauseUI_VARCO/tools/pix.js'), L = require('../../CrystalQueenRotLock_VARCO/tools/lib_view.js'), LC = require('../../CaterpillarAttack_VARCO/tools/lib_cat.js');
const scr = L.SCR(), bg = { w: scr.w, h: scr.h, d: Buffer.from(scr.d) };
{ const COX = 1533, COY = 155, mask = new Uint8Array(scr.w * scr.h); for (let i = 0; i < 10; i++) { const f = LC.loadIdle(i); for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) if (f.d[(y * 64 + x) * 4 + 3]) for (let dy = -1; dy < 3; dy++) for (let dx = -1; dx < 3; dx++) mask[(COY + y * 2 + dy) * scr.w + COX + x * 2 + dx] = 1; } // 원래 캡처의 애벌레 자리를 좌우 색 보간으로 지움
  for (let y = 0; y < scr.h; y++) { let x = 0; while (x < scr.w) { if (!mask[y * scr.w + x]) { x++; continue; } let e = x; while (e < scr.w && mask[y * scr.w + e]) e++; const l = x - 1, r = e; for (let k = x; k < e; k++) { const t = (k - l) / (r - l); for (let c = 0; c < 3; c++) bg.d[(y * scr.w + k) * 4 + c] = Math.round(scr.d[(y * scr.w + l) * 4 + c] * (1 - t) + scr.d[(y * scr.w + r) * 4 + c] * t); } x = e; } } }
const FOOT_X = 1574, SX = FOOT_X - 72 * 2, SY = 259 - 94 * 2, FX0 = SX - 64, FY0 = SY - 64;
const queen = p.decode(path.join('C:/Users/MBC-501-15/Documents/Tetrigeon/CrystalQueenAttack_VARCO/output/CastFrames_v3_cells', 'CrystalQueen_CastFrame_0_rest.png')), larva = LC.loadIdle(0);
const QX = 1608, QY = -37, LX = 1380 - 64, LY = 259 - 104; // 여왕·애벌레 셀 원점(화면, 배율 2)
const put2 = (o, c, ox, oy, k) => L.put(o, c, ox, oy, k, [0, 0]);
function sblend(o, c, ox, oy) { for (let y = 0; y < c.h; y++) for (let x = 0; x < c.w; x++) { const s = (y * c.w + x) * 4, a = c.d[s + 3] / 255; if (!a) continue; for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) { const X = ox + x * 2 + dx, Y = oy + y * 2 + dy; if (X < 0 || Y < 0 || X >= o.w || Y >= o.h) continue; const q = (Y * o.w + X) * 4; for (let k = 0; k < 3; k++) o.d[q + k] = Math.round(o.d[q + k] * (1 - a) + c.d[s + k] * a); } } }
// 한 장면: 배경 + 애벌레 + 여왕 + 센티넬 본체 셀(불투명 합성) + 이펙트(알파 합성, 이펙트 캔버스 이미지)
function scene(body, fxImg) { const o = { w: bg.w, h: bg.h, d: Buffer.from(bg.d) }; put2(o, larva, LX, LY, 2); put2(o, queen, QX, QY, 2); if (body) put2(o, body, SX, SY, 2); if (fxImg) sblend(o, fxImg, FX0, FY0); return o; }
// 이웃(애벌레·여왕) 불투명 화면 픽셀 집합 → 이펙트와 겹침 검사용
const nbr = new Uint8Array(scr.w * scr.h); for (const [c, ox, oy] of [[larva, LX, LY], [queen, QX, QY]]) for (let y = 0; y < c.h; y++) for (let x = 0; x < c.w; x++) if (c.d[(y * c.w + x) * 4 + 3]) for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) { const X = ox + x * 2 + dx, Y = oy + y * 2 + dy; if (X >= 0 && Y >= 0 && X < scr.w && Y < scr.h) nbr[Y * scr.w + X] = 1; }
// 타깃 화살표(노란 ▼) 상자: 센티넬 머리 위 근처의 노란 픽셀
function arrowBox() { let x0 = 9999, y0 = 9999, x1 = -1, y1 = -1, col = null; for (let y = 40; y < 118; y++) for (let x = 1540; x < 1660; x++) { const q = (y * scr.w + x) * 4, r = scr.d[q], g = scr.d[q + 1], b = scr.d[q + 2]; if (r > 200 && g > 190 && r - b > 60) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); col = [r, g, b]; } } return { x0, y0, x1, y1, col }; }
module.exports = { scr, bg, SX, SY, FX0, FY0, scene, sblend, nbr, arrowBox, larva, queen, put2, p, L };
