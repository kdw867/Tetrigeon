# 스테이지 현황판 (StageBoardUI_VARCO)

## 요청과 결정 (2026-10-07)
- 요청: 게임보드 오른쪽 빈 패널에 스테이지 현황판 (현재/전체, 1~10 진행도, 몬스터 행: 그림·등급·HP바·DEFEATED). 컨셉(`refs/ref_concept_stage_board.webp`)은 **배치 참고만**, 색감·분위기는 원래 배경과 기존 UI에 맞춤 (사용자 정정)
- 사용자 선택: 제작 "2D 이미지 생성 + 픽셀 정리", UI "Canvas Image + PixelText", 프레임 "배경 테두리 재사용". 이후 사용자가 **"지금 걸로 적용하되 몬스터는 각자의 표시창 중간정렬, 크기도 창에 맞게"** 로 확정
- VARCO: 3D 렌더 노드·투명 PNG 출력 없음(Generate3D는 메시만). **이번 작업에는 VARCO 생성을 쓰지 않음 → 크레딧 0.** 색 일치를 위해 기존 명패에서 파생했고 이 점을 사용자에게 알림 (선택과 다르게 진행한 것)

## 제작
- 측정: 오른쪽 패널 안쪽 FHD x 1440~1880, y 341~1047. 내용 폭 413px(원본 236도트 x 1.75)
- `tools/plate_blank.js`: 기존 `T_MinoUpgrades_Nameplate`(192x33)에서 글자 칸을 줄별 중앙값으로 채워 빈 명패 → `work/plate_blank.png`
- `tools/build_board_art.js` → `parts/layers/`: `T_StageBoard_Plate`(192x33), `Slot`(236x40, 룬 제거, 9분할 24/24/9/8), `Track`(236x76: 연결선 + 5→6 꺾은 선 + 보라 왕관), `Node_Pending|Done|Current`(33x29 육각)
- 숫자 글꼴 색 추가: `HpBarUI_VARCO/tools/digits.js`에 gray/dim/teal (Unity에 gray, dim, teal 에셋 생성)
- `tools/mock_board.js`: 실제 FHD 캡처 위 합성 미리보기 (`preview/StageBoard_Mock_*.png`), `tools/bbox.js`: 몬스터 몸통 범위 측정

## Unity (2026-10-07)
- 에셋 `Assets/@Resources/UI/StageBoard/`: `Layers/` 6장 (PPU 57.14 = 1.75배, Point), `P_StageBoardRow.prefab`, `P_StageBoard.prefab`. 숫자 글꼴 `HpBars/Font/HpDigits_gray|dim|teal`
- 코드: `StageBoardView`(진행도·행 갱신, `CombatManager.OnStateChanged` 구독), `StageBoardRow`(몬스터 그림 창 맞춤·가운데, 등급 글자, HP바, DEFEATED), `PixelText.SetFont`
- 씬: UI > `StageBoardCanvas`(오버레이, 정렬 10) > `StageBoard` (anchoredPosition 1454, -345)
- 몬스터 그림: 살았으면 Idle 첫 프레임, 처치되면 기존 사망 그림. 표시창 104x74(FHD px)에 몸통 범위(측정값)를 가운데로, 비율 유지 최대 배율 (일반 약 2.5, 에픽 약 1.0, 보스 약 0.62)
- [확인] 플레이 모드: 스테이지 1·2·3·4·5·6·9·10 행 수·노드 상태, 피해, 처치(DEFEATED·어둡게·막대 숨김·사망 그림), 소환 부활(DEFEATED 해제), 체력 회복, 스테이지 전환, 콘솔 오류 없음. 캡처 `preview/Unity_StageBoard_10.png`, `_6.png`
- [미확인] 실제 키 입력 플레이, 16:9가 아닌 해상도, 빌드. 보스는 창 높이에 맞춰 작게 표시됨(약 0.62배, 정수 배율이 아니라 도트가 약간 거침)

## 선택된 몬스터 행 청록 테두리 (2026-10-07)
- 요청: 선택(타겟)된 몬스터의 테두리가 청록색으로 빛나게
- 제작: `tools/build_glow.js`가 슬롯 모양(투명 모서리 포함)을 따라 `T_StageBoard_SlotGlow.png`(242x46, 사방 3도트 큼) 생성: 안쪽 2칸 밝은 청록 테두리 + 바깥 3칸 옅어지는 빛. 애니메이션 없음. 크레딧 0
- Unity: `Layers/T_StageBoard_SlotGlow.png`(PPU 57.14, 9분할 27/11/27/12), `P_StageBoardRow`에 `SelectGlow`(Bg 바로 위, 사방 5.25px 큼) 추가. `StageBoardRow.Show(enemy, selected)`, `StageBoardView`가 `enemy == combat.Target`을 넘김
- [확인] 플레이 모드: 스테이지 시작 시 첫 적, TAB 3번으로 오른쪽 이동·맨 왼쪽 순환, 타겟 처치 후 다음 살아있는 적으로 이동, 스테이지 1(적 1마리)도 선택, 콘솔 오류 없음. 캡처 `preview/Unity_StageBoard_Select.png`
