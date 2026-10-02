# TETRIGEON — TURN-BASED TETRIS ROGUELIKE
Design notes | 2026-09-14 (code sync: 2026-10-01; crystal-cell design update: 2026-10-02)

Status: Core rules describe the intended direction. Recommendations, examples,
and undecided details are not commitments. Based on prior discussion and the
source planning memo. Setting and release platform: TBD.
Production note: 2D is acceptable. A library can convert 3D VFX to 2D;
the instructor can provide details if needed.

## 1. OVERVIEW
Title: Tetrigeon (Tetris + Dungeon).
Genre: Turn-based Tetris puzzle roguelike.
Scope: Solo development; one-month MVP with a complete combat-to-reward-to-combat loop.
Combine Peglin-style combat, rewards, and route selection with Tetris puzzles.
Place pieces and clear lines to attack; enemies pressure both HP and board space.
Repeat battles and rewards to reach the boss.

## 2. CORE CONCEPT
"A Tetris roguelike where seven pieces form one planned turn."
Placement, line clears, and space management drive combat. Build attack
opportunities within each bag while preparing for the next enemy action.
High HP does not guarantee a safe board; a clean board does not guarantee enough HP.
Top Out clears the board and costs HP, allowing survival while discouraging
repeated resets as an advantageous strategy.

## 3. RUN LOOP
Start run -> enter combat -> use one bag -> enemy acts -> repeat with new bags
until victory -> choose reward -> choose route/next area -> boss -> end run.
Player HP <= 0: defeat. Enemy HP <= 0: remove that enemy from combat.
Normal combat stages end only when all enemies are defeated. In a boss stage,
defeating the boss completes the stage even if other enemies remain.
Stage completion and reward processing must occur exactly once.
Progression candidates: relics; piece addition, upgrades, or removal; shops,
events, and treasure areas. Details are undecided. Keep MVP rewards/progression
small; defer complex branches and events.

## 4. SEVEN-BAG TURNS
Standard pieces: I, J, L, O, S, T, Z. Each bag contains one of each, shuffled.
One player turn uses all seven pieces: turn starts -> place seven -> resolve
player damage from the lines cleared during that bag -> enemy turn -> next bag.
Enemies act after a bag, not after each piece.
Implemented turn counting (2026-10-01): a player turn ends after 7 actual Locks.
Hold swaps are not Locks, so a held piece can carry over and the turn boundary
can drift from the 7-bag boundary; the piece queue itself never resets mid-stage.
Bag completion does not reset the board; remaining blocks support later attacks
and cleanup. Relics that add/remove pieces from bags are expansion ideas only:
adopting them requires separate bag-size and turn-end rules.

### Hold rune charges (2026-09-18)
Confirmed initial balance: apply from the first stage to all combat, including
boss fights. This replaces the earlier boss-only Hold restriction idea.

| Rule | Value |
| --- | --- |
| Maximum charges | 4, represented by the core's four runes |
| Stage start | 4 charges, recharge progress 0 |
| Successful Hold | Consume 1 charge, for both empty-slot storage and swapping |
| Recharge | 1 charge per 3 actual piece Locks while below capacity |
| Zero charges | Reject Hold; retain the stored piece |
| Bag end / individual enemy death | Preserve charges and recharge progress |
| At maximum charges | Progress is 0; do not bank additional recharge progress |

Count actual piece fixation, not drop-button presses, falling distance, cleared
lines, or Hold actions. Hard drop and natural/soft-drop fixation each count once.
On the third qualifying Lock, add one charge and reset progress to 0. Spending
a charge does not erase existing partial progress. Failed or blocked Hold inputs
consume nothing and change neither the active piece nor the stored piece.
Keep the existing rule: after a successful Hold, another Hold is unavailable
until a piece Locks, even if charges remain. Other existing turn/input gates remain.
Do not reset charges at ordinary bag start or enemy-turn transitions. Trigger
the full refill only on genuine stage entry, not on UI enable/rebinding.

