using UnityEngine;

// 적의 외형과 체력 표시. 등급별 아트를 프리팹에 연결해서 쓴다.
[RequireComponent(typeof(Enemy))]
[RequireComponent(typeof(SpriteRenderer))]
public class EnemyView : MonoBehaviour
{
    [SerializeField] private Sprite normalSprite; // 일반: Crystal Larva
    [SerializeField] private Sprite epicSprite; // 에픽: Amethyst Sentinel
    [SerializeField] private Sprite bossSprite; // 보스: Crystal Queen
    [SerializeField] private SpriteRenderer normalIdleBody; // 일반 몬스터의 Idle 애니메이션 렌더러
    [SerializeField] private SpriteRenderer epicIdleBody; // 에픽 몬스터의 Idle 애니메이션 렌더러
    [SerializeField] private SpriteRenderer bossIdleBody; // 보스 몬스터의 Idle 애니메이션 렌더러
    [SerializeField] private SpriteRenderer normalDeathBody; // 일반 몬스터의 사망 정지 이미지
    [SerializeField] private SpriteRenderer epicDeathBody; // 에픽 몬스터의 사망 정지 이미지
    [SerializeField] private SpriteRenderer bossDeathBody; // 보스 몬스터의 사망 정지 이미지
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
        hpText.anchor = TextAnchor.UpperCenter; // 여러 줄이라 위를 기준으로 아래로 늘어나게 함
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
    public void UpdateDisplay(bool isTarget, int damageReductionPercent)
    {
        body.sprite = GetTierSprite(); // 등급별 아트 적용
        bool useNormalIdle = enemy.Tier == EnemyTier.Normal && normalIdleBody != null; // 일반 등급에만 Idle 사용
        bool useEpicIdle = enemy.Tier == EnemyTier.Epic && epicIdleBody != null; // 에픽 등급에만 Idle 사용
        bool useBossIdle = enemy.Tier == EnemyTier.Boss && bossIdleBody != null; // 보스 등급에만 Idle 사용
        body.enabled = enemy.IsAlive && !useNormalIdle && !useEpicIdle && !useBossIdle; // Idle 사용 시 정지 이미지 중복 표시 방지
        if (normalIdleBody != null) normalIdleBody.gameObject.SetActive(useNormalIdle && enemy.IsAlive); // 사망하거나 다른 등급이면 애니메이션 숨김
        if (epicIdleBody != null) epicIdleBody.gameObject.SetActive(useEpicIdle && enemy.IsAlive); // 에픽도 같은 규칙으로 숨김
        if (bossIdleBody != null) bossIdleBody.gameObject.SetActive(useBossIdle && enemy.IsAlive); // 보스도 같은 규칙으로 숨김

        // 사망 이미지는 등급별로 따로 두어 Idle 애니메이터가 스프라이트를 덮어쓸 수 없게 한다
        bool dead = !enemy.IsAlive; // 체력이 0 이하면 사망 표시로 전환
        if (normalDeathBody != null) normalDeathBody.gameObject.SetActive(dead && enemy.Tier == EnemyTier.Normal);
        if (epicDeathBody != null) epicDeathBody.gameObject.SetActive(dead && enemy.Tier == EnemyTier.Epic);
        if (bossDeathBody != null) bossDeathBody.gameObject.SetActive(dead && enemy.Tier == EnemyTier.Boss);

        PlaceLabels(); // 아트 크기에 맞춰 체력·타겟 표시 위치를 잡음

        hpText.gameObject.SetActive(!dead); // 죽으면 체력·스킬·상태이상 표시를 모두 감춤 (DEAD 문구도 쓰지 않음)
        targetMarker.gameObject.SetActive(isTarget && !dead); // 살아있는 타겟에만 화살표 표시
        if (dead) return; // 사망한 적은 사망 이미지 외에 갱신할 표시가 없음

        // 적이 붙어 있어도 옆 적과 겹치지 않게 줄을 나눠 표시한다
        string status = damageReductionPercent > 0 ? $"피해 -{damageReductionPercent}% " : ""; // 호위가 살아있어 피해가 줄어드는 중
        if (enemy.IsFrozen) status += "빙결 "; // 빙결 표시
        if (enemy.PoisonCount > 0) status += $"독 x{enemy.PoisonCount}"; // 걸려 있는 독 개수 표시
        if (status.Length > 0) status = "\n" + status; // 상태이상은 따로 한 줄 더

        hpText.text = $"{enemy.Hp}/{enemy.MaxHp}\nSKILL {enemy.TurnsUntilSkill}{status}"; // 체력과 능력까지 남은 턴
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
        if (enemy.Tier == EnemyTier.Normal && normalIdleBody != null) // 투명 셀 여백 대신 실제 몸 높이로 라벨 배치
        {
            float floorY = normalIdleBody.transform.localPosition.y; // 발바닥 피벗의 고정 높이
            float height = 28f / normalIdleBody.sprite.pixelsPerUnit; // 모든 프레임을 포함하는 고정 몸 높이
            hpText.anchor = TextAnchor.LowerCenter; // 체력 표시가 위쪽으로 쌓이도록 설정
            hpText.transform.localPosition = new Vector3(0f, floorY + height + 0.05f, 0f); // 아래쪽 스테이지 UI와 겹치지 않게 몸 위로 배치
            targetMarker.transform.localPosition = new Vector3(0f, floorY + height + 0.8f, 0f); // 고정 체력 표시 위에 타겟 화살표 배치
            return; // 에픽·보스의 기존 배치는 그대로 사용
        }
        if (enemy.Tier == EnemyTier.Epic && epicIdleBody != null) // 발바닥 피벗이라 정지 아트 기준 계산을 쓸 수 없음
        {
            float epicFloorY = epicIdleBody.transform.localPosition.y; // 발바닥 피벗의 고정 높이
            float epicHeight = 74f / epicIdleBody.sprite.pixelsPerUnit; // 발바닥 위로 올라오는 고정 몸 높이
            hpText.anchor = TextAnchor.UpperCenter; // 기존 에픽처럼 체력은 몸 아래에 배치
            hpText.transform.localPosition = new Vector3(0f, epicFloorY - 0.05f, 0f); // 발밑으로 조금 내림
            targetMarker.transform.localPosition = new Vector3(0f, epicFloorY + epicHeight + 0.15f, 0f); // 머리 위 수정보다 위에 화살표
            return;
        }

        if (enemy.Tier == EnemyTier.Boss && bossIdleBody != null) // 셀에 투명 여백이 많아 정지 아트 기준 계산을 쓸 수 없음
        {
            float pivotY = bossIdleBody.transform.localPosition.y; // 셀 고정 기준점 높이
            float ppu = bossIdleBody.sprite.pixelsPerUnit;
            float bottomY = pivotY - 60f / ppu; // 보이는 하단 수정은 기준점보다 60픽셀 아래
            float topY = pivotY + 58f / ppu; // 가장 높은 결정은 기준점보다 58픽셀 위
            hpText.anchor = TextAnchor.UpperCenter; // 기존 보스처럼 체력은 몸 아래에 배치
            hpText.transform.localPosition = new Vector3(0f, bottomY - 0.05f, 0f); // 하단 수정 아래로 조금 내림
            targetMarker.transform.localPosition = new Vector3(-0.55f, topY - 0.15f, 0f); // 높은 날개 옆에 표시해 화면 상단 잘림 방지
            return;
        }

        hpText.anchor = TextAnchor.UpperCenter; // Idle 참조가 없을 때의 기존 배치 유지
        float halfHeight = body.sprite != null ? body.sprite.bounds.extents.y : 0.5f; // 아트 절반 높이
        hpText.transform.localPosition = new Vector3(0f, -halfHeight - labelMargin, 0f); // 몸통 아래
        targetMarker.transform.localPosition = new Vector3(0f, halfHeight + labelMargin, 0f); // 몸통 위
    }
}

