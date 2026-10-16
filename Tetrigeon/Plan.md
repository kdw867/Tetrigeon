# TETRIGEON — TURN-BASED TETRIS ROGUELIKE
Design notes | 2026-09-14 (code sync: 2026-10-01; crystal-cell design update: 2026-10-02; monster skill design update: 2026-10-06; crystal cells implemented: 2026-10-06; healing balance: 2026-10-06; exit to title: 2026-10-06; reward cards: 2026-10-06; no reward after the boss: 2026-10-07; HP bars: 2026-10-07; skill counter: 2026-10-07; stage panel removed: 2026-10-07; stage board: 2026-10-07; board effects: 2026-10-08; start countdown: 2026-10-08; Caterpillar attack motion: 2026-10-12; Queen attack motion: 2026-10-12; Guardian attack motion: 2026-10-12; Queen growth skill motion: 2026-10-13; Queen rotation lock targets: 2026-10-14; Queen rotation lock skill motion: 2026-10-14; Guardian shield skill motion: 2026-10-16; Lemy attack motion: 2026-10-16)

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
- Player: HP bar with the number `hp / max` in its middle (replaces the `PLAYER hp / max` text,
  HP bars 2026-10-07); while a shield exists a shield icon and `+n` show under the bar
  (no shield bar, confirmed).
- Each enemy: an HP bar with `hp / max` in its middle and, at the lower right of the bar, a
  skill counter (rune + turns until its Garbage skill, see HP bars below), then boss
  `피해 -50%` while escorts live, and status icons for poison and freeze.
- Stage panel (`STAGE n`, `ENEMIES alive / total`, `[TAB] TARGET`): removed from the combat screen on
  request (2026-10-07) and replaced by the stage board below. The TAB key still switches the target.
- Stage board (2026-10-07, confirmed after a mock-up review, implemented): the empty panel to the right of
  the FATE scroll shows, top to bottom: a STAGE nameplate; `current / total` (`06 / 10`, current in cyan,
  total in light gray, total read from StageData.LastStage); progress nodes 1-10 in two rows of five
  (cleared = dark teal, current = bright teal outline, upcoming = dark gray; a small purple crown marks
  stage 10; the link line runs from 5 to 6); an ENEMIES nameplate; then one row per enemy of the current
  stage in lineup order. A row shows the monster's existing art (first Idle frame, centred in a fixed
  display window and scaled to fit it), the tier name (NORMAL cream, EPIC teal, BOSS gold) and an HP bar
  with `hp / max`. A defeated enemy's row is darkened and shows its existing death art and the word
  DEFEATED instead of the bar; a slot refilled by the boss summon shows the new enemy again.
  The row of the currently selected target (the same enemy the TAB key and the target arrow use) has its
  border lit in teal (a bright teal rim plus a short soft glow, no animation). The glow follows TAB, moves
  on when the target dies, and a defeated row never glows.
  The board only reads the existing combat state (stage number, enemy list, HP) and refreshes on the same
  state-change event as the rest of the combat UI; it adds no counter and changes no combat rule.
  Art (shown at 1.75x like the other nameplates) is derived from the existing MINO UPGRADES nameplate
  (text removed, same stone and teal palette); nodes, links and crown are pixel-drawn in that palette; no
  VARCO generation. Files: `@Resources/UI/StageBoard` (Layers, `P_StageBoard`, `P_StageBoardRow`), digit
  colours gray/dim/teal in `@Resources/UI/HpBars/Font`. Rows are drawn in a Canvas (`StageBoardCanvas`).
- Left panel lists upgraded minos with `Lv.n` (`Lv.MAX` at level 5).
- HP bars (2026-10-07, confirmed after a concept-art review, implemented): Lemy and every
  enemy use the same bar size (112x20 source px shown at 1.5x = 168x30 px; Lemy's bar is
  shrunk to the monster bar size on request, so three enemies fit side by side). All bars
  sit BELOW the character's feet and the number is centred inside the bar, drawn from the
  digit sprites 0-9, "/" and "+" (cream; cyan for the shield amount). Enemy text under the bar
  (damage reduction, shield, charge, stun, poison/freeze icons) is unchanged but now sits below
  the bar and its skill counter for every tier (Normal monsters used to stack it above their body).
  The bar hides when the enemy dies. The target arrow stays above the monster as before.
  Art is layered (Frame, Track, Fill; the Fill is shown with a horizontal fill amount):
  `@Resources/UI/HpBars/Layers`, digit font `@Resources/UI/HpBars/Font`, prefabs
  `P_HpBarLemy` and `P_HpBarMonster`. Lemy's bar has the cyan gem cap and rune cap, the
  monster bar a plain stone frame. The boss uses the monster bar (no separate boss bar yet).
- Skill counter (2026-10-07, confirmed after a concept-art review, implemented): replaces the
  `SKILL n` text. It sits at the lower right under the enemy's HP bar: a blue rune and the turns
  left in cream digits (`3`, `2`). When 1 turn is left, i.e. the skill fires on the next enemy
  turn, the rune turns gold and the digits gold with an exclamation mark (`1 !`). The count
  itself is unchanged (normal 3 / epic 5 / boss 6, section 7). Art: `T_SkillRune_Blue` and
  `T_SkillRune_Gold` (9x9 dots shown at 1.5x) in `@Resources/UI/HpBars/Layers`, gold digit font
  `HpDigits_gold` (0-9, "/", "+", "!") in `@Resources/UI/HpBars/Font`. Only the monster bar
  prefab `P_HpBarMonster` has the counter; Lemy's bar does not.
