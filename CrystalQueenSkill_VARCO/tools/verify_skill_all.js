// 수정여왕 SKILL 전체 프레임 검증 (작업 폴더 전용): 저장한 시간표·PNG 를 다시 읽어 17단계 전부 확인한다.
const fs = require('fs'), path = require('path');
const p = require('../../PauseUI_VARCO/tools/pix.js'), FX = require('./fx_skill.js'), S = require('./skill_frames.js');
const OUT = S.OUT, J = JSON.parse(fs.readFileSync(path.join(OUT, 'SkillFrames_v1_timeline.json'), 'utf8')), N = S.J; // N = 승인된 일반공격 시간표
const pal = new Set(Object.values(FX.PAL).map(c => c.join(',')));
let bad = 0; const fail = (m) => { bad++; console.log('  ✗', m); };
const dec = (f) => p.decode(path.join(OUT, f)), px = (img, x, y) => img.d[(y * 160 + x) * 4 + 3] > 0;
const bbox = (img, f) => { let a = [999, 999, -1, -1]; for (let y = 0; y < 160; y++) for (let x = 0; x < 160; x++) if (px(img, x, y) && f(x, y)) a = [Math.min(a[0], x), Math.min(a[1], y), Math.max(a[2], x), Math.max(a[3], y)]; return a; };
const expectCell = (build) => { const c = FX.blank(); build(c); return c; };
const crownAt = (c, art) => FX.place(c, art, S.crownC() - (S.CW >> 1), S.CROWN_J0);
const CRY = { crown: ['T07', 'T08', 'T09'] };
const rows = [];
// 1) 시간표: 일반공격과 17단계·시작·길이·몸 파일이 같은가
if (J.steps.length !== N.steps.length) fail('단계 수 불일치'); J.steps.forEach((s, i) => { const n = N.steps[i]; if (s.step !== n.step || s.ms !== n.ms || s.start_ms !== n.start_ms || s.lean_deg !== n.lean_deg || !s.character.endsWith(n.character)) fail('시간표/몸동작이 일반공격과 다름 ' + s.step); });
if (J.attack_ms !== N.attack_ms) fail('총 길이 불일치 ' + J.attack_ms + ' vs ' + N.attack_ms);
// 2) 단계별 이펙트
for (const s of J.steps) {
  const ch = dec(s.character), fx = s.fx ? dec(s.fx) : null, st = N.steps.find(x => x.step === s.step), face = st.mark_shift_px ? st.mark_shift_px.face : [0, 0], fb = [75 + face[0], 63 + face[1], 84 + face[0], 70 + face[1]];
  const cs = st.mark_shift_px ? st.mark_shift_px.core : [0, 0], cb = [76 + cs[0], 86 + cs[1], 81 + cs[0], 90 + cs[1]]; // 이동한 코어 상자
  let n = 0, nonBin = 0, offPal = 0, offGrid = 0, minRow = 999, minX = 999, maxX = -1, maxRow = -1, body = 0, eye = 0, onFace = 0, hl = 0;
  if (fx) for (let y = 0; y < 160; y++) for (let x = 0; x < 160; x++) {
    const o = (y * 160 + x) * 4, a = fx.d[o + 3]; if (!a) continue; n++; if (a !== 255) nonBin++;
    if (!pal.has(fx.d[o] + ',' + fx.d[o + 1] + ',' + fx.d[o + 2])) offPal++;
    const bx = ((x - 1) >> 1) * 2 + 1, by = ((y - 1) >> 1) * 2 + 1; for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { const q = ((by + dy) * 160 + bx + dx) * 4; if (x < 1 || y < 1 || fx.d[q + 3] !== 255 || fx.d[q] !== fx.d[o] || fx.d[q + 1] !== fx.d[o + 1] || fx.d[q + 2] !== fx.d[o + 2]) { offGrid++; break; } }
    minRow = Math.min(minRow, y); maxRow = Math.max(maxRow, y); minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    if (ch.d[o + 3]) { body++; const cc = ch.d[o] + ',' + ch.d[o + 1] + ',' + ch.d[o + 2]; if (cc === '51,229,239' || (cc === '188,199,245' && x >= cb[0] && x <= cb[2] && y >= cb[1] && y <= cb[3])) eye++; else if (cc === '188,199,245') hl++; }
    if (x >= fb[0] && x <= fb[2] && y >= fb[1] && y <= fb[3]) onFace++;
  }
  const top = fx ? -37 + 2 * minRow : null;
  if (nonBin) fail(s.step + ' 알파 0/255 아님'); if (offPal) fail(s.step + ' 팔레트 밖 ' + offPal); if (offGrid) fail(s.step + ' 2x2 격자 어긋남 ' + offGrid); if (fx && top < 0) fail(s.step + ' 화면 위쪽에서 잘림'); if (fx && (minX < 0 || maxX > 159)) fail(s.step + ' 셀 가로 밖');
  if (eye) fail(s.step + ' 눈·코어색 위에 겹침 ' + eye); if (onFace) fail(s.step + ' 얼굴 상자 위에 겹침 ' + onFace);
  // 수정 투사체(일반공격 수정 = 9x5 블록, 약 180px) 크기의 덩어리가 일반공격 수정이 생기던 오른쪽(x>=124) / 날아가던 왼쪽 아래(x<60,y>=109) 구역에 있으면 위반 (연결 면적 16px 이상)
  if (fx) { const seen = new Uint8Array(25600); for (let i = 0; i < 25600; i++) { if (seen[i] || !fx.d[i * 4 + 3]) continue; const st2 = [i]; seen[i] = 1; let area = 0, a = 999, b = -1, c = 999; while (st2.length) { const q = st2.pop(), qx = q % 160, qy = (q / 160) | 0; area++; a = Math.min(a, qx); b = Math.max(b, qx); c = Math.min(c, qy); for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = qx + dx, Y = qy + dy; if (X < 0 || Y < 0 || X > 159 || Y > 159) continue; const r = Y * 160 + X; if (!seen[r] && fx.d[r * 4 + 3]) { seen[r] = 1; st2.push(r); } } } if (area >= 16 && (a >= 124 || (b < 60 && c >= 109))) fail(s.step + ' 수정 투사체 구역에 큰 덩어리 ' + area + 'px'); } }
  rows.push([s.step, s.start_ms, s.ms, fx ? n : 0, fx ? minRow + '~' + maxRow : '-', fx ? '화면y ' + top : '-', fx ? minX + '~' + maxX : '-', fx ? body : 0, eye, onFace, hl]);
}
console.log('단계 시작ms 길이 FX픽셀 줄 화면 가로 몸겹침px 눈·코어 얼굴 (수정 하이라이트 겹침px)'); rows.forEach(r => console.log(r.join('  ')));
// 3) 이펙트가 없어야 하는 단계 / 있어야 하는 단계
for (const id of ['T00', 'T01', 'T02', 'T03', 'T15', 'T16']) if (J.steps.find(s => s.step === id).fx) fail(id + ' 은 이펙트가 비어 있어야 함');
for (let k = 4; k <= 14; k++) { const id = 'T' + String(k).padStart(2, '0'); if (!J.steps.find(s => s.step === id).fx) fail(id + ' 이펙트 없음'); }
// 4) 왕관: 완성 프레임 T07~T09 = 도안 그대로, T10 = 밝은 도안 + 반짝임, T05·T06 = 솎은 도안 (왕관 영역 픽셀 일치)
const inCrown = (x, y) => y >= 2 * S.CROWN_J0 + 1 && y <= 2 * (S.CROWN_J0 + S.CH) && x >= 2 * (S.crownC() - (S.CW >> 1)) + 1 && x <= 2 * (S.crownC() + (S.CW >> 1) + 1);
const cmpCrown = (id, art, label) => { const f = dec(J.steps.find(s => s.step === id).fx), e = expectCell((c) => crownAt(c, art)); let diff = 0; for (let y = 0; y < 160; y++) for (let x = 0; x < 160; x++) if (inCrown(x, y)) { const o = (y * 160 + x) * 4; for (let k = 0; k < 4; k++) if (f.d[o + k] !== e.d[o + k]) { diff++; break; } } if (diff) fail(id + ' 왕관 영역이 ' + label + ' 도안과 다름 ' + diff + 'px'); else console.log('왕관', id, '=', label, '도안 그대로 (영역 불일치 0)'); };
for (const id of ['T07', 'T08', 'T09']) cmpCrown(id, 'crown', '완성'); cmpCrown('T05', 'crownHalf', '절반'); cmpCrown('T06', 'crownMost', '4분의 3'); { // T10 은 반짝임이 왕관 상자 밖(좌우)에만 추가되므로 상자 안 비교
  const f = dec(J.steps.find(s => s.step === 'T10').fx), e = expectCell((c) => crownAt(c, 'crownBright')); let diff = 0; for (let y = 0; y < 160; y++) for (let x = 0; x < 160; x++) if (inCrown(x, y)) { const o = (y * 160 + x) * 4; for (let k = 0; k < 4; k++) if (f.d[o + k] !== e.d[o + k]) { diff++; break; } } if (diff) fail('T10 왕관 밝은 도안 불일치 ' + diff); else console.log('왕관 T10 = 한 단계 밝은 도안 그대로'); }
