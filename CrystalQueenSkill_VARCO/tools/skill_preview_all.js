// 수정여왕 SKILL 전체 프레임 미리보기 (작업 폴더 전용, Unity 영상 아님): 저장된 시간표·셀 PNG 를 다시 읽어 GIF·검사 이미지를 만든다.
// 층 순서: 캐릭터(승인된 일반공격 v3 셀) → 이펙트(손 기운·왕관·파열, 캐릭터 앞). 일반공격 비교용 이펙트는 CastFrames_v3_fx(읽기 전용).
const fs = require('fs'), path = require('path');
const p = require('../../PauseUI_VARCO/tools/pix.js'), FXL = require('../../PixelFX_VARCO/tools/lib_fx.js'), { decode: gifDecode } = require('../../PixelFX_VARCO/tools/gif_check.js'), S = require('./skill_frames.js');
const OUT = S.OUT, VER = 'v1', J = JSON.parse(fs.readFileSync(path.join(OUT, 'SkillFrames_' + VER + '_timeline.json'), 'utf8')), STEPS = J.steps;
const BG = [40, 46, 60], CROP = [4, 16, 156, 132], REST = J.rest_between_attacks_ms, empty = p.blank(160, 160); // CROP: 왕관(줄 19)부터 발바닥(147)까지 포함
const load = (f) => f ? p.decode(path.join(OUT, f)) : empty;
const CH = STEPS.map(s => load(s.character)), FT = STEPS.map(s => load(s.fx)), REST_CH = CH[0]; // 저장된 파일에서 다시 읽음
const NFT = STEPS.map(s => { const f = path.join(S.ATK, 'CastFrames_v3_fx', 'CrystalQueen_CastFx_' + s.step + '.png'); return fs.existsSync(f) ? p.decode(f) : empty; }); // 일반공격 이펙트(비교용)
const opaque = (w, h, col) => { const o = p.blank(w, h); for (let i = 0; i < w * h; i++) { o.d[i * 4] = col[0]; o.d[i * 4 + 1] = col[1]; o.d[i * 4 + 2] = col[2]; o.d[i * 4 + 3] = 255; } return o; };
const put = (o, cell, ox, oy, k, c0) => { for (let y = 0; y < 160; y++) for (let x = 0; x < 160; x++) { const s = (y * 160 + x) * 4; if (!cell.d[s + 3]) continue; for (let dy = 0; dy < k; dy++) for (let dx = 0; dx < k; dx++) { const X = ox + (x - c0[0]) * k + dx, Y = oy + (y - c0[1]) * k + dy; if (X < 0 || Y < 0 || X >= o.w || Y >= o.h) continue; cell.d.copy(o.d, (Y * o.w + X) * 4, s, s + 3); o.d[(Y * o.w + X) * 4 + 3] = 255; } } };
const DIG = ['111101101101111', '010110010010111', '111001111100111', '111001111001111', '101101111001001', '111100111001111', '111100111101111', '111001001001001', '111101111101111', '111101111001111'];
function label(o, x, y, text, k, col) { [...String(text)].forEach((ch, n) => { const g = DIG[+ch]; if (!g) return; for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) if (g[j * 3 + i] === '1') for (let dy = 0; dy < k; dy++) for (let dx = 0; dx < k; dx++) { const X = x + (n * 4 + i) * k + dx, Y = y + j * k + dy; if (X >= 0 && Y >= 0 && X < o.w && Y < o.h) { const q = (Y * o.w + X) * 4; o.d[q] = col[0]; o.d[q + 1] = col[1]; o.d[q + 2] = col[2]; o.d[q + 3] = 255; } } }); }
const msList = STEPS.map(s => s.ms), loopDelays = msList.map((m, i) => m + (i === 0 ? REST : 0)), total = (a) => a.reduce((x, y) => x + y, 0);
const GIFN = (name) => path.join(OUT, 'CrystalQueenSkill_Frames_' + VER + '_preview_' + name + '.gif');
function worst(file, src) { const g = gifDecode(fs.readFileSync(file)); let w = 0; g.frames.forEach((fr, k) => { for (let i = 0; i < src[k].w * src[k].h * 4; i++) { const a = i & ~3; if (i % 4 === 3) continue; const d = Math.abs(fr.d[i] - src[k].d[i]); if (d > w) w = d; } }); return w; }
function gif(name, imgs, delays, once) { // once=true: 반복 정보(NETSCAPE) 블록을 빼서 1회만 재생하고 마지막 장면에서 멈춤
  const f = GIFN(name); FXL.writeGif(f, imgs, delays, { diff: true });
  if (once) { const b = fs.readFileSync(f), at = b.indexOf('NETSCAPE2.0'), s = at - 3; if (at < 0 || b[s] !== 0x21) throw new Error('반복 블록 위치 이상'); fs.writeFileSync(f, Buffer.concat([b.subarray(0, s), b.subarray(s + 19)])); }
  const g = gifDecode(fs.readFileSync(f)), sum = g.frames.reduce((a, fr) => a + fr.delay, 0); if (g.frames.length !== imgs.length || sum !== total(delays)) throw new Error(name + ' 프레임/시간 불일치 ' + g.frames.length + '/' + sum);
  console.log(path.basename(f), imgs[0].w + 'x' + imgs[0].h, fs.statSync(f).size + 'B', '프레임', g.frames.length, '합계', sum + 'ms', '색차', worst(f, imgs), once ? '(1회 재생)' : '(반복)');
}
const view = (k, fn, n = STEPS.length) => Array.from({ length: n }, (_, i) => { const o = opaque(CROP[2] * k, CROP[3] * k, BG); fn(o, i, k); return o; });
const put1 = (o, cell, k) => put(o, cell, 0, 0, k, [CROP[0], CROP[1]]);
const comp = (o, i, k) => { put1(o, CH[i], k); put1(o, FT[i], k); };
// 1) 이펙트 단독 / 캐릭터 합성 (최근접 ×4) / 실제 게임 표시 크기(×2, 1 스프라이트 px = 화면 2px)
gif('1_skill-fx-only_x4', view(4, (o, i, k) => put1(o, FT[i], k)), loopDelays);
gif('2_skill-composite_x4', view(4, comp), loopDelays);
gif('3_skill-composite_actual-size_x2', view(2, comp), loopDelays);
// 2) 실제 게임 화면 합성 (이전 미리보기와 같은 계산, 스테이지 10 맨 오른쪽 보스 자리, 화면 맨 위부터 잘라 위쪽 여백 포함)
const scr = p.decode('C:/Users/MBC-501-15/Documents/Tetrigeon/CountdownUI_VARCO/work/game_screen_empty_board.png');
const PX = 960 + (5.9 + 1.8 - 0.15873016 * 1.4) * 108, PY = 540 - (3.1 + 0.43650794 * 1.4) * 108, SX = Math.round(PX - 80 * 2), SY = Math.round(PY - 88 * 2), TIGHT = [1600, 0, 320, 310];
const gameFrame = (chc, fxc) => { const o = { w: scr.w, h: scr.h, d: Buffer.from(scr.d) }; for (const c of [chc, fxc]) put(o, c, SX, SY, 2, [0, 0]); return p.nearestUp(p.crop(o, TIGHT[0], TIGHT[1], TIGHT[2], TIGHT[3]), 2); };
const GAME = STEPS.map((s, i) => gameFrame(CH[i], FT[i]));
gif('4_skill-game-screen_x2', GAME, loopDelays);
// 3) 일반공격(왼쪽) / SKILL(오른쪽) 나란히, 같은 시간표 (최근접 ×3)
const K3 = 3, GAP = 8, SW = CROP[2] * K3, side = view(K3, () => { }).map((_, i) => { const o = opaque(2 * SW + GAP, CROP[3] * K3, BG); const l = opaque(SW, CROP[3] * K3, BG), r = opaque(SW, CROP[3] * K3, BG); put1(l, CH[i], K3); put1(l, NFT[i], K3); comp(r, i, K3); for (let y = 0; y < o.h; y++) { l.d.copy(o.d, y * o.w * 4, y * SW * 4, (y + 1) * SW * 4); r.d.copy(o.d, (y * o.w + SW + GAP) * 4, y * SW * 4, (y + 1) * SW * 4); for (let g = 0; g < GAP; g++) { const q = (y * o.w + SW + g) * 4; o.d[q] = 12; o.d[q + 1] = 14; o.d[q + 2] = 20; o.d[q + 3] = 255; } } return o; });
gif('5_normal-vs-skill_x3', side, loopDelays);
// 4) SKILL 1회 재생(반복 없음, 마지막에 기본 자세로 멈춤) / 기본 자세 → SKILL → 기본 자세 (게임 화면 ×2, 반복)
const onceImgs = [...view(4, comp), ...view(4, (o) => put1(o, REST_CH, 4), 1)], onceDelays = [...msList, 1500];
gif('6_skill-play-once_x4', onceImgs, onceDelays, true);
const idleImgs = [gameFrame(REST_CH, empty), ...GAME, gameFrame(REST_CH, empty)], idleDelays = [600, ...msList, 800];
gif('7_idle-skill-idle_game-screen_x2', idleImgs, idleDelays);
// 5) 전체 프레임 검사 이미지: 단계 번호(위, 흰색) · ms(아래), 왕관 파열 단계(발동 기준)는 금색 표시
function sheet(name, k, cols, tiles) {
  const tw = CROP[2] * k, th = CROP[3] * k, rows = Math.ceil(tiles.length / cols), o = opaque(cols * tw + (cols - 1) * 4, rows * th + (rows - 1) * 4, BG);
  tiles.forEach((t, i) => { const ox = (i % cols) * (tw + 4), oy = Math.floor(i / cols) * (th + 4); for (let y = 0; y < th; y++) t.d.copy(o.d, ((oy + y) * o.w + ox) * 4, y * t.w * 4, (y * t.w + tw) * 4); label(o, ox + 4, oy + 4, String(i).padStart(2, '0'), 2, [255, 255, 255]); label(o, ox + 4, oy + 18, STEPS[i].ms, 2, [160, 170, 190]); if (STEPS[i].step === 'T11') for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { const q = ((oy + 32 + y) * o.w + ox + 4 + x) * 4; o.d[q] = 252; o.d[q + 1] = 185; o.d[q + 2] = 1; o.d[q + 3] = 255; } });
  const f = path.join(OUT, 'CrystalQueenSkill_Frames_' + VER + '_' + name + '.png'); p.encode(o, f); console.log(path.basename(f), o.w + 'x' + o.h);
}
sheet('frames-composite_x2', 2, 6, view(2, comp)); sheet('frames-fx_x2', 2, 6, view(2, (o, i, k) => put1(o, FT[i], k)));
fs.writeFileSync(path.join(OUT, 'SkillFrames_' + VER + '_preview.json'), JSON.stringify({ note: '미리보기 GIF 는 시간표 그대로(반복판은 첫 단계 앞에 기본 자세 500ms 쉼). 합성이며 실제 Unity 영상이 아님.', loop_ms: total(loopDelays), attack_ms: J.attack_ms, once_gif_hold_ms: 1500, idle_skill_idle_ms: total(idleDelays), composite: { source: 'CountdownUI_VARCO/work/game_screen_empty_board.png', boss_slot: '스테이지 10 맨 오른쪽 (x 7.7)', cell_origin_screen: [SX, SY], crop: TIGHT, scale: 2 } }, null, 1));
console.log('셀 원점 화면', SX, SY);
