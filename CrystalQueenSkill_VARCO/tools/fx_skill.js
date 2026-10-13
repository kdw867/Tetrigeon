// 수정여왕 SKILL 이펙트 도안 (작업 폴더 전용, Unity와 무관): 일반공격 이펙트와 같은 "2x2 스프라이트 픽셀 = 도트 1칸" 격자(블록 위상 (1,1)), 같은 160x160 셀 좌표.
// 글자 1개 = 블록 1개 = 2x2 픽셀. 블록 (i,j) = 셀 픽셀 (2i+1..2i+2, 2j+1..2j+2).
const p = require('../../PauseUI_VARCO/tools/pix.js');
// 팔레트: 여왕 보라 계열 + 게임 UI 금색 룬(T_SkillRune_Gold)의 금색 4색 + 제한적 백색
const PAL = {
  N: [15, 23, 54], D: [96, 30, 200], P: [158, 58, 251], B: [189, 93, 251], L: [244, 201, 252], W: [255, 255, 255],
  g: [145, 85, 0], G: [252, 185, 1], Y: [253, 234, 3], H: [253, 247, 210],
  S: [188, 199, 245], C: [51, 229, 239] // 진주(은백, 여왕 코어색) / 하늘색 보석(여왕 눈색)
};
const ART = {
  // ── 손에 모이는 기운: 일반공격 spark1/spark2/starS/star/burst2 와 같은 크기·같은 자리, 색만 다름 (금 테두리 + 보라 안쪽 + 백색 중심 1칸)
  aura1: ['.G.', '.P.', 'GWG', '.P.', '.G.'], // 3x5 (일반 spark1 자리)
  aura2: ['..G..', '..P..', '.GBG.', 'GPWPG', '.GBG.', '..P..', '..G..'], // 5x7 (일반 spark2 자리)
  auraS: ['..G..', '.GBG.', 'GPWPG', '.GBG.', '..G..'], // 5x5 (일반 starS 자리)
  auraBig: ['....G....', '.G..P..G.', '..G.B.G..', '...PBP...', 'GPBBWBBPG', '...PBP...', '..G.B.G..', '.G..P..G.', '....G....'], // 9x9 (일반 star 자리)
  fade1: ['G...G', '.....', '..P..', '.....', 'G...G'], // 5x5 파열 직후 약해진 기운 (일반 burst2 자리, 백색 없음)
  fade2: ['.....', '.G...', '.....', '...P.', '.....'], // 5x5 거의 사라지는 기운
  // ── 공중 왕관 도안은 crown_art.js 에서 만든다 (수정으로 깎은 왕관 + 금 + 진주 + 하늘색 보석, 21x11 도트)
  seed: ['.G.', 'GWG', '.G.'], // 3x3 작은 빛
  glint: ['.H.', 'HWH', '.H.'], // 3x3 반짝임 (터지기 직전)
  flash: ['.....H.....', 'G...HWH...G', '...HWWWH...', '.HHWWWWWHH.', '...HWWWH...', 'G...HWH...G', '.....H.....'], // 11x7 왕관이 갈라지는 순간의 밝은 섬광
  goldChip: ['GY'], // 금 띠 조각 2x1
  pearl: ['S'], // 진주 1x1
  gemChip: ['WC', '.C'], // 하늘색 보석 조각 2x2
  dotP: ['P'], dotG: ['G'], dotD: ['D'], dotg: ['g'] // 멀리 날아간 작은 점
};
for (const [k, a] of Object.entries(ART)) { // 도안 검사: 줄 길이 같음, 팔레트 글자만
  const w = a[0].length; a.forEach((r, y) => { if (r.length !== w) throw new Error(k + ' 줄 ' + y + ' 길이 ' + r.length + ' != ' + w); [...r].forEach(ch => { if (ch !== '.' && !PAL[ch]) throw new Error(k + ' 알 수 없는 글자 ' + ch); }); });
}
// 왕관: 같은 도안을 흐릿하게 → 선명하게 (조각이 모이지 않고 한 덩어리 왕관이 드러남). 윤곽 N 은 항상 유지, 안쪽 도트만 솎아냄
const CA = require('./crown_art.js');
ART.crown = CA.build('a');
const thin = (rows, keep) => rows.map((r, j) => [...r].map((ch, i) => (ch === '.' || ch === 'N' || keep(i, j)) ? ch : '.').join(''));
ART.crownHalf = thin(ART.crown, (i, j) => (i + j) % 2 === 0); // 절반 (바둑판)
ART.crownMost = thin(ART.crown, (i, j) => (i + 2 * j) % 4 !== 0); // 4분의 3
const BRIGHT = { L: 'H', B: 'L', P: 'B', D: 'P', Y: 'H', G: 'Y', g: 'G', S: 'W' }; // 터지기 직전 색 한 단계 위
ART.crownBright = ART.crown.map(r => [...r].map(ch => BRIGHT[ch] || ch).join(''));
const blank = () => p.blank(160, 160);
function place(cell, key, i0, j0) { // 도안을 왼쪽 위 블록 (i0,j0) 에 붙임. 셀 밖이면 오류
  ART[key].forEach((row, dj) => [...row].forEach((ch, di) => {
    if (ch === '.') return; const c = PAL[ch];
    for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) {
      const X = 2 * (i0 + di) + 1 + x, Y = 2 * (j0 + dj) + 1 + y; if (X < 0 || Y < 0 || X >= 160 || Y >= 160) throw new Error('이펙트가 셀 밖: ' + key + ' ' + X + ',' + Y);
      const o = (Y * 160 + X) * 4; cell.d[o] = c[0]; cell.d[o + 1] = c[1]; cell.d[o + 2] = c[2]; cell.d[o + 3] = 255;
    }
  }));
}
const placeC = (cell, key, ci, cj) => place(cell, key, ci - (ART[key][0].length >> 1), cj - (ART[key].length >> 1)); // 홀수 크기 도안의 중심 블록 기준
// 블록 하나 찍기 (파동용)
function dot(cell, i, j, col) { const c = PAL[col]; for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) { const X = 2 * i + 1 + x, Y = 2 * j + 1 + y; if (X < 0 || Y < 0 || X >= 160 || Y >= 160) throw new Error('점이 셀 밖: ' + X + ',' + Y); const o = (Y * 160 + X) * 4; cell.d[o] = c[0]; cell.d[o + 1] = c[1]; cell.d[o + 2] = c[2]; cell.d[o + 3] = 255; } }
// 납작한 파동 고리: 중심 (ci,cj) 블록, 가로 반지름 rx · 세로 반지름 ry 블록, 한 칸 두께. 좌우 끝은 금빛, 위아래 호는 colArc. step>1 이면 step 칸마다 한 점씩만(성긴 점선)
function ring(cell, ci, cj, rx, ry, colArc, colEnd, step) {
  const seen = new Set(), N = 720, pts = [];
  for (let n = 0; n < N; n++) { const t = 2 * Math.PI * n / N, i = Math.round(ci + rx * Math.cos(t)), j = Math.round(cj + ry * Math.sin(t)), k = i + ',' + j; if (!seen.has(k)) { seen.add(k); pts.push([i, j, Math.abs(Math.cos(t)) > 0.86]); } }
  pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]); pts.forEach(([i, j, end], n) => { if (step > 1 && n % step) return; dot(cell, i, j, end ? colEnd : colArc); });
}
module.exports = { PAL, ART, blank, place, placeC, dot, ring };
