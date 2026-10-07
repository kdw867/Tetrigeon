// 스테이지 현황판 미리보기 합성 (작업 폴더 전용): 실제 FHD 캡처의 오른쪽 빈 패널 위에 정적 아트 + 글자 + 몬스터를 올려 본다
// 배율: 아트 1.75배, 글자·숫자는 각자 배율. 사용법: node mock_board.js <시나리오 A|B> <출력 PNG>
const { p, R, ROOT, blit, loadFont, measure, drawText, rect } = require('./lib_board');
const S = 1.75;
const L = (n) => p.decode(`${R}/parts/layers/T_StageBoard_${n}.png`);
const HB = (n) => p.decode(`${ROOT}/Tetrigeon/Assets/@Resources/UI/HpBars/Layers/T_HpMonster_${n}.png`);
const digits = (c) => loadFont(`${ROOT}/HpBarUI_VARCO/font/HpDigits.json`, `${ROOT}/HpBarUI_VARCO/font/HpDigits_${c}.png`);
const rfont = (c) => loadFont(`${ROOT}/RewardUI_VARCO/font/PixelFont.json`, `${ROOT}/RewardUI_VARCO/font/PixelFont_${c}.png`);
const plate = L('Plate'), slot = L('Slot'), track = L('Track'), nodes = { pending: L('Node_Pending'), done: L('Node_Done'), current: L('Node_Current') };
const barFrame = HB('Frame'), barTrack = HB('Track'), barFill = HB('Fill');
const sheetCell = (file, cell) => p.crop(p.decode(`${ROOT}/Tetrigeon/Assets/@Resources/Enemies/${file}`), 0, 0, cell, cell);
const idle = { normal: sheetCell('CrystalLarvaIdle/T_CrystalLarva_Idle.png', 64), epic: sheetCell('AmethystSentinelIdle/T_AmethystSentinel_Idle.png', 96), boss: sheetCell('CrystalQueenIdle/T_CrystalQueen_Idle.png', 160) };
const death = { normal: p.decode(`${ROOT}/Tetrigeon/Assets/@Resources/Enemies/T_CrystalLarva_Death.png`), epic: p.decode(`${ROOT}/Tetrigeon/Assets/@Resources/Enemies/T_AmethystSentinel_Death.png`), boss: p.decode(`${ROOT}/Tetrigeon/Assets/@Resources/Enemies/T_CrystalQueen_Death.png`) };

// 행 높이(FHD px)와 몬스터 표시: 눈금(feet=발바닥 위 여백, 셀 위쪽까지의 거리), 배율은 정수
const ROWSRC = { normal: 52, epic: 58, boss: 71 }; // 행 높이 (원본 도트, 화면에서는 x1.75)
const PORT = { normal: { s: 2, cellFeetFromBottom: 12, pad: 8 }, epic: { s: 1, cellFeetFromBottom: 10, pad: 10 }, boss: { s: 1, cellFeetFromBottom: 12, pad: 6 } };
const TIERFONT = { normal: 'cream', epic: 'teal', boss: 'gold' };
const TIERNAME = { normal: 'NORMAL', epic: 'EPIC', boss: 'BOSS' };

function bakeSlot(srcH) { const o = p.blank(236, srcH); for (let y = 0; y < srcH; y++) for (let x = 0; x < 236; x++) { const sy = y < 9 ? y : y >= srcH - 8 ? 40 - (srcH - y) : 20; const so = (sy * 236 + x) * 4, d = (y * 236 + x) * 4; for (let c = 0; c < 4; c++) o.d[d + c] = slot.d[so + c]; } return o; }
const scenario = process.argv[2] || 'A', outFile = process.argv[3] || `${R}/preview/StageBoard_Mock_${scenario}.png`;
const sc = scenario === 'A'
  ? { stage: 6, enemies: [{ tier: 'normal', hp: 0, max: 20 }, { tier: 'normal', hp: 12, max: 20 }, { tier: 'epic', hp: 32, max: 40 }] }
  : { stage: 10, enemies: [{ tier: 'normal', hp: 20, max: 20 }, { tier: 'epic', hp: 40, max: 40 }, { tier: 'boss', hp: 70, max: 70 }] };

const img = p.decode(`${ROOT}/HpBarUI_VARCO/preview/Unity_NoStagePanel.png`);
// 이전 캡처의 패널 안 글자("피해 -50%")와 몬스터 막대 흔적을 피하려 패널 안쪽을 배경 색으로 칠함
const X0 = 1454, Y0 = 345; // 내용 왼쪽 위 (패널 안쪽 x 1440~1880 가운데 정렬, y 341~1047)
const bgBase = p.decode(`${R}/refs/ref_bg_right_panel.png`); // 배경 크롭 (1.04배 원본)
for (let y = 343; y < 1045; y++) for (let x = 1442; x < 1878; x++) { const bx = Math.min(bgBase.w - 1, Math.round(18 + (x - 1442) * 1.04)), by = Math.min(bgBase.h - 1, Math.round(37 + (y - 343) * 1.02)); const o = (by * bgBase.w + bx) * 4, d = (y * img.w + x) * 4; img.d[d] = bgBase.d[o]; img.d[d + 1] = bgBase.d[o + 1]; img.d[d + 2] = bgBase.d[o + 2]; }

