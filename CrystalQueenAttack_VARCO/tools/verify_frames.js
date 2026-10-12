// 시전 공격 프레임 v3 검증 (작업 폴더 전용): 저장된 캐릭터(기울임 적용/기울이기 전/팔만)·이펙트 셀과 시간표 JSON 을 다시 읽어 검사.
// 팔은 기울이기 전 팔 레이어가 JSON 의 이동량만큼 그대로 옮겨져 최종 셀에 있는지(픽셀 단위 일치), 눈·눈썹 등 얼굴 묶음·코어·하이라이트가 원본 그대로인지, 가로 "층" 은 숫자로 재기 어려워(시험한 지표가 구분하지 못함) 이전 방식과 같은 자세를 나란히 놓은 비교 이미지로 눈으로 확인한다.
const fs = require('fs'), path = require('path');
const p = require('../../PauseUI_VARCO/tools/pix.js');
const { PAL } = require('./snapq.js'), FX = require('./fx_cast.js'), BD = require('./bend.js');
const OUT = path.join(__dirname, '..', 'output'), J = JSON.parse(fs.readFileSync(path.join(OUT, 'CastFrames_v3_timeline.json'), 'utf8'));
const IDLE = 'C:/Users/MBC-501-15/Documents/Tetrigeon/Tetrigeon/Assets/@Resources/Enemies/CrystalQueenIdle/T_CrystalQueen_Idle.png';
const base = p.crop(p.decode(IDLE), 0, 0, 160, 160), PALS = new Set(PAL.map(c => c.join(','))), FXS = new Set(Object.values(FX.PAL).map(c => c.join(',')));
const px = (im, x, y) => { const o = (y * 160 + x) * 4; return [im.d[o], im.d[o + 1], im.d[o + 2], im.d[o + 3]].join(','); };
const inFace = (x, y) => x >= 70 && x <= 90 && y >= 56 && y <= 92, X0 = J.body_axis_x;
let bad = 0;
const comps = (c) => { const A = (x, y) => x >= 0 && y >= 0 && x < 160 && y < 160 && c.d[(y * 160 + x) * 4 + 3] > 0, seen = new Uint8Array(25600); let n = 0; for (let y = 0; y < 160; y++) for (let x = 0; x < 160; x++) { if (!A(x, y) || seen[y * 160 + x]) continue; n++; const st = [[x, y]]; seen[y * 160 + x] = 1; while (st.length) { const [a, b] = st.pop(); for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = a + dx, Y = b + dy; if (A(X, Y) && !seen[Y * 160 + X]) { seen[Y * 160 + X] = 1; st.push([X, Y]); } } } } return n; };
const stats = (c) => { let n = 0, part = 0, off = 0, y1 = -1, x0 = 999, x1 = -1; for (let y = 0; y < 160; y++) for (let x = 0; x < 160; x++) { const o = (y * 160 + x) * 4, a = c.d[o + 3]; if (!a) continue; n++; if (a !== 255) part++; if (!PALS.has(c.d[o] + ',' + c.d[o + 1] + ',' + c.d[o + 2])) off++; y1 = Math.max(y1, y); x0 = Math.min(x0, x); x1 = Math.max(x1, x); } return { n, part, off, y1, x0, x1 }; };
const uni = (c) => { let t = 0, u = 0; for (let j = 0; j < 79; j++) for (let i = 0; i < 79; i++) { const x = 2 * i + 1, y = 2 * j + 1, s = [px(c, x, y), px(c, x + 1, y), px(c, x, y + 1), px(c, x + 1, y + 1)]; if (s.every(q => q.endsWith(',0'))) continue; t++; if (s.every(q => q === s[0])) u++; } return +(u / t * 100).toFixed(1); };
const seen = new Map();
for (const s of J.steps) {
  if (seen.has(s.character)) continue; seen.set(s.character, 1);
  const lean = p.decode(path.join(OUT, s.character)), up = p.decode(path.join(OUT, s.character.replace('_cells/', '_cells_upright/').replace('.png', '_upright.png'))), deg = s.lean_deg, [adx, ady] = s.arm_shift_px;
  const a = stats(lean), cl = comps(lean); let armD = 0, armN = 0;
  const armsFile = path.join(OUT, s.character.replace('_cells/', '_cells_arms_upright/').replace('CastFrame_', 'CastArms_').replace('.png', '_upright.png'));
  if (fs.existsSync(armsFile)) { const arms = p.decode(armsFile); for (let y = 0; y < 160; y++) for (let x = 0; x < 160; x++) if (arms.d[(y * 160 + x) * 4 + 3]) { armN++; if (px(arms, x, y) !== px(lean, x + adx, y + ady)) armD++; } } // 팔 레이어를 이동해 놓은 자리의 최종 픽셀이 같은 색인지
  // 눈·눈썹 등 얼굴 묶음(원본 X75~84·Y63~70 상자 80px), 가슴 코어(연청 8px), 오른쪽 위 하이라이트(연청 4px): JSON 의 이동량(짝수 px)만큼 옮긴 자리에 원본 픽셀 그대로 있는지
  const ms = s.mark_shift_px, rectPx = (x0, y0, x1, y1, col) => { const L = []; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (px(base, x, y).endsWith(',255') && (!col || px(base, x, y) === col + ',255')) L.push([x, y]); return L; };
  const marks = { face: rectPx(75, 63, 84, 70), core: rectPx(76, 86, 81, 90, '188,199,245'), hl: rectPx(98, 48, 101, 51, '188,199,245') }, mm = {};
  for (const [name, L] of Object.entries(marks)) { const [sx, sy] = ms ? ms[name] : [0, 0]; mm[name] = L.filter(([x, y]) => px(lean, x + sx, y + sy) !== px(base, x, y)).length; }
  let eyeN = 0; for (let y = 0; y < 160; y++) for (let x = 0; x < 160; x++) if (px(lean, x, y) === '51,229,239,255') eyeN++; // 눈 청록은 정확히 8px (다른 곳에 남은 청록 없음)
  const eyeOk = mm.face === 0 && eyeN === 8, coreOk = mm.core === 0 && mm.hl === 0, eyeAt = ms ? ms.face : [0, 0], coreAt = ms ? ms.core : [0, 0];
  const ok = !a.part && !a.off && cl === 1 && a.y1 === 147 && !armD && eyeOk && coreOk; if (!ok) bad++;
  console.log(`${ok ? '✓' : '✗'} ${path.basename(s.character)} 기울기 ${deg}° 팔 이동 ${adx},${ady}px | 도트 ${a.n} 부분알파 ${a.part} 팔레트밖 ${a.off} 덩어리 ${cl} 발바닥 ${a.y1} 좌우끝 ${a.x0}~${a.x1} | 팔 레이어 ${armN}px 중 불일치 ${armD} | 얼굴 묶음(눈·눈썹) 이동 ${JSON.stringify(eyeAt)} 불일치 ${mm.face}px · 코어 불일치 ${mm.core}px · 하이라이트 불일치 ${mm.hl}px · 청록 ${eyeN}px | 2x2 단색 ${uni(lean)}%`);
  if (deg === 0) { let d = 0; for (let i = 0; i < lean.d.length; i++) if (lean.d[i] !== base.d[i]) d++; console.log(d ? '✗' : '✓', '  기울기 0° 프레임 == 원본 Idle 01, 바이트 차이', d); if (d) bad++; }
}
// 이펙트 (캐릭터 앞 한 층): 알파·팔레트·2x2 격자·가장자리·얼굴/코어(기울어진 위치)와 겹침
const faceMask = (deg) => { const m = new Uint8Array(25600); for (let y = 56; y <= 92; y++) for (let x = 70; x <= 90; x++) { const [X, Y] = BD.forward(BD.makeCurve(deg), X0, x + 0.5, y + 0.5); for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) { const xx = Math.floor(X) + a, yy = Math.floor(Y) + b; if (xx >= 0 && yy >= 0 && xx < 160 && yy < 160) m[yy * 160 + xx] = 1; } } return m; };
for (const s of J.steps) {
  if (!s.fx) continue; const c = p.decode(path.join(OUT, s.fx)), fm = faceMask(s.lean_deg); let n = 0, part = 0, off = 0, grid = 0, edge = 0, face = 0;
  for (let y = 0; y < 160; y++) for (let x = 0; x < 160; x++) { const o = (y * 160 + x) * 4, al = c.d[o + 3]; if (!al) continue; n++; if (al !== 255) part++; if (!FXS.has(c.d[o] + ',' + c.d[o + 1] + ',' + c.d[o + 2])) off++; if (x === 0 || y === 0) edge++; if (fm[y * 160 + x]) face++; const bx = x - ((x - 1) & 1), by = y - ((y - 1) & 1); if (x >= 1 && y >= 1 && !(px(c, bx, by) === px(c, bx + 1, by) && px(c, bx, by) === px(c, bx, by + 1) && px(c, bx, by) === px(c, bx + 1, by + 1))) grid++; }
  const ok = n > 0 && !part && !off && !grid && !edge && !face; if (!ok) bad++;
  console.log(`${ok ? '✓' : '✗'} ${path.basename(s.fx)} | 도트 ${n} 부분알파 ${part} 팔레트밖 ${off} 격자 어긋남 ${grid} 가장자리 ${edge} 얼굴·코어(기울어진 위치)와 겹침 ${face}`);
}
// 수정 비행: 소멸 섬광 자리(수정 끝)가 그 높이 여왕 맨 왼쪽보다 앞인지 (팔 뻗기 자세 B)
const B = p.decode(path.join(OUT, J.steps.find(s => s.character.includes('5_reach')).character)), f = J.crystal_flight;
f.top_left_blocks_before_lean.forEach(([, j], n) => { let m = 999; for (let y = 2 * j + 1; y <= 2 * (j + 4) + 2; y++) for (let x = 0; x < 160; x++) if (B.d[(y * 160 + x) * 4 + 3]) { m = Math.min(m, x); break; } const left = 2 * f.end_left_edge_block[n] + 1, ahead = m - left; const ok = ahead >= 8 && ahead <= 14; if (!ok) bad++; console.log(ok ? '✓' : '✗', `수정 ${n + 1}: 끝 왼쪽 ${left}px, 그 높이 여왕 맨 왼쪽 ${m}px → ${ahead}px 앞`); });
// 시간표
const sum = J.steps.reduce((a, s) => a + s.ms, 0), mult = J.steps.every(s => s.ms % 10 === 0), starts = J.steps.every((s, i) => s.start_ms === J.steps.slice(0, i).reduce((a, q) => a + q.ms, 0)), t13 = J.steps.slice(0, 13).reduce((a, s) => a + s.ms, 0), leanOk = J.lean_deg.A === -5 && J.lean_deg.B === 15 && J.lean_deg.rest === 0;
const tok = sum === J.attack_ms && mult && starts && t13 === J.representative_hit.start_ms && leanOk; if (!tok) bad++;
console.log(tok ? '✓' : '✗', `시간표 단계 ${J.steps.length} 합계 ${sum}ms (10ms 배수 ${mult}) 대표 타격 ${J.representative_hit.start_ms}ms, 기울기 손 모음 ${J.lean_deg.A}° / 팔 뻗기 ${J.lean_deg.B}°`);
console.log('위반 항목 수', bad); if (bad) process.exit(1);
