using UnityEngine;

// 새 게임(씬 시작)과 매 스테이지 시작 직전에 3 → 2 → 1 카운트다운을 진행하는 매니저.
// 카운트다운 동안 PieceSpawner가 첫 조각을 내보내지 않아서 이동·회전·Hold·하드드롭·낙하·LOCK과 전투 진행(턴·적 행동)이 실제로 일어나지 않는다.
// 끝나면 첫 조각을 정확히 한 번 시작한다. 일시정지 중에는 시간이 멈추고, 씬이 바뀌면 함께 사라진다.
[DefaultExecutionOrder(-100)] // PieceSpawner.Start()가 첫 조각을 내보내기 전에 첫 스테이지 카운트다운을 걸기 위해 먼저 실행
public class CountdownManager : MonoBehaviour
{
    [SerializeField] private CountdownView view; // 숫자를 보여주는 화면
    [SerializeField] private float secondsPerDigit = 0.7f; // 숫자 하나가 보이는 시간 (전체 = 이 값 x 3)
    [SerializeField] private float holdSeconds = 0.15f; // 처음에 크기·투명도 변화 없이 선명하게 보이는 시간
    [SerializeField] private float maxScale = 1.4f; // 사라질 때의 최대 배율

    private const int DigitCount = 3; // 3, 2, 1
    private const float MaxFrameSeconds = 0.1f; // 한 프레임에 진행할 최대 시간 (끊김이 있어도 숫자를 건너뛰지 않게)

    private bool running; // 카운트다운 진행 중인지
    private bool firstFrame; // 시작한 첫 프레임인지 (씬 로딩·스테이지 전환으로 길어진 첫 프레임 시간을 세지 않기 위해)
    private float elapsed; // 시작 후 지난 시간 (일시정지 중에는 늘지 않음)

    private void OnEnable()
    {
        CombatManager.OnStageStarted += Begin; // 다음 스테이지가 준비될 때마다 카운트다운 시작
    }

    private void OnDisable()
    {
        CombatManager.OnStageStarted -= Begin; // 이벤트 구독 해제
        running = false; // 진행 중이던 카운트다운 취소 (끝났을 때 게임을 시작하지 않음)
        if (view != null) view.Hide(); // 숫자 잔상 제거 (씬이 내려가는 중이면 화면 오브젝트가 먼저 사라졌을 수 있음)
    }

    private void Start()
    {
        Begin(); // 새 게임(씬 시작)의 첫 스테이지. 이후 스테이지는 OnStageStarted로 시작
    }

    // 카운트다운 시작. 이미 진행 중이면 무시해서 중복 실행을 막는다
    private void Begin()
    {
        if (running) return; // 겹쳐서 호출돼도 한 번만

        running = true; // 진행 시작
        firstFrame = true; // 첫 프레임의 시간은 세지 않음
        elapsed = 0f; // 처음부터
        PieceSpawner.Instance.SetCountdownActive(true); // 첫 조각이 나오지 않게 막음
    }

    private void Update()
    {
        if (!running) return; // 진행 중이 아니면 할 일 없음
        if (PauseMenu.IsGamePaused) return; // 일시정지 중에는 멈추고, 재개하면 이어서 진행

        if (firstFrame)
        {
            firstFrame = false; // 첫 프레임은 숫자 '3'을 처음 상태로 보여주기만 함
            view.Show(0, 1f, 1f); // 선명한 '3'
            return;
        }

        elapsed += Mathf.Min(Time.unscaledDeltaTime, MaxFrameSeconds); // 시간 배율과 무관하게 실제 시간으로 진행 (조작 차단은 시간 배율에 의존하지 않음)

        int index = Mathf.FloorToInt(elapsed / secondsPerDigit); // 지금 보여줄 숫자 번호 (0 = 3, 1 = 2, 2 = 1)
        if (index >= DigitCount)
        {
            Finish(); // '1'까지 완전히 끝남
            return;
        }

        float local = elapsed - index * secondsPerDigit; // 이 숫자가 나타난 뒤 지난 시간
        if (local < holdSeconds)
        {
            view.Show(index, 1f, 1f); // 처음에는 선명하게
        }
        else
        {
            float t = (local - holdSeconds) / (secondsPerDigit - holdSeconds); // 변화 구간 진행도 0~1
            view.Show(index, Mathf.Lerp(1f, maxScale, t), 1f - t); // 점점 커지면서 서서히 투명해짐
        }
    }

    // 카운트다운을 끝내고 숨긴 뒤, 정상 플레이를 정확히 한 번 시작
    private void Finish()
    {
        running = false; // 더 이상 진행하지 않음
        view.Hide(); // 숫자를 숨김
        PieceSpawner.Instance.SetCountdownActive(false); // 막아둔 첫 조각을 내보냄
    }
}
