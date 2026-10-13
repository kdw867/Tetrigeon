// 수정여왕 SKILL 핵심 장면 4개 미리보기 (작업 폴더 전용, Unity 영상 아님): 저장된 이펙트 셀·승인된 일반공격 캐릭터 셀을 다시 읽어 합성한다.
const fs = require('fs'), path = require('path');
const p = require('../../PauseUI_VARCO/tools/pix.js');
const S = require('./skill_frames.js');
const OUT = S.OUT, INFO = JSON.parse(fs.readFileSync(path.join(OUT, 'SkillScenes_' + S.VER + '_build_info.json'), 'utf8')), BG = [40, 46, 60];
const rd = (f) => p.decode(path.join(OUT, f));
const CH = INFO.scenes.map(s => p.decode(path.join(OUT, s.character))), FXS = INFO.scenes.map(s => rd(s.fx));
const NORMAL_FX = INFO.scenes.map(s => { const f = path.join(S.ATK, 'CastFrames_v3_fx', 'CrystalQueen_CastFx_' + s.step + '.png'); return fs.existsSync(f) ? p.decode(f) : p.blank(160, 160); }); // 일반공격 이펙트(읽기 전용), 없는 단계(T14 등은 파일 없음 가능)는 빈 셀
const opaque = (w, h, col) => { const o = p.blank(w, h); for (let i = 0; i < w * h; i++) { o.d[i * 4] = col[0]; o.d[i * 4 + 1] = col[1]; o.d[i * 4 + 2] = col[2]; o.d[i * 4 + 3] = 255; } return o; };
const put = (o, cell, ox, oy, k, c0) => { for (let y = 0; y < 160; y++) for (let x = 0; x < 160; x++) { const s = (y * 160 + x) * 4; if (!cell.d[s + 3]) continue; for (let dy = 0; dy < k; dy++) for (let dx = 0; dx < k; dx++) { const X = ox + (x - c0[0]) * k + dx, Y = oy + (y - c0[1]) * k + dy; if (X < 0 || Y < 0 || X >= o.w || Y >= o.h) continue; cell.d.copy(o.d, (Y * o.w + X) * 4, s, s + 3); o.d[(Y * o.w + X) * 4 + 3] = 255; } } };
const DIG = ['111101101101111', '010110010010111', '111001111100111', '111001111001111', '101101111001001', '111100111001111', '111100111101111', '111001001001001', '111101111101111', '111101111001111'];
function label(o, x, y, text, k, col) { [...String(text)].forEach((ch, n) => { const g = DIG[+ch]; if (!g) return; for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) if (g[j * 3 + i] === '1') for (let dy = 0; dy < k; dy++) for (let dx = 0; dx < k; dx++) { const X = x + (n * 4 + i) * k + dx, Y = y + j * k + dy; if (X >= 0 && Y >= 0 && X < o.w && Y < o.h) { const q = (Y * o.w + X) * 4; o.d[q] = col[0]; o.d[q + 1] = col[1]; o.d[q + 2] = col[2]; o.d[q + 3] = 255; } } }); }
function grid(tiles, cols, gap, tag) { // 타일(같은 크기)을 격자로 모아 번호 표시
  const tw = tiles[0].w, th = tiles[0].h, rows = Math.ceil(tiles.length / cols), o = opaque(cols * tw + (cols - 1) * gap, rows * th + (rows - 1) * gap, [12, 14, 20]);
  tiles.forEach((t, i) => { const ox = (i % cols) * (tw + gap), oy = Math.floor(i / cols) * (th + gap); for (let y = 0; y < th; y++) t.d.copy(o.d, ((oy + y) * o.w + ox) * 4, y * t.w * 4, (y * t.w + tw) * 4); label(o, ox + 6, oy + 6, tag ? tag[i] : i + 1, 3, [255, 255, 255]); });
  return o;
}
const save = (img, name) => { const f = path.join(OUT, 'CrystalQueenSkill_KeyScenes_' + S.VER + '_' + name + '.png'); p.encode(img, f); console.log(path.basename(f), img.w + 'x' + img.h); };
// 1) 실제 게임 화면 합성 (이전 미리보기와 같은 계산): 스테이지 10 맨 오른쪽 보스 자리, 화면 위쪽 끝(y=0)부터 보이게 잘라 위쪽 여백을 확인
const scr = p.decode('C:/Users/MBC-501-15/Documents/Tetrigeon/CountdownUI_VARCO/work/game_screen_empty_board.png');
const PX = 960 + (5.9 + 1.8 - 0.15873016 * 1.4) * 108, PY = 540 - (3.1 + 0.43650794 * 1.4) * 108, SX = Math.round(PX - 80 * 2), SY = Math.round(PY - 88 * 2), TIGHT = [1600, 0, 320, 310];
const game = CH.map((c, i) => { const o = { w: scr.w, h: scr.h, d: Buffer.from(scr.d) }; for (const l of [c, FXS[i]]) put(o, l, SX, SY, 2, [0, 0]); return p.nearestUp(p.crop(o, TIGHT[0], TIGHT[1], TIGHT[2], TIGHT[3]), 2); });
save(grid(game, 2, 8), 'game-screen_x2');
// 2) 왕관·파동 확대: 셀 x 20~140, 줄 12~72 를 ×6 (캐릭터 + 이펙트, 평평한 배경)
const flat = (c, f, norm) => { const o = opaque(160, 160, BG); for (const l of norm ? [c, f] : [c, f]) put(o, l, 0, 0, 1, [0, 0]); return o; };
const closeup = CH.map((c, i) => p.nearestUp(p.crop(flat(c, FXS[i]), 20, 12, 120, 60), 6));
save(grid(closeup, 2, 8), 'crown-closeup_x6');
// 3) 일반공격 vs SKILL 나란히 (같은 단계, 같은 몸동작): 위 = 일반공격(수정 발사 포함), 아래 = SKILL
const side = [...CH.map((c, i) => p.nearestUp(p.crop(flat(c, NORMAL_FX[i]), 4, 12, 156, 138), 3)), ...CH.map((c, i) => p.nearestUp(p.crop(flat(c, FXS[i]), 4, 12, 156, 138), 3))];
save(grid(side, 4, 6, ['1', '2', '3', '4', '1', '2', '3', '4']), 'normal-vs-skill_x3');
// 4) 손 기운 색 비교 확대 (손 둘레 48x36 ×8): 위 = 일반공격 손 이펙트, 아래 = SKILL 손 기운
const hc = [S.HA, S.HB, S.HB, S.HB];
const handTile = (c, f, i) => { const cx = 2 * hc[i][0] + 1, cy = 2 * hc[i][1] + 1; return p.nearestUp(p.crop(flat(c, f), Math.max(0, cx - 24), cy - 18, 48, 36), 8); };
save(grid([...CH.map((c, i) => handTile(c, NORMAL_FX[i], i)), ...CH.map((c, i) => handTile(c, FXS[i], i))], 4, 6, ['1', '2', '3', '4', '1', '2', '3', '4']), 'hands-normal-vs-skill_x8');
// 5) 위쪽 여백 수치 (게임 화면 기준)
let top = 999, topId = ''; FXS.forEach((f, i) => { for (let y = 0; y < 160; y++) for (let x = 0; x < 160; x++) if (f.d[(y * 160 + x) * 4 + 3]) { if (y < top) { top = y; topId = INFO.scenes[i].step; } break; } });
console.log('이펙트 맨 위 셀 줄', top, '(' + topId + ') → 화면 y', SY + 2 * top, '| 셀 원점 화면', SX, SY, '| 화면 맨 위 y=0');
