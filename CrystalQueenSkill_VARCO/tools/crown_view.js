// 왕관 도안 확대 확인 (작업 폴더 전용): 도안을 서로 다른 배경 3개 위에 ×14 로 나란히 그려 읽히는지 본다
const path = require('path');
const p = require('../../PauseUI_VARCO/tools/pix.js'), FX = require('./fx_skill.js'), CA = require('./crown_art.js');
const rows = CA.build(process.argv[3] || 'a'), K = 14, BGS = [[40, 46, 60], [158, 58, 251], [22, 74, 104]]; // 어두운 배경 / 여왕 수정색 / 동굴 청록
const w = rows[0].length * 2, h = rows.length * 2, tiles = BGS.map(bg => { const c = p.blank(w + 8, h + 8); for (let i = 0; i < c.w * c.h; i++) { c.d[i * 4] = bg[0]; c.d[i * 4 + 1] = bg[1]; c.d[i * 4 + 2] = bg[2]; c.d[i * 4 + 3] = 255; }
  rows.forEach((r, j) => [...r].forEach((ch, i) => { if (ch === '.') return; const col = FX.PAL[ch]; for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) { const o = ((4 + 2 * j + y) * c.w + 4 + 2 * i + x) * 4; c.d[o] = col[0]; c.d[o + 1] = col[1]; c.d[o + 2] = col[2]; } }));
  return p.nearestUp(c, K); });
const o = p.blank(tiles.reduce((a, t) => a + t.w + 6, 0), tiles[0].h); let x = 0; for (const t of tiles) { for (let y = 0; y < t.h; y++) t.d.copy(o.d, (y * o.w + x) * 4, y * t.w * 4, (y + 1) * t.w * 4); x += t.w + 6; }
p.encode(o, path.join(__dirname, '..', 'output', process.argv[2] || 'probe_crown.png')); console.log(rows.join('\n'), '\n', o.w + 'x' + o.h);
