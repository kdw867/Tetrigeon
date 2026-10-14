using UnityEngine;

// 네 칸의 바위·마법 스프라이트를 조각 위치에 맞춰 표시
[RequireComponent(typeof(Piece))]
public class PieceView : MonoBehaviour
{
    private RotationLockSeal rotationSeal; // 조작 중인 잠금 표식
    private Piece piece;
    private Transform[] blocks;
    private Transform[] ghostBlocks; // 하드드랍 예상 위치를 보여주는 반투명 블록

    public Transform[] Blocks => blocks; // 고정(Lock) 시 블록을 개별 오브젝트로 넘기기 위해 외부 노출

    private void Awake()
    {
        piece = GetComponent<Piece>();
    }

    private void Start()
    {
        int cellCount = piece.Mino.GetCells(0).Length; // 여왕 증식 칸이 있으면 5칸
        if (piece.Mino.RotationLocked) rotationSeal = RotationLockSeal.Create(transform); // 잠긴 미노만 표식 생성
        blocks = new Transform[cellCount];
        ghostBlocks = new Transform[cellCount];
        for (int i = 0; i < blocks.Length; i++)
        {
            GameObject block = new GameObject("Block");
            block.transform.SetParent(transform);

            SpriteRenderer spriteRenderer = block.AddComponent<SpriteRenderer>();
            PieceVisuals.ApplyMinoArt(spriteRenderer, piece.Type, i, 1f, 10); // 원본의 각 칸과 연결되는 균열 적용
            spriteRenderer.sortingOrder = 10;

            blocks[i] = block.transform;

            GameObject ghost = new GameObject("GhostBlock");
            ghost.transform.SetParent(transform);

            SpriteRenderer ghostRenderer = ghost.AddComponent<SpriteRenderer>();
            PieceVisuals.ApplyMinoArt(ghostRenderer, piece.Type, i, 0.30f, 5); // 현재 미노와 같은 아트를 30% 불투명도로 착지 위치에 표시

            ghostBlocks[i] = ghost.transform;
        }
    }

    private void LateUpdate()
    {
        Vector2Int[] cells = piece.Mino.GetCells(piece.RotationState); // 증식 칸 포함
        if (rotationSeal != null) // 표식은 실체의 중앙을 따라 이동
        {
            Vector2 center = TetrominoData.GetSpawnBoundsCenter(piece.Type, piece.Mino.GrownCell); // 증식 칸까지 포함한 중심
            rotationSeal.transform.position = GridManager.CellToWorld(piece.BoardPosition) + new Vector3(center.x, center.y, 0f) * GridManager.CellSize; // 회전 금지 상태는 스폰 방향 유지
        }
        Vector2Int ghostPosition = piece.GetGhostPosition(); // 하드드랍 시 멈출 위치
        for (int i = 0; i < blocks.Length; i++)
        {
            Quaternion artRotation = PieceVisuals.GetArtRotation(piece.Type, piece.RotationState, i); // 현재 회전에 맞는 균열 방향 (증식 칸은 L 보정 제외)
            Vector2Int boardCell = piece.BoardPosition + cells[i];
            blocks[i].position = GridManager.CellToWorld(boardCell);
            blocks[i].rotation = artRotation; // 칸 위치와 함께 균열 방향도 회전

            Vector2Int ghostCell = ghostPosition + cells[i];
            ghostBlocks[i].position = GridManager.CellToWorld(ghostCell);
            ghostBlocks[i].rotation = artRotation;
            ghostBlocks[i].gameObject.SetActive(ghostPosition != piece.BoardPosition); // 실제 미노가 착지 위치에 도달하면 겹치는 고스트 숨김
        }
    }
}
