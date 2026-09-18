# 인계 문서 — 홀드 충전(Hold rune charges) 구현

## Codex 마무리 — 2026-09-18 (아래 최초 인계보다 우선)
- 사용자 최신 결정: 충전 문구/숫자/게이지 없음. 룬 점등만 표시하며 내부 3 Lock 충전은 유지.
- 기존 HoldBoard.png 픽셀 및 슬라이스 수정 없이 원본 텍스처를 참조하는 Sprite .asset 5개 생성.
  위치: Assets/@Resources/BoardArt/HoldCharge (RuneLeft/Top/Bottom/Right, Occupancy).
- P_HoldChargeOverlay.prefab을 UI/HoldBackground 아래 연결. 기존 Art는 OFF 베이스로 유지.
  UI의 HoldBackgroundView만 비활성화하여 전체 ON 이미지가 꺼진 룬을 덮지 않도록 함.
  HoldChargeView가 룬과 중앙 보관 빛을 독립적으로 제어. 가슴 코어와 그 프리팹은 변경하지 않음.
- PieceSpawner: HeldType 읽기 프로퍼티 추가, SwapHold 자체에 중복/0충전/비활성/전투종료 차단 추가.
- HoldChargeView: 배열 null 보호, 재활성화 상태 복원, 보관 이벤트 연결. 진행도 문구 제거.
- SampleScene 저장 완료. 원래 코어와 미노의 위치/크기 유지. 사용하지 않는 충전 글꼴/머티리얼 제거.
- 일시정지 Play 모드에서 14개 검증 통과: 초기 4/0, 소모, 재홀드 차단, 3회 하드드롭 충전,
  최대치 비축 방지, 0충전 함수 차단, 0룬+보관 ON, UI 재활성화, 전체 TopOutSequence 유지,
  Top Out 후 다음 Lock 충전, 기준 2 변경, 부분 진행도 유지. 콘솔 오류 0.
- 테스트는 리플렉션으로 실제 함수를 실행. 같은 호출 안의 즉시 하드드롭을 위해 미실행 PieceView.Start를
  테스트 준비 단계에서 호출했음. 물리 키보드 C/Shift 입력과 자연 낙하의 실제 프레임 경로는 미검증.
- 1920x1080 카메라 렌더로 점등 및 보관 표시 확인. 이후 문구 제거 및 씬/프리팹 TextMesh 0개 확인.
- 현재 스테이지 초기화는 씬 진입 Awake. 씬 리로드 없는 전환 시스템은 없어 그 경로는 미검증/후속 연결 필요.
- 재실행용 검증 본문: Codex 작업 폴더 output/HoldCharge-check.cs.txt.
  새 Play 모드를 일시정지 상태로 시작한 직후 Unity execute_code로 실행하고 테스트 후 Play 종료.
- Unity는 Play 종료·일시정지 해제 상태로 돌려놓음. 전투/가비지/피해 코드 수정 없음.

---

작성 2026-09-18 | 근거: `Plan.md` §4 "Hold rune charges (2026-09-18)", §8
상태: **로직 완료·검증 완료 / 씬 연결·아트 미착수**

---

## 1. 완료한 작업

### 변경 파일 2개 (씬·프리팹 변경 0건)

#### `Assets/@Scripts/Managers/PieceSpawner.cs` — 수정

홀드 상태(`heldType`, `holdUsed`)와 Lock 처리가 이미 이 매니저에 있어서
충전 상태도 같은 곳에 뒀다. 별도 매니저·별도 카운터를 만들지 않았다.

| 위치 | 내용 |
| --- | --- |
| L12 | `public static event Action<int,int> OnHoldChargesChanged` — (남은 충전량, 진행도) |
| L18-19 | `[SerializeField] maxHoldCharges = 4`, `locksPerCharge = 3` |
| L29-30 | `holdCharges`, `rechargeProgress` 필드 |
| L32-35 | `HoldCharges` / `RechargeProgress` / `MaxHoldCharges` / `LocksPerCharge` 읽기 전용 프로퍼티 |
| L46-47 | `Awake`에서 `holdCharges = maxHoldCharges`, `rechargeProgress = 0` |
| L92 | `Update` 홀드 입력 조건에 `holdCharges > 0` 추가 |
| L178-179 | `SwapHold` 끝에서 `holdCharges--` + 이벤트 발행 |
| L185-197 | `AddRechargeProgress()` 신규 |
| L223 | `Lock()` 안에서 `AddRechargeProgress()` 1회 호출 |

`AddRechargeProgress()` 동작:
```
if (holdCharges >= maxHoldCharges) return;   // 최대치면 초과 충전도 진행도 비축도 없음
rechargeProgress++;
if (rechargeProgress >= locksPerCharge) { rechargeProgress = 0; holdCharges++; }
OnHoldChargesChanged?.Invoke(holdCharges, rechargeProgress);
```

