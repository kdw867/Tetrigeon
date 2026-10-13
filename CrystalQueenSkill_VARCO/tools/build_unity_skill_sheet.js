// 수정여왕 SKILL(증식) Unity 적용용 이펙트 시트 조립 (작업 폴더 전용): 승인된 전체 프레임 v1 이펙트 셀 11장 → 시트 1장(160x160 셀 5x3 = 800x480) + 매핑 JSON.
// 시트 레이아웃·임포트 설정은 일반공격 이펙트 시트(T_CrystalQueen_AttackFx)와 같음. 만든 시트를 다시 읽어 셀 단위로 원본과 일치하는지 확인한다.
const fs = require('fs'), path = require('path');
const p = require('../../PauseUI_VARCO/tools/pix.js');
const OUT = path.join(__dirname, '..', 'output'), J = JSON.parse(fs.readFileSync(path.join(OUT, 'SkillFrames_v1_timeline.json'), 'utf8'));
const COLS = 5, ROWS = 3, C = 160, sheet = p.blank(COLS * C, ROWS * C);
const fxSteps = J.steps.filter(s => s.fx); // 이펙트가 있는 단계 (T04~T14 = 11개), 순서대로 시트 칸 0.. 에 배치
if (fxSteps.length > COLS * ROWS) throw new Error('시트 칸 부족');
const idxOf = {}; fxSteps.forEach((s, k) => { idxOf[s.step] = k; const img = p.decode(path.join(OUT, s.fx)), ox = (k % COLS) * C, oy = Math.floor(k / COLS) * C; for (let y = 0; y < C; y++) img.d.copy(sheet.d, ((oy + y) * sheet.w + ox) * 4, y * C * 4, (y + 1) * C * 4); });
const file = path.join(OUT, 'T_CrystalQueen_SkillFx.png'); p.encode(sheet, file);
// 다시 읽어 셀 단위 일치 확인
const back = p.decode(file); let bad = 0; fxSteps.forEach((s, k) => { const img = p.decode(path.join(OUT, s.fx)), ox = (k % COLS) * C, oy = Math.floor(k / COLS) * C; for (let y = 0; y < C; y++) for (let x = 0; x < C; x++) { const a = ((oy + y) * back.w + ox + x) * 4, b = (y * C + x) * 4; for (let q = 0; q < 4; q++) if (back.d[a + q] !== img.d[b + q]) { bad++; break; } } });
if (bad) throw new Error('시트 셀 불일치 ' + bad + 'px');
// 사용하지 않는 칸은 완전 투명이어야 함
let junk = 0; for (let k = fxSteps.length; k < COLS * ROWS; k++) { const ox = (k % COLS) * C, oy = Math.floor(k / COLS) * C; for (let y = 0; y < C; y++) for (let x = 0; x < C; x++) if (back.d[((oy + y) * back.w + ox + x) * 4 + 3]) junk++; } if (junk) throw new Error('빈 칸에 픽셀 ' + junk);
const map = { note: '수정여왕 SKILL(증식) Unity 적용용 매핑 (몸 = 기존 T_CrystalQueen_Attack 스프라이트 CrystalQueen_Attack_00~07 재사용, 이펙트 = 새 시트)', sheet: { file: 'T_CrystalQueen_SkillFx.png', cols: COLS, rows: ROWS, cell: [C, C], size: [sheet.w, sheet.h], used: fxSteps.length, sprite_names: 'CrystalQueenSkillFx_00~' + String(fxSteps.length - 1).padStart(2, '0') }, attack_ms: J.attack_ms, skill_trigger_reference: J.skill_trigger_reference,
  fx_keys: J.steps.map(s => ({ step: s.step, time_s: +(s.start_ms / 1000).toFixed(2), fx_sprite_index: s.step in idxOf ? idxOf[s.step] : null })) };
fs.writeFileSync(path.join(OUT, 'CrystalQueenSkill_unity_mapping.json'), JSON.stringify(map, null, 1));
console.log('시트', file, sheet.w + 'x' + sheet.h, '사용 칸', fxSteps.length, '| 셀 불일치 0 | 빈 칸 픽셀 0 | 키:', map.fx_keys.map(k => k.step + '@' + k.time_s + '→' + k.fx_sprite_index).join(' '));
