using UnityEngine;

// 전투 상태(체력, 이번 턴 누적 피해, 남은 조각 수)를 월드 좌표 텍스트로 표시
public class CombatUIView : MonoBehaviour
{
    [SerializeField] private TextMesh playerHpText; // 플레이어 체력 표시
    [SerializeField] private TextMesh enemyHpText; // 적 체력 표시
    [SerializeField] private TextMesh turnText; // 남은 조각 수와 누적 피해 표시

    private void OnEnable()
    {
        CombatManager.OnStateChanged += UpdateDisplay; // 전투 상태 바뀔 때마다 갱신
    }

    private void Start()
    {
        UpdateDisplay(); // 매니저들의 Awake가 모두 끝난 뒤 첫 상태를 표시
    }

    private void OnDisable()
    {
        CombatManager.OnStateChanged -= UpdateDisplay; // 이벤트 구독 해제
    }

    private void UpdateDisplay()
    {
        CombatManager combat = CombatManager.Instance;
        if (combat == null) return; // 전투 매니저 없으면 표시할 것 없음

        playerHpText.text = $"PLAYER  {combat.PlayerHp} / {combat.PlayerMaxHp}"; // 플레이어 체력
        enemyHpText.text = $"ENEMY  {combat.EnemyHp} / {combat.EnemyMaxHp}\nSKILL IN {combat.TurnsUntilEnemySkill}"; // 적 체력과 능력 발동까지 남은 턴
        turnText.text = $"PIECES {combat.PiecesLeftInBag}   DMG {combat.PendingDamage}"; // 이번 턴 진행 상황
    }
}
