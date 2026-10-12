// 센티넬 일반 공격 v1 최종 산출물 (작업 폴더 전용, Unity와 무관): 시트 재검증, 미리보기 GIF, 게임 화면 합성, 기록 JSON
const fs = require('fs'), path = require('path');
const p = require('../../PauseUI_VARCO/tools/pix.js');
const FX = require('../../PixelFX_VARCO/tools/lib_fx.js');
const { decode: gifDecode } = require('../../PixelFX_VARCO/tools/gif_check.js');
const LC = require('../../CaterpillarAttack_VARCO/tools/lib_cat.js'); // 게임 화면 합성 때 기존 애벌레 자리를 지우기 위해 Idle 마스크만 사용
const B = require('./build_v2.js');
const { cells, CW, CH, COLS } = B; const ROWS = Math.ceil(cells.length / COLS), N = cells.length;
const R = path.join(__dirname, '..'), OUT = path.join(R, 'output');
const TAG = process.argv[2] || 'v1', NAME = 'Sentinel_Attack_' + TAG;
const SHEET = 'C:/Users/MBC-501-15/Documents/Tetrigeon/Tetrigeon/Assets/@Resources/Enemies/AmethystSentinelIdle/T_AmethystSentinel_Idle.png';
const HIT = B.FRAMES.findIndex(f => /STRIKE/.test(f.role)) + 1; // 타격 프레임 번호 (1부터)

// ---------- 타이밍: 준비는 느리게, 휘두르기(05)는 짧게, 타격(06)은 길게 ----------
const ATTACK_MS = B.MS; // 프레임별 시간(ms)
const IDLE_MS = 170; // Idle 6 FPS(166.7ms)를 GIF 10ms 단위로 맞춤
const attackTotal = ATTACK_MS.reduce((a, b) => a + b, 0);
const hitStartMs = ATTACK_MS.slice(0, HIT - 1).reduce((a, b) => a + b, 0);

// ---------- A. 시트 저장본을 다시 읽어 셀과 대조 ----------
const sheet = p.decode(path.join(OUT, `T_AmethystSentinel_Attack_${TAG}.png`));
if (sheet.w !== CW * COLS || sheet.h !== CH * ROWS) throw new Error('시트 크기 ' + sheet.w + 'x' + sheet.h);
let sheetDiff = 0;
cells.forEach((c, i) => { const ox = (i % COLS) * CW, oy = Math.floor(i / COLS) * CH; for (let y = 0; y < CH; y++) for (let x = 0; x < CW * 4; x++) if (sheet.d[((oy + y) * sheet.w) * 4 + ox * 4 + x] !== c.d[y * CW * 4 + x]) sheetDiff++; });
console.log('A. 시트 재읽기 vs 셀 바이트 차이', sheetDiff, '/ 크기', sheet.w + 'x' + sheet.h);
if (sheetDiff) throw new Error('시트 불일치');

// ---------- Idle 10프레임을 같은 128x104 셀로 (공격 앞뒤에 붙이기 위함) ----------
const idleSheet = p.decode(SHEET);
const idleCells = Array.from({ length: 10 }, (_, i) => { const f = p.crop(idleSheet, (i % 5) * 96, Math.floor(i / 5) * 96, 96, 96), o = p.blank(CW, CH); for (let y = 0; y < 96; y++) for (let x = 0; x < 96; x++) f.d.copy(o.d, ((y + 8) * CW + x + 24) * 4, (y * 96 + x) * 4, (y * 96 + x) * 4 + 4); return o; });

const BG = [12, 22, 34];
function onBg(c, scale) { const o = p.blank(CW * scale, CH * scale); for (let y = 0; y < CH * scale; y++) for (let x = 0; x < CW * scale; x++) { const i = (((y / scale) | 0) * CW + ((x / scale) | 0)) * 4, q = (y * o.w + x) * 4, a = c.d[i + 3]; o.d[q] = a ? c.d[i] : BG[0]; o.d[q + 1] = a ? c.d[i + 1] : BG[1]; o.d[q + 2] = a ? c.d[i + 2] : BG[2]; o.d[q + 3] = 255; } return o; }
const verify = (file, count, totalMs) => { const g = gifDecode(fs.readFileSync(file)); const sum = g.frames.reduce((a, f) => a + f.delay, 0); if (g.frames.length !== count) throw new Error(file + ' 프레임 수 ' + g.frames.length); if (totalMs && sum !== totalMs) throw new Error(file + ' 시간 ' + sum + ' != ' + totalMs); return g; };
function worstDiff(file, src) { const g = gifDecode(fs.readFileSync(file)); let worst = 0; g.frames.forEach((fr, k) => { for (let i = 0; i < src[k].w * src[k].h * 4; i += 4) { const d = Math.max(Math.abs(fr.d[i] - src[k].d[i]), Math.abs(fr.d[i + 1] - src[k].d[i + 1]), Math.abs(fr.d[i + 2] - src[k].d[i + 2])); if (d > worst) worst = d; } }); return worst; }

