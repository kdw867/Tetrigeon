// 스테이지별 적 구성. 같은 스테이지의 적들은 함께 등장해 같은 적 턴에 행동한다.
public static class StageData
{
    public const int LastStage = 10; // 현재 챕터의 마지막 스테이지

    // 해당 스테이지에 등장하는 적 등급 목록 (비전투 스테이지는 빈 배열)
    public static EnemyTier[] GetComposition(int stage)
    {
        switch (stage)
        {
            case 1:
            case 2:
                return new[] { EnemyTier.Normal, EnemyTier.Normal }; // 일반 2마리
            case 3:
            case 4:
                return new[] { EnemyTier.Normal, EnemyTier.Normal, EnemyTier.Normal }; // 일반 3마리
            case 5:
                return new[] { EnemyTier.Epic }; // 에픽 1마리
            case 6:
            case 7:
                return new[] { EnemyTier.Normal, EnemyTier.Normal, EnemyTier.Normal, EnemyTier.Normal }; // 일반 4마리
            case 8:
                return new[] { EnemyTier.Epic, EnemyTier.Normal, EnemyTier.Normal, EnemyTier.Normal }; // 에픽 1 + 일반 3
            case 9:
                return new EnemyTier[0]; // 미노 강화/축복을 받는 비전투 스테이지
            case 10:
                return new[] { EnemyTier.Boss }; // 보스 1마리
            default:
                return new EnemyTier[0]; // 정의되지 않은 스테이지는 적 없음
        }
    }

    // 보스가 포함된 스테이지인지 (보스만 처치해도 스테이지가 끝남)
    public static bool IsBossStage(int stage)
    {
        foreach (EnemyTier tier in GetComposition(stage))
            if (tier == EnemyTier.Boss) return true;
        return false;
    }

    // 적이 없는 비전투 스테이지인지 (강화/축복 이벤트)
    public static bool IsNonCombatStage(int stage)
    {
        return GetComposition(stage).Length == 0;
    }
}
