// RGBA 이미지를 팔레트(인덱스) PNG로 저장 (256색 이하, 업로드 용량 축소용)
const fs = require('fs'), zlib = require('zlib');
const crcT = []; for (let n = 0; n < 256; n++) { let c = n; for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crcT[n] = c >>> 0; }
const crc = b => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (t, data) => { const l = Buffer.alloc(4); l.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(t), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };

function encode8(img, file) {
  const map = new Map(), pal = [], idx = Buffer.alloc(img.w * img.h);
  for (let i = 0; i < img.w * img.h; i++) { // 색마다 팔레트 번호 부여 (완전 투명은 한 색으로)
    const a = img.d[i * 4 + 3], k = a === 0 ? 0 : img.d.readUInt32BE(i * 4) >>> 0;
    if (!map.has(k)) { map.set(k, pal.length); pal.push(a === 0 ? [0, 0, 0, 0] : [img.d[i * 4], img.d[i * 4 + 1], img.d[i * 4 + 2], a]); }
    idx[i] = map.get(k);
  }
  if (pal.length > 256) throw new Error('too many colors ' + pal.length);
  const raw = Buffer.alloc((img.w + 1) * img.h); // 줄마다 필터 0 + 인덱스
  for (let y = 0; y < img.h; y++) idx.copy(raw, y * (img.w + 1) + 1, y * img.w, (y + 1) * img.w);
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(img.w, 0); ihdr.writeUInt32BE(img.h, 4); ihdr[8] = 8; ihdr[9] = 3;
  const parts = [Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('PLTE', Buffer.from(pal.flatMap(c => c.slice(0, 3))))];
  if (pal.some(c => c[3] < 255)) parts.push(chunk('tRNS', Buffer.from(pal.map(c => c[3]))));
  parts.push(chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0)));
  fs.writeFileSync(file, Buffer.concat(parts));
}
module.exports = { encode8 };
