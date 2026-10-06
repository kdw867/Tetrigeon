using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

// 보상 화면의 강화 후보 카드 한 장. 강화 후 외형과 "한 줄 지울 때" 효과 수치를 미리 보여주고, 클릭하면 고른다.
[RequireComponent(typeof(Button))]
public class RewardCard : MonoBehaviour, IPointerEnterHandler, IPointerExitHandler
{
    private const int MinoScale = 3; // 미리보기 미노 배율 (게임 칸 간격 27픽셀의 3배)
    private const float CellPitch = 27f * MinoScale; // 칸 간격 (화면 픽셀)
    private const float CellArt = 25f * MinoScale; // 칸 그림 크기 (간격 27 중 그림 25)
    private const string Dot = "·"; // 가운뎃점
    private const string Times = "×"; // 곱하기 표시
    private const string Arrow = "→"; // 오른쪽 화살표
    private static readonly string[] AbilityNames = { "PIERCE", "FREEZE", "CRITICAL", "SHIELD", "HEAL", "POISON", "EXPLOSION" }; // TetrominoType 순서 (I, J, L, O, S, T, Z)
    private static readonly Color CellBacking = new Color(24f / 255f, 31f / 255f, 43f / 255f); // 칸 그림 뒤 공통 바탕 (게임 CellBacking과 같은 색)

    [SerializeField] private GameObject glow; // 호버 때 켜는 청록 빛 레이어
    [SerializeField] private PixelText nameText; // "S · HEAL"
    [SerializeField] private PixelText levelText; // "Lv.0 → Lv.1"
    [SerializeField] private RectTransform minoRoot; // 미노 칸들이 놓일 자리
    [SerializeField] private PixelText crystalText; // 수정 칸 안내 (강화 후 Lv.2부터)
    [SerializeField] private PixelText headerText; // 효과 상자 머리글 "1 LINE CLEAR"
    [SerializeField] private Image damageIconImage; // 첫째 줄 아이콘 (기본 피해)
    [SerializeField] private PixelText damageText; // 첫째 줄 글자
    [SerializeField] private Image abilityIconImage; // 둘째 줄 아이콘 (능력)
    [SerializeField] private PixelText abilityText; // 둘째 줄 글자
    [SerializeField] private PixelText abilityNote; // 둘째 줄 아래 작은 설명
    [SerializeField] private Sprite damageIcon; // 기본 피해 아이콘
    [SerializeField] private Sprite[] abilityIcons; // 능력 아이콘 7개 (TetrominoType 순서)

    private Button button; // 카드 전체가 클릭 영역

    public Button Button // RewardPrompt가 클릭을 연결할 때 쓰는 버튼
    {
        get
        {
            if (button == null) button = GetComponent<Button>(); // 처음 한 번만 찾음
            return button;
        }
    }

    private void OnDisable()
    {
        if (glow != null) glow.SetActive(false); // 카드가 꺼질 때 호버 빛도 끔
    }

    public void OnPointerEnter(PointerEventData eventData)
    {
        glow.SetActive(true); // 마우스를 올리면 청록 빛
    }

    public void OnPointerExit(PointerEventData eventData)
    {
        glow.SetActive(false); // 벗어나면 빛 끔
    }

