// Unity 실제 렌더(Animator.Update 0.02초 간격 40프레임)로 GIF와 타격 정지 화면을 만든다. 합성이 아니라 에디터에서 렌더한 프레임이다 (작업 폴더 전용)
const fs = require('fs'), path = require('path');
const FX = require('../../PixelFX_VARCO/tools/lib_fx.js');
const { decode: gifDecode } = require('../../PixelFX_VARCO/tools/gif_check.js');
const p = FX.p, R = path.join(__dirname, '..');
const frames = []; for (let k = 0; k < 40; k++) frames.push(p.decode(path.join(R, 'work', 'unity_frames', `a_${String(k).padStart(3, '0')}.png`)));
const up = frames.map(f => p.nearestUp(f, 4));
const file = path.join(R, 'output', 'CrystalCaterpillar_Attack_v3_8_UNITY-actual-render_x4.gif');
FX.writeGif(file, up, 20, { diff: true });
const g = gifDecode(fs.readFileSync(file)); let worst = 0, bad = 0;
g.frames.forEach((fr, k) => { for (let i = 0; i < up[k].w * up[k].h * 4; i += 4) { const d = Math.max(Math.abs(fr.d[i] - up[k].d[i]), Math.abs(fr.d[i + 1] - up[k].d[i + 1]), Math.abs(fr.d[i + 2] - up[k].d[i + 2])); if (d > worst) worst = d; } });
console.log('GIF', up[0].w + 'x' + up[0].h, g.frames.length, 'frames,', fs.statSync(file).size, 'bytes, 지연', g.frames[0].delay, 'ms, 원본 대비 최대 색 차이', worst);
p.encode(up[16], path.join(R, 'output', 'CrystalCaterpillar_Attack_v3_9_UNITY-actual-render_hit-frame_x4.png'));
console.log('hit frame still saved');
