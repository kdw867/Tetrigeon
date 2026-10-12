// work/warp_<name>.png (160x160 셀) 를 도트 1칸 = 4px 로 키워 흰 바탕 640x640 에 놓음 → VARCO 에 올릴 자세 안내 이미지 (작업 폴더 전용)
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const p = require('../../PauseUI_VARCO/tools/pix.js');
const { encodeSmall } = require('./png_small.js');
const name = process.argv[2], S = +(process.env.GS || 4), W = 160 * S, R = path.join(__dirname, '..');
const cell = p.decode(path.join(R, 'work', 'warp_' + name + '.png'));
const out = p.blank(W, W); out.d.fill(255);
for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) { const si = ((y / S | 0) * 160 + (x / S | 0)) * 4; if (cell.d[si + 3]) { const o = (y * W + x) * 4; out.d[o] = cell.d[si]; out.d[o + 1] = cell.d[si + 1]; out.d[o + 2] = cell.d[si + 2]; } }
const file = path.join(R, 'work', 'guide_' + name + '.png'), ncol = encodeSmall(out, file), buf = fs.readFileSync(file), b64 = buf.toString('base64');
fs.writeFileSync(file.replace('.png', '.b64.txt'), b64);
let m = 1, c = 1; for (let i = 1; i < b64.length; i++) { if (b64[i] === b64[i - 1]) { c++; if (c > m) m = c; } else c = 1; }
console.log(name, 'colors', ncol, 'bytes', buf.length, 'b64 chars', b64.length, 'max run', m, 'md5', crypto.createHash('md5').update(buf).digest('hex'));
