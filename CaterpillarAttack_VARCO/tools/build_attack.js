// 애벌레 공격 10프레임 제작: 동작표(마디별 정수 이동)로 합성하고 검사한 뒤 시트·확대 이미지를 저장 (작업 폴더 전용)
const fs = require('fs'), path = require('path');
const L = require('./lib_cat.js');
const tag = process.argv[2] || 'v1';
const cfg = { domeH: 27, domeM: 39, legRow: 47, legH: 24, legM: 36, ext: 2 };
// 마디별 [dx, dy]. 왼쪽(-x)이 공격 방향. H=머리(눈 있는 큰 마디), M=가운데 몸통, R=뒤 몸통
const MOTION = JSON.parse(fs.readFileSync(path.join(L.R, 'tools', 'motion_' + tag + '.json'), 'utf8'));
const base = L.loadIdle(0);
const layers = L.buildLayers(base, cfg);
const frames = [], report = [];
MOTION.frames.forEach((m, i) => {
  const off = { H: m.H, M: m.M, R: m.R };
  const f = L.compose(layers, off);
  const filled = L.fillHoles(f, 8);
  const info = L.inspect(f);
  const gHM = m.M[0] - m.H[0], gMR = m.R[0] - m.M[0];
  if (info.comps !== 1 || info.holes !== 0 || info.partial !== 0) throw new Error('프레임 ' + (i + 1) + ' 검사 실패 ' + JSON.stringify(info));
  if (gHM > 2 || gMR > 2) throw new Error('프레임 ' + (i + 1) + ' 마디 간격 초과 ' + gHM + ',' + gMR);
  report.push({ frame: i + 1, note: m.note, H: m.H, M: m.M, R: m.R, gapHM: gHM, gapMR: gMR, filledHoleCells: filled, bbox: info.bbox });
  frames.push(f);
});
// 시작·끝 동일, 시작은 Idle 01과 동일
if (Buffer.compare(frames[0].d, base.d) !== 0) throw new Error('01이 Idle 01과 다름');
if (Buffer.compare(frames[0].d, frames[9].d) !== 0) throw new Error('10이 01과 다름');
fs.writeFileSync(path.join(L.R, 'work', 'attack_' + tag + '_report.json'), JSON.stringify(report, null, 1));
console.log(report.map(r => `${String(r.frame).padStart(2)} H${r.H} M${r.M} R${r.R} gap ${r.gapHM}/${r.gapMR} fill ${r.filledHoleCells} bbox ${r.bbox}  ${r.note}`).join('\n'));
const strip = L.strip(frames, 8, [226, 226, 232], [0, 22, 56, 34]);
L.p.encode(strip, path.join(L.R, 'work', 'attack_' + tag + '_strip_x8.png'));
module.exports = { frames, report };
