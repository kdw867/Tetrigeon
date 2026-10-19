using System; // 날짜 (파일 이름)
using System.IO; // 출력 경로
using UnityEditor; // 메뉴·플레이 모드 제어
using UnityEditor.SceneManagement; // 플레이 시작 씬 지정 (타이틀 장면)
using UnityEditor.Recorder; // Unity Recorder
using UnityEditor.Recorder.Encoder; // MP4 인코더 설정
using UnityEditor.Recorder.Input; // 게임 화면 입력
using UnityEngine; // 유니티 기본

// 사운드 제작 참고용 플레이 영상 녹화 메뉴 (에디터 전용). 플레이에 들어가면 자동 연출(DemoReelDirector)을 붙이고, 연출 요청에 맞춰 녹화한다
public static class DemoReelRecorder
{
    private const string PendingKey = "Tetrigeon.DemoReel.Pending"; // 메뉴로 시작한 플레이인지 (도메인 리로드 뒤에도 유지)

    private const string QueueKey = "Tetrigeon.DemoReel.Queue"; // 이어서 녹화할 트레일러 장면들 (쉼표로 구분)
    private const string TrailerShots = "T_Title,T_Opening,T_Combo,T_Sentinel,T_Finale,T_PlayEarly,T_PlayBoss,T_Clip_Caterpillar,T_Clip_QueenGrowth,T_Clip_QueenRotLock,T_Clip_TopOut"; // 트레일러 전체 장면

    private static RecorderController recorder; // 영상 녹화기
    private static string outputFile; // 이번 녹화 파일 (확장자 제외)

    [MenuItem("Tetrigeon/사운드 참고 영상 녹화 (30초)")]
    public static void Record() => Record("Reel"); // 30초 영상

    [MenuItem("Tetrigeon/발표 클립/애벌레 스킬")] public static void ClipCaterpillar() => Record("Caterpillar"); // 애벌레 갉아먹기·방해 줄
    [MenuItem("Tetrigeon/발표 클립/여왕 증식")] public static void ClipQueenGrowth() => Record("QueenGrowth"); // 여왕 수정 증식
    [MenuItem("Tetrigeon/발표 클립/여왕 회전 잠금")] public static void ClipQueenRotLock() => Record("QueenRotLock"); // 여왕 회전 잠금
    [MenuItem("Tetrigeon/발표 클립/Top Out")] public static void ClipTopOut() => Record("TopOut"); // Top Out 처리

    [MenuItem("Tetrigeon/트레일러 장면/전부 차례로 녹화")] public static void RecordAllTrailer() { SessionState.SetString(QueueKey, TrailerShots); RecordNextInQueue(); } // 장면마다 플레이를 껐다 켜며 차례로
    [MenuItem("Tetrigeon/트레일러 장면/타이틀")] public static void TrailerTitle() => Record("T_Title"); // 타이틀 → START
    [MenuItem("Tetrigeon/트레일러 장면/첫 전투와 보상")] public static void TrailerOpening() => Record("T_Opening"); // 기술 → 처치 → 보상 카드
    [MenuItem("Tetrigeon/트레일러 장면/강화 콤보")] public static void TrailerCombo() => Record("T_Combo"); // 강화 능력 효과
    [MenuItem("Tetrigeon/트레일러 장면/센티넬 보호막 파괴")] public static void TrailerSentinel() => Record("T_Sentinel"); // 보호막 → 스턴
    [MenuItem("Tetrigeon/트레일러 장면/실전 스테이지 5")] public static void TrailerPlayEarly() => Record("T_PlayEarly"); // 자동 플레이 40초
    [MenuItem("Tetrigeon/트레일러 장면/실전 보스전")] public static void TrailerPlayBoss() => Record("T_PlayBoss"); // 자동 플레이 55초
    [MenuItem("Tetrigeon/트레일러 장면/보스 처치")] public static void TrailerFinale() => Record("T_Finale"); // 여왕 처치 → VICTORY

