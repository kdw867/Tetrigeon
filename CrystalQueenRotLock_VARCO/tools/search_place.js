// 룬 자리 탐색 (작업 폴더 전용): 룬(윤곽 포함, 회전 전 각도)이 8장 몸 실루엣 합집합과 한 도트 이상 떨어지는 위치 중 머리에 가장 가까운 곳
const path = require('path'), p = require('../../PauseUI_VARCO/tools/pix.js'), F = require('./fx_rotlock.js'), S = F.S;
const cells = Object.values(S.J.character_cells).map(n => p.decode(path.join(S.ATK, 'CastFrames_v3_cells', 'CrystalQueen_CastFrame_' + n + '.png')));
const U = new Set(); cells.forEach(c => { for (let j = 0; j < 80; j++) for (let i = 0; i < 80; i++) { let o = 0; for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) if (c.d[((2 * j + 1 + y) * 160 + 2 * i + 1 + x) * 4 + 3]) o = 1; if (o) U.add(i + ',' + j); } });
for (const R of [6, 7, 8]) {
  const offs = new Set(); for (let rho = -120; rho <= 0; rho += 3) for (const k of F.ringMap(rho, R).keys()) offs.add(k);
  const pts = [...offs].map(k => k.split(',').map(Number)); const top = Math.min(...pts.map(q => q[1])), bot = Math.max(...pts.map(q => q[1])), le = Math.min(...pts.map(q => q[0])), ri = Math.max(...pts.map(q => q[0]));
  const ok = []; for (let cy = 10 - top; cy < 60; cy++) for (let cx = -le; cx + ri < 78; cx++) { let good = true; for (const [x, y] of pts) { for (let dy = -1; dy <= 1 && good; dy++) for (let dx = -1; dx <= 1; dx++) if (U.has((cx + x + dx) + ',' + (cy + y + dy))) { good = false; break; } if (!good) break; } if (good) ok.push([cx, cy]); }
  ok.sort((a, b) => Math.abs(a[0] - 40) - Math.abs(b[0] - 40) || a[1] - b[1]);
  console.log('R=' + R, '범위 x', le, '~', ri, 'y', top, '~', bot, '| 가능 자리', ok.length, '| 머리(열 40)에 가장 가까운 상위 6:', ok.slice(0, 6).map(q => q.join(',')).join(' '), '| 가장 위쪽 줄 자리 중 오른쪽 끝:', (() => { const r = ok.filter(q => q[1] === Math.min(...ok.map(z => z[1]))); return r.length ? r[r.length - 1].join(',') : '-'; })());
}
