// 국소 수정(팔 교차 등) 결과를 셀 좌표로 스냅·정리한 뒤 원본 Idle 01 과 비교 (작업 폴더 전용)
// 사용: node tools/eval_local.js <raw 파일>...  → 윤곽 일치(IoU), 팔 영역 밖에서 달라진 도트 비율, 보라·청록 수
const path = require('path'), cp = require('child_process');
const p = require('../../PauseUI_VARCO/tools/pix.js');
const R = path.join(__dirname, '..'), W_ = path.join(R, 'work');
const base = p.crop(p.decode('C:/Users/MBC-501-15/Documents/Tetrigeon/Tetrigeon/Assets/@Resources/Enemies/CrystalQueenIdle/T_CrystalQueen_Idle.png'), 0, 0, 160, 160);
const ARM = [58, 78, 112, 122]; // 팔·가슴 영역 (이 밖은 원본과 같아야 함)
const kind = (r, g, b) => (g > 140 && b > 180 && r < 150 && g > r + 60) ? 'cy' : ((b - g > 55 && r > 40 && b > 90) ? 'pu' : 'st');
for (const f of process.argv.slice(2)) {
  const tag = path.basename(f, '.png'); cp.execFileSync('node', [path.join(__dirname, 'snapq.js'), f, '6.4', '160'], { stdio: 'pipe' });
  const sn = path.join(W_, 'snapq_' + tag + '.png'), cl = path.join(W_, 'snapcq_' + tag + '.png'); cp.execFileSync('node', [path.join(__dirname, 'cleanq.js'), sn, cl], { stdio: 'pipe' });
  const im = p.decode(cl); let i = 0, u = 0, outside = 0, outsideDiff = 0, inDiff = 0, pu = 0, cy = 0, n = 0;
  for (let y = 0; y < 160; y++) for (let x = 0; x < 160; x++) {
    const o = (y * 160 + x) * 4, a = im.d[o + 3] ? 1 : 0, b = base.d[o + 3] ? 1 : 0; if (a && b) i++; if (a || b) u++;
    if (a) { n++; const k = kind(im.d[o], im.d[o + 1], im.d[o + 2]); if (k === 'pu') pu++; if (k === 'cy') cy++; }
    const inArm = x >= ARM[0] && x <= ARM[2] && y >= ARM[1] && y <= ARM[3], same = a === b && (!a || (im.d[o] === base.d[o] && im.d[o + 1] === base.d[o + 1] && im.d[o + 2] === base.d[o + 2]));
    if (!inArm) { if (a || b) outside++; if (!same) outsideDiff++; } else if (!same) inDiff++;
  }
  console.log(`${tag}: dots ${n} 보라 ${pu} 청록 ${cy} | 윤곽 IoU ${(i / u).toFixed(3)} | 팔 영역 밖 달라진 도트 ${outsideDiff}/${outside} (${(outsideDiff / outside * 100).toFixed(1)}%) | 팔 영역 안 달라진 ${inDiff}`);
}
