// 회전 잠금 미리보기 공용 도우미 (작업 폴더 전용): 셀 합성·확대·번호 표시. 승인된 일반공격 캐릭터 셀은 읽기 전용으로만 읽는다.
const fs = require('fs'), path = require('path');
const p = require('../../PauseUI_VARCO/tools/pix.js'), F = require('./fx_rotlock.js'), S = F.S;
const OUT = path.join(__dirname, '..', 'output'), BG = [40, 46, 60];
const opaque = (w, h, col) => { const o = p.blank(w, h); for (let i = 0; i < w * h; i++) { o.d[i * 4] = col[0]; o.d[i * 4 + 1] = col[1]; o.d[i * 4 + 2] = col[2]; o.d[i * 4 + 3] = 255; } return o; };
const put = (o, cell, ox, oy, k, c0) => { for (let y = 0; y < cell.h; y++) for (let x = 0; x < cell.w; x++) { const s = (y * cell.w + x) * 4; if (!cell.d[s + 3]) continue; for (let dy = 0; dy < k; dy++) for (let dx = 0; dx < k; dx++) { const X = ox + (x - c0[0]) * k + dx, Y = oy + (y - c0[1]) * k + dy; if (X < 0 || Y < 0 || X >= o.w || Y >= o.h) continue; cell.d.copy(o.d, (Y * o.w + X) * 4, s, s + 3); o.d[(Y * o.w + X) * 4 + 3] = 255; } } };
const DIG = ['111101101101111', '010110010010111', '111001111100111', '111001111001111', '101101111001001', '111100111001111', '111100111101111', '111001001001001', '111101111101111', '111101111001111'];
function label(o, x, y, text, k, col) { [...String(text)].forEach((ch, n) => { const g = DIG[+ch]; if (!g) return; for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) if (g[j * 3 + i] === '1') for (let dy = 0; dy < k; dy++) for (let dx = 0; dx < k; dx++) { const X = x + (n * 4 + i) * k + dx, Y = y + j * k + dy; if (X >= 0 && Y >= 0 && X < o.w && Y < o.h) { const q = (Y * o.w + X) * 4; o.d[q] = col[0]; o.d[q + 1] = col[1]; o.d[q + 2] = col[2]; o.d[q + 3] = 255; } } }); }
function grid(tiles, cols, gap, tag) { // 같은 크기 타일을 격자로 모아 번호 표시
  const tw = tiles[0].w, th = tiles[0].h, rows = Math.ceil(tiles.length / cols), o = opaque(cols * tw + (cols - 1) * gap, rows * th + (rows - 1) * gap, [12, 14, 20]);
  tiles.forEach((t, i) => { const ox = (i % cols) * (tw + gap), oy = Math.floor(i / cols) * (th + gap); for (let y = 0; y < th; y++) t.d.copy(o.d, ((oy + y) * o.w + ox) * 4, y * t.w * 4, (y * t.w + tw) * 4); label(o, ox + 6, oy + 6, tag ? tag[i] : i + 1, 3, [255, 255, 255]); });
  return o;
}
const bodyCell = (id) => p.decode(path.join(S.ATK, S.step(id).character)); // 승인된 일반공격 v3 몸 셀 (읽기 전용)
const normalFx = (id) => { const f = path.join(S.ATK, 'CastFrames_v3_fx', 'CrystalQueen_CastFx_' + id + '.png'); return fs.existsSync(f) ? p.decode(f) : p.blank(160, 160); };
const growthFx = (id) => { const f = path.join(__dirname, '..', '..', 'CrystalQueenSkill_VARCO', 'output', 'SkillFrames_v1_fx', 'CrystalQueenSkill_Fx_' + id + '.png'); return fs.existsSync(f) ? p.decode(f) : p.blank(160, 160); };
const flat = (body, fx, bg) => { const o = opaque(160, 160, bg || BG); put(o, body, 0, 0, 1, [0, 0]); put(o, fx, 0, 0, 1, [0, 0]); return o; };
// 실제 게임 화면 합성 (이전 SKILL 미리보기와 같은 계산): 스테이지 10 맨 오른쪽 보스 자리, 셀 원점 화면 (SX,SY), 배율 2
const SCR = () => p.decode('C:/Users/MBC-501-15/Documents/Tetrigeon/CountdownUI_VARCO/work/game_screen_empty_board.png');
const PX = 960 + (5.9 + 1.8 - 0.15873016 * 1.4) * 108, PY = 540 - (3.1 + 0.43650794 * 1.4) * 108, SX = Math.round(PX - 80 * 2), SY = Math.round(PY - 88 * 2);
const onScreen = (scr, body, fx) => { const o = { w: scr.w, h: scr.h, d: Buffer.from(scr.d) }; for (const l of [body, fx]) put(o, l, SX, SY, 2, [0, 0]); return o; };
module.exports = { OUT, BG, opaque, put, label, grid, bodyCell, normalFx, growthFx, flat, SCR, SX, SY, onScreen, S, F, p };
