// 애벌레 공격 v3 최종 산출물 제작: 시트 PNG, 검사 이미지, 미리보기 GIF, 게임 화면 합성, 메타데이터 (작업 폴더 전용, Unity와 무관)
const fs = require('fs'), path = require('path');
const L = require('./lib_cat.js');
const FX = require('../../PixelFX_VARCO/tools/lib_fx.js');
const { decode: gifDecode } = require('../../PixelFX_VARCO/tools/gif_check.js');
const { frames, report } = require('./build_attack.js');
const p = L.p, OUT = path.join(L.R, 'output');
fs.mkdirSync(OUT, { recursive: true });
const NAME = 'CrystalCaterpillar_Attack_v3';
const FPS = 16;
const HIT = 6; // 타격 정점 프레임 번호 (1부터)

// ---------- A. 시트 PNG (64x64 셀, 5열 2행, 투명) ----------
const sheet = p.blank(320, 128);
frames.forEach((f, i) => { for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) { const s = (y * 64 + x) * 4, d = ((Math.floor(i / 5) * 64 + y) * 320 + (i % 5) * 64 + x) * 4; f.d.copy(sheet.d, d, s, s + 4); } });
const sheetFile = path.join(OUT, 'T_CrystalCaterpillar_Attack_v3.png');
p.encode(sheet, sheetFile);
// 저장한 PNG를 다시 읽어 셀마다 원본 프레임과 같은지, 알파가 0/255뿐인지 검사
const back = p.decode(sheetFile);
if (back.w !== 320 || back.h !== 128) throw new Error('시트 크기 오류');
frames.forEach((f, i) => { const c = p.crop(back, (i % 5) * 64, Math.floor(i / 5) * 64, 64, 64); if (Buffer.compare(c.d, f.d) !== 0) throw new Error('셀 불일치 ' + (i + 1)); });
for (let i = 0; i < 320 * 128; i++) { const a = back.d[i * 4 + 3]; if (a !== 0 && a !== 255) throw new Error('반투명 픽셀'); }
console.log('A. 시트 PNG OK', sheetFile);

// ---------- 작은 비트맵 글씨 (검사 이미지 번호용, 3x5) ----------
const FONT = { '0': '111101101101111', '1': '010110010010111', '2': '111001111100111', '3': '111001111001111', '4': '101101111001001', '5': '111100111001111', '6': '111100111101111', '7': '111001001001001', '8': '111101111101111', '9': '111101111001111', H: '101101111101101', I: '111010010010111', T: '111010010010010', ' ': '000000000000000' };
function text(img, x, y, s, k, color) { [...s].forEach((ch, n) => { const g = FONT[ch]; for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) if (g[r * 3 + c] === '1') for (let dy = 0; dy < k; dy++) for (let dx = 0; dx < k; dx++) { const px = x + n * 4 * k + c * k + dx, py = y + r * k + dy; if (px < img.w && py < img.h) { const o = (py * img.w + px) * 4; img.d[o] = color[0]; img.d[o + 1] = color[1]; img.d[o + 2] = color[2]; img.d[o + 3] = 255; } } }); }

// ---------- B. 10프레임 검사 이미지 (번호 + 휴식 자세 기준선 + 타격 표시) ----------
{
  const S = 7, crop = [0, 21, 56, 35], gap = 6, band = 22, cw = crop[2] * S, ch = crop[3] * S;
  const W = 5 * (cw + gap) - gap, H = 2 * (ch + band + gap) - gap, o = p.blank(W, H); o.d.fill(255);
  frames.forEach((f, k) => {
    const ox = (k % 5) * (cw + gap), oy = Math.floor(k / 5) * (ch + band + gap);
    const cell = L.grid([f], S, 1, [226, 226, 232], crop, { x: [8, 49], y: [52] });
    for (let y = 0; y < ch; y++) cell.d.copy(o.d, ((oy + band + y) * W + ox) * 4, y * cw * 4, (y + 1) * cw * 4);
    text(o, ox + 4, oy + 4, String(k + 1).padStart(2, '0'), 3, [40, 40, 60]);
    if (k + 1 === HIT) text(o, ox + 56, oy + 4, 'HIT', 3, [200, 30, 30]);
  });
  p.encode(o, path.join(OUT, NAME + '_inspect_10frames.png'));
  console.log('B. 검사 이미지 OK', o.w + 'x' + o.h);
}

