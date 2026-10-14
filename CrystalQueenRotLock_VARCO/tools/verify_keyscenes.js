// 회전 잠금 핵심 장면 검증 (작업 폴더 전용): 저장한 PNG 를 다시 읽어 규칙 위반을 센다. 위반 0 이어야 통과.
const fs = require('fs'), path = require('path'), L = require('./lib_view.js'), { p, F, S, OUT } = L;
const PALSET = new Set(Object.values(F.PAL).map(c => c.join(',')));
let bad = 0; const fail = (m) => { bad++; console.log('위반:', m); };
const info = JSON.parse(fs.readFileSync(path.join(OUT, 'RotLockScenes_v1_build_info.json'), 'utf8'));
// 몸 8장 실루엣 합집합 (블록)
const bodies = Object.values(S.J.character_cells).map(n => p.decode(path.join(S.ATK, 'CastFrames_v3_cells', 'CrystalQueen_CastFrame_' + n + '.png')));
const U = new Set(); bodies.forEach(c => { for (let j = 0; j < 80; j++) for (let i = 0; i < 80; i++) { let o = 0; for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) if (c.d[((2 * j + 1 + y) * 160 + 2 * i + 1 + x) * 4 + 3]) o = 1; if (o) U.add(i + ',' + j); } });
// 1) 핵심 장면 4개: 저장 파일 검사
for (const sc of info.scenes) {
  const c = p.decode(path.join(OUT, sc.fx)); let n = 0, minY = 999, maxY = -1, minX = 999, maxX = -1;
  for (let y = 0; y < 160; y++) for (let x = 0; x < 160; x++) { const o = (y * 160 + x) * 4, a = c.d[o + 3]; if (a !== 0 && a !== 255) fail(sc.step + ' 알파 ' + a); if (!a) continue; n++; minY = Math.min(minY, y); maxY = Math.max(maxY, y); minX = Math.min(minX, x); maxX = Math.max(maxX, x); if (!PALSET.has(c.d[o] + ',' + c.d[o + 1] + ',' + c.d[o + 2])) fail(sc.step + ' 팔레트 밖 ' + x + ',' + y); }
  // 2x2 격자: 블록 (1,1) 위상, 블록 안 네 픽셀이 같은 값
  for (let j = 0; j < 79; j++) for (let i = 0; i < 79; i++) { const v = [0, 1, 2, 3].map(k => { const o = ((2 * j + 1 + (k >> 1)) * 160 + 2 * i + 1 + (k & 1)) * 4; return c.d[o + 3] + ',' + c.d[o] + ',' + c.d[o + 1] + ',' + c.d[o + 2]; }); if (new Set(v).size > 1) fail(sc.step + ' 격자 어긋남 블록 ' + i + ',' + j); }
  for (let k = 0; k < 160; k++) for (const [x, y] of [[0, k], [159, k], [k, 0], [k, 159]]) if (c.d[(y * 160 + x) * 4 + 3]) fail(sc.step + ' 셀 가장자리 픽셀 ' + x + ',' + y);
  if (minY < 19) fail(sc.step + ' 화면 위쪽(셀 줄 19 미만) 잘림 ' + minY);
  if (maxX > 155) fail(sc.step + ' 화면 오른쪽(셀 x 155 초과) 잘림 ' + maxX);
  console.log(sc.step, '픽셀', n, '| 셀 x', minX + '~' + maxX, 'y', minY + '~' + maxY, '(화면 y 맨 위 ' + (L.SY + 2 * minY) + ')');
}
// 2) 모든 단계(T00~T16) 이펙트 만들어 룬 구역(셀 y<66) 검사 + 단계 간 규칙
const frames = {}; for (const s of S.J.steps) frames[s.step] = F.buildFx(s.step);
const zone = (f) => { const m = new Set(); if (!f) return m; for (let j = 0; j < 80; j++) for (let i = 0; i < 80; i++) if (2 * j + 1 < 66 && f.d[((2 * j + 1) * 160 + 2 * i + 1) * 4 + 3]) m.add(i + ',' + j); return m; };
for (const s of S.J.steps) {
  const f = frames[s.step]; if (!f) continue; const z = zone(f); let overlap = 0, tooClose = 0;
  for (const k of z) { const [i, j] = k.split(',').map(Number); if (i < 3 && j < 3) continue; let near = false; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (U.has((i + dx) + ',' + (j + dy))) near = true; if (U.has(k)) overlap++; else if (near) tooClose++; }
  if (overlap) fail(s.step + ' 룬 구역이 몸 실루엣과 겹침 ' + overlap + '도트'); if (tooClose) fail(s.step + ' 룬 구역이 몸과 한 도트 안으로 붙음 ' + tooClose + '도트');
  // 현재 단계 몸 셀과도 직접 비교
  const body = L.bodyCell(s.step); let direct = 0; for (let y = 0; y < 66; y++) for (let x = 0; x < 160; x++) if (f.d[(y * 160 + x) * 4 + 3] && body.d[(y * 160 + x) * 4 + 3]) direct++; if (direct) fail(s.step + ' 몸 셀과 직접 겹침 ' + direct + 'px');
}
// 3) 회전: 단계별 룬 모양이 달라지고(T06~T10), T11~T13 은 같은 모양으로 멈춤
const ringKey = (id) => { const f = frames[id], m = []; for (let j = 0; j < 80; j++) for (let i = 0; i < 80; i++) if (2 * j + 1 < 66 && f.d[((2 * j + 1) * 160 + 2 * i + 1) * 4 + 3]) m.push(i + ',' + j); return m.join(';'); };
const rot = ['T07', 'T08', 'T09', 'T10', 'T11'].map(ringKey); for (let k = 1; k < rot.length; k++) if (rot[k] === rot[k - 1]) fail('회전 프레임 ' + k + ' 이 앞과 같음');
const ringOnly = (id) => { const f = frames[id], m = []; for (let j = 0; j < 80; j++) for (let i = 0; i < 80; i++) { const dx = i - F.RC[0], dy = j - F.RC[1]; if (Math.hypot(dx, dy) > 4.6 && 2 * j + 1 < 66 && f.d[((2 * j + 1) * 160 + 2 * i + 1) * 4 + 3]) m.push(i + ',' + j); } return m.join(';'); }; // 룬 고리 바깥쪽만 (자물쇠·섬광 제외)
if (ringOnly('T12') !== ringOnly('T13')) fail('T12/T13 고리 모양이 다름(정지 아님)'); if (ringOnly('T11') !== ringOnly('T12')) console.log('참고: T11 과 T12 고리 모양 차이(섬광 팔이 고리 바깥에 닿음)');
console.log('회전각(도)', JSON.stringify(F.RHO), '→ T11 에서 0 으로 정지 / 총 회전', Math.abs(F.RHO.T06), '도');
// 4) 손 기운: 증식 SKILL·일반공격과 같은 자리·크기 (T04~T10 마스크 완전 일치), T11~T13 은 중심 일치
const HC = { T04: S.HA, T05: S.HA, T06: S.HA, T07: S.HA, T08: S.HR1, T09: S.HB, T10: S.HB, T11: S.HB, T12: S.HB, T13: S.HB };
const handMask = (f, id) => { const m = [], [hi, hj] = HC[id]; if (!f) return m; for (let y = 0; y < 160; y++) for (let x = 0; x < 160; x++) if (f.d[(y * 160 + x) * 4 + 3] && Math.abs(x - (2 * hi + 1)) <= 30 && Math.abs(y - (2 * hj + 1)) <= 30) m.push(x + ',' + y); return m; };
const bbox = (m) => { const xs = m.map(s => +s.split(',')[0]), ys = m.map(s => +s.split(',')[1]); return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; };
for (const id of ['T04', 'T05', 'T06', 'T07', 'T08', 'T09', 'T10']) { const a = handMask(frames[id], id).join(';'), g = handMask(L.growthFx(id), id).join(';'), nrm = handMask(L.normalFx(id), id); if (a !== g) fail(id + ' 손 기운 자리·모양이 증식 SKILL 과 다름'); if (id !== 'T10' && a !== nrm.join(';')) fail(id + ' 손 기운 자리·모양이 일반공격과 다름'); }
for (const id of ['T11', 'T12']) { const a = bbox(handMask(frames[id], id)), g = bbox(handMask(L.growthFx(id), id)); console.log(id, '손 기운 bbox', JSON.stringify(a), '증식', JSON.stringify(g), '(같은 중심 ' + (((a[0] + a[2]) === (g[0] + g[2])) && ((a[1] + a[3]) === (g[1] + g[3]))) + ', 밝기·크기는 설계상 다름)'); }
// 5) 시간표: 일반공격과 같음, 잠금 완료 형태 유지 시간
const t = S.J.steps; const total = t.reduce((a, s) => a + s.ms, 0), t11 = t.find(s => s.step === 'T11'); if (total !== 940) fail('총 길이 ' + total); if (t11.start_ms !== 620) fail('T11 시작 ' + t11.start_ms);
const solid = ['T11', 'T12', 'T13'].reduce((a, id) => a + t.find(s => s.step === id).ms, 0), fade = t.find(s => s.step === 'T14').ms;
console.log('총', total, 'ms | 잠금 완료 기준 T11', t11.start_ms, 'ms | 잠긴 형태 선명 유지', solid, 'ms + 흐려짐', fade, 'ms = ', solid + fade, 'ms');
// 6) NEXT 합성: 저장한 합성에서 대상 둘레만 바뀌고 미노 픽셀·나머지 칸은 원본 그대로인지
const scr = L.SCR(), comp = p.decode(path.join(OUT, 'CrystalQueenRotLock_KeyScenes_v1_scene4_next-link_x1.png')); let changedOutside = 0, changedInside = 0;
for (let y = 0; y < 950; y++) for (let x = 0; x < 740; x++) { const a = ((y) * 1920 + (x + 1180)) * 4, b = (y * 740 + x) * 4; const same = scr.d[a] === comp.d[b] && scr.d[a + 1] === comp.d[b + 1] && scr.d[a + 2] === comp.d[b + 2]; if (same) continue; const X = x + 1180; if (y > 440 && y < 620 && X > 1195 && X < 1335) changedInside++; else if (y > 700 && y < 950) changedOutside++; }
console.log('NEXT 하단 세 칸(아래쪽 y 700 이상) 원본과 달라진 픽셀', changedOutside, '(0 이어야 함)'); if (changedOutside) fail('대상이 아닌 NEXT 칸이 바뀜');
// 미노 픽셀(원본에서 배경과 다른 픽셀)은 합성에서 그대로여야 함: 슬롯 1·2 마스크
const px = (img, w, x, y) => (y * w + x) * 4, bg = [scr.d[px(scr, 1920, 1215, 530)], scr.d[px(scr, 1920, 1215, 530) + 1], scr.d[px(scr, 1920, 1215, 530) + 2]]; let mino = 0, minoChanged = 0;
for (const [y0, y1] of [[454, 520], [548, 618]]) for (let y = y0; y < y1; y++) for (let x = 1222; x < 1312; x++) { const a = px(scr, 1920, x, y); if (Math.max(Math.abs(scr.d[a] - bg[0]), Math.abs(scr.d[a + 1] - bg[1]), Math.abs(scr.d[a + 2] - bg[2])) > 28) { mino++; const b = px(comp, 740, x - 1180, y); if (scr.d[a] !== comp.d[b] || scr.d[a + 1] !== comp.d[b + 1] || scr.d[a + 2] !== comp.d[b + 2]) minoChanged++; } }
console.log('대상 미노 픽셀', mino, '중 바뀐 것', minoChanged, '(0 이어야 함)'); if (minoChanged) fail('미노 픽셀이 바뀜');
console.log(bad ? '위반 ' + bad + '건' : '위반 0');
