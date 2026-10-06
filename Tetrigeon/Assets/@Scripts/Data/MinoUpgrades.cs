using System.Collections.Generic;
using UnityEngine;

// 런 동안 유지되는 미노 강화 단계.
public static class MinoUpgrades
{
    private static readonly TetrominoType[] AllTypes = // 강화 후보가 되는 미노 7종
    {
        TetrominoType.I, TetrominoType.J, TetrominoType.L, TetrominoType.O,
        TetrominoType.S, TetrominoType.T, TetrominoType.Z
    };

    public const int MaxLevel = 5; // 미노 하나가 도달할 수 있는 최대 강화 단계 (도달하면 보상 후보에서 빠짐)

    private static readonly Dictionary<TetrominoType, int> levels = new Dictionary<TetrominoType, int>(); // 미노별 강화 단계
    private static readonly Dictionary<TetrominoType, List<int>> crystalCells = new Dictionary<TetrominoType, List<int>>(); // 미노별 수정 칸 번호 (원래 칸 순서 기준, 한 번 정해지면 런이 끝날 때까지 유지)
    private const int CellsPerMino = 4; // 미노 한 개의 원래 칸 수

    public static event System.Action OnChanged; // 강화 상태가 바뀔 때 알림 (UI 갱신용)

    // 새 런을 시작할 때 강화 기록을 전부 지움 (씬을 다시 로드해도 정적 값이 남지 않게)
    public static void ResetRun()
    {
        levels.Clear();
        crystalCells.Clear(); // 수정 칸도 함께 초기화
        OnChanged?.Invoke(); // 목록을 빈 상태로 되돌리도록 알림
    }

    // 이 미노의 해당 칸이 수정 칸인지 (Lv.2부터 레벨마다 한 칸씩 늘어남)
    public static bool IsCrystalCell(TetrominoType type, int cellIndex)
    {
        List<int> cells;
        return crystalCells.TryGetValue(type, out cells) && cells.Contains(cellIndex); // 아직 수정이 없으면 false
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
        AddCrystalCell(type); // Lv.2부터 수정 칸을 하나 더 정함 (강화 시점에 한 번만 뽑음)
        OnChanged?.Invoke(); // 강화가 실제로 적용된 직후에만 알림
    }

    // 레벨에 맞는 개수(Lv.2는 1개 ... Lv.5는 4개)가 되도록, 아직 수정이 아닌 칸 중 하나를 균등하게 골라 수정 칸으로 추가
    private static void AddCrystalCell(TetrominoType type)
    {
        List<int> cells;
        if (!crystalCells.TryGetValue(type, out cells)) // 이 미노의 첫 수정이면 목록 생성
        {
            cells = new List<int>();
            crystalCells[type] = cells;
        }

        if (cells.Count >= GetLevel(type) - 1 || cells.Count >= CellsPerMino) return; // 이미 레벨에 맞는 수정 수면 추가하지 않음 (Lv.1 포함)

        List<int> candidates = new List<int>(); // 아직 수정이 아닌 칸들
        for (int i = 0; i < CellsPerMino; i++)
            if (!cells.Contains(i)) candidates.Add(i);

        cells.Add(candidates[Random.Range(0, candidates.Count)]); // 남은 칸 중 하나를 균등하게 선택 (먼저 정해진 수정은 바뀌지 않음)
    }

    // 해당 미노가 더 강화할 수 없는 상태인지
    public static bool IsMaxed(TetrominoType type)
    {
        return GetLevel(type) >= MaxLevel;
    }

    // 보상 화면에 제시할 강화 후보를 중복 없이 뽑음 (최대 단계에 도달한 미노는 제외)
    public static TetrominoType[] DrawChoices(int count)
    {
        List<TetrominoType> pool = new List<TetrominoType>(); // 아직 더 강화할 수 있는 미노만 후보 풀에 담음
        foreach (TetrominoType type in AllTypes)
            if (!IsMaxed(type)) pool.Add(type);

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
