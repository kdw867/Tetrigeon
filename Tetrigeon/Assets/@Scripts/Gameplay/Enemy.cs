using UnityEngine;

// 적 한 마리. 등급에 따른 능력치와 자기 방해 줄 능력 카운터를 스스로 관리한다.
public class Enemy : MonoBehaviour
{
    public EnemyTier Tier { get; private set; } // 이 적의 등급
    public int MaxHp { get; private set; } // 등급에서 정해진 최대 체력
    public int Hp { get; private set; } // 현재 체력
    public bool IsAlive => Hp > 0; // 살아있는지 (죽은 적은 행동도 타겟팅도 하지 않음)
    public int AttackDamage => EnemyStats.GetAttackDamage(Tier); // 체력 공격 턴의 피해량
    public int SkillInterval => EnemyStats.GetSkillInterval(Tier); // 능력 주기 (턴)
    public int TurnsUntilSkill => SkillInterval - turnsSinceSkill; // 능력 발동까지 남은 턴

    private int turnsSinceSkill; // 마지막 능력 사용 후 지난 턴 수

    // 생성 직후 등급을 지정하고 체력을 초기화
    public void Init(EnemyTier tier)
    {
        Tier = tier;
        MaxHp = EnemyStats.GetMaxHp(tier);
        Hp = MaxHp;
        turnsSinceSkill = 0;
    }

    // 피해 적용. 남은 체력보다 큰 피해는 그대로 버려진다 (다른 적에게 넘기지 않음)
    public void TakeDamage(int amount)
    {
        Hp -= amount;
        if (Hp < 0) Hp = 0; // 초과 피해는 소멸
    }

    // 이번 적 턴에 능력을 쓸 차례인지 확인하고, 맞으면 카운터를 리셋
    public bool AdvanceTurnAndCheckSkill()
    {
        turnsSinceSkill++;
        if (turnsSinceSkill < SkillInterval) return false; // 아직 주기가 안 찼으면 체력 공격

        turnsSinceSkill = 0; // 주기 도달: 카운터 리셋 후 능력 사용
        return true;
    }

    // 이번 능력 발동으로 쌓을 방해 줄 수
    public int RollGarbageLines()
    {
        return EnemyStats.RollGarbageLines(Tier);
    }
}
