// 12단계: VICTORY 글자 간격(자간)을 고르게. 생성본은 간격이 제각각(5,3,5,6,4,4)이라, 승인된 제목판들(PAUSE 3~4, SENSITIVITY 4~5)처럼 모두 4로 맞춘다
const p = require('./pix.js'), path = require('path');
const R = path.join(__dirname, '..'), PART = R + '/parts', WORK = R + '/work';
const [inFile = `${PART}/T_Title_VICTORY.png`, outName = 'result_title_VICTORY_02_spaced', TARGET = '4'] = process.argv.slice(2);
const T = +TARGET, im = p.decode(inFile);
const cream = (x, y) => { const i = (y * im.w + x) * 4; return im.d[i + 3] && im.d[i] > 200 && im.d[i + 1] > 190 && im.d[i + 2] > 150 && im.d[i] - im.d[i + 2] < 60; };
let y0 = 99, y1 = -1; for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) if (cream(x, y)) { y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
const cols = []; for (let x = 0; x < im.w; x++) { let c = 0; for (let y = y0; y <= y1; y++) if (cream(x, y)) c++; cols.push(c > 0); }
const segs = []; let s = -1; for (let x = 0; x <= im.w; x++) { if (x < im.w && cols[x]) { if (s < 0) s = x; } else if (s >= 0) { if (x - s > 2) segs.push([s, x - 1]); s = -1; } } // 룬 등 잔점 제외, 글자 구간만
if (segs.length !== 7) throw new Error('글자 7개를 못 찾음: ' + segs.length);
const copies = new Array(im.w).fill(1); // 열마다 몇 번 복사할지 (0 = 제거, 2 = 복제)
const log = [];
for (let k = 0; k < segs.length - 1; k++) {
  const a = segs[k][1], b = segs[k + 1][0], gap = b - a - 1, delta = T - gap, mid = a + 1 + Math.floor(gap / 2); // 빈칸 한가운데 열
  log.push(`${k}:${gap}->${T}`);
  if (delta > 0) copies[mid] += delta;                                   // 모자라면 가운데 열을 복제
  else if (delta < 0) for (let j = 0; j < -delta; j++) copies[mid - Math.floor(-delta / 2) + j] = 0; // 넘치면 가운데 열들을 제거
}
const W = copies.reduce((a, b) => a + b, 0), out = p.blank(W, im.h); let ox = 0;
for (let x = 0; x < im.w; x++) for (let c = 0; c < copies[x]; c++, ox++) for (let y = 0; y < im.h; y++) im.d.copy(out.d, (y * W + ox) * 4, (y * im.w + x) * 4, (y * im.w + x) * 4 + 4);
p.encode(out, `${WORK}/${outName}.png`);
console.log('간격', log.join(' '), '| 폭', im.w, '->', W, 'colors', p.countColors(out));
