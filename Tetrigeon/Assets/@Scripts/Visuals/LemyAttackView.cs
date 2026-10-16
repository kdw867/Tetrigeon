using UnityEngine;

// 레미의 공격 연출("코어 방출": 웅크리며 양팔을 벌림 → 가슴 코어에 빛이 모임 → 오른쪽으로 짧은 마법탄 발사 → 복귀).
// 가방 정산에서 타겟이 피해를 받을 때 CombatManager 가 알리면 Attack 트리거만 건다. 피해·순서·타이밍에는 관여하지 않는다.
[RequireComponent(typeof(Animator))]
public class LemyAttackView : MonoBehaviour
{
    private static readonly int AttackTrigger = Animator.StringToHash("Attack"); // 공격 모션 트리거 (매번 문자열을 만들지 않도록 한 번만 계산)

    private Animator animator; // 레미 파츠와 이펙트 자식 렌더러를 함께 움직이는 애니메이터

    private void Awake()
    {
        animator = GetComponent<Animator>(); // 같은 오브젝트의 애니메이터
    }

    private void OnEnable()
    {
        CombatManager.OnPlayerAttack += PlayAttack; // 타겟이 피해를 받는 정산마다 공격 모션 재생
    }

    private void OnDisable()
    {
        CombatManager.OnPlayerAttack -= PlayAttack; // 이벤트 구독 해제
    }

    private void PlayAttack()
    {
        animator.SetTrigger(AttackTrigger); // Idle 에서 공격으로 넘어가고, 끝나면 스스로 Idle 로 돌아옴
    }
}