// ---------- B. 미리보기 GIF ----------
{ // 1) Idle 1회 → 공격 1회 → Idle 1회 (x4)
  const seq = [...idleCells, ...cells, ...idleCells], delays = [...idleCells.map(() => IDLE_MS), ...ATTACK_MS, ...idleCells.map(() => IDLE_MS)];
  const imgs = seq.map(c => onBg(c, 4)), file = path.join(OUT, NAME + '_1_idle-attack-idle_x4.gif');
  FX.writeGif(file, imgs, delays, { diff: true }); verify(file, 20 + N, 1700 + attackTotal + 1700);
  console.log('B1. idle→attack→idle', fs.statSync(file).size + 'B', '색차 최대', worstDiff(file, imgs));
}
// 반복: 공격 → 약 0.5초 쉼(Idle 앞 3프레임 = 510ms) → 반복. 공격 끝이 Idle 01과 같아서 이음새가 튀지 않음
const loopSeq = [...cells, ...idleCells.slice(0, 3)], loopDelays = [...ATTACK_MS, IDLE_MS, IDLE_MS, IDLE_MS];
for (const [label, scale] of [['2_loop-rest0.5s_x4', 4], ['3_actual-size_x2', 2], ['4_zoom_x8', 8]]) {
  const imgs = loopSeq.map(c => onBg(c, scale)), file = path.join(OUT, NAME + '_' + label + '.gif');
  FX.writeGif(file, imgs, loopDelays, { diff: true }); verify(file, N + 3, attackTotal + 3 * IDLE_MS);
  console.log('B' + label.split('_')[0] + '. ' + label, imgs[0].w + 'x' + imgs[0].h, fs.statSync(file).size + 'B', '색차 최대', worstDiff(file, imgs));
}

// ---------- C. 게임 화면 합성 (이전에 캡처한 FHD 화면의 애벌레 자리를 지우고 센티넬을 같은 자리에 둠. 실제 Unity 영상이 아님) ----------
{
  const scr = p.decode('C:/Users/MBC-501-15/Documents/Tetrigeon/CountdownUI_VARCO/work/game_screen_empty_board.png');
  // 기존 애벌레(셀 원점 (1533,155), 도트 1칸 2px, 발 기준 (32,52)) 자리를 지운다
  const COX = 1533, COY = 155, mask = new Uint8Array(scr.w * scr.h);
  for (let i = 0; i < 10; i++) { const f = LC.loadIdle(i); for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) if (f.d[(y * 64 + x) * 4 + 3]) for (let dy = -1; dy < 3; dy++) for (let dx = -1; dx < 3; dx++) mask[(COY + y * 2 + dy) * scr.w + COX + x * 2 + dx] = 1; }
  const bg = { w: scr.w, h: scr.h, d: Buffer.from(scr.d) };
  for (let y = 0; y < scr.h; y++) { let x = 0; while (x < scr.w) { if (!mask[y * scr.w + x]) { x++; continue; } let e = x; while (e < scr.w && mask[y * scr.w + e]) e++; const l = x - 1, r = e; for (let k = x; k < e; k++) { const t = (k - l) / (r - l); for (let c = 0; c < 3; c++) bg.d[(y * scr.w + k) * 4 + c] = Math.round(scr.d[(y * scr.w + l) * 4 + c] * (1 - t) + scr.d[(y * scr.w + r) * 4 + c] * t); } x = e; } }
  // 센티넬 발 기준점 (셀 (64,94)) 이 같은 슬롯의 발 기준점 화면 (1597,259) 에 오도록: 셀 원점 = (1597-128, 259-188)
  const SX = 1597 - 72 * 2, SY = 259 - 94 * 2;
  const place = (c) => { const o = { w: scr.w, h: scr.h, d: Buffer.from(bg.d) }; for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) { const i = (y * CW + x) * 4; if (!c.d[i + 3]) continue; for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) { const q = ((SY + y * 2 + dy) * scr.w + SX + x * 2 + dx) * 4; o.d[q] = c.d[i]; o.d[q + 1] = c.d[i + 1]; o.d[q + 2] = c.d[i + 2]; } } return o; };
  const seq = [...idleCells, ...cells, ...idleCells], delays = [...idleCells.map(() => IDLE_MS), ...ATTACK_MS, ...idleCells.map(() => IDLE_MS)];
  const scenes = seq.map(place);
  const wide = [200, 40, 1560, 280], tight = [1380, 50, 440, 260];
  const cropImg = (img, r, k) => { const c = p.crop(img, r[0], r[1], r[2], r[3]); return k > 1 ? p.nearestUp(c, k) : c; };
  const fileWide = path.join(OUT, NAME + '_5_game-composite_wide.gif'), fileTight = path.join(OUT, NAME + '_6_game-composite_enemy-x3.gif');
  const wideImgs = scenes.map(s => cropImg(s, wide, 1)), tightImgs = scenes.map(s => cropImg(s, tight, 3));
  FX.writeGif(fileWide, wideImgs, delays, { diff: true }); FX.writeGif(fileTight, tightImgs, delays, { diff: true });
  console.log('C1. 합성 wide', wideImgs[0].w + 'x' + wideImgs[0].h, fs.statSync(fileWide).size + 'B', '색차 최대', worstDiff(fileWide, wideImgs));
  console.log('C2. 합성 enemy x3', tightImgs[0].w + 'x' + tightImgs[0].h, fs.statSync(fileTight).size + 'B', '색차 최대', worstDiff(fileTight, tightImgs));
  p.encode(cropImg(scenes[10 + HIT - 1], tight, 3), path.join(OUT, NAME + '_7_game-composite_hit-frame_x3.png'));
}

