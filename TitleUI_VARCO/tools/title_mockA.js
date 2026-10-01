// 타이틀 A안 목업: 승인된 게임 스프라이트만으로 레미의 던전 모험 장면을 합성 (미리보기 전용, Unity에 넣지 않음)
const path = require('path');
const px = require('../../PauseUI_VARCO/tools/pix.js');
const logo = require('./mino_logo.js');
const ROOT = path.join(__dirname, '..');
const ART = 'C:/Users/MBC-501-15/.codex/worktrees/9449/Tetrigeon/output';
const RES = path.join(ROOT, '../Tetrigeon/Assets/@Resources');
const W = 1920, H = 1080;
const out = px.blank(W, H);

function put(img, x0, y0, scale = 1) { // 최근접 확대로 붙이기 (이진 알파)
  for (let y = 0; y < img.h * scale; y++) for (let x = 0; x < img.w * scale; x++) {
    const X = x0 + x, Y = y0 + y;
    if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
    const si = (Math.floor(y / scale) * img.w + Math.floor(x / scale)) * 4;
    if (img.d[si + 3] < 128) continue;
    img.d.copy(out.d, (Y * W + X) * 4, si, si + 3);
    out.d[(Y * W + X) * 4 + 3] = 255;
  }
}
function rect(x0, y0, w, h, c) { for (let y = Math.max(0, y0); y < Math.min(H, y0 + h); y++) for (let x = Math.max(0, x0); x < Math.min(W, x0 + w); x++) { const i = (y * W + x) * 4; out.d[i] = c[0]; out.d[i + 1] = c[1]; out.d[i + 2] = c[2]; out.d[i + 3] = 255; } }
function frame(sheet, cw, ch, i) { return px.trim(px.crop(sheet, (i % (sheet.w / cw)) * cw, Math.floor(i / (sheet.w / cw)) * ch, cw, ch)).img; }

// 1. 동굴 배경: 가로를 화면에 맞추고 위아래를 잘라 땅이 아래쪽에 오게 배치
const cave = px.decode(ART + '/art/T_DungeonCave_4x3_v4.png');
const s = W / cave.w, offY = 140;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const sx = Math.min(cave.w - 1, Math.floor(x / s)), sy = Math.min(cave.h - 1, Math.floor((y + offY) / s));
  cave.d.copy(out.d, (y * W + x) * 4, (sy * cave.w + sx) * 4, (sy * cave.w + sx) * 4 + 4);
  out.d[(y * W + x) * 4 + 3] = 255;
}
const groundY = Math.round(735 * s - offY); // 배경 그림의 땅 윗면

// 2. 떨어지는 미노: 단색 속도선 2단계 (흐림·그라데이션 없음)
const { cyan, dark } = logo.sampleColors();
const deepCyan = [Math.round(cyan[0] * 0.45), Math.round(cyan[1] * 0.55), Math.round(cyan[2] * 0.6)];
const C = logo.CELL;
function piece(type, rot, x, y, trail) { // 조각 + (떨어지는 중이면) 열마다 속도선
  const { img, pts } = logo.renderPiece(type, rot);
  if (trail) {
    const tops = {};
    pts.forEach(p => { tops[p.x] = Math.min(tops[p.x] ?? 99, p.y); });
    for (const cx in tops) {
      const lx = x + cx * C + Math.floor(C / 2) - 1, ly = y + tops[cx] * C;
      rect(lx, ly - trail - 40, 3, trail, deepCyan);
      rect(lx, ly - 40, 3, 34, cyan);
    }
  }
  put(logo.ring(img, 2, dark), x - 2, y - 2);
}
function burst(cx, cy, r) { // 계단식 충돌 별 (청록·흰 두 색, 흐림 없음)
  const white = [236, 248, 250];
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) for (let i = 0; i < r; i += 6) rect(cx + dx * i - 4, cy + dy * i - 4, 8, 8, i < r * 0.4 ? white : cyan);
  for (const [dx, dy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) for (let i = 0; i < r * 0.6; i += 6) rect(cx + dx * i - 3, cy + dy * i - 3, 6, 6, cyan);
}
// 배경 쪽에 흩어져 떨어지는 조각
for (const [t, r, x, y] of [['T', 1, 110, 60], ['S', 0, 470, 150], ['L', 2, 70, 420], ['I', 1, 1840, 40], ['Z', 1, 1500, 70]]) piece(t, r, x, y, 50);

