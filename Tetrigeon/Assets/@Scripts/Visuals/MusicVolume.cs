using UnityEngine;

[RequireComponent(typeof(AudioSource))]
public class MusicVolume : MonoBehaviour
{
    private AudioSource source;
    private float baseVolume;
    private void Awake()
    {
        source = GetComponent<AudioSource>();
        baseVolume = source.volume; // BGM의 기존 믹스 음량 유지
        Apply();
    }
    private void Update() { Apply(); } // 일시정지 중 슬라이더 변경도 반영
    private void Apply() { source.volume = baseVolume * GameSettings.MusicVolume; }
}
