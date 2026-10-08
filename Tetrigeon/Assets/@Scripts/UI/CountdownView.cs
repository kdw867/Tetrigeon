using UnityEngine;
using UnityEngine.UI;

// 시작 카운트다운 숫자 한 개를 보드 가운데에 보여주는 화면 담당. 위치는 고정이고 숫자·크기·투명도만 바꾼다.
public class CountdownView : MonoBehaviour
{
    [SerializeField] private Image digitImage; // 숫자를 그리는 이미지 (숫자마다 그림만 교체)
    [SerializeField] private Sprite[] digitSprites; // 숫자 그림 (3, 2, 1 순서)

    private void Awake()
    {
        Hide(); // 평소에는 숨겨 둠
    }

    // index번째 숫자를 배율 scale, 불투명도 alpha로 표시 (가운데 기준으로 커짐)
    public void Show(int index, float scale, float alpha)
    {
        digitImage.sprite = digitSprites[index]; // 숫자 그림 교체
        digitImage.transform.localScale = new Vector3(scale, scale, 1f); // 크기만 바꿈
        digitImage.color = new Color(1f, 1f, 1f, alpha); // 투명도만 바꿈
        digitImage.enabled = true; // 숫자 표시
    }

    // 숫자를 숨김
    public void Hide()
    {
        digitImage.enabled = false; // 이미지 끄기
    }
}
