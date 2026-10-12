// 승인된 시전 프레임(v3)을 Unity 스프라이트 시트 2장으로 합침 (작업 폴더 도구, 승인 후 적용 단계에서만 사용)
//  - 캐릭터 시트 T_CrystalQueen_Attack.png: 160x160 셀 4x2 = 640x320 (기본·모으기1·모으기2·손 모음 / 뻗기 중간·팔 뻗기·내리기1·내리기2)
//  - 이펙트 시트 T_CrystalQueen_AttackFx.png: 160x160 셀 5x3 = 800x480 (T04~T16 이펙트 13칸, 맨 끝 2칸은 비어 있음)
// 합친 뒤 시트를 다시 읽어 셀마다 원본과 픽셀 단위로 같은지 확인하고, 시간표 → 시트 칸 번호 매핑을 JSON 으로 저장한다.
const fs = require('fs'), path = require('path');
const p = require('../../PauseUI_VARCO/tools/pix.js');
const R = path.join(__dirname, '..'), OUT = path.join(R, 'output'), J = JSON.parse(fs.readFileSync(path.join(OUT, 'CastFrames_v3_timeline.json'), 'utf8'));
const DEST = path.join(R, '..', 'Tetrigeon', 'Assets', '@Resources', 'Enemies', 'CrystalQueenAttack');
fs.mkdirSync(DEST, { recursive: true });
const chOrder = ['rest', 'g1', 'g2', 'A', 'r1', 'B', 'd1', 'd2'], chIndex = {};
const chFile = (k) => path.join(OUT, 'CastFrames_v3_cells', 'CrystalQueen_CastFrame_' + J.character_cells[k] + '.png');
const fxFiles = J.steps.filter(s => s.fx).map(s => s.fx), fxIndex = {};
function sheet(files, cols, rows) {
  const o = p.blank(cols * 160, rows * 160);
  files.forEach((f, n) => { const c = p.decode(f), ox = (n % cols) * 160, oy = Math.floor(n / cols) * 160; for (let y = 0; y < 160; y++) c.d.copy(o.d, ((oy + y) * o.w + ox) * 4, y * 160 * 4, (y + 1) * 160 * 4); });
  return o;
}
chOrder.forEach((k, n) => chIndex[chFile(k).replace(/\\/g, '/')] = n);
fxFiles.forEach((f, n) => fxIndex[f] = n);
const chSheet = sheet(chOrder.map(chFile), 4, 2), fxSheet = sheet(fxFiles.map(f => path.join(OUT, f)), 5, 3);
p.encode(chSheet, path.join(DEST, 'T_CrystalQueen_Attack.png')); p.encode(fxSheet, path.join(DEST, 'T_CrystalQueen_AttackFx.png'));
// 다시 읽어 셀마다 원본과 비교
let bad = 0;
const verify = (file, cols, files) => { const s = p.decode(file); files.forEach((f, n) => { const c = p.decode(f), ox = (n % cols) * 160, oy = Math.floor(n / cols) * 160; for (let y = 0; y < 160; y++) for (let x = 0; x < 160; x++) { const a = ((oy + y) * s.w + ox + x) * 4, b = (y * 160 + x) * 4; if (s.d[a] !== c.d[b] || s.d[a + 1] !== c.d[b + 1] || s.d[a + 2] !== c.d[b + 2] || s.d[a + 3] !== c.d[b + 3]) bad++; } }); return s; };
const a = verify(path.join(DEST, 'T_CrystalQueen_Attack.png'), 4, chOrder.map(chFile)), b = verify(path.join(DEST, 'T_CrystalQueen_AttackFx.png'), 5, fxFiles.map(f => path.join(OUT, f)));
// 캐릭터 칸 번호는 시간표의 캐릭터 파일 이름으로 찾는다
const byName = {}; chOrder.forEach((k, n) => byName['CrystalQueen_CastFrame_' + J.character_cells[k] + '.png'] = n);
const steps = J.steps.map(s => ({ step: s.step, start_ms: s.start_ms, ms: s.ms, ch: byName[path.basename(s.character)], fx: s.fx ? fxIndex[s.fx] : -1 }));
fs.writeFileSync(path.join(OUT, 'CastFrames_v3_unity_mapping.json'), JSON.stringify({ attack_ms: J.attack_ms, character_sheet: { file: 'T_CrystalQueen_Attack.png', cols: 4, rows: 2, size: [a.w, a.h] }, fx_sheet: { file: 'T_CrystalQueen_AttackFx.png', cols: 5, rows: 3, size: [b.w, b.h], used: fxFiles.length }, steps }, null, 1));
console.log('시트', a.w + 'x' + a.h, b.w + 'x' + b.h, '셀 불일치 픽셀', bad, '단계', steps.length, 'attack_ms', J.attack_ms);
console.log(steps.map(s => s.step + ':' + s.ch + '/' + s.fx + '@' + s.start_ms).join(' '));
if (bad) process.exit(1);
