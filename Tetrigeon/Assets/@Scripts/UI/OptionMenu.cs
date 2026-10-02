using System;
using UnityEngine;
using UnityEngine.UI;

// 설정 창. Option -> Sensitivity/Sound 순으로 창을 전환한다. 일시정지 메뉴와 타이틀이 같은 프리팹을 함께 쓴다.
public class OptionMenu : MonoBehaviour
{
    [SerializeField] private GameObject optionRoot; // 설정 분류 창 (Sensitivity/Sound)
    [SerializeField] private GameObject sensitivityRoot; // 감도 설정 창
    [SerializeField] private GameObject soundRoot; // 소리 설정 창

    [SerializeField] private Slider arrSlider; // ARR: 키를 누르고 있을 때 반복 이동 속도
    [SerializeField] private Slider dasSlider; // DAS: 자동 반복이 시작되기까지의 지연
    [SerializeField] private Slider dcdSlider; // DCD: 회전·낙하 후 자동 이동을 멈추는 시간
    [SerializeField] private Slider sdfSlider; // SDF: 소프트 드롭의 중력 배수
    [SerializeField] private InputField arrMsInput, arrFramesInput; // ARR의 MS와 F 직접 입력
    [SerializeField] private InputField dasMsInput, dasFramesInput; // DAS의 MS와 F 직접 입력
    [SerializeField] private InputField dcdMsInput, dcdFramesInput; // DCD의 MS와 F 직접 입력
    [SerializeField] private Text sdfValueText; // SDF 현재값 표시
    [SerializeField] private Slider musicVolumeSlider; // 배경음악 음량
    [SerializeField] private Slider sfxVolumeSlider; // 효과음 음량

    public event Action OnClosed; // 설정 분류 창에서 BACK으로 설정을 닫았을 때 (연 쪽이 원래 화면으로 돌아감)

    private void Awake()
    {
        HideAll(); // 시작할 때는 모든 설정 창을 닫아둠

        SetupFrameSlider(arrSlider, GameSettings.MinArr, GameSettings.MaxArr, GameSettings.Arr); // 0.1F 단위 슬라이더
        SetupFrameSlider(dasSlider, GameSettings.MinDas, GameSettings.MaxDas, GameSettings.Das);
        SetupFrameSlider(dcdSlider, GameSettings.MinDcd, GameSettings.MaxDcd, GameSettings.Dcd);

        sdfSlider.wholeNumbers = true; // SDF는 배수라 정수 단위
        sdfSlider.minValue = GameSettings.MinSdf;
        sdfSlider.maxValue = GameSettings.MaxSdf;
        sdfSlider.value = GameSettings.Sdf;

        musicVolumeSlider.value = GameSettings.MusicVolume; // 저장된 음량을 슬라이더에 반영
        sfxVolumeSlider.value = GameSettings.SfxVolume;

        arrSlider.onValueChanged.AddListener(OnArrChanged); // 슬라이더를 움직이면 바로 저장
        dasSlider.onValueChanged.AddListener(OnDasChanged);
        dcdSlider.onValueChanged.AddListener(OnDcdChanged);
        sdfSlider.onValueChanged.AddListener(OnSdfChanged);
        musicVolumeSlider.onValueChanged.AddListener(OnMusicVolumeChanged);
        sfxVolumeSlider.onValueChanged.AddListener(OnSfxVolumeChanged);

        BindTimingInputs(arrMsInput, arrFramesInput, OnArrChanged); // ARR 입력 확정 연결
        BindTimingInputs(dasMsInput, dasFramesInput, OnDasChanged); // DAS 입력 확정 연결
        BindTimingInputs(dcdMsInput, dcdFramesInput, OnDcdChanged); // DCD 입력 확정 연결
        RefreshSensitivityTexts(); // 현재값 문구 표시

        AudioListener.volume = GameSettings.MusicVolume; // 저장된 음량을 실제 출력에 적용
    }

    public void Open() { ShowOnly(optionRoot); } // 설정 분류 창 열기
    public void OpenSensitivity() { ShowOnly(sensitivityRoot); } // Option -> Sensitivity
    public void OpenSound() { ShowOnly(soundRoot); } // Option -> Sound
    public void BackToOption() { ShowOnly(optionRoot); } // 세부 설정 창에서 뒤로
    public void HideAll() { ShowOnly(null); } // 알림 없이 모든 설정 창 닫기 (게임 재개 등)

    public void Close() // 설정 분류 창에서 뒤로: 설정을 닫고 연 쪽에 알림
    {
        HideAll(); // 설정 창 모두 닫기
        OnClosed?.Invoke(); // 일시정지 창이나 타이틀 메뉴로 복귀
    }

