// 수정여왕 SKILL 전체 프레임 (작업 폴더 전용, Unity와 무관): 승인된 핵심 장면 4개와 같은 도안·위치로 17단계 이펙트 셀과 시간표를 만든다.
// 캐릭터 = 승인된 일반공격 v3 셀 그대로(수정 없음), 시간·몸동작 = 일반공격 시간표 그대로. 이펙트 셀은 캐릭터와 같은 160x160 좌표·피벗 (0.5,0.45).
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const p = require('../../PauseUI_VARCO/tools/pix.js'), S = require('./skill_frames.js');
const VER = 'v1', OUT = S.OUT, FXD = path.join(OUT, 'SkillFrames_' + VER + '_fx');
const ROLE = {
  T00: '기본 자세 (변화 없음)', T01: '손 모으기 중간 1 (뒤로 2도, 이펙트 없음)', T02: '손 모으기 중간 2 (뒤로 4도, 이펙트 없음)', T03: '손 모음 (뒤로 5도, 이펙트 없음)',
  T04: '손 기운 시작(금 테두리 보라, 작음) + 작은 빛(왕관 자리)', T05: '손 기운 + 공중 왕관 절반 드러남', T06: '손 기운 + 공중 왕관 4분의 3', T07: '손 기운 + 공중 왕관 완성 (유지 시작)',
  T08: '왕관 유지 + 팔 뻗기 중간(앞으로 5도), 손 기운 작은 별', T09: '왕관 유지 + 팔 뻗기(앞으로 15도), 손 기운 큰 별', T10: '왕관 한 단계 밝아짐 + 반짝임 (터지기 직전)',
  T11: '왕관 파열: 다섯 조각으로 갈라짐 + 섬광 + 첫 파동 (스킬 발동 기준 시점, 제안)', T12: '조각 흩어짐 + 파동 확산 + 손 기운 거의 꺼짐', T13: '조각·파동 성김', T14: '마지막 어두운 점',
  T15: '팔 내리기 1 (앞으로 8도, 이펙트 없음)', T16: '팔 내리기 2 (앞으로 3도, 이펙트 없음)'
};
fs.mkdirSync(FXD, { recursive: true });
let t0 = 0; const steps = []; const md5 = (f) => crypto.createHash('md5').update(fs.readFileSync(f)).digest('hex');
for (const s of S.J.steps) {
  const f = S.buildFx(s.step); let fxFile = null;
  if (f) { fxFile = 'SkillFrames_' + VER + '_fx/CrystalQueenSkill_Fx_' + s.step + '.png'; p.encode(f, path.join(OUT, fxFile)); }
  steps.push({ step: s.step, start_ms: t0, ms: s.ms, lean_deg: s.lean_deg, character: path.relative(OUT, path.join(S.ATK, s.character)).replace(/\\/g, '/'), fx: fxFile, role: ROLE[s.step] });
  t0 += s.ms;
}
// 승인된 핵심 장면 4개(SkillScenes_v2)와 바이트까지 같은지 확인
const same = ['T05', 'T09', 'T11', 'T14'].map(id => { const a = path.join(OUT, 'SkillFrames_' + VER + '_fx', 'CrystalQueenSkill_Fx_' + id + '.png'), b = path.join(OUT, 'SkillScenes_v2_fx', 'CrystalQueenSkill_Fx_' + id + '.png'); return id + ':' + (md5(a) === md5(b)); });
const trig = steps.find(s => s.step === 'T11');
const J = {
  note: '수정여왕 SKILL 전체 프레임 v1 (미리보기용, Unity 미적용). 캐릭터 = 일반공격 v3 셀 재사용(수정 없음), 이펙트 = 새 투명 PNG 레이어(캐릭터 앞 한 층). 모든 셀 160x160, 같은 좌표·피벗, 크롭·중앙 정렬 없음.',
  cell: [160, 160], pivot_unity: [0.5, 0.45], pivot_cell_px_from_top_left: [80, 88], ppu: 75.6, flipX: 0, attack_ms: t0, rest_between_attacks_ms: S.J.rest_between_attacks_ms,
  frame_timing: '가변 시간표(10ms 배수, 고정 FPS 아님). 일반공격 17단계·940ms 와 같음. 키 시각 = start_ms.',
  fx_unique_cells: steps.filter(s => s.fx).length, fx_empty_steps: steps.filter(s => !s.fx).map(s => s.step),
  playback: '두 층을 같은 시간표로 동시에 바꿔 재생: 몸 스프라이트(승인된 일반공격 8셀) + 이펙트 스프라이트(캐릭터 앞 한 층, 빈 단계는 스프라이트 없음). Unity 적용 시에는 일반공격과 같은 구조(Idle 애니메이터의 별도 상태 + 자식 이펙트 SpriteRenderer)로 연결 예정(미적용).',
  skill_trigger_reference: { step: 'T11', start_ms: trig.start_ms, meaning: '왕관이 파열하는 순간 = 향후 스킬 발동 기준 시점(제안, 현재 전투 처리 시점은 변경하지 않음)' },
  crown: { size_dots: [S.CW, S.CH], size_px: [2 * S.CW, 2 * S.CH], top_cell_row_px: 2 * S.CROWN_J0 + 1, center_block_x: S.crownC(), complete_visible_ms: '380~570 (+ 밝아짐 570~620)' },
  hand_effect_blocks: { clasp: S.HA, reach_mid: S.HR1, reach: S.HB },
  reuse: { character_cells: 'CrystalQueenAttack_VARCO/output/CastFrames_v3_cells/', timeline: 'CrystalQueenAttack_VARCO/output/CastFrames_v3_timeline.json', normal_fx_for_comparison_only: 'CrystalQueenAttack_VARCO/output/CastFrames_v3_fx/' },
  matches_key_scenes_v2_byte_for_byte: same, steps
};
fs.writeFileSync(path.join(OUT, 'SkillFrames_' + VER + '_timeline.json'), JSON.stringify(J, null, 1));
console.log('이펙트 셀', J.fx_unique_cells, '장 / 빈 단계', J.fx_empty_steps.join(','), '/ 총', t0, 'ms / 발동 기준', trig.start_ms, 'ms / 핵심 장면과 같은 파일:', same.join(' '));
