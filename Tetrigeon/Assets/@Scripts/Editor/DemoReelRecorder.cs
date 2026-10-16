using System; // 날짜 (파일 이름)
using System.IO; // 출력 경로
using UnityEditor; // 메뉴·플레이 모드 제어
using UnityEditor.Recorder; // Unity Recorder
using UnityEditor.Recorder.Encoder; // MP4 인코더 설정
using UnityEditor.Recorder.Input; // 게임 화면 입력
using UnityEngine; // 유니티 기본

// 사운드 제작 참고용 플레이 영상 녹화 메뉴 (에디터 전용). 플레이에 들어가면 자동 연출(DemoReelDirector)을 붙이고, 연출 요청에 맞춰 녹화한다
public static class DemoReelRecorder
{
    private const string PendingKey = "Tetrigeon.DemoReel.Pending"; // 메뉴로 시작한 플레이인지 (도메인 리로드 뒤에도 유지)

    private static RecorderController recorder; // 영상 녹화기
    private static string outputFile; // 이번 녹화 파일 (확장자 제외)

    [MenuItem("Tetrigeon/사운드 참고 영상 녹화 (30초)")]
    public static void Record()
    {
        if (EditorApplication.isPlaying) // 이미 플레이 중이면 새로 시작하지 않음
        {
            Debug.LogWarning("[DemoReel] 플레이 모드를 끈 뒤 다시 실행하세요."); // 사용자 안내
            return; // 중단
        }
        SessionState.SetBool(PendingKey, true); // 플레이 진입 후 연출을 붙이도록 표시
        EditorApplication.isPlaying = true; // 플레이 모드 시작
    }

    [InitializeOnLoadMethod]
    private static void Hook()
    {
        EditorApplication.playModeStateChanged += OnPlayModeChanged; // 플레이 진입 감지 등록
    }

    private static void OnPlayModeChanged(PlayModeStateChange state)
    {
        if (state != PlayModeStateChange.EnteredPlayMode || !SessionState.GetBool(PendingKey, false)) return; // 메뉴로 시작한 플레이 진입만 처리
        SessionState.SetBool(PendingKey, false); // 한 번만 실행
        DemoReelDirector.RecordingRequested -= StartRecording; // 이전 등록이 남아 있어도 한 번만
        DemoReelDirector.StopRequested -= StopRecording; // 종료 요청도 중복 방지
        DemoReelDirector.RecordingRequested += StartRecording; // 연출이 준비되면 녹화 시작
        DemoReelDirector.StopRequested += StopRecording; // 연출이 끝나면 녹화 종료
        Application.runInBackground = true; // 에디터 창이 뒤에 있어도 플레이가 멈추지 않게 (이번 플레이에만 적용)
        new GameObject("DemoReelDirector").AddComponent<DemoReelDirector>(); // 플레이 중에만 있는 임시 연출 오브젝트 (씬에 저장되지 않음)
    }

    private static void StartRecording()
    {
        string folder = Path.GetFullPath(Path.Combine(Application.dataPath, "..", "..", "SoundRef_Video")); // 프로젝트 밖 작업 폴더
        Directory.CreateDirectory(folder); // 없으면 만듦

        var movie = ScriptableObject.CreateInstance<MovieRecorderSettings>(); // MP4 녹화 설정
        movie.name = "SoundRef"; // 설정 이름
        movie.Enabled = true; // 이 녹화기 사용
        movie.EncoderSettings = new CoreEncoderSettings { Codec = CoreEncoderSettings.OutputCodec.MP4, EncodingQuality = CoreEncoderSettings.VideoEncodingQuality.High }; // H.264 고화질
        movie.ImageInputSettings = new GameViewInputSettings { OutputWidth = 1920, OutputHeight = 1080 }; // 게임 화면 FHD
        movie.AudioInputSettings.PreserveAudio = true; // 효과음 포함 (BGM은 연출이 음소거)
        outputFile = Path.Combine(folder, $"Tetrigeon_SoundRef_{DateTime.Now:yyyyMMdd_HHmmss}"); // 덮어쓰지 않게 시각을 붙임
        movie.OutputFile = outputFile; // 저장 위치 (확장자는 녹화기가 붙임)

        var settings = ScriptableObject.CreateInstance<RecorderControllerSettings>(); // 녹화기 전체 설정
        settings.AddRecorderSettings(movie); // MP4 녹화기 등록
        settings.SetRecordModeToManual(); // 시작·종료를 직접 제어
        settings.FrameRate = 60f; // 60fps
        settings.CapFrameRate = true; // 실제 시간과 같은 속도로 진행

        recorder = new RecorderController(settings); // 녹화기 생성
        recorder.PrepareRecording(); // 준비
        recorder.StartRecording(); // 이 프레임부터 녹화
        Debug.Log($"[DemoReel] 녹화 시작: {outputFile}.mp4"); // 저장 위치 안내
    }

    private static void StopRecording()
    {
        DemoReelDirector.RecordingRequested -= StartRecording; // 이번 녹화의 구독 해제
        DemoReelDirector.StopRequested -= StopRecording; // 종료 요청 구독 해제
        if (recorder == null) return; // 녹화가 시작되지 않았음
        recorder.StopRecording(); // 파일 마무리
        recorder = null; // 다음 녹화를 위해 비움
        Debug.Log($"[DemoReel] 녹화 저장: {outputFile}.mp4"); // 저장 위치 안내
        EditorApplication.delayCall += () => EditorApplication.isPlaying = false; // 다음 에디터 틱에 플레이 종료
    }
}
