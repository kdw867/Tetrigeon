// 8단계: TITLE 후보의 글자 I를 기존 버튼 글꼴(OPTION의 I)로 교체. 생성된 I는 받침 없는 얇은 막대라 다른 버튼과 달랐음
const p = require('./pix.js'), path = require('path');
const R = path.join(__dirname, '..'), PART = R + '/parts', WORK = R + '/work';
const [inName = 'title_btn_02_2', outName = 'title_btn_02_2_fixI'] = process.argv.slice(2);
const T = p.decode(`${WORK}/${inName}.png`), O = p.decode(`${PART}/T_Btn_OPTION.png`);
const ROW0 = 6, ROW1 = 24; // 글자 + 외곽선 + 아래 그림자가 들어가는 행 범위
const cream = (im, x, y) => { const i = (y * im.w + x) * 4; return im.d[i + 3] && im.d[i] > 200 && im.d[i + 1] > 190 && im.d[i + 2] > 150 && im.d[i] - im.d[i + 2] < 60; };
function letters(im) { // 크림색 글자 열 구간 목록 (글자 한 개 = 연속된 열)
  const cols = []; for (let x = 0; x < im.w; x++) { let c = 0; for (let y = 8; y <= 23; y++) if (cream(im, x, y)) c++; cols.push(c > 0); }
  const segs = []; let s = -1; for (let x = 0; x <= im.w; x++) { if (x < im.w && cols[x]) { if (s < 0) s = x; } else if (s >= 0) { segs.push([s, x - 1]); s = -1; } }
  return segs;
}
const ts = letters(T), os = letters(O);
console.log('TITLE 글자 구간', JSON.stringify(ts), '| OPTION 글자 구간', JSON.stringify(os));
if (ts.length !== 5) throw new Error('TITLE 글자 5개를 못 찾음: ' + ts.length);
if (os.length < 4) throw new Error('OPTION 글자 구간 부족');
const [ix0, ix1] = ts[1], [ox0, ox1] = os[3]; // TITLE의 두 번째 글자 I, OPTION의 네 번째 글자 I
const MARGIN = 1, newI = p.crop(O, ox0 - MARGIN, ROW0, ox1 - ox0 + 1 + 2 * MARGIN, ROW1 - ROW0 + 1);
const cutL = ix0 - MARGIN, cutR = ix1 + MARGIN, W = T.w - (cutR - cutL + 1) + newI.w, out = p.blank(W, T.h);
const cutW = cutR - cutL + 1;
for (let y = 0; y < T.h; y++) {
  for (let x = 0; x < cutL; x++) T.d.copy(out.d, (y * W + x) * 4, (y * T.w + x) * 4, (y * T.w + x) * 4 + 4); // I 왼쪽은 그대로
  for (let k = 0; k < newI.w; k++) { // I 자리: 글자 행은 기존 글꼴 I, 나머지 행(위아래 돌 테두리)은 원래 열을 한 칸 늘려서 이음
    const dst = (y * W + cutL + k) * 4;
    if (y >= ROW0 && y <= ROW1) newI.d.copy(out.d, dst, ((y - ROW0) * newI.w + k) * 4, ((y - ROW0) * newI.w + k) * 4 + 4);
    else { const sx = (y * T.w + cutL + Math.min(k, cutW - 1)) * 4; T.d.copy(out.d, dst, sx, sx + 4); } // 원래 열을 쓰고 모자란 한 칸은 마지막 열 복제
  }
  for (let x = cutR + 1; x < T.w; x++) T.d.copy(out.d, (y * W + cutL + newI.w + (x - cutR - 1)) * 4, (y * T.w + x) * 4, (y * T.w + x) * 4 + 4); // I 오른쪽은 그대로
}
p.encode(out, `${WORK}/${outName}.png`);
console.log(`I 교체: TITLE ${ix0}-${ix1}(폭 ${ix1 - ix0 + 1}) -> OPTION ${ox0}-${ox1}(폭 ${ox1 - ox0 + 1}), 결과 ${out.w}x${out.h}, colors ${p.countColors(out)}`);
