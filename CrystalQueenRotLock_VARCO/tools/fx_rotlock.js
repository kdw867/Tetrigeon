// 수정여왕 회전 잠금 SKILL 이펙트 도안 (작업 폴더 전용, Unity와 무관): 게임 Idle 과 같은 "2x2 스프라이트 픽셀 = 도트 1칸" 격자(블록 위상 (1,1)), 같은 160x160 셀 좌표·피벗.
// 몸동작 = 승인된 일반공격 v3 셀·시간표 그대로(읽기 전용 재사용). 여기서는 이펙트 층(손 기운 + 회전 룬 + 자물쇠 + 봉인 섬광)만 만든다. 증식(금빛 왕관)·일반공격(연보라 수정)과 구분되도록 푸른 보라·은청색만 쓴다.
const p = require('../../PauseUI_VARCO/tools/pix.js');
const S = require('../../CrystalQueenSkill_VARCO/tools/skill_frames.js'); // 일반공격 시간표·손 중심 블록 (읽기 전용 재사용)
// 팔레트: 윤곽 N(여왕 윤곽색 그대로) + 푸른 보라 5단계(a~e) + 백색 + 자물쇠 쇠붙이 S
const PAL = { N: [15, 23, 54], a: [56, 52, 190], b: [88, 96, 245], c: [132, 146, 255], d: [182, 194, 255], e: [226, 230, 255], W: [255, 255, 255], S: [176, 186, 208], k: [240, 243, 252] };
const ORDER = 'abcde';
const up = (ch, n) => (ORDER.includes(ch) ? ORDER[Math.min(4, ORDER.indexOf(ch) + n)] : ch); // 한 단계 밝게 (백색·윤곽·쇠붙이는 그대로)
// ── 손 기운: 증식·일반공격과 같은 모양·크기·자리, 색만 푸른 보라 (테두리 d, 안쪽 b·c, 중심 W)
const AURA_GROWTH = {
  aura1: ['.G.', '.P.', 'GWG', '.P.', '.G.'], aura2: ['..G..', '..P..', '.GBG.', 'GPWPG', '.GBG.', '..P..', '..G..'], auraS: ['..G..', '.GBG.', 'GPWPG', '.GBG.', '..G..'],
  auraBig: ['....G....', '.G..P..G.', '..G.B.G..', '...PBP...', 'GPBBWBBPG', '...PBP...', '..G.B.G..', '.G..P..G.', '....G....'],
  fade1: ['G...G', '.....', '..P..', '.....', 'G...G'], fade2: ['.....', '.G...', '.....', '...P.', '.....']
};
const RECOLOR = { G: 'd', P: 'b', B: 'c', W: 'W', '.': '.' }, RECOLOR_BRIGHT = { G: 'e', P: 'c', B: 'd', W: 'W', '.': '.' };
const ART = {};
for (const [k, rows] of Object.entries(AURA_GROWTH)) { ART[k] = rows.map(r => [...r].map(ch => RECOLOR[ch]).join('')); ART[k + 'Bright'] = rows.map(r => [...r].map(ch => RECOLOR_BRIGHT[ch]).join('')); }
ART.seed3 = ['.d.', 'dWd', '.d.']; // 룬 자리에 생기는 작은 빛
ART.seed5 = ['..c..', '..d..', 'cdWdc', '..d..', '..c..']; // 조금 커진 빛
// ── 자물쇠: 윤곽 N 이 없어도 실루엣이 읽히도록 고리 = 은회색 S, 몸통 = 흰색 k, 열쇠구멍 = N. 윤곽 N 은 바깥에 자동으로 한 겹 두름(4방향)
const LOCK_INNER = { // 안쪽 도안 (가로 5): 닫힘 = 고리가 몸통에 박힘 / 거의 닫힘 = 고리가 한 줄 떠 있음 / 열림 = 고리가 떠 있고 오른쪽 다리가 풀려 있음
  closed: ['.SSS.', 'S...S', 'kkkkk', 'kkNkk', 'kkkkk'],
  near: ['.SSS.', 'S...S', '.....', 'kkkkk', 'kkNkk', 'kkkkk'],
  open: ['.SSS.', 'S...S', 'S....', 'kkkkk', 'kkNkk', 'kkkkk']
};
function outline(inner) { // 안쪽 도안 둘레에 윤곽 N 한 겹 (4방향 이웃이 비어 있지 않은 빈 칸)
  const h = inner.length + 2, w = inner[0].length + 2, g = []; for (let y = 0; y < h; y++) { g[y] = []; for (let x = 0; x < w; x++) g[y][x] = (y > 0 && y < h - 1 && x > 0 && x < w - 1) ? inner[y - 1][x - 1] : '.'; }
  const o = g.map(r => r.slice()); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (g[y][x] === '.') for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < w && Y < h && g[Y][X] !== '.') { o[y][x] = 'N'; break; } }
  return o.map(r => r.join(''));
}
const lockArt = (state) => outline(LOCK_INNER[state]); // 윤곽 포함 7x7(닫힘) / 7x8(거의 닫힘·열림)
const LOCK_UI = outline(['.SSS.', 'S...S', 'S...S', 'kkkkk', 'kkNkk', 'kkNkk', 'kkkkk']); // 별도 재사용용 자물쇠 아이콘 7x9 도트(윤곽 포함, 닫힘)
// ── 회전 룬: 화살촉 달린 호 두 개가 같은 방향(시계)으로 도는 고리. 중심 블록, 중심선 반지름, 호 시작·끝 각도(화면 y 아래쪽이 +)
const PLACE_A = process.env.ROTLOCK_PLACE === 'A'; // A = 몸과 겹치지 않는 좌상단 고정(핵심 장면 v1 재현용), 기본 = B(머리 위, 겹침 허용, 사용자 선택 2026-10-14)
const RC = PLACE_A ? [16, 19] : [34, 19], RR_DEF = 6, A0 = -25, A1 = 95, HEAD_DEG = 30, HEAD_HALF = 2.2, DEG = Math.PI / 180;
function ringMap(rho, RR = RR_DEF) { // 회전각 rho(도) 에서의 룬: 블록 오프셋 "x,y" → 글자 (몸 + 화살촉 + 윤곽 N)
  const m = new Map(), set = (x, y, c) => { m.set(x + ',' + y, c); };
  for (let k = 0; k < 2; k++) {
    for (let a = A0; a <= A1; a += 0.25) { const th = (a + 180 * k + rho) * DEG, t = (a - A0) / (A1 - A0); set(Math.round(RR * Math.cos(th)), Math.round(RR * Math.sin(th)), t < 0.35 ? 'b' : t < 0.7 ? 'c' : 'd'); } // 꼬리 쪽 어둡고 머리 쪽 밝음
    const e = (A1 + 180 * k + rho) * DEG, f = (A1 + HEAD_DEG + 180 * k + rho) * DEG; // 화살촉: 호 끝에서 진행 방향으로 뻗는 삼각형
    const T = [[(RR + HEAD_HALF) * Math.cos(e), (RR + HEAD_HALF) * Math.sin(e)], [(RR - HEAD_HALF) * Math.cos(e), (RR - HEAD_HALF) * Math.sin(e)], [RR * Math.cos(f), RR * Math.sin(f)]];
    const sgn = (a, b, c) => (a[0] - c[0]) * (b[1] - c[1]) - (b[0] - c[0]) * (a[1] - c[1]);
    let tip = null, best = 1e9;
    for (let y = -9; y <= 9; y++) for (let x = -9; x <= 9; x++) {
      const P = [x, y], d1 = sgn(P, T[0], T[1]), d2 = sgn(P, T[1], T[2]), d3 = sgn(P, T[2], T[0]), neg = d1 < -0.2 || d2 < -0.2 || d3 < -0.2, pos = d1 > 0.2 || d2 > 0.2 || d3 > 0.2;
      if (neg && pos) continue; set(x, y, 'd'); const dd = Math.hypot(x - T[2][0], y - T[2][1]); if (dd < best) { best = dd; tip = [x, y]; }
    }
    if (tip) set(tip[0], tip[1], 'W'); // 화살촉 끝에 백색 한 점
  }
  const body = [...m.keys()]; for (const key of body) { const [x, y] = key.split(',').map(Number); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const q = (x + dx) + ',' + (y + dy); if (!m.has(q)) m.set(q, 'N'); } } // 4방향 윤곽
  return m;
}
const blank = () => p.blank(160, 160);
function dot(cell, i, j, ch) { const c = PAL[ch]; for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) { const X = 2 * i + 1 + x, Y = 2 * j + 1 + y; if (X < 0 || Y < 0 || X >= 160 || Y >= 160) throw new Error('이펙트가 셀 밖: ' + X + ',' + Y); const o = (Y * 160 + X) * 4; cell.d[o] = c[0]; cell.d[o + 1] = c[1]; cell.d[o + 2] = c[2]; cell.d[o + 3] = 255; } }
function stamp(cell, rows, i0, j0, keep) { rows.forEach((row, dj) => [...row].forEach((ch, di) => { if (ch !== '.' && (!keep || keep(i0 + di, j0 + dj))) dot(cell, i0 + di, j0 + dj, ch); })); }
const stampC = (cell, key, ci, cj, keep) => stamp(cell, ART[key], ci - (ART[key][0].length >> 1), cj - (ART[key].length >> 1), keep);
const half = (i, j) => (i + j) % 2 === 0; // 나타남·사라짐 솎음 (바둑판)
function drawRing(cell, rho, shift, keep) { for (const [key, ch] of ringMap(rho)) { const [x, y] = key.split(',').map(Number); if (!keep || keep(RC[0] + x, RC[1] + y)) dot(cell, RC[0] + x, RC[1] + y, up(ch, shift)); } }
function drawLock(cell, state, keep) { const art = lockArt(state); stamp(cell, art, RC[0] - 3, RC[1] + 3 - (art.length - 1), keep); } // 몸통 아랫줄을 룬 중심 아래 3줄에 맞춤
function drawCross(cell, arm) { // 봉인 섬광: 자물쇠 고리 왼쪽 위의 십자 반짝임 (가운데 W, 안쪽 e, 끝 d, 길이 arm)
  const ci = RC[0] - 2, cj = RC[1] - 3; dot(cell, ci, cj, 'W');
  for (let n = 1; n <= arm; n++) { const ch = n <= 1 ? 'e' : 'd'; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) dot(cell, ci + dx * n, cj + dy * n, ch); }
}
// 단계별 이펙트 (일반공격과 같은 17단계·같은 ms). 반환 null = 이펙트 층 비어 있음
const RHO = { T06: -111, T07: -86, T08: -61, T09: -36, T10: -11 }; // 회전각(도): 약 0.42°/ms 로 돌다가 T11(620ms)에 0°에서 딱 멈춤 (총 약 111°, 1/3 바퀴 이내)
const RCX = { T04: 49, T05: 49, T06: 49, T07: 49, T08: 41, T09: 34, T10: 34, T11: 34, T12: 34, T13: 34, T14: 34 }; // B: 룬 중심 열(블록) = 단계별 머리 맨 위 열(몸 셀에서 측정: 뒤로 기울면 49, 중간 41, 앞으로 15도 33.5→34), 줄 19 고정(화면에 보이는 맨 위)
function buildFx(id) {
  if (!PLACE_A && RCX[id] !== undefined) RC[0] = RCX[id];
  const cell = blank(), HA = S.HA, HR1 = S.HR1, HB = S.HB, ac = (k, h) => { const a = ART[k][0].length >> 1, b = ART[k].length >> 1; stamp(cell, ART[k], h[0] - a, h[1] - b); };
  switch (id) {
    case 'T04': ac('aura1', HA); stampC(cell, 'seed3', ...RC); break; // 손 기운 시작 + 룬 자리에 작은 빛
    case 'T05': ac('aura2', HA); stampC(cell, 'seed5', ...RC); break; // 손 기운 + 빛이 조금 커짐
    case 'T06': ac('aura2', HA); drawRing(cell, RHO.T06, 0, half); break; // 룬이 바둑판 솎음으로 드러남(회전 시작)
    case 'T07': ac('aura2', HA); drawRing(cell, RHO.T07, 0); break; // 룬 선명 + 회전
    case 'T08': ac('auraS', HR1); drawRing(cell, RHO.T08, 0); drawLock(cell, 'open', half); break; // 자물쇠가 열린 채 흐릿하게 나타남
    case 'T09': ac('auraBig', HB); drawRing(cell, RHO.T09, 0); drawLock(cell, 'open'); break; // 열린 자물쇠
    case 'T10': ac('auraBig', HB); drawRing(cell, RHO.T10, 0); drawLock(cell, 'near'); break; // 고리가 내려오는 중 (룬은 아직 회전)
    case 'T11': ac('auraBigBright', HB); drawRing(cell, 0, 1); drawLock(cell, 'closed'); drawCross(cell, 2); break; // 잠금 완료 = 룬 정지 + 십자 섬광 + 손 기운 밝아짐 (기준 시점)
    case 'T12': ac('fade1', HB); drawRing(cell, 0, 1); drawLock(cell, 'closed'); drawCross(cell, 1); break; // 잠긴 형태 유지 + 작은 십자, 손 기운 약해짐
    case 'T13': ac('fade2', HB); drawRing(cell, 0, 0); drawLock(cell, 'closed'); break; // 잠긴 형태 유지
    case 'T14': drawRing(cell, 0, 0, half); drawLock(cell, 'closed', half); break; // 흐려지며 소멸 시작
    default: return null; // T00~T03(기운 없음), T15·T16(모두 사라짐)
  }
  return cell;
}
module.exports = { PAL, ART, LOCK_UI, RC, RR: RR_DEF, RHO, ringMap, lockArt, outline, buildFx, blank, dot, stamp, S };
