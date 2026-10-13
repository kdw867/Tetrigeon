// VARCO 입력용: 현재 승인 왕관 도안을 x8 로 키워 단색 배경 위에 둔 작은 PNG (작업 폴더 전용)
const path = require('path'), p = require('../../PauseUI_VARCO/tools/pix.js'), FX = require('./fx_skill.js');
const rows = FX.ART.crown, K = 8, W = 192, H = 128, BG = [30, 32, 46], c = p.blank(W, H);
for (let i = 0; i < W * H; i++) { c.d[i * 4] = BG[0]; c.d[i * 4 + 1] = BG[1]; c.d[i * 4 + 2] = BG[2]; c.d[i * 4 + 3] = 255; }
const ox = ((W - rows[0].length * 2 * K) >> 1), oy = ((H - rows.length * 2 * K) >> 1);
rows.forEach((r, j) => [...r].forEach((ch, i) => { if (ch === '.') return; const col = FX.PAL[ch]; for (let y = 0; y < 2 * K; y++) for (let x = 0; x < 2 * K; x++) { const o = ((oy + j * 2 * K + y) * W + ox + i * 2 * K + x) * 4; c.d[o] = col[0]; c.d[o + 1] = col[1]; c.d[o + 2] = col[2]; } }));
const f = path.join(__dirname, '..', 'output', 'varco_in', 'crown_current_x16_in.png'); p.encode(c, f);
const b = require('fs').readFileSync(f); console.log(f, W + 'x' + H, b.length + 'B', 'base64 ' + b.toString('base64').length + '자');
require('fs').writeFileSync(path.join(__dirname, '..', 'output', 'varco_in', 'crown_current_x16_in.b64.txt'), b.toString('base64'));
