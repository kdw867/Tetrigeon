using UnityEngine;

// 등급별 고정 능력치. 스테이지가 올라가도 같은 등급이면 수치는 동일하다.
public static class EnemyStats
{
    // 등급별 몬스터 이름 (Hierarchy 표시와 UI에 사용)
    public static string GetName(EnemyTier tier)
    {
        switch (tier)
        {
            case EnemyTier.Epic: return "AmethystSentinel"; // 에픽
            case EnemyTier.Boss: return "CrystalQueen"; // 보스
            default: return "CrystalLarva"; // 일반
        }
    }

    // 등급별 최대 체력
    public static int GetMaxHp(EnemyTier tier)
    {
        switch (tier)
        {
            case EnemyTier.Epic: return 50; // 에픽
            case EnemyTier.Boss: return 75; // 보스
            default: return 25; // 일반
        }
    }

    // 등급별 기본 공격력 (체력 공격 턴에만 적용)
    public static int GetAttackDamage(EnemyTier tier)
    {
        switch (tier)
        {
            case EnemyTier.Epic: return 3; // 에픽
            case EnemyTier.Boss: return 3; // 보스
            default: return 2; // 일반
        }
    }

    // 등급별 방해 줄 능력 주기 (턴)
    public static int GetSkillInterval(EnemyTier tier)
    {
        switch (tier)
        {
            case EnemyTier.Epic: return 5; // 에픽은 5턴마다
            case EnemyTier.Boss: return 6; // 보스는 6턴마다
            default: return 3; // 일반은 3턴마다
        }
    }

    // 등급별 방해 줄 수 (능력 발동 턴에 한 번 굴림)
    public static int RollGarbageLines(EnemyTier tier)
    {
        switch (tier)
        {
            case EnemyTier.Epic: return Random.Range(2, 4); // 2~3줄
            case EnemyTier.Boss: return Random.Range(3, 6); // 3~5줄
            default: return 1; // 일반은 1줄 고정
        }
    }
}
