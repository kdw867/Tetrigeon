using UnityEngine;
using UnityEngine.SceneManagement;

// 플레이어가 패배하면 재시작 UI 창을 띄우고, 버튼 입력을 받아 전투를 처음부터 다시 시작
public class RestartPrompt : MonoBehaviour
{
    [SerializeField] private GameObject restartRoot; // 재시작 UI 창 (디자인 나오면 이 오브젝트만 교체)
    [SerializeField] private GameObject defeatTitle; // 패배했을 때 보이는 제목 (DEFEAT)
    [SerializeField] private GameObject victoryTitle; // 마지막 스테이지를 깼을 때 보이는 제목 (VICTORY)

    private const int TitleSceneIndex = 0; // 빌드 설정의 타이틀 씬 순서

    private void Awake()
    {
        restartRoot.SetActive(false); // 전투 중에는 숨겨둠
    }

    private void OnEnable()
    {
        CombatManager.OnCombatEnded += HandleCombatEnded; // 전투 종료 알림 구독
    }

    private void OnDisable()
    {
        CombatManager.OnCombatEnded -= HandleCombatEnded; // 이벤트 구독 해제
    }

    private void HandleCombatEnded(bool playerWon)
    {
        defeatTitle.SetActive(!playerWon); // 패배하면 DEFEAT 제목
        victoryTitle.SetActive(playerWon); // 마지막 스테이지를 깼으면 VICTORY 제목
        restartRoot.SetActive(true); // 패배와 마지막 스테이지 클리어 모두 여기서 끝나므로 창을 띄움
    }

    // 재시작 버튼의 OnClick에 연결해서 사용
    public void Restart()
    {
        Time.timeScale = 1f; // 전투 종료로 멈춰둔 시간 원복
        SceneManager.LoadScene(SceneManager.GetActiveScene().buildIndex); // 현재 씬을 다시 로드
    }

    // 타이틀 버튼의 OnClick에 연결해서 사용 (진행 중인 런은 버려지고 타이틀 화면으로 이동)
    public void GoToTitle()
    {
        Time.timeScale = 1f; // 전투 종료로 멈춰둔 시간 원복
        SceneManager.LoadScene(TitleSceneIndex); // 타이틀 씬 로드
    }
}
