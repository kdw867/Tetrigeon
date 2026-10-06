// 3단계: 보상 화면 미리보기(1920x1080). 승인 전이라 Unity에는 아무것도 넣지 않고 이 폴더의 그림만 합성한다.
// 미노는 게임에 이미 있는 강화 외형, 아이콘은 기존 T_Ability_*, 글자는 비트맵 글꼴, 틀·버튼·제목은 parts/ 의 그림
const { p, R, text, blit, fill, measure } = require('./lib_ui.js'), fs = require('fs'), path = require('path');
const ASSETS = path.join(R, '../Tetrigeon/Assets/@Resources');
const [setName = 'A'] = process.argv.slice(2);

// 미리보기에 쓸 세 장: [미노, 현재 레벨]. A는 컨셉 아트와 같은 구성, B는 다른 능력·레벨(수정 안내 포함)
const SETS = { A: [['S', 0], ['T', 0], ['O', 0]], B: [['L', 1], ['J', 2], ['I', 4]], C: [['Z', 0], ['T', 2], ['O', 4]] };
const NAMES = { I: 'PIERCE', J: 'FREEZE', L: 'CRITICAL', O: 'SHIELD', S: 'HEAL', T: 'POISON', Z: 'EXPLOSION' };
const ICONS = { I: 'Pierce', J: 'Freeze', L: 'Critical', O: 'Shield', S: 'Heal', T: 'Poison', Z: 'Explosion' };
// 효과 수치: CombatManager.AbilityValue(type, 1, level)와 같은 식 (한 줄 = 피해 1), Mathf.RoundToInt는 .5를 짝수로 반올림
const rte = v => { const f = Math.floor(v), d = v - f; return d < 0.5 ? f : d > 0.5 ? f + 1 : (f % 2 === 0 ? f : f + 1); };
const AV = { I: n => rte(1 * (0.5 + 0.5 * n)), J: n => rte(0.5 * n), L: n => 1 * (1 + n), O: n => 2 * n, S: n => 2 * n, T: n => rte(0.7 * n), Z: n => rte(0.7 * n) };
// 스폰 모양 칸 좌표 (TetrominoData.SpawnCells, 칸 번호 순서 = 아트 번호)
const CELLS = { I: [[0, 2], [1, 2], [2, 2], [3, 2]], O: [[1, 1], [2, 1], [1, 2], [2, 2]], T: [[1, 2], [0, 1], [1, 1], [2, 1]], S: [[1, 2], [2, 2], [0, 1], [1, 1]], Z: [[0, 2], [1, 2], [1, 1], [2, 1]], J: [[0, 2], [0, 1], [1, 1], [2, 1]], L: [[2, 2], [0, 1], [1, 1], [2, 1]] };

const shot = p.decode(path.join(R, '../PauseUI_VARCO/refs/ref_ingame_full.png')); // 배경: 게임 화면을 어둡게
const W = 1920, H = 1080, out = p.blank(W, H);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const s = (Math.min(y, shot.h - 1) * shot.w + Math.min(x, shot.w - 1)) * 4, o = (y * W + x) * 4; for (let c = 0; c < 3; c++) out.d[o + c] = Math.round(shot.d[s + c] * 0.04 + [24, 31, 43][c] * 0.96); out.d[o + 3] = 255; }

const card = p.decode(R + '/parts/T_Card_Frame.png'), glow = p.decode(R + '/parts/T_Card_Glow.png'), btn = p.decode(R + '/parts/T_Btn_SELECT.png'), title = p.decode(R + '/parts/T_Title_Choose.png');
const S = 5; // 카드 틀 배율 (한 도트 = 화면 5px)

// 위쪽: STAGE n CLEAR + 제목 + 안내문
text(out, 'gold', 'STAGE 3 CLEAR   HP +15', W / 2, 40, 3);
blit(out, title, Math.round(W / 2 - title.w * 4 / 2), 64, 4);
text(out, 'teal', 'Choose 1 mino to strengthen.', W / 2, 158, 3);

