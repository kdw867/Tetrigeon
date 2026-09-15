using UnityEngine;

// 미노 아트와 패널용 사각형 스프라이트를 공용으로 제공
public static class PieceVisuals
{
    private static Sprite squareSprite; // 캐싱된 흰색 1x1 스프라이트
    private static Sprite[,] minoSprites; // 타입별 네 칸의 원본 아트 캐시

    public static Sprite GetMinoSprite(TetrominoType type, int cellIndex = 0) // 원본 칸 순서로 아트 제공
    {
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
        return minoSprites[(int)type, cellIndex]; // 해당 칸의 균열 아트 반환
    }

    public static Quaternion GetArtRotation(TetrominoType type, int rotationState) // 원본 방향과 게임 회전 합산
    {
        return Quaternion.Euler(0f, 0f, (type == TetrominoType.L ? 90f : 0f) - 90f * rotationState); // 세로 L 원본을 스폰 방향으로 정렬
    }

    public static void ApplyMinoArt(SpriteRenderer renderer, TetrominoType type, int cellIndex) // 게임과 미리보기의 공용 설정
    {
        renderer.sprite = GetMinoSprite(type, cellIndex); // 칸마다 다른 원본 그림 적용
        renderer.color = Color.white; // 원본 돌과 마법 색 보존
        Vector2 size = renderer.sprite.bounds.size; // 원본 분할 영역의 크기 확인
        renderer.transform.localScale = new Vector3(GridManager.CellSize / size.x, GridManager.CellSize / size.y, 1f); // 빈 간격 없이 한 칸을 채움
        renderer.transform.localRotation = GetArtRotation(type, 0); // 원본의 초기 방향 정렬
    }

    public static readonly Color[] TypeColors =
    {
        new Color(0f, 1f, 1f),      // I - cyan
        new Color(0f, 0f, 1f),      // J - blue
        new Color(1f, 0.5f, 0f),    // L - orange
        new Color(1f, 1f, 0f),      // O - yellow
        new Color(0f, 1f, 0f),      // S - green
        new Color(0.6f, 0f, 0.8f),  // T - purple
        new Color(1f, 0f, 0f),      // Z - red
    };

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
