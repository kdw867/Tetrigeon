using UnityEngine;

// Hold 패널 배경: Hold 슬롯에 조각이 있는지에 따라 Off(왼쪽)/On(오른쪽) 이미지로 전환
public class HoldBackgroundView : MonoBehaviour
{
    [SerializeField] private float widthInCells = 5f; // 패널 가로 크기 (셀 단위)
    [SerializeField] private float heightInCells = 5.2f; // 패널 세로 크기 (셀 단위)
    [SerializeField] private Sprite offSprite; // Hold 비어있을 때 표시할 이미지 (원본의 왼쪽)
    [SerializeField] private Sprite onSprite; // Hold 채워졌을 때 표시할 이미지 (원본의 오른쪽)

    [SerializeField] private SpriteRenderer artRenderer; // 씬에 저장하여 편집 중에도 배경 표시
    [SerializeField] private Vector2 offCenter = new Vector2(444f, 443f); // 꺼진 이미지 사각형 내부의 구멍 중심 픽셀
    [SerializeField] private Vector2 onCenter = new Vector2(454f, 443f); // 켜진 이미지 사각형 내부의 구멍 중심 픽셀

    private void OnEnable()
    {
        PieceSpawner.OnHoldChanged += UpdateDisplay; // Hold 바뀔 때마다 이미지 갱신
        UpdateDisplay(null); // 시작 시엔 항상 빈 상태로 표시
    }

    private void OnDisable()
    {
        PieceSpawner.OnHoldChanged -= UpdateDisplay; // 이벤트 구독 해제
    }

    private void UpdateDisplay(TetrominoType? type)
    {
        Sprite sprite = type == null ? offSprite : onSprite; // Hold 상태에 맞는 이미지 선택
        artRenderer.sprite = sprite;

        Vector2 nativeSize = sprite.rect.size / sprite.pixelsPerUnit; // 원본 이미지의 실제 크기
        artRenderer.transform.localScale = new Vector3(
            widthInCells * GridManager.CellSize / nativeSize.x, // 패널 가로에 맞춤
            heightInCells * GridManager.CellSize / nativeSize.y, // 패널 세로에 맞춤
            1f);
        Vector2 center = type == null ? offCenter : onCenter; // 상태별 실제 구멍 중심 선택
        Vector2 offset = (center - sprite.pivot) / sprite.pixelsPerUnit; // 피벗과 구멍 사이 거리 계산
        artRenderer.transform.localPosition = -Vector3.Scale(offset, artRenderer.transform.localScale); // 구멍을 홀드 미노 중심에 정렬
    }
}
