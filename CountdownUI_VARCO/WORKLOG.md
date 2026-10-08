# 카운트다운 3·2·1 작업 기록 (2026-10-08)

상태: **1단계 컨펌 → 사용자 "이대로 구현하고 적용해"(2026-10-08) → 2단계 구현·적용 완료** (맨 아래 "2단계" 절 참고). 커밋 없음.

## 사전 확인 (읽기 전용)
- 읽은 문서: `Tetrigeon/CLAUDE.md`, `Tetrigeon/Plan.md`(런 루프·스테이지 진행·보상·HP바·보드 이펙트), 아트 가이드(밀도 2배 기준, 도트 일관성, Unity 임포트 표준). `AGENTS.md`는 프로젝트에 없음
- 화면: FHD 1920x1080, 보드 안쪽 270x594px(10x22칸, 칸 27px), 중심 (960, 693). 밀도 기준: 몬스터·아이콘 2.00배, 명패 1.75배, 게이지 1.5배
- 흐름(코드 읽기만): 첫 스테이지는 씬 로드 후 `PieceSpawner.Start()`가 `SpawnNext()` 호출. 보상 카드를 고르면 `CombatManager.AdvanceToNextStage()` → `StartStage()` → `PieceSpawner.StartNewStage()` → `SpawnNext()`. 입력 차단은 `PieceSpawner.SetInputEnabled(bool)`(일시정지·보상 화면이 쓰는 기존 경로). 보스 스테이지(10)는 보상 화면 없음
- VARCO 도구: GenerateImage 노드만 사용(nano-banana-2, 16:9). 3D·애니메이션·투명 출력 기능은 쓰지 않음

## 숫자 아트
- 요청 변경: 처음 "노란색" → 곧바로 "청록색으로 하자". **최종은 청록색**
- VARCO 시트 4장 = **80크레딧**(20크레딧 x 4): v1(노란색, 매끈) 2장, v2(석재 느낌 강조) 2장. v2_b 채택(면이 매트하고 돌결 점이 있으며 세 숫자 높이 동일). `generated/digits_v*_*.png`
- 읽기: 시트의 검은 세로선으로 3칸 분리 → 도트 크기 11.5px 격자 위상 추정 → 도트 가운데 5x5 중앙값 → 자홍 배경 제거(`tools/extract_digits.js`). 숫자 높이 51도트(세 숫자 모두), 폭 34/34/30도트
- 정리: 5색 단계로 정리(`tools/build_digits.js`). 색은 **VARCO가 만든 노란 시트의 5단계를 같은 단계의 청록으로 바꾼 것**(크레딧 0, 모양은 VARCO 그대로): 외곽선 #0e3a47, #1d6f82, #2a8ea0, #3ec0d6, 빛 받는 면 #8cecf4 (프로젝트에서 이미 쓰는 청록 단계). 노란색 버전은 `work/yellow/`에 보존
- 캔버스 80x81px 투명(도트 1칸 = 1px). 세로를 홀수로 해서 높이 51 숫자의 가운데가 캔버스 가운데(40, 40.5)에 정확히 놓임. 가로는 경계 상자 가운데와 무게 중심의 평균으로 맞춤(숫자 1은 무게 중심 -0.2도트, 3·2는 +0.5도트 안쪽)
- 표시 크기 초안: 도트 2px(게임 2배 기준) → 캔버스 160x162px, 숫자 높이 102px. 배율 1.4에서 224x227px, 숫자 높이 143px (보드 폭 270px 안). 3px도 가능(배율 1.4에서 숫자 폭 143px)

## 연출 초안 / 합성 미리보기
- 숫자당 0.7초, 전체 2.1초, 처음 0.15초 선명(배율 1.0, 알파 1), 이후 0.55초 동안 배율 1.0→1.4·알파 1→0(직선), 다 사라진 뒤 다음 숫자. 위치 고정, 크기·투명도만 변화. PNG 3장 + 배율·알파 변화로 구현(애니메이션 시트 없음)
- 합성: 플레이 모드에서 오버레이 캔버스를 임시로 카메라 렌더로 바꿔 캡처한 빈 보드 화면(`work/game_screen_empty_board.png`, 저장·씬 변경 없음) 위에, Point 필터와 같은 가장 가까운 점 표본으로 확대·알파 합성(`tools/compose_countdown.js`)
- 산출물(`output/`): `T_Countdown_3|2|1.png`, 비교 이미지(실제 크기 x2·6배 확대), 합성 GIF 2개(보드 실제 크기 280x604, 숫자 부근 2배 560x560, 50fps, 145프레임, 앞 0.3초 빈 보드·뒤 0.5초), 정지 장면 2장, VARCO 원본 시트 사본, 속도·크기 조절 페이지 `Countdown_Preview_composite.html`
- 검증: GIF를 직접 디코딩해 같은 시간의 합성 프레임과 비교 → 최대 색 차이 6, 24 넘게 다른 픽셀 0개(`tools/check_gif.js`). 페이지는 브라우저에서 시간 진행(3→2→1 교체, 배율·불투명도 변화, 반복)과 콘솔 오류 없음 확인(숨김 탭이라 rAF를 대체해 점검)
- 게시: 비공개 아티팩트 https://claude.ai/artifact/QyN2QfJhpeAxzn2fqw3D5G

