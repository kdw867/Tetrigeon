using UnityEngine;
using UnityEngine.SceneManagement;

// 타이틀 메뉴. START는 게임 씬, OPTION은 일시정지 메뉴와 같은 설정 창, EXIT는 게임 종료(에디터에서는 플레이 모드 종료).
public class TitleMenu : MonoBehaviour
{
    [SerializeField] private GameObject menuRoot; // START/OPTION/EXIT 버튼 묶음
    [SerializeField] private OptionMenu optionMenu; // 설정 창 (일시정지 메뉴와 공유하는 프리팹)

    private const int GameSceneIndex = 1; // 빌드 설정의 게임 씬 순서 (0번은 타이틀)

    private void OnEnable()
    {
        optionMenu.OnClosed += ShowMenu; // 설정 창을 닫으면 메뉴로 복귀
    }

    private void OnDisable()
    {
        optionMenu.OnClosed -= ShowMenu; // 이벤트 구독 해제
    }

    public void StartGame() { SceneManager.LoadScene(GameSceneIndex); } // START: 게임 시작

    public void OpenOption() // OPTION: 메뉴를 숨기고 설정 창 열기
    {
        menuRoot.SetActive(false);
        optionMenu.Open();
    }

    public void Quit() // EXIT: 게임 종료
    {
#if UNITY_EDITOR
        UnityEditor.EditorApplication.isPlaying = false; // 에디터에서는 플레이 모드 종료
#else
        Application.Quit(); // 빌드에서는 프로그램 종료
#endif
    }

    private void ShowMenu() { menuRoot.SetActive(true); } // 설정 창을 닫으면 메뉴 다시 표시
}