// ---------- 재생 구성 ----------
const idle = Array.from({ length: 10 }, (_, i) => L.loadIdle(i));
const idleDelay = [120, 130, 120, 130, 120, 130, 120, 130, 120, 130]; // 8 FPS(125ms)를 10ms 단위로 맞춤: 합 1250ms
const attackDelay = [60, 70, 60, 60, 70, 60, 60, 70, 60, 60]; // 16 FPS(62.5ms)를 10ms 단위로 맞춤: 합 630ms
const BG = [12, 22, 34];
function onBg(f, scale, crop) { // 투명 프레임 → 단색 배경 + 정수 확대
  const [cx, cy, cw, ch] = crop, o = p.blank(cw * scale, ch * scale);
  for (let y = 0; y < ch * scale; y++) for (let x = 0; x < cw * scale; x++) { const i = ((cy + (y / scale | 0)) * 64 + cx + (x / scale | 0)) * 4, q = (y * o.w + x) * 4, a = f.d[i + 3]; o.d[q] = a ? f.d[i] : BG[0]; o.d[q + 1] = a ? f.d[i + 1] : BG[1]; o.d[q + 2] = a ? f.d[i + 2] : BG[2]; o.d[q + 3] = 255; }
  return o;
}
const verify = (file, count, totalMs) => { const g = gifDecode(fs.readFileSync(file)); const sum = g.frames.reduce((a, f) => a + f.delay, 0); if (g.frames.length !== count) throw new Error(file + ' 프레임 수 ' + g.frames.length); if (totalMs && sum !== totalMs) throw new Error(file + ' 시간 ' + sum); return g; };
function checkGifAgainst(file, srcFrames) { // GIF을 직접 풀어 원본 프레임과 비교 (최대 색 차이)
  const g = gifDecode(fs.readFileSync(file)); let worst = 0;
  g.frames.forEach((fr, k) => { const src = srcFrames[k]; for (let i = 0; i < src.w * src.h * 4; i += 4) { const d = Math.max(Math.abs(fr.d[i] - src.d[i]), Math.abs(fr.d[i + 1] - src.d[i + 1]), Math.abs(fr.d[i + 2] - src.d[i + 2])); if (d > worst) worst = d; } });
  return worst;
}

// ---------- C. 미리보기 GIF ----------
const crop64 = [0, 0, 64, 64];
{ // 1) Idle 1회 → 공격 1회 → Idle 1회 (x4)
  const seq = [...idle, ...frames, ...idle], delays = [...idleDelay, ...attackDelay, ...idleDelay];
  const imgs = seq.map(f => onBg(f, 4, crop64)), file = path.join(OUT, NAME + '_1_idle-attack-idle_x4.gif');
  FX.writeGif(file, imgs, delays, { diff: true });
  verify(file, 30, 1250 + 630 + 1250); console.log('C1. idle→attack→idle', fs.statSync(file).size + 'B', '색차 최대', checkGifAgainst(file, imgs));
}
const loopDelays = [...attackDelay.slice(0, 9), attackDelay[9] + 500]; // 공격 뒤 약 0.5초 쉬어서 한 동작씩 읽히게 (마지막 프레임이 원래 자세)
for (const [label, scale, crop] of [['2_loop-rest0.5s_x4', 4, crop64], ['3_actual-size_x2', 2, crop64], ['4_zoom_x8', 8, [0, 21, 56, 35]]]) {
  const imgs = frames.map(f => onBg(f, scale, crop)), file = path.join(OUT, NAME + '_' + label + '.gif');
  FX.writeGif(file, imgs, loopDelays, { diff: true });
  verify(file, 10, 630 + 500); console.log('C' + label.split('_')[0] + '. ' + label, imgs[0].w + 'x' + imgs[0].h, fs.statSync(file).size + 'B', '색차 최대', checkGifAgainst(file, imgs));
}

