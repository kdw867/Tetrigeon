// 시전 공격 미리보기 v2 (작업 폴더 전용, Unity와 무관): 저장된 시간표·셀을 다시 읽어 캐릭터/이펙트/합성 GIF, 게임 화면 합성, 프레임 검사 이미지를 만든다.
// 층 순서: 캐릭터 → 이펙트(수정·마법·섬광, 캐릭터 앞)
const fs = require('fs'), path = require('path');
const p = require('../../PauseUI_VARCO/tools/pix.js');
const FXL = require('../../PixelFX_VARCO/tools/lib_fx.js');
const { decode: gifDecode } = require('../../PixelFX_VARCO/tools/gif_check.js');
const VER = 'v3', OUT = path.join(__dirname, '..', 'output'), J = JSON.parse(fs.readFileSync(path.join(OUT, 'CastFrames_' + VER + '_timeline.json'), 'utf8')), STEPS = J.steps;
const BG = [40, 46, 60], CROP = [4, 20, 156, 135], REST_MS = J.rest_between_attacks_ms, empty = p.blank(160, 160);
const load = (f) => f ? p.decode(path.join(OUT, f)) : empty;
const CH = STEPS.map(s => load(s.character)), FT = STEPS.map(s => load(s.fx)); // 저장된 파일에서 다시 읽음
const opaque = (w, h, col) => { const o = p.blank(w, h); for (let i = 0; i < w * h; i++) { o.d[i * 4] = col[0]; o.d[i * 4 + 1] = col[1]; o.d[i * 4 + 2] = col[2]; o.d[i * 4 + 3] = 255; } return o; };
const place = (o, cell, ox, oy, k, c0) => { for (let y = 0; y < 160; y++) for (let x = 0; x < 160; x++) { const s = (y * 160 + x) * 4; if (!cell.d[s + 3]) continue; for (let dy = 0; dy < k; dy++) for (let dx = 0; dx < k; dx++) { const X = ox + (x - c0[0]) * k + dx, Y = oy + (y - c0[1]) * k + dy; if (X < 0 || Y < 0 || X >= o.w || Y >= o.h) continue; cell.d.copy(o.d, (Y * o.w + X) * 4, s, s + 3); o.d[(Y * o.w + X) * 4 + 3] = 255; } } };
// 3x5 숫자 글꼴 (프레임 검사 이미지의 단계 번호·시간 표시용)
const DIG = ['111101101101111', '010110010010111', '111001111100111', '111001111001111', '101101111001001', '111100111001111', '111100111101111', '111001001001001', '111101111101111', '111101111001111'];
function label(o, x, y, text, k, col) { [...String(text)].forEach((ch, n) => { const g = DIG[+ch]; if (!g) return; for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) if (g[j * 3 + i] === '1') for (let dy = 0; dy < k; dy++) for (let dx = 0; dx < k; dx++) { const X = x + (n * 4 + i) * k + dx, Y = y + j * k + dy; if (X >= 0 && Y >= 0 && X < o.w && Y < o.h) { const q = (Y * o.w + X) * 4; o.d[q] = col[0]; o.d[q + 1] = col[1]; o.d[q + 2] = col[2]; o.d[q + 3] = 255; } } }); }
const delays = STEPS.map((s, i) => s.ms + (i === 0 ? REST_MS : 0)), total = delays.reduce((a, b) => a + b, 0);
const verify = (file, count) => { const g = gifDecode(fs.readFileSync(file)); const sum = g.frames.reduce((a, f) => a + f.delay, 0); if (g.frames.length !== count || sum !== total) throw new Error(file + ' 프레임/시간 불일치 ' + g.frames.length + '/' + sum); return g; };
const worst = (file, src) => { const g = gifDecode(fs.readFileSync(file)); let w = 0; g.frames.forEach((fr, k) => { for (let i = 0; i < src[k].w * src[k].h * 4; i += 4) { const d = Math.max(Math.abs(fr.d[i] - src[k].d[i]), Math.abs(fr.d[i + 1] - src[k].d[i + 1]), Math.abs(fr.d[i + 2] - src[k].d[i + 2])); if (d > w) w = d; } } ); return w; };
const gif = (name, imgs) => { const f = path.join(OUT, 'CrystalQueen_CastFrames_' + VER + '_preview_' + name + '.gif'); FXL.writeGif(f, imgs, delays, { diff: true }); verify(f, imgs.length); console.log(path.basename(f), imgs[0].w + 'x' + imgs[0].h, fs.statSync(f).size + 'B', '색차', worst(f, imgs)); };
const view = (k, fn) => STEPS.map((s, i) => { const o = opaque(CROP[2] * k, CROP[3] * k, BG); fn(o, i, k); return o; });
const put = (o, cell, k) => place(o, cell, 0, 0, k, [CROP[0], CROP[1]]);
const comp = (o, i, k) => { put(o, CH[i], k); put(o, FT[i], k); };
gif('1_character_x4', view(4, (o, i, k) => put(o, CH[i], k)));
gif('2_fx_x4', view(4, (o, i, k) => put(o, FT[i], k)));
gif('3_composite_actual-size_x2', view(2, comp));
gif('4_composite_x4', view(4, comp));
// 게임 화면 합성: 10스테이지 맨 오른쪽 보스 자리 (이전 미리보기와 같은 계산)
const scr = p.decode('C:/Users/MBC-501-15/Documents/Tetrigeon/CountdownUI_VARCO/work/game_screen_empty_board.png');
const PX = 960 + (5.9 + 1.8 - 0.15873016 * 1.4) * 108, PY = 540 - (3.1 + 0.43650794 * 1.4) * 108, SX = Math.round(PX - 80 * 2), SY = Math.round(PY - 88 * 2), TIGHT = [1600, 0, 320, 310];
const comps = STEPS.map((s, i) => { const o = { w: scr.w, h: scr.h, d: Buffer.from(scr.d) }; for (const c of [CH[i], FT[i]]) place(o, c, SX, SY, 2, [0, 0]); return p.nearestUp(p.crop(o, TIGHT[0], TIGHT[1], TIGHT[2], TIGHT[3]), 2); });
gif('5_game-composite_x2', comps);
let fxMax = 0, fxMin = 9999; FT.forEach(c => { for (let y = 0; y < 160; y++) for (let x = 0; x < 160; x++) if (c.d[(y * 160 + x) * 4 + 3]) { fxMax = Math.max(fxMax, SX + (x + 1) * 2 - 1); fxMin = Math.min(fxMin, SX + x * 2); } });
function sheet(name, k, cols, tiles, labels) { // 프레임 검사 이미지: 단계 번호(위) · ms(아래) 표시
  const tw = CROP[2] * k, th = CROP[3] * k, rows = Math.ceil(tiles.length / cols), o = opaque(cols * tw + (cols - 1) * 4, rows * th + (rows - 1) * 4, BG);
  tiles.forEach((t, i) => { const ox = (i % cols) * (tw + 4), oy = Math.floor(i / cols) * (th + 4); for (let y = 0; y < th; y++) t.d.copy(o.d, ((oy + y) * o.w + ox) * 4, y * t.w * 4, (y * t.w + tw) * 4); label(o, ox + 4, oy + 4, labels[i][0], 2, [255, 255, 255]); label(o, ox + 4, oy + 18, labels[i][1], 2, [160, 170, 190]); });
  const f = path.join(OUT, 'CrystalQueen_CastFrames_' + VER + '_' + name + '.png'); p.encode(o, f); console.log(path.basename(f), o.w + 'x' + o.h);
}
const lab = STEPS.map((s, i) => [String(i).padStart(2, '0'), s.ms]);
sheet('frames-composite_x2', 2, 6, view(2, comp), lab);
sheet('frames-character_x2', 2, 6, view(2, (o, i, k) => put(o, CH[i], k)), lab);
sheet('frames-fx_x2', 2, 6, view(2, (o, i, k) => put(o, FT[i], k)), lab);
fs.writeFileSync(path.join(OUT, 'CastFrames_' + VER + '_preview.json'), JSON.stringify({ note: '미리보기 GIF 는 시간표 그대로, 첫 단계는 기본 자세 500ms 쉼 + 40ms. 게임 합성은 실제 Unity 영상이 아님.', loop_ms: total, attack_ms: total - REST_MS, rest_between_attacks_ms: REST_MS, composite: { source: 'CountdownUI_VARCO/work/game_screen_empty_board.png', boss_slot: '스테이지 10 맨 오른쪽 (x 7.7)', sprite_pivot_screen: [+PX.toFixed(1), +PY.toFixed(1)], cell_origin_screen: [SX, SY], crop: TIGHT, fx_screen_x_range: [fxMin, fxMax], screen_width: scr.w } }, null, 1));
console.log('원점', SX, SY, '이펙트 화면 x 범위', fxMin, '~', fxMax, '(화면 폭', scr.w + ')', '루프', total, 'ms');