- Board effects (2026-10-08, confirmed after a preview review, implemented): three short pixel effects
  on the board, made in `@Resources/Effects/BoardFX` (LOCK and the crystal burst from sprite sheets, LINE CLEAR as a Particle System; prefabs `P_FX_Lock`,
  `P_FX_ClearParticles`, `P_FX_CrystalBurst`) and played by `BoardEffectPlayer` (under Managers) from a
  visual-only notification `PieceSpawner.OnLockVisual` (locked cells, cleared rows and cleared crystal
  cells, with coordinates from before the rows compact). They change no rule or timing, never pause the
  game, and play on real time so they finish even while the game is paused or a stage is cleared.
  - LOCK (0.133 s): a thin teal rim traces the outline of the mino that just locked (edges shared by
    cells of the same mino are skipped) for every cell that really locked, including cells added by the
    Crystal Queen. Once per real Lock (gravity and hard drop share the same path); not for move, rotate,
    Hold or the ghost. Cells removed by that Lock's line clear show no LOCK; surviving cells show it at
    their position after the rows above have dropped.
  - LINE CLEAR (about 0.1 s, changed 2026-10-08 from a long horizontal light to short particles): tiny
    square sparks (3-5 px, white and teal) fly out of each cleared cell, once per cleared row (several
    rows at once play together), at the row's position before compaction. One cleared row emits 2 sparks
    per cell, two or more rows 1 per cell, 32 at most in total; a row that holds crystal cells gets half
    the sparks and the crystal cells themselves emit none (they have their own burst). Each spark lives
    0.08-0.14 s, travels about 0.5-1.2 cells outward and shrinks in steps. It is one Particle System
    (`P_FX_ClearParticles`, a single instance under `BoardEffectManager`, world space, real time) that
    `BoardEffectPlayer` fires once per clear; the old long light (`P_FX_LineClear` and its sheet) was
    deleted. Not for Garbage, Caterpillar bites, Top Out or board resets.
  - Crystal burst (0.267 s, changed 2026-10-08 from one purple effect to seven): one effect per cleared
    enhanced crystal cell (the same cells that fire the crystal ability), with the look of the source
    mino's ability, within two cells: I needle shards (Pierce), J snowflake and ice (Freeze), L eight-ray
    star (Critical), O expanding ring with gold plates (Shield), S plus sparkles and leaves (Heal), T
    bubble ring and droplets (Poison), Z fire and embers (Explosion). It starts 0.06 s after the sparks
    (a visual delay only; the effect never triggers an ability). The sheet `T_FX_CrystalBurst` has one
    row per source mino in `TetrominoType` order (I J L O S T Z), and `PieceSpawner.OnLockVisual` also
    passes the source types of the cleared crystal cells (the same list the ability code already
    receives, unchanged).
  Effects sit above the blocks and are clipped to the board interior, so they never cover the board frame.
- Not implemented: each enemy's expected HP damage or Garbage amount for its
  next action; only the skill countdown is shown.

### Pause menu and leaving to the title (2026-10-06, confirmed)
- ESC opens the pause window: Resume, Option, Restart, Title (the Option window
  is shared with the title screen). Title is the new button, placed below Restart.
- Title returns to the title scene. The current run is NOT saved and is discarded,
  like Restart; there is no confirmation window. Time scale and the paused state
  are reset on the way out, and START on the title begins a fresh run.
- The result window (defeat and final-stage clear) has Restart and Title,
  stacked under the title plaque, reusing the pause window's stone panel and
  button art. The title reads DEFEAT when the player loses and VICTORY when the
  final stage is cleared (confirmed 2026-10-06; before, both showed DEFEAT).
- Art: the pause-window Title button uses its own plaque art (T_Btn_TITLE, same
  stone plaque style as the other buttons, label baked into the image), approved
  and applied 2026-10-06. The result window uses the same panel and button art
  with its own title plaques (T_Title_DEFEAT, T_Title_VICTORY, same plaque style
  as PAUSE/OPTION), approved and applied 2026-10-06.

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

### Lemy attack motion "Core Release" (2026-10-16, motion specified by the user, applied on the instruction "apply" after two preview rounds; implemented)
- When it plays: on a bag settlement where the targeted enemy takes damage (the bag's accumulated damage is above 0 and
  the target is alive), including a Top Out forced settlement. It does not play when the accumulated damage is 0. Visual
  only: `CombatManager.OnPlayerAttack` is raised right before the damage is applied and nothing else changes; damage, enemy
  order, skill counters and timing are unchanged, nothing waits for it and it never pauses the game (the damage applies the
  moment the bag ends, the motion takes 1.28 s; pause and game over stop it, like Idle).
- Motion (1.28 s, stepped poses): Lemy squashes slightly (the torso is compressed vertically by about 7 % with the feet fixed,
  so the head and arms follow the shoulder line instead of sinking into the body) and opens both arms (0.12-0.26 s); the chest
  core lights up in four stages while eight symmetric light clumps gather into it, the torso breathing in (0.26-0.64 s); at
  0.64 s a cross flash and a short magic bolt are released toward screen right, the torso stretches up, the head tilts 5
  degrees to the right around the neck and the right arm pushes forward, then the torso settles back (0.64-0.84 s); the
  bolt flies about 420 px to the right (the enemies are not reached) and scatters into a small cross (to 1.28 s); the pose
  returns to Idle (blends 0.05 s in and out).
- Art: Lemy's approved art is unchanged. The shoulder glints belong to the body sprite, so the arms were separated from them
  by three derived sprites made in code from the approved ones (`BodyFeet_Open` without the shoulder glints, and the two arm
  sprites with those glints moved onto them at their rest positions; identical to the originals in the rest pose). The
  effects (core light, flash, bolt) are drawn in code in the lit chest core's colours (6 colours) on a 3-screen-pixel dot grid,
  the same as Lemy's art. VARCO was not used (not connected in this session; the art was reused and the effects need
  transparency, which VARCO cannot output). The chest core `Art` sprite is not touched: the glow is a separate layer above
  it, so a later Hold-occupancy ON/OFF switch of the core does not conflict.
