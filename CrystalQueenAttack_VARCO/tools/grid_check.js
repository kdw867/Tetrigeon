// Idle 01 이 2x2 도트 격자인지 확인 (작업 폴더 전용): 색 경계가 짝수/홀수 좌표 중 어디에 몰리는지, 정렬된 2x2 블록 중 단색 비율
const p = require('../../PauseUI_VARCO/tools/pix.js');
const f = process.argv[2] || 'work/idle01_cell.png', c = p.decode(f);
const eq = (x0, y0, x1, y1) => { const a = (y0 * 160 + x0) * 4, b = (y1 * 160 + x1) * 4; if (!c.d[a + 3] && !c.d[b + 3]) return true; if (!c.d[a + 3] || !c.d[b + 3]) return false; return c.d[a] === c.d[b] && c.d[a + 1] === c.d[b + 1] && c.d[a + 2] === c.d[b + 2]; };
const bx = [0, 0], by = [0, 0]; // 경계(x-1|x 에서 색이 바뀜)가 x 짝수/홀수에서 얼마나
for (let y = 0; y < 160; y++) for (let x = 1; x < 160; x++) if (!eq(x - 1, y, x, y)) bx[x % 2]++;
for (let x = 0; x < 160; x++) for (let y = 1; y < 160; y++) if (!eq(x, y - 1, x, y)) by[y % 2]++;
console.log('가로 색 경계 위치 짝수/홀수', bx.join('/'), '| 세로 경계 짝수/홀수', by.join('/'));
for (const [px, py] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { let u = 0, t = 0; for (let y = py; y + 1 < 160; y += 2) for (let x = px; x + 1 < 160; x += 2) { const op = [c.d[(y * 160 + x) * 4 + 3], c.d[(y * 160 + x + 1) * 4 + 3], c.d[((y + 1) * 160 + x) * 4 + 3], c.d[((y + 1) * 160 + x + 1) * 4 + 3]].filter(Boolean).length; if (!op) continue; t++; if (eq(x, y, x + 1, y) && eq(x, y, x, y + 1) && eq(x, y, x + 1, y + 1)) u++; } console.log('블록 시작 위상 (x%2,y%2)=(' + px + ',' + py + ') 단색 2x2 블록', u + '/' + t, (u / t * 100).toFixed(1) + '%'); }
