// 수정여왕 SKILL 왕관 자리 측정 (작업 폴더 전용, Unity와 무관): 승인된 일반공격 캐릭터 셀(저장된 파일)에서 프레임별 위쪽 실루엣을 잰다.
const path = require('path');
const p = require('../../PauseUI_VARCO/tools/pix.js');
const ATK = path.join(__dirname, '..', '..', 'CrystalQueenAttack_VARCO', 'output', 'CastFrames_v3_cells');
const J = require(path.join(__dirname, '..', '..', 'CrystalQueenAttack_VARCO', 'output', 'CastFrames_v3_timeline.json'));
const NAMES = { rest: '0_rest', A: '3_clasp', r1: '4_reach-mid', B: '5_reach', d1: '6_lower1', d2: '7_lower2' };
// 게임 화면 좌표: 셀 원점 화면 y = -37 (스테이지 10 보스 자리, 배율 2) → 화면에 보이는 첫 셀 줄 = 19
const SY = -37, FIRST_VISIBLE_ROW = Math.ceil(-SY / 2);
console.log('셀 원점 화면 y', SY, '화면에 보이는 첫 셀 줄', FIRST_VISIBLE_ROW);
for (const [k, n] of Object.entries(NAMES)) {
  const c = p.decode(path.join(ATK, 'CrystalQueen_CastFrame_' + n + '.png')), top = new Array(160).fill(999);
  for (let x = 0; x < 160; x++) for (let y = 0; y < 160; y++) if (c.d[(y * 160 + x) * 4 + 3]) { top[x] = y; break; }
  let ty = 999, tx = 0, minX = 999, maxX = -1; for (let x = 0; x < 160; x++) { if (top[x] < ty) { ty = top[x]; tx = x; } if (top[x] < 999) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); } }
  // 열 8개 묶음(16px 폭)별 위쪽 줄
  const bands = []; for (let x0 = 48; x0 < 128; x0 += 8) { let m = 999; for (let x = x0; x < x0 + 8; x++) m = Math.min(m, top[x]); bands.push(x0 + ':' + m); }
  console.log(k.padEnd(4), '최상단 줄', ty, '(x', tx + ')', '몸 가로', minX + '~' + maxX, '| 8열 묶음 위쪽 줄', bands.join(' '));
}
