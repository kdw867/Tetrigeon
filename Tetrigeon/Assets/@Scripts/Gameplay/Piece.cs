using UnityEngine;

public class Piece : MonoBehaviour
{
    public TetrominoType Type { get; private set; }
    public int RotationState { get; private set; }
    public Vector2Int BoardPosition { get; private set; }

    // Tracked for T-Spin detection (Lock step): true only if the last successful
    // action before locking was a rotation, not a move.
    public bool LastActionWasRotation { get; private set; }
    public int LastKickTestIndex { get; private set; }

    public void Init(TetrominoType type, Vector2Int spawnPosition)
    {
        Type = type;
        RotationState = 0;
        BoardPosition = spawnPosition;
        LastActionWasRotation = false;
        LastKickTestIndex = -1;
    }

    private void Update()
    {
        if (Input.GetKeyDown(KeyCode.LeftArrow)) TryMove(Vector2Int.left);
        if (Input.GetKeyDown(KeyCode.RightArrow)) TryMove(Vector2Int.right);
        if (Input.GetKeyDown(KeyCode.DownArrow)) TryMove(Vector2Int.down);
        if (Input.GetKeyDown(KeyCode.UpArrow) || Input.GetKeyDown(KeyCode.X)) TryRotate(1);
        if (Input.GetKeyDown(KeyCode.Z)) TryRotate(-1);
    }

    public bool TryMove(Vector2Int delta)
    {
        Vector2Int newPosition = BoardPosition + delta;
        if (!CanPlace(RotationState, newPosition)) return false;

        BoardPosition = newPosition;
        LastActionWasRotation = false;
        return true;
    }

    public bool TryRotate(int direction)
    {
        int newRotationState = RotationState + direction;
        Vector2Int[] tests = SRSKickData.GetTests(Type, RotationState, newRotationState);

        for (int i = 0; i < tests.Length; i++)
        {
            Vector2Int candidate = BoardPosition + tests[i];
            if (CanPlace(newRotationState, candidate))
            {
                RotationState = ((newRotationState % 4) + 4) % 4;
                BoardPosition = candidate;
                LastActionWasRotation = true;
                LastKickTestIndex = i;
                return true;
            }
        }

        return false;
    }

    private bool CanPlace(int rotationState, Vector2Int position)
    {
        Vector2Int[] cells = TetrominoData.GetCells(Type, rotationState);
        foreach (Vector2Int cell in cells)
        {
            Vector2Int boardCell = position + cell;
            if (!GridManager.Instance.IsInsideBoard(boardCell)) return false;
            if (!GridManager.Instance.IsCellEmpty(boardCell)) return false;
        }
        return true;
    }
}
