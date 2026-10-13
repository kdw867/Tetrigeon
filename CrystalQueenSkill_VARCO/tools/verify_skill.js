// 수정여왕 SKILL 핵심 장면 검증 (작업 폴더 전용): 저장된 이펙트 PNG 를 다시 읽어 격자·팔레트·화면 위쪽 한계·캐릭터 겹침·손 이펙트 자리를 확인한다.
const fs = require('fs'), path = require('path');
const p = require('../../PauseUI_VARCO/tools/pix.js'), FX = require('./fx_skill.js'), S = require('./skill_frames.js');
const OUT = S.OUT, INFO = JSON.parse(fs.readFileSync(path.join(OUT, 'SkillScenes_' + S.VER + '_build_info.json'), 'utf8'));
const pal = new Set(Object.values(FX.PAL).map(c => c.join(',')));
const CYAN = '51,229,239', PALE = '188,199,245';
let bad = 0; const fail = (m) => { bad++; console.log('  ✗', m); };
for (const sc of INFO.scenes) {
  const fx = p.decode(path.join(OUT, sc.fx)), ch = p.decode(path.join(OUT, sc.character)), st = S.step(sc.step);
  let n = 0, nonBinary = 0, offPal = 0, offGrid = 0, minRow = 999, minX = 999, maxX = -1, maxRow = -1, onBody = 0, onEye = 0;
  const face = st.mark_shift_px ? st.mark_shift_px.face : [0, 0], fb = [75 + face[0], 63 + face[1], 84 + face[0], 70 + face[1]]; let onFace = 0;
  for (let y = 0; y < 160; y++) for (let x = 0; x < 160; x++) {
    const o = (y * 160 + x) * 4, a = fx.d[o + 3]; if (!a) continue; n++;
    if (a !== 255) nonBinary++;
    const col = fx.d[o] + ',' + fx.d[o + 1] + ',' + fx.d[o + 2]; if (!pal.has(col)) offPal++;
    const bx = ((x - 1) >> 1) * 2 + 1, by = ((y - 1) >> 1) * 2 + 1; // 같은 2x2 블록(위상 (1,1))의 네 픽셀이 같은 색·불투명이어야 함
    for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { const q = ((by + dy) * 160 + bx + dx) * 4; if (x < 1 || y < 1 || fx.d[q + 3] !== 255 || fx.d[q] !== fx.d[o] || fx.d[q + 1] !== fx.d[o + 1] || fx.d[q + 2] !== fx.d[o + 2]) { offGrid++; break; } }
    minRow = Math.min(minRow, y); maxRow = Math.max(maxRow, y); minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    if (ch.d[o + 3]) { onBody++; const cc = ch.d[o] + ',' + ch.d[o + 1] + ',' + ch.d[o + 2]; if (cc === CYAN || cc === PALE) onEye++; }
    if (x >= fb[0] && x <= fb[2] && y >= fb[1] && y <= fb[3]) onFace++;
  }
  const screenTop = S.CROWN_J0 * 2 + 1 + (-37 - 1 + 1) - 0; // (사용 안 함, 아래 계산이 기준)
  const yTop = -37 + 2 * minRow; // 셀 원점 화면 y = -37, 배율 2
  console.log(sc.scene, sc.step, '| 이펙트 픽셀', n, '| 줄 범위', minRow + '~' + maxRow, '→ 화면 y', yTop + '~' + (-37 + 2 * maxRow + 1), '| 가로', minX + '~' + maxX, '| 몸 겹침 px', onBody, '(눈·코어색 겹침 ' + onEye + ')', '| 얼굴 상자 겹침', onFace);
  if (nonBinary) fail('알파 0/255 아님 ' + nonBinary); if (offPal) fail('팔레트 밖 ' + offPal); if (offGrid) fail('2x2 격자 어긋남 ' + offGrid); if (yTop < 0) fail('화면 위쪽에서 잘림 y=' + yTop); if (minX < 0 || maxX > 159) fail('셀 가로 밖'); if (onEye) fail('눈·코어 색 위에 겹침'); if (onFace) fail('얼굴 상자 위에 겹침');
}
// 손 기운 자리: 일반공격 손 이펙트와 같은 중심인지 (손 영역만 비교: 장면 T05 는 x<=120,y>=60 / 나머지는 x<=60)
const bbox = (img, f) => { let a = [999, 999, -1, -1]; for (let y = 0; y < 160; y++) for (let x = 0; x < 160; x++) if (img.d[(y * 160 + x) * 4 + 3] && f(x, y)) { a = [Math.min(a[0], x), Math.min(a[1], y), Math.max(a[2], x), Math.max(a[3], y)]; } return a; };
for (const [id, f, label] of [['T05', (x, y) => x <= 120 && y >= 80, 'spark2↔aura2'], ['T09', (x, y) => x <= 60 && y >= 70, 'star↔auraBig'], ['T11', (x, y) => x <= 50 && y >= 70 && y <= 120, 'burst2↔fade1']]) {
  const sk = INFO.scenes.find(s => s.step === id); if (!sk) continue;
  const a = bbox(p.decode(path.join(OUT, sk.fx)), f), b = bbox(p.decode(path.join(S.ATK, 'CastFrames_v3_fx', 'CrystalQueen_CastFx_' + id + '.png')), f);
  const same = a.every((v, i) => v === b[i]); console.log('손 이펙트 자리', id, label, '| 일반공격', JSON.stringify(b), '| SKILL', JSON.stringify(a), same ? '→ 같은 자리·크기' : '→ 다름'); if (!same) fail('손 이펙트 자리/크기가 일반공격과 다름 ' + id);
}
// 일반공격 몸동작 재사용 확인: 캐릭터 파일은 읽기만 했고, 승인된 일반공격 셀 경로를 그대로 가리킴
for (const sc of INFO.scenes) if (!sc.character.includes('CrystalQueenAttack_VARCO/output/CastFrames_v3_cells/')) fail('일반공격 v3 셀이 아님 ' + sc.character);
console.log(bad ? '위반 ' + bad + '건' : '위반 0건');
process.exitCode = bad ? 1 : 0;
