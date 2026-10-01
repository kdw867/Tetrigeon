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
        public bool SkipNextTick; // 방금 걸린 독이면 바로 이어지는 적 턴 한 번은 피해도 차감도 없음
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
    private int freezeActionsLeft; // 빙결로 막아야 할 적 행동 횟수
    private bool freezeReleasePending; // 빙결 표시 유지 여부 (모든 행동 차단 후 정산에서 해제)
    private int freezeBreakDamage; // 빙결이 끝날 때 줄 추가 피해

    public bool IsFrozen => freezeReleasePending; // 눈송이 표시 기준: 빙결이 걸려 있고 아직 해제되지 않음
    public int FreezeActionsLeft => freezeActionsLeft; // 빙결로 앞으로 더 막을 적 행동 수 (UI 표시용)
    public int PoisonCount => poisons.Count; // UI 표시용 독 개수

    // UI 표시용: 독마다 따로 관리되는 남은 턴 중 가장 긴 값 (합산하지 않음, 독이 완전히 끝나기까지 남은 턴)
    public int PoisonTurnsLeft
    {
        get
        {
            int longest = 0;
            foreach (Poison poison in poisons) longest = Mathf.Max(longest, poison.TurnsLeft); // 가장 오래 남은 독의 턴
            return longest;
        }
    }

    // 생성 직후 등급을 지정하고 체력을 초기화
    public void Init(EnemyTier tier)
    {
        Tier = tier;
        MaxHp = EnemyStats.GetMaxHp(tier);
        Hp = MaxHp;
        turnsSinceSkill = 0;
        poisons.Clear(); // 상태이상도 초기화
        freezeActionsLeft = 0; // 소환으로 되살아날 때 이전 빙결이 남지 않게 함
        freezeReleasePending = false;
        freezeBreakDamage = 0;
    }

    // 강화 T 미노: 독을 새로 건다 (기존 독과 별개로 쌓임)
    public void AddPoison(int damagePerTurn, int turns)
    {
        if (damagePerTurn <= 0 || turns <= 0) return; // 피해나 지속시간이 없으면 걸지 않음

        Poison poison = new Poison();
        poison.DamagePerTurn = damagePerTurn;
        poison.TurnsLeft = turns;
        poison.SkipNextTick = true; // 가방 정산에서 걸린 독은 바로 이어지는 적 턴을 건너뜀
        poisons.Add(poison);
    }

    // 이번 턴의 독 피해 합계를 계산하고 남은 턴을 하나씩 줄인다 (방금 걸린 독만 이번 한 번 건너뜀)
    public int TickPoison()
    {
        int total = 0;
        for (int i = poisons.Count - 1; i >= 0; i--)
        {
            Poison poison = poisons[i];
            if (poison.SkipNextTick) // 이번 정산에 새로 걸린 독: 피해도 차감도 없이 다음 적 턴부터 진행
            {
                poison.SkipNextTick = false;
                poisons[i] = poison; // 구조체라 다시 넣어야 반영됨
                continue; // 기존 독들은 이 독과 상관없이 그대로 진행
            }
            total += poison.DamagePerTurn; // 독마다 자기 피해를 더함
            poison.TurnsLeft--;
            if (poison.TurnsLeft <= 0) poisons.RemoveAt(i); // 다 된 독은 제거
            else poisons[i] = poison; // 구조체라 다시 넣어야 반영됨
        }
        return total;
    }

    // 강화 J 미노: 빙결을 건다. 삭제한 줄 수만큼 적 행동을 막고 마지막 차단 다음 정산에서 해제한다
    public void ApplyFreeze(int breakDamage, int turns) // 삭제 줄 수만큼 행동 차단
    {
        freezeActionsLeft = Mathf.Max(freezeActionsLeft, turns); // 재빙결로 남은 시간이 짧아지지 않음
        freezeReleasePending = true; // 다음 가방 정산에서 해제·파괴 피해 예약
        freezeBreakDamage += breakDamage; // 재빙결 피해는 최종 해제 시 함께 적용
    }

    // 적 턴에서 호출: 막을 행동이 남아 있으면 소비하고 true (빙결 표시와 해제는 그대로 남음)
    public bool ConsumeFreezeBlock()
    {
        if (freezeActionsLeft <= 0) return false; // 막을 행동이 없으면 정상 행동

        freezeActionsLeft--; // 적 행동 한 번마다 남은 차단 횟수 감소
        return true;
    }

    // 가방 정산에서 호출: 걸려 있던 빙결을 해제하고 파괴 피해를 한 번만 돌려준다
    public int ReleaseFreeze()
    {
        if (!freezeReleasePending || freezeActionsLeft > 0) return 0; // 빙결이 없거나 아직 막을 행동이 남았으면 해제하지 않음

        freezeReleasePending = false; // 빙결 해제 (눈송이 숨김)
        freezeActionsLeft = 0; // 해제 뒤에는 막을 행동도 남기지 않음
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
