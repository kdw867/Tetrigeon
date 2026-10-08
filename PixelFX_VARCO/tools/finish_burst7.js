// 7색 수정 파괴: 통합 시트(행 = TetrominoType 순서 I J L O S T Z), 검증, 종류별·전체 재생 GIF
const { p, R, get, put, blit, solid, up, writeGif } = require('./lib_fx');
const board = require('../../StageBoardUI_VARCO/tools/lib_board.js');
const TYPES = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'], S = 27;
const sheets = TYPES.map(T => p.decode(`${R}/sheets/FX_CrystalBurst_${T}.png`));
const all = p.blank(S * 8, S * 7); sheets.forEach((s, r) => { for (let y = 0; y < S; y++) for (let x = 0; x < S * 8; x++) { const c = get(s, x, y); if (c[3]) put(all, x, r * S + y, c.slice(0, 3)); } });
p.encode(all, `${R}/sheets/FX_CrystalBurst_7.png`);
// 검증: 알파 값, 색 종류, 배경색(초록·자홍) 잔여, 셀 가장자리 닿음, 마지막 프레임 비어 있음
TYPES.forEach((T, i) => { const s = sheets[i], cols = new Set(), al = new Set(); let bg = 0, edge = 0, lastNonEmpty = 0;
  for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) { const c = get(s, x, y); al.add(c[3]); if (!c[3]) continue; cols.add(c.slice(0, 3).join(',')); if (T !== 'T' && c[0] > 190 && c[2] > 190 && c[1] < 110) bg++; if (c[1] > 150 && c[1] > c[0] + 60 && c[1] > c[2] + 60 && T !== 'S') bg++; const lx = x % S; if (lx === 0 || lx === S - 1 || y === 0 || y === S - 1) edge++; if (x >= S * 7) lastNonEmpty++; }
  console.log(`${T}: ${s.w}x${s.h}, 색 ${cols.size}종, 알파 ${[...al].join('/')}, 배경색 잔여 ${bg}, 셀 가장자리 ${edge}, 마지막 프레임 픽셀 ${lastNonEmpty}`); });
// GIF: 종류별 (어두운 바탕, 8배) + 일곱 색 나란히 (6배, 이름표)
const BGC = '#0d1828', delays = [33, 33, 33, 33, 33, 33, 33, 33, 500];
const font = board.loadFont(`${R}/../RewardUI_VARCO/font/PixelFont.json`, `${R}/../RewardUI_VARCO/font/PixelFont_cream.png`);
TYPES.forEach((T, i) => { const fr = []; for (let f = 0; f < 8; f++) { const im = solid(27 + 20, 27 + 20, BGC); blit(im, p.crop(sheets[i], f * S, 0, S, S), 10, 10, 1); fr.push(up(im, 8)); } fr.push(fr[7]); writeGif(`${R}/preview/FX_CrystalBurst_${T}_x8.gif`, fr, [...delays.slice(0, 8), 600], { diff: true }); });
const NAME = ['I PIERCE', 'J FREEZE', 'L CRITICAL', 'O SHIELD', 'S HEAL', 'T POISON', 'Z EXPLOSION'], k = 5, cw = S * k + 16, fr = [];
for (let f = 0; f < 9; f++) { const ff = Math.min(f, 7), im = solid(cw * 7 + 8, S * k + 52, BGC); TYPES.forEach((T, i) => { board.drawText(im, font, NAME[i], 8 + i * cw, 8, 2, 'l'); blit(im, up(p.crop(sheets[i], ff * S, 0, S, S), k), 8 + i * cw + 8, 36, 1); }); fr.push(im); }
writeGif(`${R}/preview/FX_CrystalBurst_7colors.gif`, fr, [...delays.slice(0, 8), 800], { diff: true });
writeGif(`${R}/preview/FX_CrystalBurst_7colors_slow.gif`, fr, [...delays.slice(0, 8).map(d => d * 4), 1500], { diff: true });
console.log('통합 시트 216x189, GIF 완료');
