// 전신 기울이기 (작업 폴더 전용): 발바닥(Y=147)을 고정하고 블록 줄(2픽셀 높이)마다 가로로 블록 단위(2픽셀) 이동시키는 "줄 밀기(shear)" 방식.
// 픽셀을 다시 샘플링하지 않고 줄을 통째로 옮기므로 색·1픽셀 디테일·2x2 블록 격자(위상 (1,1))가 그대로 유지되고, 발바닥 줄은 움직이지 않는다.
// deg > 0 = 앞(화면 왼쪽, 레미 방향)으로 기울임, deg < 0 = 뒤(화면 오른쪽)로 기울임. 이동량 = 발바닥 위 높이 x tan(각도)
const FEET_Y = 147.5; // 발바닥 줄 기준선 (블록 줄 j=73 의 중심)
const blockRow = (y) => Math.floor((y - 1) / 2); // 픽셀 줄 y → 블록 줄 번호 (블록 j = y 2j+1..2j+2)
// 블록 줄 j 의 이동량(블록 수, 오른쪽이 +). 앞으로 기울이면 위쪽 줄이 왼쪽(-)으로 이동
function shiftBlocks(j, deg) { const h = Math.max(0, FEET_Y - (2 * j + 1.5)); return -Math.round(h * Math.tan(deg * Math.PI / 180) / 2); }
// 160x160 셀 전체를 기울임. 셀 밖으로 밀리는 픽셀이 있으면 오류
function lean(img, deg) {
  const W = img.w, o = { w: W, h: img.h, d: Buffer.alloc(img.d.length) };
  for (let y = 0; y < img.h; y++) { const s = 2 * shiftBlocks(blockRow(y), deg); for (let x = 0; x < W; x++) { const a = (y * W + x) * 4; if (!img.d[a + 3]) continue; const X = x + s; if (X < 0 || X >= W) throw new Error('기울이기로 셀 밖: y=' + y + ' x=' + x + '→' + X); img.d.copy(o.d, (y * W + X) * 4, a, a + 4); } }
  return o;
}
module.exports = { lean, shiftBlocks, blockRow };
