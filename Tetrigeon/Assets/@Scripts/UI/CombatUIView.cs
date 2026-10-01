using UnityEngine;

// 전투 상태(체력, 이번 턴 누적 피해, 스테이지/타겟)를 월드 좌표 텍스트로, 남은 조각 수는 룬 계기판으로 표시
public class CombatUIView : MonoBehaviour
{
    [SerializeField] private TextMesh playerHpText; // 플레이어 체력 표시
    [SerializeField] private TextMesh enemyHpText; // 스테이지와 남은 적 수 표시
    [SerializeField] private TextMesh turnText; // 이번 턴 일반 공격 피해 "n DMG" (피해 아이콘 오른쪽)
    [SerializeField] private SpriteRenderer damageIcon; // 누적 피해 숫자 앞에 붙는 기본 피해 아이콘
    [SerializeField] private SpriteRenderer[] runeRenderers; // 남은 조각 수를 보여줄 룬 7개 (화면 왼쪽부터 01~07)
    [SerializeField] private Sprite[] runeOnSprites; // 룬별 켜진 이미지 (runeRenderers와 같은 순서)
    [SerializeField] private Sprite[] runeOffSprites; // 룬별 꺼진 이미지 (runeRenderers와 같은 순서)

    [SerializeField] private Transform[] effectRows; // I J L O S T Z 순서의 강화 내역 행
    [SerializeField] private TextMesh[] effectTexts; // 각 행의 횟수와 효과량


    private const float DamageIconGap = 0.04f; // 피해 아이콘과 숫자 사이 간격 (월드 단위)

    private MeshRenderer turnTextRenderer; // 누적 피해 숫자의 폭을 재는 렌더러

    private void Awake()
    {
        turnTextRenderer = turnText.GetComponent<MeshRenderer>(); // 숫자 텍스트에 붙은 렌더러를 한 번만 찾아 둠
    }

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
        turnText.text = $"{combat.NormalAttackDamage} DMG"; // 일반 공격 피해임을 단위로 표시
        UpdateEffectDisplay(combat); // 현재 가방에 발동한 효과만 표시
        PlaceDamageGroup(); // 자릿수가 바뀌어도 아이콘과 숫자가 한 묶음으로 가운데 오게 다시 배치

        int remaining = Mathf.Clamp(combat.PiecesLeftInBag, 0, runeRenderers.Length); // 남은 조각 수를 0~7로 제한
        for (int i = 0; i < runeRenderers.Length; i++)
            runeRenderers[i].sprite = i < remaining ? runeOnSprites[i] : runeOffSprites[i]; // 왼쪽부터 남은 수만큼 켜고 나머지는 꺼진 이미지로 교체

        foreach (Enemy enemy in combat.Enemies)
        {
            EnemyView view = enemy.GetComponent<EnemyView>();
            if (view != null) view.UpdateDisplay(enemy == combat.Target, combat.GetDamageReductionPercent(enemy)); // 각 적이 자기 체력·타겟·피해 감소 표시를 갱신
        }
    }

    private void UpdateEffectDisplay(CombatManager combat) // 몬스터 상태 UI와 독립적으로 가방 효과를 갱신
    {
        int shown = 0; // 빈 줄 없이 배치할 행 번호
        for (int i = 0; i < effectRows.Length; i++) // 연결된 일곱 효과 순회
        {
            TetrominoType type = (TetrominoType)i; // 미노별 효과 조회
            int count = combat.GetEffectCount(type); // 발동 횟수
            effectRows[i].gameObject.SetActive(count > 0); // 발동하지 않은 행 숨김
            if (count == 0) continue; // 빈 효과 건너뜀
            int total = combat.GetEffectTotal(type); // 이번 가방의 효과 합계
            switch (type) // 아이콘 옆에 피해와 지속시간을 다른 단위로 표시
            {
                case TetrominoType.J: effectTexts[i].text = $"FREEZE {combat.PendingFreezeTurns}T"; break; // 실제 정산 예정 빙결 지속시간 표시
                case TetrominoType.T: effectTexts[i].text = $"2T × {total} DMG"; break; // 새 독 전체의 턴당 피해 합계와 지속시간
                case TetrominoType.O: effectTexts[i].text = $"SHIELD +{total}"; break; // 보호막은 피해와 구분
                case TetrominoType.S: effectTexts[i].text = $"HEAL +{total}"; break; // 회복은 피해와 구분
                case TetrominoType.Z: effectTexts[i].text = $"EXPLOSION {total} DMG"; break; // 폭발 피해 표시
                default: effectTexts[i].text = $"{total} DMG"; break; // 관통과 치명타는 아이콘과 피해량 표시
            }
            effectRows[i].localPosition = new Vector3(0f, -0.36f * (++shown), 0f); // 기본 공격 아래로 압축 배치
        }
    }

    // 아이콘 + 숫자 묶음 전체의 가운데가 부모 위치(룬 계기판 중앙)에 오도록 좌우로 배치한다
    // 부모와 UI 그룹 배율이 1이라 렌더러의 월드 폭을 로컬 위치에 그대로 쓴다
    private void PlaceDamageGroup()
    {
        float iconWidth = damageIcon.bounds.size.x; // 아이콘 폭
        float numberWidth = turnTextRenderer.bounds.size.x; // 방금 바꾼 숫자의 폭 (자릿수에 따라 달라짐)
        float left = -(iconWidth + DamageIconGap + numberWidth) / 2f; // 묶음의 왼쪽 끝
        damageIcon.transform.localPosition = new Vector3(left + iconWidth / 2f, 0f, 0f); // 아이콘은 묶음 왼쪽 끝부터
        turnText.transform.localPosition = new Vector3(left + iconWidth + DamageIconGap, 0f, 0f); // 숫자는 아이콘 오른쪽 (왼쪽 기준 정렬)
    }
}
