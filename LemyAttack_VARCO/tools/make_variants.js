// 레미 파생 스프라이트 3장 (작업 폴더 전용, 원본 T_GolemParts 는 건드리지 않음). 목적: 팔을 벌릴 때 몸 가장자리에 남는 어깨 연결 빛(청록)이 몸에 붙어 있지 않고 팔을 따라가게 한다.
// 1) BodyFeet_Open : 몸 스프라이트에서 좌·우 어깨의 청록 조각(+ 어두운 청록 번짐)만 가장 가까운 어두운 청록 남색 윤곽 색으로 메운 것. 나머지(목 점, 가운데 이음새 빛 등)는 그대로.
// 2) LeftArm_Glint / RightArm_Glint : 원래 팔 스프라이트에 그 청록 조각을 "기본 자세에서 몸에 있던 자리" 그대로 옮겨 붙인 것(캔버스만 넓힘, 피벗 픽셀은 원본 팔과 같은 점). 기본 자세에서는 원본과 한 픽셀도 다르지 않다.
// 좌표 환산(파츠 피벗이 가운데, PPU 100, 프리팹 기본 위치): 팔 텍스처 좌표 = 몸 텍스처 좌표 + (왼팔: +57, −2 / 오른팔: −164, −2).
const fs = require('fs'), path = require('path');
const p = require('../../PauseUI_VARCO/tools/pix.js'), W = path.join(__dirname, '..', 'work'), V = path.join(W, 'variants'); fs.mkdirSync(V, { recursive: true });
const B = p.decode(path.join(W, 'part_BodyFeet.png')), LA = p.decode(path.join(W, 'part_LeftArm.png')), RA = p.decode(path.join(W, 'part_RightArm.png'));
const at = (im, x, y) => (y * im.w + x) * 4, alpha = (im, x, y) => (x < 0 || y < 0 || x >= im.w || y >= im.h) ? 0 : im.d[at(im, x, y) + 3];
const isGlint = (im, x, y) => { const o = at(im, x, y), r = im.d[o], g = im.d[o + 1], b = im.d[o + 2]; return im.d[o + 3] > 10 && ((b - r > 60 && g > r + 40) || (g > 225 && b > 225 && Math.abs(g - b) < 20 && r > 150 && r < 235)); }; // 청록·어두운 청록 번짐 (남색 윤곽 (22,38,60) 은 b-r 38 이라 제외, 돌색은 제외)
const REG = { L: [2, 42, 26, 70], R: [146, 42, 163, 70] };
const mask = new Uint8Array(B.w * B.h);
for (const [x0, y0, x1, y1] of Object.values(REG)) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (isGlint(B, x, y)) mask[y * B.w + x] = 1;
  const add = []; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (!mask[y * B.w + x] && alpha(B, x, y) > 10) { let near = false; for (let dy = -1; dy <= 1 && !near; dy++) for (let dx = -1; dx <= 1; dx++) if (mask[(y + dy) * B.w + x + dx]) { near = true; break; } if (near && B.d[at(B, x, y)] < 70) add.push(y * B.w + x); } // 안티앨리어싱 한 겹 (돌색 제외)
  add.forEach(i => { mask[i] = 1; });
  // 남은 밝은 점: 구역 안에서 청록 계열(밝기 높고 b가 큼)은 전부 포함, 마스크 가장자리 이웃의 어두운 청록(b-r>40) 한 겹 더
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const o = at(B, x, y); if (B.d[o + 3] > 10 && !mask[y * B.w + x] && B.d[o + 2] - B.d[o] > 40 && B.d[o + 1] > B.d[o] + 22 && B.d[o] < 70) { let near = false; for (let dy = -2; dy <= 2 && !near; dy++) for (let dx = -2; dx <= 2; dx++) if (mask[(y + dy) * B.w + x + dx]) { near = true; break; } if (near) mask[y * B.w + x] = 1; } } }
const navy = (im, x, y) => { const o = at(im, x, y); return im.d[o + 3] > 200 && im.d[o] < 45 && im.d[o + 1] < 65 && im.d[o + 2] < 90 && !mask[y * im.w + x]; };
const open = { w: B.w, h: B.h, d: Buffer.from(B.d) }; let filled = 0, unfilled = 0;
for (let y = 0; y < B.h; y++) for (let x = 0; x < B.w; x++) { if (!mask[y * B.w + x]) continue; let best = null; for (let r = 1; r <= 20 && !best; r++) { let bd = 1e9; for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue; const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= B.w || Y >= B.h || !navy(B, X, Y)) continue; const d = dx * dx + dy * dy; if (d < bd) { bd = d; best = [X, Y]; } } }
  if (best) { B.d.copy(open.d, at(B, x, y), at(B, best[0], best[1]), at(B, best[0], best[1]) + 3); open.d[at(B, x, y) + 3] = B.d[at(B, x, y) + 3]; filled++; } else unfilled++; }
p.encode(open, path.join(V, 'BodyFeet_Open.png'));
// 팔 변형: 청록 조각 픽셀(원래 색·알파 그대로)을 팔 텍스처 좌표로 옮겨 붙임
function armGlint(arm, shiftX, extraLeft, extraRight, regionKey) {
  const out = p.blank(arm.w + extraLeft + extraRight, arm.h); for (let y = 0; y < arm.h; y++) arm.d.copy(out.d, ((y) * out.w + extraLeft) * 4, y * arm.w * 4, (y + 1) * arm.w * 4);
  const [x0, y0, x1, y1] = REG[regionKey]; let n = 0, clipped = 0;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (mask[y * B.w + x]) { const X = x + shiftX + extraLeft, Y = y - 2; if (X < 0 || Y < 0 || X >= out.w || Y >= out.h) { clipped++; continue; } B.d.copy(out.d, at(out, X, Y), at(B, x, y), at(B, x, y) + 4); n++; }
  return { img: out, n, clipped }; }
const L = armGlint(LA, 57, 0, 24, 'L'), R = armGlint(RA, -164, 20, 0, 'R');
p.encode(L.img, path.join(V, 'LeftArm_Glint.png')); p.encode(R.img, path.join(V, 'RightArm_Glint.png'));
const man = { ppu: 100, sprites: [{ name: 'BodyFeet_Open', file: 'BodyFeet_Open.png', w: open.w, h: open.h, pivot_px: [82, 95.5] }, { name: 'LeftArm_Glint', file: 'LeftArm_Glint.png', w: L.img.w, h: L.img.h, pivot_px: [28.5, 95.5] }, { name: 'RightArm_Glint', file: 'RightArm_Glint.png', w: R.img.w, h: R.img.h, pivot_px: [47.5, 95.5] }] };
fs.writeFileSync(path.join(V, 'manifest.json'), JSON.stringify(man, null, 1)); fs.writeFileSync(path.join(V, 'manifest.tsv'), man.sprites.map(s => [s.name, s.file, s.w, s.h, s.pivot_px[0], s.pivot_px[1]].join('\t')).join('\n'));
console.log('청록 조각 픽셀', mask.reduce((a, v) => a + v, 0), '메움', filled, '못 메움', unfilled, '| 팔로 옮긴 픽셀 L', L.n, '(잘림', L.clipped + ') R', R.n, '(잘림', R.clipped + ')');
