// 손 자리 확대 확인 (작업 폴더 전용): 승인된 일반공격 캐릭터 + 일반공격 손 이펙트를 손 둘레만 오려 ×10 으로 나란히 저장 (읽기 전용 입력)
const path = require('path');
const p = require('../../PauseUI_VARCO/tools/pix.js');
const A = path.join(__dirname, '..', '..', 'CrystalQueenAttack_VARCO', 'output'), OUT = path.join(__dirname, '..', 'output');
const J = require(path.join(A, 'CastFrames_v3_timeline.json'));
const BG = [40, 46, 60];
const over = (base, top) => { const o = { w: base.w, h: base.h, d: Buffer.from(base.d) }; for (let i = 0; i < o.w * o.h; i++) if (top.d[i * 4 + 3]) top.d.copy(o.d, i * 4, i * 4, i * 4 + 4); return o; };
const bg = (img) => { const o = { w: img.w, h: img.h, d: Buffer.alloc(img.d.length) }; for (let i = 0; i < img.w * img.h; i++) { o.d[i * 4] = BG[0]; o.d[i * 4 + 1] = BG[1]; o.d[i * 4 + 2] = BG[2]; o.d[i * 4 + 3] = 255; } return over(o, img); };
const tiles = [];
for (const id of ['T05', 'T08', 'T09', 'T10']) {
  const s = J.steps.find(x => x.step === id), ch = p.decode(path.join(A, s.character)), fx = s.fx ? p.decode(path.join(A, s.fx)) : p.blank(160, 160);
  const sh = s.arm_shift_px; // 손 중심: 기울이기 전 손 위치 + 팔 이동 (블록→px)
  const cx = id === 'T05' ? 2 * (41 + sh[0] / 2) + 1 : id === 'T08' ? 2 * (24 + sh[0] / 2) + 1 : 2 * (15 + sh[0] / 2) + 1, cy = 2 * (id === 'T05' ? 50 + sh[1] / 2 : id === 'T08' ? 47 + sh[1] / 2 : 46 + sh[1] / 2) + 1;
  const x0 = Math.max(0, Math.round(cx) - 24), y0 = Math.round(cy) - 18;
  tiles.push(p.nearestUp(p.crop(bg(over(ch, fx)), x0, y0, 48, 36), 10));
  console.log(id, '손 중심 px', cx, cy, '자른 시작', x0, y0);
}
const W = tiles.reduce((a, t) => a + t.w + 8, 0), o = p.blank(W, tiles[0].h); o.d.fill(0);
let x = 0; for (const t of tiles) { for (let yy = 0; yy < t.h; yy++) t.d.copy(o.d, (yy * W + x) * 4, yy * t.w * 4, (yy + 1) * t.w * 4); x += t.w + 8; }
p.encode(o, path.join(OUT, 'probe_normal_hands_T05-T08-T09-T10_x10.png')); console.log('저장', o.w + 'x' + o.h);
