// 적용 뒤 Unity 캡처를 확인 (작업 폴더 전용): 표식 4곳 ×2 확대 시트 + 합성 미리보기(V2 α1.0)와의 픽셀 차이
const path = require('path'), p = require('../../PauseUI_VARCO/tools/pix.js'), L = require('../../CrystalQueenRotLock_VARCO/tools/lib_view.js');
const SCR = 'C:/Users/MBC-501-15/AppData/Local/Temp/claude/C--Users-MBC-501-15-Documents-Tetrigeon/1c733b5f-5eba-4df7-aeda-bb7d619f695f/scratchpad/', OUT = path.join(__dirname, '..', 'output');
const after = p.decode(SCR + 'unity_seal_after_full.png'), none = p.decode(SCR + 'unity_seal_none_full.png'), before = p.decode(SCR + 'unity_seal_before_full.png');
const POS = [['Hold', 668, 458], ['조작 중', 947, 423], ['NEXT 1', 1266, 579], ['NEXT 2', 1266, 680]];
const tiles = []; for (const img of [before, after]) for (const [, x, y] of POS) tiles.push(p.nearestUp(p.crop(img, x - 60, y - 50, 120, 100), 2));
p.encode(L.grid(tiles, 4, 6, [0, 0, 0, 0, 1, 1, 1, 1]), path.join(OUT, 'RotSeal_applied_in-game_x2.png'));
// 합성 미리보기와 비교: 마커 영역(±27px) 안에서 캡처가 합성과 얼마나 다른지
const m = p.decode(path.join(OUT, 'markers', 'RotSeal_v2_bold_rune_medal_native.png'));
function stamp(img, cx, cy) { const o = { w: img.w, h: img.h, d: Buffer.from(img.d) }, x0 = Math.round(cx - m.w), y0 = Math.round(cy - m.h); for (let y = 0; y < m.h * 2; y++) for (let x = 0; x < m.w * 2; x++) { const q = (((y / 2) | 0) * m.w + ((x / 2) | 0)) * 4, a = m.d[q + 3] / 255; if (!a) continue; const r = ((y0 + y) * o.w + x0 + x) * 4; for (let c = 0; c < 3; c++) o.d[r + c] = Math.round(o.d[r + c] * (1 - a) + m.d[q + c] * a); } return o; }
let s = none; for (const [, x, y] of POS) s = stamp(s, x, y);
for (const [n, x, y] of POS) { let diff = 0, tot = 0, big = 0; for (let yy = y - 30; yy < y + 30; yy++) for (let xx = x - 30; xx < x + 30; xx++) { const q = (yy * 1920 + xx) * 4, d = Math.max(Math.abs(after.d[q] - s.d[q]), Math.abs(after.d[q + 1] - s.d[q + 1]), Math.abs(after.d[q + 2] - s.d[q + 2])); tot++; if (d > 0) diff++; if (d > 40) big++; } console.log(n, '창 60x60px 중 합성과 다른 픽셀', diff, '(큰 차이 >40:', big + ')'); }
