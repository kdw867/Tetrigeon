using System;
using System.Collections.Generic;
using UnityEngine;

// 전투 진행 담당: 가방 한 개(조각 7개) = 플레이어 턴, 가방 끝에 누적 피해를 타겟 적에게 적용한 뒤 적 턴
public class CombatManager : MonoBehaviour
{
    public static CombatManager Instance { get; private set; }

    public static event Action OnStateChanged; // HP/누적 피해/남은 조각 수 바뀔 때 알림 (UI용)
    public static event Action<bool> OnCombatEnded; // 전투 종료 알림 (true = 플레이어 승리)
    public static event Action<int> OnStageCleared; // 스테이지 클리어 알림 (보상 처리용, 스테이지 번호 전달)

    [SerializeField] private int stageNumber = 1; // 진행할 스테이지 번호 (지도 구현 전까지 여기서 지정)
    [SerializeField] private int playerMaxHp = 100; // 플레이어 최대 체력
    [SerializeField] private float topOutHpPenaltyRatio = 0.3f; // Top Out 시 최대 체력 대비 잃는 비율
    [SerializeField] private int piecesPerBag = 7; // 한 턴에 배치하는 조각 수
    [SerializeField] private Enemy enemyPrefab; // 적 프리팹 (등급은 생성 시 주입)
    [SerializeField] private Transform enemyRoot; // 생성된 적을 담을 부모 (Hierarchy의 Enemies 그룹)
    [SerializeField] private HpBarView enemyHpBarPrefab; // 적마다 하나씩 만드는 체력 막대 프리팹
    [SerializeField] private RectTransform enemyHpBarRoot; // 생성된 체력 막대를 담을 UI 부모
    [SerializeField] private Vector3 enemyLineCenter = new Vector3(5.9f, 3.1f, 0f); // 적들이 늘어서는 줄의 중심
    [SerializeField] private float enemySpacing = 1.8f; // 적 사이 가로 간격 (보스 폭이 넓어 겹치지 않도록 확보)

    public const int PoisonTurns = 2; // 강화 T 미노의 독 지속 턴
    public const int ShieldTurns = 2; // 강화 O 미노의 보호막 지속 턴
    private const int BossFreezeMinDamage = 2; // 보스를 얼리려면 필요한 최소 기존 피해
    private const float BossProtectedRatio = 0.5f; // 호위가 살아있는 동안 보스가 받는 피해 비율
    private const float PoisonRatio = 0.7f; // 독 턴당 피해 배율 (Lv.1 기준)
    private const float ExplosionRatio = 0.7f; // 폭발 추가 피해 배율 (Lv.1 기준)
    private const float FreezeBreakRatio = 0.5f; // 빙결 파괴 피해 배율 (Lv.1 기준)
    private const int CriticalBonusPerLevel = 1; // 치명타 Lv.1 기준 추가 피해 배수 (Lv.1 = 2배)
    private const int ShieldMultiplier = 2; // 보호막 배율 (Lv.1 기준)
    private const int HealMultiplier = 1; // 회복 배율을 Lv.1 기준 1배로 적용

    public int PlayerHp { get; private set; } // 현재 플레이어 체력
    public int PlayerShield { get; private set; } // 남아있는 보호막 (체력보다 먼저 깎임)
    public int PlayerMaxHp => playerMaxHp;
    public int StageNumber => stageNumber;
    public int PendingDamage { get; private set; } // 이번 가방에서 누적된 피해 (아직 미적용)
    public int PiecesLeftInBag => piecesPerBag - piecesPlaced; // 이번 턴에 남은 조각 수
    public IReadOnlyList<Enemy> Enemies => enemies; // UI가 읽을 적 목록
    public Enemy Target => targetIndex >= 0 && targetIndex < enemies.Count && enemies[targetIndex].IsAlive ? enemies[targetIndex] : null; // 현재 타겟 (죽은 적은 타겟이 되지 않음)

    private readonly List<Enemy> enemies = new List<Enemy>(); // 이번 스테이지의 적들 (왼쪽부터 순서대로)
    private int targetIndex; // 현재 타겟의 인덱스
    private int piecesPlaced; // 이번 가방에서 배치한 조각 수
    private bool combatEnded; // 승패가 이미 결정됐는지
    private bool stageCleared; // 스테이지 완료 처리가 이미 실행됐는지 (중복 방지)