    // 프레임 단위 설정용 슬라이더 구성 (0.1F 단위로 조절)
    private void SetupFrameSlider(Slider slider, float min, float max, float current)
    {
        slider.wholeNumbers = false; // 소수점 단위를 쓰기 위해 정수 고정을 끔
        slider.minValue = min;
        slider.maxValue = max;
        slider.value = current;
    }

    // 슬라이더 값을 0.1F 단위로 맞춰 저장하고, 슬라이더 위치도 그 값에 스냅시킨다
    private float ApplyFrameSetting(Slider slider, float rawValue, float min, float max)
    {
        float snapped = GameSettings.SnapFrames(rawValue, min, max);
        if (!Mathf.Approximately(slider.value, snapped)) slider.SetValueWithoutNotify(snapped); // 되먹임 방지
        return snapped;
    }

    private void OnArrChanged(float value) // 반복 이동 속도 저장
    {
        GameSettings.Arr = ApplyFrameSetting(arrSlider, value, GameSettings.MinArr, GameSettings.MaxArr);
        RefreshSensitivityTexts();
    }

    private void OnDasChanged(float value) // 자동 반복 지연 저장
    {
        GameSettings.Das = ApplyFrameSetting(dasSlider, value, GameSettings.MinDas, GameSettings.MaxDas);
        RefreshSensitivityTexts();
    }

    private void OnDcdChanged(float value) // DAS 일시정지 시간 저장
    {
        GameSettings.Dcd = ApplyFrameSetting(dcdSlider, value, GameSettings.MinDcd, GameSettings.MaxDcd);
        RefreshSensitivityTexts();
    }
    private void OnSdfChanged(float value) { GameSettings.Sdf = Mathf.RoundToInt(value); RefreshSensitivityTexts(); } // 소프트 드롭 배수 저장

    // 슬라이더 옆에 현재값을 밀리초/프레임(또는 배수)으로 표시
    private void RefreshSensitivityTexts()
    {
        RefreshTimingInputs(arrMsInput, arrFramesInput, GameSettings.Arr); // ARR 단위 표시 동기화
        RefreshTimingInputs(dasMsInput, dasFramesInput, GameSettings.Das); // DAS 단위 표시 동기화
        RefreshTimingInputs(dcdMsInput, dcdFramesInput, GameSettings.Dcd); // DCD 단위 표시 동기화
        sdfValueText.text = GameSettings.FormatSdf(GameSettings.Sdf);
    }

    private void BindTimingInputs(InputField ms, InputField frames, UnityEngine.Events.UnityAction<float> apply) // 입력 확정 이벤트 연결
    {
        ms.onEndEdit.AddListener(text => CommitTimingInput(ms, text, true, apply)); // MS 입력을 프레임으로 환산
        frames.onEndEdit.AddListener(text => CommitTimingInput(frames, text, false, apply)); // F 입력을 그대로 사용
    }

    private void CommitTimingInput(InputField input, string text, bool milliseconds, UnityEngine.Events.UnityAction<float> apply) // 유효한 숫자만 저장
    {
        float value; // 입력 숫자 보관
        if (!input.wasCanceled && float.TryParse(text, System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out value) && !float.IsNaN(value) && !float.IsInfinity(value)) // 빈칸·문자·비정상 값과 취소 제외
            apply(milliseconds ? value / (GameSettings.SecondsPerFrame * 1000f) : value); // 기존 범위와 스냅 처리 재사용
        RefreshSensitivityTexts(); // 잘못된 입력도 저장된 값으로 복원
    }

    private void RefreshTimingInputs(InputField ms, InputField frames, float value) // 재입력 이벤트 없이 표시 갱신
    {
        ms.SetTextWithoutNotify((value * GameSettings.SecondsPerFrame * 1000f).ToString("0.##", System.Globalization.CultureInfo.InvariantCulture)); // 밀리초 표시
        frames.SetTextWithoutNotify(value.ToString("F1", System.Globalization.CultureInfo.InvariantCulture)); // 프레임 표시
    }

    private void OnMusicVolumeChanged(float value) { GameSettings.MusicVolume = value; AudioListener.volume = value; } // 배경음악 음량 저장 및 적용
    private void OnSfxVolumeChanged(float value) { GameSettings.SfxVolume = value; } // ponytail: 효과음 재생 붙으면 그때 연결

    // 지정한 설정 창 하나만 켜고 나머지는 끔 (null이면 모두 끔)
    private void ShowOnly(GameObject target)
    {
        optionRoot.SetActive(target == optionRoot);
        sensitivityRoot.SetActive(target == sensitivityRoot);
        soundRoot.SetActive(target == soundRoot);
    }
}
