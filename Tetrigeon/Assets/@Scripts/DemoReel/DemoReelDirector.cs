#if UNITY_EDITOR // 에디터 전용 도구 (빌드에는 포함되지 않음)
using System; // Action, Enum, Array
using System.Collections; // 코루틴
using System.Collections.Generic; // 목록·큐·탐색 기록
using System.IO; // 스크린샷 경로
using System.Reflection; // 게임 코드를 고치지 않고 비공개 조작 경로 호출
using UnityEngine; // 유니티 기본

// 사운드 제작 참고용 30초 영상 자동 연출 (에디터 전용, 게임 코드는 바꾸지 않고 리플렉션으로 조작만 함)
// 녹화기는 에디터 어셈블리에만 있어서, 녹화 시작·종료는 이벤트로 Editor/DemoReelRecorder 에 맡긴다
// 순서: 카운트다운 → 이동·회전·소프트드롭 → 홀드·홀드 불가 → T스핀 더블 → 테트리스 → 홀드 충전 → 한 줄 삭제(수정 파괴)
//      → 레미 공격 → 몬스터 3종 능력(갉아먹기·보호막·회전 금지, 방해 줄) → 잠긴 미노 회전 실패 → 쌓아서 Top Out → 몬스터 공격·여왕 증식 모션
public partial class DemoReelDirector : MonoBehaviour // 트레일러 장면은 DemoReelDirector.Trailer.cs
{
    private const BindingFlags Any = BindingFlags.Instance | BindingFlags.Static | BindingFlags.Public | BindingFlags.NonPublic; // 비공개 멤버 접근용
    private const float Step = 0.07f; // 이동·회전 한 번 사이 간격 (사람 손 속도)
    private const float MinSeconds = 30f; // 최소 녹화 길이
    private const float MaxSeconds = 36f; // 연출이 늦어져도 여기서 끊음
    private const int UpgradeCount = 9; // 랜덤 미노 강화 횟수
    private float placeStep = Step; // Place 의 한 걸음 간격 (실전 장면은 더 빠르게)
    public static int Seed = 1; // 랜덤 고정값 (같은 값이면 강화·가방·방해 줄 구멍이 매번 같음)

    private enum Mode { HardDrop, SoftDrop, Spin } // 목표 칸까지 가는 방식: 하드드롭 / 한 칸씩 내려 놓기 / 마지막을 회전으로 끼워 넣기
    private enum Act { Left, Right, Down, Cw, Ccw } // 조작 한 번

    public static event Action RecordingRequested; // 녹화 시작 요청 (이 프레임부터 영상)
    public static event Action StopRequested; // 녹화 종료 요청

    private bool recording; // 녹화 중인지
    private bool topOutHappened; // Top Out 발생 여부
    private int recordStartFrame; // 녹화 시작 프레임 (녹화 중 한 프레임 = 1/60초, 게임 시간이 멈춰도 영상은 흐름)
    private bool scriptDone; // 연출 순서를 다 마쳤는지

    private static readonly FieldInfo CurrentPieceField = typeof(PieceSpawner).GetField("currentPiece", Any); // 조작 중인 미노
    private static readonly MethodInfo HardDropMethod = typeof(PieceSpawner).GetMethod("HardDrop", Any); // 하드드롭
    private static readonly MethodInfo SwapHoldMethod = typeof(PieceSpawner).GetMethod("SwapHold", Any); // 홀드

    private static Piece Current => (Piece)CurrentPieceField.GetValue(PieceSpawner.Instance); // 지금 조작 중인 미노 (없으면 null)

    public const string ScenarioKey = "Tetrigeon.DemoReel.Scenario"; // 녹화 메뉴가 고른 장면 (Reel = 30초 영상, 나머지 = 발표용 짧은 클립)
    public static string Scenario => UnityEditor.SessionState.GetString(ScenarioKey, "Reel"); // 플레이 진입 뒤에도 유지되는 값
    private float minSeconds = MinSeconds; // 이번 녹화의 최소 길이 (클립은 0)
    private float maxSeconds = MaxSeconds; // 이번 녹화의 최대 길이 (트레일러 실전 장면은 더 김)

