// 승인 원화(source-approved.png)의 크기, 투명도, 몸 영역, 도트 격자 간격을 확인 (작업 폴더 전용)
const path = require('path');
const p = require('../../PauseUI_VARCO/tools/pix.js');
const src = p.decode('C:/Users/MBC-501-15/.codex/worktrees/9449/Tetrigeon/output/caterpillar-idle/source-approved.png');
console.log('size', src.w, src.h);
let aMin = 255, aMax = 0, transp = 0, bb = [1e9, 1e9, -1, -1], corner = [...src.d.subarray(0, 4)];
for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) { const a = src.d[(y * src.w + x) * 4 + 3]; aMin = Math.min(aMin, a); aMax = Math.max(aMax, a); if (a < 128) transp++; else bb = [Math.min(bb[0], x), Math.min(bb[1], y), Math.max(bb[2], x), Math.max(bb[3], y)]; }
console.log('alpha range', aMin, aMax, 'transparent px', transp, 'corner RGBA', corner);
console.log('opaque bbox', bb, 'w', bb[2] - bb[0] + 1, 'h', bb[3] - bb[1] + 1);
console.log('scale to 42x27:', 42 / (bb[2] - bb[0] + 1), 27 / (bb[3] - bb[1] + 1));
