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

    public int PlayerHp { get; private set; } // 현재 플레이어 체력
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

    private void HandlePieceLocked(TSpinType tSpin, int clearedLines)
    {
        if (combatEnded || stageCleared) return; // 전투 끝났으면 무시

        // 줄을 지워서 보드가 비워진 경우만 퍼펙트 클리어 (Top Out 리셋은 해당 없음)
        bool perfectClear = clearedLines > 0 && GridManager.Instance.IsBoardEmpty();
        PendingDamage += CombatDamage.Calculate(tSpin, clearedLines, perfectClear); // 이번 가방 피해에 합산

        piecesPlaced++;
        if (piecesPlaced >= piecesPerBag) EndPlayerTurn(); // 조각 7개 다 놓으면 턴 종료
        else OnStateChanged?.Invoke();
    }

    private void EndPlayerTurn()
    {
        Enemy target = Target;
        if (target != null && target.IsAlive)
            target.TakeDamage(PendingDamage); // 누적 피해는 타겟 한 마리에게만, 초과분은 소멸

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

            if (enemy.AdvanceTurnAndCheckSkill())
                garbageLines += enemy.RollGarbageLines(); // 능력 턴인 적은 방해 줄만 추가
            else
                hpDamage += enemy.AttackDamage; // 나머지 적은 체력 공격만
        }

        if (garbageLines > 0) GridManager.Instance.AddGarbageLines(garbageLines); // 방해 줄은 한 번에 쌓음
        PlayerHp -= hpDamage; // 체력 공격 합계 적용

        if (PlayerHp <= 0)
        {
            PlayerHp = 0;
            EndCombat(false); // 플레이어 체력 0 이하면 패배
            return;
        }

        OnStateChanged?.Invoke();
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
