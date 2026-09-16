using UnityEngine;

// 실제 그리드 크기의 배경과 바깥쪽 돌 프레임을 함께 표시
[ExecuteAlways]
public class BoardBackgroundView : MonoBehaviour
{
    [SerializeField] private SpriteRenderer stoneFrame; // 에디터에서 연결한 돌 프레임
    private static Sprite gridSprite; // 정확한 칸 간격의 격자를 재사용

    private void OnEnable()
    {
        const int pixelsPerCell = 30; // FHD·카메라 크기 5에서 텍스처와 화면을 1:1로 표시
        if (gridSprite == null) // 최초 활성화 시에만 격자 생성
        {
            int width = GridManager.Width * pixelsPerCell; // 가로 열 수 반영
            int height = GridManager.Height * pixelsPerCell; // 세로 행 수 반영
            Texture2D texture = new Texture2D(width, height, TextureFormat.RGBA32, false); // 압축과 밉맵 없는 격자
            texture.filterMode = FilterMode.Point; // 선명한 픽셀 유지
            texture.wrapMode = TextureWrapMode.Clamp; // 가장자리 반복 방지
            Color32[] pixels = new Color32[width * height]; // 최초 생성용 픽셀 배열
            for (int y = 0; y < height; y++) // 아래부터 행을 채움
                for (int x = 0; x < width; x++) // 왼쪽부터 열을 채움
                {
                    bool line = x % pixelsPerCell == 0 || x % pixelsPerCell == pixelsPerCell - 1 || y % pixelsPerCell == 0 || y % pixelsPerCell == pixelsPerCell - 1 || x < 2 || x >= width - 2 || y < 2 || y >= height - 2; // 내부와 외곽 경계를 모두 화면 2픽셀로 표시
                    bool runeLine = y == 20 * pixelsPerCell - 1 || y == 20 * pixelsPerCell; // 아래 20행과 위 2행 사이 경계
                    pixels[y * width + x] = runeLine ? new Color32(83, 227, 232, 255) : line ? new Color32(35, 54, 76, 255) : new Color32(13, 24, 40, 255); // 룬 색과 낮은 대비 배경
                }
            texture.SetPixels32(pixels); // 격자 데이터 적용
            texture.Apply(false, true); // CPU 쪽 픽셀 메모리 해제
            gridSprite = Sprite.Create(texture, new Rect(0, 0, width, height), new Vector2(0.5f, 0.5f), pixelsPerCell / GridManager.CellSize); // 미노의 실제 칸 크기와 일치
        }
        SpriteRenderer renderer = GetComponent<SpriteRenderer>(); // 기존 보드 렌더러 재사용
        renderer.sprite = gridSprite; // 원본 이미지의 부정확한 격자를 덮음
        renderer.color = Color.white; // 설정한 배경 색 유지
        renderer.sortingOrder = 0; // 미노보다 뒤에 표시
        transform.localScale = Vector3.one; // 스프라이트 자체의 월드 크기 사용
        if (stoneFrame == null || stoneFrame.sprite == null) return; // 프레임 연결 전에도 격자는 표시
        Rect opening = new Rect(230, 170, 572, 1148); // 원본 이미지의 내부 영역, 좌하단 기준
        float scaleX = GridManager.Width * GridManager.CellSize / opening.width; // 내부 가로를 10칸에 맞춤
        float scaleY = GridManager.Height * GridManager.CellSize / opening.height; // 내부 세로를 22칸에 맞춤
        Vector2 offset = stoneFrame.sprite.pivot - opening.center; // 원본 중심과 플레이 영역 중심 차이
        stoneFrame.transform.localPosition = new Vector3(offset.x * scaleX, offset.y * scaleY, 0f); // 격자 중심 정렬
        stoneFrame.transform.localScale = new Vector3(scaleX, scaleY, 1f) * stoneFrame.sprite.pixelsPerUnit; // 프레임을 격자 바깥에 맞춤
        stoneFrame.sortingOrder = -1; // 내부 격자를 가리지 않도록 뒤에 배치
    }
}