// 3. 캐릭터: 보스(뒤, 크게) → 센티넬 → 레미(주먹을 날리는 순간)
const queen = frame(px.decode(RES + '/Enemies/CrystalQueenIdle/T_CrystalQueen_Idle.png'), 160, 160, 0);
const sentinel = frame(px.decode(RES + '/Enemies/AmethystSentinelIdle/T_AmethystSentinel_Idle.png'), 96, 96, 0);
const lemyRaw = px.decode(ART + '/lemy-attack/frame_06.png');
const lemy = px.trim(px.floodClear(lemyRaw, px.borderSeeds(lemyRaw), 24)).img; // 프레임의 단색 배경 제거
put(queen, 1440, groundY - queen.h * 3 + 6, 3);
put(sentinel, 1130, groundY - sentinel.h * 3 + 4, 3);
for (let i = 0; i < 6; i++) rect(270 + i * 4, groundY - 6 + (i % 2), 120 - i * 8, 6, dark); // 점프 중인 레미의 땅 그림자 (계단식)
put(lemy, 250, groundY - Math.round(lemy.h * 1.5) - 70, 1.5); // 땅에서 뛰어올라 공격
for (const [y, len] of [[650, 260], [680, 380], [710, 220]]) { rect(440, y, len, 4, deepCyan); rect(440 + len, y, 90, 4, cyan); } // 센티넬 쪽으로 날아가는 주먹의 속도선

// 레미가 부른 미노가 센티넬·보스 머리 위로 쏟아짐 (로고 영역 밖) + 땅에 쌓인 조각
piece('I', 0, 1170, 470, 120);
piece('J', 0, 1290, 440, 90);
piece('O', 0, 1500, 420, 140);
piece('T', 2, 1640, 450, 100);
burst(1275, groundY - sentinel.h * 3 + 20, 60);
piece('L', 0, 980, groundY - C * 2, 0);
piece('O', 0, 1050, groundY - C * 2, 0);
piece('S', 0, 1830, groundY - C * 2, 0);

// 4. 로고 (두 줄, 청록 테두리 B)
const L = px.decode(ROOT + '/parts/T_Logo_Mino_twoLines_Up_B.png');
put(L, Math.floor((W - L.w) / 2), 36);

// 5. 메뉴: 5×7 도트 글꼴 4배, 선택 항목은 청록 + 작은 T 미노 커서
const F = {
  S: ['.XXXX', 'X....', 'X....', '.XXX.', '....X', '....X', 'XXXX.'], T: ['XXXXX', '..X..', '..X..', '..X..', '..X..', '..X..', '..X..'],
  A: ['.XXX.', 'X...X', 'X...X', 'XXXXX', 'X...X', 'X...X', 'X...X'], R: ['XXXX.', 'X...X', 'X...X', 'XXXX.', 'X.X..', 'X..X.', 'X...X'],
  O: ['.XXX.', 'X...X', 'X...X', 'X...X', 'X...X', 'X...X', '.XXX.'], P: ['XXXX.', 'X...X', 'X...X', 'XXXX.', 'X....', 'X....', 'X....'],
  I: ['XXXXX', '..X..', '..X..', '..X..', '..X..', '..X..', 'XXXXX'], N: ['X...X', 'XX..X', 'X.X.X', 'X..XX', 'X...X', 'X...X', 'X...X'],
  E: ['XXXXX', 'X....', 'X....', 'XXXX.', 'X....', 'X....', 'XXXXX'], X: ['X...X', 'X...X', '.X.X.', '..X..', '.X.X.', 'X...X', 'X...X'],
};
function text(str, cx, y, k, color) {
  const w = str.length * 6 * k - k, x0 = Math.round(cx - w / 2);
  for (const [dx, dy, col] of [[k, k, dark], [0, 0, color]]) // 그림자 먼저, 글자 나중
    [...str].forEach((ch, i) => F[ch].forEach((row, ry) => [...row].forEach((c, rx) => { if (c === 'X') rect(x0 + (i * 6 + rx) * k + dx, y + ry * k + dy, k, k, col); })));
  return x0;
}
const light = [222, 214, 196], menuY = 470, step = 58, k = 4;
const sx0 = text('START', W / 2, menuY, k, cyan);
text('OPTION', W / 2, menuY + step, k, light);
text('EXIT', W / 2, menuY + step * 2, k, light);
const cursor = logo.renderPiece('T', 1).img; // 오른쪽을 향한 T 미노
put(logo.ring(cursor, 1, dark), sx0 - cursor.w * 0.6 - 30, menuY - 4, 0.6);

px.encode(out, path.join(ROOT, 'preview', 'TitleMock_A.png'));
console.log('saved TitleMock_A.png groundY', groundY, 'lemy', lemy.w + 'x' + lemy.h);
