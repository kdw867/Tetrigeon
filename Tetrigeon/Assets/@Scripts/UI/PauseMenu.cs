using UnityEngine;
using UnityEngine.SceneManagement;

// ESC 일시정지 메뉴. Option은 타이틀과 같은 설정 창 프리팹(OptionMenu)을 연다.
public class PauseMenu : MonoBehaviour
{
    [SerializeField] private GameObject pauseRoot; // 일시정지 메인 창 (Resume/Option/Restart)
    [SerializeField] private OptionMenu optionMenu; // 설정 창 (타이틀과 공유하는 프리팹)

    public static bool IsGamePaused { get; private set; } // 일시정지 상태 (다른 스크립트가 입력을 막을 때 확인)

    private const int TitleSceneIndex = 0; // 빌드 설정의 타이틀 씬 순서

    private void Awake()
    {
        IsGamePaused = false; // 씬을 다시 로드해도 정적 값이 남지 않게 초기화
        pauseRoot.SetActive(false); // 시작할 때는 일시정지 창을 닫아둠
    }

    private void OnEnable()
    {
        optionMenu.OnClosed += BackToPause; // 설정 창을 닫으면 일시정지 창으로 복귀
    }

    private void OnDisable()
    {
        optionMenu.OnClosed -= BackToPause; // 이벤트 구독 해제
    }

    private void Update()
    {
        if (!Input.GetKeyDown(KeyCode.Escape)) return; // ESC 외에는 무시

        if (IsGamePaused) Resume(); // 이미 멈춰 있으면 게임으로 복귀
        else Pause();
    }

    // 게임을 멈추고 일시정지 창을 띄움
    private void Pause()
    {
        if (CombatManager.Instance != null && Time.timeScale == 0f) return; // 패배/클리어로 이미 멈춘 상태면 무시

        IsGamePaused = true;
        Time.timeScale = 0f; // 중력과 낙하 정지

        if (PieceSpawner.Instance != null)
            PieceSpawner.Instance.SetInputEnabled(false); // timeScale 0에서도 도는 입력을 직접 차단

        pauseRoot.SetActive(true); // 일시정지 창 표시
    }

    // 게임으로 돌아감 (Resume 버튼과 ESC 둘 다 사용)
    public void Resume()
    {
        IsGamePaused = false;
        Time.timeScale = 1f; // 시간 재개

        if (PieceSpawner.Instance != null)
            PieceSpawner.Instance.SetInputEnabled(true); // 조작 재개

        pauseRoot.SetActive(false); // 일시정지 창 닫기
        optionMenu.HideAll(); // 설정 창이 열려 있었으면 같이 닫기
    }

    // 스테이지 1부터 다시 시작
    public void Restart()
    {
        Time.timeScale = 1f; // 멈춰둔 시간 원복 후 씬을 다시 로드
        SceneManager.LoadScene(SceneManager.GetActiveScene().buildIndex);
    }

    // Title 버튼: 타이틀 화면으로 나감 (진행 중인 런은 저장 없이 버려지고, Restart처럼 확인 창 없이 바로 이동)
    public void GoToTitle()
    {
        Time.timeScale = 1f; // 멈춰둔 시간 원복 (타이틀 씬이 멈춘 채 시작하지 않게)
        IsGamePaused = false; // 일시정지 상태 해제
        SceneManager.LoadScene(TitleSceneIndex); // 타이틀 씬 로드
    }

    public void OpenOption() // Option 버튼: 일시정지 창을 숨기고 설정 창 열기
    {
        pauseRoot.SetActive(false);
        optionMenu.Open();
    }

    private void BackToPause() { pauseRoot.SetActive(true); } // 설정 창을 닫으면 일시정지 창 다시 표시
}
