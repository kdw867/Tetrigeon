// 후보 선별 (작업 폴더 전용): 프레임별 후보를 후처리·배치하고, 인접 프레임 실루엣 겹침(IoU)과 수정·코어 도트 수 편차를 합친 점수가 가장 높은 조합을 동적계획법으로 고른다.
const fs = require('fs'), path = require('path');
const L = require('./lib_place.js');
const R6 = (n) => path.join(L.W_, 'varco_round6', 'r6_' + n + '.png');
// 프레임 정의: 번호, 고정 앵커 여부, 후보 목록, 오른발 기준(rf)
const FR = [
  { n: 1, role: 'rest', fixed: 'idle' },
  { n: 2, role: 'anticipation', cands: [['f02_a', R6('f02_a')], ['f02_b', R6('f02_b')], ['f02_c', R6('f02_c')]], rf: null },
  { n: 3, role: 'windup-1', cands: [['f03_a', R6('f03_a')], ['f03_b', R6('f03_b')], ['f03_c', R6('f03_c')]], rf: null },
  { n: 4, role: 'windup-2', cands: [['f04_a', R6('f04_a')], ['f04_b', R6('f04_b')]], rf: 88 },
  { n: 5, role: 'WINDUP (key)', cands: [['r4_windup_a', path.join(L.W_, 'varco_round4', 'r4_windup_a.png')]], rf: 88 },
  { n: 6, role: 'swing-1', cands: [['f06_b', R6('f06_b')]], rf: 88 }, // a·c 는 이미지 위쪽이 잘려 제외
  { n: 7, role: 'swing-2', cands: [['f07_a', R6('f07_a')], ['f07_b', R6('f07_b')], ['f07_c', R6('f07_c')]], rf: 88 },
  { n: 8, role: 'STRIKE (key)', cands: [['r3_strike_a', path.join(L.W_, 'varco_round3', 'r3_strike_a.png')]], rf: 88 },
  { n: 9, role: 'RECOIL (key)', cands: [['r4_recoil_b', path.join(L.W_, 'varco_round4', 'r4_recoil_b.png')]], rf: 88 },
  { n: 10, role: 'settle-1', cands: [['f10_a', R6('f10_a')], ['f10_b', R6('f10_b')], ['f10_c', R6('f10_c')]], rf: null },
  { n: 11, role: 'settle-2', cands: [['f11_a', R6('f11_a')], ['f11_b', R6('f11_b')], ['f11_c', R6('f11_c')]], rf: null },
  { n: 12, role: 'rest', fixed: 'idle' },
];
const SHEET = 'C:/Users/MBC-501-15/Documents/Tetrigeon/Tetrigeon/Assets/@Resources/Enemies/AmethystSentinelIdle/T_AmethystSentinel_Idle.png';
const p = require('../../PauseUI_VARCO/tools/pix.js');
const idleSrc = p.crop(p.decode(SHEET), 0, 0, 96, 96), idleCell = p.blank(L.CW, L.CH);
for (let y = 0; y < 96; y++) for (let x = 0; x < 96; x++) idleSrc.d.copy(idleCell.d, ((y + L.OY) * L.CW + x + L.OX) * 4, (y * 96 + x) * 4, (y * 96 + x) * 4 + 4);
const idleStat = L.stats(idleCell);

const table = FR.map(f => {
  if (f.fixed) return { ...f, items: [{ id: 'idle01', cell: idleCell, mask: L.mask(idleCell), st: idleStat }] };
  const items = f.cands.map(([id, raw]) => { const snapc = L.prepare(raw, id); const pl = L.place(snapc, f.rf); return { id, cell: pl.cell, mask: L.mask(pl.cell), st: L.stats(pl.cell), offset: pl.offset, cut: pl.cutBelowSole, outside: pl.outsideCanvas }; });
  return { ...f, items };
});
// 프레임별 후보 통계
table.forEach(f => f.items.forEach(it => console.log(String(f.n).padStart(2), it.id.padEnd(12), 'dots', it.st.dots, '보라', it.st.purple, '청록', it.st.cyan, it.offset ? 'offset ' + it.offset : '', it.cut ? 'cut ' + it.cut : '', it.outside ? 'OUTSIDE ' + it.outside : '')));
// 점수: 인접 IoU 합 - 수정(보라) 도트 수가 원본 대비 벗어난 정도 - 코어 도트 수가 원본(66) 대비 벗어난 정도
const PU0 = idleStat.purple, CY0 = idleStat.cyan;
const node = (it) => -(Math.abs(it.st.purple - PU0 * 1.35) / PU0) * 0.35 - (Math.abs(it.st.cyan - CY0) / CY0) * 0.5 - (it.outside ? 5 : 0);
const dp = table.map(() => []);
table[0].items.forEach((it, j) => { dp[0][j] = { s: 0, prev: -1 }; });
for (let i = 1; i < table.length; i++) table[i].items.forEach((it, j) => { let best = { s: -1e9, prev: -1 }; table[i - 1].items.forEach((pi, k) => { const s = dp[i - 1][k].s + L.iou(pi.mask, it.mask); if (s > best.s) best = { s, prev: k }; }); dp[i][j] = { s: best.s + node(it), prev: best.prev }; });
let j = 0, bestS = -1e9; table[table.length - 1].items.forEach((it, k) => { if (dp[table.length - 1][k].s > bestS) { bestS = dp[table.length - 1][k].s; j = k; } });
const pick = []; for (let i = table.length - 1; i >= 0; i--) { pick[i] = j; j = dp[i][j].prev; }
console.log('\n선택:', pick.map((k, i) => table[i].n + ':' + table[i].items[k].id).join('  '), '| 점수', bestS.toFixed(3));
// 인접 IoU 표
const ious = []; for (let i = 1; i < table.length; i++) ious.push((table[i - 1].n) + '-' + table[i].n + ' ' + L.iou(table[i - 1].items[pick[i - 1]].mask, table[i].items[pick[i]].mask).toFixed(2)); console.log('인접 실루엣 겹침(IoU):', ious.join(' | '));
fs.writeFileSync(path.join(L.R, 'tools', 'frames_v2.json'), JSON.stringify({ frames: table.map((f, i) => ({ n: f.n, role: f.role, src: f.items[pick[i]].id === 'idle01' ? null : f.items[pick[i]].id, rf: f.rf == null ? undefined : f.rf })) }, null, 1));
