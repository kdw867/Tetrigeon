using UnityEngine;

// 미노 아트와 패널용 사각형 스프라이트를 공용으로 제공
public static class PieceVisuals
{
    private static Sprite squareSprite; // 캐싱된 흰색 1x1 스프라이트
    private static Sprite[,] upgradedSprites; // 강화 미노의 칸별 아트 캐시
    private static Sprite[,] minoSprites; // 타입별 네 칸의 원본 아트 캐시
    private static Sprite grownSprite; // 여왕 증식 칸 아트 캐시
    private static Sprite[,] crystalSprites; // 강화 미노 수정 칸의 칸별 아트 캐시

    private static readonly Color ErodedTint = new Color(0.5f, 0.42f, 0.55f); // 회전 금지 미노: 약간 까맣게 침식된 색

    public static Sprite GetMinoSprite(TetrominoType type, int cellIndex = 0, bool previewUpgraded = false) // 원본 칸 순서로 아트 제공 (previewUpgraded: 아직 강화 전이어도 강화 외형으로, 보상 카드 미리보기용)
    {
        if (cellIndex >= 4) // 원래 4칸 뒤의 칸은 여왕 증식 칸 (종류·강화와 무관하게 같은 그림)
        {
            if (grownSprite == null) grownSprite = Resources.Load<Sprite>("MinoSprites/T_Mino_Grown"); // 처음 한 번만 로드
            return grownSprite;
        }

        if (minoSprites == null) // 시트의 분할 스프라이트를 처음에 한 번만 로드
        {
            minoSprites = new Sprite[7, 4]; // 일곱 조각의 네 칸 저장
            foreach (Sprite sprite in Resources.LoadAll<Sprite>("MinoSprites/T_Mino_Connected")) // 원본 시트의 칸별 아트 읽기
            {
                string[] parts = sprite.name.Split('_'); // 타입과 칸 번호 분리
                TetrominoType spriteType = (TetrominoType)System.Enum.Parse(typeof(TetrominoType), parts[0]); // 타입 변환
                minoSprites[(int)spriteType, int.Parse(parts[1])] = sprite; // 칸 순서에 맞춰 캐시
            }
        }
        if (previewUpgraded || MinoUpgrades.GetLevel(type) > 0) // 강화된 종류(또는 미리보기)만 새 외형을 사용
        {
            if (upgradedSprites == null) // 강화 스프라이트를 한 번만 읽음
            {
                upgradedSprites = new Sprite[7, 4]; // 종류별 네 칸 보관
                foreach (Sprite sprite in Resources.LoadAll<Sprite>("MinoSprites/Upgraded")) // 임포트된 개별 스프라이트 로드
                {
                    string[] parts = sprite.name.Split('_'); // 종류와 칸 번호 분리
                    TetrominoType spriteType = (TetrominoType)System.Enum.Parse(typeof(TetrominoType), parts[0]); // 종류 해석
                    upgradedSprites[(int)spriteType, int.Parse(parts[1])] = sprite; // 원래 셀 순서로 저장
                }
            }
            if (MinoUpgrades.IsCrystalCell(type, cellIndex)) // 수정으로 바뀐 칸은 같은 칸 번호의 수정 아트 사용
            {
                if (crystalSprites == null) // 수정 스프라이트를 한 번만 읽음 (강화 아트와 다른 폴더라 같은 이름이 덮어쓰이지 않음)
                {
                    crystalSprites = new Sprite[7, 4]; // 종류별 네 칸 보관
                    foreach (Sprite sprite in Resources.LoadAll<Sprite>("MinoSprites/Crystal")) // 수정 칸 스프라이트 로드
                    {
                        string[] parts = sprite.name.Split('_'); // 종류와 칸 번호 분리
                        TetrominoType spriteType = (TetrominoType)System.Enum.Parse(typeof(TetrominoType), parts[0]); // 종류 해석
                        crystalSprites[(int)spriteType, int.Parse(parts[1])] = sprite; // 원래 셀 순서로 저장
                    }
                }
                if (crystalSprites[(int)type, cellIndex] != null) return crystalSprites[(int)type, cellIndex]; // 수정 아트를 반환 (없으면 강화 아트로 대체)
            }
            if (upgradedSprites[(int)type, cellIndex] != null) return upgradedSprites[(int)type, cellIndex]; // 강화 아트를 반환
        }
        return minoSprites[(int)type, cellIndex]; // 미강화 또는 에셋 누락 시 기존 아트 유지
    }

