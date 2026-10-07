using UnityEngine;
using UnityEngine.UI;

// 체력 막대 한 개. 틀·빈 칸·채움 레이어 위에 가운데 숫자("hp / max")를 얹는다. 레미용은 방패 줄(아이콘 + 보호막 양)도 가진다.
// UI 캔버스 위에 있으므로 따라다닐 대상(캐릭터 발 아래)의 월드 좌표를 화면 좌표로 바꿔 위치를 잡는다.
public class HpBarView : MonoBehaviour
{
    [SerializeField] private Image fillImage; // 채움 (Filled 가로 방식, 비율만큼 왼쪽부터 보임)
    [SerializeField] private PixelText valueText; // 막대 가운데 "hp / max"
    [SerializeField] private GameObject shieldRow; // 방패 아이콘 + 보호막 양 줄 (레미만 연결, 몬스터는 비워 둠)
    [SerializeField] private PixelText shieldText; // 방패 줄의 "+n"
    [SerializeField] private Image skillRune; // 막대 오른쪽 아래 스킬 카운터 룬 (몬스터만 연결)
    [SerializeField] private Sprite runeBlue; // 평소 룬 (파랑)
    [SerializeField] private Sprite runeGold; // 다음 턴에 능력이 나갈 때 룬 (금색)
    [SerializeField] private PixelText skillText; // 평소 남은 턴 숫자 (크림색)
    [SerializeField] private PixelText skillTextNext; // 다음 턴 발동 표시 "1 !" (금색)
    [SerializeField] private float skillRowHeight = 18f; // 막대 밑에서 스킬 카운터 줄이 차지하는 높이 (캔버스 픽셀)

    private RectTransform rectTransform; // 막대 전체 영역
    private Canvas rootCanvas; // 캔버스 배율을 읽을 최상위 캔버스
    private Camera worldCamera; // 월드 좌표를 화면 좌표로 바꿀 카메라

    // 체력 표시 갱신: 채움 비율과 가운데 숫자
    public void SetHp(int hp, int maxHp)
    {
        fillImage.fillAmount = maxHp > 0 ? Mathf.Clamp01((float)hp / maxHp) : 0f; // 비율만큼 채움
        valueText.SetText($"{Mathf.Max(hp, 0)} / {maxHp}"); // 죽어서 음수가 돼도 0으로 표시
    }

    // 보호막 표시 갱신: 있을 때만 방패 줄을 보여줌 (방패 줄이 없는 막대는 무시)
    public void SetShield(int shield)
    {
        if (shieldRow == null) return; // 몬스터 막대는 방패 줄이 없음
        shieldRow.SetActive(shield > 0);
        if (shield > 0) shieldText.SetText($"+{shield}"); // 보호막 양
    }

    // 스킬 카운터 표시 갱신: 룬 + 남은 턴. 1턴 이하(다음 턴 발동)면 금색 룬과 "1 !"
    public void SetSkill(int turnsLeft)
    {
        bool next = turnsLeft <= 1; // 다음 적 턴에 능력이 나가는지
        skillRune.sprite = next ? runeGold : runeBlue; // 룬 색
        skillText.gameObject.SetActive(!next); // 평소 숫자는 평소에만
        skillTextNext.gameObject.SetActive(next); // 금색 "1 !"은 다음 턴 발동일 때만
        if (next) skillTextNext.SetText("1 !"); // 금색 표시
        else skillText.SetText(turnsLeft.ToString()); // 남은 턴 숫자
    }

    // 막대 높이를 월드 단위로 환산 (막대 밑에 글자를 이어 붙일 때 필요)
    public float WorldHeight
    {
        get
        {
            CacheReferences();
            return rectTransform.rect.height * WorldPerCanvasPixel();
        }
    }

    // 막대 밑 스킬 카운터 줄 높이를 월드 단위로 환산 (그 밑에 상태 글자를 이어 붙일 때 필요)
    public float SkillRowWorldHeight
    {
        get
        {
            CacheReferences();
            return skillRowHeight * WorldPerCanvasPixel();
        }
    }

    // 월드 좌표 한 점을 막대의 가운데로 삼아 UI 위치를 잡는다
    public void PlaceAtWorld(Vector3 worldPosition)
    {
        CacheReferences();
        Vector2 screen = worldCamera.WorldToScreenPoint(worldPosition); // 월드 → 화면
        RectTransformUtility.ScreenPointToLocalPointInRectangle((RectTransform)transform.parent, screen, null, out Vector2 local); // 오버레이 캔버스라 카메라는 null
        rectTransform.anchoredPosition = new Vector2(Mathf.Round(local.x), Mathf.Round(local.y)); // 부모 가운데 기준 위치 (도트가 번지지 않게 정수 픽셀로)
    }

    // 캔버스 픽셀 1칸이 월드에서 얼마인지 (캔버스 배율, 카메라 높이, 화면 높이로 계산)
    private float WorldPerCanvasPixel()
    {
        return rootCanvas.scaleFactor * 2f * worldCamera.orthographicSize / Screen.height; // 화면 픽셀당 월드 길이 x 캔버스 배율
    }

    // 처음 한 번만 참조를 찾아 둠
    private void CacheReferences()
    {
        if (rectTransform != null) return;
        rectTransform = (RectTransform)transform;
        rootCanvas = GetComponentInParent<Canvas>().rootCanvas;
        worldCamera = Camera.main;
    }
}