    // 이 카드가 제시할 미노 종류로 모든 표시를 채움
    public void Show(TetrominoType type)
    {
        int level = MinoUpgrades.GetLevel(type); // 현재 강화 단계
        int next = level + 1; // 이 카드를 고르면 되는 단계
        int index = (int)type; // 종류 번호 (이름·아이콘 배열 위치)

        nameText.SetText($"{type} {Dot} {AbilityNames[index]}"); // 종류와 능력 이름
        levelText.SetText($"Lv.{level} {Arrow} Lv.{next}"); // 현재 단계에서 강화 후 단계로
        BuildMino(type); // 강화 후 외형

        bool showCrystal = next >= 2; // 수정 칸은 Lv.2부터 레벨마다 하나씩 늘어남 (어느 칸인지는 고를 때 정해짐)
        crystalText.gameObject.SetActive(showCrystal);
        if (showCrystal) crystalText.SetText($"CRYSTAL +1  (TOTAL {next - 1})"); // 이번에 늘어나는 수정 수와 강화 후 총 수

        headerText.SetText("1 LINE CLEAR"); // 아래 수치의 기준
        int single = CombatDamage.Calculate(TSpinType.None, 1, false); // 한 줄 지울 때의 기본 피해
        int value = CombatManager.AbilityValue(type, single, next); // 강화 후 능력 수치 (실제 전투와 같은 식)

        damageIconImage.sprite = damageIcon; // 첫째 줄: 기본 피해
        damageText.SetText($"{(type == TetrominoType.L ? value : single)} DMG"); // 치명은 기본 피해를 대신해 총 피해를 보여줌

        abilityIconImage.sprite = abilityIcons[index]; // 둘째 줄: 능력
        string main = string.Empty; // 둘째 줄 큰 글자
        string note = string.Empty; // 둘째 줄 작은 설명
        switch (type)
        {
            case TetrominoType.I: main = $"{value} DMG"; note = "PIERCE: ALL ENEMIES"; break; // 관통: 살아있는 모든 적
            case TetrominoType.J: main = "FREEZE 1T"; note = $"RELEASE: {value} DMG"; break; // 빙결: 한 줄 = 1턴, 해제 때 추가 피해
            case TetrominoType.L: main = "CRITICAL"; note = $"ALWAYS {Times}{value}"; break; // 치명: 랜덤 없이 항상 배수
            case TetrominoType.O: main = $"+{value} SHIELD"; note = $"LASTS {CombatManager.ShieldTurns} TURNS."; break; // 보호막과 지속 턴
            case TetrominoType.S: main = $"+{value} HP"; break; // 회복
            case TetrominoType.T: main = $"{CombatManager.PoisonTurns}T {Times} {value} DMG"; note = "Starts 1 turn later."; break; // 독: 턴 수 x 턴당 피해, 걸린 직후 적 턴은 건너뜀
            case TetrominoType.Z: main = $"{value} DMG"; note = "NEAREST ENEMY"; break; // 폭발: 가장 가까운 다른 적
        }
        abilityText.SetText(main);
        abilityNote.gameObject.SetActive(note.Length > 0); // 설명이 없는 능력은 줄을 비움
        if (note.Length > 0) abilityNote.SetText(note);
        RectTransform mainRt = (RectTransform)abilityText.transform; // 둘째 줄 큰 글자 위치
        mainRt.anchoredPosition = new Vector2(mainRt.anchoredPosition.x, note.Length > 0 ? MainYWithNote : MainYAlone); // 설명이 없으면 큰 글자를 줄 가운데로
    }

    private const float MainYWithNote = -140f; // 설명이 있을 때 둘째 줄 큰 글자 높이 (카드 가운데 기준)
    private const float MainYAlone = -155f; // 설명이 없을 때 둘째 줄 큰 글자 높이

    // 강화 후 외형(수정 칸은 이미 정해진 것만)으로 미노 네 칸을 만든다
    private void BuildMino(TetrominoType type)
    {
        for (int i = minoRoot.childCount - 1; i >= 0; i--) Destroy(minoRoot.GetChild(i).gameObject); // 이전 카드 내용 제거

        Vector2Int[] cells = TetrominoData.GetCells(type, 0); // 스폰 모양 그대로
        Vector2 center = TetrominoData.GetSpawnBoundsCenter(type); // 모양 가운데 (영역 정중앙 정렬용)
        for (int i = 0; i < cells.Length; i++)
        {
            GameObject cell = new GameObject("Cell", typeof(RectTransform), typeof(Image)); // 칸 바탕
            cell.transform.SetParent(minoRoot, false);
            RectTransform rt = (RectTransform)cell.transform;
            rt.sizeDelta = new Vector2(CellArt, CellArt); // 그림 크기
            rt.anchoredPosition = new Vector2((cells[i].x - center.x) * CellPitch, (cells[i].y - center.y) * CellPitch); // 칸 간격 배치
            Image backing = cell.GetComponent<Image>();
            backing.color = CellBacking; // 불규칙한 투명 여백을 메우는 바탕
            backing.raycastTarget = false; // 클릭을 막지 않게

            GameObject art = new GameObject("Art", typeof(RectTransform), typeof(Image)); // 칸 그림
            art.transform.SetParent(cell.transform, false);
            RectTransform artRt = (RectTransform)art.transform;
            artRt.anchorMin = Vector2.zero; // 바탕 전체를 채움
            artRt.anchorMax = Vector2.one;
            artRt.offsetMin = Vector2.zero;
            artRt.offsetMax = Vector2.zero;
            artRt.localRotation = PieceVisuals.GetArtRotation(type, 0, i); // 원본 그림 방향 보정 (L)
            Image image = art.GetComponent<Image>();
            image.sprite = PieceVisuals.GetMinoSprite(type, i, true); // 강화 후 외형 (이미 정해진 수정 칸은 수정 그림)
            image.raycastTarget = false;
        }
    }
}
