// 게임에 적용된 Idle 01 프레임을 도트 1칸 = 8px 로 키워 흰 바탕 16:9 캔버스 가운데에 놓음 → VARCO 기준 이미지 (작업 폴더 전용)
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const p = require('../../PauseUI_VARCO/tools/pix.js');
const R = path.join(__dirname, '..');
const sheet = p.decode('C:/Users/MBC-501-15/Documents/Tetrigeon/Tetrigeon/Assets/@Resources/Enemies/CrystalLarvaIdle/T_CrystalLarva_Idle.png');
const f0 = p.crop(sheet, 0, 0, 64, 64);
const bx0 = 8, by0 = 25, bw = 42, bh = 28; // Idle 01의 몸 영역 (이전 확인: X 8~49, Y 25~52)
const S = 8, W = 640, H = 360, ox = Math.round((W - bw * S) / 2), oy = Math.round((H - bh * S) / 2);
const out = p.blank(W, H); out.d.fill(255);
for (let y = 0; y < bh * S; y++) for (let x = 0; x < bw * S; x++) {
  const i = ((by0 + (y / S | 0)) * 64 + bx0 + (x / S | 0)) * 4, o = ((oy + y) * W + ox + x) * 4;
  if (f0.d[i + 3]) { out.d[o] = f0.d[i]; out.d[o + 1] = f0.d[i + 1]; out.d[o + 2] = f0.d[i + 2]; }
}
const file = path.join(R, 'work', 'ref_idle01_x8_640x360.png');
p.encode(out, file);
const buf = fs.readFileSync(file);
console.log('png bytes', buf.length, 'base64 chars', buf.toString('base64').length, 'sha1', crypto.createHash('sha1').update(buf).digest('hex'), 'creature at', ox, oy, bw * S, bh * S);
fs.writeFileSync(path.join(R, 'work', 'ref_idle01_x8_640x360.b64.txt'), buf.toString('base64'));
