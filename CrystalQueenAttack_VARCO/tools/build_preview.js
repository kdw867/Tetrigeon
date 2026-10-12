// 핵심 자세 4장으로 만든 공격 미리보기 (작업 폴더 전용, Unity와 무관): 기본 → 준비 → 타격 → 반동 → 기본, 공격 사이 0.5초 쉼
const fs = require('fs'), path = require('path');
const p = require('../../PauseUI_VARCO/tools/pix.js');
const FX = require('../../PixelFX_VARCO/tools/lib_fx.js');
const { decode: gifDecode } = require('../../PixelFX_VARCO/tools/gif_check.js');
const R = path.join(__dirname, '..'), OUT = path.join(R, 'output'), CELLS = path.join(OUT, 'KeyPoses_v1_cells');
const names = ['1_rest', '2_windup', '3_strike', '4_recoil'], cells = names.map(n => p.decode(path.join(CELLS, 'CrystalQueen_Key_' + n + '.png')));
// 시간표 (ms, 10의 배수): 기본(쉼 0.5초 + 공격 직전 0.12초) → 준비 → 타격(타격 프레임) → 반동 → 반복
const SEQ = [{ c: 0, ms: 620, role: '기본 (공격 사이 쉼 500 + 시작 120)' }, { c: 1, ms: 300, role: '준비' }, { c: 2, ms: 160, role: '타격 (타격 프레임)' }, { c: 3, ms: 180, role: '반동' }];
const BG = [40, 46, 60], CROP = [30, 20, 130, 131];
const opaque = (w, h, col) => { const o = p.blank(w, h); for (let i = 0; i < w * h; i++) { o.d[i * 4] = col[0]; o.d[i * 4 + 1] = col[1]; o.d[i * 4 + 2] = col[2]; o.d[i * 4 + 3] = 255; } return o; };
const place = (o, cell, ox, oy, k, c0) => { for (let y = 0; y < 160; y++) for (let x = 0; x < 160; x++) { const s = (y * 160 + x) * 4; if (!cell.d[s + 3]) continue; for (let dy = 0; dy < k; dy++) for (let dx = 0; dx < k; dx++) { const X = ox + (x - c0[0]) * k + dx, Y = oy + (y - c0[1]) * k + dy; if (X < 0 || Y < 0 || X >= o.w || Y >= o.h) continue; cell.d.copy(o.d, (Y * o.w + X) * 4, s, s + 3); o.d[(Y * o.w + X) * 4 + 3] = 255; } } };
const verify = (file, count, total) => { const g = gifDecode(fs.readFileSync(file)); const sum = g.frames.reduce((a, f) => a + f.delay, 0); if (g.frames.length !== count || sum !== total) throw new Error(file + ' 프레임/시간 불일치 ' + g.frames.length + '/' + sum); return g; };
const worst = (file, src) => { const g = gifDecode(fs.readFileSync(file)); let w = 0; g.frames.forEach((fr, k) => { for (let i = 0; i < src[k].w * src[k].h * 4; i += 4) { const d = Math.max(Math.abs(fr.d[i] - src[k].d[i]), Math.abs(fr.d[i + 1] - src[k].d[i + 1]), Math.abs(fr.d[i + 2] - src[k].d[i + 2])); if (d > w) w = d; } } ); return w; };
const total = SEQ.reduce((a, s) => a + s.ms, 0), delays = SEQ.map(s => s.ms), T0 = SEQ.map((s, i) => SEQ.slice(0, i).reduce((a, q) => a + q.ms, 0));
// 1) 캐릭터만 x4, 실제 크기 x2
for (const k of [4, 2]) {
  const imgs = SEQ.map(s => { const o = opaque(CROP[2] * k, CROP[3] * k, BG); place(o, cells[s.c], 0, 0, k, [CROP[0], CROP[1]]); return o; });
  const f = path.join(OUT, k === 4 ? 'CrystalQueen_Attack_KeyPoses_preview_1_loop_x4.gif' : 'CrystalQueen_Attack_KeyPoses_preview_2_actual-size_x2.gif');
  FX.writeGif(f, imgs, delays, { diff: true }); verify(f, SEQ.length, total); console.log(path.basename(f), imgs[0].w + 'x' + imgs[0].h, fs.statSync(f).size + 'B', '색차', worst(f, imgs));
}
// 2) 게임 화면 합성: 10스테이지 줄(중심 5.9, 간격 1.8)의 맨 오른쪽 보스 자리. 카메라 (0,0) ortho 5 → 108px/유닛, 루트 스케일 1.4, BossIdle 로컬 (-0.1587, 0.4365), 피벗 (0.5,0.45)
const scr = p.decode('C:/Users/MBC-501-15/Documents/Tetrigeon/CountdownUI_VARCO/work/game_screen_empty_board.png');
const PX = 960 + (5.9 + 1.8 - 0.15873016 * 1.4) * 108, PY = 540 - (3.1 + 0.43650794 * 1.4) * 108; // 피벗의 화면 좌표
const SX = Math.round(PX - 80 * 2), SY = Math.round(PY - 88 * 2); // 셀 원점 (스프라이트 1칸 = 화면 2px)
const TIGHT = [1686, 0, 234, 310];
const frameAt = (c) => { const o = { w: scr.w, h: scr.h, d: Buffer.from(scr.d) }; place(o, cells[c], SX, SY, 2, [0, 0]); return o; };
const comps = SEQ.map(s => p.nearestUp(p.crop(frameAt(s.c), TIGHT[0], TIGHT[1], TIGHT[2], TIGHT[3]), 2));
const fg = path.join(OUT, 'CrystalQueen_Attack_KeyPoses_preview_3_game-composite_x2.gif');
FX.writeGif(fg, comps, delays, { diff: true }); verify(fg, SEQ.length, total); console.log(path.basename(fg), comps[0].w + 'x' + comps[0].h, fs.statSync(fg).size + 'B', '색차', worst(fg, comps));
p.encode(comps[2], path.join(OUT, 'CrystalQueen_Attack_KeyPoses_preview_4_still_strike_x2.png'));
// 3) 기록
const feet = cells.map(c => { let x0 = 999, x1 = -1; for (let x = 0; x < 160; x++) if (c.d[(147 * 160 + x) * 4 + 3]) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); } return [x0, x1]; });
const J = { note: '핵심 자세 4장만으로 만든 미리보기(중간 프레임 없음). 게임 합성은 실제 Unity 영상이 아님.', cell: [160, 160], pivot_unity: [0.5, 0.45], ppu: 75.6, flipX: 0, sequence: SEQ.map((s, i) => ({ frame: i + 1, key: names[s.c], ms: s.ms, start_ms: T0[i], role: s.role, file: 'KeyPoses_v1_cells/CrystalQueen_Key_' + names[s.c] + '.png' })), loop_ms: total, attack_only_ms: total - SEQ[0].ms + 120, hit_frame: 3, hit_start_ms: T0[2], rest_between_attacks_ms: 500,
  composite: { source: 'CountdownUI_VARCO/work/game_screen_empty_board.png', boss_slot: '스테이지 10 맨 오른쪽 (줄 중심 x 5.9, 간격 1.8 → x 7.7)', sprite_pivot_screen: [+PX.toFixed(1), +PY.toFixed(1)], cell_origin_screen: [SX, SY], foot_row_screen_y: SY + 148 * 2, crop: TIGHT }, feet_row147_x_range: feet };
fs.writeFileSync(path.join(OUT, 'CrystalQueen_Attack_KeyPoses_preview.json'), JSON.stringify(J, null, 1));
console.log('원점', SX, SY, '발바닥 화면 y', SY + 296, '타격 시작', T0[2], 'ms, 루프', total, 'ms');
