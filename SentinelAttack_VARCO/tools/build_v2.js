// 12프레임 조립 (v2, 작업 폴더 전용): frames_v2.json 의 선택 후보를 128x104 셀에 배치하고 시트(6x2)·검사 이미지 생성
const fs = require('fs'), path = require('path');
const p = require('../../PauseUI_VARCO/tools/pix.js');
const L = require('./lib_place.js');
const SHEET = 'C:/Users/MBC-501-15/Documents/Tetrigeon/Tetrigeon/Assets/@Resources/Enemies/AmethystSentinelIdle/T_AmethystSentinel_Idle.png';
const FILE = process.env.FRAMES_JSON || 'frames_v2.json';
const J = JSON.parse(fs.readFileSync(path.join(L.R, 'tools', FILE), 'utf8')), FRAMES = J.frames, COLS = J.cols || 6, MS = J.ms;
const { CW, CH } = L;
const idleSheet = p.decode(SHEET);
const idleCellAt = (i) => { const f = p.crop(idleSheet, (i % 5) * 96, Math.floor(i / 5) * 96, 96, 96), o = p.blank(CW, CH); for (let y = 0; y < 96; y++) for (let x = 0; x < 96; x++) f.d.copy(o.d, ((y + L.OY) * CW + x + L.OX) * 4, (y * 96 + x) * 4, (y * 96 + x) * 4 + 4); return o; };
const idleCells = Array.from({ length: 10 }, (_, i) => idleCellAt(i));
const infos = [], cells = FRAMES.map(f => { if (!f.src) { infos.push({ name: 'idle01' }); return idleCells[0]; } const snapc = path.join(L.W_, 'snapc2_' + f.src + '.png'); const r = L.place(snapc, f.rf); infos.push({ name: f.src, offset: r.offset, cutBelowSole: r.cutBelowSole, outsideCanvas: r.outsideCanvas }); if (r.outsideCanvas) throw new Error(f.src + ' 캔버스 밖'); return r.cell; });
module.exports = { cells, idleCells, infos, CW, CH, FRAMES, COLS, MS };
if (require.main === module) {
  const tag = process.argv[2] || 'v2', OUT = path.join(L.R, 'output'), ROWS = Math.ceil(cells.length / COLS);
  const sheet = p.blank(CW * COLS, CH * ROWS);
  cells.forEach((c, i) => { const ox = (i % COLS) * CW, oy = Math.floor(i / COLS) * CH; for (let y = 0; y < CH; y++) c.d.copy(sheet.d, ((oy + y) * sheet.w + ox) * 4, y * CW * 4, (y + 1) * CW * 4); });
  p.encode(sheet, path.join(OUT, `T_AmethystSentinel_Attack_${tag}.png`));
  const S = 4, bg = [38, 44, 58], G = 4, gw = (CW * S + G) * COLS - G, gh = (CH * S + G) * ROWS - G, g = p.blank(gw, gh);
  for (let i = 0; i < gw * gh; i++) { g.d[i * 4] = bg[0]; g.d[i * 4 + 1] = bg[1]; g.d[i * 4 + 2] = bg[2]; g.d[i * 4 + 3] = 255; }
  cells.forEach((c, i) => { const up = p.nearestUp(c, S), ox = (i % COLS) * (CW * S + G), oy = Math.floor(i / COLS) * (CH * S + G); for (let y = 0; y < up.h; y++) for (let x = 0; x < up.w; x++) { const s = (y * up.w + x) * 4, t = ((oy + y) * gw + ox + x) * 4; if (up.d[s + 3]) up.d.copy(g.d, t, s, s + 4); if (y === (L.BASE_Y + 1) * S && x % 2 === 0) { g.d[t] = 90; g.d[t + 1] = 110; g.d[t + 2] = 140; } } });
  p.encode(g, path.join(OUT, `Sentinel_Attack_${tag}_inspect_${cells.length}frames.png`));
  console.log(infos.map((x, i) => (i + 1) + ':' + JSON.stringify(x)).join('\n'));
}
