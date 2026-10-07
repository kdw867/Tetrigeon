// 숫자 0~9, "/", "+" 도트 글꼴 (HP 숫자를 이 조각들을 이어 붙여 표시). 컨셉의 굵은 크림색 숫자 모양을 6x9 격자로 새로 그림
// 출력: font/HpDigits_<색>.png (아틀라스), font/HpDigits.json (위치·간격), work/digits_preview.png. 작업 폴더에만 저장
const p = require('../../PauseUI_VARCO/tools/pix.js'), path = require('path'), fs = require('fs');
const R = path.join(__dirname, '..');
// 글자 모양: 줄 문자열 배열 ('#' = 픽셀). yTop = 맨 윗줄이 9줄 칸의 몇 번째 줄인지
const G = {
  '0': { rows: ['.####.', '######', '##..##', '##..##', '##..##', '##..##', '##..##', '######', '.####.'] },
  '1': { rows: ['..##..', '.###..', '####..', '..##..', '..##..', '..##..', '..##..', '..##..', '######'] },
  '2': { rows: ['.####.', '######', '##..##', '....##', '...##.', '..##..', '.##...', '######', '######'] },
  '3': { rows: ['.####.', '######', '....##', '..###.', '..###.', '....##', '##..##', '######', '.####.'] },
  '4': { rows: ['##..##', '##..##', '##..##', '##..##', '######', '######', '....##', '....##', '....##'] },
  '5': { rows: ['######', '######', '##....', '#####.', '######', '....##', '##..##', '######', '.####.'] },
  '6': { rows: ['.####.', '######', '##....', '##....', '#####.', '######', '##..##', '######', '.####.'] },
  '7': { rows: ['######', '######', '....##', '....##', '...##.', '..##..', '..##..', '..##..', '..##..'] },
  '8': { rows: ['.####.', '######', '##..##', '.####.', '.####.', '##..##', '##..##', '######', '.####.'] },
  '9': { rows: ['.####.', '######', '##..##', '######', '.#####', '....##', '....##', '######', '.####.'] },
  '/': { rows: ['...##', '...##', '..##.', '..##.', '.##..', '.##..', '##...', '##...', '##...'] },
  '+': { rows: ['..##..', '..##..', '######', '######', '..##..', '..##..'], yTop: 2 },
  '!': { rows: ['##', '##', '##', '##', '##', '##', '..', '##', '##'] }, // 스킬 카운터 '1 !'용
};
const ORDER = '0123456789/+!';
const COLORS = { cream: { body: [250, 240, 222], edge: [8, 14, 32] }, cyan: { body: [140, 236, 244], edge: [6, 28, 44] }, gold: { body: [252, 206, 48], edge: [46, 26, 4] }, gray: { body: [198, 206, 218], edge: [14, 20, 30] }, dim: { body: [118, 130, 146], edge: [12, 18, 28] }, teal: { body: [96, 200, 214], edge: [6, 30, 40] } }; // gray/dim/teal: 스테이지 현황판(전체 숫자, 미진행, 완료)용 // gold: 스킬 카운터 1턴 남음
const CELL_W = 8, CELL_H = 11, PAD = 1; // 글자 칸: 몸통 6x9 + 바깥 외곽선 1px
const meta = { cellHeight: CELL_H, lineHeight: CELL_H, outline: 1, glyphs: {} };
const AW = ORDER.length * (CELL_W + PAD) + PAD, AH = CELL_H + 2 * PAD;
const tsv = [];
ORDER.split('').forEach((ch, k) => {
  const g = G[ch], w = g.rows[0].length, yTop = g.yTop || 0, h = g.rows.length;
  const x = PAD + k * (CELL_W + PAD), y = PAD;
  meta.glyphs[ch] = { x, y, w: w + 2, h: CELL_H, advance: w + 1, yOffset: 0 };
  tsv.push([ch.codePointAt(0), x, y, w + 2, CELL_H, w + 1, 0].join('\t'));
});
tsv.push([32, 0, 0, 0, 0, 4, 0].join('\t')); // 띄어쓰기: 그림 없이 간격만
for (const [name, c] of Object.entries(COLORS)) {
  const atlas = p.blank(AW, AH);
  ORDER.split('').forEach((ch, k) => {
    const g = G[ch], w = g.rows[0].length, yTop = g.yTop || 0, ox = PAD + k * (CELL_W + PAD) + 1, oy = PAD + 1 + yTop; // 외곽선 1px 안쪽에서 몸통 시작
    const set = (x, y, col) => { if (x < 0 || y < 0 || x >= AW || y >= AH) return; const o = (y * AW + x) * 4; atlas.d[o] = col[0]; atlas.d[o + 1] = col[1]; atlas.d[o + 2] = col[2]; atlas.d[o + 3] = 255; };
    g.rows.forEach((row, r) => row.split('').forEach((v, cI) => { if (v === '#') for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) set(ox + cI + dx, oy + r + dy, c.edge); })); // 외곽선(대각선 포함)
    g.rows.forEach((row, r) => row.split('').forEach((v, cI) => { if (v === '#') set(ox + cI, oy + r, c.body); })); // 몸통
  });
  p.encode(atlas, `${R}/font/HpDigits_${name}.png`);
}
meta.glyphs[' '] = { x: 0, y: 0, w: 0, h: 0, advance: 4, yOffset: 0 };
fs.writeFileSync(`${R}/font/HpDigits.json`, JSON.stringify(meta, null, 1));
fs.writeFileSync(`${R}/work/hp_digits.tsv`, tsv.join('\n') + '\n');
// 미리보기: 크림 "72 / 100", "12 / 20", "0123456789", 청록 "+8" 를 3배로
const L = (name) => p.decode(`${R}/font/HpDigits_${name}.png`);
const sheet = p.blank(420, 190); for (let i = 0; i < sheet.w * sheet.h; i++) { sheet.d[i * 4] = 14; sheet.d[i * 4 + 1] = 24; sheet.d[i * 4 + 2] = 45; sheet.d[i * 4 + 3] = 255; }
function draw(color, str, x, y, k) { const a = L(color); let pen = x; for (const ch of str) { const g = meta.glyphs[ch]; if (!g) continue; if (g.w) for (let yy = 0; yy < g.h * k; yy++) for (let xx = 0; xx < g.w * k; xx++) { const s = ((g.y + Math.floor(yy / k)) * a.w + g.x + Math.floor(xx / k)) * 4; if (!a.d[s + 3]) continue; const dx = pen - k + xx, dy = y + yy; if (dx < 0 || dy < 0 || dx >= sheet.w || dy >= sheet.h) continue; a.d.copy(sheet.d, (dy * sheet.w + dx) * 4, s, s + 4); } pen += g.advance * k; } }
draw('cream', '72 / 100', 10, 8, 3); draw('cream', '12 / 20', 10, 48, 3); draw('cream', '0123456789', 10, 88, 3); draw('cyan', '+8  +10', 10, 128, 3); draw('cream', '47 / 70', 220, 48, 2); draw('gold', '1 !', 220, 88, 3);
p.encode(sheet, `${R}/work/digits_preview.png`);
console.log('글자', ORDER.length + 1, '| 아틀라스', AW + 'x' + AH);
