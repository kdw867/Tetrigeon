using UnityEngine;

public class GridManager : MonoBehaviour
{
    public static GridManager Instance { get; private set; }

    public const int Width = 10;
    public const int Height = 20;

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
