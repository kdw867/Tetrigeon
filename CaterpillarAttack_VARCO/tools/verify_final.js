// 최종 확인: (1) 합성 GIF 속 애벌레 색이 원본 프레임과 같은지 (2) 06에서 아래쪽(다리·받침)도 실제로 움직였는지 (3) 마디 이동량 요약 (작업 폴더 전용)
const fs = require('fs'), path = require('path');
const L = require('./lib_cat.js');
const { decode } = require('../../PixelFX_VARCO/tools/gif_check.js');
const { frames } = require('./build_attack.js');
const g = decode(fs.readFileSync(path.join(L.R, 'output', 'CrystalCaterpillar_Attack_v3_6_game-composite_enemy-x4.gif')));
console.log('합성 enemy GIF 프레임', g.frames.length, '지연 합', g.frames.reduce((a, f) => a + f.delay, 0), 'ms');
let worst = 0, n = 0;
frames.forEach((f, k) => { const fr = g.frames[10 + k]; for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) { if (!f.d[(y * 64 + x) * 4 + 3]) continue; for (let dy = 0; dy < 8; dy++) for (let dx = 0; dx < 8; dx++) { const sx = (1533 - 1450 + x * 2) * 4 + dx, sy = (155 - 150 + y * 2) * 4 + dy, q = (sy * 960 + sx) * 4, i = (y * 64 + x) * 4; if (dx >= 4 || dy >= 4) continue; const d = Math.max(Math.abs(fr.d[q] - f.d[i]), Math.abs(fr.d[q + 1] - f.d[i + 1]), Math.abs(fr.d[q + 2] - f.d[i + 2])); worst = Math.max(worst, d); n++; } } });
console.log('애벌레 픽셀', n, '개의 합성 GIF 색 차이 최대', worst);
// 아래쪽(Y 47~52) 변화
const rows = (f, y0, y1) => { const o = []; for (let y = y0; y <= y1; y++) for (let x = 0; x < 64; x++) o.push(f.d.subarray((y * 64 + x) * 4, (y * 64 + x) * 4 + 4).join(',')); return o.join('|'); };
frames.forEach((f, k) => { let same = 0, tot = 0; for (let y = 47; y <= 52; y++) for (let x = 0; x < 64; x++) { const a = f.d.subarray((y * 64 + x) * 4, (y * 64 + x) * 4 + 4), b = frames[0].d.subarray((y * 64 + x) * 4, (y * 64 + x) * 4 + 4); if (a[3] || b[3]) { tot++; if (Buffer.compare(a, b) === 0) same++; } } process.stdout.write(`프레임${String(k + 1).padStart(2, '0')} 아래쪽(Y47~52) 01과 같은 칸 ${same}/${tot}  `); if (k % 3 === 2) console.log(); });
console.log();
// 두 몸통 모두 참여: 가운데·뒤 마디의 이동이 있는 프레임 수
const M = JSON.parse(fs.readFileSync(path.join(L.R, 'work', 'attack_v2_report.json'), 'utf8'));
const moved = k => M.filter(r => r[k][0] !== 0 || r[k][1] !== 0).map(r => r.frame).join(',');
console.log('머리 이동 프레임:', moved('H')); console.log('첫 번째 몸통(가운데) 이동 프레임:', moved('M')); console.log('두 번째 몸통(뒤) 이동 프레임:', moved('R'));
console.log('최대 전진(왼쪽) 머리/가운데/뒤:', Math.min(...M.map(r => r.H[0])), Math.min(...M.map(r => r.M[0])), Math.min(...M.map(r => r.R[0])), ' 최대 후퇴(오른쪽):', Math.max(...M.map(r => r.H[0])), Math.max(...M.map(r => r.M[0])), Math.max(...M.map(r => r.R[0])));
console.log('최대 위(−)/아래(+) 이동:', Math.min(...M.flatMap(r => [r.H[1], r.M[1], r.R[1]])), Math.max(...M.flatMap(r => [r.H[1], r.M[1], r.R[1]])));
