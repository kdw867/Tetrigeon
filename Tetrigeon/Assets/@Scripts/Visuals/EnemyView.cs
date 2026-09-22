using UnityEngine;

// 적의 외형과 체력 표시. 등급별 아트를 프리팹에 연결해서 쓴다.
[RequireComponent(typeof(Enemy))]
[RequireComponent(typeof(SpriteRenderer))]
public class EnemyView : MonoBehaviour
{
    [SerializeField] private Sprite normalSprite; // 일반: Crystal Larva
    [SerializeField] private Sprite epicSprite; // 에픽: Amethyst Guardian
    [SerializeField] private Sprite bossSprite; // 보스: Crystal Queen
    [SerializeField] private float labelMargin = 0.2f; // 몸통과 텍스트 사이 간격

    private Enemy enemy; // 표시할 적
    private SpriteRenderer body; // 몸통 스프라이트
    private TextMesh hpText; // 체력 텍스트
    private TextMesh targetMarker; // 현재 타겟임을 알리는 화살표

    private void Awake()
    {
        enemy = GetComponent<Enemy>();

        body = GetComponent<SpriteRenderer>(); // 프리팹에 붙어있는 렌더러 재사용 (중복 추가 방지)
        body.sortingOrder = 5; // 배경보다 앞, 블록보다 뒤

        hpText = CreateLabel("HpText", new Vector3(0f, -0.75f, 0f), 0.05f, Color.white); // 몸통 아래 체력
        targetMarker = CreateLabel("TargetMarker", new Vector3(0f, 0.85f, 0f), 0.06f, new Color(1f, 0.9f, 0.4f)); // 몸통 위 타겟 표시
        targetMarker.text = "▼";
    }

    // 월드 좌표 텍스트를 자식으로 생성 (기존 라벨들과 같은 방식)
    private TextMesh CreateLabel(string name, Vector3 localPosition, float characterSize, Color color)
    {
        GameObject label = new GameObject(name);
        label.transform.SetParent(transform, false);
        label.transform.localPosition = localPosition;
        label.transform.localScale = Vector3.one; // 몸통 스케일의 영향을 받지 않도록 고정값 사용

        TextMesh text = label.AddComponent<TextMesh>();
        text.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
        text.fontSize = 32;
        text.characterSize = characterSize;
        text.anchor = TextAnchor.MiddleCenter;
        text.alignment = TextAlignment.Center;
        text.color = color;
        label.GetComponent<MeshRenderer>().sharedMaterial = text.font.material;
        label.GetComponent<MeshRenderer>().sortingOrder = 11; // 다른 UI 텍스트와 같은 순서
        return text;
    }

    // 체력·타겟 표시 갱신 (전투 상태가 바뀔 때 CombatManager가 호출)
    public void UpdateDisplay(bool isTarget)
    {
        body.sprite = GetTierSprite(); // 등급별 아트 적용
        body.enabled = enemy.IsAlive; // 죽은 적은 몸통을 숨김

        PlaceLabels(); // 아트 크기에 맞춰 체력·타겟 표시 위치를 잡음

        string status = enemy.IsFrozen ? "  [빙결]" : ""; // 빙결 표시
        if (enemy.PoisonCount > 0) status += $"  [독 x{enemy.PoisonCount}]"; // 걸려 있는 독 개수 표시
        hpText.text = enemy.IsAlive ? $"{enemy.Hp}/{enemy.MaxHp}  SKILL {enemy.TurnsUntilSkill}{status}" : "DEAD"; // 체력과 능력까지 남은 턴
        targetMarker.gameObject.SetActive(isTarget && enemy.IsAlive); // 살아있는 타겟에만 화살표 표시
    }

    // 등급에 맞는 아트 선택
    private Sprite GetTierSprite()
    {
        switch (enemy.Tier)
        {
            case EnemyTier.Epic: return epicSprite;
            case EnemyTier.Boss: return bossSprite;
            default: return normalSprite;
        }
    }

    // 몸통 크기가 등급마다 달라서, 아트의 위아래 끝에 맞춰 텍스트를 배치한다
    private void PlaceLabels()
    {
        float halfHeight = body.sprite != null ? body.sprite.bounds.extents.y : 0.5f; // 아트 절반 높이
        hpText.transform.localPosition = new Vector3(0f, -halfHeight - labelMargin, 0f); // 몸통 아래
        targetMarker.transform.localPosition = new Vector3(0f, halfHeight + labelMargin, 0f); // 몸통 위
    }
}