UI: lit rune count equals remaining charges (0-4). Central glow independently
indicates whether Hold contains a piece. Confirmed (2026-09-18): do not display
recharge text, numbers, or a progress gauge; players infer recharge timing from
Locks. Keep internal progress and the 3-Lock recharge rule. Reuse the current
core design, placement, and pixel-art density;
do not replace it with a redesigned core. The golem's small chest core retains
its existing occupancy ON/OFF behavior; no new miniature rune UI is required.
Use shared gameplay state and event-driven UI updates, not separate UI counters.

Confirmed (2026-09-18): Top Out empties the stored Hold piece but preserves both
remaining charges and partial recharge progress. It is not a new stage and
grants no free refill. The reset itself consumes no charge and adds no recharge
progress. Example: 2 charges and progress 2/3 remain 2 and 2/3 after the reset;
the next qualifying Lock restores one charge. Central occupancy glow turns OFF
while rune count and internal recharge progress retain their current values.
Keep recharge threshold easy to tune from 3 to 2 for later balance tests, using
the project's existing settings pattern. No enemy or Garbage balance changes.
Implemented: PieceSpawner Inspector values maxHoldCharges 4, locksPerCharge 3.
Verify 4-charge start, successful/failed Hold costs, zero-charge blocking,
one-Hold-per-Lock, all Lock paths counting once, 3-Lock recharge, no overfill or
banking at capacity, progress preservation across bags, stage-entry reset, and
independent rune/occupancy visuals. Report any art or scene wiring left for Codex
to finish; do not claim untested Unity behavior is verified.

## 5. NEXT AND COMBAT UI
Intended: Preview the next 3-4 pieces to plan placements and clears within a bag.
Recommended UI: board and active piece; NEXT; remaining pieces in current bag;
player/enemy HP; next enemy action with expected HP damage and Garbage amount.
Implemented UI (2026-10-01), replacing the earlier "NEXT 3 or 4" TBD:
- NEXT ("FATE" panel) previews 5 pieces.
- Remaining pieces in the turn: 7-rune gauge under Lemy's Core; lit runes = Locks left.
- Accumulated damage: damage icon + `n DMG` (normal attack total, Critical shown
  separately), then one row per ability fired this bag (formats in section 7).
- Player: `PLAYER hp / max`, plus `[보호막 n]` while a shield exists.
- Each enemy: `hp/max`, `SKILL n` (turns until its Garbage skill), boss
  `피해 -50%` while escorts live, and status icons for poison and freeze.
- Stage panel: `STAGE n`, `ENEMIES alive / total`, `[TAB] TARGET`.
- Left panel lists upgraded minos with `Lv.n` (`Lv.MAX` at level 5).
- Not implemented: each enemy's expected HP damage or Garbage amount for its
  next action; only the skill countdown is shown.

## 6. PLAYER ACTIONS AND ATTACKS
Move, rotate, and place pieces; complete horizontal rows to clear lines and attack.
Confirmed (2026-09-17): accumulate the player's line-clear results during one
bag and apply damage based on those cleared lines when the bag ends. Do not
apply combat damage immediately on each clear. Resolve player damage first,
then pass the turn to the enemy.

Confirmed base rule: each fully filled horizontal row cleared normally deals
1 base damage. Blocks/rows removed by a Top Out reset do not count as line clears.
Provisional bonuses (2026-09-17): initial playtest values, subject to feedback.
T-Spin Single, Double, and Triple must be recorded and evaluated separately.

| Clear result | Lines | Base damage | Bonus | Total damage |
| --- | ---: | ---: | ---: | ---: |
| Single | 1 | 1 | 0 | 1 |
| Double | 2 | 2 | 0 | 2 |
| Triple | 3 | 3 | 0 | 3 |
| Tetris (four lines at once) | 4 | 4 | +2 | 6 |
| T-Spin Single | 1 | 1 | +2 | 3 |
| T-Spin Double | 2 | 2 | +3 | 5 |
| T-Spin Triple | 3 | 3 | +4 | 7 |
| Perfect Clear after a normal line clear | - | Already counted | +5 | Clear total + 5 |
| Top Out board reset | - | 0 | 0 | 0 |

