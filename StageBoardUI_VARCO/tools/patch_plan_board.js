// Plan.md 패치 (일회용): 스테이지 현황판 반영. CRLF 유지
const fs = require('fs');
const f = 'C:/Users/MBC-501-15/Documents/Tetrigeon/Tetrigeon/Plan.md';
let s = fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
const rep = (a, b) => { if (!s.includes(a)) throw new Error('못 찾음: ' + a.slice(0, 60)); s = s.replace(a, b); };
rep('stage panel removed: 2026-10-07)', 'stage panel removed: 2026-10-07; stage board: 2026-10-07)');
rep('- Stage panel (`STAGE n`, `ENEMIES alive / total`, `[TAB] TARGET`): removed from the combat screen on\n  request (2026-10-07). Nothing on the combat screen shows the stage number or the remaining enemy\n  count now; the TAB key still switches the target as before.\n',
  '- Stage panel (`STAGE n`, `ENEMIES alive / total`, `[TAB] TARGET`): removed from the combat screen on\n  request (2026-10-07) and replaced by the stage board below. The TAB key still switches the target.\n' +
  '- Stage board (2026-10-07, confirmed after a mock-up review, implemented): the empty panel to the right of\n' +
  '  the FATE scroll shows, top to bottom: a STAGE nameplate; `current / total` (`06 / 10`, current in cyan,\n' +
  '  total in light gray, total read from StageData.LastStage); progress nodes 1-10 in two rows of five\n' +
  '  (cleared = dark teal, current = bright teal outline, upcoming = dark gray; a small purple crown marks\n' +
  '  stage 10; the link line runs from 5 to 6); an ENEMIES nameplate; then one row per enemy of the current\n' +
  '  stage in lineup order. A row shows the monster\'s existing art (first Idle frame, centred in a fixed\n' +
  '  display window and scaled to fit it), the tier name (NORMAL cream, EPIC teal, BOSS gold) and an HP bar\n' +
  '  with `hp / max`. A defeated enemy\'s row is darkened and shows its existing death art and the word\n' +
  '  DEFEATED instead of the bar; a slot refilled by the boss summon shows the new enemy again.\n' +
  '  The board only reads the existing combat state (stage number, enemy list, HP) and refreshes on the same\n' +
  '  state-change event as the rest of the combat UI; it adds no counter and changes no combat rule.\n' +
  '  Art (shown at 1.75x like the other nameplates) is derived from the existing MINO UPGRADES nameplate\n' +
  '  (text removed, same stone and teal palette); nodes, links and crown are pixel-drawn in that palette; no\n' +
  '  VARCO generation. Files: `@Resources/UI/StageBoard` (Layers, `P_StageBoard`, `P_StageBoardRow`), digit\n' +
  '  colours gray/dim/teal in `@Resources/UI/HpBars/Font`. Rows are drawn in a Canvas (`StageBoardCanvas`).\n');
fs.writeFileSync(f, s.replace(/\n/g, '\r\n'));
const chk = fs.readFileSync(f, 'utf8');
console.log('CRLF', (chk.match(/\r\n/g) || []).length, 'bareLF', (chk.replace(/\r\n/g, '').match(/\n/g) || []).length);