**Lock 집계 지점은 `Lock()` 한 곳뿐이다.**
하드드랍(`HardDrop() -> Lock()`)과 자연/소프트 낙하(`LateUpdate() -> Lock()`)가
모두 이 함수를 지나므로 미노 하나당 정확히 1회 집계된다.
드롭 키 입력 횟수·낙하 거리·줄 삭제 수와는 무관하다.

**Top Out 경로는 한 줄도 수정하지 않았다.**
`ClearHold()`는 `heldType`/`holdUsed`만 건드리고 충전 필드에 접근하지 않는다.
따라서 보관 미노만 사라지고 충전량·진행도는 그대로 남는다 (실측 확인).
`OnHoldChanged(null)`이 기존대로 발생해 중앙 빛은 OFF가 된다.

**충전 기준 3 -> 2 변경 방법:** Inspector의 `Managers/PieceSpawner` 에서
`Locks Per Charge` 값을 2로 바꾸면 된다. 기존 `piecesPerBag`·`lockDelay`와 같은 방식.

#### `Assets/@Scripts/UI/HoldChargeView.cs` — 신규 (아직 씬에 미부착)

```csharp
[SerializeField] private SpriteRenderer[] runeRenderers; // 룬 4개 (왼쪽부터 1번)
[SerializeField] private TextMesh progressText;          // "충전 1/3"

// UpdateDisplay(charges, progress)
runeRenderers[i].enabled = i < charges;        // 남은 충전량만큼 왼쪽부터 점등
progressText.text = $"충전 {progress}/{locksPerCharge}";
```

- `OnEnable`에서 `OnHoldChargesChanged` 구독 / `OnDisable`에서 해제
- `Start()`에서 `PieceSpawner.Instance`의 현재 값을 **읽기만** 한다.
  UI가 켜지거나 다시 연결됐다는 이유로 충전이 일어나지 않는다.
- 중앙 빛은 건드리지 않는다. 기존 `HoldBackgroundView`가 계속 담당하므로
  **룬 0개여도 미노가 보관돼 있으면 중앙 빛은 ON**이 자동으로 성립한다.
- `runeRenderers` / `progressText` 둘 다 null 가드가 있어 미연결 상태에서도
  에러 없이 로직이 돈다.

### 건드리지 않은 것

- 전투·스테이지·가비지·피해량 코드 (`CombatManager`, `GridManager`, `CombatDamage`, `EnemyStats` 등)
- `HoldBackgroundView` (UI 코어 중앙 빛, 골렘 가슴 코어 둘 다)
- `SampleScene.unity`, 모든 프리팹
- `Plan.md` (작업 전부터 수정돼 있던 상태 그대로)

---

## 2. 실행한 검증과 결과

Unity 6000.3.18f1 / MCP 연결 / Play 모드, `Time.timeScale = 0`으로 고정해
자동 낙하로 인한 측정 오염을 막고 측정했다.

### 컴파일
- `isCompiling = False`, 콘솔 **에러 0개**
- `PieceSpawner`, `HoldChargeView` 모두 Assembly-CSharp에 정상 로드 확인

### Play 모드 실측

| 검증 항목 | 결과 |
| --- | --- |
| 스테이지 시작 4개·진행도 0 | `charges=4 progress=0`, `Max=4 Locks=3` ✅ |
| 성공한 홀드만 1개 소모 | SwapHold 1회 -> `4 -> 3`, `held=Z` ✅ |
| 다음 Lock 전 재홀드 금지 | `holdUsed=True` -> 게이트 `False` ✅ |
| 실제 Lock 3회마다 1개 충전 | 하드드랍 3회 -> `3/1`, `3/2`, `4/0` ✅ |
| 하드드랍 Lock 중복 집계 없음 | 같은 구간에 `PiecesLeftInBag` 7 -> 4 ✅ |
| 최대치에서 초과 충전·진행도 비축 없음 | 4개 상태에서 Lock 3회 -> `4/0`, 이벤트 발생 0회 ✅ |
| 홀드 사용 시 부분 진행도 유지 | `3/2` 상태에서 홀드 -> `2/2` ✅ |
| Top Out 후 충전 유지 | `ClearHold()` -> `3/2` 유지, 보관 미노만 삭제 ✅ (Plan.md 예시와 일치) |
| 기존 전투 회귀 없음 | 같은 세션 `PlayerHp=100`, `PendingDamage=0`, 콘솔 에러 0 ✅ |

하드드랍은 리플렉션으로 `HardDrop()`을 직접 호출했다 —
실제 게임의 `HardDrop -> Lock -> AddRechargeProgress` 경로를 그대로 탄다.

### 별도 오프라인 검증
Unity 외부에서 Roslyn(`csc.dll`)으로 `@Scripts` 전체 26개 파일 컴파일: 에러 0,
경고 29개(전부 기존부터 있던 `CS0649` SerializeField 미할당).
컴파일된 어셈블리의 실제 `AddRechargeProgress()`를 리플렉션으로 호출해
기준 3 / 기준 2 두 경우의 상태 전이를 전부 확인 (ALL PASS).