    // 발표용 짧은 클립: Caterpillar(애벌레 스킬) / QueenGrowth(여왕 증식) / QueenRotLock(여왕 회전 잠금) / TopOut
    private IEnumerator Clip(string scenario)
    {
        CombatManager cm = CombatManager.Instance; // 전투 관리자
        SetField(cm, "stageNumber", scenario == "Caterpillar" ? 1 : 10); // 애벌레는 단독(스테이지 1), 나머지는 보스전(스테이지 10)
        Call(cm, "StartStage"); // 정상 스테이지 진입 경로
        BuildClipBoard(scenario == "TopOut" ? 18 : 4); // Top Out 은 거의 꽉 찬 보드, 나머지는 갉아먹을 블록 몇 줄
        foreach (Enemy enemy in cm.Enemies) // 이번 클립의 주인공만 능력 사용
        {
            bool skill = scenario == "Caterpillar" ? enemy.Tier == EnemyTier.Normal : scenario.StartsWith("Queen") && enemy.Tier == EnemyTier.Boss; // 능력 쓸 적
            SetField(enemy, "turnsSinceSkill", skill ? enemy.SkillInterval - 1 : 0); // 능력 쓸 적은 이번 턴에, 나머지는 일반 공격
            if (enemy.Tier == EnemyTier.Boss) SetField(enemy, "queenUsedGrowth", scenario == "QueenRotLock"); // 여왕 능력 종류 (true 면 회전 잠금)
        }
        yield return WaitNextPiece(); // 스테이지 시작 카운트다운은 녹화하지 않음
        if (scenario != "TopOut") SetField(cm, "piecesPlaced", 6); // 다음 고정이 일곱 번째 → 바로 적 턴

        minSeconds = 0f; // 클립은 연출이 끝나면 바로 종료
        RecordingRequested?.Invoke(); // 녹화 시작
        recording = true; // 길이 검사 시작
        recordStartFrame = Time.frameCount; // 길이 측정 기준
        yield return Wait(0.9f); // 시작 화면 잠깐

        if (scenario == "TopOut")
        {
            yield return StackToTopOut(); // 세워 쌓아 스폰 자리를 막음 → 보드 비우기 → HP 감소 → 적 턴
            yield return WaitNextPiece(); // 적 턴이 끝나고 새 가방 시작
            yield return Wait(1.2f); // 새 가방 첫 미노가 보이게
            yield break;
        }

        yield return Do(Act.Right); yield return Do(Act.Right); yield return Do(Act.Right); // 오른쪽으로 옮겨
        yield return Drop(); // 일곱 번째 고정 → 몬스터 행동
        yield return WaitNextPiece(); // 몬스터 행동이 끝나고 다음 미노가 나올 때까지
        if (scenario == "QueenRotLock") // 회전 잠금은 발동 직후 미노 다음 2개가 잠김
        {
            yield return Drop(); // 첫 미노는 정상 → 바로 하드드롭
            yield return Wait(0.4f); // 봉인 표식이 붙은 미노 등장
            yield return Do(Act.Cw); yield return Wait(0.25f); yield return Do(Act.Ccw); // 회전 시도가 막힘
            yield return Wait(1.2f); // 마무리
        }
        else yield return Wait(2.0f); // 갉아먹힌 칸·방해 줄 / 증식된 NEXT 가 보이게
    }

    // 클립용 보드: 아래에서 rows 줄을 칸마다 한 칸씩 비워 채움 (줄 삭제가 일어나지 않게)
    private static void BuildClipBoard(int rows)
    {
        for (int y = 0; y < rows; y++) // 줄마다
        {
            int hole = UnityEngine.Random.Range(0, GridManager.Width); // 이 줄의 빈 칸
            for (int x = 0; x < GridManager.Width; x++) // 칸마다
                if (x != hole) PlaceBlock(new Vector2Int(x, y), (TetrominoType)UnityEngine.Random.Range(0, 7), UnityEngine.Random.Range(0, 4)); // 무작위 미노 그림
        }
    }

