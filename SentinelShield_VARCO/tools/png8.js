// 팔레트(8비트 인덱스) PNG 변환 (작업 폴더 전용): VARCO upload_image 로 올릴 작은 안내 이미지를 만든다. 사용: node png8.js <입력.png> → <입력>_p8.png 와 _p8.b64.txt
// 인수 fixed: 고정 허프만(Z_FIXED)으로 압축(긴 0 반복은 없지만 주기적 반복이 생김). 기본은 level 9.
const fs = require('fs'), zlib = require('zlib');
const p = require('../../PauseUI_VARCO/tools/pix.js');
const crcT = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc = (b) => { let c = 0xFFFFFFFF; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]), c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
const src = process.argv[2], im = p.decode(src), pal = new Map(), idx = Buffer.alloc(im.w * im.h);
for (let i = 0; i < im.w * im.h; i++) { const k = (im.d[i * 4] << 16) | (im.d[i * 4 + 1] << 8) | im.d[i * 4 + 2]; if (!pal.has(k)) pal.set(k, pal.size); idx[i] = pal.get(k); }
if (pal.size > 256) throw new Error('색이 256개를 넘음 ' + pal.size);
const plte = Buffer.alloc(pal.size * 3); for (const [k, n] of pal) { plte[n * 3] = k >> 16; plte[n * 3 + 1] = (k >> 8) & 255; plte[n * 3 + 2] = k & 255; }
const FILT = process.argv[3] === 'paeth' ? 4 : 0, raw = Buffer.alloc((im.w + 1) * im.h); // paeth: 필터 4 + 고정 허프만 → base64 에 긴 반복이 거의 없어 옮겨 적기 쉬움
for (let y = 0; y < im.h; y++) { raw[y * (im.w + 1)] = FILT; for (let x = 0; x < im.w; x++) { const a = x ? idx[y * im.w + x - 1] : 0, b = y ? idx[(y - 1) * im.w + x] : 0, c = x && y ? idx[(y - 1) * im.w + x - 1] : 0, v = idx[y * im.w + x]; let pr = 0; if (FILT === 4) { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); pr = pa <= pb && pa <= pc ? a : (pb <= pc ? b : c); } raw[y * (im.w + 1) + 1 + x] = (v - pr) & 255; } }
const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(im.w, 0); ihdr.writeUInt32BE(im.h, 4); ihdr[8] = 8; ihdr[9] = 3;
const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('PLTE', plte), chunk('IDAT', zlib.deflateSync(raw, process.argv[3] === 'fixed' || process.argv[3] === 'paeth' ? { level: 9, strategy: zlib.constants.Z_FIXED } : { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
const out = src.replace(/\.png$/, '_p8.png'); fs.writeFileSync(out, png); fs.writeFileSync(out.replace(/\.png$/, '.b64.txt'), png.toString('base64')); console.log(out, png.length + 'B', '색', pal.size);
