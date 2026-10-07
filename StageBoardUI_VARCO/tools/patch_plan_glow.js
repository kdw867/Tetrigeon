// Plan.md 패치 (일회용): 선택된 몬스터 행의 청록 테두리. CRLF 유지
const fs = require('fs');
const f = 'C:/Users/MBC-501-15/Documents/Tetrigeon/Tetrigeon/Plan.md';
let s = fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
const rep = (a, b) => { if (!s.includes(a)) throw new Error('못 찾음: ' + a.slice(0, 60)); s = s.replace(a, b); };
rep('  DEFEATED instead of the bar; a slot refilled by the boss summon shows the new enemy again.\n',
  '  DEFEATED instead of the bar; a slot refilled by the boss summon shows the new enemy again.\n' +
  '  The row of the currently selected target (the same enemy the TAB key and the target arrow use) has its\n' +
  '  border lit in teal (a bright teal rim plus a short soft glow, no animation). The glow follows TAB, moves\n' +
  '  on when the target dies, and a defeated row never glows.\n');
fs.writeFileSync(f, s.replace(/\n/g, '\r\n'));
const chk = fs.readFileSync(f, 'utf8');
console.log('CRLF', (chk.match(/\r\n/g) || []).length, 'bareLF', (chk.replace(/\r\n/g, '').match(/\n/g) || []).length);
