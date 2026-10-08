// 픽셀 이펙트 작업용 공통 도구 (작업 폴더 전용, Unity 에셋 아님)
// - 이미지 입출력은 PauseUI_VARCO/tools/pix.js 재사용, GIF 인코더(LZW)는 여기서 직접 구현 (ffmpeg/ImageMagick 없음)
const p = require('../../PauseUI_VARCO/tools/pix.js'), path = require('path'), fs = require('fs');
const R = path.join(__dirname, '..');
const ROOT = path.join(R, '..');

const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
// 팔레트: 기존 UI(HP바·현황판)에서 쓴 청록, 몬스터·수정 보라, 아트 가이드의 제한적 백색 하이라이트
const C = {
  white: '#f4fbff', tealBright: '#8cecf4', tealMid: '#3ec0d6', tealDim: '#2a8ea0', tealDeep: '#1d6f82',
  purpleLight: '#b57be8', purpleMid: '#7a45b8', purpleDark: '#2d1752', purplePale: '#d9bdf7',
};

// 투명 캔버스에 불투명 픽셀 찍기 (경계 밖은 무시)
function put(img, x, y, color, a = 255) {
  x = Math.round(x); y = Math.round(y);
  if (x < 0 || y < 0 || x >= img.w || y >= img.h) return;
  const c = typeof color === 'string' ? hex(color) : color, o = (y * img.w + x) * 4;
  img.d[o] = c[0]; img.d[o + 1] = c[1]; img.d[o + 2] = c[2]; img.d[o + 3] = a;
}
const get = (img, x, y) => { const o = (y * img.w + x) * 4; return [img.d[o], img.d[o + 1], img.d[o + 2], img.d[o + 3]]; };
function rect(img, x, y, w, h, color) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(img, x + i, y + j, color); }
// src를 dst 위에 알파 합성 (정수 배율 s, 가장 가까운 픽셀)
function blit(dst, src, x0, y0, s = 1, alpha = 1) {
  for (let y = 0; y < src.h * s; y++) for (let x = 0; x < src.w * s; x++) {
    const X = x0 + x, Y = y0 + y; if (X < 0 || Y < 0 || X >= dst.w || Y >= dst.h) continue;
    const so = (Math.floor(y / s) * src.w + Math.floor(x / s)) * 4, a = src.d[so + 3] / 255 * alpha; if (a <= 0) continue;
    const d = (Y * dst.w + X) * 4;
    for (let c = 0; c < 3; c++) dst.d[d + c] = Math.round(src.d[so + c] * a + dst.d[d + c] * (1 - a));
    dst.d[d + 3] = 255;
  }
}
const solid = (w, h, color) => { const o = p.blank(w, h); const c = typeof color === 'string' ? hex(color) : color; for (let i = 0; i < w * h; i++) { o.d[i * 4] = c[0]; o.d[i * 4 + 1] = c[1]; o.d[i * 4 + 2] = c[2]; o.d[i * 4 + 3] = 255; } return o; };
const clone = (img) => ({ w: img.w, h: img.h, d: Buffer.from(img.d) });
// 정수 배율 확대 (픽셀 확인용)
const up = (img, k) => p.nearestUp(img, k);