    // 고정 블록 하나를 게임과 같은 구성으로 보드에 놓음
    private static void PlaceBlock(Vector2Int cell, TetrominoType type, int index)
    {
        GameObject block = new GameObject("Block"); // 고정 블록과 같은 구성
        block.transform.SetParent(GridManager.Instance.transform); // 줄 삭제·Top Out 정리가 그대로 적용되도록 그리드 자식으로
        SpriteRenderer renderer = block.AddComponent<SpriteRenderer>(); // 블록 그림
        PieceVisuals.ApplyMinoArt(renderer, type, index); // 게임 블록과 같은 아트·수정 판정
        block.transform.position = GridManager.CellToWorld(cell); // 칸 위치
        GridManager.Instance.SetCell(cell, block.transform); // 보드에 등록
    }

    private IEnumerator Start()
    {
        if (Scenario == "T_Title") { yield return TrailerTitle(); scriptDone = true; yield break; } // 타이틀 화면에서 시작하는 장면
        while (CombatManager.Instance == null || PieceSpawner.Instance == null || BagManager.Instance == null || GridManager.Instance == null) yield return null; // 매니저 준비 대기
        while (Current == null) yield return null; // 게임 시작 카운트다운이 끝날 때까지 대기 (녹화 전)

        UnityEngine.Random.InitState(Seed); // 다시 녹화해도 같은 영상이 나오게
        if (!Scenario.StartsWith("T_") || Scenario.StartsWith("T_Clip_")) ApplyRandomUpgrades(); // 미노 강화 9회 (랜덤, 트레일러 장면은 장면마다 따로)
        PieceSpawner.OnTopOut += HandleTopOut; // Top Out 감지
        if (Scenario.StartsWith("T_Clip_")) { yield return Clip(Scenario.Substring(7)); scriptDone = true; yield break; } // 트레일러용 1080p 클립
        if (Scenario.StartsWith("T_")) { yield return Trailer(Scenario); scriptDone = true; yield break; } // 트레일러 전용 장면
        if (Scenario != "Reel") { yield return Clip(Scenario); scriptDone = true; yield break; } // 발표용 짧은 클립은 따로 진행

        RecordingRequested?.Invoke(); // 녹화 시작 (이 프레임부터 영상)
        recording = true; // 길이 검사 시작
        recordStartFrame = Time.frameCount; // 길이 측정 기준 (녹화 중 한 프레임 = 1/60초)

        SetField(CombatManager.Instance, "stageNumber", 10); // 스테이지 10으로
        Call(CombatManager.Instance, "StartStage"); // 정상 스테이지 진입 경로로 적·보드·가방·카운트다운 시작
        BuildBoard(); // 연출용 보드 미리 쌓기
        Shot("00_countdown"); // 카운트다운과 준비된 보드
        SetQueue(TetrominoType.S, TetrominoType.Z, TetrominoType.T, TetrominoType.I, TetrominoType.O, TetrominoType.J, TetrominoType.L, TetrominoType.S); // 첫 가방 순서 고정 (Z는 홀드로 빠지므로 일곱 번째 고정은 마지막 S)
        Call(CombatManager.Instance, "CycleTarget"); // 타겟을 수호자로
        Call(CombatManager.Instance, "CycleTarget"); // 타겟을 여왕으로 (보스라 죽지 않음)
        foreach (Enemy enemy in CombatManager.Instance.Enemies) // 세 몬스터 모두
        {
            SetField(enemy, "turnsSinceSkill", enemy.SkillInterval - 1); // 첫 적 턴에 세 마리 모두 능력 사용
            if (enemy.Tier == EnemyTier.Boss) SetField(enemy, "queenUsedGrowth", true); // 여왕 첫 능력은 회전 금지 (Top Out 뒤에 걸면 새 가방으로 바뀌며 사라지므로 첫 턴에)
        }

        yield return Bag1(); // 플레이어 기술들
        yield return Wait(2.2f); // 몬스터 행동 중간까지
        Shot("06_monster_skills"); // 몬스터 능력 모션 중
        yield return WaitNextPiece(); // 레미 공격 + 몬스터 능력 연출이 끝나고 다음 미노가 나올 때까지

        foreach (Enemy enemy in CombatManager.Instance.Enemies) // 여왕만 다시
            if (enemy.Tier == EnemyTier.Boss) SetField(enemy, "turnsSinceSkill", enemy.SkillInterval - 1); // Top Out 뒤 적 턴에 여왕이 증식 모션 (회전 금지 다음 순서)

        yield return StackToTopOut(); // 잠긴 미노 회전 실패 + 가운데로 쌓아 Top Out
        yield return WaitNextPiece(); // Top Out 페널티 + 몬스터 공격·증식 연출 뒤 새 가방
        yield return Bag3(); // 새 가방 첫 미노

        scriptDone = true; // 남은 시간은 그대로 둠
    }

