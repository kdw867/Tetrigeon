// 업로드 용량을 줄이는 팔레트 PNG 저장 (줄 필터 Up/None 중 작은 쪽, 작업 폴더 전용)
const fs = require('fs'), zlib = require('zlib');
const crcT = []; for (let n = 0; n < 256; n++) { let c = n; for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crcT[n] = c >>> 0; }
const crc = b => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (t, data) => { const l = Buffer.alloc(4); l.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(t), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
function encodeSmall(img, file) {
  const map = new Map(), pal = [], idx = Buffer.alloc(img.w * img.h);
  for (let i = 0; i < img.w * img.h; i++) { const k = img.d.readUInt32BE(i * 4) >>> 0; if (!map.has(k)) { map.set(k, pal.length); pal.push([img.d[i * 4], img.d[i * 4 + 1], img.d[i * 4 + 2]]); } idx[i] = map.get(k); }
  const cnt = new Array(pal.length).fill(0); for (let i = 0; i < idx.length; i++) cnt[idx[i]]++;
  if (process.env.MAXC && pal.length > +process.env.MAXC) { const prot = i => (pal[i][1] > 200 && pal[i][2] > 200 && pal[i][0] < 100) || (pal[i][0] === 188 && pal[i][1] === 199 && pal[i][2] === 245); const keep = pal.map((_, i) => i).sort((a, b) => (prot(b) - prot(a)) || (cnt[b] - cnt[a])).slice(0, +process.env.MAXC); const remap = pal.map((c, i) => keep.includes(i) ? keep.indexOf(i) : keep.reduce((best, k, j) => { const d = (c[0]-pal[k][0])**2+(c[1]-pal[k][1])**2+(c[2]-pal[k][2])**2; return d < best[1] ? [j, d] : best; }, [0, 1e9])[0]); for (let i = 0; i < idx.length; i++) idx[i] = remap[idx[i]]; const np = keep.map(k => pal[k]); pal.length = 0; np.forEach(c => pal.push(c)); }
  if (pal.length > 256) throw new Error('too many colors');
  const bits = pal.length <= 2 ? 1 : pal.length <= 4 ? 2 : pal.length <= 16 ? 4 : 8, per = 8 / bits, rowBytes = Math.ceil(img.w / per);
  const rows = []; for (let y = 0; y < img.h; y++) { const r = Buffer.alloc(rowBytes); for (let x = 0; x < img.w; x++) r[(x / per) | 0] |= idx[y * img.w + x] << (8 - bits - (x % per) * bits); rows.push(r); }
  const raw = Buffer.alloc((rowBytes + 1) * img.h);
  for (let y = 0; y < img.h; y++) { raw[y * (rowBytes + 1)] = 0; for (let b = 0; b < rowBytes; b++) raw[y * (rowBytes + 1) + 1 + b] = rows[y][b]; }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(img.w, 0); ihdr.writeUInt32BE(img.h, 4); ihdr[8] = bits; ihdr[9] = 3;
  fs.writeFileSync(file, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('PLTE', Buffer.from(pal.flat())), chunk('IDAT', zlib.deflateSync(raw, { level: +(process.env.ZL || 9), strategy: +(process.env.ZS || 0), memLevel: +(process.env.ZM || 8) })), chunk('IEND', Buffer.alloc(0))]));
  return pal.length;
}
module.exports = { encodeSmall };
