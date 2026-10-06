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
    public static Vector2Int[] GetCells(TetrominoType type, int rotationState, Vector2Int? grownCell = null) // 여왕 증식 칸이 있으면 원래 4칸 뒤에 붙여 함께 회전
    {
        rotationState = ((rotationState % 4) + 4) % 4;

        Vector2Int[] spawn = SpawnCells[type];
        Vector2 pivot = Pivot[type];
        Vector2Int[] result = new Vector2Int[spawn.Length + (grownCell.HasValue ? 1 : 0)]; // 증식 칸이 있으면 5칸

        for (int i = 0; i < result.Length; i++)
        {
            Vector2 cell = i < spawn.Length ? spawn[i] : grownCell.Value; // 마지막 칸은 증식 칸
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
    public static Vector2 GetSpawnBoundsCenter(TetrominoType type, Vector2Int? grownCell = null) // 증식 칸까지 포함한 모양으로 중앙 정렬
    {
        Vector2Int[] cells = GetCells(type, 0, grownCell); // 스폰 방향 그대로의 칸들
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

    // 여왕 증식 칸 위치: 기존 칸과 변이 맞닿은 빈 자리 중 무작위. 스폰 때 보드 위로 벗어나지 않게 로컬 가로 0~3, 세로 0~2 안에서만 고른다.
    public static Vector2Int PickGrownCell(TetrominoType type)
    {
        Vector2Int[] cells = SpawnCells[type]; // 스폰 방향 원래 4칸
        List<Vector2Int> candidates = new List<Vector2Int>(); // 붙일 수 있는 자리
        Vector2Int[] directions = { Vector2Int.up, Vector2Int.down, Vector2Int.left, Vector2Int.right }; // 변으로 맞닿는 네 방향
        foreach (Vector2Int cell in cells)
            foreach (Vector2Int direction in directions)
            {
                Vector2Int candidate = cell + direction; // 이웃 자리
                if (candidate.x < 0 || candidate.x > 3 || candidate.y < 0 || candidate.y > 2) continue; // 로컬 4x3 칸 밖 제외
                if (System.Array.IndexOf(cells, candidate) >= 0 || candidates.Contains(candidate)) continue; // 이미 있는 칸과 중복 후보 제외
                candidates.Add(candidate);
            }
        return candidates[Random.Range(0, candidates.Count)]; // 후보 중 균등하게 하나
    }
}