    private void Update()
    {
        MuteMusicSources(); // 장면이 바뀌어도 배경음악은 계속 끔 (음악은 편집에서 따로 깖)
        if (!recording) return; // 녹화 전·후
        float elapsed = (Time.frameCount - recordStartFrame) / 60f; // 녹화 경과 시간 (영상 길이)
        if ((scriptDone && elapsed >= minSeconds) || elapsed >= maxSeconds) // 30초를 채웠거나 최대 길이 도달
        {
            recording = false; // 한 번만 종료
            Debug.Log($"[DemoReel] 연출 종료 ({elapsed:0.0}초)"); // 영상 길이 기록
            SaveMarks(); // 트레일러 장면은 사건 시각 기록 저장
            StopRequested?.Invoke(); // 녹화 종료 후 플레이 종료는 에디터 쪽에서
        }
    }

    private void OnDestroy()
    {
        PieceSpawner.OnTopOut -= HandleTopOut; // 정적 이벤트 구독 해제
        UnhookMarks(); // 사건 기록 구독 해제
        if (recording) StopRequested?.Invoke(); // 중간에 플레이가 꺼져도 파일 마무리
    }

    private void HandleTopOut() => topOutHappened = true; // Top Out 기록

    // ── 연출 순서 ──────────────────────────────────────────────

    private IEnumerator Bag1()
    {
        yield return WaitNextPiece(); // 스테이지 카운트다운이 끝나고 첫 미노(S)가 나올 때까지

        // S: 좌우 이동·회전 소리를 보여 준 뒤 한 칸씩 내려서 놓기
        yield return Do(Act.Right); yield return Do(Act.Right); yield return Do(Act.Cw); yield return Do(Act.Ccw); yield return Do(Act.Left); // 이동·회전 소리
        yield return Place(Cells((2, 7), (3, 7), (3, 8), (4, 8)), Mode.SoftDrop); // 소프트드롭 후 자연 고정

        // Z: 홀드 → 나온 T로 다시 홀드 시도(불가 소리)
        yield return Wait(0.2f); // 잠깐 멈춤
        SwapHoldMethod.Invoke(PieceSpawner.Instance, null); // 홀드 성공
        Shot("01_hold"); // 홀드 장면
        yield return Wait(0.35f); // 소리 간격
        SwapHoldMethod.Invoke(PieceSpawner.Instance, null); // 같은 미노에서 다시 홀드 → 불가
        yield return Wait(0.2f); // 소리 간격

        yield return Place(Cells((7, 4), (6, 5), (7, 5), (8, 5)), Mode.Spin); // T: T스핀 더블 (회전으로 끼워 넣고 자연 고정)
        Shot("02_tspin_double"); // T스핀 더블 장면
        yield return Place(Cells((0, 0), (0, 1), (0, 2), (0, 3)), Mode.HardDrop); // I: 왼쪽 우물에 세워서 테트리스
        Shot("03_tetris"); // 테트리스 장면
        yield return Place(Cells((6, 0), (7, 0), (6, 1), (7, 1)), Mode.HardDrop); // O: 빈칸 채우기 (세 번째 고정이라 홀드 충전 회복)
        yield return Place(Cells((0, 0), (0, 1), (0, 2), (1, 2)), Mode.HardDrop); // J: 한 줄 삭제 (수정 칸 파괴)

        Shot("04_single_clear"); // 한 줄 삭제 직후

        // L: 오른쪽으로 옮겨 하드드롭
        yield return Do(Act.Right); yield return Do(Act.Right); yield return Do(Act.Right); // 오른쪽으로 세 칸
        yield return Drop(); // 하드드롭 후 그 미노가 고정될 때까지

        // S: 왼쪽으로 옮겨 하드드롭 → 일곱 번째 고정으로 턴 종료
        yield return Do(Act.Left); yield return Do(Act.Left); // 왼쪽으로 두 칸
        yield return Drop(); // 일곱 번째 고정 → 정산 연출 시작
        yield return Wait(0.65f); // 레미 공격 모션 중간까지
        Shot("05_lemy_attack"); // 레미 공격 모션 중
    }

