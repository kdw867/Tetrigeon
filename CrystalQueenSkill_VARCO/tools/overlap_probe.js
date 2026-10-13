// 왕관이 여왕 몸과 겹치는 도트 수를 자세·가로 위치별로 잰다 (읽기 전용, 작업 폴더 전용)
const path = require('path');
const p = require('../../PauseUI_VARCO/tools/pix.js'), S = require('./skill_frames.js'), FX = require('./fx_skill.js');
const POSES = { A: 'T07', r1: 'T08', B: 'T09' };
const rows = FX.ART.crown, H = rows.length, W = rows[0].length;
for (const [name, id] of Object.entries(POSES)) {
  const ch = p.decode(path.join(S.ATK, S.step(id).character)), c0 = S.crownC(id), res = [];
  for (let c = c0 - 8; c <= c0 + 8; c++) { // 왕관 중심 블록 c 일 때 겹치는 도트(블록) 수와 겹친 줄 범위
    let ov = 0, maxRow = 0; rows.forEach((r, j) => [...r].forEach((ch2, i) => { if (ch2 === '.') return; const X = 2 * (c - (W >> 1) + i) + 1, Y = 2 * (S.CROWN_J0 + j) + 1; if (X < 0 || X > 158) return; if (ch.d[(Y * 160 + X) * 4 + 3]) { ov++; maxRow = Math.max(maxRow, j); } }));
    res.push([c, ov]);
  }
  const tot = rows.join('').replace(/\./g, '').length;
  console.log(name, '추적 위치 c0=' + c0, '왕관 칠한 도트', tot, '| c: 겹침 도트 →', res.map(([c, o]) => c + ':' + o).join(' '));
}
