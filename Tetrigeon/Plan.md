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
Player HP <= 0: defeat. Enemy HP <= 0: combat victory.
Progression candidates: relics; piece addition, upgrades, or removal; shops,
events, and treasure areas. Details are undecided. Keep MVP rewards/progression
small; defer complex branches and events.

## 4. SEVEN-BAG TURNS
Standard pieces: I, J, L, O, S, T, Z. Each bag contains one of each, shuffled.
One player turn uses all seven pieces: turn starts -> place seven -> enemy turn
-> next bag. Enemies act after a bag, not after each piece.
Bag completion does not reset the board; remaining blocks support later attacks
and cleanup. Relics that add/remove pieces from bags are expansion ideas only:
adopting them requires separate bag-size and turn-end rules.

## 5. NEXT AND COMBAT UI
Intended: Preview the next 3-4 pieces to plan placements and clears within a bag.
Recommended UI: board and active piece; NEXT; remaining pieces in current bag;
player/enemy HP; next enemy action with expected HP damage and Garbage amount.
TBD: NEXT count (3 or 4) and exact enemy-intent presentation.

## 6. PLAYER ACTIONS AND ATTACKS
Move, rotate, and place pieces; complete horizontal rows to clear lines and attack.
Evaluate: simultaneous 1/2/3/4-line clears, combos, T-Spins, and Back-to-Back.
Line-clear attacks are intended; damage values, bonus inclusion, and formulas: TBD.
Attack timing alternatives: A) damage immediately on each clear;
B) aggregate results and apply damage at bag end (prior recommendation).
If B is adopted: place seven -> resolve attack results -> enemy acts.
Defense, healing, status effects, and special-piece effects are expansion
candidates, separate from the basic attack rules.

## 7. ENEMY TURN AND GARBAGE
After each bag, the enemy's basic attack both reduces player HP and adds Garbage
Lines. Garbage occupies space and pushes existing blocks upward, requiring
attack planning and board cleanup in the next bag.
Vary HP damage versus Garbage amounts to distinguish enemies.
Damage, line counts, and hole-placement rules: TBD.
Recommended expansion: bag-count-based preparation/heavy-attack/rest patterns.

## 8. TOP OUT AND DEFEAT
Treat a conventional Tetris game-over state as Top Out, e.g. blocks reaching
the top and preventing normal spawning or placement. Define exact detection
before implementation.
On Top Out: delete all board blocks, including Garbage -> apply HP penalty
-> continue if HP > 0; otherwise defeat. Top Out alone does not end the run.
A board reset is distinct from an attacking line clear; whether it grants an
attack reward is a separate decision.
Unconfirmed penalty alternatives (not simultaneous):
- Fixed proportion: lose 25-35% of maximum HP.
- Escalating within one combat: first 20%, second 30%, third 40%; percentage
  basis is not specified for this alternative in the source.
TBD: retain the current bag's remaining pieces or advance to the next bag.

## 9. EXAMPLE ENEMY ARCHETYPES (NOT A CONFIRMED ROSTER)
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
Stages: 1 chapter. Battles per run: 6-8. Shops: 1 very simple type.
Playable characters: 1. Meta-progression: excluded.
Saving: only consider a mid-run save.
Finish core combat first, then add content as time allows. Defer complex route
branches, many events/relics, multiple characters/bosses, and meta-progression.
Special pieces and saving must not take priority over core combat.

## 11. PRIORITIES AND FOUR-WEEK PLAN
Week 1 / Priority 1 — Tetris core:
Movement, rotation, collision, hard drop, locking; seven-bag generation and
consumption; NEXT, line clears, Top Out detection; decide whether to allow Hold.
Week 2 / Priority 2 — One complete battle:
Player/enemy HP and line-clear damage; bag-end/enemy-turn transition;
enemy attacks applying HP damage and Garbage together; Top Out reset/penalty;
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
- Immediate line-clear damage versus aggregated bag-end damage.
- Base damage per cleared-line count; combo/T-Spin/Back-to-Back inclusion/formulas.
- Player/enemy HP, enemy damage, and Garbage line counts.
- Top Out detection, HP penalty, and subsequent bag/turn handling.
- Automatic gravity, time limits, and Hold availability.
- NEXT: 3 or 4 pieces.
- Which HP and board state persists or resets between battles.
- Reward types, relic effects, and route-selection scope.
First complete unit: one battle that repeats "place seven -> line-clear attack
-> enemy attacks HP and board -> next bag" until victory or defeat.
