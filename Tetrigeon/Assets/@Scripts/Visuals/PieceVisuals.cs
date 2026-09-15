using UnityEngine;

// 조각 타입별 색상 + 임시 사각형 스프라이트 (PieceView, HoldView, NextView가 공용으로 씀)
public static class PieceVisuals
{
    private static Sprite squareSprite; // 캐싱된 흰색 1x1 스프라이트

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