    // 강화 미노 능력으로 이번 가방에 쌓인 효과들 (기존 피해와 같이 가방 끝에 한 번에 정산)
    private int pendingPierceDamage; // I: 살아있는 적 전체에게 줄 피해
    private int pendingShield; // O: 플레이어에게 줄 보호막
    private int pendingHeal; // S: 플레이어가 회복할 양
    private int pendingExplosionDamage; // Z: 인접한 다른 적에게 줄 피해
    public int PendingFreezeTurns { get; private set; } // 이번 가방의 최대 삭제 줄 수로 정한 빙결 턴
    private int pendingFreezeDamage; // J: 보스 빙결 조건 판정에 쓰는 기존 피해
    private int pendingFreezeBreakDamage; // J: 빙결이 끝날 때 줄 피해
    private readonly List<int> pendingPoisons = new List<int>(); // T: 타겟에게 걸 독들의 턴당 피해
    private readonly int[] effectCounts = new int[7]; // 이번 가방의 강화 종류별 발동 횟수
    private readonly int[] effectTotals = new int[7]; // 종류별 정산 예정 효과량 합계
    public int NormalAttackDamage => PendingDamage - effectTotals[(int)TetrominoType.L]; // 치명타 전체 피해와 일반 공격을 중복 없이 분리
    public int GetEffectCount(TetrominoType type) => effectCounts[(int)type]; // UI용 발동 횟수
    public int GetEffectTotal(TetrominoType type) => effectTotals[(int)type]; // UI용 합계

    private int RecordEffect(TetrominoType type, int amount) // 기존 계산 결과를 변경하지 않고 표시용 기록만 추가
    {
        int index = (int)type; // 종류 인덱스
        effectCounts[index]++; // 발동 횟수 증가
        effectTotals[index] += amount; // 효과량 합산
        return amount; // 기존 전투 계산에 같은 값 전달
    }

    private void ClearEffectDisplay() // 가방 정산과 스테이지 전환 시 표시 초기화
    {
        Array.Clear(effectCounts, 0, 7); // 횟수 초기화
        Array.Clear(effectTotals, 0, 7); // 합계 초기화
    }

    private int shieldTurnsLeft; // 보호막 남은 턴

