// VARCO 시도 4장을 한 장으로 모음 (왼쪽 위부터 1 = 1차 움츠림, 2 = 1차 타격, 3 = 2차 움츠림, 4 = 2차 타격) (작업 폴더 전용)
const path = require('path');
const L = require('./lib_cat.js');
const p = L.p, dir = path.join(L.R, 'output', 'varco_attempts');
const files = ['1_round1_windup_raw.png', '2_round1_strike_raw.png', '3_round2_windup_raw_MIRRORED.png', '4_round2_strike_raw_invented-block.png'];
const FONT = { '1': '010110010010111', '2': '111001111100111', '3': '111001111001111', '4': '101101111001001' };
const T = 688, TH = 384, o = p.blank(T * 2 + 6, TH * 2 + 6); o.d.fill(255);
files.forEach((f, k) => {
  const im = p.boxDown(p.decode(path.join(dir, f)), 2), ox = (k % 2) * (T + 6), oy = Math.floor(k / 2) * (TH + 6);
  for (let y = 0; y < TH; y++) im.d.copy(o.d, ((oy + y) * o.w + ox) * 4, y * T * 4, (y + 1) * T * 4);
  const g = FONT[String(k + 1)]; for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) if (g[r * 3 + c] === '1') for (let dy = 0; dy < 6; dy++) for (let dx = 0; dx < 6; dx++) { const q = ((oy + 10 + r * 6 + dy) * o.w + ox + 10 + c * 6 + dx) * 4; o.d[q] = 200; o.d[q + 1] = 30; o.d[q + 2] = 30; o.d[q + 3] = 255; }
});
p.encode(o, path.join(L.R, 'output', 'VARCO_attempts_contact.png')); console.log('saved', o.w + 'x' + o.h);