Per-clear damage = cleared rows + applicable Tetris/T-Spin bonus + Perfect
Clear bonus, if applicable. Sum these results across the bag, then apply once
at bag end. Evaluate bonuses per clear, not from the bag's total line count:
four separate Singles deal 4; one Tetris deals 6.
Perfect Clear stacks with the clear's bonus (e.g. Tetris + Perfect Clear = 11).
Only an empty board resulting from a normal line clear earns Perfect Clear;
an empty initial board or Top Out reset earns no Perfect Clear bonus.
For this first balance pass, a T-Spin without a line clear deals 0; Mini
T-Spins use base line damage only, with no bonus. Mini bonuses remain TBD.
Combo implementation and its damage bonus are deferred from the first battle.
Back-to-Back bonuses are also deferred from this initial damage table.
Defense, healing, status effects, and special-piece effects are expansion
candidates, separate from the basic attack rules.
Implemented (2026-10-01): shield, healing, poison, and freeze exist only as mino
upgrade abilities (section 7). Special pieces are not implemented.

### Target selection with multiple enemies (2026-09-17)
When a stage holds several enemies the player picks which one to attack.
- Tab cycles the target to the enemy on the right; from the rightmost enemy it
  wraps around to the leftmost.
- The bag's accumulated damage is applied to the targeted enemy only.
- If the target dies, the excess damage is discarded. It never carries over to
  another enemy or to the next stage.
- Dead enemies are skipped when cycling targets.
- Implemented (2026-10-01): the first target of a stage is the leftmost enemy.
  When the target dies, the target moves automatically to the next living enemy
  to the right (wrapping). A dead enemy is never the target.

## 7. ENEMY TURN AND GARBAGE
After each bag the enemy acts. Confirmed (2026-09-17): Garbage does NOT arrive
every turn. The enemy's basic attack only reduces player HP; Garbage Lines are
a skill the enemy uses once every N turns (N is tunable, initial value 3).
HP damage and Garbage are mutually exclusive: on a skill turn the enemy adds
Garbage Lines and deals NO HP damage that turn. Other turns are HP damage only.
This gives the player quiet turns to clean up the board and makes the skill
turn something to plan around rather than constant background pressure.
The remaining turn count until the skill fires must be visible to the player.
Garbage occupies space and pushes existing blocks upward, requiring attack
planning and board cleanup before the skill lands.

Garbage skill schedule per enemy tier (2026-09-17):
Each enemy runs its OWN skill counter. When several enemies reach their skill
turn together, their Garbage lines are added together that turn.

| Enemy tier | Skill interval | Garbage lines per skill turn |
| --- | ---: | --- |
| normal | every 3 turns | 1 |
| epic | every 5 turns | 2-3, random |
| boss | every 6 turns | 3-5, random |

Hole placement (2026-09-17): each Garbage line has one empty column. When a
skill turn adds several lines at once, they all share the SAME empty column,
so the gap forms a vertical channel the player can drop a piece through. The
column is rolled once per skill activation, not per line.
Implemented (2026-10-01): blocks pushed above the top row by Garbage are deleted;
this does not trigger Top Out.

Enemy HP and basic attack damage are fixed within each tier, regardless of stage.
Initial enemy HP and basic attack damage are listed below; final balance is TBD.

### Enemy HP and attack balance (2026-09-17)
Provisional values for longer battles across approximately 10 stages.
Adjusted on 2026-09-18 after playtest: the original 40/80/120 made stage 10 too
far away, and halving cut too deep. Now 25/50/75, which is 62.5% of the original,
keeps the 1:2:3 tier ratio, and stays on clean multiples of 5.
Basic attack damage was not changed.
Current implemented values (2026-10-01, EnemyStats): normal 20 / epic 40 /
boss 70, adopted together with the 10-stage lineup below. They replace 25/50/75.
Tier names: normal = regular, epic = elite, boss = final boss.
Increase enemy count and change tier composition rather than scaling the same
tier's HP or attack by stage. This replaces the previous stage-based stat ranges.

| Enemy tier | HP per enemy | Basic attack damage |
| --- | ---: | ---: |
| normal | 20 | 2 |
| epic | 40 | 3 |
| boss | 70 | 3 |

Implemented stage lineup (2026-10-01, StageData; listed left to right on screen).
The previous lineup (normal x2/x3/x4, stage 9 non-combat, stage 10 boss x1) was
replaced; stage 9 is now combat and the non-combat blessing stage was removed.

