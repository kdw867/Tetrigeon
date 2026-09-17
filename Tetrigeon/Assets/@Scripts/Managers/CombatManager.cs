using System;
using UnityEngine;

// 전투 진행 담당: 가방 한 개(조각 7개) = 플레이어 턴, 가방 끝에 누적 피해를 한 번에 적용한 뒤 적 턴
public class CombatManager : MonoBehaviour
{
    public static CombatManager Instance { get; private set; }

    public static event Action OnStateChanged; // HP/누적 피해/남은 조각 수 바뀔 때 알림 (UI용)
    public static event Action<bool> OnCombatEnded; // 전투 종료 알림 (true = 플레이어 승리)

    [SerializeField] private int playerMaxHp = 100; // 플레이어 최대 체력
    [SerializeField] private int enemyMaxHp = 60; // 적 최대 체력
    [SerializeField] private int enemyAttackDamage = 8; // 적 턴마다 플레이어가 받는 피해
    [SerializeField] private int enemyGarbageLines = 2; // 능력 사용 턴에 보드 아래 쌓이는 방해 줄 수
    [SerializeField] private int enemySkillInterval = 3; // 적이 방해 줄 능력을 쓰는 주기 (턴)
    [SerializeField] private float topOutHpPenaltyRatio = 0.3f; // Top Out 시 최대 체력 대비 잃는 비율
    [SerializeField] private int piecesPerBag = 7; // 한 턴에 배치하는 조각 수

    public int PlayerHp { get; private set; } // 현재 플레이어 체력
    public int EnemyHp { get; private set; } // 현재 적 체력
    public int PlayerMaxHp => playerMaxHp;
    public int EnemyMaxHp => enemyMaxHp;
    public int PendingDamage { get; private set; } // 이번 가방에서 누적된 피해 (아직 미적용)
    public int PiecesLeftInBag => piecesPerBag - piecesPlaced; // 이번 턴에 남은 조각 수
    public int TurnsUntilEnemySkill => enemySkillInterval - turnsSinceSkill; // 적 능력 발동까지 남은 턴

    private int piecesPlaced; // 이번 가방에서 배치한 조각 수
    private int turnsSinceSkill; // 적이 마지막으로 능력을 쓴 뒤 지난 턴 수
    private bool combatEnded; // 승패가 이미 결정됐는지

    private void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject); // 중복 인스턴스 제거
            return;
        }
        Instance = this;

        PlayerHp = playerMaxHp; // 체력 초기화
        EnemyHp = enemyMaxHp;
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

    private void HandlePieceLocked(TSpinType tSpin, int clearedLines)
    {
        if (combatEnded) return; // 전투 끝났으면 무시

        // 줄을 지워서 보드가 비워진 경우만 퍼펙트 클리어 (Top Out 리셋은 해당 없음)
        bool perfectClear = clearedLines > 0 && GridManager.Instance.IsBoardEmpty();
        PendingDamage += CombatDamage.Calculate(tSpin, clearedLines, perfectClear); // 이번 가방 피해에 합산

        piecesPlaced++;
        if (piecesPlaced >= piecesPerBag) EndPlayerTurn(); // 조각 7개 다 놓으면 턴 종료
        else OnStateChanged?.Invoke();
    }

    private void EndPlayerTurn()
    {
        EnemyHp -= PendingDamage; // 누적 피해를 한 번에 적용
        PendingDamage = 0;
        piecesPlaced = 0;

        if (EnemyHp <= 0)
        {
            EnemyHp = 0;
            EndCombat(true); // 적 체력 0 이하면 승리
            return;
        }

        EnemyTurn();
    }

    private void EnemyTurn()
    {
        PlayerHp -= enemyAttackDamage; // 적 기본 공격: 매 턴 체력 피해

        turnsSinceSkill++;
        if (turnsSinceSkill >= enemySkillInterval) // 주기가 되면 방해 줄 능력 사용
        {
            turnsSinceSkill = 0;
            GridManager.Instance.AddGarbageLines(enemyGarbageLines);
        }

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
        if (combatEnded) return; // 전투 끝났으면 무시

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