// ---------- D. 기록 JSON ----------
const frames = B.FRAMES.map((f, i) => ({ frame: i + 1, role: f.role, source: f.src || 'AmethystSentinel_Idle_01 (원본 그대로)', ms: ATTACK_MS[i], rightFootAnchor: f.rf || null }));
const meta = {
  name: NAME, unity_applied: false, status: '프레임 제작·미리보기 단계, 사용자 컨펌 대기',
  sheet: { file: `T_AmethystSentinel_Attack_${TAG}.png`, size: [CW * COLS, CH * ROWS], cell: [CW, CH], layout: `${COLS}열 x ${ROWS}행, 왼쪽 위부터 01~${String(COLS).padStart(2, '0')} / 다음 줄 이어서`, alpha: '실제 투명 PNG, 알파 0/255만', frames: N },
  playback: { total_ms: attackTotal, frame_ms: ATTACK_MS, base_fps: 14, note: '준비는 70ms씩, 05(준비 최대)는 100ms로 힘 모음, 06~07(휘두르는 중)은 45/35ms로 빠르게, 08(타격)은 130ms로 길게. Unity 클립에서는 프레임별 키 시간으로 그대로 재현 가능. GIF는 10ms 단위.', return_to_idle: '마지막 프레임 = 01번 = Idle 01 (바이트 동일)이라 Idle로 돌아갈 때 튀지 않음' },
  pivot: { anchor_px_in_cell: [72, 94], unity_normalized: [0.5, +(10 / CH).toFixed(4)], ppu: 75.6, note: '원본 Idle 셀(96x96)을 (24,8)에 둔 144x104 캔버스. 원본 발 기준 (48,86)과 같은 지점. 캐릭터 축소 없음. Unity에 적용할 때는 Idle과 같은 PPU 75.6, 피벗 (0.5, 10/104)로 두면 발이 같은 자리에 온다.' },
  direction: { art_faces: '화면 왼쪽(레미 방향)', flipX: false, note: 'EpicIdle SpriteRenderer flipX=0, 좌우 반전 없음' },
  display: { scale: '도트 1칸 = FHD 화면 2px (PPU 75.6 x 루트 1.4)' },
  hit_frame: { number: HIT, index0: HIT - 1, time_from_start_ms: hitStartMs, note: '수정 팔이 가장 멀리 뻗은 자세. 피해 연출을 맞춘다면 이 프레임 (이번 단계에서는 전투 타이밍을 바꾸지 않음)' },
  frames,
  sources: { idle_sheet_in_unity: 'Tetrigeon/Assets/@Resources/Enemies/AmethystSentinelIdle/T_AmethystSentinel_Idle.png', varco_raw: 'SentinelAttack_VARCO/work/varco_round3~5 (선택본은 output/varco_sources)', previous_attacks: '열어 보거나 재사용하지 않음, 삭제·덮어쓰기 없음' },
  varco: { model: 'nano-banana-pro (EditImage)', note: '핵심 자세 3장(준비·타격·반동)과 중간 프레임(02·03·04·06·07·10·11)을 VARCO가 그린 그림에서 원본 도트 격자로 환산해 사용. 색은 원본 Idle 01의 부류별(돌·윤곽 / 수정 / 코어) 밝기 분포에 맞추고 겉 한 겹은 윤곽색으로 정리. 01·12는 원본 Idle 01.' },
};
fs.writeFileSync(path.join(OUT, NAME + '.json'), JSON.stringify(meta, null, 2));
console.log('D. 기록 저장: 총 시간', attackTotal + 'ms, 타격 시작', hitStartMs + 'ms');