- Implementation: new script `Visuals/LemyAttackView` on the `P_GolemIdle` root (subscribes to `CombatManager.OnPlayerAttack`
  and fires the `Attack` trigger); the controller `GolemIdle` gained the trigger `Attack` and the state `Attack` (Idle -> Attack
  on the trigger, back to Idle when it ends, 0.05 s blends); the clip `Lemy_CoreRelease` animates `BodyFeet` (sprite, position
  y, scale y), `Head` (position, z rotation), both arms (sprite, position) and two new children of the prefab `P_GolemIdle`,
  `CoreFx` and `Bolt` (SpriteRenderer, sorting order 5, empty by default). Every animated position carries x, y and z keys
  because a partly animated position resets the missing components to 0 (found in the play check). The arms' sorting order is 1
  so the arm sprites with the glints are drawn over the body (nothing overlaps in the rest pose, so Idle looks the same).
  Assets in `@Resources/GolemAttack`: `T_Lemy_AttackParts` (324x191, 3 sprites, PPU 100) and `T_Lemy_AttackFx` (125x38, 9 sprites
  of 25x19 dots, PPU 10.8 = 3 screen pixels per dot under Lemy's 0.3 scale), both with the same import settings as `T_GolemParts`,
  and the clip. The older unused clip `GolemIdle/Lemy_Attack.anim` is left untouched.
- Checked in play mode through the real settlement path: a bag with 0 damage raises no event, a bag with 3 damage raises it once
  (the target loses exactly 3), the animator goes Idle -> Attack (1.28 s) -> Idle, and the 17 frames match the approved preview
  (0 differing pixels in the rest, bolt and fade frames, at most 28 pixels with a colour difference up to 59 in the glint frames).
- Limits: the bolt is short and disappears before the enemies; the damage numbers change immediately while the motion plays for
  1.28 s; Lemy's Idle blink and bobbing pause during the motion; not hand-played.

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

### Monster skill update (2026-10-06, confirmed and implemented)
KEEP Garbage alongside the new monster skills; new skills do not replace it.
Each new skill fires together with that monster's Garbage on the SAME skill
turn, using the existing skill counter (normal 3 / epic 5 / boss 6); there is no
separate schedule or counter. Garbage amounts, the hole rule, and no HP attack
on skill turns are unchanged. A freeze or stun blocks the whole action (Garbage
and new skill alike) and leaves the skill counter unchanged. Existing boss
summon and escort rules remain in place.
Implemented within-turn order: each living enemy left to right as before
(poison -> skip if dead -> freeze/stun -> skill or attack), then boss summon ->
Caterpillar gnaw -> all Garbage at once -> Queen skill -> HP damage.

| Monster | Skill | Outcome |
| --- | --- | --- |
| Crystal Caterpillar / Larva (normal) | Gnaw locked blocks | Eats locked mino blocks on the board |
| Amethyst Guardian / Sentinel (epic) | Shield and charged attack | Breaking the shield in time cancels the strong attack and stuns the Guardian; otherwise the strong attack hits |
| Crystal Queen (boss) | Crystal growth / rotation lock, alternating | Growth adds a cell to every mino in NEXT; rotation lock seals the two NEXT minos that come after the one appearing right away |

#### Crystal Caterpillar: gnaw locked blocks (implemented 2026-10-06)
- Each Caterpillar using its skill immediately removes 1 locked block, chosen
  uniformly among player-placed mino blocks. Garbage blocks are never eaten.
- Several Caterpillars on the same turn pick different blocks. With too few
  eligible blocks the extra bites do nothing; Garbage still arrives.
- Blocks above the eaten cell do not fall; the hole stays.
- Gnawing happens before that turn's Garbage pushes the board up.
- Queen growth cells are ordinary locked mino blocks and can be eaten.
- A Caterpillar revived by the boss summon starts a fresh skill counter and
  gnaws on its own skill turns like any other Caterpillar.
- The falling and NEXT minos are never eaten. Crystal cells are ordinary locked
  mino blocks and can be eaten (confirmed 2026-10-06); an eaten crystal triggers
  nothing, because it is not a line clear.
- Attack motion (2026-10-12, confirmed after a preview review, implemented): a 10-frame, 0.625 s
  (16 FPS) motion plays on the Crystal Caterpillar (normal tier, boss-summoned ones too) every time it
  really acts on an enemy turn: both its basic HP attack and its skill (gnaw + Garbage), with the same motion for both (confirmed 2026-10-12: the Guardian and the Queen get separate basic-attack and skill motions instead). It does not
  play when the action is blocked (frozen or stunned) or when the Caterpillar is dead. It is visual only:
  damage, enemy order, skill counters and timing are unchanged, nothing waits for it and it never pauses
  the game (the HP damage and the gnaw still apply the moment the enemy turn runs; the strike frame comes
  about 0.31 s after that, and syncing the two is not done yet).
  - Motion: the head and both bodies pull back and bunch together (the head sinks 1 px), thrust fast toward
    screen left (toward Lemy) head first with the bodies following in a chain, hit the strike pose (frame 06:
    head 5 px, middle body 3 px and rear body 1 px forward, segments at most 2 px apart), recoil and return.
    The last frame equals the Idle rest pose, so it returns to Idle without a jump. Nothing is redrawn: the
    approved Idle art is cut into head / first body / second body (each with its own legs, base and
    crystals) and moved by whole pixels only. The object itself does not move.
  - Implementation: `Enemy.Acted(EnemyActionKind)` (raised by `Enemy.NotifyAction(skillTurn)`, which classifies the action as
    BasicAttack / Skill / Charging / StrongAttack; called once per acting enemy in `CombatManager.EnemyTurn` right after the
    freeze/stun check and the skill-counter check) -> `EnemyView` fires the `Attack` trigger of
    the normal Idle animator; the controller `CrystalLarva_Idle` gained the state `Attack` (Idle -> Attack on
    the trigger, Attack -> Idle when it ends). `EnemyView.PlayAttack` decides per tier whether to play (see the Queen section). Assets in
    `@Resources/Enemies/CrystalLarvaAttack`: `T_CrystalLarva_Attack` (320x128, 64x64 cells, PPU 75.6, pivot
    (0.5, 0.1875), same import settings as the Idle sheet) and the clip `CrystalLarva_Attack`.
  - Art: the art faces screen left and is not flipped. VARCO was tried (4 images = 80 credits) but could not
    keep the design (mirrored, enlarged head, an invented block), so none of it was used.
  - Limits: the time scale stops it (pause, game over), like Idle. The Caterpillar plays it for every kind of action.

#### Amethyst Guardian / Sentinel: shield and charged attack (implemented 2026-10-06)
- Skill turn: Garbage + shield 5 + charge 2 (Guardian actions until the strong
  attack). Healing by absorbing blocks is discarded.
- Every damage source hits the shield first (bag damage, pierce, explosion,
  poison, freeze break); overflow goes to HP.
- While charging, each Guardian action only counts down (no basic attack). At 0
  it deals a strong attack of 9 (the player shield absorbs first) and any leftover
  shield is removed. The player gets two bag settlements to break the shield;
  breaking it at the second settlement still cancels the attack.
- Breaking the shield cancels the strong attack and stuns the Guardian for 1
  action. If poison breaks it at the start of the deadline turn, the attack is
  cancelled and that same action is the stunned one.
- Frozen or stunned actions advance neither the charge nor the skill counter.
  Overlapping freeze and stun each lose one per blocked action (no stacking).
- The skill counter keeps advancing during the charge (charge 2 < interval 5).
- UI under the HP text: `보호막 n`, `강공격 n` (actions left), and `스턴`, shown
  from the stun until the Guardian's next action, like the freeze snowflake.

- Attack motion (2026-10-12, applied provisionally on the instruction "apply the strong attack and the basic attack
  with the current one for now"): a 1.25 s motion plays on the Amethyst Guardian / Sentinel for its basic HP attack
  (it also played for the strong attack until 2026-10-16, when the strong attack became the shield explosion below).
  It does not play on its skill turn (shield + charge start), on the charging actions that only count the deadline
  down, on the strong attack, when the action is blocked by freeze or stun, or when it is dead; those are covered by
  the shield skill motion below. Visual only: damage, enemy order,
  skill counters and timing are unchanged, nothing waits for it and it never pauses the game (the damage applies
  the moment the enemy turn runs; the strike frame comes 0.83 s after that, and syncing the two is not done).
  - Motion (the last version shown to the user, t2): the crystal arm is pulled back behind the body to the upper
    right, a cyan/purple energy charge builds at the arm tip (0.28-0.71 s, three growing stages), the arm sweeps
    down in front of the body and thrusts toward screen left (toward Lemy) at 0.83 s with a burst effect at the
    fist, then recoils and returns to the Idle rest pose. The art is the approved Guardian art redrawn with VARCO
    (EditImage) and post-processed to the original palette; the effects are drawn in code (cyan and purple only).
  - Implementation: `Enemy.NotifyAction(skillTurn)` classifies each acting enemy as `EnemyActionKind` (`BasicAttack`,
    `Skill`, `Charging`, `StrongAttack`; new file `Data/EnemyActionKind.cs`) and raises `Enemy.Acted(kind)`;
    `EnemyView.PlayAttack` fires the `Attack` trigger of the Epic Idle animator for `BasicAttack` only (`StrongAttack` is the shield explosion since 2026-10-16).
    The controller `AmethystSentinel_Idle` gained the trigger and the state `Attack` (Idle -> Attack on the trigger,
    Attack -> Idle when it ends). The prefab `P_Enemy` got two children under `EpicIdle`: `EpicChargeFx` and
    `EpicBurstFx` (SpriteRenderer, sorting order 6, empty by default); the clip `AmethystSentinel_Attack` animates the
    body and both effect sprites. Assets in `@Resources/Enemies/AmethystSentinelAttack`: `T_AmethystSentinel_Attack`
    (720x312, 13 cells of 144x104, pivot (0.5, 10/104), the same foot point as the Idle sheet),
    `T_AmethystSentinel_AttackChargeFx` (336x168, 18 cells of 56x56), `T_AmethystSentinel_AttackBurstFx` (576x72,
    8 cells of 72x72), all PPU 75.6, Point filter, uncompressed (same as the Idle sheet), and the clip.
  - Limits: the pulled-back arm and its charge effect can overlap the neighbouring slot on the right (stage 10: the
    Queen's slot), the time scale stops it (pause, game over), like Idle.
- Shield skill motion (2026-10-16, applied on the instruction "apply the motion and the effects" after the key-pose,
  shield-density and branch GIF previews; implemented): the Amethyst Guardian / Sentinel crouches and builds a
  translucent purple crystal dome when it uses its skill, the dome gets denser with every real piece lock, and then it
  either explodes (the deadline ran out) or melts away (the shield was broken in time) and the Guardian is stunned.
  Visual only: the shield value (5), the charge deadline (2 Guardian actions), the stun (1 action), the damage, the
  enemy order, the skill counters and the timing are unchanged; nothing waits for the motion and it never pauses the
  game. The real damage of the strong attack is still applied exactly once by the existing enemy turn (9, the player
  shield absorbs first); no animation event deals damage. Lemy has no hit reaction in the game yet, so nothing is
  linked to the explosion; its peak (the flash frame, 0.24 s after the explosion starts) is recorded as the proposed
  hit time for when Lemy gets one.
  - Flow: skill turn (`EnemyActionKind.Skill`) -> 0.6 s crouch + shield growing from the base line (a rune line, then the
    dome grows, a short flash, then it settles at the 0% look) -> the Guardian stays crouched and the dome stays at its
    fixed size and position while only the opacity changes -> charge deadline reached (`StrongAttack`): a 1.0 s
    explosion (opaque dome, two short expansion steps with cracks, a flash at 0.24 s, then 34 crystal fragments and 34
    light particles burst outward and shrink; no body explosion and no extra attack motion) and the Guardian stands
    back up to the Idle pose; or the shield breaks in time: a 1.03 s hit flash, cracks, chips and melt (the dome sinks
    from the top with angular pixel drops falling down and a puddle on the ground that evaporates; the Guardian
    slumps into a limp crouch halfway through) -> the limp crouch is held while `Enemy.IsStunned` with three yellow
    stars (5x5-dot front star, 3x3-dot back star, short tails) orbiting above the head in a 0.84 s loop -> when the
    stun ends the stars disappear and the Guardian stands up in 0.34 s. If the stun ends on the same enemy turn as an
    action, the queued `Attack` motion (basic attack) plays right after standing up.
  - Density (charge progress, 0-1): `((ChargeActionsTotal - ChargeActionsLeft) * piecesPerBag + piecesPlaced) /
    (ChargeActionsTotal * piecesPerBag)`, read from the state, not counted by events; the shield value does not
    change it. The Guardian allows 14 real locks from the shield creation to the explosion (2 bags of 7; the lock that
    caused the creation is not counted; hold, move, rotate and hard-drop inputs are not counted), so one lock adds
    exactly 1/14 and 25/50/75/100% are the 3.5th/7th/10.5th/14th lock. Opacity: dome fill 0.20 + 0.80 p, rim 0.60 +
    0.40 p. Freeze or stun block the Guardian actions without advancing the deadline, so the display falls back to the
    start of the current bag (it matches the real deadline); a Top Out settles an unfinished bag and the display jumps up.
    No combat rule was changed for this.
  - Cleared when: the Guardian dies (the Epic body object is turned off by `EnemyView`, which also resets the view
    state), the stage changes (the enemy objects are destroyed), or a new shield starts (the density is recomputed).
  - Implementation: new script `Visuals/GuardianShieldView` on the `EpicIdle` object; it subscribes to
    `Enemy.Acted` (`Skill` -> `ShieldCast`, `StrongAttack` -> `ShieldExplode`) and to `CombatManager.OnStateChanged`
    (density, shield broken -> `ShieldBreak`, stun ended -> `ShieldRecover`) and only reads enemy state. Two tiny
    read-only properties were added: `Enemy.ChargeActionsTotal` and `CombatManager.PiecesPerBag`. `EnemyView.PlayAttack`
    no longer plays the attack motion for the Guardian's `StrongAttack`. The controller `AmethystSentinel_Idle` gained
    the triggers `ShieldCast`, `ShieldExplode`, `ShieldBreak`, `ShieldRecover` and the states `ShieldCast` (Idle ->),
    `ShieldHold` (after the cast; loops the crouch), `ShieldExplode` (-> Idle), `ShieldBreak` (-> `StunHold`),
    `StunHold` (loops; -> `ShieldRecover`), `ShieldRecover` (-> Idle); a cast that is interrupted by a break or an
    explosion can leave `ShieldCast` at once. The prefab `P_Enemy` got four SpriteRenderer children under `EpicIdle`
    (local position 0, sorting orders: `EpicShieldFill` 6, `EpicShieldRim` 7, `EpicShieldFx` 8, `EpicStunStars` 9; the body
    is 5) and the script with the fill and rim references. The six clips animate the body and the four children;
    the density only changes the colour alpha of the fill and rim children.
  - Assets in `@Resources/Enemies/AmethystSentinelShield`: `T_AmethystSentinel_Shield` (576x104, 4 cells of 144x104: stand,
    mid, hold, stun; pivot (0.5, 10/104), the same foot point as the Attack sheet), `T_AmethystSentinel_ShieldFx` (1664x816,
    46 cells of 208x136, pivot (0.5, 10/136) so the foot points line up: fill and rim layers, 7 create, 10 explode, 3
    break, 12 melt, 12 star frames), both PPU 75.6, Point filter, uncompressed (identical import settings to the Attack
    sheet), and the clips `AmethystSentinel_ShieldCast` (0.59 s), `_ShieldHold` (loop), `_ShieldExplode` (1.0 s), `_ShieldBreak`
    (1.02 s), `_StunHold` (0.84 s loop), `_ShieldRecover` (0.34 s).
  - Art: the crouch, mid-crouch and limp poses are the approved Guardian art with its parts moved by whole dots (feet
    and design unchanged: the same 22 colours, crystal layout and core) and the joint seams cleaned with VARCO
    (EditImage, 3 of 13 generated images were used); the dome, explosion, break, melt and stars are drawn in code on the
    same 2x2-pixel dot grid (VARCO has no transparent output). Everything stays inside x 1450-1697 and y 103-262 of the
    stage 10 layout: it never covers the Caterpillar, the Queen, the target arrow or the HP bar (checked by numbers).
  - Limits: translucent dome colours are blended at runtime, so only the opaque art keeps the exact palette; the
    time scale stops it (pause, game over), like Idle; no hand-played check; the preview GIFs and the Unity render
    sheets are in `SentinelShield_VARCO/output/Frames_v1` (outside Assets).
#### Crystal Queen: growth / rotation-lock alternation (implemented 2026-10-06)
- Alternates on each skill turn: growth -> rotation lock -> growth ... The first
  skill of every stage is growth (stage entry creates new enemies). A frozen or
  stunned skill turn neither fires nor advances the alternation.
- Growth: every mino visible in NEXT at that instant (5) gets exactly one extra
  cell at a random empty position edge-adjacent to its cells, limited to the
  local 4x3 spawn box so the piece always fits the spawn area. Later queue
  entries are unaffected. The extra cell rotates with the piece, locks as an
  ordinary block, and uses the art `MinoSprites/T_Mino_Grown` for every mino type
  and upgrade level.
- Rotation lock (targets changed 2026-10-14, implemented): the skill fires right after a mino locks and before the next
  mino is taken from the queue, so the front mino of NEXT at that instant is the one that appears right after the
  skill. That mino stays normal; the next two NEXT minos get the lock; every later mino is normal. Example: if the
  coming order is T -> I -> S -> O, then T is normal, I is locked, S is locked, O is normal. A mino that is already
  being controlled is never given a new lock, and the Hold content is never a target.
  - The lock belongs to the individual mino (its `MinoState`), not to a mino type or a NEXT slot. It follows that mino
    when the queue moves (also across the bag boundary) and when it goes into Hold and comes back out, and it never
    moves to another mino, even one of the same type. A mino that is already locked keeps its lock, and no third mino
    is added. The extra cell from growth and the upgrade crystals are untouched, so one mino can carry both a grown
    cell and the lock. There is no separate counter: the existing per-mino flag is reused
    (`BagManager.LockNextRotation`).
  - A locked mino cannot rotate (clockwise, counterclockwise or 180 degrees). A blocked rotation changes nothing:
    orientation, position, wall kick, the T-Spin rotation record, lock delay and the DAS cut stay as they were.
    Moving, soft drop, and hard drop still work. The lock role ends when the mino locks. A rotation seal is centered over the mino in NEXT, Hold and the active piece
    (visual updated 2026-10-14: it is the Queen's rotation lock rune, two clockwise arrowhead arcs around a padlock in
    blue violet and white with a dark outline and no backing plate, 27x27 dots = 54 px on screen). Original block colors
    remain unchanged; the ghost has no seal. The seal is always fully opaque, neither rotates nor pulses, follows the
    mino, and disappears on lock or when its view is removed.
    A shared prefab `UI/RotationLock/P_RotationLockSeal` supplies the sprite; no gameplay counters are added.
  - Verified 2026-10-14 in play mode (stage 10) through the real lock -> bag settlement -> Queen skill -> next spawn
    path, the real Top Out coroutine, and direct calls for Hold swaps, rotation input handlers and bag boundaries.
    Real key presses (Z / X / Up / A) could not be injected into the editor and are not verified.
- Hold keeps the growth and the rotation lock of the mino placed in it. Swapping with a normal mino never moves a lock
  onto it. Hold charges and the other Hold rules are unchanged. Top Out's bag reset discards the NEXT minos together
  with their locks like any other remaining bag piece, and the Hold is cleared as before, so no lock carries over. A
  new stage or a new game starts with no locks. T-Spin detection is unchanged.
- Repeat growth, or both debuffs on one piece, cannot occur in practice: NEXT is
  consumed within one turn and the Queen's skills are 6 turns apart.

- Attack motion (2026-10-12, confirmed after preview reviews, implemented): a 0.94 s motion plays on the
  Crystal Queen only when she makes her basic HP attack on an enemy turn. It does not play on her skill turns
  (growth / rotation lock), when the action is blocked by freeze or stun, or when she is dead. Her growth skill
  and her rotation-lock skill have their own motions (next bullets). It is visual only: damage, enemy
  order, skill counters and timing are unchanged, nothing waits for it and it never pauses the game (the HP
  damage applies the moment the enemy turn runs; the first crystal flash comes 0.72 s after that, which is the
  proposed representative hit time, and syncing the two is not done yet).
  - Sequence (17 steps in 10 ms multiples, total 0.94 s): both hands rise and come together in front of the solar
    plexus with a 2 px gap between them while the whole body leans back 5 degrees; a small magic spark appears
    between the hands and grows while three small purple crystals form behind her back; the arms thrust forward
    (toward screen left, toward Lemy) while the body leans forward 15 degrees and a starburst appears in front of
    the hands; the three crystals fire one after another and fly to a point about 10 px beyond the Queen's front
    at their height (the large wings never detach), each vanishing in a short flash (about 0.1 s); the arms lower
    and the body returns upright. The motion ends at the Idle rest pose.
  - Art: the arms are the approved crystal arm guards (forearm covered by crystal, stone hands). Everything is drawn
    on the same grid as the Idle art (2x2 sprite pixels = 1 dot, the game's density). The body lean is a smooth
    bend with the feet fixed (a row shift was rejected because it left horizontal seams); the face details (eye,
    brow, small highlights) and the chest core are kept pixel-exact. VARCO was used earlier in this work only to
    clean up the arms-less base; the final frames are hand-built from the approved Idle art.
  - Implementation: `Enemy.Acted(EnemyActionKind)` -> `EnemyView.PlayAttack` fires the `Attack` trigger of the Boss
    Idle animator only for `BasicAttack`; the controller `CrystalQueen_Idle` gained the trigger parameter
    `Attack` and the state `Attack` (Idle -> Attack on the trigger, Attack -> Idle when it ends). The prefab
    `P_Enemy` got a child `BossAttackFx` (SpriteRenderer, sorting order 6, empty by default) under `BossIdle`; the
    clip `CrystalQueen_Attack` animates the body sprite and the `BossAttackFx` sprite (magic, crystals and flashes,
    one layer in front of the body). Assets in `@Resources/Enemies/CrystalQueenAttack`: `T_CrystalQueen_Attack`
    (640x320, 8 cells of 160x160), `T_CrystalQueen_AttackFx` (800x480, 13 cells used), both PPU 75.6, pivot
    (0.5, 0.45), Point filter, uncompressed (same as the Idle sheet), and the clip.
  - Limits: the starburst in front of the hands can overlap the neighbouring slot's monster, the crystals form
    just inside the right screen edge of the boss slot, and the time scale stops it (pause, game over), like Idle.
- Growth skill motion (2026-10-13, confirmed after preview reviews, implemented): a 0.94 s motion plays on the
  Crystal Queen only on the turns where she uses her crystal growth skill (the skill that adds one cell to every mino
  in NEXT). It does not play on her rotation-lock turns (that skill has its own motion, below), on her basic attack
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
  - Implementation: `EnemyActionKind` gained `QueenGrowth` and `QueenRotationLock`; `Enemy.NotifyAction` reports one of
    them instead of `Skill` for the Queen's skill turns (the growth / rotation-lock alternation is decided right after
    the notification, so the notification reads the alternation state before it flips); `EnemyView.PlayAttack` fires the
    new `Skill` trigger of the Boss Idle animator for `QueenGrowth` only. The controller `CrystalQueen_Idle` gained the
    trigger `Skill` and the state `Skill` (Idle -> Skill on the trigger, Skill -> Idle when it ends, same settings as
    `Attack`). The clip `CrystalQueen_Skill` animates the same body sprites as `CrystalQueen_Attack` and the same child
    `BossAttackFx` (sprites from the new sheet), so the prefab `P_Enemy` is unchanged. Assets in
    `@Resources/Enemies/CrystalQueenSkill`: `T_CrystalQueen_SkillFx` (800x480, 11 cells used of 160x160, PPU 75.6,
    pivot (0.5, 0.45), Point filter, uncompressed, same import settings as `T_CrystalQueen_AttackFx`) and the clip.
  - Limits: the hand magic at full reach can overlap the neighbouring slot's monster (same as the basic attack), the
    crown overlaps the top of the Queen's crystals, the time scale stops the motion (pause, game over) like Idle, and the
    target arrow above the Queen (drawn on top of everything) covers the lower centre of the crown while she is the
    target (seen in play mode, not changed). Not yet played by hand in a full run.
- Rotation lock skill motion (2026-10-14, confirmed after preview reviews, implemented): a 0.94 s motion plays on the
  Crystal Queen only on the turns where she uses her rotation lock skill (the skill that seals the two NEXT minos after
  the one that appears right away). It does not play on her growth turns (those keep the growth motion), on her basic
  attack turns (those keep the basic attack motion), when the action is blocked by freeze or stun, or when she is dead.
  It is visual only: the lock itself (`BagManager.LockNextRotation`), damage, enemy order, skill counters and timing are
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
  - Implementation: `EnemyView.PlayAttack` fires the new `RotLock` trigger of the Boss Idle animator for
    `EnemyActionKind.QueenRotationLock` only (the action kinds and the notification from `Enemy.NotifyAction` came with
    the growth motion). The controller `CrystalQueen_Idle` gained the trigger `RotLock` and the state `RotLock` (Idle ->
    RotLock on the trigger, RotLock -> Idle when it ends, same settings as `Skill`). The clip `CrystalQueen_RotLock`
    animates the same body sprites as `CrystalQueen_Attack` and the same child `BossAttackFx` (sprites from the new
    sheet), so the prefab `P_Enemy` is unchanged. Assets in `@Resources/Enemies/CrystalQueenRotLock`:
    `T_CrystalQueen_RotLockFx` (800x480, 11 cells used of 160x160, PPU 75.6, pivot (0.5, 0.45), Point filter,
    uncompressed, same import settings as `T_CrystalQueen_SkillFx`) and the clip.
  - Limits: the hand magic at full reach can overlap the neighbouring slot's monster (same as the other motions), the
    rune overlaps the top of the Queen's crystals, the time scale stops the motion (pause, game over) like Idle, and the
    target arrow above the Queen (drawn on top of everything) may cover the lower part of the rune while she is the
    target (not checked in play mode). The NEXT-side marking of the locked minos (halo and padlock icon) was only a
    preview proposal and is not implemented. Verified 2026-10-14 in play mode (stage 10, direct enemy-turn calls, 36
    turns): basic attacks fire `Attack`, growth turns `Skill`, rotation lock turns `RotLock`, the other enemies are
    unchanged; the animator stepped every 0.01 s matches the timetable (77 samples, 0 mismatches) and returns to Idle with
    an empty effect layer. Not yet played by hand in a full run.
Verified 2026-10-06 in play mode through direct enemy-turn and bag-settlement
calls. A full hand-played run through stage 10 is still pending.

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
- HP recovery: restore 10 player HP, applied automatically with no choice.
  Lowered from 20 on 2026-10-06 (confirmed): the player was too hard to defeat.
- Mino upgrade: three upgrades are drawn at random from the per-mino concept
  list, and the player picks one of those three.

Implemented details (2026-10-01):
- Player max HP is 100. Recovery is capped at max HP.
- Reward cards (2026-10-06, confirmed after a concept-art review, implemented): the
  three candidates are shown as cards, not plain buttons. Picking a card (click
  anywhere on it; the SELECT slab is only its label) starts the next stage. The screen
  is a full-screen dark overlay with "STAGE n CLEAR   HP +15" (the automatic
  heal stays visible), the gold title "CHOOSE AN UPGRADE" and the line "Choose 1 mino
  to strengthen." A footer reads "Base single-line clear • No bonus or crystal
  triggers." A card shows, top to bottom: the name `<letter> · <ability>` (PIERCE,
  FREEZE, CRITICAL, SHIELD, HEAL, POISON, EXPLOSION), `Lv.n → Lv.n+1`, the mino
  drawn in its upgraded art (existing crystal cells included), and a "1 LINE CLEAR"
  box with the effect AFTER the upgrade. Hover shows a cyan glow around the card.
  - Values are the real effect of clearing ONE line (damage 1) at the new level, from
    the same formula as the in-game ability (CombatManager.AbilityValue), rounded the
    same way, so some steps look flat (confirmed): Poison per hit 1,1,2,3,4; Pierce
    1,2,2,2,3; Freeze release 0,1,2,2,2; Critical total 2..6; Shield 2,4,6,8,10; Heal 1,2,3,4,5.
  - Row 1 is the base damage (Critical shows its total instead). Row 2 is the ability:
    PIERCE `n DMG` + "ALL ENEMIES", FREEZE `1T` + "RELEASE: n DMG", CRITICAL + "ALWAYS ×n",
    SHIELD `+n` + "LASTS 2 TURNS.", HEAL `+n HP`, POISON `2T × n DMG` + "Starts 1 turn later."
    (a new stack skips the enemy turn right after it, see Status timing), EXPLOSION
    `n DMG` + "NEAREST ENEMY".
  - From Lv.2 on, a line "CRYSTAL +1 (TOTAL n)" is shown under the mino. The new
    crystal cell's POSITION is not shown; it is still chosen when the card is picked
    (rule unchanged, confirmed 2026-10-06).
  - Art (2026-10-06, applied after preview approval): the screen uses a 5x pixel scale
    for card art, 4x/3x/2x for text and 3x for icons and mino previews. Card frame
    and title lettering were generated with VARCO (nano-banana-2, 120 cr in total, the
    generated SELECT sheet was not used); the SELECT slab, the effect box, ornaments
    and the bitmap font (`PixelText`, 3 colours) are hand-drawn pixels. The art is
    split into layers under `@Resources/UI/RewardScreen/Layers`: Frame, Interior,
    LevelOrnament, EffectBox, Glow, Select slab and label, title text and ornament.
    Card prefab: `@Resources/UI/RewardScreen/P_RewardCard.prefab`.
- Kept across stages: player HP and mino upgrade levels. Reset at stage start:
  enemies, board, bag, Hold slot, Hold charges (refilled to 4), and shield.
- Start countdown (2026-10-08, confirmed after a composite preview review, implemented): a
  3 -> 2 -> 1 countdown runs right before play begins, at the start of a run (scene load: START on
  the title, Restart from the pause menu or the result window) and at the start of every later stage
  after the reward pick (the boss stage too). One numeral at a time is shown in the middle of the
  board interior at a fixed position. Each numeral stays sharp for 0.15 s, then grows from 1.0x to 1.4x
  while fading from opaque to transparent over the remaining 0.55 s (0.7 s per numeral, 2.1 s in
  total); the next numeral appears only after the previous one has fully faded. When the "1" has fully
  faded the countdown hides and play starts exactly once: the first mino spawns and falls and locks
  with its normal timers.
  - While it runs no mino exists, so move, rotate, Hold, hard drop, falling and Lock cannot happen,
    no turn or enemy action can start, and no key press is stored for later. This does not rely on the
    time scale. Pause (ESC) works: the countdown stops while paused and continues after Resume, and
    Resume does not spawn the mino early. Restart, Title or any scene change cancels it, and a
    cancelled countdown never starts play. Target switching (TAB) is not blocked.
  - Implementation: `CountdownManager` (under Managers) drives `CountdownView` on the prefab
    `@Resources/UI/Countdown/P_Countdown`, placed under `UI/CountdownCanvas` (sorting order 50: above
    the board, HP bars and stage board, below the restart, reward and pause windows). It holds the
    first mino through `PieceSpawner.SetCountdownActive`, starts when the scene starts and on the new
    event `CombatManager.OnStageStarted` (fired after the stage is ready, before the first mino), and
    ignores a start request while one is running. The values (0.7 s, 0.15 s, 1.4x) are serialized on the
    manager. Combat numbers, the bag, upgrades and rewards are unchanged.
  - Art: three transparent 80x81 px numerals (`T_Countdown_3/2/1`, one dot = 1 px), shown at 2 px per
    dot (160x162 px, numeral 102 px tall; 143 px at 1.4x), centred at FHD (960, 693). Teal carved-stone
    numerals with a dark outline, made with VARCO (nano-banana-2, 4 sheets = 80 credits, one used);
    yellow was tried first and teal was chosen. Palette #0e3a47 #1d6f82 #2a8ea0 #3ec0d6 #8cecf4.
- Stage 10 (the boss stage) shows NO reward screen: no heal and no mino upgrade.
  Clearing it ends the run as a victory at once (changed 2026-10-07, confirmed: the
  upgrade could still be taken after the boss). It previously showed the reward
  screen and ended the run after the pick.
  The run end (victory or defeat) shows the same restart window; restart reloads
  the scene and resets the run, including upgrades.

Mino upgrade trigger rules (updated 2026-10-02, confirmed design):
The existing locked-piece trigger remains unchanged. Crystal-cell triggers are
an ADDITION, not a replacement. Crystal cells are implemented (2026-10-06, see Crystal cells below).
1. Locking an upgraded mino (Lv.1+) and clearing lines triggers its existing
   ability once. Clearing several lines with that Lock still counts once;
   a Lock with no line clear does not trigger it.
2. Ordinary upgraded blocks merely present in a cleared row do not trigger an
   ability. Starting at Lv.2, designated crystal cells are the exception below.
3. The existing locked-piece ability continues to scale with the damage of that
   clear and the upgrade level, using the existing table and bag-end settlement.

### Crystal cells (2026-10-02, confirmed; implemented 2026-10-06)
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

Crystal activation numbers (confirmed 2026-10-06, implemented):
- Inputs: D is the damage of the clear that removed the crystal (the same
  CombatDamage value, T-Spin and Perfect Clear bonuses included). The level is
  the CURRENT level of the mino the crystal belongs to (its source mino).
- Only the ability effect is added. The clear's ordinary target damage is
  counted once, as before; a crystal never adds a second base damage.
- Values use the table below with those inputs. Differences: L adds only the
  extra Critical damage D x M (the base part is not repeated); J freezes for
  exactly 1 enemy action no matter how many lines were cleared, its release
  damage is round(D x 0.5 x M), and a boss still needs D >= 2 to be frozen.
- S crystals (2026-10-13): restore exactly 1 HP per cleared S crystal, independent of lines, level, T-Spin and Perfect Clear bonuses. Multiple cells add together at bag end; max HP cap is unchanged. Direct upgraded S clears still use round(D x M).
- Implementation (2026-10-06): the crystal cells of each mino type are chosen
  in MinoUpgrades.Upgrade and stored per type by cell index. A block knows
  whether it is a crystal from its own mino type and cell index
  (MinoArtBinding), so it follows the block through row shifts. Level-ups only
  happen on the reward screen, after which the board is cleared, so a locked
  block never changes between crystal and ordinary. The 28 crystal sprites live
  in `MinoSprites/Crystal` (same import settings as Upgraded). Queen growth
  cells are never crystal.

Verified 2026-10-06 (play mode, direct Lock and bag-end calls): all seven types;
no crystals at Lv.0/1; one/two/three/four crystals at Lv.2/3/4/5; earlier
crystals kept on level-up; equal random selection among the remaining cells
(4000 trials); the same crystal cells for every piece of that type, through
rotation and Hold; crystal blocks following row shifts and firing once; I, J,
L, O, S, T, Z crystals each firing with the formulas above; activation by
another mino; own crystal plus the existing activation = two; several crystals
in one row counted separately; the Plan example (upgraded L + old T crystal + J
crystal); a two-line clear with a J crystal freezing 1 action; no activation from
Garbage push-out, Caterpillar bites, Top Out row removal, or board clears; the
J freeze settling at bag end (target skips its attack, skill counter unchanged).
Not verified: hand-played runs and a build.

Upgrade levels (implemented 2026-10-01): picking the same mino again raises its
level. Ability strength scales with level as in the table below ("bonus x M");
durations do not scale with level. The maximum is Lv.5, shown as `Lv.MAX`.
Abilities use the full damage of the clear, including T-Spin and Perfect Clear
bonuses; there is no other interaction with those bonuses.
Per-mino abilities (2026-09-22, confirmed and implemented):
"Damage" below always means the damage this project already computes for that
one clear (CombatDamage.Calculate); ability strength is never recomputed from
the line count. Multiplied values are rounded to the nearest integer.

Level scaling (2026-10-07): M = 1 + 0.5 x (Lv - 1), giving 1 / 1.5 / 2 / 2.5 / 3. Apply M to the unrounded Lv.1 ability amount, then RoundToInt. Normal damage is unchanged; L scales only its bonus. Crystal count and durations are unchanged. S healing is round(D x M).

| Mino | Ability | Effect | Value at Lv.n (implemented, D = Damage) |
| --- | --- | --- | --- |
| I | Pierce | Damage to every living monster instead of the target only | round(D x M) each; Lv.1 = D |
| J | Freeze | Clear 1/2/3 lines to block 1/2/3 enemy actions; existing break damage on release | break round(D x 0.5 x M) per clear, summed; actions = lines, longest in the bag |
| O | Shield | Damage x2 as player shield, stacking, granted at bag end, lasts 2 turns | round(D x 2 x M) |
| T | Poison | Damage x0.7 per hit for 2 hits, stacking, each instance tracked separately (timing below) | round(D x 0.7 x M) per hit |
| S | Heal | Damage x1 to the player, capped at max HP, no overheal | D x M |
| Z | Explosion | Damage x0.7 to the nearest other living monster; nothing if alone | round(D x 0.7 x M) |
| L | Critical | Damage x2 to the target, always, no random roll | D + round(D x M); Lv.1 = x2, Lv.2 = x2.5 |

Rounding uses Unity's RoundToInt, so .5 goes to the nearest even number.
Implemented details: Explosion picks the nearest living monster to the target,
checking the right side first at equal distance. A new shield adds to the pool
and resets its duration to 2 enemy turns; the enemy turn right after the grant
is the first. The shield absorbs enemy HP attacks before HP and is cleared at
stage start.
Healing balance (2026-10-06, confirmed after playtest: the player was too hard
to defeat): the S Heal multiplier was lowered from 3 through 2 and 1.5 to 1 (2026-10-07: D x M; crystal
activations now restore a fixed 1 HP per cell, updated 2026-10-13) and the stage-clear heal from 20 through 15 to 10.

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
  -> skip if dead -> skip its action if a freeze block or stun remains (skill counter
  unchanged) -> Garbage skill (+ new monster skill) or HP attack. Then boss summon,
  Caterpillar gnaw, all Garbage lines at once, Queen skill (2026-10-06),
  HP damage absorbed by the shield first, shield duration tick, defeat
  check, and stage completion check.
- Both are tracked per monster: switching targets does not move or cancel them.
  Summon Init clears them; RestoreHp keeps them.
Rewards draw 3 of the 7 minos at random, without duplicates, and the player
picks one. Implemented: minos at Lv.5 are excluded from the draw; if fewer than
3 remain, only that many buttons are shown.

Upgraded minos (Lv.1 and above) use the `MinoSprites/Upgraded` art instead of the
normal art. The active piece, ghost, locked blocks, NEXT, Hold, and the upgrade
list all switch when the level changes. The implemented base art is the same for every level. Lv.2+ crystal cells (above) swap only the crystal cells to a crystal version of that cell's art; the other cells keep this base art.

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
  Implemented: player max HP 100, stage-clear heal 10 (previously 20, then 15), enemy HP 20/40/70; tuning
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
