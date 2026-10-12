// 10프레임 조립 (작업 폴더 전용): 스냅·정리한 자세들을 같은 발바닥 줄·발 중심에 맞춰 128x104 셀로 배치하고 시트/검사 이미지 생성
const fs = require('fs'), path = require('path');
const p = require('../../PauseUI_VARCO/tools/pix.js');
const R = path.join(__dirname, '..'), W_ = path.join(R, 'work');
const SHEET = 'C:/Users/MBC-501-15/Documents/Tetrigeon/Tetrigeon/Assets/@Resources/Enemies/AmethystSentinelIdle/T_AmethystSentinel_Idle.png';
const CW = 128, CH = 104, OX = 16, OY = 8, BASE_Y = 94, FEET_CX = 66; // 원본 셀을 (16,8)에 둔 캔버스, 발바닥 줄 94, 발 중심 66
const A = (im, x, y) => (x < 0 || y < 0 || x >= im.w || y >= im.h) ? 0 : im.d[(y * im.w + x) * 4 + 3];

// 자세 목록: 프레임 번호 순서, 파일 이름은 work/snapc_<name>.png (null 이면 원본 Idle 01)
const FRAMES = JSON.parse(fs.readFileSync(path.join(R, 'tools', process.env.FRAMES_JSON || (require.main === module && process.argv[2]) || 'frames_v1.json'), 'utf8')).frames;

function baselineRow(im) { // 폭이 넓은 줄(몸·발)만 센다: 발보다 아래로 삐져나온 수정 끝(좁음)은 무시
  for (let y = im.h - 1; y >= 0; y--) { let n = 0; for (let x = 0; x < im.w; x++) if (A(im, x, y)) n++; if (n >= 30) return y; }
  throw new Error('발바닥 줄을 못 찾음');
}
function rightFootCenter(im, yb) { // 발바닥 근처 두 줄에서 가장 오른쪽의 폭 12 이상 구간의 중심
  let best = null;
  for (const y of [yb, yb - 1]) { let s = -1; for (let x = 0; x <= im.w; x++) { const a = x < im.w ? A(im, x, y) : 0; if (a && s < 0) s = x; if (!a && s >= 0) { if (x - s >= 12 && (!best || (s + x - 1) / 2 > best)) best = (s + x - 1) / 2; s = -1; } } }
  if (best === null) throw new Error('오른쪽 발을 못 찾음'); return best;
}
function placeSnapped(name, rf) {
  const im = p.decode(path.join(W_, (process.env.SNAPC_PREFIX || 'snapc_') + name + '.png')), yb = baselineRow(im);
  let x0 = 999, x1 = -1; for (let y = yb - 3; y <= yb; y++) for (let x = 0; x < im.w; x++) if (A(im, x, y)) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); }
  const dx = rf != null ? Math.round(rf - rightFootCenter(im, yb)) : Math.round(FEET_CX - (x0 + x1) / 2), dy = BASE_Y - yb, out = p.blank(CW, CH); let cut = 0;
  for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) { if (!A(im, x, y)) continue; const X = x + dx, Y = y + dy; if (Y > BASE_Y) { cut++; continue; } if (X < 0 || Y < 0 || X >= CW) throw new Error(name + ' 캔버스 밖 ' + X + ',' + Y); im.d.copy(out.d, (Y * CW + X) * 4, (y * im.w + x) * 4, (y * im.w + x) * 4 + 4); }
  // 겉 한 겹이 밝은 회색(채도 낮음)이면 원본 윤곽색으로 바꿈: 원본은 겉 픽셀의 75%가 어두운 윤곽이고 VARCO 그림은 밝은 테두리가 섞여 들어옴
  const DARK = [16, 18, 28], halo = (o) => { const r = out.d[o], g = out.d[o + 1], b = out.d[o + 2]; return Math.max(r, g, b) - Math.min(r, g, b) < 45 && r + g + b > 380; };
  const edge = []; for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) if (A(out, x, y) && (!A(out, x - 1, y) || !A(out, x + 1, y) || !A(out, x, y - 1) || !A(out, x, y + 1)) && halo((y * CW + x) * 4)) edge.push((y * CW + x) * 4);
  edge.forEach(o => { out.d[o] = DARK[0]; out.d[o + 1] = DARK[1]; out.d[o + 2] = DARK[2]; });
  return { cell: out, info: { name, baselineRow: yb, feet: [x0, x1], offset: [dx, dy], cutBelowSole: cut, rimToOutline: edge.length } };
}
const idle = p.crop(p.decode(SHEET), 0, 0, 96, 96), idleCell = p.blank(CW, CH);
for (let y = 0; y < 96; y++) for (let x = 0; x < 96; x++) idle.d.copy(idleCell.d, ((y + OY) * CW + x + OX) * 4, (y * 96 + x) * 4, (y * 96 + x) * 4 + 4);
const cells = [], infos = [];
FRAMES.forEach(f => { if (!f.src) { cells.push(idleCell); infos.push({ name: 'idle01' }); } else { const r = placeSnapped(f.src, f.rf); cells.push(r.cell); infos.push(r.info); } });
module.exports = { cells, infos, CW, CH, FRAMES, BASE_Y };
if (require.main === module) {
  const tag = process.argv[3] || 'v1', OUT = path.join(R, 'output');
  // 시트 5x2 (640x208)
  const sheet = p.blank(CW * 5, CH * 2);
  cells.forEach((c, i) => { const ox = (i % 5) * CW, oy = Math.floor(i / 5) * CH; for (let y = 0; y < CH; y++) c.d.copy(sheet.d, ((oy + y) * sheet.w + ox) * 4, y * CW * 4, (y + 1) * CW * 4); });
  p.encode(sheet, path.join(OUT, `T_AmethystSentinel_Attack_${tag}.png`));
  // 검사 이미지: 10프레임 5x2, 4배, 발바닥 줄(94)·발 중심(66) 눈금
  const S = 4, bg = [38, 44, 58], G = 4, gw = (CW * S + G) * 5 - G, gh = (CH * S + G) * 2 - G, g = p.blank(gw, gh);
  for (let i = 0; i < gw * gh; i++) { g.d[i * 4] = bg[0]; g.d[i * 4 + 1] = bg[1]; g.d[i * 4 + 2] = bg[2]; g.d[i * 4 + 3] = 255; }
  cells.forEach((c, i) => { const up = p.nearestUp(c, S), ox = (i % 5) * (CW * S + G), oy = Math.floor(i / 5) * (CH * S + G); for (let y = 0; y < up.h; y++) for (let x = 0; x < up.w; x++) { const s = (y * up.w + x) * 4, t = ((oy + y) * gw + ox + x) * 4; if (up.d[s + 3]) { up.d.copy(g.d, t, s, s + 4); } if (y === (BASE_Y + 1) * S && x % 2 === 0) { g.d[t] = 90; g.d[t + 1] = 110; g.d[t + 2] = 140; } } });
  p.encode(g, path.join(OUT, `Sentinel_Attack_${tag}_inspect_10frames.png`));
  fs.writeFileSync(path.join(W_, `frames_${tag}_report.json`), JSON.stringify(infos, null, 1));
  console.log(infos.map((x, i) => (i + 1) + ':' + JSON.stringify(x)).join('\n'));
}