| Stage | Composition (left -> right) | Enemy count | Total enemy HP |
| --- | --- | ---: | ---: |
| 1 | normal | 1 | 20 |
| 2 | normal, normal | 2 | 40 |
| 3 | normal, normal, normal | 3 | 60 |
| 4 | epic | 1 | 40 |
| 5 | normal, epic | 2 | 60 |
| 6 | normal, normal, epic | 3 | 80 |
| 7 | epic, epic | 2 | 80 |
| 8 | normal, epic, epic | 3 | 100 |
| 9 | epic, epic, epic | 3 | 120 |
| 10 | normal, epic, boss | 3 (+summons) | 130 |

Enemies stand in one row centered at x 5.9, 1.8 units apart, boss on the right.

Stage 10 boss rules (implemented):
- Escort protection: while any non-boss enemy is alive, every hit on the boss
  (bag damage, pierce, explosion, poison, freeze break) is halved, rounded, minimum 1.
  The boss shows `피해 -50%` during that time.
- Summon: on the boss's Garbage skill turn it also summons, after all enemies have
  acted (the summon does not act that turn). The leftmost dead non-boss slot is
  revived as a full-HP normal with cleared statuses and skill counter. If no slot
  is dead, the first living normal is restored to max HP (statuses kept). If
  neither exists, nothing happens. The row never grows.
- Defeating the boss clears the stage even if escorts remain.

Stage composition is implemented as listed above.
Enemies appear together and surviving enemies participate in the same enemy
turn; do not implement sequential replacement waves. An individual enemy's
death does not reset the board or Hold while the stage continues.
Excess damage is discarded, never transferred to another enemy or stage.
Example: 20 damage against an enemy with 5 HP defeats it and discards 15 damage.
This supersedes the previous sequential-enemy and damage-carryover proposal.

Stage-clear rewards were first a choice of mino upgrade OR player HP recovery;
superseded on 2026-09-18 by "both" (see Stage progression and rewards below).
Stage-clear recovery never triggers on individual kills.
Do not invent player blessing effects; the blessing event no longer exists.
Mino upgrades, the HP recovery amount, and the stage lineup are implemented
(below and above). New reward types still need user decisions first.
Confirmed combat and stage-composition work may proceed independently.
Player attack targeting/distribution and multi-enemy skill scheduling are not
defined by this table: inspect existing behavior and clarify missing rules
before implementing dependent behavior; do not invent new Garbage rules.

Basic attack damage applies only on HP-attack turns. Existing Garbage amounts,
skill intervals, hole placement, and the no-HP-damage rule on skill turns remain
unchanged. These values are implemented and remain subject to playtesting.

### Stage progression and rewards (2026-09-18)
Confirmed run structure: clear a stage -> reward screen -> take the rewards ->
enter the next stage. Stages 1 to 10 run in a straight line for this pass.
Branching routes are a later addition if time allows, not part of this work.

Changed 2026-09-18 after playtest: clearing a stage grants BOTH rewards, because
choosing only one left the run unwinnable.
- HP recovery: restore 20 player HP, applied automatically with no choice.
- Mino upgrade: three upgrades are drawn at random from the per-mino concept
  list, and the player picks one of those three.

Implemented details (2026-10-01):
- Player max HP is 100. Recovery is capped at max HP.
- Each button reads `<mino>  Lv.n → n+1`; picking one starts the next stage.
- Kept across stages: player HP and mino upgrade levels. Reset at stage start:
  enemies, board, bag, Hold slot, Hold charges (refilled to 4), and shield.
- Stage 10 also shows the reward screen; picking an upgrade there ends the run.
  The run end (victory or defeat) shows the same restart window; restart reloads
  the scene and resets the run, including upgrades.

Mino upgrade trigger rules (updated 2026-10-02, confirmed design):
The existing locked-piece trigger remains unchanged. Crystal-cell triggers are
an ADDITION, not a replacement. Crystal cells are planned, not implemented yet.
1. Locking an upgraded mino (Lv.1+) and clearing lines triggers its existing
   ability once. Clearing several lines with that Lock still counts once;
   a Lock with no line clear does not trigger it.
