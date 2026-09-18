# TETRIGEON — TURN-BASED TETRIS ROGUELIKE
Design notes | 2026-09-14

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
Verify 4-charge start, successful/failed Hold costs, zero-charge blocking,
one-Hold-per-Lock, all Lock paths counting once, 3-Lock recharge, no overfill or
banking at capacity, progress preservation across bags, stage-entry reset, and
independent rune/occupancy visuals. Report any art or scene wiring left for Codex
to finish; do not claim untested Unity behavior is verified.

## 5. NEXT AND COMBAT UI
Intended: Preview the next 3-4 pieces to plan placements and clears within a bag.
Recommended UI: board and active piece; NEXT; remaining pieces in current bag;
player/enemy HP; next enemy action with expected HP damage and Garbage amount.
TBD: NEXT count (3 or 4) and exact enemy-intent presentation.

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

### Target selection with multiple enemies (2026-09-17)
When a stage holds several enemies the player picks which one to attack.
- Tab cycles the target to the enemy on the right; from the rightmost enemy it
  wraps around to the leftmost.
- The bag's accumulated damage is applied to the targeted enemy only.
- If the target dies, the excess damage is discarded. It never carries over to
  another enemy or to the next stage.
- Dead enemies are skipped when cycling targets.

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

Enemy HP and basic attack damage are fixed within each tier, regardless of stage.
Initial enemy HP and basic attack damage are listed below; final balance is TBD.

### Enemy HP and attack balance (2026-09-17)
Provisional values for longer battles across approximately 10 stages.
Adjusted on 2026-09-18 after playtest: the original 40/80/120 made stage 10 too
far away, and halving cut too deep. Now 25/50/75, which is 62.5% of the original,
keeps the 1:2:3 tier ratio, and stays on clean multiples of 5.
Basic attack damage was not changed.
Tier names: normal = regular, epic = elite, boss = final boss.
Increase enemy count and change tier composition rather than scaling the same
tier's HP or attack by stage. This replaces the previous stage-based stat ranges.

| Enemy tier | HP per enemy | Basic attack damage |
| --- | ---: | ---: |
| normal | 25 | 2 |
| epic | 50 | 3 |
| boss | 75 | 3 |

| Stage | Simultaneous enemy composition / event | Enemy count | Total enemy HP |
| --- | --- | ---: | ---: |
| 1-2 | normal x2 | 2 | 50 |
| 3-4 | normal x3 | 3 | 75 |
| 5 | epic x1 | 1 | 50 |
| 6-7 | normal x4 | 4 | 100 |
| 8 | epic x1 + normal x3 | 4 | 125 |
| 9 | Mino upgrade OR player blessing (non-combat) | 0 | - |
| 10 | boss x1 | 1 | 75 |

Stage composition is a specification, not an implemented feature yet.
Enemies appear together and surviving enemies participate in the same enemy
turn; do not implement sequential replacement waves. An individual enemy's
death does not reset the board or Hold while the stage continues.
Excess damage is discarded, never transferred to another enemy or stage.
Example: 20 damage against an enemy with 5 HP defeats it and discards 15 damage.
This supersedes the previous sequential-enemy and damage-carryover proposal.

Stage-clear rewards are a choice of mino upgrade OR player HP recovery.
If stage-clear recovery already exists, do not trigger it on individual kills.
Do not invent recovery amounts, mino upgrade entries, or player blessing effects.
Stage 9 is a separate non-combat upgrade/blessing event, not an enemy encounter.
Before implementing mino upgrades, HP recovery amounts, or the stage map,
explain existing behavior and a brief recommendation, then obtain user decisions.
Confirmed combat and stage-composition work may proceed independently.
Player attack targeting/distribution and multi-enemy skill scheduling are not
defined by this table: inspect existing behavior and clarify missing rules
before implementing dependent behavior; do not invent new Garbage rules.

Basic attack damage applies only on HP-attack turns. Existing Garbage amounts,
skill intervals, hole placement, and the no-HP-damage rule on skill turns remain
unchanged. These are planning values for playtesting, not runtime changes.

### Stage progression and rewards (2026-09-18)
Confirmed run structure: clear a stage -> reward screen -> take the rewards ->
enter the next stage. Stages 1 to 10 run in a straight line for this pass.
Branching routes are a later addition if time allows, not part of this work.

Changed 2026-09-18 after playtest: clearing a stage grants BOTH rewards, because
choosing only one left the run unwinnable.
- HP recovery: restore 20 player HP, applied automatically with no choice.
- Mino upgrade: three upgrades are drawn at random from the per-mino concept
  list, and the player picks one of those three.

Per-mino upgrade concepts are NOT defined yet. Mentioned only as direction,
not as commitments: I = piercing, T = poison damage over several turns.
The actual entries, effects, numbers, and stacking rules remain undecided.
Do not invent them. Implement the reward flow and HP recovery first and leave
the mino upgrade entry list empty until the user confirms it.

Mino upgrade trigger rules (2026-09-18, confirmed):
1. The upgrade fires when a line is cleared by locking that upgraded mino.
2. If an upgraded mino's blocks merely sit in a cleared row, but the clear was
   not caused by locking that upgraded mino, the ability does NOT fire.
   The trigger is the locked piece's type, exactly like the existing T-Spin
   check, not the board contents of the cleared rows.
3. The ability scales further with the number of lines cleared by that lock.
   Scaling details are undecided and will be added later.
Still undecided, do not invent: the per-mino ability list and numbers, stacking
when the same mino is upgraded twice, interaction with T-Spin and Perfect Clear
bonuses, and whether a lock that clears no line can ever fire an ability
(rule 1 implies it cannot).
Note: a piercing-style ability would contradict the confirmed "excess damage is
discarded" rule in this section; resolve that conflict when abilities are defined.
Upgraded minos need a visual distinction from normal minos; art is pending.

Stage 9 remains the non-combat upgrade/blessing event; its blessing effect is
still undefined.

## 8. TOP OUT AND DEFEAT
Treat a conventional Tetris game-over state as Top Out, e.g. blocks reaching
the top and preventing normal spawning or placement. Define exact detection
before implementation.
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
Unconfirmed penalty alternatives (not simultaneous):
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
- Base damage confirmed: 1 per normally cleared row; Top Out removal excluded.
- Playtest the provisional Tetris, T-Spin Single/Double/Triple, and Perfect Clear
  bonuses in section 6. Combo, Back-to-Back, and Mini bonuses are deferred.
- Player HP and healing balance; playtest fixed enemy tier stats and stage
  counts from section 7. Garbage rules remain as specified in section 7.
- Player attack targeting/distribution and multi-enemy skill scheduling where
  existing behavior is undefined; preserve all established Garbage rules.
- User confirmation required before implementing mino upgrades, HP recovery
  amounts, and the stage map. Stage 9 blessing effects also remain undefined.
- Top Out detection, HP penalty, and subsequent bag/turn handling.
- Automatic gravity and time limits; Hold availability is defined in section 4.
- Top Out Hold rule confirmed: empty the slot; preserve charges and recharge progress.
- NEXT: 3 or 4 pieces.
- Which HP and board state persists or resets between battles.
- Reward types, relic effects, and route-selection scope.
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
- Stage 9 is not spawned as combat; unapproved reward/map content is not invented.
Report changed files, compilation/test results, and anything not verified.
