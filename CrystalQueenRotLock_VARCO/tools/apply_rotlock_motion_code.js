// 수정여왕 회전 잠금 SKILL 연출 연결 코드 수정 (CRLF 유지, 한국어 줄 주석): EnemyView 의 트리거 상수·재생 분기·안내 주석을 정확히 한 곳씩만 바꾼다.
// (EnemyActionKind.QueenRotationLock 과 Enemy.NotifyAction 의 구분은 증식 SKILL 연결 때 이미 들어가 있음)
const fs = require('fs'), path = require('path');
const R = path.join(__dirname, '..', '..', 'Tetrigeon', 'Assets', '@Scripts');
function edit(rel, pairs) {
  const f = path.join(R, rel); let t = fs.readFileSync(f, 'utf8');
  for (const [a, b] of pairs) { const A = a.replace(/\n/g, '\r\n'), B = b.replace(/\n/g, '\r\n'); const n = t.split(A).length - 1; if (n !== 1) throw new Error(rel + ': 바꿀 부분이 ' + n + '곳 (정확히 1곳이어야 함): ' + a.slice(0, 60)); t = t.replace(A, () => B); }
  fs.writeFileSync(f, t, 'utf8'); console.log('수정', rel);
}
edit('Visuals/EnemyView.cs', [
  ['    private static readonly int SkillTrigger = Animator.StringToHash("Skill"); // 여왕 증식 능력 모션 트리거\n',
   '    private static readonly int SkillTrigger = Animator.StringToHash("Skill"); // 여왕 증식 능력 모션 트리거\n    private static readonly int RotLockTrigger = Animator.StringToHash("RotLock"); // 여왕 회전 금지 능력 모션 트리거\n'],
  ['여왕은 일반 공격과 수정 증식 능력에 각각 다른 모션\n', '여왕은 일반 공격·수정 증식 능력·회전 금지 능력에 각각 다른 모션\n'],
  ['    // 여왕의 회전 금지 능력 모션과 수호자의 능력 사용·강공격 준비 모션은 아직 없음\n', '    // 수호자의 능력 사용·강공격 준비 모션은 아직 없음\n'],
  ['trigger = SkillTrigger; } // 여왕: 수정 증식 능력일 때는 왕관 연출 (회전 금지 능력 모션은 아직 없음)\n',
   'trigger = SkillTrigger; } // 여왕: 수정 증식 능력일 때는 왕관 연출\n        else if (enemy.Tier == EnemyTier.Boss && kind == EnemyActionKind.QueenRotationLock) { animator = bossIdleAnimator; trigger = RotLockTrigger; } // 여왕: 회전 금지 능력일 때는 회전 룬과 자물쇠 연출\n']
]);
