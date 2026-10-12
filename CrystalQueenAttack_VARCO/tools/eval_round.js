// VARCO 결과를 셀 좌표로 스냅·정리한 뒤 자세 안내 이미지(변형 결과)와 비교 (작업 폴더 전용)
// 사용: node tools/eval_round.js <안내 이름> <raw 파일>...   → work/ev_<태그>.png (결과 | 안내 | 차이) 확대 비교
const fs = require('fs'), path = require('path'), cp = require('child_process');
const p = require('../../PauseUI_VARCO/tools/pix.js');
const R = path.join(__dirname, '..'), W_ = path.join(R, 'work');
const name = process.argv[2], files = process.argv.slice(3), tgt = p.decode(path.join(W_, 'warp_' + name + '.png'));
const kind = (r, g, b) => (g > 140 && b > 180 && r < 150 && g > r + 60) ? 'cy' : ((b - g > 55 && r > 40 && b > 90) ? 'pu' : 'st');
const stats = (im) => { let n = 0, pu = 0, cy = 0, x0 = 999, x1 = -1, y0 = 999, y1 = -1; for (let y = 0; y < 160; y++) for (let x = 0; x < 160; x++) { const o = (y * 160 + x) * 4; if (!im.d[o + 3]) continue; n++; const k = kind(im.d[o], im.d[o + 1], im.d[o + 2]); if (k === 'pu') pu++; if (k === 'cy') cy++; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } return { n, pu, cy, x0, x1, y0, y1 }; };
const comps = (im) => { const seen = new Uint8Array(25600); let c = 0; const A = (x, y) => x >= 0 && y >= 0 && x < 160 && y < 160 && im.d[(y * 160 + x) * 4 + 3]; for (let y = 0; y < 160; y++) for (let x = 0; x < 160; x++) { if (!A(x, y) || seen[y * 160 + x]) continue; c++; const st = [[x, y]]; seen[y * 160 + x] = 1; while (st.length) { const [a, b] = st.pop(); for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = a + dx, Y = b + dy; if (A(X, Y) && !seen[Y * 160 + X]) { seen[Y * 160 + X] = 1; st.push([X, Y]); } } } } return c; };
const iou = (a, b) => { let i = 0, u = 0; for (let k = 0; k < 25600; k++) { const x = a.d[k * 4 + 3] ? 1 : 0, y = b.d[k * 4 + 3] ? 1 : 0; if (x && y) i++; if (x || y) u++; } return i / u; };
const T = stats(tgt); console.log(`target ${name}: dots ${T.n} purple ${T.pu} cyan ${T.cy} bbox x${T.x0}-${T.x1} y${T.y0}-${T.y1}`);
for (const f of files) {
  const tag = path.basename(f, '.png'); cp.execFileSync('node', [path.join(__dirname, 'snapq.js'), f, '6.4', '160'], { stdio: 'pipe' });
  const sn = path.join(W_, 'snapq_' + tag + '.png'), cl = path.join(W_, 'snapcq_' + tag + '.png'); cp.execFileSync('node', [path.join(__dirname, 'cleanq.js'), sn, cl], { stdio: 'pipe' });
  const im = p.decode(cl), S = stats(im);
  console.log(`${tag}: dots ${S.n} purple ${S.pu} cyan ${S.cy} bbox x${S.x0}-${S.x1} y${S.y0}-${S.y1} comps ${comps(im)} IoU vs guide ${iou(im, tgt).toFixed(3)}`);
}
