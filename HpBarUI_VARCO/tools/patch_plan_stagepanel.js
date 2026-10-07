// Plan.md 패치 (일회용): 스테이지 패널 표시 제거 반영. CRLF 유지
const fs = require('fs');
const f = 'C:/Users/MBC-501-15/Documents/Tetrigeon/Tetrigeon/Plan.md';
let s = fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
const rep = (a, b) => { if (!s.includes(a)) throw new Error('못 찾음: ' + a.slice(0, 60)); s = s.replace(a, b); };
rep('skill counter: 2026-10-07)', 'skill counter: 2026-10-07; stage panel removed: 2026-10-07)');
rep('- Stage panel: `STAGE n`, `ENEMIES alive / total`, `[TAB] TARGET`.\n',
  '- Stage panel (`STAGE n`, `ENEMIES alive / total`, `[TAB] TARGET`): removed from the combat screen on\n  request (2026-10-07). Nothing on the combat screen shows the stage number or the remaining enemy\n  count now; the TAB key still switches the target as before.\n');
fs.writeFileSync(f, s.replace(/\n/g, '\r\n'));
const chk = fs.readFileSync(f, 'utf8');
console.log('CRLF', (chk.match(/\r\n/g) || []).length, 'bareLF', (chk.replace(/\r\n/g, '').match(/\n/g) || []).length);
