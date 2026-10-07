// Plan.md 패치 (일회용): HP바 반영. CRLF 유지
const fs = require('fs');
const f = 'C:/Users/MBC-501-15/Documents/Tetrigeon/Tetrigeon/Plan.md';
const raw = fs.readFileSync(f, 'utf8');
let s = raw.replace(/\r\n/g, '\n');
const rep = (a, b) => { if (!s.includes(a)) throw new Error('못 찾음: ' + a.slice(0, 60)); s = s.replace(a, b); };
rep('no reward after the boss: 2026-10-07)', 'no reward after the boss: 2026-10-07; HP bars: 2026-10-07)');
rep('- Player: `PLAYER hp / max`, plus `[보호막 n]` while a shield exists.\n',
  '- Player: HP bar with the number `hp / max` in its middle (replaces the `PLAYER hp / max` text,\n' +
  '  HP bars 2026-10-07); while a shield exists a shield icon and `+n` show under the bar\n' +
  '  (no shield bar, confirmed).\n');
rep('- Each enemy: `hp/max`, `SKILL n` (turns until its Garbage skill), boss\n',
  '- Each enemy: an HP bar with `hp / max` in its middle, then `SKILL n` (turns until its\n  Garbage skill), boss\n');
// 첫 번째 문단 뒤(Not implemented 줄 앞)에 HP바 절 추가
const marker = '- Not implemented: each enemy\'s expected HP damage or Garbage amount for its\n';
if (!s.includes(marker)) throw new Error('마커 못 찾음');
s = s.replace(marker,
  '- HP bars (2026-10-07, confirmed after a concept-art review, implemented): Lemy and every\n' +
  '  enemy use the same bar size (112x20 source px shown at 1.5x = 168x30 px; Lemy\'s bar is\n' +
  '  shrunk to the monster bar size on request, so three enemies fit side by side). All bars\n' +
  '  sit BELOW the character\'s feet and the number is centred inside the bar, drawn from the\n' +
  '  digit sprites 0-9, "/" and "+" (cream; cyan for the shield amount). Enemy text under the bar\n' +
  '  (`SKILL n`, damage reduction, shield, charge, stun, poison/freeze icons) is unchanged but now\n' +
  '  sits below the bar for every tier (Normal monsters used to stack it above their body).\n' +
  '  The bar hides when the enemy dies. The target arrow stays above the monster as before.\n' +
  '  Art is layered (Frame, Track, Fill; the Fill is shown with a horizontal fill amount):\n' +
  '  `@Resources/UI/HpBars/Layers`, digit font `@Resources/UI/HpBars/Font`, prefabs\n' +
  '  `P_HpBarLemy` and `P_HpBarMonster`. Lemy\'s bar has the cyan gem cap and rune cap, the\n' +
  '  monster bar a plain stone frame. The boss uses the monster bar (no separate boss bar yet).\n' +
  marker);
fs.writeFileSync(f, s.replace(/\n/g, '\r\n'));
const chk = fs.readFileSync(f, 'utf8');
console.log('CRLF', (chk.match(/\r\n/g) || []).length, 'bareLF', (chk.replace(/\r\n/g, '').match(/\n/g) || []).length);
