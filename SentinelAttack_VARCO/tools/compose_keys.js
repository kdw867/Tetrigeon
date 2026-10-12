// 스냅한 자세들을 원본 Idle 01 과 같은 발 기준으로 나란히 배치해 확대 비교 이미지 생성 (작업 폴더 전용)
const path = require('path');
const p = require('../../PauseUI_VARCO/tools/pix.js');
const SHEET = 'C:/Users/MBC-501-15/Documents/Tetrigeon/Tetrigeon/Assets/@Resources/Enemies/AmethystSentinelIdle/T_AmethystSentinel_Idle.png';
const names = process.argv.slice(3), out = process.argv[2], S = +process.env.SCALE || 6;
const CW = 128, CH = 104, OX = 16, OY = 8; // 새 캔버스: 원본 96x96 셀을 (16,8)에 둔 128x104, 발바닥 기준점 (64,94)
const idle = p.crop(p.decode(SHEET), 0, 0, 96, 96);
const cell = () => p.blank(CW, CH);
function put(dst, src, ox, oy) { for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) { const s = (y * src.w + x) * 4; if (!src.d[s + 3]) continue; const X = x + ox, Y = y + oy; if (X < 0 || Y < 0 || X >= dst.w || Y >= dst.h) throw new Error('캔버스 밖 ' + X + ',' + Y); src.d.copy(dst.d, (Y * dst.w + X) * 4, s, s + 4); } }
const base = cell(); put(base, idle, OX, OY);
// 자세 이미지: 가장 아래 줄을 94행에 맞추고, 발 영역(아래 4줄) 가로 중심을 원본 발 중심에 맞춤
function feetCenter(im) { let x0 = 999, x1 = -1; let yb = -1; for (let y = im.h - 1; y >= 0 && yb < 0; y--) for (let x = 0; x < im.w; x++) if (im.d[(y * im.w + x) * 4 + 3]) { yb = y; break; } for (let y = yb - 3; y <= yb; y++) for (let x = 0; x < im.w; x++) if (im.d[(y * im.w + x) * 4 + 3]) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); } return { cx: (x0 + x1) / 2, yb }; }
const ib = feetCenter(base);
const cells = [base];
for (const n of names) {
  const sn = p.decode(path.join(__dirname, '..', 'work', (process.env.SNAP_PREFIX || 'snap_') + n + '.png')); const t = p.trim(sn);
  const fc = feetCenter(t.img);
  const c = cell(); put(c, t.img, Math.round(ib.cx - fc.cx), ib.yb - fc.yb); cells.push(c);
  console.log(n, 'trimmed', t.img.w + 'x' + t.img.h, 'offset', Math.round(ib.cx - fc.cx), ib.yb - fc.yb);
}
const gap = 4, W = cells.length * CW + (cells.length - 1) * gap;
const sheet = p.blank(W, CH); const bg = [38, 44, 58];
for (let i = 0; i < sheet.w * sheet.h; i++) { sheet.d[i * 4] = bg[0]; sheet.d[i * 4 + 1] = bg[1]; sheet.d[i * 4 + 2] = bg[2]; sheet.d[i * 4 + 3] = 255; }
cells.forEach((c, i) => { for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) { const s = (y * CW + x) * 4; if (c.d[s + 3]) c.d.copy(sheet.d, (y * W + i * (CW + gap) + x) * 4, s, s + 4); } });
p.encode(p.nearestUp(sheet, S), out); console.log('saved', out);
if (process.env.CELLS_DIR) { const fs = require('fs'); fs.mkdirSync(process.env.CELLS_DIR, { recursive: true }); const tag = ['00_idle', '01_windup', '02_strike', '03_recoil']; cells.forEach((c, i) => p.encode(c, path.join(process.env.CELLS_DIR, 'pose_' + tag[i] + '_128x104.png'))); console.log('cells saved'); }
