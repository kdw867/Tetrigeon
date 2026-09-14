using System;
using UnityEngine;

public class PieceSpawner : MonoBehaviour
{
    public static PieceSpawner Instance { get; private set; }

    public static event Action<TSpinType> OnPieceLocked;

    [SerializeField] private Piece piecePrefab;

    private static readonly Vector2Int SpawnPosition = new Vector2Int(3, GridManager.Height - 3);

    private Piece currentPiece;

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
        if (currentPiece != null && Input.GetKeyDown(KeyCode.Space))
            HardDrop();
    }

    private void SpawnNext()
    {
        TetrominoType type = BagManager.Instance.Dequeue();
        currentPiece = Instantiate(piecePrefab);
        currentPiece.Init(type, SpawnPosition);
    }

    private void HardDrop()
    {
        while (currentPiece.TryMove(Vector2Int.down)) { }
        Lock();
    }

    private void Lock()
    {
        TSpinType tSpin = EvaluateTSpin(currentPiece);

        foreach (Vector2Int cell in TetrominoData.GetCells(currentPiece.Type, currentPiece.RotationState))
        {
            Vector2Int boardCell = currentPiece.BoardPosition + cell;
            GridManager.Instance.SetCell(boardCell, true);
        }

        currentPiece.enabled = false; // freeze in place, keep its placeholder visual visible
        currentPiece = null;

        OnPieceLocked?.Invoke(tSpin);

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
