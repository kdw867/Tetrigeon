// 새 모션(당김 -> 기 모으기 -> 내지름) 조립 (작업 폴더 전용, Unity와 무관):
// 선택한 프레임을 144x104 셀에 배치(기 모으기 프레임은 몸을 1도트 눌러 떨림 표현), 시트(7x2)·팔 끝 좌표·이펙트 합성 미리보기 생성
const fs = require('fs'), path = require('path');
const p = require('../../PauseUI_VARCO/tools/pix.js');
const L = require('./lib_place.js');
const A = require('./armvec.js');
const FXM = require('./fx_sentinel.js');
const FX = require('../../PixelFX_VARCO/tools/lib_fx.js');
const { decode: gifDecode } = require('../../PixelFX_VARCO/tools/gif_check.js');
const LC = require('../../CaterpillarAttack_VARCO/tools/lib_cat.js');
const { CW, CH, OX, OY, BASE_Y } = L;
const OUT = path.join(L.R, 'output'), TAG = process.argv[2] || 't1';
const SHEET = 'C:/Users/MBC-501-15/Documents/Tetrigeon/Tetrigeon/Assets/@Resources/Enemies/AmethystSentinelIdle/T_AmethystSentinel_Idle.png';
const J = JSON.parse(fs.readFileSync(path.join(L.R, 'tools', process.env.FRAMES_JSON || 'frames_t1.json'), 'utf8'));
const idleSheet = p.decode(SHEET);
const idleCellAt = (i) => { const f = p.crop(idleSheet, (i % 5) * 96, Math.floor(i / 5) * 96, 96, 96), o = p.blank(CW, CH); for (let y = 0; y < 96; y++) for (let x = 0; x < 96; x++) f.d.copy(o.d, ((y + OY) * CW + x + OX) * 4, (y * 96 + x) * 4, (y * 96 + x) * 4 + 4); return o; };
const idleCells = Array.from({ length: 10 }, (_, i) => idleCellAt(i));
// 몸 눌림: splitY 위의 줄을 dy 만큼 아래로 내림 (splitY 근처 줄 dy개는 덮임 = 허리 부근이 dy도트 줄어듦)
function squash(cell, splitY, dy) { const o = p.blank(CW, CH); for (let y = 0; y < CH; y++) { const src = y >= splitY + dy ? y : y - dy; if (src < 0) continue; cell.d.copy(o.d, y * CW * 4, src * CW * 4, (src + 1) * CW * 4); } return o; }
const tipOf = (cell) => { const comps = A.comps(cell, 'purple').sort((a, b) => b.length - a.length), arm = comps[0]; let tip = arm[0]; arm.forEach(q => { if (q[0] < tip[0] || (q[0] === tip[0] && q[1] > tip[1])) tip = q; }); return tip; };

const infos = [], cells = [];
J.frames.forEach((f, idx) => {
  if (f.dupOf) { cells.push(cells[f.dupOf - 1]); infos.push({ name: 'dup of slot ' + f.dupOf }); return; }
  let cell;
  if (!f.src) { cell = idleCells[0]; infos.push({ name: 'idle01' }); }
  else { const r = L.place(path.join(L.W_, 'snapc2_' + f.src + '.png'), f.rf == null ? null : f.rf); if (r.outsideCanvas) throw new Error(f.src + ' 캔버스 밖 ' + r.outsideCanvas); cell = r.cell; infos.push({ name: f.src, offset: r.offset, cutBelowSole: r.cutBelowSole }); }
  if (f.squash) cell = squash(cell, f.squash[0], f.squash[1]);
  cells.push(cell);
});
const N = cells.length, uniq = J.frames.map((f, i) => i).filter(i => !J.frames[i].dupOf), COLS = J.cols || 5, ROWS = Math.ceil(uniq.length / COLS), MS = J.frames.map(f => f.ms);
module.exports = { cells, idleCells, infos, J, N, COLS, ROWS, MS, tipOf };
if (require.main !== module) return;

