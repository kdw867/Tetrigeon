using UnityEngine;
using UnityEngine.UI;

// 스테이지 현황판의 몬스터 한 행. 몬스터 그림(표시창 가운데, 창에 맞는 크기), 등급 글자, 체력 막대 또는 DEFEATED 표시
public class StageBoardRow : MonoBehaviour
{
    [System.Serializable]
    public struct PortraitArt // 몬스터 그림 한 장과 그 안의 실제 몸통 범위
    {
        public Sprite sprite; // 그림 (투명 여백을 포함한 스프라이트 칸)
        public Rect body; // 칸 안의 몸통 범위 (픽셀, 왼쪽 아래 기준)
    }

    [SerializeField] private RectTransform portraitWindow; // 몬스터가 들어가는 표시창 (행 안의 고정 영역)
    [SerializeField] private Image portrait; // 몬스터 그림 (표시창과 같은 앵커·피벗)
    [SerializeField] private PortraitArt[] aliveArt; // 등급 순서(Normal, Epic, Boss)별 살아있을 때의 그림
    [SerializeField] private PortraitArt[] deadArt; // 등급 순서별 처치됐을 때의 그림
    [SerializeField] private PixelText tierText; // 등급 글자
    [SerializeField] private PixelFontData[] tierFonts; // 등급 순서별 글자 색 글꼴
    [SerializeField] private HpBarView hpBar; // 체력 막대 (처치되면 숨김)
    [SerializeField] private GameObject defeatedText; // 처치됐을 때 보이는 DEFEATED 글자
    [SerializeField] private GameObject dimOverlay; // 처치됐을 때 행 전체를 어둡게 덮는 막
    [SerializeField] private GameObject selectGlow; // 지금 타겟인 적의 행 테두리를 청록색으로 빛나게 하는 그림

    private static readonly string[] TierNames = { "NORMAL", "EPIC", "BOSS" }; // 등급 순서별 표시 이름

    // 적 한 마리의 현재 상태를 이 행에 표시 (selected: 지금 타겟으로 선택된 적인지)
    public void Show(Enemy enemy, bool selected)
    {
        int tier = (int)enemy.Tier; // 등급 번호로 그림·글꼴 선택
        bool dead = !enemy.IsAlive; // 처치 여부

        tierText.SetFont(tierFonts[tier]); // 등급별 글자 색
        tierText.SetText(TierNames[tier]); // 등급 이름
        ShowPortrait(dead ? deadArt[tier] : aliveArt[tier]); // 살았으면 Idle 그림, 죽었으면 사망 그림
        hpBar.gameObject.SetActive(!dead); // 처치되면 체력 막대를 숨김
        if (!dead) hpBar.SetHp(enemy.Hp, enemy.MaxHp); // 현재 체력 / 최대 체력
        defeatedText.SetActive(dead); // 문구로도 처치를 구분
        dimOverlay.SetActive(dead); // 행과 그림을 어둡게
        selectGlow.SetActive(selected && !dead); // 선택된 살아있는 적의 행만 청록 테두리가 빛남
    }

    // 몸통이 표시창 가운데에 오고 창에 꼭 맞는 크기가 되도록 그림을 배치
    private void ShowPortrait(PortraitArt art)
    {
        Rect window = portraitWindow.rect; // 표시창 크기
        float scale = Mathf.Min(window.width / art.body.width, window.height / art.body.height); // 가로세로 비율을 유지한 채 창 안에 들어가는 최대 배율
        Vector2 cell = art.sprite.rect.size; // 그림 칸 크기 (몸통 바깥 투명 여백 포함)

        portrait.sprite = art.sprite; // 그림 교체
        portrait.rectTransform.sizeDelta = cell * scale; // 칸 전체를 같은 배율로 키움
        portrait.rectTransform.anchoredPosition = portraitWindow.anchoredPosition + (cell * 0.5f - art.body.center) * scale; // 몸통 가운데가 창 가운데에 오도록 칸을 어긋나게 놓음
    }
}
