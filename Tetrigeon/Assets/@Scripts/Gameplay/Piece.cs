using UnityEngine;

public class Piece : MonoBehaviour
{
    [SerializeField] private float gravityInterval = 1f; // 자동 낙하 간격 (초당 한 칸)

    private float leftTimer; // 왼쪽 키의 DAS/ARR 타이머
    private float rightTimer; // 오른쪽 키의 DAS/ARR 타이머
    private float gravityTimer; // 자동 낙하 타이머
    private float dasCutTimer; // DCD: 회전·낙하 직후 DAS 이동을 멈추는 남은 시간

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

        if (dasCutTimer > 0f) dasCutTimer -= Time.deltaTime; // DCD 대기 시간 소모

        HandleHeldMove(KeyCode.LeftArrow, Vector2Int.left, ref leftTimer); // 좌우 이동은 DAS/ARR 규칙을 따름
        HandleHeldMove(KeyCode.RightArrow, Vector2Int.right, ref rightTimer);

        if (Input.GetKeyDown(KeyCode.UpArrow) || Input.GetKeyDown(KeyCode.X)) RotateWithDasCut(1);
        if (Input.GetKeyDown(KeyCode.Z)) RotateWithDasCut(-1);
        if (Input.GetKeyDown(KeyCode.A)) RotateWithDasCut(2); // 180도 회전

        HandleGravity();
    }

    // 회전에 성공하면 DCD만큼 좌우 자동 이동을 잠시 멈춘다
    private void RotateWithDasCut(int direction)
    {
        if (TryRotate(direction)) dasCutTimer = GameSettings.DcdSeconds;
    }

    // 자동 낙하. 아래 키를 누르고 있으면 SDF 배수만큼 빨라지고, 무한이면 즉시 바닥까지 내려간다.
    private void HandleGravity()
    {
        bool softDropping = Input.GetKey(KeyCode.DownArrow);

        if (softDropping && GameSettings.IsSoftDropInstant)
        {
            bool moved = false;
            while (TryMove(Vector2Int.down)) moved = true; // 바닥까지 한 번에 내림 (고정은 Lock Delay가 처리)
            if (moved) dasCutTimer = GameSettings.DcdSeconds; // 낙하 직후에도 DAS를 잠시 멈춤
            gravityTimer = 0f;
            return;
        }

        float interval = softDropping ? gravityInterval / GameSettings.Sdf : gravityInterval; // 소프트 드롭은 중력 배수 적용

        gravityTimer += Time.deltaTime;
        while (gravityTimer >= interval) // 간격이 아주 짧을 때 한 프레임에 여러 칸 내려갈 수 있게 함
        {
            gravityTimer -= interval;
            if (!TryMove(Vector2Int.down)) { gravityTimer = 0f; break; } // 막혔으면 Lock Delay가 착지 판정 처리
            if (softDropping) dasCutTimer = GameSettings.DcdSeconds; // 소프트 드롭 중에는 DAS를 계속 눌러둠
        }
    }

    // 첫 입력은 즉시 한 칸, 이후 DAS가 지나면 ARR 간격으로 반복 (ARR 0이면 끝까지 한 번에)
    private void HandleHeldMove(KeyCode key, Vector2Int direction, ref float timer)
    {
        if (Input.GetKeyDown(key))
        {
            TryMove(direction);
            timer = GameSettings.DasSeconds; // 자동 반복 시작까지 대기
            return;
        }

        if (!Input.GetKey(key)) return;
        if (dasCutTimer > 0f) return; // DCD 동안에는 자동 반복을 멈춤

        timer -= Time.deltaTime;
        if (timer > 0f) return;

        if (GameSettings.Arr <= 0)
        {
            while (TryMove(direction)) { } // ARR 0: 벽이나 블록에 닿을 때까지 즉시 이동
            timer = 0f;
            return;
        }

        float arr = GameSettings.ArrSeconds;
        TryMove(direction);
        timer += arr; // 남은 시간을 유지해 프레임 흔들림에 영향을 덜 받게 함
        if (timer < 0f) timer = 0f;
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
                LastKickTestIndex = direction == 2 ? -1 : i; // 5번째 킥 T스핀 특례는 90도 회전에만 적용
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

    // 실제로 이동시키지 않고, 하드드랍했을 때 멈추는 위치만 계산 (고스트 미리보기용)
    public Vector2Int GetGhostPosition()
    {
        Vector2Int position = BoardPosition; // 현재 위치에서 시작
        while (CanPlace(RotationState, position + Vector2Int.down)) // 더 내려갈 수 있는 동안 반복
            position += Vector2Int.down;
        return position; // 멈추는 위치 반환
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
