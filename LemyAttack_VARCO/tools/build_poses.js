// 포즈표(lemy_poses.js)를 Unity 캡처용 work/poses.tsv 와 시간표 뼈대로 내보낸다 (작업 폴더 전용).
const fs = require('fs'), path = require('path'), P = require('./lemy_poses.js'), W = path.join(__dirname, '..', 'work');
fs.writeFileSync(path.join(W, 'poses.tsv'), P.map(r => [r[0], r[2], r[3], r[4], r[5], r[6], r[7], r[8], r[9], r[10]].join('\t')).join('\n'));
let t = 0; const tl = P.map((r, i) => { const o = { id: r[0], index: i, ms: r[1], start_ms: t, s: r[2], head: [r[3], r[4]], tilt: r[5], l: [r[6], r[7]], r: [r[8], r[9]], variant: r[10], note: r[11] }; t += r[1]; return o; });
fs.writeFileSync(path.join(W, 'timeline_poses.json'), JSON.stringify({ total_ms: t, frames: tl }, null, 1)); console.log('포즈', P.length, '합계', t + 'ms');
