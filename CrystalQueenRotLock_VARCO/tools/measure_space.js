// 수정여왕 회전 잠금 룬 자리 측정 (작업 폴더 전용, Unity와 무관): 승인된 일반공격 캐릭터 셀 8장(읽기 전용)에서 몸 실루엣을 모아, 화면에 보이는 영역 안에서 룬이 몸과 겹치지 않고 들어갈 자리를 찾는다.
const fs = require('fs'), path = require('path');
const p = require('../../PauseUI_VARCO/tools/pix.js');
const ATK = path.join(__dirname, '..', '..', 'CrystalQueenAttack_VARCO', 'output');
const J = JSON.parse(fs.readFileSync(path.join(ATK, 'CastFrames_v3_timeline.json'), 'utf8'));
const NAMES = Object.values(J.character_cells); // 0_rest ~ 7_lower2
const cells = NAMES.map(n => p.decode(path.join(ATK, 'CastFrames_v3_cells', 'CrystalQueen_CastFrame_' + n + '.png')));
// 블록 격자 80x80: 블록 (i,j) = 셀 픽셀 (2i+1..2i+2, 2j+1..2j+2), 한 픽셀이라도 불투명이면 몸
const occ = cells.map(c => { const g = []; for (let j = 0; j < 80; j++) { g[j] = []; for (let i = 0; i < 80; i++) { let o = 0; for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) if (c.d[((2 * j + 1 + y) * 160 + 2 * i + 1 + x) * 4 + 3]) o = 1; g[j][i] = o; } } return g; });
const union = []; for (let j = 0; j < 80; j++) { union[j] = []; for (let i = 0; i < 80; i++) union[j][i] = occ.some(g => g[j][i]) ? 1 : 0; }
// 화면 보이는 영역: 셀 원점 화면 y=-37, 배율 2 → 첫 보이는 셀 줄 19(블록 줄 10). 오른쪽은 화면 폭 1920 에서 잘림(셀 원점 화면 x≈1608 → 보이는 셀 x < 156 → 블록 < 78)
const SX = Math.round(960 + (5.9 + 1.8 - 0.15873016 * 1.4) * 108 - 160), SY = Math.round(540 - (3.1 + 0.43650794 * 1.4) * 108 - 176);
console.log('셀 원점 화면', SX, SY, '| 셀 폭이 화면 밖으로 나가는 양(셀 px)', Math.max(0, (SX + 320 - 1920) / 2), '| 첫 보이는 셀 줄', Math.ceil(-SY / 2));
const J0 = Math.ceil(Math.ceil(-SY / 2) / 2), I1 = Math.floor((1920 - SX) / 4);
console.log('보이는 블록 줄 시작', J0, '보이는 블록 열 끝(미포함)', I1);
// 몸 위쪽 윤곽 (블록 열별 맨 위 블록 줄, 8장 합집합)
const tops = []; for (let i = 0; i < 80; i++) { let t = 99; for (let j = 0; j < 80; j++) if (union[j][i]) { t = j; break; } tops.push(t); }
console.log('열별 몸 맨 위 블록 줄(합집합):'); for (let i0 = 0; i0 < 80; i0 += 10) console.log('  열 ' + i0 + '~' + (i0 + 9) + ': ' + tops.slice(i0, i0 + 10).map(t => t === 99 ? ' --' : String(t).padStart(3)).join(''));
let top = 99, topI = 0; tops.forEach((t, i) => { if (t < top) { top = t; topI = i; } }); console.log('몸 맨 위 블록 줄', top, '(열 ' + topI + ') → 화면 y', SY + 4 * top, '| 보이는 줄 시작과의 빈 줄 수', top - J0);
// 정사각 상자 N x N 블록(+여백 1블록)이 몸과 안 겹치는 자리 찾기
function fits(N, mg) { const res = []; for (let j = J0; j + N <= 80; j++) for (let i = 0; i + N <= I1; i++) { let ok = true; for (let y = Math.max(0, j - mg); y < Math.min(80, j + N + mg) && ok; y++) for (let x = Math.max(0, i - mg); x < Math.min(80, i + N + mg); x++) if (union[y][x]) { ok = false; break; } if (ok) res.push([i, j]); } return res; }
for (const N of [9, 11, 13]) { const r = fits(N, 1); console.log('상자 ' + N + 'x' + N + ' (여백 1) 들어가는 자리 수', r.length); if (r.length) { const byJ = {}; r.forEach(([i, j]) => { (byJ[j] = byJ[j] || []).push(i); }); const ks = Object.keys(byJ).map(Number).sort((a, b) => a - b); console.log('  줄별 가능한 열 범위: ' + ks.slice(0, 12).map(j => j + ':' + Math.min(...byJ[j]) + '~' + Math.max(...byJ[j])).join('  ')); } }
// 머리 위치 (눈 청록 픽셀 평균, rest 셀)
const c0 = cells[0]; let ex = 0, ey = 0, en = 0; for (let y = 0; y < 160; y++) for (let x = 0; x < 160; x++) { const o = (y * 160 + x) * 4; if (c0.d[o + 3] && Math.abs(c0.d[o] - 51) < 20 && Math.abs(c0.d[o + 1] - 229) < 25 && Math.abs(c0.d[o + 2] - 239) < 25) { ex += x; ey += y; en++; } } console.log('rest 눈(청록) 중심 셀 px', (ex / en).toFixed(1), (ey / en).toFixed(1), '개수', en);
// 시각 확인용 그림: 합집합 실루엣(회색) + 보이는 영역 경계(빨강 줄) + 8장 겹침, 블록 1칸 = 6px
const K = 6, W = 80 * K, o = { w: W, h: W, d: Buffer.alloc(W * W * 4) }; const px = (i, j, c) => { for (let y = 0; y < K; y++) for (let x = 0; x < K; x++) { const q = ((j * K + y) * W + i * K + x) * 4; o.d[q] = c[0]; o.d[q + 1] = c[1]; o.d[q + 2] = c[2]; o.d[q + 3] = 255; } };
for (let j = 0; j < 80; j++) for (let i = 0; i < 80; i++) { const n = occ.reduce((a, g) => a + g[j][i], 0); const vis = j >= J0 && i < I1; const base = vis ? [22, 26, 38] : [10, 11, 16]; px(i, j, n ? [60 + n * 22, 40 + n * 12, 90 + n * 18] : base); }
p.encode(o, path.join(__dirname, '..', 'output', 'probe_free_space_x6.png'));
