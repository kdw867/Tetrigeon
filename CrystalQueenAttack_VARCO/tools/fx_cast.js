// 수정여왕 시전 이펙트 (작업 폴더 전용, Unity와 무관): 원본 Idle 과 같은 "2x2 스프라이트 픽셀 = 도트 1칸" 격자(블록 위상 (1,1))로 그린다.
// 아래 그림의 글자 1개 = 블록 1개 = 2x2 픽셀. 블록 (i,j) = 셀 픽셀 (2i+1..2i+2, 2j+1..2j+2). 모든 이펙트 셀은 캐릭터와 같은 160x160 좌표.
const p = require('../../PauseUI_VARCO/tools/pix.js');
const PAL = { N: [15, 23, 54], D: [96, 30, 200], P: [158, 58, 251], B: [189, 93, 251], L: [244, 201, 252], W: [255, 255, 255] }; // 여왕 보라 계열 + 제한적 백색 (청록 없음)
const ART = {
  crystal: [ // 왼쪽을 향한 작은 수정 (9x5 블록 = 18x10 px): L 밝은 면, B/P 중간, D 어두운 면, W 하이라이트 1블록, N 윤곽
    '...NNNNNN',
    '.NNLLBBPN',
    'NLLWBBPDN',
    '.NNPPDDNN',
    '...NNNNN.'],
  spark1: [ // 두 손 사이(2px 틈)에서 생기는 작은 마법 (3x5)
    '.B.',
    '.L.',
    'LWL',
    '.L.',
    '.B.'],
  spark2: [ // 손 사이 마법이 커짐 (5x7)
    '..L..',
    '..B..',
    '.BLB.',
    'LLWLL',
    '.BLB.',
    '..B..',
    '..L..'],
  star: [ // 뻗은 손 앞 마법 (9x9)
    '....L....',
    '.L..B..L.',
    '..B.L.B..',
    '...BLB...',
    'LBLLWLLBL',
    '...BLB...',
    '..B.L.B..',
    '.L..B..L.',
    '....L....'],
  burst: [ // 발사 순간 흩어지는 마법 (9x9)
    '....B....',
    '.L.....L.',
    '...L.L...',
    '.........',
    'B..LWL..B',
    '.........',
    '...L.L...',
    '.L.....L.',
    '....B....'],
  burst2: [ // 발사 직후 더 성긴 마법 (5x5)
    'B...B',
    '.....',
    '..W..',
    '.....',
    'B...B'],
  starS: [ // 뻗는 중 작은 마법 (5x5)
    '..L..',
    '.BLB.',
    'LLWLL',
    '.BLB.',
    '..L..'],
  dot: [ // 수정이 생기는 첫 점 (3x3)
    '.L.',
    'LWL',
    '.L.'],
  crystalS: [ // 수정이 자라는 중간 단계 (5x3)
    '.NNN.',
    'NLBPN',
    '.NNN.'],
  flash0: [ // 수정이 사라지는 자리의 섬광 1 (7x7, 수정 폭 9블록의 약 0.8배)
    '...L...',
    '..LBL..',
    '.L.B.L.',
    'LBBWBBL',
    '.L.B.L.',
    '..LBL..',
    '...L...'],
  flash1: [ // 섬광 2 (흩어지는 점, 7x7)
    'B.....B',
    '..L.L..',
    '.......',
    '...W...',
    '.......',
    '..L.L..',
    'B.....B']
};
const blank = () => p.blank(160, 160);
// 그림(ART 키)을 왼쪽 위 블록 (i0,j0) 에 붙임. 셀 밖이면 오류
function place(cell, key, i0, j0) {
  ART[key].forEach((row, dj) => [...row].forEach((ch, di) => {
    if (ch === '.') return;
    const c = PAL[ch];
    for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) {
      const X = 2 * (i0 + di) + 1 + x, Y = 2 * (j0 + dj) + 1 + y;
      if (X < 0 || Y < 0 || X >= 160 || Y >= 160) throw new Error('이펙트가 셀 밖: ' + X + ',' + Y);
      const o = (Y * 160 + X) * 4; cell.d[o] = c[0]; cell.d[o + 1] = c[1]; cell.d[o + 2] = c[2]; cell.d[o + 3] = 255;
    }
  }));
}
// 그림 중심 블록 (ci,cj) 기준으로 붙임 (홀수 크기 그림)
const placeC = (cell, key, ci, cj) => place(cell, key, ci - (ART[key][0].length >> 1), cj - (ART[key].length >> 1));
module.exports = { PAL, ART, blank, place, placeC };
