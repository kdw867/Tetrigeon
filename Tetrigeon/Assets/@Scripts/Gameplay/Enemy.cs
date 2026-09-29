using System.Collections.Generic;
using UnityEngine;

// 적 한 마리. 등급에 따른 능력치와 자기 방해 줄 능력 카운터를 스스로 관리한다.
public class Enemy : MonoBehaviour
{
    // 독 하나. 강화 T 미노로 여러 번 걸면 각각 따로 남은 턴과 피해를 관리한다.
    private struct Poison
    {
        public int DamagePerTurn; // 턴당 피해
        public int TurnsLeft; // 남은 턴
    }

    public EnemyTier Tier { get; private set; } // 이 적의 등급
    public int MaxHp { get; private set; } // 등급에서 정해진 최대 체력
    public int Hp { get; private set; } // 현재 체력
    public bool IsAlive => Hp > 0; // 살아있는지 (죽은 적은 행동도 타겟팅도 하지 않음)
    public int AttackDamage => EnemyStats.GetAttackDamage(Tier); // 체력 공격 턴의 피해량
    public int SkillInterval => EnemyStats.GetSkillInterval(Tier); // 능력 주기 (턴)
    public int TurnsUntilSkill => SkillInterval - turnsSinceSkill; // 능력 발동까지 남은 턴

    private int turnsSinceSkill; // 마지막 능력 사용 후 지난 턴 수

    private readonly List<Poison> poisons = new List<Poison>(); // 걸려 있는 독들 (중첩 가능)
    private int freezeTurnsLeft; // 남은 빙결 턴
    private int freezeBreakDamage; // 빙결이 끝날 때 줄 추가 피해

    public bool IsFrozen => freezeTurnsLeft > 0; // 빙결 중이면 이번 턴에 행동하지 않음
    public int PoisonCount => poisons.Count; // UI 표시용 독 개수

    // 생성 직후 등급을 지정하고 체력을 초기화
    public void Init(EnemyTier tier)
    {
        Tier = tier;
        MaxHp = EnemyStats.GetMaxHp(tier);
        Hp = MaxHp;
        turnsSinceSkill = 0;
        poisons.Clear(); // 상태이상도 초기화
        freezeTurnsLeft = 0;
        freezeBreakDamage = 0;
    }

    // 강화 T 미노: 독을 새로 건다 (기존 독과 별개로 쌓임)
    public void AddPoison(int damagePerTurn, int turns)
    {
        if (damagePerTurn <= 0 || turns <= 0) return; // 피해나 지속시간이 없으면 걸지 않음

        Poison poison = new Poison();
        poison.DamagePerTurn = damagePerTurn;
        poison.TurnsLeft = turns;
        poisons.Add(poison);
    }

    // 이번 턴의 독 피해 합계를 계산하고 남은 턴을 하나씩 줄인다
    public int TickPoison()
    {
        int total = 0;
        for (int i = poisons.Count - 1; i >= 0; i--)
        {
            Poison poison = poisons[i];
            total += poison.DamagePerTurn; // 독마다 자기 피해를 더함
            poison.TurnsLeft--;
            if (poison.TurnsLeft <= 0) poisons.RemoveAt(i); // 다 된 독은 제거
            else poisons[i] = poison; // 구조체라 다시 넣어야 반영됨
        }
        return total;
    }

    // 강화 L 미노: 빙결을 건다 (다시 걸면 지속시간과 파괴 피해를 새로 덮어씀)
    public void ApplyFreeze(int breakDamage, int turns)
    {
        if (turns <= 0) return;

        freezeTurnsLeft = turns;
        freezeBreakDamage = breakDamage;
    }

    // 빙결 지속시간을 1턴 줄이고, 이번 턴에 끝났으면 파괴 피해를 돌려준다
    public int TickFreeze()
    {
        if (freezeTurnsLeft <= 0) return 0; // 빙결 상태가 아니면 아무 일 없음

        freezeTurnsLeft--;
        if (freezeTurnsLeft > 0) return 0; // 아직 더 남았으면 파괴 피해 없음

        int damage = freezeBreakDamage; // 빙결이 끝나는 순간의 추가 피해
        freezeBreakDamage = 0;
        return damage;
    }

    // 보스 소환 시 빈자리가 없을 때의 보강. 상태이상과 스킬 카운터는 그대로 두고 체력만 최대로 되돌린다.
    public void RestoreHp()
    {
        Hp = MaxHp;
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