// 5) 손 기운: 일반공격 손 이펙트와 같은 자리·크기 (손 구역만 비교)
const hand = (id) => id === 'T04' || id === 'T05' || id === 'T06' || id === 'T07' ? (x, y) => x <= 120 && y >= 80 : (x, y) => x <= 60 && y >= 70 && y <= 120;
for (const id of ['T04', 'T05', 'T06', 'T07', 'T08', 'T09', 'T10', 'T11']) { const a = bbox(dec(J.steps.find(s => s.step === id).fx), hand(id)), nf = path.join(S.ATK, 'CastFrames_v3_fx', 'CrystalQueen_CastFx_' + id + '.png'), b = bbox(p.decode(nf), hand(id)); if (!a.every((v, i) => v === b[i])) fail(id + ' 손 기운 자리/크기가 일반공격과 다름 ' + JSON.stringify(a) + ' vs ' + JSON.stringify(b)); else console.log('손 기운', id, JSON.stringify(a), '= 일반공격과 같은 자리·크기'); }
// 6) 왕관 파열 후 소멸: T11 이후 도트 수 감소, T15·T16 비어 있음
const cnt = (id) => { const s = J.steps.find(x => x.step === id); return s.fx ? dec(s.fx).d.filter((v, i) => i % 4 === 3 && v).length / 4 : 0; };
const seq = ['T11', 'T12', 'T13', 'T14', 'T15', 'T16'].map(id => id + ':' + cnt(id)); console.log('파열 이후 이펙트 도트 수(1도트=2x2px)', seq.join(' '));
if (!(cnt('T12') < cnt('T11') || cnt('T13') < cnt('T12')) || !(cnt('T14') < cnt('T13')) || cnt('T15') || cnt('T16')) fail('파열 이후 이펙트가 줄어들지 않거나 끝에 남음');
// 7) 시간: 왕관 완성이 보이는 길이, 발동 기준
const vis = J.steps.filter(s => ['T07', 'T08', 'T09'].includes(s.step)).reduce((a, s) => a + s.ms, 0) + J.steps.find(s => s.step === 'T10').ms;
console.log('완성 왕관 유지', J.steps.filter(s => ['T07', 'T08', 'T09'].includes(s.step)).reduce((a, s) => a + s.ms, 0) + 'ms (T07~T09), 밝아짐 포함', vis + 'ms, 파열 시작', J.skill_trigger_reference.start_ms + 'ms');
if (vis > 250 || vis < 150) fail('완성 왕관 유지 시간이 0.15~0.25초 밖 ' + vis);
// 8) 일반공격 파일 비변경: 캐릭터 셀 파일을 가리키고, 쓰기는 이번 폴더 밖에 하지 않음 (경로 확인)
J.steps.forEach(s => { if (!s.character.startsWith('../../CrystalQueenAttack_VARCO/output/CastFrames_v3_cells/')) fail('캐릭터 경로 이상 ' + s.character); });
console.log(bad ? '위반 ' + bad + '건' : '위반 0건'); process.exitCode = bad ? 1 : 0;
