using UnityEngine;

// 옵션에서 조절하는 설정값. 조각은 매번 새로 생성되므로 전역에 두고 PlayerPrefs에 저장한다.
// 조작 감도는 테트리스에서 통용되는 ARR/DAS/DCD/SDF 체계를 따르며, 프레임 값은 0.1F 단위로 조절한다.
public static class GameSettings
{
    public const float SecondsPerFrame = 1f / 60f; // 프레임 값을 초로 환산할 때 쓰는 기준
    public const float FrameStep = 0.1f; // 프레임 설정의 최소 조절 단위

    public const float MinArr = 0f, MaxArr = 5f; // ARR 0F는 즉시 끝까지 이동
    public const float MinDas = 1f, MaxDas = 20f; // DAS는 최소 1프레임
    public const float MinDcd = 0f, MaxDcd = 5f; // DCD 0F는 사용 안 함
    public const int MinSdf = 5, MaxSdf = 41; // SDF는 배수라 정수 단위로 둔다
    public const int InfiniteSdf = MaxSdf; // 무한 소프트 드롭을 나타내는 값

    private const string ArrKey = "settings.arr"; // 반복 이동 속도 저장 키
    private const string DasKey = "settings.das"; // 자동 반복 시작 지연 저장 키
    private const string DcdKey = "settings.dcd"; // DAS 일시정지 시간 저장 키
    private const string SdfKey = "settings.sdf"; // 소프트 드롭 배수 저장 키
    private const string MusicVolumeKey = "settings.musicVolume"; // 배경음악 음량 저장 키
    private const string SfxVolumeKey = "settings.sfxVolume"; // 효과음 음량 저장 키

    // ARR: 키를 누르고 있을 때 한 칸 이동에 걸리는 프레임 수
    public static float Arr
    {
        get { return SnapFrames(PlayerPrefs.GetFloat(ArrKey, 2f), MinArr, MaxArr); }
        set { PlayerPrefs.SetFloat(ArrKey, SnapFrames(value, MinArr, MaxArr)); PlayerPrefs.Save(); }
    }

    // DAS: 첫 입력 후 자동 반복이 시작되기까지의 프레임 수
    public static float Das
    {
        get { return SnapFrames(PlayerPrefs.GetFloat(DasKey, 10f), MinDas, MaxDas); }
        set { PlayerPrefs.SetFloat(DasKey, SnapFrames(value, MinDas, MaxDas)); PlayerPrefs.Save(); }
    }

    // DCD: 조각을 회전하거나 떨어뜨린 뒤 진행 중이던 DAS 이동을 멈추는 프레임 수
    public static float Dcd
    {
        get { return SnapFrames(PlayerPrefs.GetFloat(DcdKey, 2f), MinDcd, MaxDcd); }
        set { PlayerPrefs.SetFloat(DcdKey, SnapFrames(value, MinDcd, MaxDcd)); PlayerPrefs.Save(); }
    }

    // SDF: 소프트 드롭이 중력 속도를 몇 배로 만드는지 (41이면 무한)
    public static int Sdf
    {
        get { return Mathf.Clamp(PlayerPrefs.GetInt(SdfKey, InfiniteSdf), MinSdf, MaxSdf); }
        set { PlayerPrefs.SetInt(SdfKey, Mathf.Clamp(value, MinSdf, MaxSdf)); PlayerPrefs.Save(); }
    }

    public static float MusicVolume
    {
        get { return PlayerPrefs.GetFloat(MusicVolumeKey, 0.7f); }
        set { PlayerPrefs.SetFloat(MusicVolumeKey, Mathf.Clamp01(value)); PlayerPrefs.Save(); }
    }

    public static float SfxVolume
    {
        get { return PlayerPrefs.GetFloat(SfxVolumeKey, 0.8f); }
        set { PlayerPrefs.SetFloat(SfxVolumeKey, Mathf.Clamp01(value)); PlayerPrefs.Save(); }
    }

    public static float ArrSeconds => Arr * SecondsPerFrame; // 반복 이동 간격 (초)
    public static float DasSeconds => Das * SecondsPerFrame; // 자동 반복 시작까지의 시간 (초)
    public static float DcdSeconds => Dcd * SecondsPerFrame; // DAS 일시정지 시간 (초)
    public static bool IsSoftDropInstant => Sdf >= InfiniteSdf; // 소프트 드롭이 즉시 바닥까지인지

    // 0.1F 단위로 맞추고 범위 안으로 자름
    public static float SnapFrames(float frames, float min, float max)
    {
        float snapped = Mathf.Round(frames / FrameStep) * FrameStep;
        return Mathf.Clamp(snapped, min, max);
    }

    public static string FormatSdf(int sdf)
    {
        return sdf >= InfiniteSdf ? "∞ X" : sdf + " X";
    }
}