// ---------- 시트 ----------
const sheet = p.blank(CW * COLS, CH * ROWS);
uniq.forEach((slot, i) => { const c = cells[slot], ox = (i % COLS) * CW, oy = Math.floor(i / COLS) * CH; for (let y = 0; y < CH; y++) c.d.copy(sheet.d, ((oy + y) * sheet.w + ox) * 4, y * CW * 4, (y + 1) * CW * 4); });
p.encode(sheet, path.join(OUT, `T_AmethystSentinel_AttackThrust_${TAG}.png`));

// ---------- 이펙트 위치 (셀 좌표) ----------
const iCharge = J.frames.findIndex(f => f.role === (J.chargeRole || 'pull')), iHit = J.frames.findIndex(f => /HIT/.test(f.role));
// 팔 끝: 'left' = 가장 왼쪽 보라 점, 'far' = 눈에서 가장 먼 팔 점(위로 빠진 팔의 끝)
const farTipOf = (cell) => { const m = A.measure(cell); return [Math.round(m.eyes[0] + m.armTip[0]), Math.round(m.eyes[1] + m.armTip[1])]; };
const tipPull = (J.chargeTip === 'far' ? farTipOf : tipOf)(cells[iCharge]), tipHit = tipOf(cells[iHit]);
const chargeAnchor = J.chargeAnchor || tipPull, burstAnchor = J.burstAnchor || [tipHit[0] - 2, tipHit[1] - 12];
console.log('팔 끝: 당김', tipPull.join(','), '내지름', tipHit.join(','), '| 이펙트 위치: 기 모으기', chargeAnchor.join(','), '터짐', burstAnchor.join(','));

