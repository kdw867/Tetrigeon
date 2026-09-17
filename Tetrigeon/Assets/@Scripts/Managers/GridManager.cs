using UnityEngine;

public class GridManager : MonoBehaviour
{
    public static GridManager Instance { get; private set; } // 싱글톤 인스턴스

    public const int Width = 10; // 보드 가로 칸 수
    public const int Height = 22; // 보드 세로 칸 수

    // Visual mapping only — grid logic stays on integer cells.
    public const float CellSize = 27f / 108f; // FHD에서 한 칸 27픽셀로 표시하여 배경 안쪽 여백 확보

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

    // Top Out 마무리용: 배열에 등록되지 않은 잔여 블록까지 포함해 보드를 완전히 비움
    public void ClearAllBlocks()
    {
        for (int y = 0; y < Height; y++)
            for (int x = 0; x < Width; x++)
                cells[x, y] = null; // 칸 정보 초기화

        for (int i = transform.childCount - 1; i >= 0; i--)
            Destroy(transform.GetChild(i).gameObject); // 그리드에 붙은 블록 오브젝트 전부 제거
    }

    // 보드에 블록이 하나도 없는지 (퍼펙트 클리어 판정용)
    public bool IsBoardEmpty()
    {
        for (int y = 0; y < Height; y++)
            if (!IsRowEmpty(y)) return false; // 블록 있는 줄 하나라도 있으면 아님
        return true;
    }

    // 적 턴: 아래에 구멍 하나 뚫린 방해 줄을 추가하고 기존 블록을 위로 밀어올림
    public void AddGarbageLines(int count)
    {
        int hole = UnityEngine.Random.Range(0, Width); // 한 번에 추가되는 줄들은 모두 같은 칸을 비워 둠

        for (int i = 0; i < count; i++)
        {
            for (int x = 0; x < Width; x++) // 맨 윗줄 블록은 밀려나며 사라짐
            {
                if (cells[x, Height - 1] != null)
                    Destroy(cells[x, Height - 1].gameObject);
                cells[x, Height - 1] = null;
            }

            for (int y = Height - 2; y >= 0; y--) // 위에서부터 한 칸씩 위로 이동
                for (int x = 0; x < Width; x++)
                {
                    cells[x, y + 1] = cells[x, y];
                    cells[x, y] = null;
                    if (cells[x, y + 1] != null)
                        cells[x, y + 1].position = CellToWorld(new Vector2Int(x, y + 1)); // 블록 실제 위치도 이동
                }

            for (int x = 0; x < Width; x++)
            {
                if (x == hole) continue; // 구멍은 블록 없이 둠
                cells[x, 0] = CreateGarbageBlock(new Vector2Int(x, 0)); // 맨 아랫줄에 방해 블록 생성
            }
        }
    }

    private Transform CreateGarbageBlock(Vector2Int cell)
    {
        GameObject block = new GameObject("GarbageBlock");
        block.transform.SetParent(transform); // 그리드가 관리하도록 자식으로 등록
        block.transform.position = CellToWorld(cell);
        block.transform.localScale = Vector3.one * CellSize; // 한 칸 크기로 맞춤

        SpriteRenderer spriteRenderer = block.AddComponent<SpriteRenderer>();
        spriteRenderer.sprite = PieceVisuals.GetSquareSprite(); // ponytail: 전용 아트 나오면 교체
        spriteRenderer.color = new Color(0.35f, 0.35f, 0.38f); // 미노와 구분되는 회색
        spriteRenderer.sortingOrder = 10; // 고정된 블록과 같은 순서

        return block.transform;
    }
}