    public static Quaternion GetArtRotation(TetrominoType type, int rotationState, int cellIndex = 0) // 원본 방향과 게임 회전 합산
    {
        bool lArt = type == TetrominoType.L && cellIndex < 4; // 여왕 증식 칸은 L 원본 그림이 아니므로 보정하지 않음
        return Quaternion.Euler(0f, 0f, (lArt ? 90f : 0f) - 90f * rotationState); // 세로 L 원본을 스폰 방향으로 정렬
    }

    private const float CellFill = 25f / 27f; // FHD 27픽셀 칸에서 양쪽 1픽셀씩 동일한 간격 확보

    public static void ApplyMinoArt(SpriteRenderer renderer, TetrominoType type, int cellIndex, float opacity = 1f, int sortingOrder = 10, bool eroded = false) // 실체와 고스트의 투명도·표시 순서를 함께 설정 (eroded: 여왕 회전 금지 표시)
    {
        renderer.sprite = GetMinoSprite(type, cellIndex); // 현재 강화 단계의 칸별 그림 적용
        renderer.gameObject.AddComponent<MinoArtBinding>().Initialize(type, cellIndex); // 고정 후에도 강화 변경을 구독
        Color tint = eroded ? ErodedTint : Color.white; // 회전 금지 미노는 어둡게
        renderer.color = new Color(tint.r, tint.g, tint.b, opacity); // 원본 색(또는 침식 색)에 지정한 투명도 적용
        renderer.sortingOrder = sortingOrder; // 바탕과 함께 표시 순서 결정
        Vector2 size = renderer.sprite.rect.size / renderer.sprite.pixelsPerUnit; // 원본 분할 영역의 크기 확인 (타이트 메시 트림 오차 없는 슬라이스 원본 크기)
        renderer.transform.localScale = new Vector3(GridManager.CellSize / size.x * CellFill, GridManager.CellSize / size.y * CellFill, 1f); // 모든 타입의 표시 영역을 25픽셀 정사각형으로 통일
        renderer.transform.localRotation = GetArtRotation(type, 0, cellIndex); // 원본의 초기 방향 정렬
        GameObject backing = new GameObject("CellBacking"); // 불규칙한 투명 여백을 메울 공통 바탕
        backing.layer = renderer.gameObject.layer; // 카메라 표시 레이어를 블록과 일치
        backing.transform.SetParent(renderer.transform, false); // Lock과 줄 삭제 시 블록과 함께 이동 및 제거
        backing.transform.localScale = new Vector3(size.x, size.y, 1f); // 원본 사각 영역과 같은 크기로 배치
        SpriteRenderer backingRenderer = backing.AddComponent<SpriteRenderer>(); // 바탕 렌더러 생성
        backingRenderer.sprite = GetSquareSprite(); // 기존 공용 사각형 재사용
        backingRenderer.color = new Color(24f / 255f, 31f / 255f, 43f / 255f, opacity); // 바탕도 같은 투명도로 표시
        backingRenderer.sortingLayerID = renderer.sortingLayerID; // 원본과 같은 정렬 레이어 사용
        backingRenderer.sortingOrder = sortingOrder - 1; // 고스트를 포함해 항상 해당 아트 뒤에 표시
    }

    public static Sprite GetSquareSprite()
    {
        if (squareSprite == null) // 처음 호출될 때만 생성, 이후 재사용
        {
            Texture2D texture = new Texture2D(1, 1);
            texture.SetPixel(0, 0, Color.white);
            texture.Apply();
            squareSprite = Sprite.Create(texture, new Rect(0, 0, 1, 1), new Vector2(0.5f, 0.5f), 1f);
        }
        return squareSprite;
    }
}
