// 1단계: A_01·B_01을 같은 배율로 축소 + 공용 팔레트로 색 축소
const p = require('./pix.js'), path = require('path');
const R = path.join(__dirname, '..');
const F = 121 / 33; // RESUME 버튼 높이 121px -> MINO UPGRADES 명패 높이 33px
const K = +(process.argv[2] || 20); // 팔레트 색 수

const a = p.boxDown(p.decode(R + '/generated/A_PauseWindow_01.png'), F);
const b = p.boxDown(p.decode(R + '/generated/B_SliderGauge_01.png'), F);

// 두 이미지를 한 캔버스에 붙여 같은 팔레트로 양자화
const both = p.blank(Math.max(a.w, b.w), a.h + b.h);
for (let y = 0; y < a.h; y++) a.d.copy(both.d, y * both.w * 4, y * a.w * 4, (y + 1) * a.w * 4);
for (let y = 0; y < b.h; y++) b.d.copy(both.d, (a.h + y) * both.w * 4, y * b.w * 4, (y + 1) * b.w * 4);
const q = p.kmeans(both, K, 25);

const qa = p.crop(q, 0, 0, a.w, a.h), qb = p.crop(q, 0, a.h, b.w, b.h);
p.encode(qa, R + '/work/A01_down.png'); p.encode(qb, R + '/work/B01_down.png');
p.encode(p.nearestUp(qa, 4), R + '/work/A01_down_x4.png'); p.encode(p.nearestUp(qb, 4), R + '/work/B01_down_x4.png');
console.log('F', F.toFixed(3), 'A', a.w + 'x' + a.h, 'B', b.w + 'x' + b.h, 'colors', p.countColors(q));
