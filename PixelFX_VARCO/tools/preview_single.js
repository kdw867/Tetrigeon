// 이펙트 3종 단독 재생 미리보기(어두운 배경, 정수 배율 확대)와 검증, VARCO 원본 대 최종 비교 이미지
const { p, R, get, blit, solid, up, writeGif, clone } = require('./lib_fx');
const lock = p.decode(`${R}/sheets/FX_Lock_sheet.png`), clear = p.decode(`${R}/sheets/FX_LineClear_sheet.png`), cry = p.decode(`${R}/sheets/FX_CrystalBurst_sheet.png`);
const BG = '#0e1726', out = `${R}/preview`;
// LOCK: 네 변이 모두 노출된 칸 / T 모양 한 칸(북·서·남... 대신 대표로 북+동 노출) 두 가지를 나란히
const lockFrames = []; for (let f = 0; f < 8; f++) { const im = solid(27 * 3 + 40, 27 + 20, BG); [15, 3, 9].forEach((m, i) => blit(im, p.crop(lock, f * 27, m * 27, 27, 27), 10 + i * 37, 10, 1)); lockFrames.push(up(im, 6)); }
writeGif(`${out}/FX_Lock_single_x6.gif`, lockFrames, 1000 / 60);
const clearFrames = []; for (let f = 0; f < 10; f++) { const im = solid(270 + 20, 31 + 20, BG); blit(im, p.crop(clear, 0, f * 31, 270, 31), 10, 10, 1); clearFrames.push(up(im, 3)); }
writeGif(`${out}/FX_LineClear_single_x3.gif`, clearFrames, 20);
const cryFrames = []; for (let f = 0; f < 8; f++) { const im = solid(27 + 20, 27 + 20, BG); blit(im, p.crop(cry, f * 27, 0, 27, 27), 10, 10, 1); cryFrames.push(up(im, 8)); }
writeGif(`${out}/FX_CrystalBurst_single_x8.gif`, cryFrames, 1000 / 30);
// 시트 전체를 한 장으로 (정수 배율 확대)
const W = 270 * 2 + 40, ov = solid(Math.max(W, 216 * 3 + 40), 432 * 2 + 27 * 3 + 310 * 2 + 140, '#070c14'); let y = 12;
blit(ov, up(lock, 2), 12, y, 1); y += 432 * 2 + 14; blit(ov, up(cry, 3), 12, y, 1); y += 27 * 3 + 14; blit(ov, up(clear, 2), 12, y, 1);
p.encode(ov, `${out}/Sheets_overview.png`);
// 검증: 색 종류, 알파 값, 초록 잔여, 셀 가장자리 닿음
function check(name, img, cw, ch) {
  const cols = new Set(); let alphas = new Set(), greenish = 0, edge = 0;
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) { const c = get(img, x, y); alphas.add(c[3]); if (!c[3]) continue; cols.add(c.slice(0, 3).join(',')); if (c[1] > c[0] + 60 && c[1] > c[2] + 20 && c[1] > 200) greenish++; const lx = x % cw, ly = y % ch; if (lx === 0 || ly === 0 || lx === cw - 1 || ly === ch - 1) edge++; }
  console.log(`${name}: ${img.w}x${img.h}, 색 ${cols.size}종, 알파값 ${[...alphas].join('/')}, 초록 잔여 ${greenish}, 셀 가장자리 픽셀 ${edge}`);
}
check('FX_Lock_sheet', lock, 27, 27); check('FX_LineClear_sheet', clear, 270, 31); check('FX_CrystalBurst_sheet', cry, 27, 27);
// VARCO 원본 vs 최종 (수정 파괴)
const raw = p.decode(`${R}/generated/crystal_v1.png`), small = p.boxDown(raw, 1.6); // 860x480
const cmp = solid(small.w, small.h + 27 * 4 + 40, '#070c14'); blit(cmp, small, 0, 0, 1); blit(cmp, up(cry, 4), 0, small.h + 20, 1); p.encode(cmp, `${out}/Compare_Crystal_VARCO_vs_Final.png`);
console.log('완료');
