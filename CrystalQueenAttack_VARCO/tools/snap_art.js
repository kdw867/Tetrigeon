// VARCO 결과(1024x1024, 셀 1칸 = 6.4px)를 원본 Idle 과 같은 "2x2 스프라이트 픽셀 = 도트 1칸" 격자로 스냅 (작업 폴더 전용)
// 블록 (i,j) 는 셀 좌표 x = 2i+1..2i+2, y = 2j+1..2j+2 (원본 Idle 01 의 블록 위상 (1,1)). 이미지 안 중심 = (12.8*(i+1), 12.8*(j+1)).
// 각 블록의 색은 중심 주변 7x7 픽셀의 중앙값을 팔레트(원본 25색)의 가장 가까운 색으로 바꾼 것. 흰 바탕은 투명.
// 사용: node tools/snap_art.js <raw.png> <out.png>   (out 은 160x160 셀, 블록은 2x2 로 키워 저장)
const fs = require('fs'), path = require('path');
const p = require('../../PauseUI_VARCO/tools/pix.js');
const { PAL, rimFix } = require('./snapq.js'), { clean } = require('./cleanq.js');
const d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
function snapArt(file) {
  const im = p.decode(file), S = im.w / 160, art = p.blank(80, 80), blocks = [];
  for (let j = 0; j < 79; j++) for (let i = 0; i < 79; i++) {
    const cx = Math.round(S * 2 * (i + 1)), cy = Math.round(S * 2 * (j + 1)), r = [], g = [], b = [];
    for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { const o = (Math.min(im.h - 1, cy + dy) * im.w + Math.min(im.w - 1, cx + dx)) * 4; r.push(im.d[o]); g.push(im.d[o + 1]); b.push(im.d[o + 2]); }
    const med = (a) => a.sort((x, y) => x - y)[a.length >> 1], m = [med(r), med(g), med(b)];
    if (m[0] > 232 && m[1] > 232 && m[2] > 232) continue; // 흰 바탕
    let best = PAL[0], bd = 1e9; for (const q of PAL) { const dd = d2(m, q); if (dd < bd) { bd = dd; best = q; } }
    const o = (j * 80 + i) * 4; art.d[o] = best[0]; art.d[o + 1] = best[1]; art.d[o + 2] = best[2]; art.d[o + 3] = 255; blocks.push([i, j]);
  }
  const rim = rimFix(art), cl = clean(art), out = p.blank(160, 160), n = [];
  for (let j = 0; j < 80; j++) for (let i = 0; i < 80; i++) { const o = (j * 80 + i) * 4; if (!art.d[o + 3]) continue; for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) { const X = 2 * i + 1 + x, Y = 2 * j + 1 + y; if (X > 159 || Y > 159) continue; const q = (Y * 160 + X) * 4; out.d[q] = art.d[o]; out.d[q + 1] = art.d[o + 1]; out.d[q + 2] = art.d[o + 2]; out.d[q + 3] = 255; } n.push(1); }
  return { img: out, n: n.length, rim, cl };
}
module.exports = { snapArt };
if (require.main === module) { const [inp, outp] = process.argv.slice(2), r = snapArt(inp); p.encode(r.img, outp); console.log('art blocks', r.n, 'rim', r.rim, 'clean', JSON.stringify(r.cl)); }
