using System.Collections.Generic;
using UnityEngine;

public static class SRSKickData
{
    private static Vector2Int V(int x, int y) => new Vector2Int(x, y);

    private static readonly Vector2Int[] NoKick = { Vector2Int.zero };

    // Standard SRS wall kick table for J, L, S, T, Z. Key = (fromState, toState).
    private static readonly Dictionary<(int from, int to), Vector2Int[]> JlstzTests = new()
    {
        { (0, 1), new[] { V(0, 0), V(-1, 0), V(-1, 1), V(0, -2), V(-1, -2) } },
        { (1, 0), new[] { V(0, 0), V(1, 0), V(1, -1), V(0, 2), V(1, 2) } },
        { (1, 2), new[] { V(0, 0), V(1, 0), V(1, -1), V(0, 2), V(1, 2) } },
        { (2, 1), new[] { V(0, 0), V(-1, 0), V(-1, 1), V(0, -2), V(-1, -2) } },
        { (2, 3), new[] { V(0, 0), V(1, 0), V(1, 1), V(0, -2), V(1, -2) } },
        { (3, 2), new[] { V(0, 0), V(-1, 0), V(-1, -1), V(0, 2), V(-1, 2) } },
        { (3, 0), new[] { V(0, 0), V(-1, 0), V(-1, -1), V(0, 2), V(-1, 2) } },
        { (0, 3), new[] { V(0, 0), V(1, 0), V(1, 1), V(0, -2), V(1, -2) } },

        // 180도 회전 (SRS+ 방식). 표준 SRS에는 없어 별도로 정의한다.
        { (0, 2), new[] { V(0, 0), V(0, 1), V(1, 1), V(-1, 1), V(1, 0), V(-1, 0) } },
        { (2, 0), new[] { V(0, 0), V(0, -1), V(-1, -1), V(1, -1), V(-1, 0), V(1, 0) } },
        { (1, 3), new[] { V(0, 0), V(1, 0), V(1, 2), V(1, 1), V(0, 2), V(0, 1) } },
        { (3, 1), new[] { V(0, 0), V(-1, 0), V(-1, 2), V(-1, 1), V(0, 2), V(0, 1) } },
    };

    // Standard SRS wall kick table for I. Key = (fromState, toState).
    private static readonly Dictionary<(int from, int to), Vector2Int[]> ITests = new()
    {
        { (0, 1), new[] { V(0, 0), V(-2, 0), V(1, 0), V(-2, -1), V(1, 2) } },
        { (1, 0), new[] { V(0, 0), V(2, 0), V(-1, 0), V(2, 1), V(-1, -2) } },
        { (1, 2), new[] { V(0, 0), V(-1, 0), V(2, 0), V(-1, 2), V(2, -1) } },
        { (2, 1), new[] { V(0, 0), V(1, 0), V(-2, 0), V(1, -2), V(-2, 1) } },
        { (2, 3), new[] { V(0, 0), V(2, 0), V(-1, 0), V(2, 1), V(-1, -2) } },
        { (3, 2), new[] { V(0, 0), V(-2, 0), V(1, 0), V(-2, -1), V(1, 2) } },
        { (3, 0), new[] { V(0, 0), V(1, 0), V(-2, 0), V(1, -2), V(-2, 1) } },
        { (0, 3), new[] { V(0, 0), V(-1, 0), V(2, 0), V(-1, 2), V(2, -1) } },
        // I는 180도 회전해도 모양이 같아 별도 킥 없이 제자리 회전만 시도한다.
    };

    // Returns the ordered list of offsets to try when rotating from one state to another.
    public static Vector2Int[] GetTests(TetrominoType type, int fromState, int toState)
    {
        fromState = ((fromState % 4) + 4) % 4;
        toState = ((toState % 4) + 4) % 4;

        if (type == TetrominoType.O) return NoKick;

        var table = type == TetrominoType.I ? ITests : JlstzTests;
        return table.TryGetValue((fromState, toState), out var tests) ? tests : NoKick;
    }
}