---

## 3. 미검증 항목

1. **실제 키보드 입력으로 0개일 때 홀드가 막히는지**
   `Input.GetKeyDown`을 코드로 흉내낼 수 없어, 게이트 조건식
   `!holdUsed && holdCharges > 0` 이 `False`가 되는 것까지만 확인했다.
   직접 플레이로 충전을 0까지 쓴 뒤 C/LShift를 눌러 확인 필요.

2. **룬 점등·진행도 텍스트의 화면 표시**
   `HoldChargeView`가 아직 씬에 붙어있지 않아 시각 확인 불가.

3. **여러 스테이지에 걸친 초기화**
   현재 스테이지 전환 시스템이 없어 씬 리로드 외의 경로를 테스트할 수 없다. 4번 항목 참고.

---

## 4. 남은 작업 (Codex)

### 4-1. 코어 룬 아트 분리 — 현재 아트로는 불가능

`@Resources/BoardArt/HoldBoard.png`의 슬라이스 25개를 확인한 결과:

| 슬라이스 | 크기 | 용도 |
| --- | --- | --- |
| `HoldBoard_0` | 864 x 884 | Off (코어 전체) |
| `HoldBoard_1` | 854 x 855 | On (코어 전체) |
| `HoldBoard_2` ~ `_24` | 6~47px | 자동 슬라이스 파편, 사용 불가 |

룬 4개가 이 두 장의 전체 이미지 안에 그려져 들어가 있어 개별 점등이 불가능하다.
필요한 것: **기존 코어 크기·위치·미노 중앙 정렬·도트 밀도를 그대로 유지한 채**
룬 4개를 각각 별도 스프라이트로 분리.
켜짐/꺼짐 2종이거나, 켜짐 1종을 `SpriteRenderer.enabled`로 끄는 방식 중 하나면 된다
(`HoldChargeView`는 `enabled` 토글 방식을 쓰고 있다).

**코어를 새 디자인으로 교체하지 말 것.** 사용자가 코어 이미지 작업 중단을 지시했고,
아트 마무리는 Codex 담당으로 넘어간 상태다.

### 4-2. 씬 연결 (전부 미수행)

현재 씬의 관련 오브젝트 좌표:

```
UI/HoldBackground   pos=(-2.70, 0.76, 0)   <- HoldBackgroundView (중앙 빛 Off/On)
UI/HoldPanel        pos=(-2.70, 0.76, 0)   <- HoldView (보관 미노 표시)
UI/HoldLabel        pos=(-2.70, -0.46, 0)  <- TextMesh "CORE"
UI/TurnLabel        pos=(-2.70, -1.55, 0)  <- TextMesh
Player/Golem1_3_0/P_GolemIdle/BodyFeet/ChestCore/Art   <- 골렘 가슴 코어 (변경 금지)
```

해야 할 일:
1. `UI` 그룹 아래(`HoldBackground` 권장)에 `HoldChargeView` 컴포넌트 부착
2. 룬 4개 오브젝트 생성 -> `runeRenderers`에 **왼쪽부터 순서대로** 연결
   (인덱스 0 = 첫 번째 충전. `enabled = i < charges` 이므로 순서가 틀리면 점등이 어긋난다)
3. 코어 근처에 진행도용 `TextMesh` 생성 -> `progressText`에 연결.
   기존 `HoldLabel`/`TurnLabel`과 같은 방식(월드 좌표 TextMesh, `LegacyRuntime.ttf`).
   최종 위치는 사용자가 직접 조정할 예정이다.
4. **`HoldBackgroundView`(UI 코어 중앙 빛)와 골렘 가슴 코어는 건드리지 말 것.**
   이미 요구대로 동작한다.
5. CLAUDE.md 규칙: 새 오브젝트는 반드시 기존 최상위 그룹(`UI`) 아래에 두고,
   `GridManager` 아래에는 절대 두지 않는다 (`ClearAllBlocks()`가 자식을 전부 파괴).

### 4-3. 사용자 확인이 필요한 사항

**"실제 새 스테이지 진입"의 기준을 `PieceSpawner.Awake`(= 씬 로드)로 잡았다.**
현재 프로젝트에 스테이지 전환 시스템이 없기 때문이다
(`CombatManager.stageNumber`는 Inspector 고정값이고, 스테이지 클리어 후
다음 스테이지로 넘어가는 코드가 없다. `OnStageCleared` 이벤트는 구독자 0개).

가방 종료·적 턴 전환·개별 적 처치·Top Out에서는 초기화되지 않는다 (요구대로).

씬 리로드 없이 스테이지를 넘기는 구조가 생기면, 그 지점에서
충전량을 `maxHoldCharges`로 되돌리는 호출 한 줄이 필요하다.
`PieceSpawner`에 public 초기화 메서드가 아직 없으므로 그때 추가해야 한다.
