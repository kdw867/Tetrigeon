// 기존 명패(MINO UPGRADES, 192x33)에서 글자만 지운 빈 명패를 만든다. 작업 폴더에만 저장
// 글자 칸(x 22~170, y 9~22)을 줄마다 글자가 아닌 안쪽 색의 중앙값으로 채움
const p = require('../../PauseUI_VARCO/tools/pix.js');
const a = p.decode(`${__dirname}/../refs/ref_nameplate_minoupgrades.png`);
const X0 = 22, X1 = 170, Y0 = 8, Y1 = 24; // 창 안쪽 전체 줄 (8, 24는 기준 줄)
const lum = (x, y) => { const o = (y * a.w + x) * 4; return (a.d[o] + a.d[o + 1] + a.d[o + 2]) / 3; };
const med = (arr) => arr.sort((u, v) => u - v)[Math.floor(arr.length / 2)];
for (let y = Y0; y <= Y1; y++) {
  const rs = [], gs = [], bs = [];
  for (let x = X0; x <= X1; x++) if (lum(x, y) < 40) { const o = (y * a.w + x) * 4; rs.push(a.d[o]); gs.push(a.d[o + 1]); bs.push(a.d[o + 2]); }
  if (!rs.length) continue;
  const c = [med(rs), med(gs), med(bs)];
  for (let x = X0; x <= X1; x++) { const o = (y * a.w + x) * 4; a.d[o] = c[0]; a.d[o + 1] = c[1]; a.d[o + 2] = c[2]; }
}
p.encode(a, `${__dirname}/../work/plate_blank.png`);
p.encode(p.nearestUp(a, 5), `${__dirname}/../work/plate_blank_x5.png`);
console.log('ok');
