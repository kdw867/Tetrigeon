// 기존 명패(192x33)의 색과 구조 분석 (일회용)
const p = require('../../PauseUI_VARCO/tools/pix.js');
const a = p.decode(`${__dirname}/../refs/ref_nameplate_minoupgrades.png`);
const cnt = {};
for (let i = 0; i < a.w * a.h; i++) { const o = i * 4; if (a.d[o + 3] < 200) continue; const k = [a.d[o], a.d[o + 1], a.d[o + 2]].map(v => v.toString(16).padStart(2, '0')).join(''); cnt[k] = (cnt[k] || 0) + 1; }
const top = Object.entries(cnt).sort((x, y) => y[1] - x[1]).slice(0, 24);
console.log('size', a.w, a.h, '불투명 색 종류', Object.keys(cnt).length);
console.log(top.map(([k, n]) => '#' + k + ':' + n).join(' '));
// 투명 픽셀 위치 (모서리)
let tr = 0; for (let i = 0; i < a.w * a.h; i++) if (a.d[i * 4 + 3] < 200) tr++;
console.log('투명 픽셀', tr);
// 밝기 맵: 한 줄씩 (글자 영역 확인)
const lum = (x, y) => { const o = (y * a.w + x) * 4; return a.d[o + 3] < 200 ? -1 : Math.round((a.d[o] + a.d[o + 1] + a.d[o + 2]) / 3); };
for (let y = 0; y < a.h; y++) { let l = ''; for (let x = 0; x < a.w; x += 2) { const v = lum(x, y); l += v < 0 ? ' ' : v > 190 ? '#' : v > 120 ? '+' : v > 80 ? '-' : '.'; } console.log(String(y).padStart(2), l); }
