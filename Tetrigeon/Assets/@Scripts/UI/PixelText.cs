using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

// 비트맵 글꼴(PixelFontData)의 글자 그림을 이어 붙여 보여주는 UI 글자. 글자 그림 한 칸이 화면의 scale 픽셀이 된다.
public class PixelText : MonoBehaviour
{
    [SerializeField] private PixelFontData font; // 사용할 글꼴 (색상별로 다른 에셋)
    [SerializeField] private float scale = 3f; // 원본 한 픽셀이 화면 몇 픽셀인지 (정수가 가장 또렷함, 게이지 1.5배 등도 허용)
    [SerializeField] private TextAnchor align = TextAnchor.MiddleCenter; // 가로 정렬 (왼쪽/가운데/오른쪽 열만 사용)
    [SerializeField] private string initialText; // 처음 켜질 때 보여줄 고정 글자 (바뀌는 글자는 코드에서 SetText)

    private readonly List<Image> glyphs = new List<Image>(); // 재사용하는 글자 그림 오브젝트들
    private RectTransform rectTransform; // 이 글자 영역

    private void Awake()
    {
        if (!string.IsNullOrEmpty(initialText)) SetText(initialText); // 고정 글자는 처음 켜질 때 한 번 표시
    }

    // 글꼴(색)을 바꿈. 이미 그려진 글자에는 다음 SetText부터 반영됨
    public void SetFont(PixelFontData value)
    {
        font = value; // 색상별 글꼴 에셋으로 교체
    }

    // 글자를 바꿔서 다시 배치. scaleOverride가 0보다 크면 이번 글자만 그 배율을 씀
    public void SetText(string text, float scaleOverride = 0f)
    {
        if (rectTransform == null) rectTransform = (RectTransform)transform; // 처음 한 번만 캐싱
        float s = scaleOverride > 0f ? scaleOverride : scale; // 실제 쓸 배율
        int count = 0; // 이번에 쓴 글자 그림 수
        int cursor = 0; // 현재 가로 위치 (원본 픽셀)
        int totalAdvance = 0; // 전체 가로 길이 계산용

        foreach (char c in text) // 먼저 전체 길이를 구함
        {
            Sprite sprite;
            int advance;
            int yOffset;
            if (font.TryGet(c, out sprite, out advance, out yOffset)) totalAdvance += advance; // 글꼴에 있는 글자만 길이에 포함
        }

        float startX = StartX(totalAdvance * s); // 정렬에 맞는 시작 위치 (화면 픽셀)
        float top = font.LineHeight * s * 0.5f; // 줄 맨 위 (영역 가운데 기준)

        foreach (char c in text) // 글자를 하나씩 배치
        {
            Sprite sprite;
            int advance;
            int yOffset;
            if (!font.TryGet(c, out sprite, out advance, out yOffset)) continue; // 글꼴에 없는 글자는 건너뜀

            if (sprite != null) // 띄어쓰기는 그림 없이 간격만 둠
            {
                Image image = GetGlyph(count++); // 재사용할 그림 오브젝트
                image.sprite = sprite; // 글자 그림 지정
                RectTransform rt = image.rectTransform;
                rt.sizeDelta = sprite.rect.size * s; // 원본 크기의 정수배
                rt.anchoredPosition = new Vector2(startX + (cursor - font.Outline) * s, top - yOffset * s); // 몸통이 cursor에서 시작하도록 외곽선만큼 왼쪽으로
                image.gameObject.SetActive(true); // 사용 중인 그림은 켬
            }
            cursor += advance; // 다음 글자 위치
        }

        for (int i = count; i < glyphs.Count; i++) glyphs[i].gameObject.SetActive(false); // 남는 그림은 숨김
    }

    // 정렬에 맞는 첫 글자의 가로 시작 위치
    private float StartX(float totalWidth)
    {
        float half = rectTransform.rect.width * 0.5f; // 영역 반폭
        switch (align)
        {
            case TextAnchor.UpperLeft:
            case TextAnchor.MiddleLeft:
            case TextAnchor.LowerLeft:
                return -half; // 왼쪽 맞춤
            case TextAnchor.UpperRight:
            case TextAnchor.MiddleRight:
            case TextAnchor.LowerRight:
                return half - totalWidth; // 오른쪽 맞춤
            default:
                return -totalWidth * 0.5f; // 가운데 맞춤
        }
    }

    // index번째 글자 그림 오브젝트를 가져오고, 없으면 새로 만듦
    private Image GetGlyph(int index)
    {
        if (index < glyphs.Count) return glyphs[index]; // 이미 만든 것을 재사용

        GameObject go = new GameObject("Glyph", typeof(RectTransform), typeof(Image)); // 글자 하나
        go.transform.SetParent(transform, false); // 이 글자 영역 아래에 붙임
        RectTransform rt = (RectTransform)go.transform;
        rt.anchorMin = rt.anchorMax = new Vector2(0.5f, 0.5f); // 영역 가운데 기준
        rt.pivot = new Vector2(0f, 1f); // 그림의 왼쪽 위를 기준점으로
        Image image = go.GetComponent<Image>();
        image.raycastTarget = false; // 글자가 클릭을 막지 않게
        glyphs.Add(image); // 목록에 보관
        return image;
    }
}
