#if UNITY_EDITOR // 에디터 전용 도구 (빌드에는 포함되지 않음)
using System; // Array, Action
using System.Collections; // 코루틴
using System.Collections.Generic; // 칸 집합
using UnityEngine; // 유니티 기본
using UnityEngine.EventSystems; // 마우스 올림·클릭 흉내
using UnityEngine.UI; // 버튼

// 트레일러용 장면 (1080p, 배경음악 없이 효과음만). 장면 하나 = 영상 파일 하나, 편집은 FilmCraft 에서
// T_Title: 타이틀 → START → 카운트다운 / T_Opening: 첫 전투 기술들 → 애벌레 처치 → 보상 카드 → 다음 스테이지
// T_Combo: 모든 미노 강화 + 수정 칸 → 능력 효과 / T_Sentinel: 보호막 → 테트리스로 깨서 스턴 / T_Finale: 여왕 마지막 일격 → VICTORY
public partial class DemoReelDirector
{
    private IEnumerator Trailer(string scenario)
    {
        minSeconds = 0f; // 장면이 끝나면 바로 종료
        switch (scenario) // 장면별 연출
        {
            case "T_Opening": yield return TrailerOpening(); break; // 첫 전투 → 보상
            case "T_Combo": yield return TrailerCombo(); break; // 강화 능력
            case "T_Sentinel": yield return TrailerSentinel(); break; // 보호막 파괴
            case "T_Finale": yield return TrailerFinale(); break; // 보스 처치
            case "T_PlayEarly": yield return TrailerPlay(5, 40f); break; // 스테이지 5 실전 (애벌레 + 센티넬)
            case "T_PlayBoss": yield return TrailerPlay(10, 55f); break; // 스테이지 10 보스전 실전
        }
    }

    // 타이틀 화면에서 START 를 눌러 게임으로 들어가는 장면 (녹화기가 TitleScene 으로 플레이를 시작함)
    private IEnumerator TrailerTitle()
    {
        DontDestroyOnLoad(gameObject); // 게임 씬으로 넘어가도 연출 유지
        Button start = null; // START 버튼 (클릭 이벤트가 TitleMenu.StartGame 인 버튼)
        while ((start = Array.Find(FindObjectsByType<Button>(FindObjectsSortMode.None), b => b.onClick.GetPersistentEventCount() > 0 && b.onClick.GetPersistentMethodName(0) == nameof(TitleMenu.StartGame))) == null) yield return null; // 타이틀 준비 대기

        minSeconds = 0f; // 장면이 끝나면 바로 종료
        StartRecordingNow(); // 녹화 시작
        yield return Wait(2.5f); // 타이틀 화면 감상
        var pointer = new PointerEventData(EventSystem.current); // 가짜 마우스 정보
        ExecuteEvents.Execute(start.gameObject, pointer, ExecuteEvents.pointerEnterHandler); // START 위에 마우스 (강조·소리)
        yield return Wait(1.2f); // 강조 상태 잠깐
        ExecuteEvents.Execute(start.gameObject, pointer, ExecuteEvents.pointerClickHandler); // START 클릭 → 게임 씬

        while (PieceSpawner.Instance == null || CombatManager.Instance == null) yield return null; // 게임 씬 준비 대기
        PieceSpawner.OnTopOut += HandleTopOut; // OnDestroy 해제와 짝
        yield return WaitNextPiece(); // 시작 카운트다운 3·2·1 이 끝나고 첫 미노
        yield return Do(Act.Cw); yield return Do(Act.Right); yield return Do(Act.Right); // 첫 조작
        yield return Drop(); // 하드드롭
        yield return WaitNextPiece(); // 다음 미노
        yield return Do(Act.Left); yield return Do(Act.Left); yield return Do(Act.Left); // 왼쪽으로
        yield return Drop(); // 하드드롭
        yield return Wait(1.0f); // 마무리
    }

