// 표식 시안을 실제 Unity 게임 화면(표식 없는 캡처) 위에 같은 자리·같은 크기(2px/도트)로 얹어 비교 (작업 폴더 전용, 합성 미리보기)
const fs = require('fs'), path = require('path');
const p = require('../../PauseUI_VARCO/tools/pix.js'), L = require('../../CrystalQueenRotLock_VARCO/tools/lib_view.js');
const OUT = path.join(__dirname, '..', 'output'), SCR = 'C:/Users/MBC-501-15/AppData/Local/Temp/claude/C--Users-MBC-501-15-Documents-Tetrigeon/1c733b5f-5eba-4df7-aeda-bb7d619f695f/scratchpad/';
const base = p.decode(SCR + 'unity_seal_none_full.png'), before = p.decode(SCR + 'unity_seal_before_full.png');
const POS = [['Hold', 668, 458], ['조작 중', 947, 423], ['NEXT 1', 1266, 579], ['NEXT 2', 1266, 680]]; // Unity 에서 잰 표식 중심(화면 px)
function stamp(img, marker, cx, cy, k, alpha) { const o = { w: img.w, h: img.h, d: Buffer.from(img.d) }, x0 = Math.round(cx - marker.w * k / 2), y0 = Math.round(cy - marker.h * k / 2); for (let y = 0; y < marker.h * k; y++) for (let x = 0; x < marker.w * k; x++) { const q = ((y / k | 0) * marker.w + (x / k | 0)) * 4, a = marker.d[q + 3] / 255 * alpha; if (!a) continue; const r = ((y0 + y) * o.w + x0 + x) * 4; for (let c = 0; c < 3; c++) o.d[r + c] = Math.round(o.d[r + c] * (1 - a) + marker.d[q + c] * a); } return o; }
const variants = process.argv[2] ? JSON.parse(process.argv[2]) : [['v1_skill_rune_asis', 0.86], ['v2_bold_rune_medal', 0.86], ['v2_bold_rune_medal', 1.0], ['v3_bold_rune_noplate', 0.86]];
const rows = [{ label: '현재', shot: before }];
for (const [name, a] of variants) { const m = p.decode(path.join(OUT, 'markers', 'RotSeal_' + name + '_native.png')); let s = base; for (const [, x, y] of POS) s = stamp(s, m, x, y, 2, a); rows.push({ label: name + ' α' + a, shot: s }); }
const tiles = []; for (const r of rows) for (const [, x, y] of POS) tiles.push(p.nearestUp(p.crop(r.shot, x - 60, y - 50, 120, 100), 2));
const g = L.grid(tiles, POS.length, 6, rows.flatMap((r, i) => POS.map(() => i)));
const f = path.join(OUT, 'RotSeal_candidates_in-game_x2.png'); p.encode(g, f); console.log(path.basename(f), g.w + 'x' + g.h, rows.map(r => r.label).join(' | '));
