using UnityEngine;
using UnityEngine.UI;

// 게임보드 오른쪽 스테이지 현황판. 현재 스테이지 / 전체, 1~10 진행도, 현재 스테이지의 몬스터 행을 전투 상태가 바뀔 때마다 갱신
public class StageBoardView : MonoBehaviour
{
    [SerializeField] private PixelText stageCurrentText; // 현재 스테이지 숫자 (청록)
    [SerializeField] private PixelText stageTotalText; // " / 전체 스테이지" (밝은 회색)
    [SerializeField] private Image[] nodeImages; // 스테이지 1~10 노드 (번호 순서)
    [SerializeField] private PixelText[] nodeTexts; // 노드 안의 번호
    [SerializeField] private Sprite nodePending; // 아직 오지 않은 스테이지 노드
    [SerializeField] private Sprite nodeDone; // 클리어한 스테이지 노드
    [SerializeField] private Sprite nodeCurrent; // 지금 스테이지 노드
    [SerializeField] private PixelFontData nodeFontPending; // 미진행 번호 글꼴 (어두운 회색)
    [SerializeField] private PixelFontData nodeFontDone; // 완료 번호 글꼴 (어두운 청록)
    [SerializeField] private PixelFontData nodeFontCurrent; // 현재 번호 글꼴 (밝은 청록)
    [SerializeField] private StageBoardRow[] rows; // 몬스터 행 (스테이지에서 왼쪽에 서는 적부터)

    private int shownStage; // 진행도를 마지막으로 그린 스테이지 (바뀔 때만 다시 그림)

    private void OnEnable()
    {
        CombatManager.OnStateChanged += UpdateDisplay; // 전투 상태 바뀔 때마다 갱신
    }

    private void OnDisable()
    {
        CombatManager.OnStateChanged -= UpdateDisplay; // 이벤트 구독 해제
    }

    private void Start()
    {
        UpdateDisplay(); // 매니저들의 Awake가 모두 끝난 뒤 첫 상태를 표시
    }

    private void UpdateDisplay()
    {
        CombatManager combat = CombatManager.Instance;
        if (combat == null) return; // 전투 매니저 없으면 표시할 것 없음

        if (combat.StageNumber != shownStage) // 다음 스테이지로 넘어갔을 때만 숫자와 노드를 다시 그림
        {
            shownStage = combat.StageNumber; // 이번에 그린 스테이지 기억
            UpdateProgress(shownStage);
        }

        for (int i = 0; i < rows.Length; i++) // 몬스터 행은 적 수만큼 보이고 나머지는 숨김
        {
            bool hasEnemy = i < combat.Enemies.Count; // 이 자리에 적이 있는지
            rows[i].gameObject.SetActive(hasEnemy);
            if (hasEnemy) rows[i].Show(combat.Enemies[i], combat.Enemies[i] == combat.Target); // 적의 현재 체력·생사와 타겟 선택 여부 표시
        }
    }

    // 현재 스테이지 숫자와 1~10 노드 상태(완료 / 현재 / 미진행) 표시
    private void UpdateProgress(int stage)
    {
        stageCurrentText.SetText(stage.ToString("00")); // 한 자리도 두 자리로
        stageTotalText.SetText($" / {StageData.LastStage}"); // 전체 스테이지 수는 스테이지 데이터에서 읽음

        for (int i = 0; i < nodeImages.Length; i++)
        {
            int number = i + 1; // 노드 번호
            bool done = number < stage; // 이미 클리어
            bool current = number == stage; // 지금 스테이지
            nodeImages[i].sprite = done ? nodeDone : current ? nodeCurrent : nodePending; // 상태별 노드 그림
            nodeTexts[i].SetFont(done ? nodeFontDone : current ? nodeFontCurrent : nodeFontPending); // 상태별 번호 색
            nodeTexts[i].SetText(number.ToString()); // 글꼴을 바꿨으니 번호를 다시 그림
        }
    }
}
