// 숫자 3장 나란히 비교 이미지 (어두운 보드색 배경, 원본 1도트=1px을 정수 배로 확대) — 작업 폴더 전용
const fs = require('fs'), path = require('path');
const R = path.join(__dirname, '..');
const p = require(path.join(R, '..', 'PauseUI_VARCO', 'tools', 'pix.js'));
const [dir, outFile, K = '4', bgHex = '#0d1828'] = process.argv.slice(2);
const K1 = +K, bg = [1, 3, 5].map(i => parseInt(bgHex.slice(i, i + 2), 16));
const imgs = ['3', '2', '1'].map(n => p.decode(path.join(R, dir, `T_Countdown_${n}.png`)));
const W = imgs[0].w, H = imgs[0].h, gap = 4, pad = 6;
const out = p.blank((W * 3 + gap * 2 + pad * 2) , H + pad * 2);
for (let i = 0; i < out.w * out.h; i++) { out.d[i * 4] = bg[0]; out.d[i * 4 + 1] = bg[1]; out.d[i * 4 + 2] = bg[2]; out.d[i * 4 + 3] = 255; }
imgs.forEach((im, k) => { for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const s = (y * W + x) * 4; if (!im.d[s + 3]) continue; const d = ((y + pad) * out.w + x + pad + k * (W + gap)) * 4; out.d[d] = im.d[s]; out.d[d + 1] = im.d[s + 1]; out.d[d + 2] = im.d[s + 2]; } });
p.encode(p.nearestUp(out, K1), path.join(R, outFile));
console.log('saved', outFile, out.w * K1 + 'x' + out.h * K1);