const wide = Math.round(236 * S); // 413
// 1) STAGE 명패
blit(img, plate, X0 + Math.round((wide - 192 * S) / 2), Y0 + 8, S);
const pc = rfont('cream'); drawText(img, pc, 'STAGE', X0 + wide / 2, Y0 + 8 + Math.round((33 * S - 9 * 2.5) / 2) - 2, 2.5, 'c');
// 2) 숫자 칸: 현재(청록) / 전체(밝은 회색)
const numY = Y0 + 72; blit(img, bakeSlot(40), X0, numY, S);
const dc = digits('cyan'), dg = digits('gray');
const cur = String(sc.stage).padStart(2, '0'), tot = '10';
const wCur = measure(dc, cur) * 3, wSlash = measure(dg, ' / ') * 3, wTot = measure(dg, tot) * 3, total = wCur + wSlash + wTot;
let tx = X0 + wide / 2 - total / 2; const ty = numY + Math.round((40 * S - 11 * 3) / 2);
drawText(img, dc, cur, tx, ty, 3); drawText(img, dg, ' / ', tx + wCur, ty, 3); drawText(img, dg, tot, tx + wCur + wSlash, ty, 3);
// 3) 진행도: 트랙(연결선+왕관) 위에 노드 10개 + 숫자
const trackY = Y0 + 150; blit(img, track, X0, trackY, S);
const CX = [24, 71, 118, 165, 212], NODEY = [0, 47]; // 노드 위쪽 y (원본 도트)
const stateOf = (n) => n < sc.stage ? 'done' : n === sc.stage ? 'current' : 'pending';
const fontOf = { done: 'teal', current: 'cyan', pending: 'dim' };
for (let n = 1; n <= 10; n++) {
  const col = (n - 1) % 5, row = Math.floor((n - 1) / 5), st = stateOf(n);
  const nx = X0 + Math.round((CX[col] - 33 / 2) * S), ny = trackY + Math.round(NODEY[row] * S);
  blit(img, nodes[st], nx, ny, S);
  const f = digits(fontOf[st]), str = String(n), w = measure(f, str) * 1.5;
  drawText(img, f, str, nx + Math.round(33 * S / 2), ny + Math.round((29 * S - 9 * 1.5) / 2) - 1, 1.5, 'c');
}
// 4) ENEMIES 명패
const p2Y = Y0 + 291; blit(img, plate, X0 + Math.round((wide - 192 * S) / 2), p2Y, S);
drawText(img, pc, 'ENEMIES', X0 + wide / 2, p2Y + Math.round((33 * S - 9 * 2.5) / 2) - 2, 2.5, 'c');
// 5) 몬스터 행
let ry = p2Y + Math.round(33 * S) + 8;
for (const e of sc.enemies) {
  const dead = e.hp <= 0;
  // 행 배경: 슬롯을 위·아래 가장자리만 쓰고 가운데는 한 줄 반복 (유니티 Sliced와 같은 결과)
  const srcH = ROWSRC[e.tier];
  blit(img, bakeSlot(srcH), X0, ry, S);
  // 몬스터 그림 (살아있으면 Idle 첫 프레임, 처치되면 사망 그림)
  const pt = PORT[e.tier], rowBottom = ry + srcH * S, feetY = rowBottom - pt.pad, cx = X0 + 98;
  if (!dead) { const sp = idle[e.tier], top = feetY - (sp.h - pt.cellFeetFromBottom) * pt.s; blit(img, sp, Math.round(cx - sp.w * pt.s / 2), Math.round(top), pt.s); }
  else { const sp = death[e.tier]; blit(img, sp, Math.round(cx - sp.w * pt.s / 2), Math.round(feetY - sp.h * pt.s), pt.s); }
  // 등급 글자 + 체력 막대(1.75배) 또는 DEFEATED
  const lf = rfont(TIERFONT[e.tier]), blockH = 9 * 2 + 6 + Math.round(20 * S), by = ry + Math.round((srcH * S - blockH) / 2);
  drawText(img, lf, TIERNAME[e.tier], X0 + 164, by, 2, 'l');
  const barY = by + 9 * 2 + 6, barX = X0 + 158;
  if (!dead) {
    blit(img, barTrack, barX + Math.round(9 * 1.75 * 1), barY + Math.round(4.5 * S), S, null, 1, 0, 0, barTrack.w, barTrack.h);
    blit(img, barFill, barX + Math.round(9 * 1.75 * 1), barY + Math.round(4.5 * S), S, null, 1, 0, 0, Math.round(barFill.w * e.hp / e.max), barFill.h);
    blit(img, barFrame, barX, barY, S);
    const nf = digits('cream'), str = `${e.hp} / ${e.max}`;
    drawText(img, nf, str, barX + Math.round(barFrame.w * S / 2), barY + Math.round((barFrame.h * S - 11 * S) / 2), S, 'c');
  } else {
    drawText(img, rfont('cream'), 'DEFEATED', barX + Math.round(barFrame.w * S / 2), barY + Math.round((barFrame.h * S - 9 * 2) / 2), 2, 'c');
    for (let y = ry; y < ry + srcH * S; y++) for (let x = X0; x < X0 + wide; x++) { const d = (y * img.w + x) * 4; img.d[d] = Math.round(img.d[d] * 0.5); img.d[d + 1] = Math.round(img.d[d + 1] * 0.5); img.d[d + 2] = Math.round(img.d[d + 2] * 0.5); }
  }
  ry += Math.round(srcH * S) + 8;
}
p.encode(img, outFile);
p.encode(p.crop(img, 1430, 335, 460, 715), outFile.replace('.png', '_panel.png'));
console.log('저장', outFile, '| 마지막 행 끝 y', ry, '(패널 안쪽 끝 1047)');
