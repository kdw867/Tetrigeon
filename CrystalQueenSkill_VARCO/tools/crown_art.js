// 수정 왕관 도안 생성기 (작업 폴더 전용): 수정(밝은 연보라 면)을 깎아 만든 왕관 한 덩어리 + 금 장식 + 진주 + 하늘색 보석. 글자 1개 = 도트 1칸(2x2 px).
// 글자: N 윤곽 / L B P D 수정 면(밝음→어두움) / W 반짝임 / Y G g 금 / S 진주(은백) / C 하늘색 보석(여왕 눈 색)
// 안쪽 그림(19x9)을 손으로 그리고, 윤곽(N)은 칠해진 칸 둘레 상하좌우에 코드로 붙인다 → 최종 21x11 도트(42x22 px)
const INNER = {
  a: [ // 수정 뾰족 5개 + 가운데 하늘색 보석 장식 + 수정 면 띠 (금 끝, 진주, 금 테두리)
    '.........C.........',
    '........WCC........',
    '.....Y...C...Y.....',
    '....LBP.GYG.LBP....',
    '.S..LBP.WBP.LBP..S.',
    'LBP.LBP.LBP.LBP.LBP',
    'LPDgLPDgLPDgLPDgLPD',
    'GYGYGYGYGYGYGYGYGYG',
    'LBPSLBPSLCLSPBLSPBL']
};
function build(key = 'a') {
  const src = INNER[key], w = src[0].length + 2, h = src.length + 2, g = Array.from({ length: h }, () => Array(w).fill('.'));
  src.forEach((r, y) => [...r].forEach((c, x) => { g[y + 1][x + 1] = c; }));
  const body = g.map(r => r.slice()); // 윤곽: 칠해진 칸 둘레(상하좌우 4방향)의 빈 칸을 N 으로 (8방향은 뾰족 사이를 다 메워 형태가 뭉개짐)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (g[y][x] === '.') { for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < w && Y < h && body[Y][X] !== '.') g[y][x] = 'N'; } }
  return g.map(r => r.join(''));
}
module.exports = { build, INNER };
if (require.main === module) console.log(build(process.argv[3] || 'a').join('\n'));
