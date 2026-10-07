// Plan.md 패치 (일회용): 스킬 카운터(룬 + 숫자) 반영. CRLF 유지
const fs = require('fs');
const f = 'C:/Users/MBC-501-15/Documents/Tetrigeon/Tetrigeon/Plan.md';
let s = fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
const rep = (a, b) => { if (!s.includes(a)) throw new Error('못 찾음: ' + a.slice(0, 60)); s = s.replace(a, b); };
rep('HP bars: 2026-10-07)', 'HP bars: 2026-10-07; skill counter: 2026-10-07)');
rep('- Each enemy: an HP bar with `hp / max` in its middle, then `SKILL n` (turns until its\n  Garbage skill), boss\n  `피해 -50%` while escorts live, and status icons for poison and freeze.\n',
  '- Each enemy: an HP bar with `hp / max` in its middle and, at the lower right of the bar, a\n  skill counter (rune + turns until its Garbage skill, see HP bars below), then boss\n  `피해 -50%` while escorts live, and status icons for poison and freeze.\n');
rep('Enemy text under the bar\n  (`SKILL n`, damage reduction, shield, charge, stun, poison/freeze icons) is unchanged but now\n  sits below the bar for every tier (Normal monsters used to stack it above their body).\n',
  'Enemy text under the bar\n  (damage reduction, shield, charge, stun, poison/freeze icons) is unchanged but now sits below\n  the bar and its skill counter for every tier (Normal monsters used to stack it above their body).\n');
const marker = '- Not implemented: each enemy\'s expected HP damage or Garbage amount for its\n';
if (!s.includes(marker)) throw new Error('마커 못 찾음');
s = s.replace(marker,
  '- Skill counter (2026-10-07, confirmed after a concept-art review, implemented): replaces the\n' +
  '  `SKILL n` text. It sits at the lower right under the enemy\'s HP bar: a blue rune and the turns\n' +
  '  left in cream digits (`3`, `2`). When 1 turn is left, i.e. the skill fires on the next enemy\n' +
  '  turn, the rune turns gold and the digits gold with an exclamation mark (`1 !`). The count\n' +
  '  itself is unchanged (normal 3 / epic 5 / boss 6, section 7). Art: `T_SkillRune_Blue` and\n' +
  '  `T_SkillRune_Gold` (9x9 dots shown at 1.5x) in `@Resources/UI/HpBars/Layers`, gold digit font\n' +
  '  `HpDigits_gold` (0-9, "/", "+", "!") in `@Resources/UI/HpBars/Font`. Only the monster bar\n' +
  '  prefab `P_HpBarMonster` has the counter; Lemy\'s bar does not.\n' + marker);
fs.writeFileSync(f, s.replace(/\n/g, '\r\n'));
const chk = fs.readFileSync(f, 'utf8');
console.log('CRLF', (chk.match(/\r\n/g) || []).length, 'bareLF', (chk.replace(/\r\n/g, '').match(/\n/g) || []).length);
