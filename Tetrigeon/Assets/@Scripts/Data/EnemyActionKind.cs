// 적이 한 번 행동할 때의 종류. 보이는 연출(공격 모션 등)이 어떤 행동인지 구분하는 데 쓴다
public enum EnemyActionKind { BasicAttack, Skill, Charging, StrongAttack, QueenGrowth, QueenRotationLock, StunRecovery } // 일반 체력 공격 / 능력 사용 / 수호자 강공격 준비(기한만 셈) / 수호자 강공격 / 여왕 증식 능력(NEXT 미노에 칸 추가) / 여왕 회전 금지 능력 (여왕 능력은 둘이라 따로 구분하며, 여왕의 능력 턴에는 Skill 대신 이 둘을 씀) / 수호자가 스턴 자세에서 일어서는 행동 (공격하지 않고 한 턴만 씀)
