// PNG 입출력 + 픽셀 유틸 (외부 의존성 없음)
const fs = require('fs'), zlib = require('zlib');

function decode(file) { // 8bit RGB/RGBA PNG -> {w,h,d(RGBA)}
  const buf = fs.readFileSync(file);
  let pos = 8, w, h, bd, ct, idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos), type = buf.toString('ascii', pos + 4, pos + 8), data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); bd = data[8]; ct = data[9]; if (data[12]) throw new Error('interlaced'); }
    if (type === 'IDAT') idat.push(data);
    pos += 12 + len;
  }
  if (bd !== 8 || (ct !== 6 && ct !== 2)) throw new Error('unsupported ' + bd + '/' + ct);
  const bpp = ct === 6 ? 4 : 3, raw = zlib.inflateSync(Buffer.concat(idat)), stride = w * bpp, d = Buffer.alloc(w * h * 4);
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], line = Buffer.from(raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)));
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? line[i - bpp] : 0, b = prev[i], c = i >= bpp ? prev[i - bpp] : 0;
      const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
      line[i] = (line[i] + (f === 1 ? a : f === 2 ? b : f === 3 ? (a + b) >> 1 : f === 4 ? (pa <= pb && pa <= pc ? a : pb <= pc ? b : c) : 0)) & 255;
    }
    for (let x = 0; x < w; x++) for (let ch = 0; ch < 4; ch++) d[(y * w + x) * 4 + ch] = ch < bpp ? line[x * bpp + ch] : 255;
    prev = line;
  }
  return { w, h, d };
}

const crcT = []; for (let n = 0; n < 256; n++) { let c = n; for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crcT[n] = c >>> 0; }
const crc = b => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (t, data) => { const l = Buffer.alloc(4); l.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(t), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };

function encode(img, file) { // RGBA PNG 저장
  const { w, h, d } = img, raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) d.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  fs.writeFileSync(file, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]));
}

const blank = (w, h) => ({ w, h, d: Buffer.alloc(w * h * 4) });

function crop(img, x0, y0, w, h) {
  const o = blank(w, h);
  for (let y = 0; y < h; y++) img.d.copy(o.d, y * w * 4, ((y0 + y) * img.w + x0) * 4, ((y0 + y) * img.w + x0 + w) * 4);
  return o;
}

function boxDown(img, f) { // 면적 평균 축소 (f: 원본 px / 결과 px, 실수 허용)
  const W = Math.round(img.w / f), H = Math.round(img.h / f), o = blank(W, H);
  for (let Y = 0; Y < H; Y++) for (let X = 0; X < W; X++) {
    const x0 = X * img.w / W, x1 = (X + 1) * img.w / W, y0 = Y * img.h / H, y1 = (Y + 1) * img.h / H;
    let s = [0, 0, 0, 0], tw = 0;
    for (let y = Math.floor(y0); y < Math.ceil(y1); y++) for (let x = Math.floor(x0); x < Math.ceil(x1); x++) {
      const wgt = (Math.min(x + 1, x1) - Math.max(x, x0)) * (Math.min(y + 1, y1) - Math.max(y, y0)), i = (y * img.w + x) * 4;
      for (let c = 0; c < 4; c++) s[c] += img.d[i + c] * wgt; tw += wgt;
    }
    for (let c = 0; c < 4; c++) o.d[(Y * W + X) * 4 + c] = Math.round(s[c] / tw);
  }
  return o;
}