    private IEnumerator StackToTopOut()
    {
        for (int i = 0; i < 14 && !topOutHappened; i++) // 가운데에 세워 쌓다 보면 스폰 자리가 막혀 Top Out
        {
            while (Current == null && !topOutHappened) yield return null; // 다음 미노 대기
            if (topOutHappened) break; // 이미 Top Out
            if (Current.Mino.RotationLocked) // 여왕 회전 금지 미노: 회전 시도가 막히는 소리
            {
                yield return Do(Act.Cw); yield return Wait(0.12f); yield return Do(Act.Ccw); // 회전 실패 두 번
                Shot("07_rotation_locked"); // 봉인 표식이 붙은 미노
                yield return Wait(0.1f); // 소리 간격
            }
            else yield return Do(Act.Cw); // 세워서 빨리 높이 쌓기
            yield return Drop(); // 제자리 하드드롭
            yield return Wait(0.15f); // 다음 미노 전 간격
            if (Current == null && !topOutHappened) Shot("08_topout"); // 스폰이 막혀 보드를 지우는 중
        }
        yield return Wait(1.0f); // Top Out 뒤 몬스터 행동 중간까지
        Shot("09_monster_phase2"); // Top Out 뒤 몬스터 공격·여왕 증식 모션
    }

    private IEnumerator Bag3()
    {
        // Top Out 뒤 빈 보드(방해 줄 위)에 새 가방 첫 미노: 회전 후 왼쪽으로 하드드롭
        yield return Do(Act.Cw); yield return Do(Act.Left); yield return Do(Act.Left); yield return Do(Act.Left); // 회전 후 왼쪽으로 세 칸
        yield return Drop(); // 하드드롭 후 그 미노가 고정될 때까지
    }

    // ── 조작 ────────────────────────────────────────────────

    private IEnumerator Do(Act act)
    {
        Piece piece = Current; // 지금 미노
        if (piece != null) Perform(piece, act); // 실제 게임 조작 경로 그대로 (소리·연출 포함)
        yield return Wait(Step); // 다음 조작까지 간격
    }

    private static void Perform(Piece piece, Act act)
    {
        switch (act) // 조작 종류별 게임 메서드 호출
        {
            case Act.Left: piece.TryMove(Vector2Int.left); break; // 왼쪽 이동
            case Act.Right: piece.TryMove(Vector2Int.right); break; // 오른쪽 이동
            case Act.Down: piece.TryMove(Vector2Int.down); break; // 한 칸 아래 (소프트드롭)
            case Act.Cw: piece.TryRotate(1); break; // 시계 방향 회전
            case Act.Ccw: piece.TryRotate(-1); break; // 반시계 방향 회전
        }
    }

