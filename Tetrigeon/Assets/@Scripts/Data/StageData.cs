// 스테이지별 적 구성. 같은 스테이지의 적들은 함께 등장해 같은 적 턴에 행동한다.
public static class StageData
{
    public const int LastStage = 10; // 현재 챕터의 마지막 스테이지

    // 해당 스테이지에 등장하는 적 등급 목록
    public static EnemyTier[] GetComposition(int stage)
    {
        switch (stage)
        {
            case 1:
                return new[] { EnemyTier.Normal }; // 일반 1마리
            case 2:
                return new[] { EnemyTier.Normal, EnemyTier.Normal }; // 일반 2마리
            case 3:
                return new[] { EnemyTier.Normal, EnemyTier.Normal, EnemyTier.Normal }; // 일반 3마리
            case 4:
                return new[] { EnemyTier.Epic }; // 에픽을 처음 단독으로 소개
            case 5:
                return new[] { EnemyTier.Normal, EnemyTier.Epic }; // 일반 1 + 에픽 1 (일반 왼쪽, 에픽 오른쪽)
            case 6:
                return new[] { EnemyTier.Normal, EnemyTier.Normal, EnemyTier.Epic }; // 일반 2 + 에픽 1 (일반 왼쪽, 에픽 오른쪽)
            case 7:
                return new[] { EnemyTier.Epic, EnemyTier.Epic }; // 에픽 2마리
            case 8:
                return new[] { EnemyTier.Normal, EnemyTier.Epic, EnemyTier.Epic }; // 일반 1 + 에픽 2 (일반을 왼쪽에 배치)
            case 9:
                return new[] { EnemyTier.Epic, EnemyTier.Epic, EnemyTier.Epic }; // 에픽 3마리
            case 10:
                return new[] { EnemyTier.Normal, EnemyTier.Epic, EnemyTier.Boss }; // 보스는 폭이 넓어 맨 오른쪽에 둠 (옆 적과 겹치지 않게)
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
}
