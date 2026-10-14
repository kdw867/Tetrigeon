// 수정여왕 회전 잠금 전체 프레임 검증 (작업 폴더 전용): 저장한 시간표·PNG·시트·GIF 를 다시 읽어 17단계 전부 확인한다. 위반 0 이어야 통과.
const fs = require('fs'), path = require('path');
const L = require('./lib_view.js'), N = require('./lib_next.js'), { p, F, S, OUT } = L, { decode: gifDecode } = require('../../PixelFX_VARCO/tools/gif_check.js');
const J = JSON.parse(fs.readFileSync(path.join(OUT, 'RotLockFrames_v1_timeline.json'), 'utf8')), NJ = S.J, PV = JSON.parse(fs.readFileSync(path.join(OUT, 'RotLockFrames_v1_preview.json'), 'utf8'));
const PALSET = new Set(Object.values(F.PAL).map(c => c.join(',')));
let bad = 0; const fail = (m) => { bad++; console.log('  ✗', m); };
const dec = (f) => p.decode(path.join(OUT, f)), A = (img, x, y) => img.d[(y * 160 + x) * 4 + 3];
const blk = (img, i, j, k) => ((2 * j + 1 + (k >> 1)) * 160 + 2 * i + 1 + (k & 1)) * 4; // 블록 (i,j) 의 k 번째 픽셀 오프셋
const col = (img, i, j) => { const o = blk(img, i, j, 0); return img.d[o + 3] ? img.d[o] + ',' + img.d[o + 1] + ',' + img.d[o + 2] : null; }; // 블록 색 (투명 = null)
// 1) 시간표: 일반공격과 17단계·시작·길이·기울기·몸 파일이 같은가
if (J.steps.length !== NJ.steps.length) fail('단계 수 불일치'); J.steps.forEach((s, i) => { const n = NJ.steps[i]; if (s.step !== n.step || s.ms !== n.ms || s.start_ms !== n.start_ms || s.lean_deg !== n.lean_deg || !s.character.endsWith(n.character)) fail('시간표/몸동작이 일반공격과 다름 ' + s.step); });
if (J.attack_ms !== NJ.attack_ms || J.attack_ms !== 940) fail('총 길이 ' + J.attack_ms);
J.steps.forEach(s => { if (!s.character.startsWith('../../CrystalQueenAttack_VARCO/output/CastFrames_v3_cells/')) fail('캐릭터 경로 이상 ' + s.character); });
// 2) 단계별 이펙트 셀
const rows = [], FX = {};
for (const s of J.steps) {
  const ch = dec(s.character), fx = s.fx ? dec(s.fx) : null; FX[s.step] = fx; const st = NJ.steps.find(x => x.step === s.step), face = st.mark_shift_px ? st.mark_shift_px.face : [0, 0], fb = [75 + face[0], 63 + face[1], 84 + face[0], 70 + face[1]], cs = st.mark_shift_px ? st.mark_shift_px.core : [0, 0], cb = [76 + cs[0], 86 + cs[1], 81 + cs[0], 90 + cs[1]];
  let n = 0, nonBin = 0, offPal = 0, offGrid = 0, minRow = 999, maxRow = -1, minX = 999, maxX = -1, bodyAll = 0, bodyRune = 0, eye = 0, onFace = 0, edge = 0;
  if (fx) {
    for (let y = 0; y < 160; y++) for (let x = 0; x < 160; x++) {
      const o = (y * 160 + x) * 4, a = fx.d[o + 3]; if (!a) continue; n++; if (a !== 255) nonBin++;
      if (!PALSET.has(fx.d[o] + ',' + fx.d[o + 1] + ',' + fx.d[o + 2])) offPal++;
      if (x === 0 || y === 0 || x === 159 || y === 159) edge++;
      minRow = Math.min(minRow, y); maxRow = Math.max(maxRow, y); minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      if (ch.d[o + 3]) { bodyAll++; if (y < 66) bodyRune++; const cc = ch.d[o] + ',' + ch.d[o + 1] + ',' + ch.d[o + 2]; if (cc === '51,229,239' || (cc === '188,199,245' && x >= cb[0] && x <= cb[2] && y >= cb[1] && y <= cb[3])) eye++; }
      if (x >= fb[0] && x <= fb[2] && y >= fb[1] && y <= fb[3]) onFace++;
    }
    for (let j = 0; j < 79; j++) for (let i = 0; i < 79; i++) { const v = [0, 1, 2, 3].map(k => { const o = blk(fx, i, j, k); return fx.d[o + 3] + ',' + fx.d[o] + ',' + fx.d[o + 1] + ',' + fx.d[o + 2]; }); if (new Set(v).size > 1) offGrid++; }
    for (let k = 0; k < 160; k++) { if (A(fx, 0, k) || A(fx, k, 0) || A(fx, 159, k) || A(fx, k, 159)) { /* 가장자리 검사는 위 edge 로 */ } }
  }
  const top = fx ? -37 + 2 * minRow : null;
  if (nonBin) fail(s.step + ' 알파 0/255 아님'); if (offPal) fail(s.step + ' 팔레트 밖 ' + offPal); if (offGrid) fail(s.step + ' 2x2 격자 어긋남 ' + offGrid); if (edge) fail(s.step + ' 셀 가장자리 픽셀 ' + edge);
  if (fx && top < 0) fail(s.step + ' 화면 위쪽에서 잘림 y=' + top); if (fx && maxX > 155) fail(s.step + ' 화면 오른쪽(셀 x 155 초과)에서 잘림 ' + maxX);
  if (eye) fail(s.step + ' 눈·코어색 위에 겹침 ' + eye); if (onFace) fail(s.step + ' 얼굴 상자 위에 겹침 ' + onFace);
  rows.push([s.step, s.start_ms, s.ms, fx ? n : 0, fx ? minRow + '~' + maxRow : '-', fx ? '화면y ' + top : '-', fx ? minX + '~' + maxX : '-', fx ? bodyRune : 0, eye, onFace]);
}
console.log('단계 시작ms 길이 FX픽셀 줄 화면 가로 룬구역 몸겹침px(허용) 눈·코어 얼굴'); rows.forEach(r => console.log(r.join('  ')));
for (const id of ['T00', 'T01', 'T02', 'T03', 'T15', 'T16']) if (J.steps.find(s => s.step === id).fx) fail(id + ' 은 이펙트가 비어 있어야 함');
for (let k = 4; k <= 14; k++) { const id = 'T' + String(k).padStart(2, '0'); if (!J.steps.find(s => s.step === id).fx) fail(id + ' 이펙트 없음'); }
// 3) 룬 자리: 중심 열 = 단계별 머리 맨 위 열(몸 셀에서 다시 측정), 줄 19 고정, 이펙트가 룬 구역에서 화면 맨 위 한계를 넘지 않음
const headCol = (id) => { const c = dec(J.steps.find(s => s.step === id).character); const top = (i) => { for (let j = 0; j < 80; j++) if (col2(c, i, j)) return j; return 99; }; const col2 = (img, i, j) => { for (let k = 0; k < 4; k++) if (img.d[blk(img, i, j, k) + 3]) return true; return false; }; let t0 = 99; for (let i = 0; i < 80; i++) t0 = Math.min(t0, top(i)); const cols = []; for (let i = 0; i < 80; i++) if (top(i) <= t0 + 1) cols.push(i); return Math.round((Math.min(...cols) + Math.max(...cols)) / 2); };
for (const s of J.steps) { if (!s.rune_center_block) continue; const h = headCol(s.step); if (s.rune_center_block[0] !== h || s.rune_center_block[1] !== 19) fail(s.step + ' 룬 중심 ' + JSON.stringify(s.rune_center_block) + ' != 머리 열 ' + h + ', 줄 19'); }
console.log('룬 중심 열(T06~T14):', J.steps.filter(s => s.rune_center_block).map(s => s.step + ':' + s.rune_center_block[0]).join(' '), '/ 줄 19 고정');
// 4) 회전: T07~T11 매 단계 모양이 다름, T11~T13 고리 모양 같음(정지), T14 는 T13 의 부분집합(흐려짐)
const RCc = (id) => J.steps.find(s => s.step === id).rune_center_block;
const ringSet = (id) => { const f = FX[id], [cx, cy] = RCc(id), m = new Set(); for (let j = 0; j < 80; j++) for (let i = 0; i < 80; i++) { if (Math.hypot(i - cx, j - cy) > 4.6 && 2 * j + 1 < 66 && col(f, i, j)) m.add((i - cx) + ',' + (j - cy)); } return m; }; // 룬 중심 기준 상대 블록 (고리 바깥쪽만)
const key = (id) => [...ringSet(id)].sort().join(';'), seq = ['T07', 'T08', 'T09', 'T10', 'T11'].map(key); for (let k = 1; k < seq.length; k++) if (seq[k] === seq[k - 1]) fail('회전 프레임 ' + ['T07', 'T08', 'T09', 'T10', 'T11'][k] + ' 이 앞 단계와 같은 모양');
if (key('T12') !== key('T13')) fail('T12/T13 고리 모양이 다름(정지 아님)');
{ const a = ringSet('T13'), b = ringSet('T14'); let out = 0; b.forEach(k => { if (!a.has(k)) out++; }); if (out) fail('T14 고리가 T13 의 부분집합이 아님 ' + out); }
const rho = J.rune.rotation_deg, order = ['T06', 'T07', 'T08', 'T09', 'T10'].map(k => rho[k]); for (let k = 1; k < order.length; k++) if (!(order[k] > order[k - 1])) fail('회전각이 단조 증가가 아님'); if (!(order[order.length - 1] < 0)) fail('T10 회전각이 0 이상');
console.log('회전각(도) T06~T10:', order.join(' '), '→ T11 0도 정지, 총', Math.abs(order[0]), '도 (1/4~1/2 바퀴 = 90~180도 안)'); if (Math.abs(order[0]) < 90 || Math.abs(order[0]) > 180) fail('총 회전각이 1/4~1/2 바퀴 밖');
// 5) 자물쇠 상태: T09 열림 · T10 거의 닫힘 · T13 닫힘은 도안과 정확히 일치, T11·T12 는 십자 반짝임 칸을 뺀 나머지가 닫힘 도안과 일치, T08·T14 는 바둑판 부분집합
const lockExp = (state, [cx, cy]) => { const art = F.lockArt(state), m = new Map(), top = cy + 3 - (art.length - 1); art.forEach((row, dy) => [...row].forEach((ch, dx) => { if (ch !== '.') m.set((cx - 3 + dx) + ',' + (top + dy), F.PAL[ch].join(',')); })); return m; };
const lockObs = (id) => { const [cx, cy] = RCc(id), f = FX[id], m = new Map(); for (let j = cy - 5; j <= cy + 4; j++) for (let i = cx - 4; i <= cx + 4; i++) { const c = col(f, i, j); if (c) m.set(i + ',' + j, c); } return m; };
const glintCells = (id) => { const [cx, cy] = RCc(id), arm = id === 'T11' ? 2 : id === 'T12' ? 1 : 0, s = new Set(); if (!arm) return s; for (let n = 0; n <= arm; n++) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) s.add((cx - 2 + dx * n) + ',' + (cy - 3 + dy * n)); return s; };
for (const [id, st] of [['T09', 'open'], ['T10', 'near'], ['T13', 'closed']]) { const e = lockExp(st, RCc(id)), o = lockObs(id); let miss = 0; e.forEach((c, k) => { if (o.get(k) !== c) miss++; }); if (miss) fail(id + ' 자물쇠가 ' + st + ' 도안과 다름 ' + miss); }
for (const id of ['T11', 'T12']) { const e = lockExp('closed', RCc(id)), o = lockObs(id), g = glintCells(id); let miss = 0; e.forEach((c, k) => { if (!g.has(k) && o.get(k) !== c) miss++; }); if (miss) fail(id + ' 자물쇠가 닫힘 도안과 다름(반짝임 칸 제외) ' + miss); }
for (const [id, st] of [['T08', 'open'], ['T14', 'closed']]) { const e = lockExp(st, RCc(id)), o = lockObs(id), LC = new Set([F.PAL.S.join(','), F.PAL.k.join(',')]); let wrong = 0, got = 0; e.forEach((c, k) => { const [i, j] = k.split(',').map(Number); if ((i + j) % 2 === 0) { got++; if (o.get(k) !== c) wrong++; } else if (LC.has(o.get(k))) wrong++; }); if (wrong) fail(id + ' 흐린 자물쇠가 도안의 바둑판 부분집합이 아님 ' + wrong); console.log(id, '흐린 자물쇠 도트(짝수 칸 기대 ' + got + ')'); }
// 6) 손 기운: 증식 SKILL·일반공격 손 이펙트와 같은 자리·모양 (T04~T10 증식과 마스크 일치, T04~T09 일반공격과도 일치), T11·T12 는 같은 중심
const HC = { T04: S.HA, T05: S.HA, T06: S.HA, T07: S.HA, T08: S.HR1, T09: S.HB, T10: S.HB, T11: S.HB, T12: S.HB, T13: S.HB };
const handMask = (f, id) => { const m = [], [hi, hj] = HC[id]; for (let y = 0; y < 160; y++) for (let x = 0; x < 160; x++) if (f.d[(y * 160 + x) * 4 + 3] && Math.abs(x - (2 * hi + 1)) <= 30 && Math.abs(y - (2 * hj + 1)) <= 30 && y > 66) m.push(x + ',' + y); return m; };
for (const id of ['T04', 'T05', 'T06', 'T07', 'T08', 'T09', 'T10']) { const a = handMask(FX[id], id).join(';'), g = handMask(L.growthFx(id), id).join(';'); if (a !== g) fail(id + ' 손 기운 자리·모양이 증식 SKILL 과 다름'); if (id !== 'T10' && a !== handMask(L.normalFx(id), id).join(';')) fail(id + ' 손 기운 자리·모양이 일반공격과 다름'); }
const bb = (m) => { const xs = m.map(s => +s.split(',')[0]), ys = m.map(s => +s.split(',')[1]); return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; };
for (const id of ['T11', 'T12']) { const a = bb(handMask(FX[id], id)), g = bb(handMask(L.growthFx(id), id)); if ((a[0] + a[2]) !== (g[0] + g[2]) || (a[1] + a[3]) !== (g[1] + g[3])) fail(id + ' 손 기운 중심이 증식 SKILL 과 다름'); }
const handCount = ['T04', 'T05', 'T06', 'T07', 'T08', 'T09', 'T10', 'T11', 'T12', 'T13'].map(id => id + ':' + handMask(FX[id], id).length / 4); console.log('손 기운 도트 수(1도트=4px):', handCount.join(' '));
// 7) 시간: 잠금 완료 기준과 형태 유지 시간
const t = J.steps, total = t.reduce((a, s) => a + s.ms, 0), t11 = t.find(s => s.step === 'T11'); if (total !== 940) fail('총 길이 ' + total); if (t11.start_ms !== 620 || J.lock_complete_reference.start_ms !== 620) fail('잠금 완료 기준 시각 ' + t11.start_ms);
const solid = ['T11', 'T12', 'T13'].reduce((a, id) => a + t.find(s => s.step === id).ms, 0), fade = t.find(s => s.step === 'T14').ms; console.log('총', total, 'ms | 잠금 완료 기준 T11', t11.start_ms, 'ms | 잠긴 형태 선명 유지', solid, 'ms + 흐려짐', fade, 'ms =', solid + fade, 'ms (요청 0.15~0.25초)'); if (solid < 150 || solid + fade > 250) fail('잠금 완료 형태 유지 시간이 0.15~0.25초 밖');
// 8) 시트: 800x480, 11칸이 저장한 셀과 픽셀 단위로 같고, 나머지 칸은 투명
const sheet = p.decode(path.join(OUT, J.sheet.file)); if (sheet.w !== 800 || sheet.h !== 480) fail('시트 크기 ' + sheet.w + 'x' + sheet.h);
J.sheet.map.forEach(m => { const c = dec(J.steps.find(s => s.step === m.step).fx), [ox, oy] = m.rect_px_from_top_left; let diff = 0; for (let y = 0; y < 160; y++) for (let x = 0; x < 160; x++) { const a = ((oy + y) * 800 + ox + x) * 4, b = (y * 160 + x) * 4; for (let k = 0; k < 4; k++) if (sheet.d[a + k] !== c.d[b + k]) { diff++; break; } } if (diff) fail('시트 셀 ' + m.index + '(' + m.step + ') 이 저장한 셀과 다름 ' + diff); });
for (let k = J.sheet.map.length; k < 15; k++) { const ox = (k % 5) * 160, oy = Math.floor(k / 5) * 160; let n = 0; for (let y = 0; y < 160; y++) for (let x = 0; x < 160; x++) if (sheet.d[((oy + y) * 800 + ox + x) * 4 + 3]) n++; if (n) fail('시트 빈 칸 ' + k + ' 이 투명하지 않음'); }
console.log('시트', sheet.w + 'x' + sheet.h, '사용 칸', J.sheet.map.length, '/ 15, 빈 칸 투명 확인');
// 9) 미리보기 GIF: 프레임 수·시간 합
const want = { '1_': [17, 1440], '2_': [17, 1440], '3_': [17, 1440], '4_': [17, 1440], '5_': [17, 1440], '5b': [17, 1440], '6_': [18, 2440], '7_': [19, 2340], '8_': [19, 2940] };
for (const g of PV.gifs) { const k = Object.keys(want).find(q => g.file.includes('preview_' + q)); const dg = gifDecode(fs.readFileSync(path.join(OUT, g.file))), sum = dg.frames.reduce((a, fr) => a + fr.delay, 0); if (!k || dg.frames.length !== want[k][0] || sum !== want[k][1]) fail(g.file + ' 프레임/시간 ' + dg.frames.length + '/' + sum); const nets = fs.readFileSync(path.join(OUT, g.file)).includes('NETSCAPE2.0'); if (g.loop !== nets) fail(g.file + ' 반복 표시 불일치'); }
console.log('GIF', PV.gifs.length, '개 프레임 수·시간 합·반복 정보 확인');
// 10) NEXT 연결 합성: 강조는 대상 두 칸 둘레만, 미노 픽셀·아래 칸·나머지 화면은 원본 그대로
{ const scr = L.SCR(), MK = N.nextMarks(scr), o = { w: scr.w, h: scr.h, d: Buffer.from(scr.d) }; MK.apply(o, 'full', true); let minoChanged = 0, outside = 0, mino = 0; const inMask = new Set(), allowed = new Set(); MK.slots.forEach(s => { s.mask.forEach(k => inMask.add(k)); s.ring.forEach(([x, y]) => allowed.add(x + ',' + y)); for (let y = 0; y < 18; y++) for (let x = 0; x < 14; x++) allowed.add((s.icon[0] + x) + ',' + (s.icon[1] + y)); });
  for (let y = 0; y < 1080; y++) for (let x = 0; x < 1920; x++) { const q = (y * 1920 + x) * 4; if (scr.d[q] === o.d[q] && scr.d[q + 1] === o.d[q + 1] && scr.d[q + 2] === o.d[q + 2]) { if (inMask.has(x + ',' + y)) mino++; continue; } if (inMask.has(x + ',' + y)) minoChanged++; else if (!allowed.has(x + ',' + y)) outside++; }
  console.log('NEXT 강조: 미노 픽셀', inMask.size, '중 바뀐 것', minoChanged, '| 강조·아이콘 밖에서 바뀐 픽셀', outside); if (minoChanged) fail('미노 픽셀이 바뀜'); if (outside) fail('강조·아이콘 밖 픽셀이 바뀜'); }
console.log(bad ? '위반 ' + bad + '건' : '위반 0건'); process.exitCode = bad ? 1 : 0;
