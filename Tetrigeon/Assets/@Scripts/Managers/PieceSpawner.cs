using System;
using System.Collections;
using UnityEngine;

public class PieceSpawner : MonoBehaviour
{
    public static PieceSpawner Instance { get; private set; }

    public static event Action<TSpinType, int> OnPieceLocked; // T스핀 결과 + 지워진 줄 수 (데미지 계산용)
    public static event Action OnTopOut; // Top Out으로 맨 윗줄이 지워질 때마다 알림 (데미지에는 안 들어감)
    public static event Action<TetrominoType?> OnHoldChanged; // Hold 슬롯 내용 바뀔 때 알림 (UI 연결용)

    [SerializeField] private Piece piecePrefab;
    [SerializeField] private float lockDelay = 0.5f; // 착지 후 고정까지 유예 시간
    [SerializeField] private float topOutRowDelay = 0.15f; // Top Out 한 줄 지울 때마다 딜레이 (눈에 보이게)
    [SerializeField] private float topOutStartDelay = 0.4f; // 맨 위 줄에 고정된 걸 눈으로 확인할 시간 (줄 지우기 시작 전)

    private static readonly Vector2Int SpawnPosition = new Vector2Int(3, GridManager.Height - 3);

    private Piece currentPiece;
    private float lockTimer; // 착지 상태로 남은 유예 시간

    private TetrominoType? heldType; // 현재 Hold에 들어있는 조각 (없으면 null)
    private bool holdUsed; // 이번 조각에서 이미 Hold를 썼는지

