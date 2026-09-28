using UnityEngine;

// 강화 목록의 한 줄. 미노 그림 네 칸과 "종류 Lv.숫자" 글자로 이루어진다.
public class MinoUpgradeRow : MonoBehaviour
{
    [SerializeField] private Transform iconRoot; // 미노 그림 네 칸이 들어갈 자리 (크기는 이 오브젝트 배율로 맞춤)
    [SerializeField] private TextMesh label; // 종류와 강화 레벨 표시

    private bool built; // 그림을 이미 만들었는지 (중복 생성 방지)

    // 이 줄이 담당할 미노 종류를 정하고 그림을 한 번만 만든다
    public void Build(TetrominoType type)
    {
        if (built) return; // 이미 만들었으면 다시 만들지 않음
        built = true;

        Vector2Int[] cells = TetrominoData.GetCells(type, 0); // 스폰 모양 그대로 사용
        Vector2 boundsCenter = TetrominoData.GetSpawnBoundsCenter(type); // 모양 중심 (고정 영역 정중앙 정렬용)

        for (int i = 0; i < cells.Length; i++)
        {
            GameObject block = new GameObject("Block"); // 네 칸을 각각 생성
            block.transform.SetParent(iconRoot, false);
            block.transform.localPosition = new Vector3(
                (cells[i].x - boundsCenter.x) * GridManager.CellSize, // Hold·Next 미리보기와 같은 칸 간격
                (cells[i].y - boundsCenter.y) * GridManager.CellSize,
                0f);

            SpriteRenderer spriteRenderer = block.AddComponent<SpriteRenderer>();
            PieceVisuals.ApplyMinoArt(spriteRenderer, type, i, 1f, 10); // 칸별 원본 아트와 연결 규칙을 그대로 재사용
        }
    }

    // 현재 강화 레벨만 글자로 표시 (종류는 그림으로 구분하므로 영문 표기는 쓰지 않음)
    public void SetLevel(int level)
    {
        label.text = $"Lv.{level}";
    }
}
