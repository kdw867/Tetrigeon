using UnityEngine;

// Temporary placeholder visual: colored squares generated in code, no art asset needed yet.
[RequireComponent(typeof(Piece))]
public class PieceView : MonoBehaviour
{
    private static Sprite blockSprite;

    private static readonly Color[] TypeColors =
    {
        new Color(0f, 1f, 1f),      // I - cyan
        new Color(0f, 0f, 1f),      // J - blue
        new Color(1f, 0.5f, 0f),    // L - orange
        new Color(1f, 1f, 0f),      // O - yellow
        new Color(0f, 1f, 0f),      // S - green
        new Color(0.6f, 0f, 0.8f),  // T - purple
        new Color(1f, 0f, 0f),      // Z - red
    };

    private Piece piece;
    private Transform[] blocks;

    private void Awake()
    {
        piece = GetComponent<Piece>();
    }

    private void Start()
    {
        if (blockSprite == null)
            blockSprite = CreateSquareSprite();

        blocks = new Transform[4];
        for (int i = 0; i < blocks.Length; i++)
        {
            GameObject block = new GameObject("Block");
            block.transform.SetParent(transform);
            block.transform.localScale = Vector3.one * (GridManager.CellSize * 0.9f);

            SpriteRenderer spriteRenderer = block.AddComponent<SpriteRenderer>();
            spriteRenderer.sprite = blockSprite;
            spriteRenderer.color = TypeColors[(int)piece.Type];
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

    private static Sprite CreateSquareSprite()
    {
        Texture2D texture = new Texture2D(1, 1);
        texture.SetPixel(0, 0, Color.white);
        texture.Apply();
        return Sprite.Create(texture, new Rect(0, 0, 1, 1), new Vector2(0.5f, 0.5f), 1f);
    }
}
