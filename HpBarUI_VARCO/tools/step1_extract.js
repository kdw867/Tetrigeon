// 1단계: 컨셉 아트에서 레미 HP바·몬스터 HP바를 잘라 게임 도트 크기로 줄인다 (작업 폴더에만 저장, Unity 적용 아님)
// 컨셉 큰 막대의 도트 한 칸은 약 3px이므로 F=3.1 정도로 줄이면 돌 질감이 1~2px 도트가 된다
const p = require('../../PauseUI_VARCO/tools/pix.js'), path = require('path');
const R = path.join(__dirname, '..'), WORK = R + '/work';
const [FS = '3.1'] = process.argv.slice(2), F = +FS;
const im = p.decode(`${R}/refs/ref_concept_hpbars.png`), BG = [...im.d.subarray(0, 3)];
console.log('배경색', BG.join(','));
// 영역 안에서 배경(진한 남색)과 충분히 다른 픽셀의 바운딩 박스
function bbox(x0, y0, x1, y1, tol = 55) {
  let a = 1e9, b = 1e9, c = -1, d = -1;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const i = (y * im.w + x) * 4; if (Math.abs(im.d[i] - BG[0]) + Math.abs(im.d[i + 1] - BG[1]) + Math.abs(im.d[i + 2] - BG[2]) > tol) { a = Math.min(a, x); c = Math.max(c, x); b = Math.min(b, y); d = Math.max(d, y); } }
  return { x0: a, y0: b, x1: c, y1: d, w: c - a + 1, h: d - b + 1 };
}
function cut(name, box, pad = 2) {
  const w = Math.round((box.w + 2 * pad) / F) * F, h = Math.round((box.h + 2 * pad) / F) * F;
  const cx = Math.round((box.x0 + box.x1) / 2 - w / 2 + 0.5), cy = Math.round((box.y0 + box.y1) / 2 - h / 2 + 0.5);
  const raw = p.boxDown(p.crop(im, cx, cy, Math.round(w), Math.round(h)), F);
  p.encode(raw, `${WORK}/${name}_raw.png`); p.encode(p.nearestUp(raw, 4), `${WORK}/${name}_raw_x4.png`);
  console.log(name, 'box', JSON.stringify(box), '→ 축소', raw.w + 'x' + raw.h);
  return raw;
}
// 레미 큰 막대 (숫자·방패 줄은 제외: y 188~305 사이의 막대 본체만)
cut('lemy_bar', bbox(240, 197, 1090, 305));
// 몬스터 큰 막대 (y 462~548)
cut('monster_bar', bbox(310, 462, 1060, 548));
// 방패 줄의 막대(작은 청록 막대)와 방패 아이콘
cut('shield_bar', bbox(500, 310, 890, 345));
cut('shield_icon', bbox(372, 305, 425, 360));