    private void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject); // 중복 인스턴스 제거
            return;
        }
        Instance = this;

        PlayerHp = playerMaxHp; // 체력 초기화
        MinoUpgrades.ResetRun(); // 새 런이므로 미노 강화 기록을 비움
        SpawnStageEnemies(); // 스테이지 구성대로 적 생성
    }

    private void OnEnable()
    {
        PieceSpawner.OnPieceLocked += HandlePieceLocked; // 조각 고정마다 피해 누적
        PieceSpawner.OnTopOut += HandleTopOut; // Top Out 페널티 처리
    }

    private void OnDisable()
    {
        PieceSpawner.OnPieceLocked -= HandlePieceLocked; // 이벤트 구독 해제
        PieceSpawner.OnTopOut -= HandleTopOut;
        Time.timeScale = 1f; // 전투 종료로 멈춰둔 시간을 원복 (에디터 재생 종료 후 남지 않게)
    }

    private void Update()
    {
        if (combatEnded || stageCleared) return; // 전투가 끝났으면 타겟 변경도 막음
        if (PauseMenu.IsGamePaused) return; // 일시정지 중에는 타겟 변경도 막음
        if (Input.GetKeyDown(KeyCode.Tab)) CycleTarget(); // Tab으로 오른쪽 적에게 타겟 이동
    }

    // 스테이지 구성대로 적을 한 줄로 생성
    private void SpawnStageEnemies()
    {
        EnemyTier[] composition = StageData.GetComposition(stageNumber);
        if (composition.Length == 0) return; // 정의되지 않은 스테이지 번호 방어 (현재 1~10은 모두 전투)

        float lineWidth = (composition.Length - 1) * enemySpacing; // 전체 줄 길이
        for (int i = 0; i < composition.Length; i++)
        {
            Enemy enemy = Instantiate(enemyPrefab, enemyRoot); // 프리팹에서 생성해 Enemies 그룹 아래 배치
            enemy.name = $"Enemy_{i}_{EnemyStats.GetName(composition[i])}"; // Hierarchy에 몬스터 이름으로 표시
            enemy.transform.position = enemyLineCenter + new Vector3(-lineWidth / 2f + i * enemySpacing, 0f, 0f); // 왼쪽부터 순서대로
            enemy.Init(composition[i]); // 등급별 능력치 적용
            enemy.GetComponent<EnemyView>().CreateHpBar(enemyHpBarPrefab, enemyHpBarRoot); // 체력 막대는 UI 캔버스에 따로 생성
            enemies.Add(enemy);
        }

        targetIndex = 0; // 맨 왼쪽 적부터 타겟
    }

    // Tab: 오른쪽 적으로 타겟 이동, 맨 오른쪽이면 맨 왼쪽으로 순환 (죽은 적은 건너뜀)
    private void CycleTarget()
    {
        if (enemies.Count == 0) return;

        for (int step = 1; step <= enemies.Count; step++)
        {
            int candidate = (targetIndex + step) % enemies.Count; // 오른쪽 방향으로 한 칸씩 확인
            if (!enemies[candidate].IsAlive) continue; // 죽은 적은 타겟이 될 수 없음

            targetIndex = candidate;
            OnStateChanged?.Invoke();
            return;
        }
    }

    // 타겟이 죽었을 때 살아있는 적으로 타겟을 옮김
    private void MoveTargetToLivingEnemy()
    {
        if (Target != null) return; // 살아있는 타겟이 있으면 그대로 유지 (Target은 죽은 적을 반환하지 않음)

        for (int step = 1; step <= enemies.Count; step++)
        {
            int candidate = (targetIndex + step) % enemies.Count;
            if (!enemies[candidate].IsAlive) continue;

            targetIndex = candidate;
            return;
        }
    }

    private void HandlePieceLocked(TetrominoType lockedType, TSpinType tSpin, int clearedLines, IReadOnlyList<TetrominoType> clearedCrystals)
    {
        if (combatEnded || stageCleared) return; // 전투 끝났으면 무시

        // 줄을 지워서 보드가 비워진 경우만 퍼펙트 클리어 (Top Out 리셋은 해당 없음)
        bool perfectClear = clearedLines > 0 && GridManager.Instance.IsBoardEmpty();
        int damage = CombatDamage.Calculate(tSpin, clearedLines, perfectClear); // 기존 방식 그대로 계산한 피해

        // 강화 능력은 방금 고정한 조각이 강화돼 있고, 그 고정으로 줄이 지워졌을 때만 1회 발동
        // (보드에 이미 쌓여 있는 블록은 지워진 줄에 포함돼도 능력을 발동시키지 않음)
        int upgradeLevel = MinoUpgrades.GetLevel(lockedType); // 0이면 미강화
        if (clearedLines > 0 && upgradeLevel > 0)
            ApplyUpgradedAbility(lockedType, damage, upgradeLevel, clearedLines); // 빙결 지속시간에는 실제 삭제 줄 수 전달
        else
            PendingDamage += damage; // 강화가 아니면 기존대로 타겟 피해에만 합산

        // 지워진 수정 칸마다 원본 미노의 능력을 한 번씩 더 발동 (고정한 조각이 무엇이든, 위 발동과 별개로 칸마다 따로 센다)
        foreach (TetrominoType crystalType in clearedCrystals)
        {
            int crystalLevel = MinoUpgrades.GetLevel(crystalType); // 세기는 수정이 속한 원본 미노의 현재 레벨
            if (crystalLevel > 0) ApplyUpgradedAbility(crystalType, damage, crystalLevel, clearedLines, true); // 이 줄 삭제의 피해 기준, 능력 효과만 추가
        }

        piecesPlaced++;
        if (piecesPlaced >= piecesPerBag) EndPlayerTurn(); // 조각 7개 다 놓으면 턴 종료
        else OnStateChanged?.Invoke();
    }

    // 강화 능력의 효과 수치 (피해 damage, 강화 레벨 level 기준). 실제 발동과 보상 카드 표시가 같은 식을 쓰도록 한 곳에 둠
    public static int AbilityValue(TetrominoType type, int damage, int level)
    {
        float strength = 1f + 0.5f * (level - 1); // Lv.1~5 강화 효과 배율: 1, 1.5, 2, 2.5, 3
        switch (type)
        {
            case TetrominoType.I: return Mathf.RoundToInt(damage * strength); // 관통 피해
            case TetrominoType.J: return Mathf.RoundToInt(damage * FreezeBreakRatio * strength); // 빙결 해제 피해
            case TetrominoType.L: return damage + Mathf.RoundToInt(damage * CriticalBonusPerLevel * strength); // 치명타 총 피해 (기본 피해 포함)
            case TetrominoType.O: return Mathf.RoundToInt(damage * ShieldMultiplier * strength); // 보호막량
            case TetrominoType.S: return Mathf.RoundToInt(damage * HealMultiplier * strength); // 실제 회복과 카드 표시에 동일한 정수 회복량 사용
            case TetrominoType.T: return Mathf.RoundToInt(damage * PoisonRatio * strength); // 독 턴당 피해
            case TetrominoType.Z: return Mathf.RoundToInt(damage * ExplosionRatio * strength); // 폭발 피해
        }
        return 0; // 알 수 없는 종류는 효과 없음
    }

    // 강화 미노 능력 발동. 능력 세기는 줄 수로 다시 계산하지 않고, 이미 계산된 피해에 강화 레벨을 곱해서 쓴다.
    // 빙결은 삭제 줄 수로 1~3턴, 독과 보호막은 기존 지속시간을 사용한다.
    // crystal이 true면 지워진 수정 칸의 추가 발동: 기본 피해는 이미 한 번 들어갔으므로 능력 효과만 더하고, 빙결은 1턴, 치명타는 추가분(피해 x 강화 배율)만 더한다.
    private void ApplyUpgradedAbility(TetrominoType lockedType, int damage, int level, int clearedLines, bool crystal = false) // 빙결은 줄 수로 지속시간 계산
    {
        int baseDamage = crystal ? 0 : damage; // 수정 발동은 타겟 기본 피해를 다시 더하지 않음

        switch (lockedType)
        {
            case TetrominoType.I: // 관통: 살아있는 적 전체가 피해를 받음 (적 수만큼 곱해지므로 레벨 기울기는 절반)
                pendingPierceDamage += RecordEffect(lockedType, AbilityValue(lockedType, damage, level)); // 관통 피해와 표시를 같은 값으로 기록
                break;

            case TetrominoType.L: // 치명타 (주황 L, 2026-09-30 J와 교환): 기본 피해에 Lv.1 기준 1배씩 더함 (Lv.1 = 2배, Lv.2 = 2.5배)
                PendingDamage += RecordEffect(lockedType, AbilityValue(lockedType, damage, level) - (crystal ? damage : 0)); // 치명타 피해 기록 (수정은 기본 피해를 뺀 추가분만)
                break;

            case TetrominoType.O: // 방어막: 기본 피해에 더해 Lv.1 기준 2배만큼 보호막을 쌓음
                PendingDamage += baseDamage;
                pendingShield += RecordEffect(lockedType, AbilityValue(lockedType, damage, level)); // 보호막량 기록
                break;

            case TetrominoType.T: // 독: 기본 피해 후 Lv.1 기준 0.7배 피해를 2턴 동안 (중첩)
                PendingDamage += baseDamage;
                pendingPoisons.Add(RecordEffect(lockedType, AbilityValue(lockedType, damage, level))); // 독 턴당 피해 기록
                break;

            case TetrominoType.S: // 회복: 기본 피해에 더해 Lv.1 기준 1배만큼 회복 (최대 체력에서 잘리므로 초과분은 버려짐)
                PendingDamage += baseDamage;
                pendingHeal += RecordEffect(lockedType, AbilityValue(lockedType, damage, level)); // 회복 예정량 기록
                break;

            case TetrominoType.Z: // 폭발: 기본 피해 후 인접한 다른 적 1명에게 Lv.1 기준 0.7배 피해
                PendingDamage += baseDamage;
                pendingExplosionDamage += RecordEffect(lockedType, AbilityValue(lockedType, damage, level)); // 폭발 피해 기록
                break;

            case TetrominoType.J: // 파란 J: 삭제한 줄 수만큼 행동 차단, 해제 시 기존 추가 피해
                PendingDamage += baseDamage;
                PendingFreezeTurns = Mathf.Max(PendingFreezeTurns, crystal ? 1 : Mathf.Clamp(clearedLines, 1, 3)); // 같은 가방에서는 가장 긴 지속시간 사용 (수정 칸은 줄 수와 상관없이 1턴)
                pendingFreezeDamage = Mathf.Max(pendingFreezeDamage, damage); // 보스 빙결 조건은 강화 전 피해로 판정 (레벨 무관)
                pendingFreezeBreakDamage += RecordEffect(lockedType, AbilityValue(lockedType, damage, level)); // 빙결 해제 피해 기록
                break;
        }
    }

    // 보스의 능력 턴 소환. 죽은 자리를 일반 몹으로 다시 채우고, 빈자리가 없으면 살아있는 일반 몹을 체력 최대로 되돌린다.
    // 줄을 늘리지 않으므로 적 배치와 타겟 인덱스는 그대로 유지된다.
    private void SummonNormal()
    {
        foreach (Enemy enemy in enemies)
        {
            if (enemy.IsAlive || enemy.Tier == EnemyTier.Boss) continue; // 살아있는 적과 보스 자리는 대상이 아님
            enemy.Init(EnemyTier.Normal); // 죽은 자리를 일반 몹으로 되살림 (체력·상태이상·스킬 카운터 초기화)
            return;
        }

        foreach (Enemy enemy in enemies)
        {
            if (!enemy.IsAlive || enemy.Tier != EnemyTier.Normal) continue; // 빈자리가 없으면 살아있는 일반 몹을 보강
            enemy.RestoreHp(); // 상태이상은 유지한 채 체력만 최대로
            return;
        }
    }

    // 모든 피해가 지나는 관문. 보스는 호위가 살아있는 동안 피해가 줄어든다.
    private void DealDamage(Enemy enemy, int amount)
    {
        if (enemy == null || amount <= 0) return; // 줄 피해가 없으면 아무 일도 하지 않음

        if (enemy.Tier == EnemyTier.Boss && HasLivingEscort())
            amount = Mathf.Max(1, Mathf.RoundToInt(amount * BossProtectedRatio)); // 감소해도 최소 1은 들어감

        enemy.TakeDamage(amount);
    }

    // 보스 말고 살아있는 적이 남아있는지 (보스 피해 감소 조건)
    private bool HasLivingEscort()
    {
        foreach (Enemy enemy in enemies)
            if (enemy.IsAlive && enemy.Tier != EnemyTier.Boss) return true;
        return false;
    }

    // 이 적이 지금 받는 피해 감소율(%). UI가 읽어서 표시한다.
    public int GetDamageReductionPercent(Enemy enemy)
    {
        if (enemy.Tier != EnemyTier.Boss || !HasLivingEscort()) return 0; // 호위가 없으면 감소 없음
        return Mathf.RoundToInt((1f - BossProtectedRatio) * 100f);
    }

    // 폭발이 튈 적: 타겟에서 좌우로 가장 가까운 살아있는 적 (없으면 추가 피해 없음)
    private Enemy FindExplosionNeighbour()
    {
        for (int distance = 1; distance < enemies.Count; distance++)
        {
            int right = targetIndex + distance; // 오른쪽 먼저 확인
            if (right < enemies.Count && enemies[right].IsAlive) return enemies[right];

            int left = targetIndex - distance; // 그다음 왼쪽
            if (left >= 0 && enemies[left].IsAlive) return enemies[left];
        }
        return null;
    }

    // 이번 가방에 쌓인 강화 능력 효과를 한 번에 적용
    private void ResolveUpgradedAbilities(Enemy target)
    {
        if (target != null && target.IsAlive)
        {
            foreach (int poisonDamage in pendingPoisons)
                target.AddPoison(poisonDamage, PoisonTurns); // 독은 타겟에게 중첩해서 부여

            // 보스는 기존 피해가 2 이상일 때만 얼릴 수 있다
            bool canFreeze = target.Tier != EnemyTier.Boss || pendingFreezeDamage >= BossFreezeMinDamage;
            if (pendingFreezeDamage > 0 && canFreeze)
                target.ApplyFreeze(pendingFreezeBreakDamage, PendingFreezeTurns); // 줄 수만큼 행동 차단 예약
        }

        if (pendingExplosionDamage > 0)
        {
            Enemy neighbour = FindExplosionNeighbour(); // 근처에 다른 적이 있을 때만 폭발
            if (neighbour != null) DealDamage(neighbour, pendingExplosionDamage);
        }

        if (pendingPierceDamage > 0)
            foreach (Enemy enemy in enemies)
                if (enemy.IsAlive) DealDamage(enemy, pendingPierceDamage); // 관통은 살아있는 적 전체

        if (pendingHeal > 0) Heal(pendingHeal); // 회복은 최대 체력을 넘지 않음

        if (pendingShield > 0)
        {
            PlayerShield += pendingShield; // 보호막은 가방이 끝날 때 부여
            shieldTurnsLeft = ShieldTurns;
        }

        pendingPierceDamage = 0; // 다음 가방을 위해 초기화
        pendingShield = 0;
        pendingHeal = 0;
        pendingExplosionDamage = 0;
        PendingFreezeTurns = 0; // 다음 가방과 스테이지에 빙결 턴 이월 방지
        pendingFreezeDamage = 0;
        pendingFreezeBreakDamage = 0;
        pendingPoisons.Clear();
    }

    private void EndPlayerTurn()
    {
        Enemy target = Target;
        if (target != null && target.IsAlive)
            DealDamage(target, PendingDamage); // 누적 피해는 타겟 한 마리에게만, 초과분은 소멸

        ReleaseFreezes(); // 지난 정산에서 건 빙결을 해제하고 파괴 피해 적용 (이번 정산의 새 빙결보다 먼저)
        ResolveUpgradedAbilities(target); // 강화 능력 효과도 같은 시점에 정산

        ClearEffectDisplay(); // 정산된 가방의 효과 표시 제거
        PendingDamage = 0;
        piecesPlaced = 0;

        MoveTargetToLivingEnemy(); // 타겟이 죽었으면 살아있는 적으로 옮김

        if (IsStageComplete())
        {
            CompleteStage(); // 모든 적(보스전은 보스) 처치 시에만 완료 처리
            return;
        }

        EnemyTurn();
    }

    // 빙결 해제: 예정된 행동을 모두 차단한 적만 해제하고 파괴 피해를 한 번 준다.
    // 적 턴 전에 처리하므로 이 피해로 죽은 적은 행동하지 않고, 보스가 죽으면 적 턴 없이 스테이지가 끝난다.
    private void ReleaseFreezes()
    {
        foreach (Enemy enemy in enemies)
        {
            if (!enemy.IsAlive) continue; // 죽은 적은 해제 피해를 받지 않음
            DealDamage(enemy, enemy.ReleaseFreeze()); // 빙결이 없던 적은 0이라 아무 일도 없음 (보스 피해 감소는 DealDamage가 적용)
        }
    }

    // 스테이지 완료 조건: 보스전은 보스 사망, 그 외에는 전멸
    private bool IsStageComplete()
    {
        if (StageData.IsBossStage(stageNumber))
        {
            foreach (Enemy enemy in enemies)
                if (enemy.Tier == EnemyTier.Boss && enemy.IsAlive) return false; // 보스가 살아있으면 계속
            return true;
        }

        foreach (Enemy enemy in enemies)
            if (enemy.IsAlive) return false; // 한 마리라도 남아있으면 계속
        return true;
    }

    // 스테이지 완료 처리: 게임을 멈추고 보상 화면에 알림 (전투 종료가 아니라 다음 스테이지로 이어짐)
    private void CompleteStage()
    {
        if (stageCleared) return; // 중복 실행 방지

        stageCleared = true;
        Time.timeScale = 0f; // 보상을 고르는 동안 시간 정지

        if (PieceSpawner.Instance != null)
            PieceSpawner.Instance.SetInputEnabled(false); // timeScale 0에서도 도는 입력을 직접 차단

        OnStateChanged?.Invoke();

        if (stageNumber >= StageData.LastStage) // 마지막(보스) 스테이지는 보상·강화 없이 바로 런 클리어
        {
            EndCombat(true);
            return;
        }

        OnStageCleared?.Invoke(stageNumber); // 보상 화면이 구독해서 처리
    }

    // 플레이어 체력 회복 (최대 체력을 넘지 않음)
    public void Heal(int amount)
    {
        PlayerHp = Mathf.Min(PlayerHp + amount, playerMaxHp); // 최대 체력까지만 회복
        OnStateChanged?.Invoke();
    }

    // 보상을 고른 뒤 다음 스테이지로 진입. 마지막 스테이지였으면 런 종료.
    public void AdvanceToNextStage()
    {
        if (!stageCleared) return; // 클리어 상태에서만 진행

        if (stageNumber >= StageData.LastStage) // 마지막 스테이지를 깼으면 런 클리어
        {
            EndCombat(true);
            return;
        }

        stageNumber++; // 다음 스테이지 번호로
        StartStage();
    }

    // 다음 스테이지 시작: 적·보드·가방·홀드를 새로 하고 시간을 다시 흐르게 한다 (체력과 강화는 유지)
    private void StartStage()
    {
        foreach (Enemy enemy in enemies)
            if (enemy != null) Destroy(enemy.gameObject); // 이전 스테이지의 적 오브젝트 제거
        enemies.Clear();

        targetIndex = 0; // 타겟 초기화
        piecesPlaced = 0; // 가방 진행도 초기화
        ClearEffectDisplay(); // 정산된 가방의 효과 표시 제거
        PendingDamage = 0; // 이월된 누적 피해 없음
        stageCleared = false; // 새 스테이지는 아직 클리어 전

        pendingPierceDamage = 0; // 쌓다 만 강화 능력 효과도 이월하지 않음
        pendingShield = 0;
        pendingHeal = 0;
        pendingExplosionDamage = 0;
        PendingFreezeTurns = 0; // 다음 가방과 스테이지에 빙결 턴 이월 방지
        pendingFreezeDamage = 0;
        pendingFreezeBreakDamage = 0;
        pendingPoisons.Clear();
        PlayerShield = 0; // 보호막은 스테이지를 넘기지 않음
        shieldTurnsLeft = 0;

        SpawnStageEnemies(); // 새 스테이지 구성대로 적 생성

        GridManager.Instance.ClearAllBlocks(); // 보드를 비우고 새 스테이지 시작

        Time.timeScale = 1f; // 시간 재개

        if (PieceSpawner.Instance != null)
            PieceSpawner.Instance.StartNewStage(); // 가방·홀드·홀드 충전을 새 스테이지 상태로

        OnStateChanged?.Invoke();
    }

    private void EnemyTurn()
    {
        int garbageLines = 0; // 이번 턴에 능력을 쓴 적들의 방해 줄 합계
        int hpDamage = 0; // 이번 턴에 체력 공격을 한 적들의 피해 합계

        bool bossSummons = false; // 이번 턴에 보스가 능력을 썼는지 (소환은 루프가 끝난 뒤 처리)
        int gnawCount = 0; // 이번 턴에 능력을 쓴 애벌레 수 (한 마리당 1칸)
        bool queenGrows = false; // 이번 턴에 여왕이 수정 증식을 쓰는지
        bool queenLocksRotation = false; // 이번 턴에 여왕이 회전 금지를 쓰는지

        foreach (Enemy enemy in enemies)
        {
            if (!enemy.IsAlive) continue; // 죽은 적은 행동하지 않음

            DealDamage(enemy, enemy.TickPoison()); // 독은 행동 전에 먼저 적용 (이번 정산에 새로 걸린 독은 건너뜀)
            if (!enemy.IsAlive) continue; // 독으로 죽었으면 행동하지 않음

            bool frozen = enemy.ConsumeFreezeBlock(); // 빙결 횟수가 남았으면 소비
            bool stunned = enemy.ConsumeStun(); // 스턴도 같은 행동에서 함께 소비 (겹쳐도 합산하지 않음)
            if (frozen || stunned) continue; // 빙결·스턴인 적은 이번 행동을 쉼 (스킬 카운터와 강공격 기한도 그대로)

            if (enemy.AdvanceTurnAndCheckSkill())
            {
                garbageLines += enemy.RollGarbageLines(); // 능력 턴인 적은 방해 줄만 추가
                if (enemy.Tier == EnemyTier.Boss) bossSummons = true; // 보스는 가비지와 함께 일반 몹도 소환
                if (enemy.Tier == EnemyTier.Normal) gnawCount++; // 애벌레는 가비지와 함께 고정 블록 1칸을 갉아먹음
                if (enemy.Tier == EnemyTier.Epic) enemy.StartCharge(); // 수호자는 가비지와 함께 보호막 생성, 강공격 준비 시작
                if (enemy.Tier == EnemyTier.Boss)
                {
                    if (enemy.TakeQueenGrowthTurn()) queenGrows = true; // 여왕: 이번 능력은 수정 증식
                    else queenLocksRotation = true; // 여왕: 이번 능력은 회전 금지
                }
            }
            else if (enemy.ChargeActionsLeft > 0)
                hpDamage += enemy.AdvanceCharge(); // 준비 중인 수호자는 일반 공격 대신 기한을 세고, 기한이 되면 강공격
            else
                hpDamage += enemy.AttackDamage; // 나머지 적은 체력 공격만
        }

        if (bossSummons) SummonNormal(); // 소환된 적이 같은 턴에 바로 행동하지 않도록 루프 종료 후 처리

        if (gnawCount > 0) GridManager.Instance.RemoveRandomMinoBlocks(gnawCount); // 가비지가 올라오기 전에 먼저 갉아먹음 (서로 다른 칸)

        if (garbageLines > 0) GridManager.Instance.AddGarbageLines(garbageLines); // 방해 줄은 한 번에 쌓음

        if (queenGrows) BagManager.Instance.GrowPreview(); // NEXT에 보이는 미노 전부에 칸 1개씩
        if (queenLocksRotation) BagManager.Instance.LockNextRotation(); // NEXT 맨 위 미노 회전 금지

        hpDamage = AbsorbWithShield(hpDamage); // 보호막이 있으면 먼저 막아줌
        PlayerHp -= hpDamage; // 남은 피해만 체력에 적용
        TickShield(); // 보호막 지속 턴 감소

        if (PlayerHp <= 0)
        {
            PlayerHp = 0;
            EndCombat(false); // 플레이어 체력 0 이하면 패배
            return;
        }

        MoveTargetToLivingEnemy(); // 독·빙결 피해로 타겟이 죽었을 수 있음

        if (IsStageComplete())
        {
            CompleteStage(); // 독·빙결 피해로 전멸한 경우도 스테이지 완료 처리
            return;
        }

        OnStateChanged?.Invoke();
    }

    // 보호막이 피해를 먼저 흡수하고, 흡수한 만큼 줄어든다
    private int AbsorbWithShield(int damage)
    {
        if (PlayerShield <= 0 || damage <= 0) return damage;

        int absorbed = Mathf.Min(PlayerShield, damage); // 보호막이 감당할 수 있는 만큼만
        PlayerShield -= absorbed;
        return damage - absorbed;
    }

    // 보호막 지속 턴을 줄이고, 다 되면 남은 양과 상관없이 사라짐
    private void TickShield()
    {
        if (shieldTurnsLeft <= 0) return;

        shieldTurnsLeft--;
        if (shieldTurnsLeft <= 0) PlayerShield = 0;
    }

    private void HandleTopOut()
    {
        if (combatEnded || stageCleared) return; // 전투 끝났으면 무시

        PlayerHp -= Mathf.RoundToInt(playerMaxHp * topOutHpPenaltyRatio); // 최대 체력 비례 페널티

        if (PlayerHp <= 0)
        {
            PlayerHp = 0;
            EndCombat(false);
            return;
        }

        EndPlayerTurn(); // 턴 강제 종료: 이번 가방에 쌓아둔 피해만 적용하고 적 턴으로
    }

    private void EndCombat(bool playerWon)
    {
        combatEnded = true;
        OnStateChanged?.Invoke();
        OnCombatEnded?.Invoke(playerWon);
        Time.timeScale = 0f; // ponytail: 결과 화면/재시작 UI 붙이면 그때 교체
    }
}