    // 목표 칸까지 한 걸음씩: 매번 현재 상태에서 다시 길을 찾으므로 자동 낙하가 끼어들어도 따라감
    private IEnumerator Place(HashSet<Vector2Int> target, Mode mode)
    {
        Piece piece = null; // 이번에 옮길 미노
        while ((piece = Current) == null) yield return null; // 미노 등장 대기

        for (int guard = 0; guard < 80 && Current == piece; guard++) // 길을 못 찾는 경우를 대비한 횟수 제한
        {
            Act? next = FindNextAct(piece, target, mode, out bool arrived); // 다음 한 걸음
            if (arrived) break; // 목표 위치 도달
            if (next == null) { Debug.LogWarning($"[DemoReel] {piece.Type} 목표까지 길이 없음"); break; } // 보드가 예상과 다름
            Perform(piece, next.Value); // 한 걸음 진행
            yield return Wait(placeStep); // 사람 손 속도
        }

        if (mode == Mode.HardDrop && Current == piece) HardDropMethod.Invoke(PieceSpawner.Instance, null); // 하드드롭 고정
        while (Current == piece) yield return null; // 자연 고정(Lock Delay)까지 대기
        yield return Wait(0.15f); // 줄 삭제 연출 간격
    }

    // 너비 우선 탐색으로 목표까지의 첫 조작을 고른다 (하드드롭은 좌우·회전만, 나머지는 아래 이동 포함)
    private static Act? FindNextAct(Piece piece, HashSet<Vector2Int> target, Mode mode, out bool arrived)
    {
        var start = (piece.BoardPosition, piece.RotationState, piece.LastActionWasRotation); // 현재 상태
        arrived = IsGoal(piece.Mino, start.BoardPosition, start.RotationState, start.LastActionWasRotation, target, mode); // 이미 목표인지
        if (arrived) return null; // 더 움직일 필요 없음

        var firstAct = new Dictionary<(Vector2Int, int, bool), Act>(); // 상태별로 처음 고른 조작
        var queue = new Queue<(Vector2Int pos, int rot, bool spun)>(); // 탐색 대기열
        firstAct[start] = Act.Left; // 시작 상태 표시용 (사용 안 함)
        queue.Enqueue(start); // 시작 상태부터
        Act[] acts = mode == Mode.HardDrop ? new[] { Act.Cw, Act.Ccw, Act.Left, Act.Right } : new[] { Act.Cw, Act.Ccw, Act.Left, Act.Right, Act.Down }; // 하드드롭은 아래 이동 없이

        while (queue.Count > 0) // 갈 수 있는 상태를 가까운 순서로
        {
            var s = queue.Dequeue(); // 다음 상태
            foreach (Act act in acts) // 가능한 조작마다
            {
                if (!Simulate(piece.Mino, s.pos, s.rot, act, out Vector2Int pos, out int rot)) continue; // 막힌 조작
                var n = (pos, rot, act == Act.Cw || act == Act.Ccw); // 조작 후 상태 (마지막이 회전이었는지 포함)
                if (firstAct.ContainsKey(n)) continue; // 이미 본 상태
                firstAct[n] = s.Equals(start) ? act : firstAct[s]; // 시작에서 처음 고른 조작을 물려줌
                if (IsGoal(piece.Mino, pos, rot, n.Item3, target, mode)) return firstAct[n]; // 목표에 닿는 첫 조작
                queue.Enqueue(n); // 계속 탐색
            }
        }
        return null; // 길 없음
    }

    private static bool Simulate(MinoState mino, Vector2Int pos, int rot, Act act, out Vector2Int newPos, out int newRot)
    {
        newPos = pos; newRot = rot; // 기본은 제자리
        if (act == Act.Left || act == Act.Right || act == Act.Down) // 이동
        {
            newPos = pos + (act == Act.Left ? Vector2Int.left : act == Act.Right ? Vector2Int.right : Vector2Int.down); // 이동한 위치
            return Piece.CanPlaceMino(mino, rot, newPos); // 게임과 같은 충돌 판정
        }
        if (mino.RotationLocked) return false; // 회전 금지 미노는 회전 불가
        int to = rot + (act == Act.Cw ? 1 : -1); // 회전 후 방향
        foreach (Vector2Int kick in SRSKickData.GetTests(mino.Type, rot, to)) // 게임과 같은 킥 순서
        {
            if (!Piece.CanPlaceMino(mino, to, pos + kick)) continue; // 막힌 킥은 다음 후보
            newPos = pos + kick; newRot = ((to % 4) + 4) % 4; // 처음 성공한 킥으로 회전
            return true; // 회전 성공
        }
        return false; // 모든 킥 실패
    }

