// 수정여왕 SKILL(증식) 연출 연결 코드 수정 (CRLF 유지, 한국어 줄 주석): EnemyActionKind / Enemy.NotifyAction / EnemyView.PlayAttack 를 정확히 한 곳씩만 바꾼다.
const fs = require('fs'), path = require('path');
const R = path.join(__dirname, '..', '..', 'Tetrigeon', 'Assets', '@Scripts');
function edit(rel, pairs) {
  const f = path.join(R, rel); let t = fs.readFileSync(f, 'utf8');
  for (const [a, b] of pairs) { const A = a.replace(/\n/g, '\r\n'), B = b.replace(/\n/g, '\r\n'); const n = t.split(A).length - 1; if (n !== 1) throw new Error(rel + ': 바꿀 부분이 ' + n + '곳 (정확히 1곳이어야 함): ' + a.slice(0, 60)); t = t.replace(A, () => B); }
  fs.writeFileSync(f, t, 'utf8'); console.log('수정', rel);
}
// 1) 행동 종류: 여왕 능력 둘을 구분 (증식 / 회전 금지)
edit('Data/EnemyActionKind.cs', [[
  'public enum EnemyActionKind { BasicAttack, Skill, Charging, StrongAttack } // 일반 체력 공격 / 능력 사용 / 수호자 강공격 준비(기한만 셈) / 수호자 강공격',
  'public enum EnemyActionKind { BasicAttack, Skill, Charging, StrongAttack, QueenGrowth, QueenRotationLock } // 일반 체력 공격 / 능력 사용 / 수호자 강공격 준비(기한만 셈) / 수호자 강공격 / 여왕 증식 능력(NEXT 미노에 칸 추가) / 여왕 회전 금지 능력 (여왕 능력은 둘이라 따로 구분하며, 여왕의 능력 턴에는 Skill 대신 이 둘을 씀)'
]]);
// 2) 능력 턴 알림: 여왕이면 이번 능력이 증식인지 회전 금지인지 함께 전달
edit('Gameplay/Enemy.cs', [[
  '        if (skillTurn) kind = EnemyActionKind.Skill; //',
  '        if (skillTurn && Tier == EnemyTier.Boss) kind = queenUsedGrowth ? EnemyActionKind.QueenRotationLock : EnemyActionKind.QueenGrowth; // 여왕 능력: 증식과 회전 금지가 번갈아 나오고 교대는 TakeQueenGrowthTurn 이 이 알림 뒤에 바꾸므로, 지금 값이 직전에 증식이었으면 이번은 회전 금지\n        else if (skillTurn) kind = EnemyActionKind.Skill; //'
]]);
// 3) 연출: 여왕은 증식일 때만 Skill 트리거(회전 금지 모션은 나중에 따로)
edit('Visuals/EnemyView.cs', [
  ['    private static readonly int AttackTrigger = Animator.StringToHash("Attack"); //',
   '    private static readonly int SkillTrigger = Animator.StringToHash("Skill"); // 여왕 증식 능력 모션 트리거\n    private static readonly int AttackTrigger = Animator.StringToHash("Attack"); //'],
  ['        Animator animator = null; // 이번 행동에 재생할 애니메이터 (모션이 없으면 null)\n',
   '        Animator animator = null; // 이번 행동에 재생할 애니메이터 (모션이 없으면 null)\n        int trigger = AttackTrigger; // 재생할 모션 트리거 (기본은 공격)\n'],
  ['        else if (enemy.Tier == EnemyTier.Boss && kind == EnemyActionKind.BasicAttack) animator = bossIdleAnimator; //',
   '        else if (enemy.Tier == EnemyTier.Boss && kind == EnemyActionKind.QueenGrowth) { animator = bossIdleAnimator; trigger = SkillTrigger; } // 여왕: 수정 증식 능력일 때는 왕관 연출 (회전 금지 능력 모션은 아직 없음)\n        else if (enemy.Tier == EnemyTier.Boss && kind == EnemyActionKind.BasicAttack) animator = bossIdleAnimator; //'],
  ['        animator.SetTrigger(AttackTrigger); //', '        animator.SetTrigger(trigger); //']
]);
