using UnityEngine;

public class GridManager : MonoBehaviour
{
    public static GridManager Instance { get; private set; }

    public const int Width = 10;
    public const int Height = 20;

    // Visual mapping only — grid logic stays on integer cells.
    public const float CellSize = 0.315f;

    // Board panel's own transform (dragged in the Scene view) is the source of truth for
    // where the board sits — its position is the panel's center, so BoardOrigin (cell (0,0)'s
    // center) is offset back by half the board size.
    [SerializeField] private Transform boardAnchor;

    public static Vector3 BoardOrigin
    {
        get
        {
            float halfWidth = Width * CellSize / 2f - CellSize / 2f;
            float halfHeight = Height * CellSize / 2f - CellSize / 2f;
            return Instance.boardAnchor.position - new Vector3(halfWidth, halfHeight, 0f);
        }
    }

    public static Vector3 CellToWorld(Vector2Int cell)
    {
        return BoardOrigin + new Vector3(cell.x * CellSize, cell.y * CellSize, 0f);
    }

    private bool[,] cells = new bool[Width, Height];

    private void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }
        Instance = this;
    }

    public bool IsInsideBoard(Vector2Int pos)
    {
        return pos.x >= 0 && pos.x < Width && pos.y >= 0;
    }

    public bool IsCellEmpty(Vector2Int pos)
    {
        if (pos.y >= Height) return true;
        return !cells[pos.x, pos.y];
    }

    public void SetCell(Vector2Int pos, bool occupied)
    {
        if (pos.y < Height)
            cells[pos.x, pos.y] = occupied;
    }

    // True if the cell is filled or outside the board — used for T-Spin corner checks.
    public bool IsCornerFilled(Vector2Int pos)
    {
        if (!IsInsideBoard(pos)) return true;
        return !IsCellEmpty(pos);
    }
}
