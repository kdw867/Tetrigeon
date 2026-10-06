using UnityEngine;

// 비트맵 글꼴 한 벌 (색상별로 하나씩). 글자마다 그림 조각과 간격 정보를 가진다.
public class PixelFontData : ScriptableObject
{
    [SerializeField] private string chars; // 글자 목록 (아래 배열들과 같은 순서)
    [SerializeField] private Sprite[] sprites; // 글자별 그림 (바깥 1픽셀 외곽선 포함)
    [SerializeField] private int[] advances; // 글자별 다음 글자 시작까지의 가로 간격 (원본 픽셀)
    [SerializeField] private int[] yOffsets; // 글자별 줄 맨 위에서 그림 맨 위까지의 거리 (원본 픽셀)
    [SerializeField] private int lineHeight; // 한 줄 높이 (원본 픽셀)
    [SerializeField] private int outline = 1; // 그림 가장자리의 외곽선 두께 (원본 픽셀, 글자 몸통은 이만큼 안쪽에서 시작)

    public int LineHeight => lineHeight; // 한 줄 높이
    public int Outline => outline; // 외곽선 두께

    // 에디터 스크립트가 에셋을 만들 때 값을 채우는 용도
    public void Setup(string chars, Sprite[] sprites, int[] advances, int[] yOffsets, int lineHeight, int outline)
    {
        this.chars = chars; // 글자 목록 저장
        this.sprites = sprites; // 그림 저장
        this.advances = advances; // 간격 저장
        this.yOffsets = yOffsets; // 세로 위치 저장
        this.lineHeight = lineHeight; // 줄 높이 저장
        this.outline = outline; // 외곽선 두께 저장
    }

    // 글자 하나의 그림과 배치 정보를 찾음 (없는 글자면 false)
    public bool TryGet(char c, out Sprite sprite, out int advance, out int yOffset)
    {
        int index = chars.IndexOf(c); // 글자 목록에서 위치 찾기
        if (index < 0) // 글꼴에 없는 글자
        {
            sprite = null;
            advance = 0;
            yOffset = 0;
            return false;
        }
        sprite = sprites[index]; // 해당 글자 그림
        advance = advances[index]; // 해당 글자 간격
        yOffset = yOffsets[index]; // 해당 글자 세로 위치
        return true;
    }
}
