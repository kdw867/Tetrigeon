// VARCO 정리본 평가 (작업 폴더 전용): 스냅(원본 도트 1칸=1px, 팔레트 치환) → 정리 → 144x104 셀 배치 → 안내 이미지와 실루엣 일치율·색 도트 수·연결 덩어리·구멍을 잰다.
// 사용: node eval_clean.js <pose: hold|mid> <raw 파일 이름들...>   (work/varco_raw/<이름>.png)
const fs = require('fs'), path = require('path');
const p = require('../../PauseUI_VARCO/tools/pix.js'), LP = require('./lib_place.js'), G = require('./crouch_guide.js');
const [pose, ...names] = process.argv.slice(2), W = path.join(__dirname, '..', 'work');
// 안내 이미지를 같은 144x104 캔버스에 배치 (몸 영역 원점 = 캔버스 (32,22), 발줄 = 94)
const gb = G.close(G.build(pose).img, 2).img, guideCell = p.blank(LP.CW, LP.CH);
for (let y = 0; y < gb.h; y++) for (let x = 0; x < gb.w; x++) { const s = (y * gb.w + x) * 4; if (gb.d[s + 3]) { const X = x + 32, Y = y + 22; if (X < LP.CW && Y < LP.CH) gb.d.copy(guideCell.d, (Y * LP.CW + X) * 4, s, s + 4); } }
const A = (im, x, y) => (x < 0 || y < 0 || x >= im.w || y >= im.h) ? 0 : im.d[(y * im.w + x) * 4 + 3];
function comps(im) { const lab = new Int32Array(im.w * im.h).fill(-1); const sizes = []; for (let y0 = 0; y0 < im.h; y0++) for (let x0 = 0; x0 < im.w; x0++) { if (!A(im, x0, y0) || lab[y0 * im.w + x0] >= 0) continue; const id = sizes.length; let n = 0; const st = [[x0, y0]]; lab[y0 * im.w + x0] = id; while (st.length) { const [x, y] = st.pop(); n++; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = x + dx, Y = y + dy; if (A(im, X, Y) && lab[Y * im.w + X] < 0) { lab[Y * im.w + X] = id; st.push([X, Y]); } } } sizes.push(n); } return sizes; }
function holes(im) { const seen = new Uint8Array(im.w * im.h); const st = []; for (let x = 0; x < im.w; x++) { st.push([x, 0], [x, im.h - 1]); } for (let y = 0; y < im.h; y++) { st.push([0, y], [im.w - 1, y]); } while (st.length) { const [x, y] = st.pop(); if (x < 0 || y < 0 || x >= im.w || y >= im.h || seen[y * im.w + x] || A(im, x, y)) continue; seen[y * im.w + x] = 1; st.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]); } let n = 0; for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) if (!A(im, x, y) && !seen[y * im.w + x]) n++; return n; }
const gs = LP.stats(guideCell), gm = LP.mask(guideCell);
console.log('안내(' + pose + ') 도트', JSON.stringify(gs), '연결 덩어리', JSON.stringify(comps(guideCell)), '구멍', holes(guideCell));
const idle = p.blank(LP.CW, LP.CH); { const sh = p.decode('C:/Users/MBC-501-15/Documents/Tetrigeon/Tetrigeon/Assets/@Resources/Enemies/AmethystSentinelIdle/T_AmethystSentinel_Idle.png'), f = p.crop(sh, 0, 0, 96, 96); for (let y = 0; y < 96; y++) for (let x = 0; x < 96; x++) if (f.d[(y * 96 + x) * 4 + 3]) f.d.copy(idle.d, ((y + LP.OY) * LP.CW + x + LP.OX) * 4, (y * 96 + x) * 4, (y * 96 + x) * 4 + 4); }
console.log('원본 Idle 01 도트', JSON.stringify(LP.stats(idle)));
const baseRow = (im) => { for (let y = im.h - 1; y >= 0; y--) { let n = 0; for (let x = 0; x < im.w; x++) if (A(im, x, y)) n++; if (n >= 30) return y; } return -1; };
const gRf = (() => { const yb = LP.BASE_Y; let best = null; for (const y of [yb, yb - 1]) { let s = -1; for (let x = 0; x <= LP.CW; x++) { const a = x < LP.CW ? A(guideCell, x, y) : 0; if (a && s < 0) s = x; if (!a && s >= 0) { if (x - s >= 12 && (best === null || (s + x - 1) / 2 > best)) best = (s + x - 1) / 2; s = -1; } } } return best; })();
const out = {};
for (const n of names) {
  const raw = path.join(W, 'varco_raw', n + '.png'), sn = LP.prepare(raw, pose + '_' + n, true), pl = LP.place(sn, gRf), c = pl.cell, m = LP.mask(c);
  const st = LP.stats(c), sizes = comps(c).sort((a, b) => b - a), hl = holes(c);
  let top = 999; for (let y = 0; y < LP.CH && top === 999; y++) for (let x = 0; x < LP.CW; x++) if (A(c, x, y)) { top = y; break; }
  console.log(n, '| 윤곽 일치(IoU) ' + LP.iou(m, gm).toFixed(3), '| 도트', JSON.stringify(st), '| 맨 위 줄', top, '| 덩어리', sizes.slice(0, 4).join(','), '| 구멍', hl, '| 발 아래 잘림', pl.cutBelowSole, '| 이동', JSON.stringify(pl.offset));
  p.encode(c, path.join(W, 'cell_' + pose + '_' + n + '.png')); out[n] = { iou: LP.iou(m, gm), st, comps: sizes.slice(0, 4), holes: hl };
}
fs.writeFileSync(path.join(W, 'eval_' + pose + '.json'), JSON.stringify({ guide: gs, orig: LP.stats(idle), cand: out }, null, 1));
