// Plan.md 에 수정여왕 회전 잠금 SKILL 모션 적용 기록 (영어, CRLF+BOM 유지): 머리 날짜, "아직 없음" 문장 3곳, 새 항목 "Rotation lock skill motion" 을 정확히 한 곳씩만 바꾼다.
const fs = require('fs'), path = require('path');
const f = path.join(__dirname, '..', '..', 'Tetrigeon', 'Plan.md'); let t = fs.readFileSync(f, 'utf8');
const rep = (a, b) => { const A = a.replace(/\n/g, '\r\n'), B = b.replace(/\n/g, '\r\n'), n = t.split(A).length - 1; if (n !== 1) throw new Error('바꿀 부분이 ' + n + '곳: ' + a.slice(0, 70)); t = t.replace(A, () => B); };
rep('Queen rotation lock targets: 2026-10-14)', 'Queen rotation lock targets: 2026-10-14; Queen rotation lock skill motion: 2026-10-14)');
rep('has its own motion (next bullet) and the rotation-lock skill motion is not made yet.', 'and her rotation-lock skill have their own motions (next bullets).');
rep("The Queen's rotation-lock motion (and the Guardian's skill and charge motions) are still to be made.", "The Guardian's skill and charge motions are still to be made.");
rep('(that skill gets its own motion later)', '(that skill has its own motion, see the rotation lock skill motion bullet)');
const bullet = `- Rotation lock skill motion (2026-10-14, confirmed after preview reviews, implemented): a 0.94 s motion plays on the
  Crystal Queen only on the turns where she uses her rotation lock skill (the skill that seals the two NEXT minos after
  the one that appears right away). It does not play on her growth turns (those keep the growth motion), on her basic
  attack turns (those keep the basic attack motion), when the action is blocked by freeze or stun, or when she is dead.
  It is visual only: the lock itself (\`BagManager.LockNextRotation\`), damage, enemy order, skill counters and timing are
  unchanged, nothing waits for it and it never pauses the game. The moment the lock closes and the rune stops (0.62 s
  after the action starts) is recorded as the proposed skill trigger time; syncing the real lock to it is not done.
  - Look: the body motion is exactly the basic attack / growth motion (same 8 body sprites, same timing, same lean), only
    the effect layer is different. The hand magic uses the same positions and sizes as the other two motions but in blue
    violet (pale periwinkle rim, white centre dot), which differs from the basic attack (light lavender) and the growth
    skill (gold rim). A small rotation rune (two arcs with arrowheads turning clockwise, 15x17 dots = 30x34 px) appears
    above the Queen's head, follows the head while she leans, turns about 111 degrees (about 1/3 turn) and stops dead at
    0.62 s while an open padlock (7x7 dots, silver shackle, white body, dark keyhole) closes in its centre; a small cross
    glint flashes on the padlock, the ring brightens, and the hand magic flashes once and fades. The closed padlock stays
    clear for about 0.15 s and then dissolves (about 0.2 s in total). The rune overlaps the top of the Queen's crystals
    (up to about 69 dots) but never her eye, core or face. Everything is drawn on the same grid as the Idle art (2x2
    sprite pixels = 1 dot). No VARCO output was used (it was drawn in code).
  - Implementation: \`EnemyView.PlayAttack\` fires the new \`RotLock\` trigger of the Boss Idle animator for
    \`EnemyActionKind.QueenRotationLock\` only (the action kinds and the notification from \`Enemy.NotifyAction\` came with
    the growth motion). The controller \`CrystalQueen_Idle\` gained the trigger \`RotLock\` and the state \`RotLock\` (Idle ->
    RotLock on the trigger, RotLock -> Idle when it ends, same settings as \`Skill\`). The clip \`CrystalQueen_RotLock\`
    animates the same body sprites as \`CrystalQueen_Attack\` and the same child \`BossAttackFx\` (sprites from the new
    sheet), so the prefab \`P_Enemy\` is unchanged. Assets in \`@Resources/Enemies/CrystalQueenRotLock\`:
    \`T_CrystalQueen_RotLockFx\` (800x480, 11 cells used of 160x160, PPU 75.6, pivot (0.5, 0.45), Point filter,
    uncompressed, same import settings as \`T_CrystalQueen_SkillFx\`) and the clip.
  - Limits: the hand magic at full reach can overlap the neighbouring slot's monster (same as the other motions), the
    rune overlaps the top of the Queen's crystals, the time scale stops the motion (pause, game over) like Idle, and the
    target arrow above the Queen (drawn on top of everything) may cover the lower part of the rune while she is the
    target (not checked in play mode). The NEXT-side marking of the locked minos (halo and padlock icon) was only a
    preview proposal and is not implemented. Verified 2026-10-14 in play mode (stage 10, direct enemy-turn calls, 36
    turns): basic attacks fire \`Attack\`, growth turns \`Skill\`, rotation lock turns \`RotLock\`, the other enemies are
    unchanged; the animator stepped every 0.01 s matches the timetable (77 samples, 0 mismatches) and returns to Idle with
    an empty effect layer. Not yet played by hand in a full run.
`;
rep('Verified 2026-10-06 in play mode through direct enemy-turn and bag-settlement\ncalls.', bullet + 'Verified 2026-10-06 in play mode through direct enemy-turn and bag-settlement\ncalls.');
fs.writeFileSync(f, t, 'utf8'); console.log('Plan.md 수정 완료');
