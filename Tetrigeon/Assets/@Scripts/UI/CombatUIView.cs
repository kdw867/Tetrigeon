using UnityEngine;

// 전투 상태(체력, 이번 턴 누적 피해, 스테이지/타겟)를 월드 좌표 텍스트로, 남은 조각 수는 룬 계기판으로 표시
public class CombatUIView : MonoBehaviour
{
    [SerializeField] private TextMesh playerHpText; // 플레이어 체력 표시
    [SerializeField] private TextMesh enemyHpText; // 스테이지와 남은 적 수 표시
    [SerializeField] private TextMesh turnText; // 이번 턴 누적 피해 표시
    [SerializeField] private SpriteRenderer[] runeRenderers; // 남은 조각 수를 보여줄 룬 7개 (화면 왼쪽부터 01~07)
    [SerializeField] private Sprite[] runeOnSprites; // 룬별 켜진 이미지 (runeRenderers와 같은 순서)
    [SerializeField] private Sprite[] runeOffSprites; // 룬별 꺼진 이미지 (runeRenderers와 같은 순서)

    private void OnEnable()
    {
        CombatManager.OnStateChanged += UpdateDisplay; // 전투 상태 바뀔 때마다 갱신
    }

    private void OnDisable()
    {
        CombatManager.OnStateChanged -= UpdateDisplay; // 이벤트 구독 해제
    }

    private void Start()
    {
        UpdateDisplay(); // 매니저들의 Awake가 모두 끝난 뒤 첫 상태를 표시
    }

    private void UpdateDisplay()
    {
        CombatManager combat = CombatManager.Instance;
        if (combat == null) return; // 전투 매니저 없으면 표시할 것 없음

        string shield = combat.PlayerShield > 0 ? $"  [보호막 {combat.PlayerShield}]" : ""; // 보호막이 있을 때만 표시
        playerHpText.text = $"PLAYER  {combat.PlayerHp} / {combat.PlayerMaxHp}{shield}"; // 플레이어 체력

        int alive = 0;
        foreach (Enemy enemy in combat.Enemies)
            if (enemy.IsAlive) alive++; // 살아있는 적 수 집계

        enemyHpText.text = $"STAGE {combat.StageNumber}\nENEMIES {alive} / {combat.Enemies.Count}\n[TAB] TARGET"; // 스테이지와 남은 적
        turnText.text = $"DMG {combat.PendingDamage}"; // 이번 턴 누적 피해

        int remaining = Mathf.Clamp(combat.PiecesLeftInBag, 0, runeRenderers.Length); // 남은 조각 수를 0~7로 제한
        for (int i = 0; i < runeRenderers.Length; i++)
            runeRenderers[i].sprite = i < remaining ? runeOnSprites[i] : runeOffSprites[i]; // 왼쪽부터 남은 수만큼 켜고 나머지는 꺼진 이미지로 교체

        foreach (Enemy enemy in combat.Enemies)
        {
            EnemyView view = enemy.GetComponent<EnemyView>();
            if (view != null) view.UpdateDisplay(enemy == combat.Target, combat.GetDamageReductionPercent(enemy)); // 각 적이 자기 체력·타겟·피해 감소 표시를 갱신
        }
    }
}
