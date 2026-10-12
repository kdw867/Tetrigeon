// Plan.md에 애벌레 공격 모션 기록을 추가 (CRLF·BOM 유지). 작업 폴더 전용 스크립트
const fs = require('fs');
const f = 'C:/Users/MBC-501-15/Documents/Tetrigeon/Tetrigeon/Plan.md';
const buf = fs.readFileSync(f); const bom = buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF;
let s = buf.toString('utf8'); if (bom) s = s.slice(1);
if (s.includes('Attack motion (2026-10-12')) throw new Error('이미 추가됨');
// 1) 맨 위 날짜 줄
const hdrOld = 'start countdown: 2026-10-08)';
if (s.split(hdrOld).length !== 2) throw new Error('헤더 패턴 불일치');
s = s.replace(hdrOld, 'start countdown: 2026-10-08; Caterpillar attack motion: 2026-10-12)');
// 2) 갉아먹기 스킬 설명 바로 아래
const anchor = '  nothing, because it is not a line clear.\r\n';
if (s.split(anchor).length !== 2) throw new Error('앵커 패턴 불일치');
const add = [
  '- Attack motion (2026-10-12, confirmed after a preview review, implemented): a 10-frame, 0.625 s',
  '  (16 FPS) motion plays on the Crystal Caterpillar (normal tier, boss-summoned ones too) every time it',
  '  really acts on an enemy turn: both its basic HP attack and its skill (gnaw + Garbage). It does not',
  '  play when the action is blocked (frozen or stunned) or when the Caterpillar is dead. It is visual only:',
  '  damage, enemy order, skill counters and timing are unchanged, nothing waits for it and it never pauses',
  '  the game (the HP damage and the gnaw still apply the moment the enemy turn runs; the strike frame comes',
  '  about 0.31 s after that, and syncing the two is not done yet).',
  '  - Motion: the head and both bodies pull back and bunch together (the head sinks 1 px), thrust fast toward',
  '    screen left (toward Lemy) head first with the bodies following in a chain, hit the strike pose (frame 06:',
  '    head 5 px, middle body 3 px and rear body 1 px forward, segments at most 2 px apart), recoil and return.',
  '    The last frame equals the Idle rest pose, so it returns to Idle without a jump. Nothing is redrawn: the',
  '    approved Idle art is cut into head / first body / second body (each with its own legs, base and',
  '    crystals) and moved by whole pixels only. The object itself does not move.',
  '  - Implementation: `Enemy.Acted` (raised by `Enemy.NotifyAction()`, called once per acting enemy in',
  '    `CombatManager.EnemyTurn` right after the freeze/stun check) -> `EnemyView` fires the `Attack` trigger of',
  '    the normal Idle animator; the controller `CrystalLarva_Idle` gained the state `Attack` (Idle -> Attack on',
  '    the trigger, Attack -> Idle when it ends). Other tiers ignore the event. Assets in',
  '    `@Resources/Enemies/CrystalLarvaAttack`: `T_CrystalLarva_Attack` (320x128, 64x64 cells, PPU 75.6, pivot',
  '    (0.5, 0.1875), same import settings as the Idle sheet) and the clip `CrystalLarva_Attack`.',
  '  - Art: the art faces screen left and is not flipped. VARCO was tried (4 images = 80 credits) but could not',
  '    keep the design (mirrored, enlarged head, an invented block), so none of it was used.',
  '  - Limits: the time scale stops it (pause, game over), like Idle. Guardian and Queen have no attack motion yet.',
].join('\r\n') + '\r\n';
s = s.replace(anchor, anchor + add);
const out = Buffer.from((bom ? '\uFEFF' : '') + s, 'utf8');
fs.writeFileSync(f, out);
const t = fs.readFileSync(f).toString('utf8');
console.log('BOM', fs.readFileSync(f)[0] === 0xEF, 'LF', (t.match(/\n/g) || []).length, 'CRLF', (t.match(/\r\n/g) || []).length, 'bareLF', (t.match(/(?<!\r)\n/g) || []).length);