// ---------- D. 게임 화면 합성 (이전에 캡처한 FHD 화면에서 애벌레 자리를 지우고 새 프레임으로 교체. 실제 Unity 적용 영상이 아님) ----------
{
  const scr = p.decode('C:/Users/MBC-501-15/Documents/Tetrigeon/CountdownUI_VARCO/work/game_screen_empty_board.png');
  const OX = 1533, OY = 155; // 셀 원점 (화면 픽셀, 도트 1칸 = 2px; 캡처의 Idle 01과 픽셀 단위로 일치함을 확인함)
  // 지울 영역 = 모든 Idle·공격 프레임이 덮을 수 있는 칸을 2배 확대하고 1px 키운 것
  const mask = new Uint8Array(scr.w * scr.h);
  [...idle, ...frames].forEach(f => { for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) if (f.d[(y * 64 + x) * 4 + 3]) for (let dy = -1; dy < 3; dy++) for (let dx = -1; dx < 3; dx++) mask[(OY + y * 2 + dy) * scr.w + OX + x * 2 + dx] = 1; });
  const bg = { w: scr.w, h: scr.h, d: Buffer.from(scr.d) };
  for (let y = 0; y < scr.h; y++) { // 줄마다, 지울 구간의 양옆 배경 색을 이어서 채움
    let x = 0; while (x < scr.w) { if (!mask[y * scr.w + x]) { x++; continue; } let e = x; while (e < scr.w && mask[y * scr.w + e]) e++; const l = x - 1, r = e; for (let k = x; k < e; k++) { const t = (k - l) / (r - l); for (let c = 0; c < 3; c++) bg.d[(y * scr.w + k) * 4 + c] = Math.round(scr.d[(y * scr.w + l) * 4 + c] * (1 - t) + scr.d[(y * scr.w + r) * 4 + c] * t); } x = e; }
  }
  const place = (f) => { const o = { w: scr.w, h: scr.h, d: Buffer.from(bg.d) }; for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) { const i = (y * 64 + x) * 4; if (!f.d[i + 3]) continue; for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) { const q = ((OY + y * 2 + dy) * scr.w + OX + x * 2 + dx) * 4; o.d[q] = f.d[i]; o.d[q + 1] = f.d[i + 1]; o.d[q + 2] = f.d[i + 2]; } } return o; };
  // 위치·크기 검증: Idle 01이 덮는 화면 픽셀(2배)이 원본 캡처와 모두 같아야 함
  const restScene = place(idle[0]); let covered = 0, mismatch = 0;
  for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) { if (!idle[0].d[(y * 64 + x) * 4 + 3]) continue; for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) { const q = ((OY + y * 2 + dy) * scr.w + OX + x * 2 + dx) * 4; covered++; if (restScene.d[q] !== scr.d[q] || restScene.d[q + 1] !== scr.d[q + 1] || restScene.d[q + 2] !== scr.d[q + 2]) mismatch++; } }
  console.log('D. 합성 위치 검증: 애벌레가 덮는', covered, '픽셀 중 원본 캡처와 다른 것 =', mismatch, '(0이면 위치·크기 정확)');
  if (mismatch !== 0) throw new Error('합성 위치 불일치');
  const seq = [...idle, ...frames, ...idle], delays = [...idleDelay, ...attackDelay, ...idleDelay];
  const scenes = seq.map(place);
  const wide = [180, 120, 1600, 210], tight = [1450, 150, 240, 140];
  const cropImg = (img, r, k) => { const c = p.crop(img, r[0], r[1], r[2], r[3]); return k > 1 ? p.nearestUp(c, k) : c; };
  const fileWide = path.join(OUT, NAME + '_5_game-composite_wide.gif'), fileTight = path.join(OUT, NAME + '_6_game-composite_enemy-x4.gif');
  const wideImgs = scenes.map(s => cropImg(s, wide, 1)), tightImgs = scenes.map(s => cropImg(s, tight, 4));
  FX.writeGif(fileWide, wideImgs, delays, { diff: true }); FX.writeGif(fileTight, tightImgs, delays, { diff: true });
  console.log('D1. 합성 wide', wideImgs[0].w + 'x' + wideImgs[0].h, fs.statSync(fileWide).size + 'B', '색차 최대', checkGifAgainst(fileWide, wideImgs));
  console.log('D2. 합성 enemy x4', tightImgs[0].w + 'x' + tightImgs[0].h, fs.statSync(fileTight).size + 'B', '색차 최대', checkGifAgainst(fileTight, tightImgs));
  // 타격 정점 정지 화면
  p.encode(cropImg(scenes[10 + HIT - 1], tight, 4), path.join(OUT, NAME + '_7_game-composite_hit-frame_x4.png'));
}