## 컨펌 대기 / 다음 단계
- 사용자가 속도·크기(숫자당 시간, 선명 유지, 최대 배율, 도트 2px/3px)를 확정하고 "이대로 구현하고 적용해"라고 명시해야 2단계 진행
- 2단계 계획(승인 후): `CountdownManager`(UI 루트 아래 프리팹, GridManager 아래 아님)가 첫 스테이지(`PieceSpawner.Start` 직전)와 `CombatManager.StartStage()` 끝에서 시작. 기존 `PieceSpawner.SetInputEnabled`로 조작·낙하·LOCK을 막고(timeScale 0에 의존하지 않음) 전투·적 행동도 시작 전 대기, 입력은 쌓아두지 않음, 일시정지 연동, 재시작·씬 전환 시 코루틴 취소, 종료 후 정확히 한 번 시작. 수치·규칙 변경 없음. Plan.md는 구현·적용 시 함께 갱신
- [미확인] Unity 안에서의 실제 표시(포인트 필터·픽셀 경계), 키 입력 차단, 일시정지/재시작 연동 — 모두 2단계에서 검증

## 2단계: Unity 구현·적용 (2026-10-08, 사용자 승인 "이대로 구현하고 적용해")
- 값 확정: 숫자당 0.7초, 선명 0.15초, 배율 1.4, 도트 2px (초안 그대로)
- 에셋: `Assets/@Resources/UI/Countdown/` — `T_Countdown_3|2|1.png`(Sprite Single, PPU 50, Point, Uncompressed, Mipmap Off, Clamp, Alpha Is Transparency, Full Rect, 중앙 피벗), `P_Countdown.prefab`(루트 160x162 + 자식 Digit 이미지, raycastTarget 끔)
- 코드: `CountdownView`(UI, 숫자·배율·알파 표시), `CountdownManager`(Managers, [DefaultExecutionOrder(-100)]로 PieceSpawner.Start보다 먼저 첫 스테이지에 카운트다운을 걺, 시작 첫 프레임 시간은 세지 않고 한 프레임 최대 0.1초, 일시정지 중 정지, 진행 중 시작 요청 무시, OnDisable에서 취소), `PieceSpawner.SetCountdownActive`(+SpawnNext 조건 한 줄), `CombatManager.OnStageStarted`(StartStage에서 StartNewStage 직전 알림, 규칙 변화 없음)
- 씬(SampleScene): `UI/CountdownCanvas`(Overlay, 정렬 50, CanvasScaler 1920x1080 match width 0, 레이캐스터 없음) > `Countdown`(프리팹 인스턴스, 위치 (0,-153) = FHD (960,693)), `Managers/CountdownManager`
- [주의] 열려 있던 SampleScene에 저장 안 된 변경이 있었음: `CombatManager.stageNumber`가 디스크·커밋본 10 → 에디터 1(사용자 편집으로 보고 유지, 저장에 같이 들어감) + 매번 새로 만들어지는 보드 배경 텍스처·스프라이트 ID 차이. 내 변경은 위 두 오브젝트뿐
- [확인, 플레이 모드] 시작 직후 조각 없음·'3' 표시, 3→2→1 각 1회, 공식(배율·알파)과 105프레임 전부 일치, 진행 중 조각 존재 0회, 끝난 뒤 조각 정확히 1개(위치 (3,19), 낙하 타이머 0, 고정 유예 처음값), HP·놓은 조각 수 변화 없음 / 보상 카드 선택(PickUpgrade 실제 경로) 후 스테이지 2·보스 스테이지 10에서도 1회 / 카운트다운 중 SpawnNext·SwapHold·StartNewStage·SetInputEnabled(true) 호출해도 조각이 나오지 않음 / 일시정지(실제 PauseMenu.Pause) 중 Update 40번에도 시간 정지, 재개 후 이어짐, 재개가 조각을 내보내지 않음 / Restart 두 번(두 번째는 카운트다운 도중)·타이틀 이동(도중)에서 이전 연출 잔존 없음, 타이틀의 START 경로도 1회 / Begin 중복 호출 무시 / 일시정지 창이 숫자 위에 표시됨 / 콘솔 오류·경고 0
- 실제 렌더: `work/unity_frames/`(보드 105장 + 전체 화면 몇 장), `output/Countdown_Unity_actual_board.gif`(0.02초 간격, 실시간 녹화 아님). 합성 미리보기와 같은 시간끼리 비교: 평균 색 차이 0.64, 최대 52(40 넘는 픽셀 0.17%, 확대 중 도트 경계 반올림 차이)
- 문제와 수정: 첫 프레임 시간이 길어(씬 로딩) 숫자 '3'의 선명 구간이 줄던 것 → 시작 프레임 시간은 세지 않도록 수정. 한 플레이 세션 도중 정적 Instance가 비는 일회성 상태가 있었으나(플레이 재시작 후 같은 순서로 재현 안 됨) 내 코드 경로와 무관한 에디터 세션 문제로 판단
- [미확인] 실제 키보드로 한 조작(키를 누른 채 종료 순간 하드드롭·Hold가 안 나가는지는 코드 구조상 안전 — GetKeyDown은 한 프레임짜리이고 카운트다운 중엔 조각이 없음 — 이지만 실제 키 입력으로는 안 해봄), 16:9가 아닌 해상도, 빌드, 실시간(포커스된 에디터) 재생 체감
