using UnityEngine;

public class GridManager : MonoBehaviour
{
    public static GridManager Instance { get; private set; } // 싱글톤 인스턴스

    public const int Width = 10; // 보드 가로 칸 수
    public const int Height = 22; // 보드 세로 칸 수

    // Visual mapping only — grid logic stays on integer cells.
    public const float CellSize = 30f / 108f; // FHD·카메라 크기 5 기준 한 칸을 정확히 30픽셀로 표시

    // Board panel's own transform (dragged in the Scene view) is the source of truth for
    // where the board sits — its position is the panel's center, so BoardOrigin (cell (0,0)'s
    // center) is offset back by half the board size.
    [SerializeField] private Transform boardAnchor; // 보드 패널 오브젝트 (드래그로 위치 조정)

    public static Vector3 BoardOrigin
    {
        get
        {
            float halfWidth = Width * CellSize / 2f - CellSize / 2f; // 패널 중심 기준 가로 절반 오프셋
            float halfHeight = Height * CellSize / 2f - CellSize / 2f; // 패널 중심 기준 세로 절반 오프셋
            return Instance.boardAnchor.position - new Vector3(halfWidth, halfHeight, 0f); // (0,0)칸 중심 좌표 계산
        }
    }

    public static Vector3 CellToWorld(Vector2Int cell)
    {
        return BoardOrigin + new Vector3(cell.x * CellSize, cell.y * CellSize, 0f); // 그리드 좌표 -> 월드 좌표 변환
    }

    private Transform[,] cells = new Transform[Width, Height]; // 칸마다 고정된 블록 오브젝트 참조 (없으면 null)

    private void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject); // 중복 인스턴스 제거
            return;
        }
        Instance = this; // 싱글톤 등록
    }

    public bool IsInsideBoard(Vector2Int pos)
    {
        return pos.x >= 0 && pos.x < Width && pos.y >= 0 && pos.y < Height; // 좌우/위아래 범위 다 체크
    }

    public bool IsCellEmpty(Vector2Int pos)
    {
        if (pos.y >= Height) return true; // 보드 위쪽은 항상 빈 칸 취급
        return cells[pos.x, pos.y] == null; // 블록 참조 없으면 빈 칸
    }

    public void SetCell(Vector2Int pos, Transform block)
    {
        if (pos.y < Height)
            cells[pos.x, pos.y] = block; // 해당 칸에 블록 오브젝트 등록
    }

    // True if the cell is filled or outside the board — used for T-Spin corner checks.
    public bool IsCornerFilled(Vector2Int pos)
    {
        if (!IsInsideBoard(pos)) return true; // 보드 바깥은 채워진 것으로 취급 (T스핀 판정 규칙)
        return !IsCellEmpty(pos);
    }

    // 꽉 찬 줄을 지우고 위 블록들을 내림. 지운 줄 개수를 반환.
    public int ClearLines()
    {
        int clearedCount = 0; // 지운 줄 수
        int writeY = 0; // 다음에 채울 위치 (아래부터 압축)

        for (int y = 0; y < Height; y++)
        {
            if (IsRowFull(y))
            {
                for (int x = 0; x < Width; x++)
                {
                    if (cells[x, y] != null)
                        Destroy(cells[x, y].gameObject); // 꽉 찬 줄의 블록 오브젝트 삭제
                    cells[x, y] = null; // 칸 비우기
                }
                clearedCount++; // 지운 줄 카운트
                continue; // writeY는 그대로 두고 다음 줄로
            }

            if (writeY != y)
            {
                for (int x = 0; x < Width; x++)
                {
                    cells[x, writeY] = cells[x, y]; // 살아남은 줄을 아래로 이동
                    cells[x, y] = null; // 원래 자리 비우기
                    if (cells[x, writeY] != null)
                        cells[x, writeY].position = CellToWorld(new Vector2Int(x, writeY)); // 블록 실제 위치도 이동
                }
            }
            writeY++; // 다음 압축 위치로 이동
        }

        return clearedCount;
    }

    private bool IsRowFull(int y)
    {
        for (int x = 0; x < Width; x++)
            if (cells[x, y] == null) return false; // 빈 칸 하나라도 있으면 꽉 안 찬 것
        return true;
    }

    // Top Out 시, 블록이 있는 가장 위 줄 하나만 제거. 지울 줄이 있었으면 true (보드 다 빌 때까지 반복 호출됨).
    public bool ClearTopRow()
    {
        int y = Height - 1;
        while (y >= 0 && IsRowEmpty(y)) y--; // 위에서부터 내려오며 블록 있는 첫 줄 찾기
        if (y < 0) return false; // 보드가 이미 완전히 비어있음

        for (int x = 0; x < Width; x++)
        {
            if (cells[x, y] != null)
                Destroy(cells[x, y].gameObject); // 블록 오브젝트 삭제
            cells[x, y] = null; // 칸 비우기
        }
        return true;
    }

    private bool IsRowEmpty(int y)
    {
        for (int x = 0; x < Width; x++)
            if (cells[x, y] != null) return false; // 블록 하나라도 있으면 빈 줄 아님
        return true;
    }
}
