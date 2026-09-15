using UnityEngine;

// Hold/Next 같은 보드 옆 패널용 어두운 배경 (크기만 셀 단위로 지정, 위치는 Scene 뷰에서 직접 배치)
[ExecuteAlways]
public class SidePanelBackgroundView : MonoBehaviour
{
    [SerializeField] private float widthInCells = 4f; // 패널 가로 크기 (셀 단위)
    [SerializeField] private float heightInCells = 4f; // 패널 세로 크기 (셀 단위)

    private void OnEnable()
    {
        SpriteRenderer spriteRenderer = GetComponent<SpriteRenderer>();
        if (spriteRenderer == null)
        {
            spriteRenderer = gameObject.AddComponent<SpriteRenderer>();
            spriteRenderer.sprite = PieceVisuals.GetSquareSprite();
            spriteRenderer.color = new Color(0.05f, 0.05f, 0.08f, 0.85f);
            spriteRenderer.sortingOrder = 0; // 블록(10)보다 뒤, cave(-10)보다 앞
        }

        transform.localScale = new Vector3(
            widthInCells * GridManager.CellSize,
            heightInCells * GridManager.CellSize,
            1f);
    }
}
