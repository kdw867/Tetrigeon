using UnityEngine;

public class Piece : MonoBehaviour
{
    [SerializeField] private float moveRepeatDelay = 0.3f;
    [SerializeField] private float moveRepeatInterval = 0.05f;
    [SerializeField] private float gravityInterval = 1f; // 자동 낙하 간격 (초당 한 칸)

    private float leftTimer;
    private float rightTimer;
    private float downTimer;
    private float gravityTimer;

    public TetrominoType Type { get; private set; }
    public int RotationState { get; private set; }
    public Vector2Int BoardPosition { get; private set; }

    // Tracked for T-Spin detection (Lock step): true only if the last successful
    // action before locking was a rotation, not a move.
    public bool LastActionWasRotation { get; private set; }
    public int LastKickTestIndex { get; private set; }

    public bool JustMoved { get; private set; } // 이번 프레임에 이동/회전이 성공했는지 (Lock Delay 리셋용)

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
        JustMoved = false; // 이번 프레임 이동 여부 초기화

        HandleHeldMove(KeyCode.LeftArrow, Vector2Int.left, ref leftTimer);
        HandleHeldMove(KeyCode.RightArrow, Vector2Int.right, ref rightTimer);
        HandleHeldMove(KeyCode.DownArrow, Vector2Int.down, ref downTimer);

        if (Input.GetKeyDown(KeyCode.UpArrow) || Input.GetKeyDown(KeyCode.X)) TryRotate(1);
        if (Input.GetKeyDown(KeyCode.Z)) TryRotate(-1);

        gravityTimer += Time.deltaTime; // 자동 낙하 타이머 누적
        if (gravityTimer >= gravityInterval)
        {
            gravityTimer = 0f;
            TryMove(Vector2Int.down); // 막혀있으면 그냥 무시 (Lock Delay가 착지 판정 처리)
        }
    }

    // First press moves immediately; holding repeats after moveRepeatDelay, then every moveRepeatInterval.
    private void HandleHeldMove(KeyCode key, Vector2Int direction, ref float timer)
    {
        if (Input.GetKeyDown(key))
        {
            TryMove(direction);
            timer = moveRepeatDelay;
            return;
        }

        if (Input.GetKey(key))
        {
            timer -= Time.deltaTime;
            if (timer <= 0f)
            {
                TryMove(direction);
                timer = moveRepeatInterval;
            }
        }
    }

    public bool TryMove(Vector2Int delta)
    {
        Vector2Int newPosition = BoardPosition + delta;
        if (!CanPlace(RotationState, newPosition)) return false;

        BoardPosition = newPosition;
        LastActionWasRotation = false;
        JustMoved = true; // 이동 성공 기록
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
                JustMoved = true; // 회전 성공 기록
                return true;
            }
        }

        return false;
    }

    // 스폰 위치가 이미 막혀있는지 (Top Out 판정용)
    public bool IsSpawnBlocked()
    {
        return !CanPlace(RotationState, BoardPosition);
    }

    // 한 칸 아래로 못 내려가면 바닥/블록에 닿아있는 상태 (Lock Delay 판정용)
    public bool IsGrounded()
    {
        return !CanPlace(RotationState, BoardPosition + Vector2Int.down);
    }

    private bool CanPlace(int rotationState, Vector2Int position)
    {
        return CanPlaceType(Type, rotationState, position);
    }

    // 조각 인스턴스 없이도 특정 종류/위치가 놓일 수 있는지 검사 (스폰 전 Top Out 판정용)
    public static bool CanPlaceType(TetrominoType type, int rotationState, Vector2Int position)
    {
        Vector2Int[] cells = TetrominoData.GetCells(type, rotationState);
        foreach (Vector2Int cell in cells)
        {
            Vector2Int boardCell = position + cell;
            if (!GridManager.Instance.IsInsideBoard(boardCell)) return false;
            if (!GridManager.Instance.IsCellEmpty(boardCell)) return false;
        }
        return true;
    }
}