    // 스테이지 1: T스핀 더블·테트리스·한 줄 삭제 → 레미 공격으로 애벌레 처치 → 보상 카드 3장 둘러보고 선택 → 스테이지 2 카운트다운
    private IEnumerator TrailerOpening()
    {
        CombatManager cm = CombatManager.Instance; // 전투 관리자
        SetField(cm, "stageNumber", 1); // 스테이지 1
        Call(cm, "StartStage"); // 정상 진입 경로
        BuildBoard(); // 30초 영상과 같은 기술 보드
        SetQueue(TetrominoType.S, TetrominoType.Z, TetrominoType.T, TetrominoType.I, TetrominoType.O, TetrominoType.J, TetrominoType.L, TetrominoType.S); // 같은 가방 순서
        SetEnemyHp(EnemyTier.Normal, 12); // 이번 가방 피해(5+6+1)로 딱 쓰러지게 (전투 중반처럼 보임)

        yield return WaitNextPiece(); // 카운트다운은 녹화하지 않음
        StartRecordingNow(); // 녹화 시작
        yield return Bag1(); // 기술들 + 일곱 번째 고정

        while (Time.timeScale > 0f) yield return null; // 정산 → 처치 → 보상 화면 (시간 정지)
        yield return Wait(1.4f); // 보상 화면 등장
        RewardPrompt reward = FindFirstObjectByType<RewardPrompt>(); // 보상 화면
        var cards = (RewardCard[])typeof(RewardPrompt).GetField("cards", Any).GetValue(reward); // 카드 3장
        var pointer = new PointerEventData(EventSystem.current); // 가짜 마우스 정보
        foreach (RewardCard card in cards) // 카드를 하나씩 둘러봄
        {
            ExecuteEvents.Execute(card.gameObject, pointer, ExecuteEvents.pointerEnterHandler); // 카드 위에 마우스 (확대·소리)
            yield return Wait(0.8f); // 잠깐 봄
            ExecuteEvents.Execute(card.gameObject, pointer, ExecuteEvents.pointerExitHandler); // 마우스 떠남
        }
        ExecuteEvents.Execute(cards[1].gameObject, pointer, ExecuteEvents.pointerEnterHandler); // 가운데 카드 다시 강조
        yield return Wait(0.6f); // 고민
        ExecuteEvents.Execute(cards[1].Button.gameObject, pointer, ExecuteEvents.pointerClickHandler); // 선택 → 강화 → 스테이지 2
        yield return WaitNextPiece(); // 스테이지 2 카운트다운이 끝나고 첫 미노
        yield return Wait(1.0f); // 마무리
    }

    // 모든 미노 3단계 강화 + 보드에 수정 칸 → 같은 기술들로 능력 효과가 쏟아지는 장면 (스테이지 3, 애벌레 3마리)
    private IEnumerator TrailerCombo()
    {
        foreach (TetrominoType type in Enum.GetValues(typeof(TetrominoType))) // 미노 7종
            for (int i = 0; i < 3; i++) MinoUpgrades.Upgrade(type); // 3단계씩 강화 (보상 화면과 같은 경로)
        CombatManager cm = CombatManager.Instance; // 전투 관리자
        SetField(cm, "stageNumber", 3); // 애벌레 3마리 (폭발·관통이 옆으로 퍼지는 게 보임)
        Call(cm, "StartStage"); // 정상 진입 경로
        extraCrystalChance = 0.3f; // 보드 곳곳에 수정 칸
        BuildBoard(); // 기술 보드
        extraCrystalChance = 0f; // 다른 장면에 영향 없게
        SetQueue(TetrominoType.S, TetrominoType.Z, TetrominoType.T, TetrominoType.I, TetrominoType.O, TetrominoType.J, TetrominoType.L, TetrominoType.S); // 같은 가방 순서

        yield return WaitNextPiece(); // 카운트다운은 녹화하지 않음
        StartRecordingNow(); // 녹화 시작
        yield return Bag1(); // 기술들 + 일곱 번째 고정 → 능력 정산
        while (Current == null && Time.timeScale > 0f) yield return null; // 정산·몬스터 행동이 끝나거나 전멸로 보상 화면
        yield return Wait(1.5f); // 결과 화면
    }

