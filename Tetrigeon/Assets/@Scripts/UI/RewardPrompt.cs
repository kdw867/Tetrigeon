using UnityEngine;
using UnityEngine.EventSystems;

// 스테이지 클리어 보상 화면. 회복은 자동으로 들어가고, 미노 강화는 후보 카드 3장 중 하나를 고른다.
public class RewardPrompt : MonoBehaviour
{
    [SerializeField] private GameObject upgradeRoot; // 강화 후보를 고르는 화면
    [SerializeField] private PixelText stageText; // 클리어한 스테이지와 회복량 표시
    [SerializeField] private RewardCard[] cards; // 강화 후보 카드 3장
    [SerializeField] private int healAmount = 10; // 스테이지 클리어마다 확정으로 채우는 체력

    private TetrominoType[] choices; // 이번에 제시한 강화 후보

    private void Awake()
    {
        upgradeRoot.SetActive(false); // 전투 중에는 숨겨둠

        for (int i = 0; i < cards.Length; i++)
        {
            int index = i; // 클릭 시점에 바뀌지 않도록 복사
            cards[i].Button.onClick.AddListener(() => PickUpgrade(index)); // 카드 클릭 = 그 후보 선택
        }
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

        choices = MinoUpgrades.DrawChoices(cards.Length); // 카드 수만큼 중복 없이 뽑음

        for (int i = 0; i < cards.Length; i++)
        {
            bool hasChoice = i < choices.Length; // 후보가 모자라면 남는 카드는 숨김
            cards[i].gameObject.SetActive(hasChoice);
            if (hasChoice) cards[i].Show(choices[i]); // 강화 후 외형과 효과 수치를 채움
        }

        if (stageText != null)
            stageText.SetText($"STAGE {stageNumber} CLEAR   HP +{healAmount}"); // 스테이지 번호와 받은 회복량

        upgradeRoot.SetActive(true); // 강화 선택 화면 표시

        if (EventSystem.current != null)
            EventSystem.current.SetSelectedGameObject(null); // 이전에 누른 버튼이 선택된 채 남아 Space로 다시 눌리는 것을 막음
    }

    // 카드 클릭에서 호출. index는 선택한 카드 번호(0/1/2)
    public void PickUpgrade(int index)
    {
        if (choices == null || index < 0 || index >= choices.Length) return; // 잘못된 인덱스는 무시

        MinoUpgrades.Upgrade(choices[index]); // 고른 미노의 강화 단계를 1 올림

        upgradeRoot.SetActive(false); // 보상 화면 닫기
        CombatManager.Instance.AdvanceToNextStage(); // 다음 스테이지 시작 (마지막이면 런 종료)
    }
}