2. Ordinary upgraded blocks merely present in a cleared row do not trigger an
   ability. Starting at Lv.2, designated crystal cells are the exception below.
3. The existing locked-piece ability continues to scale with the damage of that
   clear and the upgrade level, using the existing table and bag-end settlement.

### Crystal cells (2026-10-02, confirmed; implementation pending)
Updated 2026-10-02: the crystal count now grows with the level. This replaces
the earlier "exactly one crystal at Lv.2-5, rerolled at piece creation" rule.
- Applies to all seven mino types: I, J, L, O, S, T, Z.
- Crystal count by level: Lv.0 and Lv.1 none, Lv.2 one, Lv.3 two, Lv.4 three,
  Lv.5 all four cells.
- Selection happens at upgrade time, not at piece creation. Reaching Lv.2
  chooses one of the four cells uniformly (25% each). Each later level-up chooses
  one more cell uniformly among the cells that are not crystal yet (Lv.3: 1 of 3,
  Lv.4: 1 of 2, Lv.5: the last cell). Earlier crystal cells never change.
- The choice is per mino type and refers to the piece's own cell order. Every
  piece of that type spawned afterwards has its crystals on the same cells until
  the next level-up. Moving or rotating the piece keeps the crystals attached to
  those cells, not to board positions.
- Hold storage and retrieval preserve the crystal cells; Hold never rerolls them.
- Crystal color: each crystal uses its source mino's color (I cyan, J blue,
  L orange, O yellow, S green, T purple, Z red).
- After Lock, the crystal retains its source mino type on the board and moves
  with its block when rows collapse or Garbage shifts blocks upward.
- Normally clearing a row containing the crystal triggers its source mino's
  ability once, even if a different or unupgraded mino caused the line clear.
  Clearing only the source piece's ordinary cells grants no crystal activation.
- Existing locked-piece activation and crystal activation count independently:
  clearing with an upgraded mino AND clearing its own crystal gives TWO ability
  activations (one existing activation + one crystal activation).
- Each removed crystal triggers once. If several crystals are cleared together,
  each adds an activation of its own source ability. Do not merge them into one
  activation or trigger the same crystal again after row movement.
- Example: an upgraded L clears a row containing an old T crystal and a J
  crystal: existing L Critical + additional T Poison + additional J Freeze.
- Crystal effects are accumulated for the existing bag-end settlement, not
  applied immediately on line removal. Existing status stacking/duration rules
  remain; additional Freeze activations do not imply additive freeze duration.
- Top Out resets, stage cleanup, and deletion of blocks pushed above the board
  are not normal line clears and grant no crystal activation.
- Visuals must distinguish crystal cells from ordinary cells; non-crystal cells
  keep the existing Lv.1+ upgraded appearance. A crystal cell becomes a whole
  crystal block in its mino's color, keeping the same cell size, dark outline,
  and colored connection seams as the upgraded cell it replaces.

Not yet decided: the damage input D and level used for a crystal activation,
whether it also contributes ordinary target damage, and the line-count input
for a J crystal cleared by another piece. Existing formulas below document the
locked-piece implementation; do not silently assume re-running that entire
handler defines these new crystal-specific numerical rules.

Verification required when implemented: all seven types; no crystals at Lv.0/1;
one/two/three/four crystals at Lv.2/3/4/5; earlier crystals kept on level-up;
equal random selection among the remaining cells; the same crystal cells on every
spawned piece of that type until the next level-up; rotation and Hold persistence;
locked-cell metadata surviving row shifts; activation by another mino; own
crystal plus existing activation = two; multiple crystals counted separately;
no duplicate activations or reset-triggered effects; bag-end timing preserved.

Upgrade levels (implemented 2026-10-01): picking the same mino again raises its
level. Ability strength scales with level as in the table below ("bonus x Lv");
durations do not scale with level. The maximum is Lv.5, shown as `Lv.MAX`.
Abilities use the full damage of the clear, including T-Spin and Perfect Clear
bonuses; there is no other interaction with those bonuses.
Per-mino abilities (2026-09-22, confirmed and implemented):
"Damage" below always means the damage this project already computes for that
one clear (CombatDamage.Calculate); ability strength is never recomputed from
the line count. Multiplied values are rounded to the nearest integer.

