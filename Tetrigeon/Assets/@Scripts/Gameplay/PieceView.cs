using UnityEngine;

// Temporary placeholder visual: colored squares generated in code, no art asset needed yet.
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
            block.transform.localScale = Vector3.one * (GridManager.CellSize * 0.9f);

            SpriteRenderer spriteRenderer = block.AddComponent<SpriteRenderer>();
            spriteRenderer.sprite = PieceVisuals.GetSquareSprite();
            spriteRenderer.color = PieceVisuals.TypeColors[(int)piece.Type];
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
        }
    }
}