    // 대기열의 다음 장면 녹화 (없으면 끝)
    private static void RecordNextInQueue()
    {
        string queue = SessionState.GetString(QueueKey, ""); // 남은 장면들
        if (queue.Length == 0) { Debug.Log("[DemoReel] 트레일러 장면 녹화 완료"); return; } // 다 찍음
        int comma = queue.IndexOf(','); // 첫 장면 끝
        SessionState.SetString(QueueKey, comma < 0 ? "" : queue.Substring(comma + 1)); // 나머지는 다음에
        Record(comma < 0 ? queue : queue.Substring(0, comma)); // 첫 장면 녹화
    }

    public static void Record(string scenario)
    {
        if (EditorApplication.isPlaying) // 이미 플레이 중이면 새로 시작하지 않음
        {
            Debug.LogWarning("[DemoReel] 플레이 모드를 끈 뒤 다시 실행하세요."); // 사용자 안내
            return; // 중단
        }
        SessionState.SetBool(PendingKey, true); // 플레이 진입 후 연출을 붙이도록 표시
        SessionState.SetString(DemoReelDirector.ScenarioKey, scenario); // 어떤 장면을 녹화할지
        EditorSceneManager.playModeStartScene = scenario == "T_Title" ? AssetDatabase.LoadAssetAtPath<SceneAsset>("Assets/Scenes/TitleScene.unity") : null; // 타이틀 장면만 타이틀 씬에서 시작
        EditorApplication.isPlaying = true; // 플레이 모드 시작
    }

    [InitializeOnLoadMethod]
    private static void Hook()
    {
        EditorApplication.playModeStateChanged += OnPlayModeChanged; // 플레이 진입 감지 등록
        EditorApplication.update += ResumeQueue; // 플레이가 끝나면 남은 트레일러 장면 이어서 (플레이 종료 직후 예약 호출은 사라질 수 있음)
    }

    private static void ResumeQueue()
    {
        if (EditorApplication.isPlayingOrWillChangePlaymode || EditorApplication.isCompiling) return; // 플레이·컴파일 중이면 대기
        if (SessionState.GetString(QueueKey, "").Length > 0) RecordNextInQueue(); // 남은 장면이 있으면 다음 장면
    }

    private static void OnPlayModeChanged(PlayModeStateChange state)
    {
        if (state == PlayModeStateChange.EnteredEditMode) // 플레이가 끝나면
        {
            EditorSceneManager.playModeStartScene = null; // 평소 플레이는 열린 씬에서 시작하도록 되돌림
            return; // 끝
        }
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
        string scenario = DemoReelDirector.Scenario; // 30초 영상인지 발표 클립인지
        bool reel = scenario == "Reel"; // 30초 영상 여부
        bool trailer = scenario.StartsWith("T_"); // 트레일러 장면 여부
        string desktop = Environment.GetFolderPath(Environment.SpecialFolder.Desktop); // 작업 폴더는 바탕화면에 있음
        string folder = trailer ? Path.Combine(desktop, "EXTRA", "Trailer", "footage") : reel ? Path.Combine(desktop, "EXTRA", "SoundRef_Video") : Path.Combine(desktop, "DesignLog", "clips"); // 30초 영상은 EXTRA, 클립은 발표 폴더
        Directory.CreateDirectory(folder); // 없으면 만듦

        var movie = ScriptableObject.CreateInstance<MovieRecorderSettings>(); // MP4 녹화 설정
        movie.name = "SoundRef"; // 설정 이름
        movie.Enabled = true; // 이 녹화기 사용
        movie.EncoderSettings = new CoreEncoderSettings { Codec = CoreEncoderSettings.OutputCodec.MP4, EncodingQuality = CoreEncoderSettings.VideoEncodingQuality.High }; // H.264 고화질
        movie.ImageInputSettings = reel || trailer ? new GameViewInputSettings { OutputWidth = 1920, OutputHeight = 1080 } : new GameViewInputSettings { OutputWidth = 1280, OutputHeight = 720 }; // 30초 영상은 FHD, 클립은 발표용 720p
        movie.AudioInputSettings.PreserveAudio = true; // 효과음 포함 (BGM은 연출이 음소거)
        outputFile = Path.Combine(folder, reel ? $"Tetrigeon_SoundRef_{DateTime.Now:yyyyMMdd_HHmmss}" : trailer ? scenario : $"Clip_{scenario}"); // 30초 영상은 시각, 클립·트레일러는 장면 이름
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