// ---------- 시간표(10ms 격자)로 캐릭터 프레임 + 이펙트 프레임 결정 ----------
const T0 = []; let t = 0; J.frames.forEach((f, i) => { T0.push(t); t += f.ms; }); const TOTAL = t;
const chargeStart = T0[iCharge], chargeEnd = T0[J.frames.findIndex(f => f.role === (J.chargeEndRole || 'thrust-mid'))], burstStart = T0[iHit];
const FXMS = 40; // 이펙트 한 프레임 시간
const chargeSeq = [0, 1, 2, 3, 6, 7, 8, 9, 12, 13, 14]; // 단계 1(0~3) -> 단계 2(6~9) -> 단계 3(12~14) (chargeFrame 배열 번호)
function stateAt(ms) {
  let ci = 0; for (let i = 0; i < N; i++) if (ms >= T0[i]) ci = i;
  let cf = -1; if (ms >= chargeStart && ms < chargeEnd) cf = chargeSeq[Math.min(chargeSeq.length - 1, Math.floor((ms - chargeStart) / FXMS))];
  let bf = -1; if (ms >= burstStart && ms < burstStart + 8 * FXMS) bf = Math.floor((ms - burstStart) / FXMS);
  return { ci, cf, bf };
}
const MARGIN = 48; // 미리보기 캔버스 여백(이펙트가 셀 밖으로 나가므로)
const PW = CW + MARGIN * 2, PH = CH + MARGIN * 2;
const BG = [12, 22, 34];
function frameImage(st, scale) {
  const o = p.blank(PW, PH); for (let i = 0; i < PW * PH; i++) { o.d[i * 4] = BG[0]; o.d[i * 4 + 1] = BG[1]; o.d[i * 4 + 2] = BG[2]; o.d[i * 4 + 3] = 255; }
  const put = (img, ox, oy) => { for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) { const s = (y * img.w + x) * 4; if (!img.d[s + 3]) continue; const X = x + ox, Y = y + oy; if (X < 0 || Y < 0 || X >= PW || Y >= PH) continue; img.d.copy(o.d, (Y * PW + X) * 4, s, s + 4); } };
  put(cells[st.ci], MARGIN, MARGIN);
  if (st.cf >= 0) put(FXM.charge[st.cf], MARGIN + Math.round(chargeAnchor[0] - 27.5), MARGIN + Math.round(chargeAnchor[1] - 27.5));
  if (st.bf >= 0) put(FXM.burst[st.bf], MARGIN + Math.round(burstAnchor[0] - 35.5), MARGIN + Math.round(burstAnchor[1] - 35.5));
  return scale > 1 ? p.nearestUp(o, scale) : o;
}
// 10ms 격자로 훑어 같은 장면은 하나로 합침
const scenes = []; for (let ms = 0; ms < TOTAL; ms += 10) { const st = stateAt(ms), key = st.ci + '/' + st.cf + '/' + st.bf; if (scenes.length && scenes[scenes.length - 1].key === key) scenes[scenes.length - 1].ms += 10; else scenes.push({ key, st, ms: 10 }); }
const verify = (file, count, totalMs) => { const g = gifDecode(fs.readFileSync(file)); const sum = g.frames.reduce((a, f) => a + f.delay, 0); if (g.frames.length !== count) throw new Error(file + ' 프레임 수 ' + g.frames.length + ' != ' + count); if (totalMs && sum !== totalMs) throw new Error(file + ' 시간 ' + sum + ' != ' + totalMs); return g; };
const worst = (file, src) => { const g = gifDecode(fs.readFileSync(file)); let w = 0; g.frames.forEach((fr, k) => { for (let i = 0; i < src[k].w * src[k].h * 4; i += 4) { const d = Math.max(Math.abs(fr.d[i] - src[k].d[i]), Math.abs(fr.d[i + 1] - src[k].d[i + 1]), Math.abs(fr.d[i + 2] - src[k].d[i + 2])); if (d > w) w = d; } }); return w; };
const idleScene = (i) => { const st = { ci: -1 }; const o = p.blank(PW, PH); for (let k = 0; k < PW * PH; k++) { o.d[k * 4] = BG[0]; o.d[k * 4 + 1] = BG[1]; o.d[k * 4 + 2] = BG[2]; o.d[k * 4 + 3] = 255; } const c = idleCells[i]; for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) { const s = (y * CW + x) * 4; if (c.d[s + 3]) c.d.copy(o.d, ((y + MARGIN) * PW + x + MARGIN) * 4, s, s + 4); } return o; };
const up = (img, k) => k > 1 ? p.nearestUp(img, k) : img;
// 1) 이펙트 포함 루프: 공격(이펙트 포함) 후 Idle 앞 3프레임(0.5초) 쉼
{
  const imgs = scenes.map(s => frameImage(s.st, 1)), delays = scenes.map(s => s.ms);
  [...[0, 1, 2].map(i => idleScene(i))].forEach(im => { imgs.push(im); delays.push(170); });
  const file = path.join(OUT, `Sentinel_AttackThrust_${TAG}_1_with-fx_loop_x4.gif`), big = imgs.map(im => up(im, 4));
  FX.writeGif(file, big, delays, { diff: true }); verify(file, big.length, delays.reduce((a, b) => a + b, 0));
  console.log('G1. 이펙트 포함 루프 x4', big[0].w + 'x' + big[0].h, fs.statSync(file).size + 'B', '장면', scenes.length, '색차', worst(file, big));
  const file2 = path.join(OUT, `Sentinel_AttackThrust_${TAG}_2_with-fx_actual-size_x2.gif`), small = imgs.map(im => up(im, 2));
  FX.writeGif(file2, small, delays, { diff: true }); verify(file2, small.length, delays.reduce((a, b) => a + b, 0)); console.log('G2. 이펙트 포함 실제 크기 x2', small[0].w + 'x' + small[0].h, fs.statSync(file2).size + 'B', '색차', worst(file2, small));
}
// 2) 캐릭터만 (이펙트 없음) 확대
{
  const imgs = cells.map(c => { const o = p.blank(CW, CH); for (let i = 0; i < CW * CH; i++) { o.d[i * 4] = BG[0]; o.d[i * 4 + 1] = BG[1]; o.d[i * 4 + 2] = BG[2]; o.d[i * 4 + 3] = 255; } for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) { const s = (y * CW + x) * 4; if (c.d[s + 3]) c.d.copy(o.d, (y * CW + x) * 4, s, s + 4); } return p.nearestUp(o, 6); });
  const file = path.join(OUT, `Sentinel_AttackThrust_${TAG}_3_character-only_x6.gif`); FX.writeGif(file, imgs, MS, { diff: true }); verify(file, N, TOTAL);
  console.log('G3. 캐릭터만 x6', imgs[0].w + 'x' + imgs[0].h, fs.statSync(file).size + 'B', '색차', worst(file, imgs));
}
// 3) 게임 화면 합성 (이전 캡처의 애벌레 자리를 지우고 센티넬+이펙트를 같은 슬롯 발 기준에 둠. 실제 Unity 영상이 아님)
{
  const scr = p.decode('C:/Users/MBC-501-15/Documents/Tetrigeon/CountdownUI_VARCO/work/game_screen_empty_board.png');
  const COX = 1533, COY = 155, mask = new Uint8Array(scr.w * scr.h);
  for (let i = 0; i < 10; i++) { const f = LC.loadIdle(i); for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) if (f.d[(y * 64 + x) * 4 + 3]) for (let dy = -1; dy < 3; dy++) for (let dx = -1; dx < 3; dx++) mask[(COY + y * 2 + dy) * scr.w + COX + x * 2 + dx] = 1; }
  const bg = { w: scr.w, h: scr.h, d: Buffer.from(scr.d) };
  for (let y = 0; y < scr.h; y++) { let x = 0; while (x < scr.w) { if (!mask[y * scr.w + x]) { x++; continue; } let e = x; while (e < scr.w && mask[y * scr.w + e]) e++; const l = x - 1, r = e; for (let k = x; k < e; k++) { const tt = (k - l) / (r - l); for (let c = 0; c < 3; c++) bg.d[(y * scr.w + k) * 4 + c] = Math.round(scr.d[(y * scr.w + l) * 4 + c] * (1 - tt) + scr.d[(y * scr.w + r) * 4 + c] * tt); } x = e; } }
  const SX = 1597 - (OX + 48) * 2, SY = 259 - BASE_Y * 2; // 셀 원점 (발 기준점이 슬롯의 발 (1597,259) 에 오도록)
  const place = (o, img, ox, oy) => { for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) { const s = (y * img.w + x) * 4; if (!img.d[s + 3]) continue; for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) { const X = ox + x * 2 + dx, Y = oy + y * 2 + dy; if (X < 0 || Y < 0 || X >= o.w || Y >= o.h) continue; img.d.copy(o.d, (Y * o.w + X) * 4, s, s + 3); o.d[(Y * o.w + X) * 4 + 3] = 255; } } };
  const render = (st, idleIdx) => { const o = { w: scr.w, h: scr.h, d: Buffer.from(bg.d) }; place(o, idleIdx != null ? idleCells[idleIdx] : cells[st.ci], SX, SY); if (st && st.cf >= 0) place(o, FXM.charge[st.cf], SX + Math.round(chargeAnchor[0] - 27.5) * 2, SY + Math.round(chargeAnchor[1] - 27.5) * 2); if (st && st.bf >= 0) place(o, FXM.burst[st.bf], SX + Math.round(burstAnchor[0] - 35.5) * 2, SY + Math.round(burstAnchor[1] - 35.5) * 2); return o; };
  const tight = [1280, 20, 640, 330];
  const cropK = (img, k) => k > 1 ? p.nearestUp(p.crop(img, tight[0], tight[1], tight[2], tight[3]), k) : p.crop(img, tight[0], tight[1], tight[2], tight[3]);
  const seq = [...[0, 1, 2, 3, 4, 5].map(i => ({ idle: i, ms: 170 })), ...scenes.map(s => ({ st: s.st, ms: s.ms })), ...[0, 1, 2, 3, 4, 5].map(i => ({ idle: i, ms: 170 }))];
  const imgs = seq.map(s => cropK(render(s.st, s.idle), 2)), delays = seq.map(s => s.ms), file = path.join(OUT, `Sentinel_AttackThrust_${TAG}_4_game-composite_x2.gif`);
  FX.writeGif(file, imgs, delays, { diff: true }); verify(file, imgs.length, delays.reduce((a, b) => a + b, 0)); console.log('G4. 게임 화면 합성 x2', imgs[0].w + 'x' + imgs[0].h, fs.statSync(file).size + 'B', '색차', worst(file, imgs));
  // 정지 화면: 기 모으기 3단계 시점, 터짐 시작 직후, 터짐 중간
  const pick = (ms) => stateAt(ms), stills = [['charge3', chargeEnd - 20], ['burst1', burstStart + FXMS * 1], ['burst3', burstStart + FXMS * 3]];
  stills.forEach(([name, ms]) => p.encode(cropK(render(pick(ms), null), 2), path.join(OUT, `Sentinel_AttackThrust_${TAG}_5_still_${name}_x2.png`)));
}
// ---------- 기록 ----------
const frames = J.frames.map((f, i) => ({ slot: i + 1, sheet_frame: f.dupOf ? uniq.indexOf(f.dupOf - 1) + 1 : uniq.indexOf(i) + 1, role: f.role, source: f.src || 'AmethystSentinel_Idle_01 (원본 그대로)', ms: f.ms, start_ms: T0[i], squash: f.squash || null, rightFootAnchor: f.rf || null }));
const meta = { name: `Sentinel_AttackThrust_${TAG}`, unity_applied: false, status: '새 모션(당김 -> 기 모으기 -> 내지름) + 이펙트 2종, 미리보기 단계, 사용자 컨펌 대기',
  sheet: { file: `T_AmethystSentinel_AttackThrust_${TAG}.png`, size: [CW * COLS, CH * ROWS], cell: [CW, CH], layout: `${COLS}열 x ${ROWS}행, 왼쪽 위부터 01~${uniq.length} (시간표 ${N}칸이 이 그림들을 참조)`, frames: uniq.length, timeline_slots: N, alpha: '실제 투명 PNG, 알파 0/255만' },
  pivot: { anchor_px_in_cell: [OX + 48, BASE_Y], unity_normalized: [0.5, +(10 / CH).toFixed(4)], ppu: 75.6, note: '원본 Idle 셀(96x96)을 (24,8)에 둔 144x104 캔버스. 원본 발 기준과 같은 지점' },
  playback: { total_ms: TOTAL, frame_ms: J.frames.map(f => f.ms), hit_frame: iHit + 1, hit_start_ms: T0[iHit], charge_start_ms: chargeStart, charge_end_ms: chargeEnd },
  fx: { charge: { sheet: 'output/fx/FX_SentinelCharge_sheet.png', cell: [56, 56], grid: '6열 x 3행 (행 = 단계 1,2,3, 열 = 루프 프레임 0~5)', anchor_in_character_cell: chargeAnchor, schedule: `단계 1(루프 프레임 0~3) -> 단계 2(0~3) -> 단계 3(0~2), 이펙트 한 프레임 ${FXMS}ms, 당김 프레임 시작부터 내지름 중간 시작 전까지(${chargeEnd - chargeStart}ms)`, center_px_in_fx_cell: [27.5, 27.5] },
    burst: { sheet: 'output/fx/FX_SentinelBurst_sheet.png', cell: [72, 72], frames: 8, frame_ms: FXMS, anchor_in_character_cell: burstAnchor, start_ms: burstStart, note: '내지름 정점 프레임 시작과 함께 한 번 재생, 세계 좌표에 고정(반동 때 팔을 따라가지 않음)', center_px_in_fx_cell: [35.5, 35.5] },
    palette: '청록 3 + 보라 6 + 근백색 1 = 10색', display: '도트 1칸 = FHD 화면 2px (센티넬과 같은 밀도)' },
  frames, sources: 'tools/frames_t1.json 참고' };
fs.writeFileSync(path.join(OUT, `Sentinel_AttackThrust_${TAG}.json`), JSON.stringify(meta, null, 2));
console.log('기록 저장: 총', TOTAL + 'ms', '타격 시작', T0[iHit] + 'ms', '기 모으기', chargeStart + '~' + chargeEnd + 'ms');
