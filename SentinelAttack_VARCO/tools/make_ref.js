// 현재 Idle 01 을 도트 1칸 = S px 로 키워 흰 바탕 16:9 캔버스 가운데에 놓음 → VARCO 기준 이미지 (작업 폴더 전용)
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const p = require('../../PauseUI_VARCO/tools/pix.js');
const { encode8 } = require('../../TitleUI_VARCO/tools/png8.js');
const R = path.join(__dirname, '..');
const sheet = p.decode('C:/Users/MBC-501-15/Documents/Tetrigeon/Tetrigeon/Assets/@Resources/Enemies/AmethystSentinelIdle/T_AmethystSentinel_Idle.png');
const f0 = p.crop(sheet, 0, 0, 96, 96);
const bx0 = 8, by0 = 14, bw = 80, bh = 73; // Idle 01 의 몸 영역 (X 8~87, Y 14~86)
const S = +process.argv[2] || 5, W = +process.argv[3] || 960, H = +process.argv[4] || 540;
const ox = process.env.OX ? +process.env.OX : Math.round((W - bw * S) / 2), oy = process.env.OY ? +process.env.OY : Math.round((H - bh * S) / 2);
const out = p.blank(W, H); out.d.fill(255);
for (let y = 0; y < bh * S; y++) for (let x = 0; x < bw * S; x++) {
  const i = ((by0 + (y / S | 0)) * 96 + bx0 + (x / S | 0)) * 4, o = ((oy + y) * W + ox + x) * 4;
  if (f0.d[i + 3]) { out.d[o] = f0.d[i]; out.d[o + 1] = f0.d[i + 1]; out.d[o + 2] = f0.d[i + 2]; }
}
const file = path.join(R, 'work', `ref_idle01_x${S}_${W}x${H}.png`);
encode8(out, file);
const buf = fs.readFileSync(file);
console.log('png bytes', buf.length, 'base64 chars', buf.toString('base64').length, 'sha1', crypto.createHash('sha1').update(buf).digest('hex'), 'creature at', ox, oy, bw * S, bh * S);
fs.writeFileSync(file.replace('.png', '.b64.txt'), buf.toString('base64'));