function kmeans(img, k, iters = 20) { // 불투명 픽셀 색을 k개로 줄임 (디더링 없음)
  const px = [];
  for (let i = 0; i < img.w * img.h; i++) if (img.d[i * 4 + 3] > 0) px.push(i);
  let cs = []; // 밝기 순으로 고르게 초기화
  const sorted = px.slice().sort((a, b) => lum(img, a) - lum(img, b));
  for (let j = 0; j < k; j++) { const i = sorted[Math.floor((j + 0.5) * sorted.length / k)]; cs.push([img.d[i * 4], img.d[i * 4 + 1], img.d[i * 4 + 2]]); }
  const asg = new Int32Array(px.length);
  for (let it = 0; it < iters; it++) {
    const sum = cs.map(() => [0, 0, 0, 0]);
    px.forEach((i, n) => { let best = 0, bd = 1e18; for (let j = 0; j < k; j++) { const dr = img.d[i * 4] - cs[j][0], dg = img.d[i * 4 + 1] - cs[j][1], db = img.d[i * 4 + 2] - cs[j][2], dd = dr * dr * 0.3 + dg * dg * 0.59 + db * db * 0.11; if (dd < bd) { bd = dd; best = j; } } asg[n] = best; const s = sum[best]; s[0] += img.d[i * 4]; s[1] += img.d[i * 4 + 1]; s[2] += img.d[i * 4 + 2]; s[3]++; });
    cs = cs.map((c, j) => sum[j][3] ? [sum[j][0] / sum[j][3], sum[j][1] / sum[j][3], sum[j][2] / sum[j][3]] : c);
  }
  const o = { w: img.w, h: img.h, d: Buffer.from(img.d) };
  px.forEach((i, n) => { const c = cs[asg[n]]; o.d[i * 4] = Math.round(c[0]); o.d[i * 4 + 1] = Math.round(c[1]); o.d[i * 4 + 2] = Math.round(c[2]); o.d[i * 4 + 3] = 255; });
  return o;
}
const lum = (img, i) => img.d[i * 4] * 0.3 + img.d[i * 4 + 1] * 0.59 + img.d[i * 4 + 2] * 0.11;

function floodClear(img, seeds, tol) { // 시드에서 연결된 비슷한 색을 투명화 (테두리 바깥 배경 제거)
  const { w, h, d } = img, seen = new Uint8Array(w * h), st = [];
  for (const [sx, sy] of seeds) st.push(sy * w + sx);
  const ref = st.map(i => [d[i * 4], d[i * 4 + 1], d[i * 4 + 2]]);
  const near = i => ref.some(r => Math.abs(d[i * 4] - r[0]) + Math.abs(d[i * 4 + 1] - r[1]) + Math.abs(d[i * 4 + 2] - r[2]) <= tol);
  while (st.length) {
    const i = st.pop(); if (seen[i]) continue; seen[i] = 1;
    if (d[i * 4 + 3] === 0 || !near(i)) continue;
    d[i * 4 + 3] = 0; d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = 0;
    const x = i % w, y = (i - x) / w;
    if (x > 0) st.push(i - 1); if (x < w - 1) st.push(i + 1); if (y > 0) st.push(i - w); if (y < h - 1) st.push(i + w);
  }
  return img;
}

function borderSeeds(img) { const s = []; for (let x = 0; x < img.w; x++) s.push([x, 0], [x, img.h - 1]); for (let y = 0; y < img.h; y++) s.push([0, y], [img.w - 1, y]); return s; }

function trim(img) { // 투명 여백 잘라내기
  let x0 = img.w, y0 = img.h, x1 = -1, y1 = -1;
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) if (img.d[(y * img.w + x) * 4 + 3]) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  return { img: crop(img, x0, y0, x1 - x0 + 1, y1 - y0 + 1), x0, y0 };
}

function nearestUp(img, k, bg) { // 확대 미리보기 (bg 지정 시 투명부 배경색)
  const o = blank(img.w * k, img.h * k);
  for (let y = 0; y < o.h; y++) for (let x = 0; x < o.w; x++) {
    const s = (Math.floor(y / k) * img.w + Math.floor(x / k)) * 4, t = (y * o.w + x) * 4;
    if (bg && img.d[s + 3] === 0) { o.d[t] = bg[0]; o.d[t + 1] = bg[1]; o.d[t + 2] = bg[2]; o.d[t + 3] = 255; } else img.d.copy(o.d, t, s, s + 4);
  }
  return o;
}

function countColors(img) { const s = new Set(); for (let i = 0; i < img.w * img.h; i++) if (img.d[i * 4 + 3]) s.add(img.d.readUInt32BE(i * 4)); return s.size; }

module.exports = { decode, encode, blank, crop, boxDown, kmeans, floodClear, borderSeeds, trim, nearestUp, countColors };