    private void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }
        Instance = this;
    }

    private void Start()
    {
        SpawnNext();
    }

    private void Update()
    {
        if (currentPiece == null) return;

        if (Input.GetKeyDown(KeyCode.Space))
        {
            HardDrop();
            return;
        }

        if (!holdUsed && (Input.GetKeyDown(KeyCode.C) || Input.GetKeyDown(KeyCode.LeftShift)))
            SwapHold();
    }

    private void LateUpdate()
    {
        if (currentPiece == null) return; // Hold/HardDrop으로 이미 없어졌으면 스킵

        if (currentPiece.IsGrounded())
        {
            if (currentPiece.JustMoved)
                lockTimer = lockDelay; // 착지 상태에서 움직이면 유예 시간 리셋
            // ponytail: 이동 횟수 제한(guideline의 15-move 룰) 없음. 무한 리셋 악용되면 그때 추가.

            lockTimer -= Time.deltaTime;
            if (lockTimer <= 0f)
                Lock();
        }
        else
        {
            lockTimer = lockDelay; // 공중에 떠있으면 항상 유예 시간 최대로 유지
        }
    }

    private void SpawnNext()
    {
        holdUsed = false; // 새 조각이니 Hold 다시 사용 가능

        TetrominoType type = BagManager.Instance.Dequeue(); // 다음 조각 종류 뽑기

        if (Piece.CanPlaceType(type, 0, SpawnPosition)) // 스폰 자리가 바로 비어있으면
        {
            SpawnPiece(type);
        }
        else
        {
            StartCoroutine(ClearTopRowsThenSpawn(type)); // 막혀있으면 한 줄씩 지우면서 대기
        }
    }

    // Top Out 시 다음 조각 스폰을 멈추고, 보드가 완전히 빌 때까지 맨 위 줄부터 한 줄씩 지움.
    private IEnumerator ClearTopRowsThenSpawn(TetrominoType type)
    {
        yield return new WaitForSeconds(topOutStartDelay); // 고정된 모습을 잠깐 보여준 뒤 지우기 시작

        while (GridManager.Instance.ClearTopRow()) // 지울 줄이 남아있는 동안 반복
        {
            OnTopOut?.Invoke();
            yield return new WaitForSeconds(topOutRowDelay); // 다음 줄 지우기 전 대기
        }

        SpawnPiece(type); // 보드 완전히 비워진 뒤에만 다음 조각 스폰
    }

    private void SpawnPiece(TetrominoType type)
    {
        currentPiece = Instantiate(piecePrefab); // 프리팹으로 새 조각 생성
        currentPiece.Init(type, SpawnPosition); // 스폰 위치에 배치
        lockTimer = lockDelay; // 유예 시간 초기화
    }

    private void SwapHold()
    {
        TetrominoType current = currentPiece.Type; // 지금 조각 종류 기억
        Destroy(currentPiece.gameObject); // 지금 조각은 그리드에 등록 없이 바로 제거 (고정 아님)

        TetrominoType nextType = heldType ?? BagManager.Instance.Dequeue(); // Hold 비어있으면 다음 조각으로
        heldType = current; // 지금 조각을 Hold에 저장
        holdUsed = true; // 이번 조각에서 Hold 다 씀

        SpawnPiece(nextType);

        OnHoldChanged?.Invoke(heldType);
    }

    private void HardDrop()
    {
        while (currentPiece.TryMove(Vector2Int.down)) { }
        Lock();
    }

    private void Lock()
    {
        TSpinType tSpin = EvaluateTSpin(currentPiece); // 줄 지우기 전, 고정 시점 보드 상태로 T스핀 판정

        Vector2Int[] cellOffsets = TetrominoData.GetCells(currentPiece.Type, currentPiece.RotationState); // 조각의 4칸 오프셋
        Transform[] blocks = currentPiece.GetComponent<PieceView>().Blocks; // 같은 순서의 시각적 블록 4개
        for (int i = 0; i < cellOffsets.Length; i++)
        {
            Vector2Int boardCell = currentPiece.BoardPosition + cellOffsets[i]; // 실제 보드 좌표
            blocks[i].SetParent(GridManager.Instance.transform); // 조각에서 분리, 개별 오브젝트로 독립
            blocks[i].position = GridManager.CellToWorld(boardCell); // PieceView가 갱신 안 한 마지막 프레임 위치 보정
            GridManager.Instance.SetCell(boardCell, blocks[i]); // 그리드에 칸 단위로 등록
        }

        Destroy(currentPiece.gameObject); // 빈 껍데기가 된 조각 오브젝트 제거 (블록은 이미 분리됨)
        currentPiece = null;

        int clearedLines = GridManager.Instance.ClearLines(); // 꽉 찬 줄 정리

        OnPieceLocked?.Invoke(tSpin, clearedLines);

        SpawnNext();
    }

    // Standard 3-corner T-Spin check: only valid right after a rotation locks a T piece.
    private TSpinType EvaluateTSpin(Piece piece)
    {
        if (piece.Type != TetrominoType.T || !piece.LastActionWasRotation)
            return TSpinType.None;

        Vector2Int origin = piece.BoardPosition;
        bool bl = GridManager.Instance.IsCornerFilled(origin + new Vector2Int(0, 0));
        bool br = GridManager.Instance.IsCornerFilled(origin + new Vector2Int(2, 0));
        bool tl = GridManager.Instance.IsCornerFilled(origin + new Vector2Int(0, 2));
        bool tr = GridManager.Instance.IsCornerFilled(origin + new Vector2Int(2, 2));

        int filledCount = (bl ? 1 : 0) + (br ? 1 : 0) + (tl ? 1 : 0) + (tr ? 1 : 0);
        if (filledCount < 3) return TSpinType.None;

        bool frontA, frontB;
        switch (piece.RotationState)
        {
            case 0: frontA = tl; frontB = tr; break;
            case 1: frontA = tr; frontB = br; break;
            case 2: frontA = bl; frontB = br; break;
            default: frontA = tl; frontB = bl; break;
        }

        if (piece.LastKickTestIndex == 4) return TSpinType.Full;
        return (frontA && frontB) ? TSpinType.Full : TSpinType.Mini;
    }
}
