using UnityEngine;

// 네 칸의 바위·마법 스프라이트를 조각 위치에 맞춰 표시
[RequireComponent(typeof(Piece))]
public class PieceView : MonoBehaviour
{
    private Piece piece;
    private Transform[] blocks;

    public Transform[] Blocks => blocks; // 고정(Lock) 시 블록을 개별 오브젝트로 넘기기 위해 외부 노출

    private void Awake()
    {
        piece = GetComponent<Piece>();
    }

    private void Start()
    {
        blocks = new Transform[4];
        for (int i = 0; i < blocks.Length; i++)
        {
            GameObject block = new GameObject("Block");
            block.transform.SetParent(transform);

            SpriteRenderer spriteRenderer = block.AddComponent<SpriteRenderer>();
            PieceVisuals.ApplyMinoArt(spriteRenderer, piece.Type, i); // 원본의 각 칸과 연결되는 균열 적용
            spriteRenderer.sortingOrder = 10;

            blocks[i] = block.transform;
        }
    }

    private void LateUpdate()
    {
        Vector2Int[] cells = TetrominoData.GetCells(piece.Type, piece.RotationState);
        for (int i = 0; i < blocks.Length; i++)
        {
            Vector2Int boardCell = piece.BoardPosition + cells[i];
            blocks[i].position = GridManager.CellToWorld(boardCell);
            blocks[i].rotation = PieceVisuals.GetArtRotation(piece.Type, piece.RotationState); // 칸 위치와 함께 균열 방향도 회전
        }
    }
}