// ---------- E. 메타데이터 ----------
const meta = {
  name: NAME, unity_applied: false, status: '미리보기 단계, 사용자 컨펌 대기',
  sheet: { file: 'T_CrystalCaterpillar_Attack_v3.png', size: [320, 128], cell: [64, 64], layout: '5열 x 2행, 왼쪽 위부터 01~05 / 다음 줄 06~10', alpha: '실제 투명 PNG, 알파 0/255만', frames: 10 },
  playback: { fps: FPS, frame_ms: 62.5, total_ms: 625, note: 'GIF는 10ms 단위라 60/70ms를 섞어 630ms로 만듦. Unity에서는 정확히 62.5ms 사용', recommended_return: '10프레임이 끝나면 Idle로 돌아가며 10번=01번=Idle 01(바이트 동일)이라 튀지 않음' },
  pivot: { top_left_anchor_px: [32, 52], unity_normalized: [0.5, 0.1875], note: 'Idle과 같은 셀·같은 기준점. 공격 이동은 시트 안에서만 하며 SpriteRenderer 이동과 중복하지 않음' },
  direction: { art_faces: '화면 왼쪽(레미 방향)', flipX: false, note: 'Unity P_Enemy의 NormalIdle SpriteRenderer는 flipX=false, 음수 스케일 없음 → 원본 그대로 왼쪽으로 공격' },
  display: { scale: '도트 1칸 = FHD 화면 2px (PPU 75.6 x 루트 1.4)', screen_cell_origin_in_capture: [1533, 155] },
  hit_frame: { number: HIT, index0: HIT - 1, time_from_start_ms: (HIT - 1) * 62.5, note: '가장 앞으로 뻗은 자세. 피해 연출은 이 프레임에 맞출 수 있음 (이번 단계에서는 전투 타이밍을 바꾸지 않음)' },
  segments: { H: '머리(눈이 있는 큰 마디) + 자기 다리', M: '첫 번째 몸통(가운데) + 자기 다리', R: '두 번째 몸통(뒤) + 자기 다리', split: '돔·받침은 X 27/39 경계, 다리는 발 사이 틈 24/36 경계 (수평 절단 없음)', draw_order: '뒤 몸통 → 가운데 → 머리(항상 같은 순서)', joint_fill: '이웃 아래에 숨은 외곽선 2칸이 벌어질 때 드러남. 갇힌 틈은 이웃 색으로 채우되 0칸이어야 통과' },
  frames: report.map(r => ({ frame: r.frame, note: r.note, offsets_dx_dy: { head: r.H, mid: r.M, rear: r.R }, gap_head_mid_px: r.gapHM, gap_mid_rear_px: r.gapMR, bbox_x0y0x1y1: r.bbox })),
  checks: ['01 = Idle 01 (바이트 동일)', '10 = 01 (바이트 동일)', '모든 프레임 8방향 연결 덩어리 1개 (떠 있는 조각·잔해 없음)', '모든 프레임 내부 투명 구멍 0칸', '알파 0/255만 (반투명 없음)', '셀 경계에서 모든 프레임 1px 이상 여유', '마디 간격 최대 2px', '저장한 PNG를 다시 읽어 프레임과 대조', 'GIF를 직접 풀어 원본 프레임과 대조'],
  sources: { idle_sheet_in_unity: 'Tetrigeon/Assets/@Resources/Enemies/CrystalLarvaIdle/T_CrystalLarva_Idle.png', approved_art: 'C:/Users/MBC-501-15/.codex/worktrees/9449/Tetrigeon/output/caterpillar-idle/source-approved.png', previous_attack_v2: 'C:/Users/MBC-501-15/.codex/worktrees/9449/Tetrigeon/output/monster-attacks/T_CrystalCaterpillar_Attack_v2.png (덮어쓰지 않음)' },
  varco: { used: true, images: 4, credits: 80, usable_in_sheet: false, reason: '1차(미세 지시): 마디 위치가 원화와 같고 앞발만 달라짐. 2차(큰 이동 지시): 움츠림은 좌우 반전, 타격은 머리가 커지고 원화에 없는 회색 돌 블록이 생김 → 디자인 유지 조건 위반이라 시트에 넣지 않음' },
};
fs.writeFileSync(path.join(OUT, NAME + '.json'), JSON.stringify(meta, null, 2));
console.log('E. 메타데이터 저장');
