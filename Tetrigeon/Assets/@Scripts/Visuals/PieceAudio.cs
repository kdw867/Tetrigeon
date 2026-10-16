using UnityEngine;

// 미노의 조작 이벤트를 구독해 짧은 효과음만 재생
[RequireComponent(typeof(Piece), typeof(AudioSource))]
public class PieceAudio : MonoBehaviour
{
    [SerializeField] private AudioClip moveClip; // 좌우 이동음
    [SerializeField] private AudioClip rotationBlockedClip; // 회전 봉인 실패음
    [SerializeField] private AudioClip rotateClip; // 회전 성공음
    private int lastRotateFrame = -1; // 같은 프레임 회전음 중복 방지
    private Piece piece; // 이벤트 발행자
    private AudioSource source; // 한 소스만 써서 중첩 방지
    private int lastMoveFrame = -1; // ARR 0의 같은 프레임 이동을 한 번으로 묶음
    private int lastBlockedFrame = -1; // 동시 회전 키 입력 중복 방지

    private void Awake()
    {
        piece = GetComponent<Piece>(); // 미노 참조 캐시
        source = GetComponent<AudioSource>(); // 오디오 참조 캐시
    }

    private void OnEnable()
    {
        piece.OnRotated += PlayRotate; // 회전 성공 구독
        piece.OnHorizontalMoved += PlayMove; // 이동 성공 구독
        piece.OnRotationBlocked += PlayBlocked; // 봉인 실패 구독
    }

    private void OnDisable()
    {
        piece.OnRotated -= PlayRotate; // 회전 성공 구독 해제
        piece.OnHorizontalMoved -= PlayMove; // 교환·고정 시 구독 해제
        piece.OnRotationBlocked -= PlayBlocked; // 중복 구독 방지
        source.Stop(); // 비활성화 시 남은 소리 정지
    }

    private void PlayMove()
    {
        if (lastMoveFrame == Time.frameCount || lastBlockedFrame == Time.frameCount || lastRotateFrame == Time.frameCount) return; // 같은 프레임은 봉인음을 우선
        lastMoveFrame = Time.frameCount; // 재생 프레임 기록
        Play(moveClip); // 기존 음을 겹치지 않고 교체
    }

    private void PlayRotate()
    {
        if (lastRotateFrame == Time.frameCount || lastBlockedFrame == Time.frameCount) return; // 봉인음 우선 및 중복 방지
        lastRotateFrame = Time.frameCount; // 재생 프레임 기록
        Play(rotateClip); // 회전 성공음 재생
    }

    private void PlayBlocked()
    {
        if (lastBlockedFrame == Time.frameCount) return; // 동시 회전 입력은 한 번만 재생
        lastBlockedFrame = Time.frameCount; // 재생 프레임 기록
        Play(rotationBlockedClip); // 봉인음으로 교체
    }

    private void Play(AudioClip clip)
    {
        if (clip == null) return; // 미지정 클립은 재생하지 않음
        source.clip = clip; // 프리팹에 연결된 음원 사용
        source.Play(); // 한 소스에서 재시작하여 소리 누적 방지
    }
}
