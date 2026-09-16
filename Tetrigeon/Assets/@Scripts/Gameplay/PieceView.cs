using UnityEngine;

// 네 칸의 바위·마법 스프라이트를 조각 위치에 맞춰 표시
[RequireComponent(typeof(Piece))]
public class PieceView : MonoBehaviour
{
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
        blocks = new Transform[4];
        ghostBlocks = new Transform[4];
        for (int i = 0; i < blocks.Length; i++)
        {
            GameObject block = new GameObject("Block");
            block.transform.SetParent(transform);

            SpriteRenderer spriteRenderer = block.AddComponent<SpriteRenderer>();
            PieceVisuals.ApplyMinoArt(spriteRenderer, piece.Type, i); // 원본의 각 칸과 연결되는 균열 적용
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
        Vector2Int[] cells = TetrominoData.GetCells(piece.Type, piece.RotationState);
        Quaternion artRotation = PieceVisuals.GetArtRotation(piece.Type, piece.RotationState); // 현재 회전에 맞는 균열 방향
        Vector2Int ghostPosition = piece.GetGhostPosition(); // 하드드랍 시 멈출 위치
        for (int i = 0; i < blocks.Length; i++)
        {
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
