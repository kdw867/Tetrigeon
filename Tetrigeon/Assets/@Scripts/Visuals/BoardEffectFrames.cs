using UnityEngine;

// 스프라이트 프레임을 순서대로 한 번 재생하고 스스로 사라지는 보드 이펙트 한 개. 시간 배율(Time.timeScale)이 0이어도 끝까지 재생되도록 실제 시간으로 진행한다.
public class BoardEffectFrames : MonoBehaviour
{
    [SerializeField] private SpriteRenderer spriteRenderer; // 프레임을 그릴 렌더러
    [SerializeField] private Sprite[] frames; // 모든 프레임 (변형이 있으면 변형 순서대로 이어 붙임)
    [SerializeField] private int framesPerClip = 8; // 한 번 재생에 쓰는 프레임 수 (마지막 프레임은 빈 그림)
    [SerializeField] private float fps = 60f; // 초당 프레임 수

    private int clipStart; // 이번에 재생할 변형의 첫 프레임 번호
    private float elapsed; // 재생 시작 후 지난 시간 (지연 중에는 음수)

    // clip번째 변형을 delaySeconds 뒤부터 재생 시작 (연출 시간차용)
    public void Play(int clip, float delaySeconds)
    {
        clipStart = clip * framesPerClip; // 변형 첫 프레임 위치
        elapsed = -delaySeconds; // 지연만큼 음수에서 시작
        spriteRenderer.enabled = false; // 시작 전에는 그리지 않음
    }

    private void Update()
    {
        elapsed += Time.unscaledDeltaTime; // 정지 상태에서도 연출이 멈춰 남지 않게 실제 시간 사용
        if (elapsed < 0f) return; // 아직 지연 중

        int frame = Mathf.FloorToInt(elapsed * fps); // 지금 보여줄 프레임
        if (frame >= framesPerClip)
        {
            Destroy(gameObject); // 재생이 끝나면 정리
            return;
        }
        spriteRenderer.sprite = frames[clipStart + frame]; // 프레임 교체
        spriteRenderer.enabled = true; // 지연이 끝났으면 표시
    }
}
