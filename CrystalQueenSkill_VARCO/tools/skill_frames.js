// 수정여왕 SKILL 이펙트 프레임 (작업 폴더 전용, Unity와 무관): 승인된 일반공격 캐릭터 셀을 그대로 재사용하고, 이펙트 층(손 기운·공중 왕관·파열)만 새로 만든다.
// 캐릭터 몸동작·시간표·기울기는 일반공격 타임라인 JSON 을 읽어 그대로 따른다(변경 없음). 이펙트 셀은 캐릭터와 같은 160x160 좌표·피벗 (0.5,0.45).
const fs = require('fs'), path = require('path');
const p = require('../../PauseUI_VARCO/tools/pix.js'), FX = require('./fx_skill.js');
const ATK = path.join(__dirname, '..', '..', 'CrystalQueenAttack_VARCO', 'output'), OUT = path.join(__dirname, '..', 'output');
const J = JSON.parse(fs.readFileSync(path.join(ATK, 'CastFrames_v3_timeline.json'), 'utf8')); // 승인된 일반공격 시간표 (읽기 전용)
const VER = 'v2', D = (n) => path.join(OUT, 'SkillScenes_' + VER + '_' + n);
const e2 = (v) => 2 * Math.round(v / 2);
const step = (id) => J.steps.find(s => s.step === id);
// 손 기운 중심 블록: 일반공격과 같은 식 (기울이기 전 손 위치 + 팔 이동량/2)
const arm = (id) => step(id).arm_shift_px.map(v => v / 2);
const HA = [41 + arm('T04')[0], 50 + arm('T04')[1]], HR1 = [24 + arm('T08')[0], 47 + arm('T08')[1]], HB = [15 + arm('T09')[0], 46 + arm('T09')[1]];
// 왕관 자리: 화면에 보이는 첫 셀 줄이 19(블록 9)라 왕관 맨 위를 블록 9 에 붙임(화면 y 1). 가로는 머리 이동량의 절반만 따라감
const CROWN_J0 = 9, CW = 21, CH = 11, CJ = CROWN_J0 + (CH >> 1); // 왕관 위 블록 / 폭 / 높이(블록) / 중심 블록 줄
const CROWN_C = 36; // 왕관 가로 위치(블록) 고정: 머리를 따라가면 수정 끝과 겹침이 15~18%, 고정하면 뒤로 기울인 자세 4도트·앞으로 뻗은 자세 20도트(overlap_probe.js)
const crownC = () => CROWN_C;
// 파편 위치표: 왕관 중심 기준 왼쪽 위 블록 오프셋 [dx,dy,도안], 파열 후 1~4번째 단계(T11~T14). 위쪽은 화면 한계(블록 9)까지
const SHARDS = [
  [null, [-16, 3, 'goldChip'], [-22, 5, 'dotG'], null],
  [null, [15, 3, 'goldChip'], [21, 5, 'dotG'], null],
  [[-4, 4, 'pearl'], [-9, 8, 'pearl'], [-13, 11, 'dotg'], null],
  [[4, 4, 'pearl'], [9, 8, 'pearl'], [13, 11, 'dotg'], null],
  [[0, 4, 'gemChip'], [0, 9, 'gemChip'], null, null]
];
// 왕관 쪼개기: 가장 가까운 뾰족 기준으로 5조각(왼쪽 바깥 / 왼쪽 안 / 가운데 / 오른쪽 안 / 오른쪽 바깥), 조각별 이동량(블록)과 남기는 도트 비율은 단계(k=1~3)별
const SEG = (x) => x <= 4 ? 0 : x <= 8 ? 1 : x <= 11 ? 2 : x <= 15 ? 3 : 4;
const SHAT = [
  { off: [[-5, 1], [-3, 2], [0, 1], [3, 2], [5, 1]], keep: () => true }, // T11: 막 갈라짐 (온전한 조각)
  { off: [[-12, 4], [-7, 6], [0, 5], [7, 6], [12, 4]], keep: (i, j) => (i + j) % 2 === 0 }, // T12: 흩어짐 (절반)
  { off: [[-18, 8], [-11, 10], [0, 8], [11, 10], [18, 8]], keep: (i, j) => (i + j) % 4 === 0 }, // T13: 거의 사라짐 (4분의 1)
  { off: [[-21, 11], [-14, 13], [0, 11], [14, 13], [21, 11]], keep: (i, j) => (i + 2 * j) % 8 === 0, dim: true } // T14: 아주 성긴 어두운 점
];
function shatter(cell, c, k) {
  const sh = SHAT[k - 1]; FX.ART.crown.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === '.' || !sh.keep(i, j)) return; const [dx, dy] = sh.off[SEG(i)]; FX.dot(cell, c - (CW >> 1) + i + dx, CROWN_J0 + j + dy, sh.dim ? ('GYgH'.includes(ch) ? 'g' : 'D') : ch); }));
}
const RING = [[7, 3, 'B', 'G', 1], [12, 5, 'P', 'G', 1], [18, 7, 'P', 'g', 2], [22, 8, 'D', 'g', 3]]; // 고리 중심은 왕관 중심보다 3블록 아래(RING_DY), 맨 위가 블록 9 를 넘지 않게 세로 반지름을 제한
const RING_DY = 3; // [가로 반지름, 세로 반지름, 호 색, 끝 색, 점선 간격]
function burstLayers(c, k) { // k = 1..4 (T11~T14): 파동 고리 + 파편 (+ 첫 단계는 섬광)
  const cell = FX.blank(); const [rx, ry, ca, ce, st] = RING[k - 1]; FX.ring(cell, c, CJ + RING_DY, rx, ry, ca, ce, st);
  shatter(cell, c, k); // 왕관이 다섯 조각으로 쪼개져 흩어짐
  if (k === 1) FX.placeC(cell, 'flash', c, CJ);
  for (const s of SHARDS) { const q = s[k - 1]; if (q) FX.place(cell, q[2], c + q[0], CJ + q[1]); }
  return cell;
}
// 단계별 이펙트 (일반공격과 같은 17단계·같은 ms). 반환 null = 이펙트 층 비어 있음
function buildFx(id) {
  const cell = FX.blank(), c = crownC(id), put = (art) => FX.place(cell, art, c - (CW >> 1), CROWN_J0);
  switch (id) {
    case 'T04': FX.placeC(cell, 'aura1', ...HA); FX.placeC(cell, 'seed', c, CJ); break; // 손 기운 시작 + 작은 빛
    case 'T05': FX.placeC(cell, 'aura2', ...HA); put('crownHalf'); break; // 왕관이 절반쯤 드러남
    case 'T06': FX.placeC(cell, 'aura2', ...HA); put('crownMost'); break; // 거의 선명
    case 'T07': FX.placeC(cell, 'aura2', ...HA); put('crown'); break; // 완성
    case 'T08': FX.placeC(cell, 'auraS', ...HR1); put('crown'); break;
    case 'T09': FX.placeC(cell, 'auraBig', ...HB); put('crown'); break;
    case 'T10': FX.placeC(cell, 'auraBig', ...HB); put('crownBright'); FX.placeC(cell, 'glint', c - 13, CJ - 1); FX.placeC(cell, 'glint', c + 13, CJ + 1); break; // 터지기 직전 밝아짐 + 반짝임
    case 'T11': { const b = burstLayers(c, 1); FX.placeC(b, 'fade1', ...HB); return b; } // 왕관 파열 (스킬 발동 기준 시점)
    case 'T12': { const b = burstLayers(c, 2); FX.placeC(b, 'fade2', ...HB); return b; }
    case 'T13': return burstLayers(c, 3);
    case 'T14': return burstLayers(c, 4);
    default: return null; // T00~T03(기운 없음), T15·T16(모두 사라짐)
  }
  return cell;
}
module.exports = { J, step, HA, HR1, HB, crownC, buildFx, CROWN_J0, CJ, CW, CH, VER, D, OUT, ATK };
if (require.main === module) {
  const KEY = [['T05', '1_hand-aura'], ['T09', '2_crown-complete'], ['T11', '3_crown-burst'], ['T14', '4_fade-out']];
  fs.mkdirSync(D('fx'), { recursive: true });
  const info = KEY.map(([id, name]) => { const s = step(id), f = buildFx(id), file = 'SkillScenes_' + VER + '_fx/CrystalQueenSkill_Fx_' + id + '.png'; p.encode(f, path.join(OUT, file)); return { scene: name, step: id, start_ms: s.start_ms, ms: s.ms, character: path.relative(OUT, path.join(ATK, s.character)).replace(/\\/g, '/'), lean_deg: s.lean_deg, fx: file, crown_center_block: crownC(id) }; });
  fs.writeFileSync(path.join(OUT, 'SkillScenes_' + VER + '_build_info.json'), JSON.stringify({ note: '수정여왕 SKILL 핵심 장면 4개 (미리보기 전용, Unity 미적용). 캐릭터는 승인된 일반공격 v3 셀 재사용(수정 없음).', cell: [160, 160], pivot_unity: [0.5, 0.45], hand_blocks: { HA, HR1, HB }, crown: { w_blocks: CW, h_blocks: CH, top_block: CROWN_J0, rows_px: [2 * CROWN_J0 + 1, 2 * (CROWN_J0 + CH)] }, scenes: info }, null, 1));
  console.log('핵심 장면 이펙트', info.map(i => i.step + '(' + i.start_ms + 'ms) 왕관중심블록 ' + i.crown_center_block).join(' | '), '| 손 중심 블록', JSON.stringify({ HA, HR1, HB }));
}
