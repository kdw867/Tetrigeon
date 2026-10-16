using UnityEngine;

// 수호자(센티넬) 보호막 스킬의 보이는 연출. 능력 사용 때 웅크리며 보호막을 만들고, 고정(LOCK)이 쌓일수록 보호막이 진해지며,
// 기한 안에 못 깨면 폭발하고, 깨지면 녹아내린 뒤 스턴 별을 돌리며 힘 빠진 자세로 있다가 스턴이 끝나면 일어선다.
// 전투 수치·순서·피해에는 관여하지 않고 적의 상태와 행동 알림을 읽기만 한다 (피해는 CombatManager 가 한 번만 적용).
[RequireComponent(typeof(Animator))]
public class GuardianShieldView : MonoBehaviour
{
    [SerializeField] private SpriteRenderer shieldFill; // 보호막 면 층 (보이는 스프라이트는 애니메이터가 넣고, 농도는 알파로 이 스크립트가 조절)
    [SerializeField] private SpriteRenderer shieldRim; // 보호막 테두리 층 (면과 같은 방식)

    private const float FillAlphaBase = 0.20f; // 충전 0%일 때 면 알파
    private const float FillAlphaGain = 0.80f; // 충전 100%에서 면 알파에 더해지는 양 (합쳐서 1.0)
    private const float RimAlphaBase = 0.60f; // 충전 0%일 때 테두리 알파
    private const float RimAlphaGain = 0.40f; // 충전 100%에서 테두리 알파에 더해지는 양 (합쳐서 1.0)

    private static readonly int CastTrigger = Animator.StringToHash("ShieldCast"); // 웅크리며 보호막 생성 모션 트리거
    private static readonly int ExplodeTrigger = Animator.StringToHash("ShieldExplode"); // 폭발 후 복귀 모션 트리거
    private static readonly int BreakTrigger = Animator.StringToHash("ShieldBreak"); // 중간 파손과 녹아내림, 스턴 자세로 처짐 모션 트리거
    private static readonly int RecoverTrigger = Animator.StringToHash("ShieldRecover"); // 스턴이 끝나 일어서는 모션 트리거

    private Enemy enemy; // 이 연출의 주인인 수호자
    private Animator animator; // 몸통과 보호막·이펙트 자식 렌더러를 함께 움직이는 애니메이터
    private bool shieldUp; // 보호막이 서 있는 동안 (생성부터 폭발 또는 깨짐까지)
    private bool stunned; // 보호막이 깨져 스턴 자세로 있는 동안 (스턴이 끝나면 일어섬)

    private void Awake()
    {
        enemy = GetComponentInParent<Enemy>(); // 부모(적 루트)의 전투 데이터
        animator = GetComponent<Animator>(); // 같은 오브젝트의 애니메이터
    }

    private void OnEnable()
    {
        shieldUp = false; // 다시 켜질 때 이전 연출 상태를 남기지 않음 (애니메이터도 기본 상태로 돌아감)
        stunned = false;
        enemy.Acted += OnActed; // 적이 행동할 때 능력 사용·강공격을 알아챔
        CombatManager.OnStateChanged += Refresh; // 전투 상태가 바뀔 때마다 농도·깨짐·스턴 끝남을 확인
    }

    private void OnDisable()
    {
        enemy.Acted -= OnActed; // 이벤트 구독 해제
        CombatManager.OnStateChanged -= Refresh;
    }

    // 적이 행동하는 순간: 능력 사용이면 보호막 생성 모션, 강공격이면 폭발 모션 (이 알림은 피해 계산보다 먼저 오며 여기서는 아무것도 바꾸지 않음)
    private void OnActed(EnemyActionKind kind)
    {
        if (stunned && !enemy.IsStunned) EndStun(); // 스턴이 이번 행동 직전에 끝났으면 먼저 일어서게 함 (같은 적 턴의 행동 알림은 상태 갱신 알림보다 먼저 와서, 이어지는 능력 사용이 스턴 중으로 오해되지 않게)
        if (kind == EnemyActionKind.Skill && !shieldUp && !stunned) // 이미 서 있는 보호막이나 스턴 중에는 새로 시작하지 않음
        {
            shieldUp = true; // 보호막 생성 시작
            animator.SetTrigger(CastTrigger); // 웅크림 + 보호막이 바닥 룬 선에서 자라남
        }
        else if (kind == EnemyActionKind.StrongAttack && shieldUp) // 기한 안에 못 깨서 강공격 = 폭발
        {
            shieldUp = false; // 보호막이 폭발로 사라짐
            animator.SetTrigger(ExplodeTrigger); // 불투명 → 부풀어 오름 → 조각과 빛으로 퍼짐 → 기본 자세로 복귀
        }
    }

    // 전투 상태가 바뀔 때: 보호막 농도 갱신, 보호막이 깨졌는지, 스턴이 끝났는지 확인
    private void Refresh()
    {
        if (!enemy.IsAlive) return; // 죽은 적은 연출하지 않음 (EnemyView 가 몸통을 숨기고, 다시 켜질 때 상태를 비움)

        if (shieldUp) // 보호막이 서 있는 중
        {
            if (enemy.Shield <= 0 && enemy.ChargeActionsLeft <= 0 && enemy.IsStunned) // 기한 안에 보호막이 깨져 스턴이 걸림
            {
                shieldUp = false; // 보호막이 녹아서 사라짐
                stunned = true; // 이어서 스턴 자세
                animator.SetTrigger(BreakTrigger); // 중간 파손 → 녹아내림 → 힘 빠진 자세 + 별
                return;
            }
            ApplyDensity(); // 충전 진행도에 맞게 보호막을 진하게
            return;
        }

        if (stunned && !enemy.IsStunned) EndStun(); // 스턴이 끝남 (다음 행동 전)
    }

    // 스턴 자세를 풀고 일어서게 함
    private void EndStun()
    {
        stunned = false; // 스턴 자세 해제
        animator.SetTrigger(RecoverTrigger); // 별이 사라지고 일어서서 기본 자세로
    }

    // 충전 진행도(0~1) = 보호막 생성 뒤 실제로 고정한 조각 수 / 강공격까지 허용되는 고정 수. 보호막 체력과는 따로 센다.
    // 상태에서 계산하므로 고정 한 번마다 정확히 1/전체만큼 오르고, 빙결·스턴으로 행동이 막혀 기한이 안 줄면 그 가방 시작 값으로 되돌아간다 (실제 기한과 같음)
    private void ApplyDensity()
    {
        CombatManager combat = CombatManager.Instance; // 가방 진행도를 읽을 전투 매니저
        if (combat == null || enemy.ChargeActionsTotal <= 0) return; // 읽을 수 없으면 그대로 둠

        int perBag = combat.PiecesPerBag; // 한 가방의 조각 수
        int total = enemy.ChargeActionsTotal * perBag; // 강공격까지 허용되는 고정 수
        int done = (enemy.ChargeActionsTotal - enemy.ChargeActionsLeft) * perBag + (perBag - combat.PiecesLeftInBag); // 지금까지 센 고정 수 (이미 지난 가방 + 이번 가방)
        float progress = Mathf.Clamp01((float)done / total); // 0~1

        Color fill = shieldFill.color; // 면 색 (알파만 바꿈)
        fill.a = FillAlphaBase + FillAlphaGain * progress;
        shieldFill.color = fill;
        Color rim = shieldRim.color; // 테두리 색 (알파만 바꿈)
        rim.a = RimAlphaBase + RimAlphaGain * progress;
        shieldRim.color = rim;
    }
}
