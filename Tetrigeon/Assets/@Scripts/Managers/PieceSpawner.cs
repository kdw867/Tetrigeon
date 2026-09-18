using System;
using System.Collections;
using UnityEngine;

public class PieceSpawner : MonoBehaviour
{
    public static PieceSpawner Instance { get; private set; }

    public static event Action<TSpinType, int> OnPieceLocked; // T스핀 결과 + 지워진 줄 수 (데미지 계산용)
    public static event Action OnTopOut; // Top Out 발생 시 1회 알림 (지워진 줄은 데미지에 안 들어감)
    public static event Action<TetrominoType?> OnHoldChanged; // Hold 슬롯 내용 바뀔 때 알림 (UI 연결용)
    public static event Action<int, int> OnHoldChargesChanged; // 남은 충전량, 충전 진행도 바뀔 때 알림 (코어 UI용)

    [SerializeField] private Piece piecePrefab;
    [SerializeField] private float lockDelay = 0.5f; // 착지 후 고정까지 유예 시간
    [SerializeField] private float topOutRowDelay = 0.15f; // Top Out 한 줄 지울 때마다 딜레이 (눈에 보이게)
    [SerializeField] private float topOutStartDelay = 0.4f; // 맨 위 줄에 고정된 걸 눈으로 확인할 시간 (줄 지우기 시작 전)
    [SerializeField] private int maxHoldCharges = 4; // 코어 룬 4개에 대응하는 최대 홀드 충전량
    [SerializeField] private int locksPerCharge = 3; // 충전 1개에 필요한 실제 Lock 횟수 (밸런스 테스트 시 2로 변경)

    private static readonly Vector2Int SpawnPosition = new Vector2Int(3, GridManager.Height - 3);

    private Piece currentPiece;
    private float lockTimer; // 착지 상태로 남은 유예 시간

    private TetrominoType? heldType; // 현재 Hold에 들어있는 조각 (없으면 null)
    private bool holdUsed; // 이번 조각에서 이미 Hold를 썼는지
    private bool combatEnded; // 전투가 끝나 더 이상 조각을 내보내지 않는 상태인지
    private int holdCharges; // 남은 홀드 충전량 (룬 점등 개수)
    private int rechargeProgress; // 다음 충전까지 쌓인 Lock 횟수

    public int HoldCharges => holdCharges; // UI가 읽을 남은 충전량
    public int RechargeProgress => rechargeProgress; // UI가 읽을 충전 진행도
    public int MaxHoldCharges => maxHoldCharges; // UI가 읽을 최대 충전량
    public int LocksPerCharge => locksPerCharge; // UI가 읽을 충전 기준 Lock 횟수
    public TetrominoType? HeldType => heldType; // 재연결된 UI가 현재 보관 상태를 읽음

