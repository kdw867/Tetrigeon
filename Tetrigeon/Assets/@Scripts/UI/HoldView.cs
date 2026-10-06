using UnityEngine;

// Hold 슬롯에 든 조각을 보드 옆 월드 좌표에 표시 (다른 조각 비주얼이랑 같은 방식)
public class HoldView : MonoBehaviour
{
    private Transform[] blocks; // 현재 표시 중인 블록들

    private void OnEnable()
    {
        PieceSpawner.OnHoldChanged += UpdateDisplay; // Hold 바뀔 때마다 갱신
    }

    private void OnDisable()
    {
        PieceSpawner.OnHoldChanged -= UpdateDisplay; // 이벤트 구독 해제
    }

    private void UpdateDisplay(TetrominoType? type)
    {
        ClearBlocks(); // 기존 블록 지우기

        if (type == null) return; // Hold 비어있으면 표시할 것 없음

        MinoState mino = PieceSpawner.Instance.HeldPiece; // 여왕 스킬로 바뀐 모양·회전 금지까지 포함한 보관 미노
        Vector2Int[] cells = mino.GetCells(0); // 스폰 모양 그대로 표시 (증식 칸 포함)
        Vector2 boundsCenter = TetrominoData.GetSpawnBoundsCenter(mino.Type, mino.GrownCell); // 모양 중심 (박스 정중앙 정렬용)
        blocks = new Transform[cells.Length];

        for (int i = 0; i < cells.Length; i++)
        {
            GameObject block = new GameObject("Block");
            block.transform.SetParent(transform);
            block.transform.localPosition = new Vector3(
                (cells[i].x - boundsCenter.x) * GridManager.CellSize,
                (cells[i].y - boundsCenter.y) * GridManager.CellSize,
                0f);

            SpriteRenderer spriteRenderer = block.AddComponent<SpriteRenderer>();
            PieceVisuals.ApplyMinoArt(spriteRenderer, mino.Type, i, 1f, 10, mino.RotationLocked); // 칸별 원본 아트와 방향 적용 (회전 금지는 침식 색)
            spriteRenderer.sortingOrder = 10;

            blocks[i] = block.transform;
        }
    }

    private void ClearBlocks()
    {
        if (blocks == null) return;
        foreach (Transform block in blocks)
            if (block != null) Destroy(block.gameObject); // 이전 블록 삭제
        blocks = null;
    }
}
