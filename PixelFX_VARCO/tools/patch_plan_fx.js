// Plan.md 패치 (일회용): 보드 이펙트 3종 적용 반영. CRLF 유지
const fs = require('fs');
const f = 'C:/Users/MBC-501-15/Documents/Tetrigeon/Tetrigeon/Plan.md';
let s = fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
const rep = (a, b) => { if (!s.includes(a)) throw new Error('못 찾음: ' + a.slice(0, 60)); s = s.replace(a, b); };
rep('stage board: 2026-10-07)', 'stage board: 2026-10-07; board effects: 2026-10-08)');
const marker = '- Not implemented: each enemy\'s expected HP damage or Garbage amount for its\n';
if (!s.includes(marker)) throw new Error('마커 못 찾음');
s = s.replace(marker,
  '- Board effects (2026-10-08, confirmed after a preview review, implemented): three short pixel effects\n' +
  '  on the board, drawn from sprite sheets in `@Resources/Effects/BoardFX` (prefabs `P_FX_Lock`,\n' +
  '  `P_FX_LineClear`, `P_FX_CrystalBurst`) and played by `BoardEffectPlayer` (under Managers) from a\n' +
  '  visual-only notification `PieceSpawner.OnLockVisual` (locked cells, cleared rows and cleared crystal\n' +
  '  cells, with coordinates from before the rows compact). They change no rule or timing, never pause the\n' +
  '  game, and play on real time so they finish even while the game is paused or a stage is cleared.\n' +
  '  - LOCK (0.133 s): a thin teal rim traces the outline of the mino that just locked (edges shared by\n' +
  '    cells of the same mino are skipped) for every cell that really locked, including cells added by the\n' +
  '    Crystal Queen. Once per real Lock (gravity and hard drop share the same path); not for move, rotate,\n' +
  '    Hold or the ghost. Cells removed by that Lock\'s line clear show no LOCK; surviving cells show it at\n' +
  '    their position after the rows above have dropped.\n' +
  '  - LINE CLEAR (0.2 s): a thin white and teal light spreads from the row centre across the board width,\n' +
  '    once per cleared row (several rows at once play together), at the row\'s position before compaction.\n' +
  '    Not for Garbage, Caterpillar bites, Top Out or board resets.\n' +
  '  - Crystal burst (0.267 s): one common effect per cleared enhanced crystal cell (the same cells that\n' +
  '    fire the crystal ability): a teal-white flash and four purple shards within two cells, starting\n' +
  '    0.06 s after the row light (a visual delay only; the effect never triggers an ability).\n' +
  '  Effects sit above the blocks and are clipped to the board interior, so they never cover the board frame.\n' +
  marker);
fs.writeFileSync(f, s.replace(/\n/g, '\r\n'));
const chk = fs.readFileSync(f, 'utf8');
console.log('CRLF', (chk.match(/\r\n/g) || []).length, 'bareLF', (chk.replace(/\r\n/g, '').match(/\n/g) || []).length);