    private static bool IsGoal(MinoState mino, Vector2Int pos, int rot, bool spun, HashSet<Vector2Int> target, Mode mode)
    {
        if (mode == Mode.HardDrop) while (Piece.CanPlaceMino(mino, rot, pos + Vector2Int.down)) pos += Vector2Int.down; // 하드드롭 착지 위치로
        else if (Piece.CanPlaceMino(mino, rot, pos + Vector2Int.down)) return false; // 바닥에 닿아 있어야 함
        if (mode == Mode.Spin && !spun) return false; // T스핀은 마지막 조작이 회전이어야 함
        foreach (Vector2Int cell in mino.GetCells(rot)) if (!target.Contains(pos + cell)) return false; // 모든 칸이 목표와 일치
        return true; // 목표 도달
    }

    // ── 준비 ────────────────────────────────────────────────

    // 연출용 보드: 0~3줄은 왼쪽 우물(테트리스), 4~5줄은 T스핀 더블 자리, 6줄은 처마 + 마지막 한 줄 삭제용
    private static float extraCrystalChance; // 추가 수정 칸 확률 (기본 0)
    private static void BuildBoard()
    {
        var filled = new List<Vector2Int>(); // 채울 칸 목록
        for (int y = 0; y <= 3; y++) for (int x = 1; x <= 9; x++) filled.Add(new Vector2Int(x, y)); // 왼쪽 열만 빈 4줄
        for (int x = 0; x <= 9; x++) if (x != 7) filled.Add(new Vector2Int(x, 4)); // T 아래 꼭지 자리만 빈 줄
        for (int x = 0; x <= 9; x++) if (x < 6 || x > 8) filled.Add(new Vector2Int(x, 5)); // T 가로 세 칸 자리
        foreach (int x in new[] { 1, 2, 3, 4, 5, 8, 9 }) filled.Add(new Vector2Int(x, 6)); // (8,6)이 T스핀 처마

        var crystals = new List<(TetrominoType, int)>(); // 수정 칸으로 그려지는 조합 (J는 보스 빙결을 피하려고 제외)
        var plain = new List<(TetrominoType, int)>(); // 일반 칸 조합
        foreach (TetrominoType type in Enum.GetValues(typeof(TetrominoType))) // 미노 종류마다
        {
            if (type == TetrominoType.J) continue; // J 제외
            for (int i = 0; i < 4; i++) (MinoUpgrades.IsCrystalCell(type, i) ? crystals : plain).Add((type, i)); // 칸 번호별로 분류
        }

        foreach (Vector2Int cell in filled) // 칸마다 블록 생성
        {
            bool crystal = crystals.Count > 0 && ((cell.y == 6 && (cell.x == 2 || cell.x == 8)) || UnityEngine.Random.value < extraCrystalChance); // 트레일러 강화 장면은 수정 칸을 더 뿌림. 마지막 한 줄 삭제 줄에만 수정 2칸 (많으면 관통 피해가 커져 첫 턴에 보스까지 죽음)
            var (type, index) = crystal ? crystals[UnityEngine.Random.Range(0, crystals.Count)] : plain[UnityEngine.Random.Range(0, plain.Count)]; // 그림 고르기
            PlaceBlock(cell, type, index); // 보드에 블록 놓기
        }
    }

    // 다음 미노들을 정해진 순서로 바꾸고 NEXT 표시 갱신
    private static void SetQueue(params TetrominoType[] order)
    {
        var queue = (Queue<MinoState>)typeof(BagManager).GetField("queue", Any).GetValue(BagManager.Instance); // 가방 큐
        var rest = new List<MinoState>(queue); // 원래 무작위 순서는 뒤에 이어 붙임
        queue.Clear(); // 비우고
        foreach (TetrominoType type in order) queue.Enqueue(new MinoState(type)); // 정한 순서 먼저
        foreach (MinoState mino in rest) queue.Enqueue(mino); // 원래 순서는 그 뒤
        var changed = (Action<MinoState[]>)typeof(BagManager).GetField("OnQueueChanged", Any).GetValue(null); // NEXT 갱신 이벤트
        changed?.Invoke(BagManager.Instance.PeekNext()); // NEXT 표시 갱신
    }

