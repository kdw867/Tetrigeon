// 내려받은 기준 이미지들을 한 장의 목록 그림으로 합침 (읽을 수 없는 형식은 건너뛰고 표시)
const fs = require('fs'), path = require('path');
const p = require('../../PauseUI_VARCO/tools/pix.js');
const dir = path.join(__dirname, '..', 'work', 'refs');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.png') && f !== 'contact.png').sort();
const T = 220, cols = 5, rows = Math.ceil(files.length / cols), sheet = p.blank(cols * T, rows * (T + 14));
sheet.d.fill(255);
files.forEach((f, k) => {
  let img; try { img = p.decode(path.join(dir, f)); } catch (e) { console.log('skip', f, e.message); return; }
  const s = Math.min(T / img.w, T / img.h), W = Math.max(1, Math.round(img.w * s)), H = Math.max(1, Math.round(img.h * s));
  console.log(f, img.w + 'x' + img.h);
  const ox = (k % cols) * T, oy = Math.floor(k / cols) * (T + 14);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const sx = Math.min(img.w - 1, Math.floor(x / s)), sy = Math.min(img.h - 1, Math.floor(y / s)), i = (sy * img.w + sx) * 4, a = img.d[i + 3] / 255, o = ((oy + 14 + y) * sheet.w + ox + x) * 4;
    for (let c = 0; c < 3; c++) sheet.d[o + c] = Math.round(img.d[i + c] * a + (((x >> 3) + (y >> 3)) % 2 ? 200 : 235) * (1 - a));
    sheet.d[o + 3] = 255;
  }
  // 번호 칸 표시 (좌측 위에 작은 막대: k번째 = k+1개 점)
  for (let n = 0; n <= k; n++) for (let dy = 0; dy < 6; dy++) for (let dx = 0; dx < 3; dx++) { const o = ((oy + 4 + dy) * sheet.w + ox + 2 + n * 5 + dx) * 4; sheet.d[o] = 220; sheet.d[o + 1] = 0; sheet.d[o + 2] = 0; }
});
p.encode(sheet, path.join(dir, 'contact.png'));
console.log(files.map((f, i) => (i + 1) + '=' + f).join('  '));
