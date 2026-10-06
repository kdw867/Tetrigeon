// 보상 화면 도구 공용: 비트맵 글꼴 로드·글자 그리기·정수배 확대 합성
const p = require('../../PauseUI_VARCO/tools/pix.js'), path = require('path'), fs = require('fs');
const R = path.join(__dirname, '..');
const meta = JSON.parse(fs.readFileSync(R + '/font/PixelFont.json', 'utf8')); // 글자별 위치·간격 정보
const atlas = {}; // 색상별 아틀라스 캐시
const getAtlas = name => atlas[name] || (atlas[name] = p.decode(`${R}/font/PixelFont_${name}.png`));
// src 이미지를 scale배(정수) 확대해 dst의 (ox,oy) 왼쪽 위에 알파 합성. 소스 영역 sx,sy,sw,sh를 지정 가능
function blit(dst, src, ox, oy, scale = 1, sx = 0, sy = 0, sw = src.w, sh = src.h) {
  for (let y = 0; y < sh * scale; y++) for (let x = 0; x < sw * scale; x++) {
    const X = ox + x, Y = oy + y; if (X < 0 || Y < 0 || X >= dst.w || Y >= dst.h) continue;
    const s = ((sy + Math.floor(y / scale)) * src.w + sx + Math.floor(x / scale)) * 4, a = src.d[s + 3] / 255; if (!a) continue;
    const d = (Y * dst.w + X) * 4; for (let c = 0; c < 3; c++) dst.d[d + c] = Math.round(src.d[s + c] * a + dst.d[d + c] * (1 - a)); dst.d[d + 3] = Math.max(dst.d[d + 3], src.d[s + 3]);
  }
}
// 글자 한 줄의 가로 길이 (글꼴 픽셀 기준)
function measure(str) { let t = 0; for (const ch of str) { const g = meta.glyphs[ch]; if (g) t += g.advance; } return t; }
// 글자 그리기. align: 'l'(x가 왼쪽 끝) | 'c'(가운데) | 'r'. y는 줄 가운데. Unity PixelText와 같은 규칙
function text(dst, color, str, x, y, scale, align = 'c') {
  const a = getAtlas(color), total = measure(str) * scale; let pen = align === 'l' ? x : align === 'r' ? x - total : x - total / 2;
  const top = Math.round(y - meta.lineHeight * scale / 2);
  for (const ch of str) { const g = meta.glyphs[ch]; if (!g) continue; if (g.w) blit(dst, a, Math.round(pen - meta.outline * scale), top + g.yOffset * scale, scale, g.x, g.y, g.w, g.h); pen += g.advance * scale; }
  return total;
}
const fill = (img, x, y, w, h, hex) => { const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16); for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) { if (i < 0 || j < 0 || i >= img.w || j >= img.h) continue; const o = (j * img.w + i) * 4; img.d[o] = r; img.d[o + 1] = g; img.d[o + 2] = b; img.d[o + 3] = 255; } };
const put = (img, x, y, hex) => fill(img, x, y, 1, 1, hex);
module.exports = { p, R, meta, getAtlas, blit, measure, text, fill, put };
