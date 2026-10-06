// 11단계: VICTORY 제목판의 I(받침 없는 3px 막대)를 승인된 OPTION 제목판의 I(위아래 받침이 있는 굵은 I)로 교체
// VICTORY 글자 높이는 15px, OPTION은 18px이라 OPTION I의 가운데 기둥 3줄(모양이 같은 줄)을 빼서 맞춘다
const p = require('./pix.js'), path = require('path');
const R = path.join(__dirname, '..'), PART = R + '/parts', WORK = R + '/work';
const V = p.decode(`${PART}/T_Title_VICTORY.png`), O = p.decode(`${PART}/T_Title_OPTION.png`);
const DEST_X0 = 49, DEST_W = 10;         // VICTORY에서 바꿀 열 범위 (옛 I와 그 외곽선 + 양옆 여백, V와 C 사이 가운데에 오도록)
const SRC_X0 = 74, SRC_W = 8;            // OPTION I의 열 범위: 왼쪽 여백 1 + 글자 6 + 오른쪽 그림자 1
const DROP = new Set([20, 21, 22]);      // OPTION I 가운데 기둥에서 뺄 줄 (같은 모양의 줄)
// 대상 줄(12..29) -> OPTION 원본 줄: 위 외곽선 1줄(10), 글자 18줄 중 3줄을 뺀 15줄(11..28), 아래 외곽선 2줄(29..30). 위 여백은 OPTION 것이 두꺼워 가져오지 않고 VICTORY 원래 줄을 유지
const DEST_Y0 = 12, srcRows = [10]; for (let y = 11; y <= 28; y++) if (!DROP.has(y)) srcRows.push(y); srcRows.push(29, 30);
if (srcRows.length !== 18) throw new Error('줄 수 불일치 ' + srcRows.length);
const out = { w: V.w, h: V.h, d: Buffer.from(V.d) };
const copy = (src, sx, sy, dx, dy) => src.d.copy(out.d, (dy * out.w + dx) * 4, (sy * src.w + sx) * 4, (sy * src.w + sx) * 4 + 4);
srcRows.forEach((sy, k) => {
  const dy = DEST_Y0 + k;
  for (let x = 0; x < DEST_W; x++) {
    if (x === 0 || x === DEST_W - 1) continue;             // 양 끝 한 열은 원래 VICTORY 바탕 유지
    copy(O, SRC_X0 + x - 1, sy, DEST_X0 + x, dy);          // 가운데 8열은 OPTION의 I 사각형
  }
});
p.encode(out, `${WORK}/result_title_VICTORY_02_fixI.png`);
console.log('교체 완료', out.w + 'x' + out.h, 'colors', p.countColors(out), '| 대상 열', DEST_X0 + '-' + (DEST_X0 + DEST_W - 1), '원본 열', SRC_X0 + '-' + (SRC_X0 + SRC_W - 1));