    // 스테이지 4 센티넬: 첫 적 턴에 보호막 → 방해 줄 위로 I 를 꽂아 테트리스 → 보호막이 깨지며 스턴
    private IEnumerator TrailerSentinel()
    {
        CombatManager cm = CombatManager.Instance; // 전투 관리자
        SetField(cm, "stageNumber", 4); // 센티넬 단독
        Call(cm, "StartStage"); // 정상 진입 경로
        BuildWell(); // 왼쪽 우물 4줄 (방해 줄이 밑에 들어와도 우물은 그대로 올라감)
        SetQueue(TetrominoType.O, TetrominoType.I); // 첫 미노 O(아무 데나), 다음 I(테트리스)
        foreach (Enemy enemy in cm.Enemies) SetField(enemy, "turnsSinceSkill", enemy.SkillInterval - 1); // 첫 적 턴에 보호막 스킬

        yield return WaitNextPiece(); // 카운트다운은 녹화하지 않음
        SetField(cm, "piecesPlaced", 6); // 다음 고정이 일곱 번째 → 바로 적 턴
        StartRecordingNow(); // 녹화 시작
        yield return Wait(0.8f); // 시작 화면
        yield return Do(Act.Right); yield return Do(Act.Right); yield return Do(Act.Right); // 우물을 막지 않게 오른쪽으로
        yield return Drop(); // 일곱 번째 고정 (피해 없음) → 센티넬 보호막 + 방해 줄
        yield return WaitNextPiece(); // 적 턴이 끝나고 I 등장
        yield return Wait(0.6f); // 보호막이 보이게
        SetField(cm, "piecesPlaced", 6); // I 가 이번 턴 마지막 고정 → 바로 정산
        int top = GridManager.Height - 1; // 0번 열 위에서부터 첫 블록 찾기
        while (top >= 0 && GridManager.Instance.IsCellEmpty(new Vector2Int(0, top))) top--; // 0번 열 맨 위 블록
        yield return Place(Cells((0, top + 1), (0, top + 2), (0, top + 3), (0, top + 4)), Mode.HardDrop); // 세운 I 로 테트리스 (6 피해 ≥ 보호막 5)
        while (Current == null) yield return null; // 레미 공격 → 보호막 파괴 → 스턴 모션이 끝나고 다음 미노
        yield return Wait(1.5f); // 스턴 상태가 보이게
    }

    // 스테이지 10: 여왕 체력이 얼마 안 남은 상태에서 테트리스 → 마지막 일격 → VICTORY
    private IEnumerator TrailerFinale()
    {
        CombatManager cm = CombatManager.Instance; // 전투 관리자
        SetField(cm, "stageNumber", 10); // 보스전
        Call(cm, "StartStage"); // 정상 진입 경로
        BuildWell(); // 왼쪽 우물 4줄
        SetQueue(TetrominoType.I); // 첫 미노 I
        Call(cm, "CycleTarget"); Call(cm, "CycleTarget"); // 타겟을 여왕으로
        SetEnemyHp(EnemyTier.Boss, 3); // 마지막 한 방 직전 (호위가 살아 있으면 보스 피해가 줄어드므로 넉넉히 낮게)
        foreach (Enemy enemy in cm.Enemies) SetField(enemy, "turnsSinceSkill", 0); // 능력 없이

        yield return WaitNextPiece(); // 카운트다운은 녹화하지 않음
        SetField(cm, "piecesPlaced", 6); // I 가 일곱 번째 고정 → 바로 정산
        StartRecordingNow(); // 녹화 시작
        yield return Wait(1.0f); // 긴장감
        yield return Place(Cells((0, 0), (0, 1), (0, 2), (0, 3)), Mode.HardDrop); // 테트리스
        while (Time.timeScale > 0f) yield return null; // 레미 공격 → 여왕 처치 → 런 클리어 (시간 정지)
        yield return Wait(4.0f); // VICTORY 화면 유지
    }

    // 실전 장면: 랜덤 강화 9회 상태로 스테이지에 들어가 자동 플레이 (몬스터 능력·방해 줄·여왕 증식이 자연스럽게 나옴)
    private IEnumerator TrailerPlay(int stage, float seconds)
    {
        ApplyRandomUpgrades(); // 30초 영상과 같은 랜덤 강화 9회
        CombatManager cm = CombatManager.Instance; // 전투 관리자
        SetField(cm, "stageNumber", stage); // 스테이지
        Call(cm, "StartStage"); // 정상 진입 경로
        yield return WaitNextPiece(); // 카운트다운은 녹화하지 않음
        maxSeconds = seconds; // 이 길이에서 끊음
        minSeconds = seconds; // 연출이 먼저 끝나도 이 길이까지
        placeStep = 0.034f; // 2프레임마다 한 걸음 (중력보다 빨리 목표 열에 도착)
        StartRecordingNow(); // 녹화 시작
        while (recording) // 녹화가 끝날 때까지 계속 둠
        {
            if (Current == null || Time.timeScale == 0f) { yield return null; continue; } // 정산·Top Out·보상 화면 중에는 대기
            Piece piece = Current; // 이번 미노
            yield return Wait(0.08f); // 사람이 보고 판단하는 시간
            if (Current != piece) continue; // 그 사이 고정됐으면 다음
            HashSet<Vector2Int> target = BestPlacement(piece); // 가장 좋은 자리
            if (target == null) yield return Drop(); // 놓을 자리가 없으면 제자리 하드드롭 (Top Out 직전)
            else yield return Place(target, Mode.HardDrop); // 가장 좋은 자리로 옮겨 하드드롭
        }
    }

