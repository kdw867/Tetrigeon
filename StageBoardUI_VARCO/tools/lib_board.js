// 스테이지 현황판 작업용 공통 도구 (작업 폴더 전용, Unity 에셋 아님)
const p = require('../../PauseUI_VARCO/tools/pix.js'), path = require('path'), fs = require('fs');
const R = path.join(__dirname, '..');
const ROOT = path.join(R, '..');

const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
// 기존 명패·배경에서 뽑은 색 (명패 12색 분석 + 룬 청록 + HP 숫자 청록)
const PAL = {
  outline: '#0a111c', stoneDark: '#252f3e', stoneMid: '#4d5460', stoneLight: '#9098a1', stoneEdge: '#343c49',
  fillDark: '#0f1927', fillMid: '#1a2534', fillSlot: '#101a29',
  tealBright: '#8cecf4', tealMid: '#3ec0d6', tealDim: '#2a8ea0', tealDeep: '#1d6f82', tealFill: '#0f2a35', tealFillHi: '#123644',
};

const px = (img, x, y) => { const o = (y * img.w + x) * 4; return [img.d[o], img.d[o + 1], img.d[o + 2], img.d[o + 3]]; };
function put(img, x, y, c, a = 255) { if (x < 0 || y < 0 || x >= img.w || y >= img.h) return; const o = (y * img.w + x) * 4; const col = typeof c === 'string' ? hex(c) : c; img.d[o] = col[0]; img.d[o + 1] = col[1]; img.d[o + 2] = col[2]; img.d[o + 3] = a; }
function rect(img, x, y, w, h, c) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) put(img, i, j, c); }

// 알파 합성으로 src를 dst 위에 그림. 배율 s는 실수 가능(유니티 Point 필터처럼 가장 가까운 픽셀을 반복). tint는 [r,g,b] 0~1 곱, alpha는 전체 투명도
function blit(dst, src, x0, y0, s = 1, tint = null, alpha = 1, sx = 0, sy = 0, sw = src.w, sh = src.h) {
  const W = Math.round(sw * s), H = Math.round(sh * s);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const X = x0 + x, Y = y0 + y; if (X < 0 || Y < 0 || X >= dst.w || Y >= dst.h) continue;
    const u = sx + Math.min(sw - 1, Math.floor(x / s)), v = sy + Math.min(sh - 1, Math.floor(y / s));
    const so = (v * src.w + u) * 4, a = src.d[so + 3] / 255 * alpha; if (a <= 0) continue;
    const dO = (Y * dst.w + X) * 4;
    for (let c = 0; c < 3; c++) { const sc = src.d[so + c] * (tint ? tint[c] : 1); dst.d[dO + c] = Math.round(sc * a + dst.d[dO + c] * (1 - a)); }
    dst.d[dO + 3] = 255;
  }
}

// 비트맵 글꼴: json(글자 위치·간격) + 색별 PNG
function loadFont(jsonPath, pngPath) { const meta = JSON.parse(fs.readFileSync(jsonPath, 'utf8')); return { meta, atlas: p.decode(pngPath) }; }
function measure(font, str) { let t = 0; for (const ch of str) { const g = font.meta.glyphs[ch]; if (g) t += g.advance; } return t; }
// (x, y)는 글자 줄의 왼쪽 위(align l) / 가운데 위(c) / 오른쪽 위(r). 몸통이 cursor에서 시작하도록 외곽선만큼 왼쪽으로
function drawText(dst, font, str, x, y, s, align = 'l') {
  const total = measure(font, str) * s; let cur = align === 'c' ? x - total / 2 : align === 'r' ? x - total : x;
  for (const ch of str) {
    const g = font.meta.glyphs[ch]; if (!g) continue;
    if (g.w) blit(dst, font.atlas, Math.round(cur - font.meta.outline * s), Math.round(y + g.yOffset * s), s, null, 1, g.x, g.y, g.w, g.h);
    cur += g.advance * s;
  }
}

module.exports = { p, R, ROOT, hex, PAL, px, put, rect, blit, loadFont, measure, drawText };
