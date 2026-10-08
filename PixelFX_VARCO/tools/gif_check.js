// 내가 만든 GIF를 직접 디코딩해 프레임을 복원하고 원본 프레임과 비교 (사용: node gif_check.js 파일.gif 장면id 모드[actual|slow])
const fs = require('fs');
function decode(buf) {
  let pos = 6; const W = buf.readUInt16LE(pos), H = buf.readUInt16LE(pos + 2), flags = buf[pos + 4]; pos += 7;
  const gsz = 1 << ((flags & 7) + 1), pal = []; for (let i = 0; i < gsz; i++) pal.push([buf[pos + i * 3], buf[pos + i * 3 + 1], buf[pos + i * 3 + 2]]); pos += gsz * 3;
  const frames = [], canvas = Buffer.alloc(W * H * 4); let gce = null;
  while (pos < buf.length) {
    const b = buf[pos++];
    if (b === 0x3B) break;
    if (b === 0x21) { const label = buf[pos++]; if (label === 0xF9) { gce = { packed: buf[pos + 1], delay: buf.readUInt16LE(pos + 2), t: buf[pos + 4] }; } while (buf[pos] !== 0) pos += buf[pos] + 1; pos++; continue; }
    if (b === 0x2C) {
      const x0 = buf.readUInt16LE(pos), y0 = buf.readUInt16LE(pos + 2), w = buf.readUInt16LE(pos + 4), h = buf.readUInt16LE(pos + 6); pos += 9; const min = buf[pos++];
      const data = []; while (buf[pos] !== 0) { for (let i = 0; i < buf[pos]; i++) data.push(buf[pos + 1 + i]); pos += buf[pos] + 1; } pos++;
      // LZW 복원
      const clear = 1 << min, eoi = clear + 1; let size = min + 1, next = eoi + 1, dict = []; const reset = () => { dict = []; for (let i = 0; i < clear; i++) dict[i] = [i]; size = min + 1; next = eoi + 1; }; reset();
      const out = []; let bits = 0, cur = 0, di = 0, prev = null;
      while (true) { while (bits < size && di < data.length) { cur |= data[di++] << bits; bits += 8; } if (bits < size) break; const code = cur & ((1 << size) - 1); cur >>>= size; bits -= size;
        if (code === clear) { reset(); prev = null; continue; } if (code === eoi) break;
        let entry; if (dict[code]) entry = dict[code]; else if (prev) entry = prev.concat(prev[0]); else break;
        out.push(...entry); if (prev) { dict[next++] = prev.concat(entry[0]); if (next === (1 << size) && size < 12) size++; } prev = entry; }
      const useT = gce && (gce.packed & 1), disp = gce ? (gce.packed >> 2) & 7 : 0;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = out[y * w + x]; if (useT && i === gce.t) continue; const c = pal[i]; const o = ((y0 + y) * W + x0 + x) * 4; canvas[o] = c[0]; canvas[o + 1] = c[1]; canvas[o + 2] = c[2]; canvas[o + 3] = 255; }
      frames.push({ d: Buffer.from(canvas), delay: gce ? gce.delay * 10 : 0, rect: [x0, y0, w, h], disp });
      if (disp === 2) { canvas.fill(0); } // 배경으로 복원
    }
  }
  return { W, H, frames };
}
module.exports = { decode };
if (require.main === module) {
  const { p } = require('./lib_fx'); const M = require('./preview_particles.js'); const [file, id, mode] = process.argv.slice(2);
  const g = decode(fs.readFileSync(file)); const sc = M.scenarios.find(s => s.id === +id), base = M.makeBase(sc.cropY, sc.cropH), parts = M.emitFor(sc, {}), [rx, ry, rw, rh] = M.focusRect(sc);
  let worst = 0, bad = 0; const sizes = [];
  g.frames.forEach((f, k) => { let src = M.frameAt(sc, base, parts, 'new', k, {}); if (mode === 'slow') src = require('./lib_fx').up(p.crop(src, rx, ry, rw, rh), 3);
    let maxd = 0, nb = 0; for (let i = 0; i < g.W * g.H; i++) { const o = i * 4, d = Math.max(Math.abs(f.d[o] - src.d[o]), Math.abs(f.d[o + 1] - src.d[o + 1]), Math.abs(f.d[o + 2] - src.d[o + 2])); if (d > maxd) maxd = d; if (d > 48) nb++; }
    worst = Math.max(worst, maxd); bad += nb; sizes.push(f.rect.join('x').replace(/x/, ',')); });
  console.log(`${file.split('/').pop()}: ${g.W}x${g.H}, 프레임 ${g.frames.length}, 지연 ${g.frames.map(f => f.delay).join('/')}ms, 원본과 최대 색 차이 ${worst}, 48 넘게 다른 픽셀 ${bad}개, 프레임 사각형 ${sizes.slice(0, 6).join(' ')} ...`);
}
