// 수정여왕 회전 잠금 SKILL 전체 프레임 (작업 폴더 전용, Unity와 무관): 승인된 일반공격 v3 셀·시간표를 그대로 쓰고, 17단계 이펙트 셀 + 투명 PNG 시트 + 시간표 JSON 을 만든다. (룬 자리 = B, 머리 위·겹침 허용, 사용자 선택 2026-10-14)
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const p = require('../../PauseUI_VARCO/tools/pix.js'), F = require('./fx_rotlock.js'), S = F.S;
if (process.env.ROTLOCK_PLACE === 'A') throw new Error('전체 프레임은 B 자리로만 만든다(ROTLOCK_PLACE 해제)');
const VER = 'v1', OUT = path.join(__dirname, '..', 'output'), FXD = path.join(OUT, 'RotLockFrames_' + VER + '_fx');
const ROLE = {
  T00: '기본 자세 (변화 없음)', T01: '손 모으기 중간 1 (뒤로 2도, 이펙트 없음)', T02: '손 모으기 중간 2 (뒤로 4도, 이펙트 없음)', T03: '손 모음 (뒤로 5도, 이펙트 없음)',
  T04: '손 기운 시작(푸른 보라, 작음) + 머리 위 룬 자리에 작은 빛', T05: '손 기운 + 룬 자리 빛이 조금 커짐', T06: '손 기운 + 회전 룬이 바둑판 솎음으로 드러남(회전 시작)', T07: '손 기운 + 회전 룬 선명(-86도)',
  T08: '팔 뻗기 중간(앞으로 5도) + 회전 룬(-61도) + 열린 자물쇠 흐릿하게 나타남', T09: '팔 뻗기(앞으로 15도) + 큰 손 기운 + 회전 룬(-36도) + 열린 자물쇠', T10: '큰 손 기운 + 회전 룬(-11도) + 자물쇠 고리가 내려옴(거의 닫힘)',
  T11: '잠금 완료: 자물쇠 닫힘 + 룬 0도로 정지 + 고리 밝아짐 + 십자 섬광 + 손 기운 밝아짐 (스킬 발동 기준 시점, 제안)', T12: '잠긴 형태 유지 + 작은 십자 + 손 기운 약해짐', T13: '잠긴 형태 유지 + 손 기운 거의 꺼짐', T14: '잠긴 형태가 바둑판으로 흐려지며 소멸',
  T15: '팔 내리기 1 (앞으로 8도, 이펙트 없음)', T16: '팔 내리기 2 (앞으로 3도, 이펙트 없음)'
};
fs.mkdirSync(FXD, { recursive: true });
let t0 = 0; const steps = [], cells = [];
for (const s of S.J.steps) {
  const f = F.buildFx(s.step); let fxFile = null, rc = null;
  if (f) { fxFile = 'RotLockFrames_' + VER + '_fx/CrystalQueenRotLock_Fx_' + s.step + '.png'; p.encode(f, path.join(OUT, fxFile)); rc = F.RC.slice(); cells.push({ step: s.step, file: fxFile }); }
  steps.push({ step: s.step, start_ms: t0, ms: s.ms, lean_deg: s.lean_deg, character: path.relative(OUT, path.join(S.ATK, s.character)).replace(/\\/g, '/'), fx: fxFile, rune_center_block: f && s.step >= 'T06' ? rc : null, role: ROLE[s.step] });
  t0 += s.ms;
}
// 투명 PNG 시트: 800x480 = 160x160 셀 5열 x 3줄, T04~T14 를 앞에서부터 채움(11칸, 나머지 투명). 한 줄씩 복사(자동 크롭·중앙 정렬 없음)
const COLS = 5, sheet = p.blank(COLS * 160, 3 * 160), map = [];
cells.forEach((c, k) => { const img = p.decode(path.join(OUT, c.file)), ox = (k % COLS) * 160, oy = Math.floor(k / COLS) * 160; for (let y = 0; y < 160; y++) img.d.copy(sheet.d, ((oy + y) * sheet.w + ox) * 4, y * 160 * 4, (y + 1) * 160 * 4); map.push({ index: k, step: c.step, rect_px_from_top_left: [ox, oy, 160, 160], unity_sprite_hint: 'CrystalQueenRotLockFx_' + String(k).padStart(2, '0') }); });
p.encode(sheet, path.join(OUT, 'CrystalQueenRotLock_FxSheet_' + VER + '.png'));
const trig = steps.find(s => s.step === 'T11'), md5 = (f) => crypto.createHash('md5').update(fs.readFileSync(f)).digest('hex');
const solid = ['T11', 'T12', 'T13'].reduce((a, id) => a + steps.find(s => s.step === id).ms, 0);
const J = {
  note: '수정여왕 회전 잠금 SKILL 전체 프레임 v1 (미리보기용, Unity 미적용). 캐릭터 = 일반공격 v3 셀 재사용(수정 없음), 이펙트 = 새 투명 PNG 레이어(캐릭터 앞 한 층). 모든 셀 160x160, 같은 좌표·피벗, 크롭·중앙 정렬 없음. 룬 자리 = B(머리 위, 몸과 겹침 허용, 사용자 선택).',
  cell: [160, 160], pivot_unity: [0.5, 0.45], pivot_cell_px_from_top_left: [80, 88], ppu: 75.6, flipX: 0, attack_ms: t0, rest_between_attacks_ms: S.J.rest_between_attacks_ms,
  frame_timing: '가변 시간표(10ms 배수, 고정 FPS 아님). 일반공격·증식 SKILL 의 17단계·940ms 와 같음. 키 시각 = start_ms.',
  steps_total: steps.length, fx_unique_cells: cells.length, fx_empty_steps: steps.filter(s => !s.fx).map(s => s.step),
  playback: '두 층을 같은 시간표로 동시에 바꿔 재생: 몸 스프라이트(승인된 일반공격 8셀) + 이펙트 스프라이트(캐릭터 앞 한 층, 빈 단계는 스프라이트 없음). 일반공격·증식과 같은 구조(Idle 애니메이터의 별도 상태 + 몸 곡선 + 자식 이펙트 곡선)로 Unity 에 연결 가능(미연결).',
  lock_complete_reference: { step: 'T11', start_ms: trig.start_ms, meaning: '자물쇠가 닫히고 룬 회전이 멈추는 순간 = 향후 스킬 발동(잠금 부여) 기준 시점(제안, 현재 전투 처리 시점은 변경하지 않음)', clear_lock_visible_ms: solid + '(T11~T13) + 흐려짐 ' + steps.find(s => s.step === 'T14').ms + '(T14)' },
  rune: { ring_center_row_block: 19, ring_radius_blocks: F.RR, size_dots: '15x17 (30x34 px)', centers_by_step: Object.fromEntries(steps.filter(s => s.rune_center_block).map(s => [s.step, s.rune_center_block])), rotation_deg: F.RHO, rotation_note: '약 0.42도/ms 로 돌다가 T11 에서 0도로 딱 멈춤(총 111도, 두 호가 같은 모양이라 180도 대칭). 룬 중심은 단계별 머리 맨 위 열을 따라감(몸 셀에서 측정: 뒤로 기울면 49, 중간 41, 앞으로 15도 34), 줄 19(화면에 보이는 맨 위 쪽) 고정.' },
  lock: { states: 'open(T08 흐림, T09) → near(T10) → closed(T11~T13, T14 흐림)', size_dots: '7x7 닫힘 / 7x8 열림·거의 닫힘 (윤곽 포함)', icon_ui_7x9: 'output/CrystalQueenRotLock_LockIcon_v1_ui_7x9_native.png' },
  hand_effect_blocks: { clasp: S.HA, reach_mid: S.HR1, reach: S.HB },
  reuse: { character_cells: 'CrystalQueenAttack_VARCO/output/CastFrames_v3_cells/', timeline: 'CrystalQueenAttack_VARCO/output/CastFrames_v3_timeline.json', normal_fx_for_comparison_only: 'CrystalQueenAttack_VARCO/output/CastFrames_v3_fx/', growth_fx_for_comparison_only: 'CrystalQueenSkill_VARCO/output/SkillFrames_v1_fx/' },
  sheet: { file: 'CrystalQueenRotLock_FxSheet_' + VER + '.png', size: [sheet.w, sheet.h], cell: [160, 160], columns: COLS, used_cells: cells.length, order: 'T04~T14 (왼쪽 위부터 가로로)', md5: md5(path.join(OUT, 'CrystalQueenRotLock_FxSheet_' + VER + '.png')), map },
  steps
};
fs.writeFileSync(path.join(OUT, 'RotLockFrames_' + VER + '_timeline.json'), JSON.stringify(J, null, 1));
console.log('이펙트 셀', cells.length, '장 / 빈 단계', J.fx_empty_steps.join(','), '/ 총', t0, 'ms / 잠금 완료 기준', trig.start_ms, 'ms / 시트', sheet.w + 'x' + sheet.h);
