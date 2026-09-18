using System.Collections.Generic;
using UnityEngine;

// 런 동안 유지되는 미노 강화 단계. 효과는 아직 미정이라 어떤 미노가 몇 단계인지만 기록한다.
public static class MinoUpgrades
{
    private static readonly TetrominoType[] AllTypes = // 강화 후보가 되는 미노 7종
    {
        TetrominoType.I, TetrominoType.J, TetrominoType.L, TetrominoType.O,
        TetrominoType.S, TetrominoType.T, TetrominoType.Z
    };

    private static readonly Dictionary<TetrominoType, int> levels = new Dictionary<TetrominoType, int>(); // 미노별 강화 단계

    // 새 런을 시작할 때 강화 기록을 전부 지움 (씬을 다시 로드해도 정적 값이 남지 않게)
    public static void ResetRun()
    {
        levels.Clear();
    }

    // 해당 미노의 현재 강화 단계 (강화된 적 없으면 0)
    public static int GetLevel(TetrominoType type)
    {
        int level;
        return levels.TryGetValue(type, out level) ? level : 0;
    }

    // 보상으로 고른 미노의 강화 단계를 1 올림
    public static void Upgrade(TetrominoType type)
    {
        levels[type] = GetLevel(type) + 1;
    }

    // 보상 화면에 제시할 강화 후보를 중복 없이 뽑음
    public static TetrominoType[] DrawChoices(int count)
    {
        List<TetrominoType> pool = new List<TetrominoType>(AllTypes); // 7종을 후보 풀로 복사
        for (int i = pool.Count - 1; i > 0; i--) // 피셔-예이츠 셔플 (BagManager와 같은 방식)
        {
            int j = Random.Range(0, i + 1);
            TetrominoType swap = pool[i];
            pool[i] = pool[j];
            pool[j] = swap;
        }

        if (count > pool.Count) count = pool.Count; // 후보보다 많이 요구하면 있는 만큼만
        return pool.GetRange(0, count).ToArray(); // 앞에서 필요한 개수만 잘라 반환
    }
}
