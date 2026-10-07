// 선택된 몬스터 행의 청록 테두리 빛: 슬롯 모양(투명 모서리 포함)을 따라 안쪽 2칸은 밝은 청록 테두리, 바깥 3칸은 옅어지는 빛
// 출력: parts/layers/T_StageBoard_SlotGlow.png (슬롯보다 사방 3도트 큼, 같은 방식의 9분할)
const { p, R, hex, put } = require('./lib_board');
const slot = p.decode(`${R}/parts/layers/T_StageBoard_Slot.png`); // 236x40
const M = 3, W = slot.w + 2 * M, H = slot.h + 2 * M;
const out = p.blank(W, H);
const solid = (x, y) => { const sx = x - M, sy = y - M; return sx >= 0 && sy >= 0 && sx < slot.w && sy < slot.h && slot.d[(sy * slot.w + sx) * 4 + 3] > 128; };
function nearest(x, y, wantSolid, maxR) { // 반경 안에서 가장 가까운, 원하는 종류(불투명/투명) 픽셀까지의 거리 (없으면 큰 값)
  let best = 1e9;
  for (let dy = -maxR; dy <= maxR; dy++) for (let dx = -maxR; dx <= maxR; dx++) { if (solid(x + dx, y + dy) === wantSolid) best = Math.min(best, Math.hypot(dx, dy)); }
  return best;
}
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  if (solid(x, y)) { const d = nearest(x, y, false, 2); // 안쪽: 가장 바깥 2칸만 테두리
    if (d <= 1.01) put(out, x, y, '#8cecf4', 255); else if (d <= 2.01) put(out, x, y, '#3ec0d6', 220); }
  else { const d = nearest(x, y, true, 3); // 바깥: 옅어지는 빛
    if (d <= 1.01) put(out, x, y, '#3ec0d6', 170); else if (d <= 2.01) put(out, x, y, '#2a8ea0', 100); else if (d <= 3.01) put(out, x, y, '#1d6f82', 50); }
}
p.encode(out, `${R}/parts/layers/T_StageBoard_SlotGlow.png`);
// 확인용: 어두운 배경에 3배
const chk = p.blank(W * 3, H * 3 + 6); for (let i = 0; i < chk.w * chk.h; i++) { chk.d[i * 4] = 14; chk.d[i * 4 + 1] = 24; chk.d[i * 4 + 2] = 40; chk.d[i * 4 + 3] = 255; }
const { blit } = require('./lib_board'); blit(chk, slot, M * 3, M * 3, 3); blit(chk, out, 0, 0, 3);
p.encode(chk, `${R}/work/glow_check.png`);
console.log('완료', W + 'x' + H);
