using System.Collections.Generic;
using UnityEngine;

public enum TetrominoType { I, J, L, O, S, T, Z }

public static class TetrominoData
{
    // Spawn-state (rotation 0) cell coordinates, standard SRS layout.
    private static readonly Dictionary<TetrominoType, Vector2Int[]> SpawnCells = new()
    {
        { TetrominoType.I, new[] { new Vector2Int(0, 2), new Vector2Int(1, 2), new Vector2Int(2, 2), new Vector2Int(3, 2) } },
        { TetrominoType.O, new[] { new Vector2Int(1, 1), new Vector2Int(2, 1), new Vector2Int(1, 2), new Vector2Int(2, 2) } }, // SRS처럼 4칸 상자의 가운데 두 열(스폰 시 보드 4~5열 중앙), 로컬 2번째 줄까지 닿게
        { TetrominoType.T, new[] { new Vector2Int(1, 2), new Vector2Int(0, 1), new Vector2Int(1, 1), new Vector2Int(2, 1) } },
        { TetrominoType.S, new[] { new Vector2Int(1, 2), new Vector2Int(2, 2), new Vector2Int(0, 1), new Vector2Int(1, 1) } },
        { TetrominoType.Z, new[] { new Vector2Int(0, 2), new Vector2Int(1, 2), new Vector2Int(1, 1), new Vector2Int(2, 1) } },
        { TetrominoType.J, new[] { new Vector2Int(0, 2), new Vector2Int(0, 1), new Vector2Int(1, 1), new Vector2Int(2, 1) } },
        { TetrominoType.L, new[] { new Vector2Int(2, 2), new Vector2Int(0, 1), new Vector2Int(1, 1), new Vector2Int(2, 1) } },
    };

    // Rotation pivot per piece (SRS: I and O rotate around a half-cell center).
    private static readonly Dictionary<TetrominoType, Vector2> Pivot = new()
    {
        { TetrominoType.I, new Vector2(1.5f, 1.5f) },
        { TetrominoType.O, new Vector2(1.5f, 1.5f) }, // 오른쪽으로 한 칸 옮긴 O 칸들의 정중앙 (회전해도 제자리)
        { TetrominoType.T, new Vector2(1f, 1f) },
        { TetrominoType.S, new Vector2(1f, 1f) },
        { TetrominoType.Z, new Vector2(1f, 1f) },
        { TetrominoType.J, new Vector2(1f, 1f) },
        { TetrominoType.L, new Vector2(1f, 1f) },
    };

    // rotationState: 0 = spawn, 1 = R (cw), 2 = 180, 3 = L (ccw)
    public static Vector2Int[] GetCells(TetrominoType type, int rotationState)
    {
        rotationState = ((rotationState % 4) + 4) % 4;

        Vector2Int[] spawn = SpawnCells[type];
        Vector2 pivot = Pivot[type];
        Vector2Int[] result = new Vector2Int[spawn.Length];

        for (int i = 0; i < spawn.Length; i++)
        {
            Vector2 cell = spawn[i];
            for (int r = 0; r < rotationState; r++)
            {
                Vector2 rel = cell - pivot;
                cell = pivot + new Vector2(rel.y, -rel.x);
            }
            result[i] = new Vector2Int(Mathf.RoundToInt(cell.x), Mathf.RoundToInt(cell.y));
        }

        return result;
    }

    // 미리보기 UI에서 조각을 박스 중앙에 맞추기 위한, 모양 바운딩 박스의 중심.
    public static Vector2 GetSpawnBoundsCenter(TetrominoType type)
    {
        Vector2Int[] cells = SpawnCells[type];
        int minX = cells[0].x, maxX = cells[0].x, minY = cells[0].y, maxY = cells[0].y;
        foreach (Vector2Int cell in cells)
        {
            minX = Mathf.Min(minX, cell.x);
            maxX = Mathf.Max(maxX, cell.x);
            minY = Mathf.Min(minY, cell.y);
            maxY = Mathf.Max(maxY, cell.y);
        }
        return new Vector2((minX + maxX) / 2f, (minY + maxY) / 2f);
    }
}