    private static void ApplyRandomUpgrades()
    {
        var types = (TetrominoType[])Enum.GetValues(typeof(TetrominoType)); // 미노 7종
        for (int n = 0; n < UpgradeCount; n++) // 9번
        {
            var open = Array.FindAll(types, t => !MinoUpgrades.IsMaxed(t)); // 최대 단계가 아닌 미노만
            MinoUpgrades.Upgrade(open[UnityEngine.Random.Range(0, open.Length)]); // 보상 화면과 같은 강화 경로
        }
    }

    // 배경음악 끄기 (효과음만 녹음). 씬이 바뀌어 새로 생긴 BGM도 잡도록 10프레임마다 확인
    private static void MuteMusicSources()
    {
        if (Time.frameCount % 10 != 0) return; // 10프레임마다 한 번만
        foreach (MusicVolume music in FindObjectsByType<MusicVolume>(FindObjectsSortMode.None)) music.GetComponent<AudioSource>().mute = true; // BGM(P_GameplayBgm)만 음소거
    }

    // ── 공통 ────────────────────────────────────────────────

    // 하드드롭 직전의 미노를 기억했다가 그 미노가 사라질 때까지 대기 (다음 미노는 같은 프레임에 바로 나오므로 Current 비교로는 못 기다림)
    private static IEnumerator Drop()
    {
        Piece dropped = Current; // 떨어뜨릴 미노
        HardDropMethod.Invoke(PieceSpawner.Instance, null); // 하드드롭
        while (Current == dropped && dropped != null) yield return null; // 고정될 때까지
        yield return Wait(0.12f); // 착지 연출 간격
    }

    // 조작할 미노가 나올 때까지 대기 (카운트다운·정산 연출·Top Out 중에는 미노가 없음. 이미 나와 있으면 바로 진행)
    private static IEnumerator WaitNextPiece()
    {
        while (Current == null) yield return null; // 미노 등장 대기
        yield return Wait(0.2f); // 등장 직후 잠깐
    }

    // 프레임 수로 대기: 녹화 중에는 한 프레임 = 1/60초라 영상 시간과 같고, 보상 화면처럼 게임 시간이 멈춰도 흐름
    private static IEnumerator Wait(float seconds)
    {
        int end = Time.frameCount + Mathf.CeilToInt(seconds * 60f); // 끝 프레임
        while (Time.frameCount < end) yield return null; // 한 프레임씩
    }

    // 장면 확인용 스크린샷 (영상 옆 shots 폴더, 같은 이름은 덮어씀)
    private static void Shot(string name)
    {
        if (Scenario != "Reel") return; // 짧은 클립은 스크린샷 없음
        string folder = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Desktop), "EXTRA", "SoundRef_Video", "shots"); // 바탕화면 EXTRA 작업 폴더
        Directory.CreateDirectory(folder); // 없으면 만듦
        ScreenCapture.CaptureScreenshot(Path.Combine(folder, name + ".png")); // 이번 프레임이 그려진 뒤 저장
    }

    private static HashSet<Vector2Int> Cells(params (int x, int y)[] cells)
    {
        var set = new HashSet<Vector2Int>(); // 목표 칸 집합
        foreach (var (x, y) in cells) set.Add(new Vector2Int(x, y)); // 좌표 추가
        return set; // 반환
    }

    private static void SetField(object target, string name, object value) => target.GetType().GetField(name, Any).SetValue(target, value); // 비공개 필드 설정
    private static void Call(object target, string name) => target.GetType().GetMethod(name, Any).Invoke(target, null); // 비공개 메서드 호출
}
#endif // UNITY_EDITOR
