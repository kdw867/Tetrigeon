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
    [SerializeField] private Vector3 enemyLineCenter = new Vector3(5.9f, 3.1f, 0f); // 적들이 늘어서는 줄의 중심
    [SerializeField] private float enemySpacing = 1.6f; // 적 사이 가로 간격

    private const int PoisonTurns = 2; // 강화 T 미노의 독 지속 턴
    private const int FreezeTurns = 1; // 강화 L 미노의 빙결 지속 턴
    private const int ShieldTurns = 2; // 강화 O 미노의 보호막 지속 턴
    private const int BossFreezeMinDamage = 2; // 보스를 얼리려면 필요한 최소 기존 피해
    private const float PoisonRatio = 0.7f; // 독 턴당 피해 배율
    private const float ExplosionRatio = 0.7f; // 폭발 추가 피해 배율
    private const float FreezeBreakRatio = 0.5f; // 빙결 파괴 피해 배율
    private const int CriticalMultiplier = 2; // 치명타 배율
    private const int ShieldMultiplier = 2; // 보호막 배율
    private const int HealMultiplier = 3; // 회복 배율

    public int PlayerHp { get; private set; } // 현재 플레이어 체력
    public int PlayerShield { get; private set; } // 남아있는 보호막 (체력보다 먼저 깎임)
    public int PlayerMaxHp => playerMaxHp;
    public int StageNumber => stageNumber;
    public int PendingDamage { get; private set; } // 이번 가방에서 누적된 피해 (아직 미적용)
    public int PiecesLeftInBag => piecesPerBag - piecesPlaced; // 이번 턴에 남은 조각 수
    public IReadOnlyList<Enemy> Enemies => enemies; // UI가 읽을 적 목록
    public Enemy Target => targetIndex >= 0 && targetIndex < enemies.Count ? enemies[targetIndex] : null; // 현재 타겟

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
    private int pendingFreezeDamage; // L: 보스 빙결 조건 판정에 쓰는 기존 피해
    private int pendingFreezeBreakDamage; // L: 빙결이 끝날 때 줄 피해
    private readonly List<int> pendingPoisons = new List<int>(); // T: 타겟에게 걸 독들의 턴당 피해
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

    // 스테이지 구성대로 적을 한 줄로 생성 (비전투 스테이지는 아무것도 만들지 않음)
    private void SpawnStageEnemies()
    {
        EnemyTier[] composition = StageData.GetComposition(stageNumber);
        if (composition.Length == 0) return; // 9스테이지처럼 적이 없는 스테이지

        float lineWidth = (composition.Length - 1) * enemySpacing; // 전체 줄 길이
        for (int i = 0; i < composition.Length; i++)
        {
            Enemy enemy = Instantiate(enemyPrefab, enemyRoot); // 프리팹에서 생성해 Enemies 그룹 아래 배치
            enemy.name = $"Enemy_{i}_{composition[i]}";
            enemy.transform.position = enemyLineCenter + new Vector3(-lineWidth / 2f + i * enemySpacing, 0f, 0f); // 왼쪽부터 순서대로
            enemy.Init(composition[i]); // 등급별 능력치 적용
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
        if (Target != null && Target.IsAlive) return; // 아직 살아있으면 그대로 유지

        for (int step = 1; step <= enemies.Count; step++)
        {
            int candidate = (targetIndex + step) % enemies.Count;
            if (!enemies[candidate].IsAlive) continue;

            targetIndex = candidate;
            return;
        }
    }

    private void HandlePieceLocked(TetrominoType lockedType, TSpinType tSpin, int clearedLines)
    {
        if (combatEnded || stageCleared) return; // 전투 끝났으면 무시

        // 줄을 지워서 보드가 비워진 경우만 퍼펙트 클리어 (Top Out 리셋은 해당 없음)
        bool perfectClear = clearedLines > 0 && GridManager.Instance.IsBoardEmpty();
        int damage = CombatDamage.Calculate(tSpin, clearedLines, perfectClear); // 기존 방식 그대로 계산한 피해

        // 강화 능력은 방금 고정한 조각이 강화돼 있고, 그 고정으로 줄이 지워졌을 때만 1회 발동
        // (보드에 이미 쌓여 있는 블록은 지워진 줄에 포함돼도 능력을 발동시키지 않음)
        if (clearedLines > 0 && MinoUpgrades.GetLevel(lockedType) > 0)
            ApplyUpgradedAbility(lockedType, damage);
        else
            PendingDamage += damage; // 강화가 아니면 기존대로 타겟 피해에만 합산

        piecesPlaced++;
        if (piecesPlaced >= piecesPerBag) EndPlayerTurn(); // 조각 7개 다 놓으면 턴 종료
        else OnStateChanged?.Invoke();
    }

    // 강화 미노 능력 발동. 능력 세기는 줄 수로 다시 계산하지 않고 이미 계산된 피해를 그대로 쓴다.
    private void ApplyUpgradedAbility(TetrominoType lockedType, int damage)
    {
        switch (lockedType)
        {
            case TetrominoType.I: // 관통: 타겟 대신 살아있는 적 전체가 같은 피해를 받음
                pendingPierceDamage += damage;
                break;

            case TetrominoType.J: // 치명타: 항상 2배 피해
                PendingDamage += damage * CriticalMultiplier;
                break;

            case TetrominoType.O: // 방어막: 기본 피해에 더해 2배만큼 보호막을 쌓음
                PendingDamage += damage;
                pendingShield += damage * ShieldMultiplier;
                break;

            case TetrominoType.T: // 독: 기본 피해 후 0.7배 피해를 2턴 동안 (중첩)
                PendingDamage += damage;
                pendingPoisons.Add(Mathf.RoundToInt(damage * PoisonRatio));
                break;

            case TetrominoType.S: // 회복: 기본 피해에 더해 3배만큼 회복
                PendingDamage += damage;
                pendingHeal += damage * HealMultiplier;
                break;

            case TetrominoType.Z: // 폭발: 기본 피해 후 인접한 다른 적 1명에게 0.7배 피해
                PendingDamage += damage;
                pendingExplosionDamage += Mathf.RoundToInt(damage * ExplosionRatio);
                break;

            case TetrominoType.L: // 빙결: 기본 피해 후 1턴 빙결, 끝날 때 0.5배 추가 피해
                PendingDamage += damage;
                pendingFreezeDamage = Mathf.Max(pendingFreezeDamage, damage); // 보스 조건은 가장 큰 피해로 판정
                pendingFreezeBreakDamage += Mathf.RoundToInt(damage * FreezeBreakRatio);
                break;
        }
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
                target.ApplyFreeze(pendingFreezeBreakDamage, FreezeTurns);
        }

        if (pendingExplosionDamage > 0)
        {
            Enemy neighbour = FindExplosionNeighbour(); // 근처에 다른 적이 있을 때만 폭발
            if (neighbour != null) neighbour.TakeDamage(pendingExplosionDamage);
        }

        if (pendingPierceDamage > 0)
            foreach (Enemy enemy in enemies)
                if (enemy.IsAlive) enemy.TakeDamage(pendingPierceDamage); // 관통은 살아있는 적 전체

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
        pendingFreezeDamage = 0;
        pendingFreezeBreakDamage = 0;
        pendingPoisons.Clear();
    }

    private void EndPlayerTurn()
    {
        Enemy target = Target;
        if (target != null && target.IsAlive)
            target.TakeDamage(PendingDamage); // 누적 피해는 타겟 한 마리에게만, 초과분은 소멸

        ResolveUpgradedAbilities(target); // 강화 능력 효과도 같은 시점에 정산

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
        OnStageCleared?.Invoke(stageNumber); // 보상 화면이 구독해서 처리
    }

    // 보상 화면에서 회복을 고르면 호출 (최대 체력을 넘지 않음)
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
        PendingDamage = 0; // 이월된 누적 피해 없음
        stageCleared = false; // 새 스테이지는 아직 클리어 전

        pendingPierceDamage = 0; // 쌓다 만 강화 능력 효과도 이월하지 않음
        pendingShield = 0;
        pendingHeal = 0;
        pendingExplosionDamage = 0;
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

        foreach (Enemy enemy in enemies)
        {
            if (!enemy.IsAlive) continue; // 죽은 적은 행동하지 않음

            enemy.TakeDamage(enemy.TickPoison()); // 독은 행동 전에 먼저 적용
            if (!enemy.IsAlive) continue; // 독으로 죽었으면 행동하지 않음

            bool wasFrozen = enemy.IsFrozen; // 이번 턴에 얼어 있었는지
            int breakDamage = enemy.TickFreeze(); // 빙결 턴을 줄이고, 끝났으면 파괴 피해를 받음
            if (breakDamage > 0) enemy.TakeDamage(breakDamage);

            if (wasFrozen) continue; // 얼어 있던 적은 이번 턴에 행동하지 않음
            if (!enemy.IsAlive) continue; // 파괴 피해로 죽었으면 행동하지 않음

            if (enemy.AdvanceTurnAndCheckSkill())
                garbageLines += enemy.RollGarbageLines(); // 능력 턴인 적은 방해 줄만 추가
            else
                hpDamage += enemy.AttackDamage; // 나머지 적은 체력 공격만
        }

        if (garbageLines > 0) GridManager.Instance.AddGarbageLines(garbageLines); // 방해 줄은 한 번에 쌓음

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