| Mino | Ability | Effect | Value at Lv.n (implemented, D = Damage) |
| --- | --- | --- | --- |
| I | Pierce | Damage to every living monster instead of the target only | round(D x (0.5 + 0.5 x Lv)) each; Lv.1 = D |
| J | Freeze | Clear 1/2/3 lines to block 1/2/3 enemy actions; existing break damage on release | break round(D x 0.5 x Lv) per clear, summed; actions = lines, longest in the bag |
| O | Shield | Damage x2 as player shield, stacking, granted at bag end, lasts 2 turns | D x 2 x Lv |
| T | Poison | Damage x0.7 per hit for 2 hits, stacking, each instance tracked separately (timing below) | round(D x 0.7 x Lv) per hit |
| S | Heal | Damage x3 to the player, capped at max HP, no overheal | D x 3 x Lv |
| Z | Explosion | Damage x0.7 to the nearest other living monster; nothing if alone | round(D x 0.7 x Lv) |
| L | Critical | Damage x2 to the target, always, no random roll | D x (1 + Lv); Lv.1 = x2, Lv.2 = x3 |

Rounding uses Unity's RoundToInt, so .5 goes to the nearest even number.
Implemented details: Explosion picks the nearest living monster to the target,
checking the right side first at equal distance. A new shield adds to the pool
and resets its duration to 2 enemy turns; the enemy turn right after the grant
is the first. The shield absorbs enemy HP attacks before HP and is cleared at
stage start.

J and L abilities were swapped on 2026-09-30 (blue J = Freeze, orange L =
Critical). Values and rules moved unchanged; upgrade levels stay with each mino.
J against a boss only freezes when Damage >= 2 (the largest J clear of that
bag); below that the boss takes the normal damage with no freeze. A frozen monster does not act on its frozen turn.
Every ability except Pierce also applies the normal Damage to the target.
Ability effects settle at bag end together with the existing accumulated damage,
so mid-bag locks never damage a monster early.

Status timing (2026-09-30, confirmed and implemented):
Bag-end order: accumulated damage to the target -> release freezes whose blocked
actions are all used -> this bag's abilities (new poison, new freeze, explosion,
pierce, heal, shield) -> stage completion check -> enemy turn.
- Poison: a stack applied at bag end skips the enemy turn right after it (no
  damage, no count used). It hits on each of the next two enemy turns, then is
  removed. Other stacks keep ticking on their own; a new stack never pauses or
  refreshes them. UI: longest remaining hits x stack count ("2 x1" right after
  application, "1 x1" after the first hit, hidden when gone).
- Freeze (updated 2026-09-30): blue J remains Freeze; orange L remains Critical.
  Clearing 1/2/3 lines blocks 1/2/3 enemy actions, independent of damage bonuses
  and upgrade level. Within a bag use the longest duration, not their sum.
  Apply at bag end to the selected target. Each blocked enemy turn consumes one
  action and does not advance the skill counter. After the last block, retain
  the snowflake until the next settlement, then release and apply break damage
  once before enemy actions. Existing boss eligibility and damage reduction remain.
- Re-freeze before expiry keeps the longer of remaining and newly granted actions;
  break damage accumulates for the final release. When already due to release,
  resolve old break damage first and apply the new freeze only if the target survives.
