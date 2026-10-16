// 레미 공격 모션 연결 코드 수정 (CRLF 유지, 한국어 줄 주석): 바꿀 곳이 정확히 1곳인지 확인하고 고친다. 새 스크립트 LemyAttackView.cs 를 만든다.
const fs = require('fs'), path = require('path');
const R = path.join(__dirname, '..', '..', 'Tetrigeon', 'Assets', '@Scripts');
function edit(rel, pairs) {
  const f = path.join(R, rel); let t = fs.readFileSync(f, 'utf8');
  for (const [a, b] of pairs) { const A = a.replace(/\n/g, '\r\n'), B = b.replace(/\n/g, '\r\n'); const n = t.split(A).length - 1; if (n !== 1) throw new Error(rel + ': 바꿀 부분이 ' + n + '곳 (정확히 1곳이어야 함): ' + a.slice(0, 60)); t = t.replace(A, () => B); }
  fs.writeFileSync(f, t, 'utf8'); console.log('수정', rel);
}
edit('Managers/CombatManager.cs', [
  ['    public static event Action OnStageStarted; // 다음 스테이지가 준비된 직후, 첫 조각이 나오기 전의 알림 (시작 카운트다운용)\n',
   '    public static event Action OnStageStarted; // 다음 스테이지가 준비된 직후, 첫 조각이 나오기 전의 알림 (시작 카운트다운용)\n    public static event Action OnPlayerAttack; // 가방 정산에서 타겟이 피해를 받을 때 알림 (레미 공격 모션용, 보이는 연출 전용이라 피해·순서·타이밍에는 관여하지 않음)\n'],
  ['        if (target != null && target.IsAlive)\n            DealDamage(target, PendingDamage); // 누적 피해는 타겟 한 마리에게만, 초과분은 소멸\n',
   '        if (target != null && target.IsAlive)\n        {\n            if (PendingDamage > 0) OnPlayerAttack?.Invoke(); // 타겟이 피해를 받는 정산이면 레미 공격 연출 (피해 적용 전에 알리기만 함)\n            DealDamage(target, PendingDamage); // 누적 피해는 타겟 한 마리에게만, 초과분은 소멸\n        }\n']
]);
const src = `using UnityEngine;

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
`.replace(/\r?\n/g, '\r\n');
const out = path.join(R, 'Visuals', 'LemyAttackView.cs'); if (fs.existsSync(out)) throw new Error('이미 있음: ' + out);
fs.writeFileSync(out, src, 'utf8'); console.log('생성 Visuals/LemyAttackView.cs');