const cardW = card.w * S, cardH = card.h * S, centerY = 598, gap = 40;
SETS[setName].forEach(([t, lv], k) => {
  const cx = W / 2 + (k - 1) * (cardW + gap), left = Math.round(cx - cardW / 2), top = Math.round(centerY - cardH / 2), next = lv + 1;
  if (k === 1) blit(out, glow, left - 2 * S, top - 2 * S, S); // 가운데 카드는 호버 표시
  blit(out, card, left, top, S);
  const X = x => Math.round(cx + x), Y = y => Math.round(centerY - y); // 카드 가운데 기준 좌표 (y는 위가 +)
  text(out, 'gold', `${t} · ${NAMES[t]}`, X(0), Y(295), 5);
  text(out, 'teal', `Lv.${lv} → Lv.${next}`, X(0), Y(245), 3);
  // 미노: 강화 외형, 한 칸 = 3배 (원본 칸 그림 137px를 75px로 줄여서 81px 간격으로 배치)
  const cells = CELLS[t], xs = cells.map(c => c[0]), ys = cells.map(c => c[1]), bcx = (Math.min(...xs) + Math.max(...xs)) / 2, bcy = (Math.min(...ys) + Math.max(...ys)) / 2;
  cells.forEach(([gx, gy], i) => {
    let img = p.decode(`${ASSETS}/Resources/MinoSprites/Upgraded/${t}_${i}.png`);
    if (t === 'L') { const r = p.blank(img.w, img.h); for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) img.d.copy(r.d, ((img.w - 1 - x) * img.w + y) * 4, (y * img.w + x) * 4, (y * img.w + x) * 4 + 4); img = r; } // L 칸 그림은 90도 회전해 쓰는 원본이라 반 시계 90도
    const small = p.boxDown(img, 137 / 75), px = X((gx - bcx) * 81) - 37, py = Y(145 + (gy - bcy) * 81) - 37;
    fill(out, px, py, 75, 75, '#18202b'); blit(out, small, px, py, 1); // 칸 바탕 + 그림
  });
  if (next >= 2) text(out, 'teal', `CRYSTAL +1  (TOTAL ${next - 1})`, X(0), Y(45), 2);
  text(out, 'teal', '1 LINE CLEAR', X(0), Y(-15), 3);
  // 첫째 줄: 기본 피해 (치명은 총 피해)
  const icon = n => p.decode(`${ASSETS}/UI/AbilityIcons/T_Ability_${n}.png`);
  const v = AV[t](next), row1 = t === 'L' ? v : 1;
  blit(out, icon('Damage'), X(-142), Y(-70) - 24, 3); text(out, 'cream', `${row1} DMG`, X(-82), Y(-70), 4, 'l');
  // 둘째 줄: 능력 효과 (+ 작은 설명)
  const main = { I: `${v} DMG`, J: 'FREEZE 1T', L: 'CRITICAL', O: `+${v} SHIELD`, S: `+${v} HP`, T: `2T × ${v} DMG`, Z: `${v} DMG` }[t];
  const note = { I: 'PIERCE: ALL ENEMIES', J: `RELEASE: ${v} DMG`, L: `ALWAYS ×${v}`, O: 'LASTS 2 TURNS.', S: '', T: 'Starts next enemy turn.', Z: 'EXPLOSION: NEAREST' }[t];
  blit(out, icon(ICONS[t]), X(-142), Y(-155) - 24, 3); text(out, 'cream', main, X(-82), note ? Y(-140) : Y(-155), 4, 'l');
  if (note) { if (t === 'T') text(out, 'teal', note, X(0), Y(-172), 2); else text(out, 'teal', note, X(-82), Y(-172), 2, 'l'); }
  blit(out, btn, Math.round(cx - btn.w * S / 2), Y(-270) - Math.round(btn.h * S / 2), S); // SELECT 버튼
});
text(out, 'teal', 'Base single-line clear • No bonus or crystal triggers.', W / 2, 1042, 3);
const file = `${R}/preview/Reward_Screen_${setName}.png`;
p.encode(out, file);
console.log('저장', file);