    // 놓을 수 있는 모든 자리(회전 × 가로 위치)를 하드드롭으로 놓아 보고 점수가 가장 높은 칸 집합을 고름
    private static HashSet<Vector2Int> BestPlacement(Piece piece)
    {
        HashSet<Vector2Int> best = null; // 고른 칸
        float bestScore = float.MinValue; // 고른 점수
        for (int rot = 0; rot < 4; rot++) // 회전 방향마다
        {
            if (piece.Mino.RotationLocked && rot != piece.RotationState) continue; // 회전 금지 미노는 지금 방향만
            for (int x = -3; x < GridManager.Width + 3; x++) // 가로 위치마다
            {
                var pos = new Vector2Int(x, piece.BoardPosition.y); // 지금 높이에서
                if (!Piece.CanPlaceMino(piece.Mino, rot, pos)) continue; // 놓을 수 없는 자리
                while (Piece.CanPlaceMino(piece.Mino, rot, pos + Vector2Int.down)) pos += Vector2Int.down; // 하드드롭 착지
                var cells = new HashSet<Vector2Int>(); // 착지 칸
                foreach (Vector2Int c in piece.Mino.GetCells(rot)) cells.Add(pos + c); // 미노 칸 더하기
                float score = Evaluate(cells); // 보드 평가
                if (score > bestScore) { bestScore = score; best = cells; } // 더 좋은 자리
            }
        }
        return best; // 최선의 칸
    }

    // 놓은 뒤 보드 점수: 지운 줄은 +, 구멍·높이·울퉁불퉁함은 - (흔한 테트리스 AI 평가식)
    private static float Evaluate(HashSet<Vector2Int> placed)
    {
        int w = GridManager.Width, h = GridManager.Height; // 보드 크기
        var filled = new bool[w, h]; // 놓은 뒤 보드
        for (int x = 0; x < w; x++) for (int y = 0; y < h; y++) filled[x, y] = !GridManager.Instance.IsCellEmpty(new Vector2Int(x, y)) || placed.Contains(new Vector2Int(x, y)); // 기존 + 새 칸
        int lines = 0; // 지운 줄
        for (int y = h - 1; y >= 0; y--) // 위에서부터 꽉 찬 줄 지우기
        {
            bool full = true; // 꽉 찼는지
            for (int x = 0; x < w && full; x++) full = filled[x, y]; // 빈 칸 확인
            if (!full) continue; // 남는 줄
            lines++; // 한 줄 지움
            for (int yy = y; yy < h - 1; yy++) for (int x = 0; x < w; x++) filled[x, yy] = filled[x, yy + 1]; // 위 줄을 내림
            for (int x = 0; x < w; x++) filled[x, h - 1] = false; // 맨 윗줄 비움
        }
        int holes = 0, total = 0, bump = 0, prev = -1, max = 0; // 구멍·높이 합·울퉁불퉁함·최고 높이
        for (int x = 0; x < w; x++) // 열마다
        {
            int top = 0; // 이 열의 높이
            for (int y = h - 1; y >= 0; y--) if (filled[x, y]) { top = y + 1; break; } // 맨 위 블록
            for (int y = 0; y < top; y++) if (!filled[x, y]) holes++; // 덮인 빈칸
            total += top; max = Mathf.Max(max, top); // 높이 합·최고
            if (prev >= 0) bump += Mathf.Abs(top - prev); // 옆 열과 높이 차
            prev = top; // 다음 열 비교용
        }
        return lines * lines * 2f - holes * 7f - total * 0.5f - bump * 0.35f - max * 0.3f; // 여러 줄 한 번에 지우기를 선호
    }

    // ── 사건 기록 (편집 타이밍용: 영상 시각 + 사건, 장면 이름.marks.txt) ──────────

    private readonly List<string> marks = new List<string>(); // 기록된 사건들
    private readonly Dictionary<Enemy, Action<EnemyActionKind>> enemyHooks = new Dictionary<Enemy, Action<EnemyActionKind>>(); // 적별 행동 구독

    private void Awake()
    {
        PieceSpawner.OnPieceLocked += MarkLock; // 고정·줄 삭제·T스핀
        PieceSpawner.OnTopOut += MarkTopOut; // Top Out
        PieceSpawner.OnHoldSucceeded += MarkHold; // 홀드
        CombatManager.OnPlayerAttack += MarkAttack; // 레미 공격
        CombatManager.OnTurnSequenceChanged += MarkTurn; // 정산 연출 시작·끝
        CombatManager.OnStageCleared += MarkCleared; // 스테이지 클리어
        CombatManager.OnCombatEnded += MarkEnded; // 승리·패배
        CombatManager.OnStageStarted += MarkStarted; // 스테이지 시작 (카운트다운)
    }

