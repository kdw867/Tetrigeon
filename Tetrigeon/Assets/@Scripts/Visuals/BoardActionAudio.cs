using UnityEngine;

public class BoardActionAudio : MonoBehaviour // 보드 조작 효과음 전용
{
    [SerializeField] private AudioSource actionSource, clearSource, rechargeSource; // 동시 발생 소리를 분리
    [SerializeField] private AudioClip lockClip, hardDropClip, clearClip, clearFourClip; // 고정과 삭제 소리
    [SerializeField] private AudioClip holdClip, holdUnavailableClip, holdRechargeClip; // 홀드 소리

    private void Update()
    {
        float volume = GameSettings.SfxVolume;
        actionSource.volume = clearSource.volume = rechargeSource.volume = volume;
    }

    private void OnEnable() // 실제 처리 알림 구독
    {
        PieceSpawner.OnLandingAudio += PlayLanding; // 고정과 줄 삭제
        PieceSpawner.OnHoldSucceeded += PlayHold; // 교환 성공
        PieceSpawner.OnHoldRejected += PlayUnavailable; // 사용 불가
        PieceSpawner.OnHoldRecharged += PlayRecharge; // 충전 회복
    }

    private void OnDisable() // 구독과 재생 정리
    {
        PieceSpawner.OnLandingAudio -= PlayLanding; // 고정 해제
        PieceSpawner.OnHoldSucceeded -= PlayHold; // 교환 해제
        PieceSpawner.OnHoldRejected -= PlayUnavailable; // 실패 해제
        PieceSpawner.OnHoldRecharged -= PlayRecharge; // 회복 해제
        actionSource.Stop(); // 조작음 중단
        clearSource.Stop(); // 삭제음 중단
        rechargeSource.Stop(); // 회복음 중단
    }

    private void PlayLanding(bool hardDrop, int lines) // 실제 고정 결과 반영
    {
        Play(actionSource, hardDrop ? hardDropClip : lockClip); // 하드드롭과 LOCK 중복 방지
        if (lines > 0) Play(clearSource, lines >= 4 ? clearFourClip : clearClip); // 1~3줄 공용, 4줄 전용
    }

    private void PlayHold() => Play(actionSource, holdClip); // 홀드 교환
    private void PlayUnavailable() => Play(actionSource, holdUnavailableClip); // 홀드 불가
    private void PlayRecharge() => Play(rechargeSource, holdRechargeClip); // 충전 회복

    private static void Play(AudioSource source, AudioClip clip) // 채널별 한 음성만 사용
    {
        if (source == null || clip == null) return;
        source.volume = GameSettings.SfxVolume; // 공용 효과음과 같은 음량 기준 적용
        source.clip = clip; // 해당 상황 클립 지정
        source.Play(); // 짧은 효과음 재생
    }
}
