// 수정여왕 회전 잠금 전체 프레임 미리보기 (작업 폴더 전용, Unity 영상 아님): 저장된 시간표·셀 PNG 를 다시 읽어 GIF·검사 이미지를 만든다.
// 층 순서: 캐릭터(승인된 일반공격 v3 셀) → 이펙트(손 기운·룬·자물쇠·섬광, 캐릭터 앞). 비교용: 일반공격 이펙트 CastFrames_v3_fx, 증식 SKILL 이펙트 SkillFrames_v1_fx (읽기 전용).
const fs = require('fs'), path = require('path');
const L = require('./lib_view.js'), { p, S, OUT } = L, N = require('./lib_next.js'), FXL = require('../../PixelFX_VARCO/tools/lib_fx.js'), { decode: gifDecode } = require('../../PixelFX_VARCO/tools/gif_check.js');
const VER = 'v1', J = JSON.parse(fs.readFileSync(path.join(OUT, 'RotLockFrames_' + VER + '_timeline.json'), 'utf8')), STEPS = J.steps;
const BG = L.BG, CROP = [4, 16, 156, 132], REST = J.rest_between_attacks_ms, empty = p.blank(160, 160), opaque = L.opaque, put = L.put, label = L.label;
const load = (f) => f ? p.decode(path.join(OUT, f)) : empty;
const CH = STEPS.map(s => load(s.character)), FT = STEPS.map(s => load(s.fx)), REST_CH = CH[0]; // 저장된 파일에서 다시 읽음
const NFT = STEPS.map(s => L.normalFx(s.step)), GFT = STEPS.map(s => L.growthFx(s.step));
const msList = STEPS.map(s => s.ms), loopDelays = msList.map((m, i) => m + (i === 0 ? REST : 0)), total = (a) => a.reduce((x, y) => x + y, 0);
const GIFN = (name) => path.join(OUT, 'CrystalQueenRotLock_Frames_' + VER + '_preview_' + name + '.gif');
function worst(file, src) { const g = gifDecode(fs.readFileSync(file)); let w = 0; g.frames.forEach((fr, k) => { for (let i = 0; i < src[k].w * src[k].h * 4; i++) { if (i % 4 === 3) continue; const d = Math.abs(fr.d[i] - src[k].d[i]); if (d > w) w = d; } }); return w; }
const info = [];
const GQ = require('./lib_gifq.js');
const PROT = (() => { const m = new Map(); const add = (img) => { for (let i = 0; i < img.w * img.h; i++) { const o = i * 4; if (!img.d[o + 3]) continue; m.set((img.d[o] << 16) | (img.d[o + 1] << 8) | img.d[o + 2], [img.d[o], img.d[o + 1], img.d[o + 2]]); } }; CH.forEach(add); FT.forEach(add); add(N.ICON); for (const c of Object.values(L.F.PAL)) m.set((c[0] << 16) | (c[1] << 8) | c[2], c); return [...m.values()]; })();
const gifQ = (name, imgs, delays, once) => { const q = GQ.prequant(imgs, PROT); console.log(name, '사전 양자화: 보호 색', q.info.protected + '칸, 배경 ' + q.info.background + '칸'); gif(name, q.frames, delays, once, imgs); };
function gif(name, imgs, delays, once, orig) { // once=true: 반복 정보(NETSCAPE) 블록을 빼서 1회만 재생하고 마지막 장면에서 멈춤
  const f = GIFN(name); FXL.writeGif(f, imgs, delays, { diff: true });
  if (once) { const b = fs.readFileSync(f), at = b.indexOf('NETSCAPE2.0'), s = at - 3; if (at < 0 || b[s] !== 0x21) throw new Error('반복 블록 위치 이상'); fs.writeFileSync(f, Buffer.concat([b.subarray(0, s), b.subarray(s + 19)])); }
  const g = gifDecode(fs.readFileSync(f)), sum = g.frames.reduce((a, fr) => a + fr.delay, 0); if (g.frames.length !== imgs.length || sum !== total(delays)) throw new Error(name + ' 프레임/시간 불일치 ' + g.frames.length + '/' + sum);
  const w = worst(f, orig || imgs); info.push({ file: path.basename(f), size: imgs[0].w + 'x' + imgs[0].h, bytes: fs.statSync(f).size, frames: g.frames.length, total_ms: sum, max_color_diff: w, loop: !once });
  console.log(path.basename(f), imgs[0].w + 'x' + imgs[0].h, fs.statSync(f).size + 'B', '프레임', g.frames.length, '합계', sum + 'ms', '색차', w, once ? '(1회 재생)' : '(반복)');
}
const view = (k, fn, n = STEPS.length) => Array.from({ length: n }, (_, i) => { const o = opaque(CROP[2] * k, CROP[3] * k, BG); fn(o, i, k); return o; });
const put1 = (o, cell, k) => put(o, cell, 0, 0, k, [CROP[0], CROP[1]]);
const comp = (o, i, k) => { put1(o, CH[i], k); put1(o, FT[i], k); };
// 1) 이펙트 단독 / 캐릭터 합성 (최근접 ×4) / 실제 게임 표시 크기(×2, 1 스프라이트 px = 화면 2px)
gif('1_rotlock-fx-only_x4', view(4, (o, i, k) => put1(o, FT[i], k)), loopDelays);
gif('2_rotlock-composite_x4', view(4, comp), loopDelays);
gif('3_rotlock-composite_actual-size_x2', view(2, comp), loopDelays);
// 2) 실제 게임 화면 합성 (보스 자리 오른쪽 위 320x310, 화면 맨 위부터 잘라 위쪽 여백 포함)
const scr = L.SCR(), TIGHT = [1600, 0, 320, 310];
const gameFrame = (chc, fxc) => p.nearestUp(p.crop(L.onScreen(scr, chc, fxc), ...TIGHT), 2);
const GAME = STEPS.map((s, i) => gameFrame(CH[i], FT[i]));
gifQ('4_rotlock-game-screen_x2', GAME, loopDelays);
// 3) 일반공격 | 증식 SKILL | 회전 잠금 나란히, 같은 시간표 (최근접 ×2) + 일반공격 | 회전 잠금 (×3)
function sideBySide(k, cols) { const SW = CROP[2] * k, H = CROP[3] * k, GAP = 8; return STEPS.map((_, i) => { const o = opaque(cols.length * SW + (cols.length - 1) * GAP, H, [12, 14, 20]); cols.forEach((fxs, n) => { const t = opaque(SW, H, BG); put1(t, CH[i], k); put1(t, fxs[i], k); for (let y = 0; y < H; y++) t.d.copy(o.d, (y * o.w + n * (SW + GAP)) * 4, y * SW * 4, (y + 1) * SW * 4); }); return o; }); }
gif('5_normal-vs-growth-vs-rotlock_x2', sideBySide(2, [NFT, GFT, FT]), loopDelays);
gif('5b_normal-vs-rotlock_x3', sideBySide(3, [NFT, FT]), loopDelays);
// 4) 1회 재생(반복 없음, 마지막에 기본 자세로 멈춤) / 기본 자세 → SKILL → 기본 자세 (게임 화면 ×2, 반복)
gif('6_rotlock-play-once_x4', [...view(4, comp), ...view(4, (o) => put1(o, REST_CH, 4), 1)], [...msList, 1500], true);
const idleFrame = () => gameFrame(REST_CH, empty);
gifQ('7_idle-rotlock-idle_game-screen_x2', [idleFrame(), ...GAME, idleFrame()], [600, ...msList, 800]);
// 5) NEXT 연결 제안 미리보기 (비주얼 제안): 잠금 완료(T11) 순간 NEXT 맨 위 두 칸 둘레 강조(T11 전체, T12 안쪽만, T13 부터 꺼짐) + 자물쇠 아이콘은 T11 부터 남음. 화면 [1180,0,740,640] ×1
const MK = N.nextMarks(scr), NC = [1180, 0, 740, 640];
const nextFrame = (chc, fxc, level, icon) => { const o = { w: scr.w, h: scr.h, d: Buffer.from(scr.d) }; put(o, chc, L.SX, L.SY, 2, [0, 0]); put(o, fxc, L.SX, L.SY, 2, [0, 0]); MK.apply(o, level, icon); return p.crop(o, ...NC); };
const lvl = (id) => id === 'T11' ? 'full' : id === 'T12' ? 'inner' : 'none', iconOn = (id) => id >= 'T11';
const NEXTF = STEPS.map((s, i) => nextFrame(CH[i], FT[i], lvl(s.step), iconOn(s.step)));
gifQ('8_rotlock-next-link_x1', [nextFrame(REST_CH, empty, 'none', false), ...NEXTF, nextFrame(REST_CH, empty, 'none', true)], [600, ...msList, 1400]);
// 6) 전체 프레임 검사 이미지: 단계 번호(위, 흰색) · ms(아래), 잠금 완료 단계(발동 기준)는 연한 푸른 점 표시
function sheet(name, k, cols, tiles) {
  const tw = CROP[2] * k, th = CROP[3] * k, rows = Math.ceil(tiles.length / cols), o = opaque(cols * tw + (cols - 1) * 4, rows * th + (rows - 1) * 4, BG);
  tiles.forEach((t, i) => { const ox = (i % cols) * (tw + 4), oy = Math.floor(i / cols) * (th + 4); for (let y = 0; y < th; y++) t.d.copy(o.d, ((oy + y) * o.w + ox) * 4, y * t.w * 4, (y * t.w + tw) * 4); label(o, ox + 4, oy + 4, String(i).padStart(2, '0'), 2, [255, 255, 255]); label(o, ox + 4, oy + 18, STEPS[i].ms, 2, [160, 170, 190]); if (STEPS[i].step === 'T11') for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { const q = ((oy + 32 + y) * o.w + ox + 4 + x) * 4; o.d[q] = 182; o.d[q + 1] = 194; o.d[q + 2] = 255; o.d[q + 3] = 255; } });
  const f = path.join(OUT, 'CrystalQueenRotLock_Frames_' + VER + '_' + name + '.png'); p.encode(o, f); console.log(path.basename(f), o.w + 'x' + o.h);
}
sheet('frames-composite_x2', 2, 6, view(2, comp)); sheet('frames-fx_x2', 2, 6, view(2, (o, i, k) => put1(o, FT[i], k)));
// 룬·자물쇠 확대 검사(몸 없이, 룬 둘레 44x44 ×8): 회전·정지·자물쇠 상태를 한눈에
function grid2(tiles, cols, gap) { const tw = tiles[0].w, th = tiles[0].h, rows = Math.ceil(tiles.length / cols), o = opaque(cols * tw + (cols - 1) * gap, rows * th + (rows - 1) * gap, [12, 14, 20]); const ids = STEPS.filter(s => s.fx).map(s => +s.step.slice(1)); tiles.forEach((t, i) => { const ox = (i % cols) * (tw + gap), oy = Math.floor(i / cols) * (th + gap); for (let y = 0; y < th; y++) t.d.copy(o.d, ((oy + y) * o.w + ox) * 4, y * t.w * 4, (y * t.w + tw) * 4); label(o, ox + 6, oy + 6, ids[i], 3, [255, 255, 255]); }); return o; }
const runeTiles = STEPS.filter(s => s.fx).map(s => { const i = STEPS.indexOf(s), cx = s.rune_center_block ? 2 * s.rune_center_block[0] + 1 : 98, o = opaque(160, 160, [20, 24, 40]); put(o, FT[i], 0, 0, 1, [0, 0]); return p.nearestUp(p.crop(o, Math.max(0, Math.min(160 - 44, cx - 22)), 18, 44, 44), 8); });
{ const g = grid2(runeTiles, 4, 6), f = path.join(OUT, 'CrystalQueenRotLock_Frames_' + VER + '_rune-lock-closeup_x8.png'); p.encode(g, f); console.log(path.basename(f), g.w + 'x' + g.h); }
fs.writeFileSync(path.join(OUT, 'RotLockFrames_' + VER + '_preview.json'), JSON.stringify({ note: '미리보기 GIF 는 시간표 그대로(반복판은 첫 단계 앞에 기본 자세 500ms 쉼, 7·8번은 앞뒤에 기본 자세 여유). 합성이며 실제 Unity 영상이 아님. 8번은 NEXT 연결 비주얼 제안(실제 UI 아님).', loop_ms: total(loopDelays), attack_ms: J.attack_ms, composite: { source: 'CountdownUI_VARCO/work/game_screen_empty_board.png', boss_slot: '스테이지 10 맨 오른쪽 (x 7.7)', cell_origin_screen: [L.SX, L.SY], crop: TIGHT, scale: 2, next_link_crop: NC }, gifs: info }, null, 1));
console.log('셀 원점 화면', L.SX, L.SY);
