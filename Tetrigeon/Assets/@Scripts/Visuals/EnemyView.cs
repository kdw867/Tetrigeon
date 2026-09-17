using UnityEngine;

// 적의 임시 외형과 체력 표시. 실제 아트가 나오면 스프라이트만 교체하면 된다.
[RequireComponent(typeof(Enemy))]
[RequireComponent(typeof(SpriteRenderer))]
public class EnemyView : MonoBehaviour
{
    private static readonly Color NormalColor = new Color(0.75f, 0.25f, 0.25f); // 일반 등급 색
    private static readonly Color EpicColor = new Color(0.62f, 0.30f, 0.78f); // 에픽 등급 색
    private static readonly Color BossColor = new Color(0.85f, 0.55f, 0.15f); // 보스 등급 색

    private Enemy enemy; // 표시할 적
    private SpriteRenderer body; // 몸통 스프라이트
    private TextMesh hpText; // 체력 텍스트
    private TextMesh targetMarker; // 현재 타겟임을 알리는 화살표

    private void Awake()
    {
        enemy = GetComponent<Enemy>();

        body = GetComponent<SpriteRenderer>(); // 프리팹에 붙어있는 렌더러 재사용 (중복 추가 방지)
        body.sprite = PieceVisuals.GetSquareSprite(); // ponytail: 전용 아트 나오면 교체
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
        body.color = enemy.Tier == EnemyTier.Boss ? BossColor : enemy.Tier == EnemyTier.Epic ? EpicColor : NormalColor; // 등급별 색
        body.enabled = enemy.IsAlive; // 죽은 적은 몸통을 숨김

        hpText.text = enemy.IsAlive ? $"{enemy.Hp}/{enemy.MaxHp}  SKILL {enemy.TurnsUntilSkill}" : "DEAD"; // 체력과 능력까지 남은 턴
        targetMarker.gameObject.SetActive(isTarget && enemy.IsAlive); // 살아있는 타겟에만 화살표 표시
    }
}