    private void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }
        Instance = this;

        holdCharges = maxHoldCharges; // 스테이지 진입 시 충전량을 가득 채움
        rechargeProgress = 0; // 스테이지 진입 시 진행도는 0

        CombatManager.OnCombatEnded += HandleCombatEnded; // 전투 끝나면 조작을 막기 위해 구독
    }

    private void OnDestroy()
    {
        CombatManager.OnCombatEnded -= HandleCombatEnded; // 이벤트 구독 해제
    }

    // 일시정지용 입력 차단/해제 (Update는 timeScale 0에서도 계속 돌기 때문에 따로 막아야 함)
    public void SetInputEnabled(bool value)
    {
        if (combatEnded) return; // 전투가 끝난 뒤에는 다시 켜지 않음

        enabled = value; // 하드드랍·홀드·락 딜레이 처리
        if (currentPiece != null)
            currentPiece.enabled = value; // 낙하 중인 조각의 이동·회전
    }

    // 전투가 끝나면 시간 정지와 별개로 입력 자체를 막음 (Update는 timeScale 0에서도 계속 돌기 때문)
    private void HandleCombatEnded(bool playerWon)
    {
        combatEnded = true; // 이후 새 조각이 나오지 않게 표시
        enabled = false; // 하드드랍·홀드·락 딜레이 처리 중단
        StopAllCoroutines(); // 진행 중이던 Top Out 처리 중단
        if (currentPiece != null)
            currentPiece.enabled = false; // 낙하 중인 조각의 이동·회전 입력 중단 (블록은 화면에 그대로 유지)
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

        if (!holdUsed && holdCharges > 0 && (Input.GetKeyDown(KeyCode.C) || Input.GetKeyDown(KeyCode.LeftShift)))
            SwapHold(); // 충전이 남아있을 때만 홀드 (0개면 보관 미노도 현재 미노도 건드리지 않음)
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
        if (combatEnded) return; // 전투가 끝났으면 새 조각을 내보내지 않음

        holdUsed = false; // 새 조각이니 Hold 다시 사용 가능

        TetrominoType type = BagManager.Instance.Dequeue(); // 다음 조각 종류 뽑기

        if (Piece.CanPlaceType(type, 0, SpawnPosition)) // 스폰 자리가 바로 비어있으면
        {
            SpawnPiece(type);
        }
        else
        {
            StartCoroutine(TopOutSequence()); // 막혀있으면 뽑은 조각은 버리고 Top Out 처리로
        }
    }

    // Top Out 처리: 보드를 한 줄씩 전부 비운 뒤 턴을 넘기고, 새 가방·빈 Hold로 다시 시작.
    private IEnumerator TopOutSequence()
    {
        yield return new WaitForSeconds(topOutStartDelay); // 고정된 모습을 잠깐 보여준 뒤 지우기 시작

        while (GridManager.Instance.ClearTopRow()) // 지울 줄이 남아있는 동안 반복
            yield return new WaitForSeconds(topOutRowDelay); // 다음 줄 지우기 전 대기

        GridManager.Instance.ClearAllBlocks(); // 칸 정보에 안 잡힌 블록까지 남김없이 정리

        OnTopOut?.Invoke(); // 보드를 다 비운 뒤 알림 (HP 페널티 + 턴 종료 + 적 턴의 방해 줄이 빈 보드 위에 쌓이도록)

        BagManager.Instance.ResetBag(); // 남은 조각 버리고 새 가방으로
        ClearHold(); // Hold 슬롯 비우기

        SpawnNext(); // 새 가방의 첫 조각부터 다음 턴 시작
    }

    // Top Out 시 Hold에 들고 있던 조각을 버림
    private void ClearHold()
    {
        heldType = null; // 보관 중인 조각 제거
        holdUsed = false; // 다음 턴에서 Hold 다시 사용 가능
        OnHoldChanged?.Invoke(heldType); // Hold UI 갱신
    }

    private void SpawnPiece(TetrominoType type)
    {
        currentPiece = Instantiate(piecePrefab); // 프리팹으로 새 조각 생성
        currentPiece.Init(type, SpawnPosition); // 스폰 위치에 배치
        lockTimer = lockDelay; // 유예 시간 초기화
    }

    private void SwapHold()
    {
        if (!isActiveAndEnabled || combatEnded || currentPiece == null || holdUsed || holdCharges <= 0) return; // 모든 호출 경로에서 실패한 홀드는 상태를 바꾸지 않음
        TetrominoType current = currentPiece.Type; // 지금 조각 종류 기억
        Destroy(currentPiece.gameObject); // 지금 조각은 그리드에 등록 없이 바로 제거 (고정 아님)

        TetrominoType nextType = heldType ?? BagManager.Instance.Dequeue(); // Hold 비어있으면 다음 조각으로
        heldType = current; // 지금 조각을 Hold에 저장
        holdUsed = true; // 이번 조각에서 Hold 다 씀

        SpawnPiece(nextType);

        holdCharges--; // 홀드에 실제로 성공했으므로 충전 1개 소모 (진행도는 그대로 유지)
        OnHoldChargesChanged?.Invoke(holdCharges, rechargeProgress); // 룬 표시 갱신

        OnHoldChanged?.Invoke(heldType);
    }

    // 실제 Lock 1회를 충전 진행도에 반영 (가득 찬 상태에서는 진행도를 쌓지 않음)
    private void AddRechargeProgress()
    {
        if (holdCharges >= maxHoldCharges) return; // 최대치면 초과 충전도 진행도 비축도 없음

        rechargeProgress++; // 이번 Lock을 진행도에 더함
        if (rechargeProgress >= locksPerCharge) // 기준 횟수에 도달하면
        {
            rechargeProgress = 0; // 진행도를 0으로 되돌리고
            holdCharges++; // 충전 1개 회복
        }

        OnHoldChargesChanged?.Invoke(holdCharges, rechargeProgress); // 룬·진행도 표시 갱신
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
            blocks[i].rotation = PieceVisuals.GetArtRotation(currentPiece.Type, currentPiece.RotationState); // 고정 직전 회전도 균열 방향에 반영
            GridManager.Instance.SetCell(boardCell, blocks[i]); // 그리드에 칸 단위로 등록
        }

        Destroy(currentPiece.gameObject); // 빈 껍데기가 된 조각 오브젝트 제거 (블록은 이미 분리됨)
        currentPiece = null;

        AddRechargeProgress(); // 미노가 실제로 고정된 시점에만 충전 진행 (하드드랍·자연 낙하 모두 이 경로 하나를 지남)

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
