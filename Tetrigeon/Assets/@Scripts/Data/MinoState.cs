using UnityEngine;

// 미노 한 개의 상태. 종류와 수정여왕 스킬로 바뀐 점(증식 칸, 회전 금지)을 NEXT·조작 미노·Hold가 함께 쓴다.
public class MinoState
{
    public readonly TetrominoType Type; // 미노 종류
    public Vector2Int? GrownCell; // 여왕 증식으로 붙은 칸 (스폰 방향 로컬 좌표, 없으면 null)
    public bool RotationLocked; // 여왕 회전 금지 (고정될 때까지 회전 불가)

    public MinoState(TetrominoType type) { Type = type; } // 가방에서 새로 나온 미노는 변형 없음

    public Vector2Int[] GetCells(int rotationState) => TetrominoData.GetCells(Type, rotationState, GrownCell); // 원래 4칸 + 증식 칸(있으면 5번째)
}
