using UnityEngine;
using UnityEngine.SceneManagement;

// 플레이어가 패배하면 재시작 UI 창을 띄우고, 버튼 입력을 받아 전투를 처음부터 다시 시작
public class RestartPrompt : MonoBehaviour
{
    [SerializeField] private GameObject restartRoot; // 재시작 UI 창 (디자인 나오면 이 오브젝트만 교체)

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
        if (playerWon) return; // 체력이 0이 된 패배일 때만 재시작 창 표시
        restartRoot.SetActive(true); // 게임이 멈춘 즉시 창을 띄움
    }

    // 재시작 버튼의 OnClick에 연결해서 사용
    public void Restart()
    {
        Time.timeScale = 1f; // 전투 종료로 멈춰둔 시간 원복
        SceneManager.LoadScene(SceneManager.GetActiveScene().buildIndex); // 현재 씬을 다시 로드
    }
}
