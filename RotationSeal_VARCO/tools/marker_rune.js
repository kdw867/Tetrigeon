// 회전 금지 표식 시안 (작업 폴더 전용, Unity와 무관): 수정여왕 회전 잠금 SKILL 의 룬(화살촉 호 두 개 + 자물쇠)을 미노 위에 얹는 표식으로 굵게 키운다.
// 1도트 = 네이티브 1px, 게임에서는 2px/도트(스프라이트 PPU 54)로 표시. 팔레트·자물쇠·화살촉 규칙은 SKILL 룬과 같다(CrystalQueenRotLock_VARCO/tools/fx_rotlock.js).
const fs = require('fs'), path = require('path');
const p = require('../../PauseUI_VARCO/tools/pix.js'), F = require('../../CrystalQueenRotLock_VARCO/tools/fx_rotlock.js');
const PAL = F.PAL, OUT = path.join(__dirname, '..', 'output'), DEG = Math.PI / 180;
const PLATE = [20, 26, 64];
// 캔버스: 정사각 n x n 도트, 중심 정수 칸. grid[y][x] = 글자(팔레트) / 'P'(판) / '.'(없음)
function canvas(n) { return { n, c: (n - 1) / 2, g: Array.from({ length: n }, () => Array(n).fill('.')) }; }
function toImg(cv, plateAlpha) { const o = p.blank(cv.n, cv.n); for (let y = 0; y < cv.n; y++) for (let x = 0; x < cv.n; x++) { const ch = cv.g[y][x]; if (ch === '.') continue; const q = (y * cv.n + x) * 4, c = ch === 'P' ? PLATE : PAL[ch]; o.d[q] = c[0]; o.d[q + 1] = c[1]; o.d[q + 2] = c[2]; o.d[q + 3] = ch === 'P' ? plateAlpha : 255; } return o; }
function dilateN(cv) { const n = cv.n, src = cv.g.map(r => r.slice()); for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (src[y][x] === '.') for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < n && Y < n && src[Y][X] !== '.' && src[Y][X] !== 'P') { cv.g[y][x] = 'N'; break; } } }
// 굵은 룬: 중심선 반지름 R, 두께 th(도트), 호 두 개(각 arcDeg) + 시계 방향 화살촉(길이 headDeg, 반너비 half)
function rune(cv, { R, th, arcDeg, headDeg, half, rho = 0, plateR = 0, bright = 0 }) {
  const n = cv.n, c = cv.c, A0 = -25;
  if (plateR) for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (Math.hypot(x - c, y - c) <= plateR) cv.g[y][x] = 'P'; // 어두운 바탕 판
  const body = new Map();
  for (let k = 0; k < 2; k++) {
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const dx = x - c, dy = y - c, d = Math.hypot(dx, dy); if (Math.abs(d - R) > th / 2) continue;
      let a = Math.atan2(dy, dx) / DEG - (A0 + 180 * k + rho); a = ((a % 360) + 360) % 360; if (a > arcDeg) continue; const t = a / arcDeg;
      body.set(x + ',' + y, t < 0.35 ? 'b' : t < 0.7 ? 'c' : 'd');
    }
    const e = (A0 + arcDeg + 180 * k + rho) * DEG, f = (A0 + arcDeg + headDeg + 180 * k + rho) * DEG;
    const T = [[c + (R + half) * Math.cos(e), c + (R + half) * Math.sin(e)], [c + (R - half) * Math.cos(e), c + (R - half) * Math.sin(e)], [c + R * Math.cos(f), c + R * Math.sin(f)]];
    const sgn = (a, b2, q) => (a[0] - q[0]) * (b2[1] - q[1]) - (b2[0] - q[0]) * (a[1] - q[1]); let tip = null, best = 1e9;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const P = [x, y], d1 = sgn(P, T[0], T[1]), d2 = sgn(P, T[1], T[2]), d3 = sgn(P, T[2], T[0]), neg = d1 < -0.2 || d2 < -0.2 || d3 < -0.2, pos = d1 > 0.2 || d2 > 0.2 || d3 > 0.2; if (neg && pos) continue; body.set(x + ',' + y, 'e'); const dd = Math.hypot(x - T[2][0], y - T[2][1]); if (dd < best) { best = dd; tip = [x, y]; } }
    if (tip) body.set(tip[0] + ',' + tip[1], 'W');
  }
  const up = (ch) => F.PAL[ch] && 'abcde'.includes(ch) ? 'abcde'[Math.min(4, 'abcde'.indexOf(ch) + bright)] : ch;
  for (const [k, ch] of body) { const [x, y] = k.split(',').map(Number); cv.g[y][x] = up(ch); }
}
function lock(cv, dy = 0) { const art = F.LOCK_UI, w = art[0].length, h = art.length, x0 = cv.c - (w - 1) / 2, y0 = Math.round(cv.c - (h - 1) / 2 + dy); art.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== '.') cv.g[y0 + j][x0 + i] = ch; })); }
function lockSmall(cv) { const art = F.lockArt('closed'), w = art[0].length, h = art.length, x0 = cv.c - (w - 1) / 2, y0 = Math.round(cv.c - (h - 1) / 2); art.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== '.') cv.g[y0 + j][x0 + i] = ch; })); }
const V = {};
// V1: 스킬에서 나오는 룬 그대로(반지름 6, 가는 1도트 선) — 같은 2px/도트 크기
{ const cv = canvas(21); rune(cv, { R: 6, th: 1.05, arcDeg: 120, headDeg: 40, half: 2.2 }); dilateN(cv); lockSmall(cv); V.v1_skill_rune_asis = toImg(cv, 235); }
// V2: 굵은 룬 + 어두운 판(메달): 반지름 8, 두께 2, 큰 화살촉, 자물쇠 7x9
{ const cv = canvas(27); rune(cv, { R: 8.2, th: 2.1, arcDeg: 112, headDeg: 38, half: 3.3, plateR: 9.6, bright: 0 }); dilateN(cv); lock(cv); V.v2_bold_rune_medal = toImg(cv, 235); }
// V3: 굵은 룬, 판 없음(어두운 윤곽만)
{ const cv = canvas(27); rune(cv, { R: 8.2, th: 2.1, arcDeg: 112, headDeg: 38, half: 3.3, plateR: 0, bright: 0 }); dilateN(cv); lock(cv); V.v3_bold_rune_noplate = toImg(cv, 235); }
fs.mkdirSync(path.join(OUT, 'markers'), { recursive: true });
for (const [k, img] of Object.entries(V)) { p.encode(img, path.join(OUT, 'markers', 'RotSeal_' + k + '_native.png')); p.encode(p.nearestUp(img, 8), path.join(OUT, 'markers', 'RotSeal_' + k + '_x8.png')); console.log(k, img.w + 'x' + img.h); }
module.exports = { V };