// ---------- GIF 인코더 ----------
function quantizePalette(frames, maxColors) { // 빈도 높은 색 위주로 팔레트 구성 (5비트 단위로 묶음)
  const cnt = new Map();
  for (const f of frames) for (let i = 0; i < f.w * f.h; i++) { const o = i * 4; if (f.d[o + 3] < 128) continue; const k = ((f.d[o] >> 3) << 10) | ((f.d[o + 1] >> 3) << 5) | (f.d[o + 2] >> 3); const e = cnt.get(k) || [0, 0, 0, 0]; e[0]++; e[1] += f.d[o]; e[2] += f.d[o + 1]; e[3] += f.d[o + 2]; cnt.set(k, e); }
  return [...cnt.values()].sort((a, b) => b[0] - a[0]).slice(0, maxColors).map(e => [Math.round(e[1] / e[0]), Math.round(e[2] / e[0]), Math.round(e[3] / e[0])]);
}
function lzwEncode(indices, minCode) {
  const clear = 1 << minCode, eoi = clear + 1; let codeSize = minCode + 1, next = eoi + 1;
  let dict = new Map(); const out = []; let cur = 0, bits = 0;
  const emit = (code) => { cur |= code << bits; bits += codeSize; while (bits >= 8) { out.push(cur & 255); cur >>>= 8; bits -= 8; } };
  emit(clear); let prefix = indices[0];
  for (let i = 1; i < indices.length; i++) {
    const k = indices[i], key = prefix * 4096 + k;
    if (dict.has(key)) { prefix = dict.get(key); continue; }
    emit(prefix);
    if (next < 4096) { dict.set(key, next++); if (next - 1 === (1 << codeSize) && codeSize < 12) codeSize++; }
    else { emit(clear); dict = new Map(); codeSize = minCode + 1; next = eoi + 1; }
    prefix = k;
  }
  emit(prefix); emit(eoi); if (bits > 0) out.push(cur & 255);
  const blocks = []; for (let i = 0; i < out.length; i += 255) { const part = out.slice(i, i + 255); blocks.push(Buffer.from([part.length, ...part])); }
  blocks.push(Buffer.from([0])); return Buffer.concat(blocks);
}
// frames: [{w,h,d(RGBA)}] 같은 크기. delayMs: 프레임당 지연(ms) 숫자 또는 프레임별 배열. transparent=true면 알파 128 미만을 투명 처리
// diff=true면 둘째 프레임부터 바뀐 부분 사각형만 저장해 파일을 작게 함 (바뀐 곳 바깥은 투명 + 이전 그림 유지)
function writeGif(file, frames, delayMs, opt = {}) {
  const W = frames[0].w, H = frames[0].h, transparent = !!opt.transparent, diff = !!opt.diff, needT = transparent || diff;
  const pal = quantizePalette(frames, needT ? 255 : 256); const tIdx = needT ? pal.length : -1; if (needT) pal.push([0, 0, 0]);
  let size = 2; while ((1 << size) < pal.length) size++; while (pal.length < (1 << size)) pal.push([0, 0, 0]);
  const cache = new Map();
  const nearest = (r, g, b) => { const k = (r << 16) | (g << 8) | b; if (cache.has(k)) return cache.get(k); let best = 0, bd = 1e18; const n = needT ? pal.length - 1 : pal.length; for (let i = 0; i < n; i++) { if (i === tIdx) continue; const dr = r - pal[i][0], dg = g - pal[i][1], db = b - pal[i][2], d = dr * dr * 0.3 + dg * dg * 0.59 + db * db * 0.11; if (d < bd) { bd = d; best = i; } } cache.set(k, best); return best; };
  const parts = [Buffer.from('GIF89a'), Buffer.from([W & 255, W >> 8, H & 255, H >> 8, 0x80 | 0x70 | (size - 1), 0, 0]), Buffer.concat(pal.map(c => Buffer.from(c)))];
  parts.push(Buffer.from([0x21, 0xFF, 0x0B, ...Buffer.from('NETSCAPE2.0'), 3, 1, 0, 0, 0])); // 무한 반복
  frames.forEach((f, k) => {
    const delay = Math.max(1, Math.round((Array.isArray(delayMs) ? delayMs[k] : delayMs) / 10));
    let x0 = 0, y0 = 0, w = W, h = H;
    const same = (i) => { const o = i * 4, q = frames[k - 1].d; return f.d[o] === q[o] && f.d[o + 1] === q[o + 1] && f.d[o + 2] === q[o + 2] && f.d[o + 3] === q[o + 3]; };
    if (diff && k > 0) { let a = W, b = H, c = -1, d = -1; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!same(y * W + x)) { if (x < a) a = x; if (x > c) c = x; if (y < b) b = y; if (y > d) d = y; } if (c < 0) { x0 = 0; y0 = 0; w = 1; h = 1; } else { x0 = a; y0 = b; w = c - a + 1; h = d - b + 1; } }
    const useT = transparent || (diff && k > 0);
    parts.push(Buffer.from([0x21, 0xF9, 4, diff ? (useT ? 0x05 : 0x04) : (transparent ? 0x09 : 0x04), delay & 255, delay >> 8, useT ? tIdx : 0, 0])); // diff: 이전 그림 유지(처분 1), 투명이면 처분 2
    parts.push(Buffer.from([0x2C, x0 & 255, x0 >> 8, y0 & 255, y0 >> 8, w & 255, w >> 8, h & 255, h >> 8, 0, size]));
    const idx = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = (y0 + y) * W + x0 + x, o = i * 4; idx[y * w + x] = (diff && k > 0 && same(i)) || (transparent && f.d[o + 3] < 128) ? tIdx : (f.d[o + 3] < 128 ? 0 : nearest(f.d[o], f.d[o + 1], f.d[o + 2])); }
    parts.push(lzwEncode(idx, size));
  });
  parts.push(Buffer.from([0x3B]));
  fs.writeFileSync(file, Buffer.concat(parts));
}

module.exports = { p, R, ROOT, hex, C, put, get, rect, blit, solid, clone, up, writeGif };
