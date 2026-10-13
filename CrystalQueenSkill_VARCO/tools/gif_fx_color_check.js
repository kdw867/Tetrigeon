// GIF 색 보존 확인: 게임 화면 합성 GIF 의 색 차이가 배경 그라데이션 때문인지, 이펙트·캐릭터 픽셀 색은 그대로인지 (이펙트·캐릭터가 있는 위치만 비교)
const fs = require('fs'), path = require('path');
const p = require('../../PauseUI_VARCO/tools/pix.js'), { decode: gifDecode } = require('../../PixelFX_VARCO/tools/gif_check.js'), S = require('./skill_frames.js');
const OUT = S.OUT, J = JSON.parse(fs.readFileSync(path.join(OUT, 'SkillFrames_v1_timeline.json'), 'utf8')), SX = 1608, SY = -37, T = [1600, 0];
for (const [name, off] of [['4_skill-game-screen_x2', 0], ['7_idle-skill-idle_game-screen_x2', 1]]) {
  const g = gifDecode(fs.readFileSync(path.join(OUT, 'CrystalQueenSkill_Frames_v1_preview_' + name + '.gif'))); let wFx = 0, wCh = 0, nFx = 0, nCh = 0;
  J.steps.forEach((s, i) => {
    const fr = g.frames[i + off], fx = s.fx ? p.decode(path.join(OUT, s.fx)) : null, ch = p.decode(path.join(OUT, s.character));
    for (let y = 0; y < 160; y++) for (let x = 0; x < 160; x++) for (const [img, kind] of [[fx, 'fx'], [ch, 'ch']]) {
      if (!img || !img.d[(y * 160 + x) * 4 + 3]) continue; if (kind === 'ch' && fx && fx.d[(y * 160 + x) * 4 + 3]) continue; // 이펙트가 덮은 자리는 캐릭터 비교에서 제외
      const X = ((SX + 2 * x - T[0]) * 2) + 1, Y = ((SY + 2 * y - T[1]) * 2) + 1; if (X < 0 || Y < 0 || X >= 640 || Y >= 620) continue;
      const q = (Y * 640 + X) * 4, o = (y * 160 + x) * 4; const d = Math.max(Math.abs(fr.d[q] - img.d[o]), Math.abs(fr.d[q + 1] - img.d[o + 1]), Math.abs(fr.d[q + 2] - img.d[o + 2]));
      if (kind === 'fx') { wFx = Math.max(wFx, d); nFx++; } else { wCh = Math.max(wCh, d); nCh++; }
    }
  });
  console.log(name, '이펙트 픽셀 색차 최대', wFx, '(' + nFx + '개) | 캐릭터 픽셀 색차 최대', wCh, '(' + nCh + '개)');
}
