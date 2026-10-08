// 미리보기 합성용 보드 준비: 실제 FHD 캡처에서 (1) 격자선 위치 (2) 칸 안의 블록 그림을 읽어 저장 (작업 폴더 전용)
const { p, R, ROOT, get, put, up } = require('./lib_fx');
const T = p.decode(`${ROOT}/HpBarUI_VARCO/preview/Unity_NoStagePanel.png`); // T 미노(보라 균열)가 바닥에 있는 캡처
const O = p.decode(`${ROOT}/StageBoardUI_VARCO/preview/Unity_StageBoard_10.png`); // O 미노(주황 균열)가 바닥에 있는 캡처
const BG = [0x0d, 0x18, 0x28], LINE = [0x23, 0x36, 0x4c];
const near = (c, t, d) => Math.abs(c[0] - t[0]) + Math.abs(c[1] - t[1]) + Math.abs(c[2] - t[2]) <= d;
// 격자선 위치: 빈 영역(y=500)에서 세로선, 빈 열(x=840)에서 가로선
const vlines = [], hlines = [];
for (let x = 820; x < 1100; x++) if (near(get(T, x, 500), LINE, 14)) vlines.push(x);
for (let y = 390; y < 996; y++) if (near(get(T, 840, y), LINE, 14)) hlines.push(y);
console.log('세로선 x', vlines.join(','));
console.log('가로선 y', hlines.join(','));
// 블록 그림 추출: 블록이 있는 칸(열 c, 아래에서 r번째 행)의 비배경 픽셀 경계 상자
const X0 = 825, Y1 = 990, CS = 27;
function tileAt(img, c, r) {
  const x0 = X0 + c * CS, y0 = Y1 - (r + 1) * CS; let a = 1e9, b = 1e9, cc = -1, d = -1;
  for (let y = y0 + 2; y < y0 + CS - 1; y++) for (let x = x0 + 2; x < x0 + CS - 1; x++) { const px = get(img, x, y); if (!near(px, BG, 18) && !near(px, LINE, 10)) { a = Math.min(a, x); cc = Math.max(cc, x); b = Math.min(b, y); d = Math.max(d, y); } }
  return { x0, y0, bbox: [a, b, cc, d] };
}
const out = { T: [], O: [] };
// T: 바닥 줄 열 3,4,5 + 윗줄 열 4 / O: 열 4,5 × 행 0,1
for (const [c, r] of [[3, 0], [4, 0], [5, 0], [4, 1]]) out.T.push({ c, r, ...tileAt(T, c, r) });
for (const [c, r] of [[4, 1], [5, 1], [4, 0], [5, 0]]) out.O.push({ c, r, ...tileAt(O, c, r) });
console.log('T 타일 bbox', JSON.stringify(out.T.map(t => t.bbox)));
console.log('O 타일 bbox', JSON.stringify(out.O.map(t => t.bbox)));
// 27x27 타일로 저장: 칸 전체 (격자선 포함)가 아니라 블록 부분만 불투명, 나머지 투명
function save(img, t, name) {
  const o = p.blank(CS, CS);
  for (let y = 0; y < CS; y++) for (let x = 0; x < CS; x++) { const px = get(img, t.x0 + x, t.y0 + y); const inBox = (t.x0 + x) >= t.bbox[0] && (t.x0 + x) <= t.bbox[2] && (t.y0 + y) >= t.bbox[1] && (t.y0 + y) <= t.bbox[3]; if (inBox) put(o, x, y, px.slice(0, 3)); }
  p.encode(o, `${R}/work/tile_${name}.png`);
}
out.T.forEach((t, i) => save(T, t, 'T' + i)); out.O.forEach((t, i) => save(O, t, 'O' + i));
require('fs').writeFileSync(`${R}/work/board_info.json`, JSON.stringify({ vlines, hlines, X0, Y1, CS }));
