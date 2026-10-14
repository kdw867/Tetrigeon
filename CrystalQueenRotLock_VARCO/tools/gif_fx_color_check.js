// GIF 색 보존 확인 (작업 폴더 전용): 게임 화면 합성 GIF 의 색 차이가 배경 때문인지, 이펙트·NEXT 표시 픽셀 색은 그대로인지 (이펙트가 있는 위치만 비교)
const fs = require('fs'), path = require('path');
const L = require('./lib_view.js'), N = require('./lib_next.js'), { p, OUT } = L, { decode: gifDecode } = require('../../PixelFX_VARCO/tools/gif_check.js');
const J = JSON.parse(fs.readFileSync(path.join(OUT, 'RotLockFrames_v1_timeline.json'), 'utf8')), SX = L.SX, SY = L.SY;
const gif = (n) => gifDecode(fs.readFileSync(path.join(OUT, 'CrystalQueenRotLock_Frames_v1_preview_' + n + '.gif')));
const dmax = (a, ai, b, bi) => Math.max(Math.abs(a[ai] - b[bi]), Math.abs(a[ai + 1] - b[bi + 1]), Math.abs(a[ai + 2] - b[bi + 2]));
for (const [name, off] of [['4_rotlock-game-screen_x2', 0], ['7_idle-rotlock-idle_game-screen_x2', 1]]) { // 게임 화면 ×2, 잘라낸 원점 (1600,0)
  const g = gif(name); let w = 0, n = 0, wc = 0, nc = 0;
  J.steps.forEach((s, i) => { const fr = g.frames[i + off], fx = s.fx ? p.decode(path.join(OUT, s.fx)) : null, ch = p.decode(path.join(OUT, s.character));
    for (let y = 0; y < 160; y++) for (let x = 0; x < 160; x++) for (const [img, kind] of [[fx, 'fx'], [ch, 'ch']]) {
      if (!img || !img.d[(y * 160 + x) * 4 + 3]) continue; if (kind === 'ch' && fx && fx.d[(y * 160 + x) * 4 + 3]) continue;
      const X = ((SX + 2 * x - 1600) * 2) + 1, Y = ((SY + 2 * y - 0) * 2) + 1; if (X < 0 || Y < 0 || X >= 640 || Y >= 620) continue;
      const d = dmax(fr.d, (Y * 640 + X) * 4, img.d, (y * 160 + x) * 4); if (kind === 'fx') { w = Math.max(w, d); n++; } else { wc = Math.max(wc, d); nc++; } } });
  console.log(name, '이펙트 픽셀 색차 최대', w, '(' + n + '개) | 캐릭터 픽셀 색차 최대', wc, '(' + nc + '개)');
}
{ // NEXT 연결 GIF: 단계별 이펙트 픽셀, 강조 띠·아이콘 픽셀 (화면 [1180,0] 원점 ×1)
  const g = gif('8_rotlock-next-link_x1'), scr = L.SCR(), MK = N.nextMarks(scr); let wFx = 0, nFx = 0, wMk = 0, nMk = 0;
  J.steps.forEach((s, i) => { const fr = g.frames[i + 1], fx = s.fx ? p.decode(path.join(OUT, s.fx)) : null;
    if (fx) for (let y = 0; y < 160; y++) for (let x = 0; x < 160; x++) { if (!fx.d[(y * 160 + x) * 4 + 3]) continue; for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) { const X = SX + 2 * x + dx - 1180, Y = SY + 2 * y + dy; if (X < 0 || Y < 0 || X >= 740 || Y >= 640) continue; wFx = Math.max(wFx, dmax(fr.d, (Y * 740 + X) * 4, fx.d, (y * 160 + x) * 4)); nFx++; } }
    if (s.step >= 'T11') for (const sl of MK.slots) for (let y = 0; y < 9; y++) for (let x = 0; x < 7; x++) { const ic = L.F.LOCK_UI[y][x]; if (ic === '.') continue; const c = L.F.PAL[ic]; for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) { const X = sl.icon[0] + 2 * x + dx - 1180, Y = sl.icon[1] + 2 * y + dy; const q = (Y * 740 + X) * 4; wMk = Math.max(wMk, Math.max(Math.abs(fr.d[q] - c[0]), Math.abs(fr.d[q + 1] - c[1]), Math.abs(fr.d[q + 2] - c[2]))); nMk++; } } });
  console.log('8_rotlock-next-link_x1 이펙트 픽셀 색차 최대', wFx, '(' + nFx + '개) | 자물쇠 아이콘 픽셀 색차 최대', wMk, '(' + nMk + '개)');
}
