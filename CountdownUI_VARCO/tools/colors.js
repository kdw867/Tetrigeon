// 추출된 숫자 도트의 색 분포 보기 (작업용)
const fs = require('fs'), path = require('path');
const j = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'work', `digit_raw_${process.argv[2]}.json`), 'utf8'));
const cnt = new Map();
for (const c of j.cells) { const d = Buffer.from(c.d, 'base64'); for (let i = 0; i < c.w * c.h; i++) { if (!d[i * 4 + 3]) continue; const k = [d[i * 4] >> 3 << 3, d[i * 4 + 1] >> 3 << 3, d[i * 4 + 2] >> 3 << 3].join(','); cnt.set(k, (cnt.get(k) || 0) + 1); } }
const arr = [...cnt.entries()].sort((a, b) => b[1] - a[1]).slice(0, 24);
console.log('고유 색(8단계 묶음)', cnt.size); for (const [k, n] of arr) { const [r, g, b] = k.split(',').map(Number); console.log(('#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')), n); }
