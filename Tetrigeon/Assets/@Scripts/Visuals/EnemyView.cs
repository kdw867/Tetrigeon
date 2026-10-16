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
    [SerializeField] private Transform statusRow; // 체력 표시 아래 상태이상 아이콘 줄 (월드 배율 1이 되도록 프리팹에서 루트 배율을 상쇄)
    [SerializeField] private SpriteRenderer poisonIcon; // 독 아이콘 (자식으로 숫자 텍스트를 가짐)
    [SerializeField] private TextMesh poisonTurnsText; // 독 아이콘 오른쪽 숫자
    [SerializeField] private SpriteRenderer freezeIcon; // 빙결 아이콘 (자식으로 숫자 텍스트를 가짐)
    [SerializeField] private TextMesh freezeTurnsText; // 빙결로 앞으로 더 막을 행동 수

    private const float StatusIconGap = 0.04f; // 상태이상 아이콘과 숫자 사이 간격 (월드 단위)
    private const float StatusSpacing = 0.1f; // 독 묶음과 빙결 묶음 사이 간격 (월드 단위)

    private Enemy enemy; // 표시할 적
    private SpriteRenderer body; // 몸통 스프라이트
    private TextMesh hpText; // 체력 텍스트
    private MeshRenderer hpTextRenderer; // 체력 텍스트 높이를 재는 렌더러
    private MeshRenderer poisonTurnsRenderer; // 독 숫자 폭을 재는 렌더러
    private MeshRenderer freezeTurnsRenderer; // 빙결 숫자 폭을 재는 렌더러
    private TextMesh targetMarker; // 현재 타겟임을 알리는 화살표
    private HpBarView hpBar; // 이 적의 체력 막대 (UI 캔버스 위, 몸통 발 아래)

    private const float BarGap = 0.05f; // 발과 막대, 막대와 글자 사이 간격 (월드 단위)

    private static readonly int SkillTrigger = Animator.StringToHash("Skill"); // 여왕 증식 능력 모션 트리거
    private static readonly int RotLockTrigger = Animator.StringToHash("RotLock"); // 여왕 회전 금지 능력 모션 트리거
    private static readonly int AttackTrigger = Animator.StringToHash("Attack"); // 공격 모션 트리거 (매번 문자열을 만들지 않도록 한 번만 계산)
    private const float LarvaAttackSeconds = 0.625f; // 애벌레 공격 모션(CrystalLarva_Attack) 길이
    private const float SentinelAttackSeconds = 1.25f; // 수호자 일반 공격 모션(AmethystSentinel_Attack) 길이
    private const float QueenMotionSeconds = 0.94f; // 여왕 공격·수정 증식·회전 금지 모션 길이 (셋 다 같음)

    private Animator normalIdleAnimator; // 일반 몬스터의 Idle·공격 애니메이터
    private Animator epicIdleAnimator; // 에픽(수호자)의 Idle·공격 애니메이터
    private Animator bossIdleAnimator; // 보스(여왕)의 Idle·공격 애니메이터

    private void Awake()
    {
        enemy = GetComponent<Enemy>();
        normalIdleAnimator = normalIdleBody != null ? normalIdleBody.GetComponent<Animator>() : null; // 공격 모션은 Idle과 같은 애니메이터에 있음
        epicIdleAnimator = epicIdleBody != null ? epicIdleBody.GetComponent<Animator>() : null; // 수호자 공격 모션도 Idle과 같은 애니메이터에 있음
        bossIdleAnimator = bossIdleBody != null ? bossIdleBody.GetComponent<Animator>() : null; // 여왕 공격 모션도 Idle과 같은 애니메이터에 있음
        enemy.Acted += PlayAttack; // 이 적이 행동(공격·능력 사용)한다는 알림을 받으면 공격 모션 재생

        body = GetComponent<SpriteRenderer>(); // 프리팹에 붙어있는 렌더러 재사용 (중복 추가 방지)
        body.sortingOrder = 5; // 배경보다 앞, 블록보다 뒤

        hpText = CreateLabel("HpText", new Vector3(0f, -0.75f, 0f), 0.05f, Color.white); // 몸통 아래 체력
        hpText.anchor = TextAnchor.UpperCenter; // 여러 줄이라 위를 기준으로 아래로 늘어나게 함
        targetMarker = CreateLabel("TargetMarker", new Vector3(0f, 0.85f, 0f), 0.06f, new Color(1f, 0.9f, 0.4f)); // 몸통 위 타겟 표시
        targetMarker.text = "▼";
        targetMarker.GetComponent<MeshRenderer>().sortingOrder = 100; // 타겟 화살표를 몬스터와 상태 표시보다 앞에 렌더링

        hpTextRenderer = hpText.GetComponent<MeshRenderer>(); // 체력 텍스트 렌더러를 한 번만 찾아 둠
        poisonTurnsRenderer = poisonTurnsText.GetComponent<MeshRenderer>(); // 독 숫자 렌더러
        freezeTurnsRenderer = freezeTurnsText.GetComponent<MeshRenderer>(); // 빙결 숫자 렌더러
        Vector3 turnsOffset = new Vector3(poisonIcon.sprite.bounds.extents.x + StatusIconGap, 0f, 0f); // 아이콘 오른쪽 끝에서 간격만큼 띄운 자리
        poisonTurnsText.transform.localPosition = turnsOffset; // 숫자는 아이콘 오른쪽에 왼쪽 기준으로 붙음
        freezeTurnsText.transform.localPosition = turnsOffset; // 두 아이콘 크기가 같아서 같은 간격 사용
    }

    // 체력 막대를 UI 부모 아래에 만든다 (CombatManager가 적 생성 직후 호출)
    public void CreateHpBar(HpBarView prefab, RectTransform root)
    {
        hpBar = Instantiate(prefab, root); // 적마다 막대 하나
    }

    private void OnDestroy()
    {
        if (enemy != null) enemy.Acted -= PlayAttack; // 이벤트 구독 해제
        if (hpBar != null) Destroy(hpBar.gameObject); // 적이 사라지면 막대도 함께 제거
    }

    // 적이 행동할 때 공격 모션을 재생 (전투 수치와 순서는 건드리지 않고, 재생한 모션의 길이만 적에게 알려 턴 연출이 모션이 끝나길 기다리게 함)
    // 애벌레는 모든 행동에 같은 모션, 수호자는 일반 공격에만 공격 모션(강공격은 폭발 연출이라 공격 모션을 쓰지 않음), 여왕은 일반 공격·수정 증식 능력·회전 금지 능력에 각각 다른 모션
    // 수호자의 능력 사용(보호막 생성)·강공격 준비·강공격(폭발)·스턴 연출은 GuardianShieldView 가 담당
    private void PlayAttack(EnemyActionKind kind)
    {
        Animator animator = null; // 이번 행동에 재생할 애니메이터 (모션이 없으면 null)
        int trigger = AttackTrigger; // 재생할 모션 트리거 (기본은 공격)
        float seconds = 0f; // 이번 모션의 길이 (턴 연출이 이만큼 기다림)
        if (enemy.Tier == EnemyTier.Normal) { animator = normalIdleAnimator; seconds = LarvaAttackSeconds; } // 애벌레: 체력 공격과 능력 사용 모두 같은 모션
        else if (enemy.Tier == EnemyTier.Epic && kind == EnemyActionKind.BasicAttack) { animator = epicIdleAnimator; seconds = SentinelAttackSeconds; } // 수호자: 일반 공격만
        else if (enemy.Tier == EnemyTier.Boss && kind == EnemyActionKind.QueenGrowth) { animator = bossIdleAnimator; trigger = SkillTrigger; seconds = QueenMotionSeconds; } // 여왕: 수정 증식 능력일 때는 왕관 연출
        else if (enemy.Tier == EnemyTier.Boss && kind == EnemyActionKind.QueenRotationLock) { animator = bossIdleAnimator; trigger = RotLockTrigger; seconds = QueenMotionSeconds; } // 여왕: 회전 금지 능력일 때는 회전 룬과 자물쇠 연출
        else if (enemy.Tier == EnemyTier.Boss && kind == EnemyActionKind.BasicAttack) { animator = bossIdleAnimator; seconds = QueenMotionSeconds; } // 여왕: 체력 공격(일반 공격)일 때만
        if (animator == null || !animator.gameObject.activeInHierarchy) return; // 모션이 없거나 숨겨진 상태(사망 등)에서는 재생하지 않음
        animator.SetTrigger(trigger); // Idle에서 공격으로 넘어가고, 끝나면 스스로 Idle로 돌아옴
        enemy.ReportMotion(seconds); // 모션을 실제로 재생한 때만 길이를 알림 (턴 연출이 모션이 끝날 때까지 기다림)
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
        hpBar.gameObject.SetActive(!dead); // 체력 막대도 함께 감춤
        statusRow.gameObject.SetActive(!dead); // 죽으면 독·빙결 아이콘과 숫자도 모두 감춤
        targetMarker.gameObject.SetActive(isTarget && !dead); // 살아있는 타겟에만 화살표 표시
        if (dead) return; // 사망한 적은 사망 이미지 외에 갱신할 표시가 없음

        // 적이 붙어 있어도 옆 적과 겹치지 않게 줄을 나눠 표시한다
        string status = damageReductionPercent > 0 ? $"피해 -{damageReductionPercent}%" : ""; // 호위가 살아있어 피해가 줄어드는 중
        if (enemy.Shield > 0) status += $"\n보호막 {enemy.Shield}"; // 수호자 보호막 남은 양
        if (enemy.ChargeActionsLeft > 0) status += $"\n강공격 {enemy.ChargeActionsLeft}"; // 강공격까지 남은 수호자 행동 수
        if (enemy.IsStunned) status += "\n스턴"; // 보호막이 깨져 행동을 쉼 (쉰 뒤 다음 행동 전까지 표시)

        hpBar.SetHp(enemy.Hp, enemy.MaxHp); // 체력은 막대와 가운데 숫자로
        hpBar.SetSkill(enemy.TurnsUntilSkill); // 능력까지 남은 턴은 막대 오른쪽 아래 룬 + 숫자로 (1턴 남으면 금색)
        hpText.text = status.TrimStart('\n'); // 상태 글자는 줄마다 줄바꿈으로 시작하므로 맨 앞 줄바꿈만 제거 (독·빙결은 아래 아이콘 줄로 표시)
        UpdateStatusRow(); // 체력 텍스트 내용이 정해진 뒤 그 아래에 독·빙결 아이콘을 배치
    }

    // 독·빙결 상태를 전투 데이터에서 읽기만 해서 아이콘과 숫자로 보여주고, 있는 것만 가로로 나란히 가운데 정렬한다
    private void UpdateStatusRow()
    {
        bool poisoned = enemy.PoisonCount > 0; // 독이 하나라도 걸려 있는지
        bool frozen = enemy.IsFrozen; // 빙결이 남아 있는지
        poisonIcon.gameObject.SetActive(poisoned); // 독이 없거나 만료되면 아이콘과 숫자를 함께 숨김
        freezeIcon.gameObject.SetActive(frozen); // 빙결이 없거나 끝나면 아이콘과 숫자를 함께 숨김
        if (poisoned) poisonTurnsText.text = $"{enemy.PoisonTurnsLeft} x{enemy.PoisonCount}"; // 가장 긴 남은 턴과 독 스택 수 (턴은 합산하지 않음)
        if (frozen) freezeTurnsText.text = enemy.FreezeActionsLeft > 0 ? enemy.FreezeActionsLeft.ToString() : ""; // 더 막을 행동 수, 다 막았으면 해제 전까지 눈송이만

        float poisonWidth = poisoned ? StatusWidth(poisonIcon, poisonTurnsRenderer) : 0f; // 독 묶음 폭 (없으면 0)
        float freezeWidth = frozen ? StatusWidth(freezeIcon, freezeTurnsRenderer) : 0f; // 빙결 묶음 폭 (없으면 0)
        float spacing = poisoned && frozen ? StatusSpacing : 0f; // 둘 다 있을 때만 사이를 띄움
        float left = -(poisonWidth + spacing + freezeWidth) / 2f; // 줄 전체를 가운데 정렬했을 때의 왼쪽 끝
        float iconHalf = poisonIcon.sprite.bounds.extents.x; // 아이콘 절반 폭 (두 아이콘 크기가 같음)
        poisonIcon.transform.localPosition = new Vector3(left + iconHalf, 0f, 0f); // 독은 왼쪽
        freezeIcon.transform.localPosition = new Vector3(left + poisonWidth + spacing + iconHalf, 0f, 0f); // 빙결은 독 오른쪽 (독이 없으면 가운데)

        PlaceStatusRow(poisoned || frozen); // 줄을 체력 표시 바로 아래로 옮김
    }

    // 아이콘 + 간격 + 숫자의 폭. 상태이상 줄이 월드 배율 1이라 월드 폭을 줄 안의 위치 계산에 그대로 쓴다
    private float StatusWidth(SpriteRenderer icon, MeshRenderer turnsRenderer)
    {
        float turnsWidth = turnsRenderer.bounds.size.x; // 숫자 폭 (자릿수가 늘면 폭도 늘어남)
        if (turnsWidth <= 0f) return icon.sprite.bounds.size.x; // 숫자가 비어 있으면 아이콘만으로 가운데 정렬
        return icon.sprite.bounds.size.x + StatusIconGap + turnsWidth;
    }

    // 상태이상 줄을 아래로 늘어나는 체력 글자 바로 아래에 놓는다
    private void PlaceStatusRow(bool hasStatus)
    {
        float scale = transform.lossyScale.y; // 적 루트 배율 (월드 크기를 루트 기준 로컬 위치로 환산)
        float rowHeight = poisonIcon.sprite.bounds.size.y / scale; // 아이콘 한 줄 높이 (루트 로컬)
        Vector3 hpPosition = hpText.transform.localPosition; // PlaceLabels가 정한 글자 위치
        float hpHeight = hpText.text.Length > 0 ? hpTextRenderer.bounds.size.y / scale : 0f; // 글자 여러 줄의 실제 높이 (루트 로컬, 글자가 없으면 0: 빈 글자의 렌더러 높이는 이전 값이 남음)
        statusRow.localPosition = new Vector3(0f, hpPosition.y - hpHeight - rowHeight / 2f, 0f); // 글자 바로 아래
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

    // 몸통 크기가 등급마다 달라서, 아트의 위아래 끝에 맞춰 막대와 글자를 배치한다 (막대는 모두 캐릭터 발 아래, 그 밑에 스킬 카운터 줄과 상태 글자)
    private void PlaceLabels()
    {
        hpText.anchor = TextAnchor.UpperCenter; // 모든 등급이 막대 아래로 글자가 늘어남

        if (enemy.Tier == EnemyTier.Normal && normalIdleBody != null) // 투명 셀 여백 대신 실제 몸 높이로 배치
        {
            float floorY = normalIdleBody.transform.localPosition.y; // 발바닥 피벗의 고정 높이
            float height = 28f / normalIdleBody.sprite.pixelsPerUnit; // 모든 프레임을 포함하는 고정 몸 높이
            PlaceHpBar(floorY); // 발 아래 막대와 그 밑 글자
            targetMarker.transform.localPosition = new Vector3(0f, floorY + height + 0.8f, 0f); // 몸 위 타겟 화살표
            return;
        }
        if (enemy.Tier == EnemyTier.Epic && epicIdleBody != null) // 발바닥 피벗이라 정지 아트 기준 계산을 쓸 수 없음
        {
            float epicFloorY = epicIdleBody.transform.localPosition.y; // 발바닥 피벗의 고정 높이
            float epicHeight = 74f / epicIdleBody.sprite.pixelsPerUnit; // 발바닥 위로 올라오는 고정 몸 높이
            PlaceHpBar(epicFloorY); // 발 아래 막대와 그 밑 글자
            targetMarker.transform.localPosition = new Vector3(0f, epicFloorY + epicHeight + 0.15f, 0f); // 머리 위 수정보다 위에 화살표
            return;
        }

        if (enemy.Tier == EnemyTier.Boss && bossIdleBody != null) // 셀에 투명 여백이 많아 정지 아트 기준 계산을 쓸 수 없음
        {
            float pivotY = bossIdleBody.transform.localPosition.y; // 셀 고정 기준점 높이
            float ppu = bossIdleBody.sprite.pixelsPerUnit;
            float bottomY = pivotY - 60f / ppu; // 보이는 하단 수정은 기준점보다 60픽셀 아래
            float topY = pivotY + 58f / ppu; // 가장 높은 결정은 기준점보다 58픽셀 위
            PlaceHpBar(bottomY); // 하단 수정 아래 막대와 그 밑 글자
            targetMarker.transform.localPosition = new Vector3(bossIdleBody.transform.localPosition.x, topY - 0.15f, 0f); // 보스 기준점에 가로 정렬하고 상단 잘림 방지 높이는 유지
            return;
        }

        float halfHeight = body.sprite != null ? body.sprite.bounds.extents.y : 0.5f; // Idle 참조가 없을 때의 기존 배치: 아트 절반 높이
        PlaceHpBar(-halfHeight); // 몸통 아래 막대와 그 밑 글자
        targetMarker.transform.localPosition = new Vector3(0f, halfHeight + labelMargin, 0f); // 몸통 위
    }

    // 막대를 발(feetLocalY, 루트 로컬) 아래에 놓고, 스킬 카운터 줄 밑에서 상태 글자가 시작하게 한다
    private void PlaceHpBar(float feetLocalY)
    {
        float barHeight = hpBar.WorldHeight; // 막대 높이 (월드)
        hpBar.PlaceAtWorld(transform.TransformPoint(new Vector3(0f, feetLocalY, 0f)) + Vector3.down * (BarGap + barHeight * 0.5f)); // 발 바로 아래 막대 가운데
        hpText.transform.localPosition = new Vector3(0f, feetLocalY - (BarGap * 2f + barHeight + hpBar.SkillRowWorldHeight) / transform.lossyScale.y, 0f); // 막대와 스킬 카운터 줄 밑에서 글자 시작
    }
}
