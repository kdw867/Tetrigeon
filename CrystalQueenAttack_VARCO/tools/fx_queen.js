// 수정여왕 공격 이펙트(작은 수정, 소멸 섬광)를 코드로 그림 (작업 폴더 전용, Unity와 무관)
// 모든 이펙트 프레임은 캐릭터와 같은 160x160 셀·같은 좌표 기준. 팔레트는 여왕 보라 계열 + 제한적 백색, 알파 0/255.
const p = require('../../PauseUI_VARCO/tools/pix.js');
const PAL = { N: [15, 23, 54], D: [96, 30, 200], P: [158, 58, 251], B: [189, 93, 251], L: [244, 201, 252], W: [255, 255, 255] };
// 왼쪽을 향한 작은 수정 (13x7): L 밝은 연보라 면, B/P 중간 보라, D 어두운 면, W 백색 하이라이트, N 윤곽
const FULL = [ // 15x7, 왼쪽 끝이 뾰족한 육각 기둥 모양
  '.....NNNNNNNN..',
  '...NNLLLLBBBPN.',
  '.NNLLWLLLBBBPPN',
  'NLLLLLLBBBPPDDN',
  '.NNPPBBBBPPPDDN',
  '...NNPPPPDDDDN.',
  '.....NNNNNNNN..'];
const SMALL = [ // 생성 중간 단계 (9x5)
  '...NNNNN.',
  '.NNLLBPPN',
  'NLLWBBPDN',
  '.NNPPDDN.',
  '...NNNN..'];
const DOT = ['LW', 'WL']; // 작은 점 (2x2)
function fromRows(rows) { const h = rows.length, w = rows[0].length, im = p.blank(w, h); rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch === '.') return; const c = PAL[ch], o = (y * w + x) * 4; im.d[o] = c[0]; im.d[o + 1] = c[1]; im.d[o + 2] = c[2]; im.d[o + 3] = 255; })); return im; }
// 단계: 0 점, 1 작은 수정, 2 완성(발사 준비, 끝에 작은 반짝임 점)
function crystal(stage) { return stage === 0 ? fromRows(DOT) : stage === 1 ? fromRows(SMALL) : fromRows(FULL); }
function put(img, x, y, col) { if (x < 0 || y < 0 || x >= img.w || y >= img.h) return; const o = (y * img.w + x) * 4; img.d[o] = col[0]; img.d[o + 1] = col[1]; img.d[o + 2] = col[2]; img.d[o + 3] = 255; }
// 소멸 섬광: f0 = 작은 별(십자+대각, 약 17x17), f1 = 흩어지는 점 4개 (각 50ms)
function flash(f) {
  const S = 19, im = p.blank(S, S), c = 9;
  if (f === 0) {
    for (let t = 1; t <= 8; t++) { const col = t <= 3 ? PAL.L : (t <= 6 ? PAL.B : PAL.P); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) put(im, c + dx * t, c + dy * t, col); }
    for (let t = 1; t <= 4; t++) for (const [dx, dy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) put(im, c + dx * t, c + dy * t, t <= 2 ? PAL.L : PAL.B);
    for (let y = -1; y <= 1; y++) for (let x = -1; x <= 1; x++) put(im, c + x, c + y, PAL.W);
  } else { for (const [dx, dy] of [[5, 5], [-5, 5], [5, -5], [-5, -5]]) put(im, c + dx, c + dy, PAL.L); for (const [dx, dy] of [[7, 0], [-7, 0], [0, 7], [0, -7]]) put(im, c + dx, c + dy, PAL.B); put(im, c, c, PAL.W); }
  return im;
}
// 160x160 이펙트 셀에 작은 그림을 중심 (cx,cy) 에 붙임 (왼쪽 위 = 중심 - 반 크기 내림)
function stamp(cell, img, cx, cy) { const ox = Math.round(cx - (img.w - 1) / 2), oy = Math.round(cy - (img.h - 1) / 2); for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) { const s = (y * img.w + x) * 4; if (!img.d[s + 3]) continue; const X = ox + x, Y = oy + y; if (X < 0 || Y < 0 || X >= 160 || Y >= 160) throw new Error('이펙트가 셀 밖: ' + X + ',' + Y); img.d.copy(cell.d, (Y * 160 + X) * 4, s, s + 4); } }
module.exports = { PAL, crystal, flash, stamp, FULL };
