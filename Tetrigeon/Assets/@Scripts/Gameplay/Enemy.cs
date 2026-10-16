using System;
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

    private const int GuardianShield = 5; // 수호자 보호막 수치
    private const int GuardianChargeActions = 2; // 보호막 생성 후 강공격까지 수호자 행동 수 (= 보호막을 깰 가방 정산 기회)
    private const int GuardianStrongAttack = 9; // 강공격 피해 (기본 공격 3의 3배)
    private const int StunActions = 1; // 보호막이 깨졌을 때 막는 수호자 행동 수

    public EnemyTier Tier { get; private set; } // 이 적의 등급
    public int MaxHp { get; private set; } // 등급에서 정해진 최대 체력
    public int Hp { get; private set; } // 현재 체력
    public bool IsAlive => Hp > 0; // 살아있는지 (죽은 적은 행동도 타겟팅도 하지 않음)
    public int AttackDamage => EnemyStats.GetAttackDamage(Tier); // 체력 공격 턴의 피해량
    public int SkillInterval => EnemyStats.GetSkillInterval(Tier); // 능력 주기 (턴)
    public int TurnsUntilSkill => SkillInterval - turnsSinceSkill; // 능력 발동까지 남은 턴

    public event Action<EnemyActionKind> Acted; // 이 적이 실제로 행동할 때 알림 (행동 종류를 함께 전달. 보이는 연출 전용이라 전투 수치와 순서에는 관여하지 않음)

    private int turnsSinceSkill; // 마지막 능력 사용 후 지난 턴 수

    private readonly List<Poison> poisons = new List<Poison>(); // 걸려 있는 독들 (중첩 가능)
    private int freezeActionsLeft; // 빙결로 막아야 할 적 행동 횟수
    private bool freezeReleasePending; // 빙결 표시 유지 여부 (모든 행동 차단 후 정산에서 해제)
    private int freezeBreakDamage; // 빙결이 끝날 때 줄 추가 피해

    public int Shield { get; private set; } // 수호자 보호막 (피해를 체력보다 먼저 받음)
    public int ChargeActionsLeft { get; private set; } // 강공격까지 남은 수호자 행동 수 (0이면 준비 중 아님)
    public int ChargeActionsTotal => GuardianChargeActions; // 보호막 생성 후 강공격까지 전체 기한 (보호막 농도 표시가 충전 진행도를 계산할 때 읽음)
    public bool IsStunned => stunActionsLeft > 0 || stunnedLastAction; // 스턴 표시: 막을 행동이 남았거나 직전 행동을 스턴으로 쉼 (빙결 눈송이처럼 다음 행동 전까지 유지)
    private int stunActionsLeft; // 스턴으로 막을 행동 수
    private bool stunnedLastAction; // 직전 적 턴의 행동이 스턴으로 막혔는지
    private bool queenUsedGrowth; // 수정여왕이 직전 능력 턴에 증식을 썼는지 (다음은 회전 금지)

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
        Shield = 0; // 소환으로 되살아날 때 이전 보호막·강공격 준비·스턴이 남지 않게 함
        ChargeActionsLeft = 0;
        stunActionsLeft = 0;
        stunnedLastAction = false;
        queenUsedGrowth = false; // 스테이지 진입 시 여왕의 첫 능력은 증식
    }

    // 수정여왕 능력 턴마다 증식 → 회전 금지 → 증식 순서로 번갈아 쓴다. 이번이 증식이면 true
    public bool TakeQueenGrowthTurn()
    {
        queenUsedGrowth = !queenUsedGrowth; // 교대
        return queenUsedGrowth;
    }

    // 수호자 능력: 보호막을 만들고 강공격 준비 시작 (가비지와 같은 능력 턴에 발동)
    public void StartCharge()
    {
        Shield = GuardianShield; // 보호막 생성
        ChargeActionsLeft = GuardianChargeActions; // 강공격 기한
    }

    // 준비 중인 수호자의 행동: 기한을 하나 줄이고, 기한이 되면 남은 보호막을 없애고 강공격 피해를 돌려준다 (그 전에는 공격하지 않음)
    public int AdvanceCharge()
    {
        ChargeActionsLeft--; // 수호자 행동 한 번마다 기한 감소
        if (ChargeActionsLeft > 0) return 0; // 아직 준비 중이면 공격하지 않음

        Shield = 0; // 강공격 후 남은 보호막 제거
        return GuardianStrongAttack; // 강공격 피해
    }

    // 적 턴에서 호출: 스턴으로 막을 행동이 남아 있으면 소비하고 true
    public bool ConsumeStun()
    {
        stunnedLastAction = stunActionsLeft > 0; // 이번 행동이 스턴으로 막히는지 기록 (다음 적 턴까지 표시)
        if (stunActionsLeft <= 0) return false; // 스턴이 없으면 정상 행동

        stunActionsLeft--; // 행동 한 번 차단
        return true;
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

    // 피해 적용. 보호막이 먼저 받고 남은 피해만 체력으로. 남은 체력보다 큰 피해는 그대로 버려진다 (다른 적에게 넘기지 않음)
    public void TakeDamage(int amount)
    {
        if (Shield > 0)
        {
            int absorbed = Mathf.Min(Shield, amount); // 보호막이 막을 수 있는 만큼
            Shield -= absorbed; // 보호막 감소
            amount -= absorbed; // 넘친 피해는 체력으로
            if (Shield <= 0) // 기한 안에 보호막이 깨짐 (보호막은 준비 중에만 있음)
            {
                ChargeActionsLeft = 0; // 강공격 취소
                stunActionsLeft = StunActions; // 수호자 스턴
            }
        }

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

    // 적 턴에서 이 적이 막히지 않고 행동할 때 호출: 공격 모션 같은 연출이 구독해서 재생한다 (피해·능력 계산은 따로 하며 여기서는 아무것도 바꾸지 않음)
    // skillTurn: 이번 행동이 능력 주기에 도달한 능력 사용인지 (AdvanceTurnAndCheckSkill 결과). 강공격 준비 상태는 이 적이 스스로 알고 있으므로 행동 직전에 호출해야 함
    public void NotifyAction(bool skillTurn)
    {
        EnemyActionKind kind = EnemyActionKind.BasicAttack; // 기본은 일반 체력 공격
        if (skillTurn && Tier == EnemyTier.Boss) kind = queenUsedGrowth ? EnemyActionKind.QueenRotationLock : EnemyActionKind.QueenGrowth; // 여왕 능력: 증식과 회전 금지가 번갈아 나오고 교대는 TakeQueenGrowthTurn 이 이 알림 뒤에 바꾸므로, 지금 값이 직전에 증식이었으면 이번은 회전 금지
        else if (skillTurn) kind = EnemyActionKind.Skill; // 능력 사용 턴 (수호자는 보호막과 강공격 준비 시작)
        else if (ChargeActionsLeft > 1) kind = EnemyActionKind.Charging; // 강공격 준비 중이고 아직 기한이 남음 (공격하지 않고 기한만 셈)
        else if (ChargeActionsLeft == 1) kind = EnemyActionKind.StrongAttack; // 이번 행동에서 기한이 0이 되어 강공격
        Acted?.Invoke(kind); // 구독한 연출에 알림
    }

    // 이번 능력 발동으로 쌓을 방해 줄 수
    public int RollGarbageLines()
    {
        return EnemyStats.RollGarbageLines(Tier);
    }
}