    private void UnhookMarks()
    {
        PieceSpawner.OnPieceLocked -= MarkLock; // 구독 해제
        PieceSpawner.OnTopOut -= MarkTopOut; // 구독 해제
        PieceSpawner.OnHoldSucceeded -= MarkHold; // 구독 해제
        CombatManager.OnPlayerAttack -= MarkAttack; // 구독 해제
        CombatManager.OnTurnSequenceChanged -= MarkTurn; // 구독 해제
        CombatManager.OnStageCleared -= MarkCleared; // 구독 해제
        CombatManager.OnCombatEnded -= MarkEnded; // 구독 해제
        CombatManager.OnStageStarted -= MarkStarted; // 구독 해제
        foreach (var hook in enemyHooks) if (hook.Key != null) hook.Key.Acted -= hook.Value; // 적 구독 해제
        enemyHooks.Clear(); // 비움
    }

    private void Mark(string what)
    {
        if (recording) marks.Add($"{(Time.frameCount - recordStartFrame) / 60f:0.00}	{what}"); // 녹화 중일 때만 영상 시각으로 기록
    }

    private void MarkLock(TetrominoType type, TSpinType tSpin, int lines, IReadOnlyList<TetrominoType> crystals) => Mark($"lock {type} lines={lines} tspin={tSpin} crystals={crystals.Count}"); // 고정
    private void MarkTopOut() => Mark("topout"); // Top Out
    private void MarkHold() => Mark("hold"); // 홀드
    private void MarkAttack() => Mark("lemy_attack"); // 레미 공격 시작
    private void MarkCleared(int stage) => Mark($"stage_clear {stage}"); // 보상 화면
    private void MarkEnded(bool won) => Mark(won ? "victory" : "defeat"); // 런 종료
    private void MarkStarted() => Mark("stage_start"); // 새 스테이지

    private void MarkTurn(bool start)
    {
        Mark(start ? "turn_start" : "turn_end"); // 정산 연출
        if (!start || CombatManager.Instance == null) return; // 시작 때만 적 구독 갱신
        foreach (Enemy enemy in CombatManager.Instance.Enemies) // 이번 스테이지 적
        {
            if (enemy == null || enemyHooks.ContainsKey(enemy)) continue; // 이미 구독함
            Enemy e = enemy; // 람다용 복사
            Action<EnemyActionKind> hook = kind => Mark($"enemy {e.Tier} {kind}"); // 적 행동 기록
            e.Acted += hook; // 구독
            enemyHooks[e] = hook; // 해제용 보관
        }
    }

    private void SaveMarks()
    {
        if (!Scenario.StartsWith("T_")) return; // 트레일러 장면만
        string folder = System.IO.Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Desktop), "EXTRA", "Trailer", "footage"); // 영상과 같은 폴더
        System.IO.File.WriteAllLines(System.IO.Path.Combine(folder, Scenario + ".marks.txt"), marks); // 저장
    }

    // ── 트레일러 공통 ────────────────────────────────────────

    // 0번 열만 빈 4줄 (세운 I 로 테트리스)
    private static void BuildWell()
    {
        for (int y = 0; y < 4; y++) for (int x = 1; x < GridManager.Width; x++) PlaceBlock(new Vector2Int(x, y), (TetrominoType)UnityEngine.Random.Range(0, 7), UnityEngine.Random.Range(0, 4)); // 무작위 미노 그림
    }

    private void StartRecordingNow()
    {
        RecordingRequested?.Invoke(); // 녹화 시작
        recording = true; // 길이 검사 시작
        recordStartFrame = Time.frameCount; // 길이 측정 기준
    }

    // 해당 등급 적의 현재 체력을 바꾸고 체력바 갱신
    private static void SetEnemyHp(EnemyTier tier, int hp)
    {
        foreach (Enemy enemy in CombatManager.Instance.Enemies) // 이번 스테이지 적
            if (enemy.Tier == tier) typeof(Enemy).GetField("<Hp>k__BackingField", Any).SetValue(enemy, hp); // 자동 속성의 숨은 필드
        ((Action)typeof(CombatManager).GetField("OnStateChanged", Any).GetValue(null))?.Invoke(); // 체력바 갱신
    }
}
#endif // UNITY_EDITOR
