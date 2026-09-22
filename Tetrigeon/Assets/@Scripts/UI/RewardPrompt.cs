using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

// 스테이지 클리어 보상 화면. 회복은 자동으로 들어가고, 미노 강화는 후보 3개 중 하나를 고른다.
public class RewardPrompt : MonoBehaviour
{
    [SerializeField] private GameObject upgradeRoot; // 강화 후보 3개를 고르는 창
    [SerializeField] private Text titleText; // 클리어한 스테이지와 회복량 표시
    [SerializeField] private Button[] upgradeButtons; // 강화 후보 버튼 3개
    [SerializeField] private Text[] upgradeButtonTexts; // 각 후보 버튼의 미노 이름 표시
    [SerializeField] private int healAmount = 20; // 스테이지 클리어마다 확정으로 채우는 체력

    private TetrominoType[] choices; // 이번에 제시한 강화 후보

    private void Awake()
    {
        upgradeRoot.SetActive(false); // 전투 중에는 숨겨둠
    }

    private void OnEnable()
    {
        CombatManager.OnStageCleared += HandleStageCleared; // 스테이지 클리어 알림 구독
    }

    private void OnDisable()
    {
        CombatManager.OnStageCleared -= HandleStageCleared; // 이벤트 구독 해제
    }

    private void HandleStageCleared(int stageNumber)
    {
        CombatManager.Instance.Heal(healAmount); // 회복은 선택 없이 바로 적용

        choices = MinoUpgrades.DrawChoices(upgradeButtons.Length); // 버튼 수만큼 중복 없이 뽑음

        for (int i = 0; i < upgradeButtons.Length; i++)
        {
            bool hasChoice = i < choices.Length; // 후보가 모자라면 남는 버튼은 숨김
            upgradeButtons[i].gameObject.SetActive(hasChoice);
            if (!hasChoice) continue;

            int level = MinoUpgrades.GetLevel(choices[i]); // 현재 강화 단계
            upgradeButtonTexts[i].text = $"{choices[i]}  Lv.{level} → {level + 1}"; // 강화 후 단계까지 표시
        }

        if (titleText != null)
            titleText.text = $"STAGE {stageNumber} CLEAR    HP +{healAmount}"; // 스테이지 번호와 받은 회복량

        upgradeRoot.SetActive(true); // 강화 선택 창 표시

        if (EventSystem.current != null)
            EventSystem.current.SetSelectedGameObject(null); // 이전에 누른 버튼이 선택된 채 남아 Space로 다시 눌리는 것을 막음
    }

    // 강화 후보 버튼의 OnClick에 인덱스(0/1/2)를 넣어 연결
    public void PickUpgrade(int index)
    {
        if (choices == null || index < 0 || index >= choices.Length) return; // 잘못된 인덱스는 무시

        MinoUpgrades.Upgrade(choices[index]); // 고른 미노의 강화 단계를 1 올림

        upgradeRoot.SetActive(false); // 보상 창 닫기
        CombatManager.Instance.AdvanceToNextStage(); // 다음 스테이지 시작 (마지막이면 런 종료)
    }
}
