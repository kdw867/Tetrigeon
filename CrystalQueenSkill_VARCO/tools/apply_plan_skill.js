// Plan.md 에 수정여왕 증식 능력 모션(2026-10-13) 기록 (영어, CRLF·BOM 유지, 정확히 1곳씩만 바꿈). 다른 사람의 기존 변경(S 수정 회복)은 건드리지 않는다.
const fs = require('fs'), path = require('path');
const f = path.join(__dirname, '..', '..', 'Tetrigeon', 'Plan.md'); let t = fs.readFileSync(f, 'utf8');
if (t.charCodeAt(0) !== 0xFEFF) throw new Error('BOM 없음');
const rep = (a, b) => { const A = a.replace(/\n/g, '\r\n'), B = b.replace(/\n/g, '\r\n'), n = t.split(A).length - 1; if (n !== 1) throw new Error('바꿀 부분 ' + n + '곳: ' + a.slice(0, 50)); t = t.replace(A, () => B); };
// 1) 머리 날짜 목록
rep('Guardian attack motion: 2026-10-12)', 'Guardian attack motion: 2026-10-12; Queen growth skill motion: 2026-10-13)');
// 2) 일반 공격 모션 항목: 능력 모션이 생겼음을 반영
rep(`  Crystal Queen only when she makes her basic HP attack on an enemy turn. It does not play on her skill turns
  (growth / rotation lock), when the action is blocked by freeze or stun, or when she is dead. The skill motion
  is a separate motion that is not made yet, so skill turns still play nothing. It is visual only: damage, enemy`,
`  Crystal Queen only when she makes her basic HP attack on an enemy turn. It does not play on her skill turns
  (growth / rotation lock), when the action is blocked by freeze or stun, or when she is dead. Her growth skill
  has its own motion (next bullet) and the rotation-lock skill motion is not made yet. It is visual only: damage, enemy`);
// 3) 한계 문장
rep("    The Queen's skill motion (and the Guardian's skill and charge motions) are still to be made.",
    "    The Queen's rotation-lock motion (and the Guardian's skill and charge motions) are still to be made.");
// 4) 새 항목: 증식 능력 모션 (일반 공격 항목 끝, 'Verified 2026-10-06' 문단 앞)
rep(`    The Queen's rotation-lock motion (and the Guardian's skill and charge motions) are still to be made.
Verified 2026-10-06 in play mode`,
`    The Queen's rotation-lock motion (and the Guardian's skill and charge motions) are still to be made.
- Growth skill motion (2026-10-13, confirmed after preview reviews, implemented): a 0.94 s motion plays on the
  Crystal Queen only on the turns where she uses her crystal growth skill (the skill that adds one cell to every mino
  in NEXT). It does not play on her rotation-lock turns (that skill gets its own motion later), on her basic attack
  turns (those keep the basic attack motion), when the action is blocked by freeze or stun, or when she is dead. It is
  visual only: the growth itself, damage, enemy order, skill counters and timing are unchanged, nothing waits for it
  and it never pauses the game. The moment the crown bursts (0.62 s after the action starts) is recorded as the
  proposed skill trigger time; syncing the real growth to it is not done.
  - Look: the body motion is exactly the basic attack motion (same 8 body sprites, same timing, same lean), only the
    effect layer is different. The crystal projectiles are gone. The hand magic uses the same positions and sizes as
    the basic attack's hand magic but in a different colour (purple with a gold rim and a single white centre dot).
    A separate crystal crown appears above the Queen, fades in, is held for about 0.24 s and then splits into five
    pieces with a short thin purple and gold wave and a few fragments, which disappear quickly. The crown (21x11 dots =
    42x22 px) is a crown carved from crystal (bright lavender faces) mixed with gold, pearls and one cyan gem. It sits
    at the top of the screen (the Queen's tallest crystal reaches only 10 px below the screen top), so its lower
    part overlaps the Queen's top crystals, separated by a dark outline. Everything is drawn on the same grid as the
    Idle art (2x2 sprite pixels = 1 dot). No VARCO output was used for this effect (it was drawn in code).
  - Implementation: \`EnemyActionKind\` gained \`QueenGrowth\` and \`QueenRotationLock\`; \`Enemy.NotifyAction\` reports one of
    them instead of \`Skill\` for the Queen's skill turns (the growth / rotation-lock alternation is decided right after
    the notification, so the notification reads the alternation state before it flips); \`EnemyView.PlayAttack\` fires the
    new \`Skill\` trigger of the Boss Idle animator for \`QueenGrowth\` only. The controller \`CrystalQueen_Idle\` gained the
    trigger \`Skill\` and the state \`Skill\` (Idle -> Skill on the trigger, Skill -> Idle when it ends, same settings as
    \`Attack\`). The clip \`CrystalQueen_Skill\` animates the same body sprites as \`CrystalQueen_Attack\` and the same child
    \`BossAttackFx\` (sprites from the new sheet), so the prefab \`P_Enemy\` is unchanged. Assets in
    \`@Resources/Enemies/CrystalQueenSkill\`: \`T_CrystalQueen_SkillFx\` (800x480, 11 cells used of 160x160, PPU 75.6,
    pivot (0.5, 0.45), Point filter, uncompressed, same import settings as \`T_CrystalQueen_AttackFx\`) and the clip.
  - Limits: the hand magic at full reach can overlap the neighbouring slot's monster (same as the basic attack), the
    crown overlaps the top of the Queen's crystals, the time scale stops the motion (pause, game over) like Idle, and the
    target arrow above the Queen can overlap the crown while she is targeted. Not yet played by hand in a full run.
Verified 2026-10-06 in play mode`);
if (t.charCodeAt(0) !== 0xFEFF) throw new Error('BOM 손실');
const lf = (t.match(/(?<!\r)\n/g) || []).length; if (lf) throw new Error('LF 단독 줄 ' + lf);
fs.writeFileSync(f, t, 'utf8'); console.log('Plan.md 수정 완료, BOM 유지, LF 단독 0');