- TurnLabel: normal/pierce/critical damage uses `n DMG`, explosion uses
  `EXPLOSION n DMG`, freeze uses `FREEZE nT`, poison uses `2T × n DMG`
  (combined per-turn damage of this bag's new stacks), heal/shield use `HEAL +n`
  and `SHIELD +n`. Monster status icon presentation is unchanged.
  Rows appear only for abilities that fired this bag, each with its ability icon
  (J uses the Freeze icon, L the Critical icon), and clear at bag end.
- Monster freeze icon (implemented): the snowflake shows from application until
  release. Its number is how many more enemy actions it will block; after the
  last block it shows no number until the release.
- Enemy-turn order (implemented): each living enemy, left to right: poison damage
  -> skip if dead -> skip its action if a freeze block remains (skill counter
  unchanged) -> Garbage skill or HP attack. Then boss summon, all Garbage lines at
  once, HP damage absorbed by the shield first, shield duration tick, defeat
  check, and stage completion check.
- Both are tracked per monster: switching targets does not move or cancel them.
  Summon Init clears them; RestoreHp keeps them.
Rewards draw 3 of the 7 minos at random, without duplicates, and the player
picks one. Implemented: minos at Lv.5 are excluded from the draw; if fewer than
3 remain, only that many buttons are shown.

Upgraded minos (Lv.1 and above) use the `MinoSprites/Upgraded` art instead of the
normal art. The active piece, ghost, locked blocks, NEXT, Hold, and the upgrade
list all switch when the level changes. The implemented base art is the same for every level. Planned Lv.2+ crystal cells (above) swap only the crystal cells to a crystal version of that cell's art; the other cells keep this base art.

Stage 9 is now a combat stage (epic x3); the non-combat blessing event was removed.

## 8. TOP OUT AND DEFEAT
Treat a conventional Tetris game-over state as Top Out, e.g. blocks reaching
the top and preventing normal spawning or placement. Define exact detection
before implementation.
Implemented detection (2026-10-01): Top Out happens when the next piece cannot be
placed at its spawn position; that piece is discarded. The board is shown for
0.4 s, then cleared row by row from the top (0.15 s per row), and the sequence
below runs.
Confirmed Top Out sequence (2026-09-17):
1. Delete all board blocks, including Garbage.
2. Apply the HP penalty. Defeat if HP reaches 0; otherwise the run continues.
3. End the player's turn immediately and pass to the enemy turn. Line-clear
   damage accumulated earlier in that bag still resolves; the Top Out removal
   itself contributes none. Enemy Garbage lands on the freshly emptied board.
4. Reset the bag: discard the current bag's remaining pieces, generate a new
   seven-bag, and empty the Hold slot. Preserve Hold charges and partial recharge
   progress (confirmed 2026-09-18). The next turn starts from that state.
A board reset is distinct from an attacking line clear: Top Out removal grants
no base damage, technique bonus, or Perfect Clear bonus.
Implemented penalty (2026-10-01): a fixed 30% of maximum HP (30 HP at 100) on
every Top Out, with no escalation (CombatManager topOutHpPenaltyRatio 0.3).
Earlier unconfirmed alternatives, not adopted:
- Fixed proportion: lose 25-35% of maximum HP.
- Escalating within one combat: first 20%, second 30%, third 40%; percentage
  basis is not specified for this alternative in the source.

## 9. EXAMPLE ENEMY ARCHETYPES (NOT A CONFIRMED ROSTER)
These are future concept candidates. They do not override the fixed tier stats
or existing Garbage rules used by the current balance plan in section 7.
- Attacker: high HP damage, little Garbage; pressures remaining HP.
- Disruptor: low HP damage, much Garbage; rapidly increases Top Out risk.
- Balanced: medium damage and Garbage; standard enemy for learning combat.
- Burst: possible exception with very high HP damage and zero Garbage;
  demands preparation; counterplay and intent signaling need separate design.
- Contaminator: low HP damage and special Garbage; expansion candidate for
  unusual board disruption; exact effects TBD.

## 10. RECOMMENDED ONE-MONTH MVP (NOT PRODUCTION COMMITMENTS)
Standard pieces: 7 types. Special pieces: none or 2-3.
Regular enemies: 4 types. Bosses: 1. Relics: 8-10.
Stages: 1 chapter with approximately 10 stages; simultaneous enemy counts are
listed in section 7. Shops: 1 very simple type.
Playable characters: 1. Meta-progression: excluded.
Saving: only consider a mid-run save.
Finish core combat first, then add content as time allows. Defer complex route
branches, many events/relics, multiple characters/bosses, and meta-progression.
Special pieces and saving must not take priority over core combat.

## 11. PRIORITIES AND FOUR-WEEK PLAN
Week 1 / Priority 1 — Tetris core:
Movement, rotation, collision, hard drop, locking; seven-bag generation and
consumption; NEXT, line clears, Top Out detection; Hold rune charges per section 4.
Week 2 / Priority 2 — One complete battle:
Player/enemy HP and line-clear damage; bag-end/enemy-turn transition;
enemy turns respecting mutually exclusive HP attacks and Garbage skills; Top Out reset/penalty;
win/loss detection and basic combat UI.
Week 3 / Priority 3 — Short run:
Add regular enemies and boss; rewards/relics and simple progression;
complete the battle-to-battle-to-boss flow.
Week 4 / Priority 4 — Polish:
Tune attack damage, enemy HP, Garbage amounts, and Top Out penalty;
refine controls, feedback, presentation, and audio; fix bugs and test builds.
End-of-week-2 gate: Does one battle work from start to victory/defeat and feel fun?
If yes, produce content. If no, improve core combat before expanding relics,
maps, or events.

## 12. DECISIONS BEFORE IMPLEMENTATION
- Attack timing confirmed: aggregated bag-end damage, then the enemy turn.
- Exact bag-end counting with Hold (including a piece carried between bags).
  Implemented: a turn ends after 7 Locks; Hold swaps do not count (section 4).
- Base damage confirmed: 1 per normally cleared row; Top Out removal excluded.
- Playtest the provisional Tetris, T-Spin Single/Double/Triple, and Perfect Clear
  bonuses in section 6. Combo, Back-to-Back, and Mini bonuses are deferred.
- Player HP and healing balance; playtest fixed enemy tier stats and stage
  counts from section 7. Garbage rules remain as specified in section 7.
  Implemented: player max HP 100, stage-clear heal 20, enemy HP 20/40/70; tuning
  after playtest is still open.
- Player attack targeting/distribution and multi-enemy skill scheduling where
  existing behavior is undefined; preserve all established Garbage rules.
  Implemented: single target with Tab, auto-retarget on death (section 6); each
  enemy keeps its own skill counter and Garbage is summed (section 7).
- User confirmation required before implementing mino upgrades, HP recovery
  amounts, and the stage map. Implemented after user decisions (section 7); the
  stage 9 blessing event was removed.
- Top Out detection, HP penalty, and subsequent bag/turn handling.
  Implemented: spawn-blocked detection, fixed 30% penalty (section 8).
- Automatic gravity and time limits; Hold availability is defined in section 4.
  Implemented: gravity 1 row per second (soft drop speed comes from the SDF
  option), lock delay 1.0 s that resets on every move with no move limit, and
  no time limit.
- Top Out Hold rule confirmed: empty the slot; preserve charges and recharge progress.
- NEXT: 3 or 4 pieces. Implemented: 5 pieces.
- Which HP and board state persists or resets between battles.
  Implemented: see Stage progression and rewards in section 7.
- Reward types, relic effects, and route-selection scope.
  Implemented: HP recovery + mino upgrade only; relics, shops, and routes are
  not implemented (stages 1-10 are linear).
First complete unit: one battle that repeats "place seven -> line-clear attack
-> enemy attacks HP and board -> next bag" until victory or defeat.

## 13. IMPLEMENTATION AND VERIFICATION FOR STAGES
Read CLAUDE.md and this plan, then trace existing combat, damage resolution,
enemy spawning, and completion/reward flows before editing. Reuse existing
systems and follow prefab/hierarchy rules. Add short Korean action comments
to every added or modified code line as required by CLAUDE.md.
Verify and report:
- Fixed tier stats at every stage and correct simultaneous roster counts.
- Surviving enemies act; defeated enemies cannot act.
- Individual kills preserve board/Hold and do not end an unfinished stage.
- Excess damage is discarded, including a hit exceeding the target's HP.
- All-enemies-dead completion in ordinary stages; boss-dead completion in
  boss stages even with surviving non-boss enemies.
- Completion/reward handling occurs once; no per-kill stage-clear healing.
- Existing bag-end damage, T-Spin categories, Top Out, and Garbage behavior
  remain intact, including no HP attack on Garbage skill turns.
- Every stage 1-10 spawns the lineup in section 7 (stage 9 is now combat);
  unapproved reward/map content is not invented.
Report changed files, compilation/test results, and anything not verified.
