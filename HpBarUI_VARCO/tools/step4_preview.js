// 4단계: HP바 미리보기 (Unity 적용 아님). 숫자는 막대 가운데, 모든 막대는 캐릭터 아래, 레미 막대도 몬스터 막대와 같은 크기
const { p, blit } = require('../../RewardUI_VARCO/tools/lib_ui.js'), path = require('path'), fs = require('fs');
const R = path.join(__dirname, '..'), LAY = R + '/parts/layers';
const L = n => p.decode(`${LAY}/${n}.png`);
const meta = JSON.parse(fs.readFileSync(R + '/font/HpDigits.json', 'utf8'));
const atlas = {}; const A = c => atlas[c] || (atlas[c] = p.decode(`${R}/font/HpDigits_${c}.png`));
const K = 1.5; // 막대·숫자 배율 (게이지 1.5배 기준)
// 비정수 배율도 최근접으로 확대해 합성
function putAt(dst, src, ox, oy, k, cropW) { const w = Math.round((cropW ?? src.w) * k), h = Math.round(src.h * k); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const X = ox + x, Y = oy + y; if (X < 0 || Y < 0 || X >= dst.w || Y >= dst.h) continue; const s = (Math.floor(y / k) * src.w + Math.floor(x / k)) * 4; if (!src.d[s + 3]) continue; src.d.copy(dst.d, (Y * dst.w + X) * 4, s, s + 4); } }
const putC = (dst, src, cx, cy, k) => putAt(dst, src, Math.round(cx - src.w * k / 2), Math.round(cy - src.h * k / 2), k);
// 숫자 (k배). 비정수라 글자 칸 단위로 위치를 반올림해 그림
function digits(dst, color, str, x, y, k, align = 'c') { let tot = 0; for (const ch of str) if (meta.glyphs[ch]) tot += meta.glyphs[ch].advance * k; let pen = align === 'l' ? x : x - tot / 2; const a = A(color); for (const ch of str) { const g = meta.glyphs[ch]; if (!g) continue; if (g.w) { const sub = { w: g.w, h: g.h, d: Buffer.alloc(g.w * g.h * 4) }; for (let yy = 0; yy < g.h; yy++) a.d.copy(sub.d, yy * g.w * 4, ((g.y + yy) * a.w + g.x) * 4, ((g.y + yy) * a.w + g.x + g.w) * 4); putAt(dst, sub, Math.round(pen - k), Math.round(y - g.h * k / 2), k); } pen += g.advance * k; } return tot; }
const bg = (w, h, c = [14, 24, 45]) => { const im = p.blank(w, h); for (let i = 0; i < w * h; i++) { im.d[i * 4] = c[0]; im.d[i * 4 + 1] = c[1]; im.d[i * 4 + 2] = c[2]; im.d[i * 4 + 3] = 255; } return im; };
const WIN = { Lemy: [14, 4, 93, 11], Monster: [5, 4, 102, 11] }; // 창 x, y, 폭, 높이 (틀 기준)
// 막대 한 개: Track → Fill → Frame → 숫자(창 가운데). (cx,cy) = 막대 틀의 중심
function bar(dst, name, cx, cy, hp, max) {
  const frame = L(`T_Hp${name}_Frame`), track = L(`T_Hp${name}_Track`), fillI = L(`T_Hp${name}_Fill`), [wx, wy, ww, wh] = WIN[name];
  const ox = Math.round(cx - frame.w * K / 2), oy = Math.round(cy - frame.h * K / 2);
  putAt(dst, track, ox + Math.round(wx * K), oy + Math.round(wy * K), K);
  const cw = Math.max(0, Math.round(fillI.w * hp / max)); if (cw > 0) putAt(dst, fillI, ox + Math.round(wx * K), oy + Math.round(wy * K), K, cw);
  putAt(dst, frame, ox, oy, K);
  digits(dst, 'cream', `${hp} / ${max}`, ox + (wx + ww / 2) * K, oy + (wy + wh / 2) * K, K);
}
function lemy(dst, cx, cy, hp, max, shield) { bar(dst, 'Lemy', cx, cy, hp, max); if (shield > 0) { const iy = cy + 40, icon = L('T_HpShield_Icon'); const w = digits({ w: 1, h: 1, d: Buffer.alloc(4) }, 'cyan', `+${shield}`, 0, 0, K, 'l'); const total = icon.w * K + 6 + w, left = cx - total / 2; putAt(dst, icon, Math.round(left), Math.round(iy - icon.h * K / 2), K); digits(dst, 'cyan', `+${shield}`, left + icon.w * K + 6, iy, K, 'l'); } }
const mon = (dst, cx, cy, hp, max) => bar(dst, 'Monster', cx, cy, hp, max);

// (1) 시트
const S = bg(1200, 760);
lemy(S, 250, 70, 72, 100, 8); lemy(S, 250, 160, 100, 100, 0); lemy(S, 250, 230, 9, 100, 12);
mon(S, 700, 70, 12, 20); mon(S, 700, 130, 20, 20); mon(S, 700, 190, 3, 20); mon(S, 700, 250, 47, 70);
let y = 330; for (const n of ['T_HpLemy_Frame', 'T_HpLemy_Track', 'T_HpLemy_Fill']) { const im = L(n); putAt(S, im, 30, y, 3); y += im.h * 3 + 12; }
y = 330; for (const n of ['T_HpMonster_Frame', 'T_HpMonster_Track', 'T_HpMonster_Fill']) { const im = L(n); putAt(S, im, 450, y, 3); y += im.h * 3 + 12; }
const dg = (c, s, x, yy, k) => digits(S, c, s, x, yy, k, 'l'); dg('cream', '0123456789 / +', 830, 340, 3); dg('cyan', '+8 +12', 830, 390, 3);
putAt(S, L('T_HpShield_Icon'), 830, 430, 4);
p.encode(S, `${R}/preview/HpBars_Sheet.png`);

// (2) 게임 화면 시안: 기존 글자 자리를 지우고 새 막대 배치 (미리보기용이라 가까운 배경을 복사해 덮음)
const shot = p.decode(path.join(R, '../PauseUI_VARCO/refs/ref_ingame_full.png'));
const cover = (x0, y0, x1, y1, dx) => { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) shot.d.copy(shot.d, (y * shot.w + x) * 4, (y * shot.w + x - dx) * 4, (y * shot.w + x - dx) * 4 + 4); };
cover(1325, 100, 1485, 200, 170); cover(1500, 262, 1700, 390, 230); cover(1700, 262, 1890, 390, 250); cover(230, 335, 420, 365, 215);
// 모든 막대는 캐릭터 발 아래 (발 y≈262). 방패 줄은 레미 막대 바로 아래
lemy(shot, 322, 290, 85, 100, 8);
mon(shot, 1400, 290, 20, 20); mon(shot, 1597, 290, 40, 40); mon(shot, 1790, 290, 70, 70);
p.encode(shot, `${R}/preview/HpBars_InGame_Mock.png`);
console.log('저장: preview/HpBars_Sheet.png, preview/HpBars_InGame_Mock.png');
