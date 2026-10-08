# 픽셀 이펙트 3종 (PixelFX_VARCO) — 미리보기 단계, Unity 미적용

## 사전 확인 (2026-10-08, 읽기 전용)
- 블록 한 칸 = FHD 27x27px (`GridManager.CellSize = 27/108`), 보드 10x22칸 = 270x594px, 카메라 ortho 5 → 108px/유닛
- 블록 원본 아트는 칸당 약 137px(Upgraded/Crystal) / 16px 시트이고 27px로 줄여 표시 → 화면상 도트 한 알 ≈ 1px. 이펙트도 1 도트 = 1 화면 px(PPU 108)로 제작
- LOCK: `PieceSpawner.Lock()` 한 경로 (자연 낙하는 lockDelay 0.5초 후, 하드드롭은 즉시, 둘 다 `Lock()`). 칸 목록은 `Mino.GetCells()` = 4칸 + 여왕 증식 칸(5칸 이상 가능), 보드 좌표 `boardCell`을 루프에서 알 수 있음. Hold·이동·회전은 Lock을 지나지 않음
- 줄 삭제: `GridManager.ClearLines`가 꽉 찬 줄의 블록을 지우고 같은 호출에서 압축. 지우는 순간의 x,y(압축 전)를 알 수 있음. 수정 칸은 `MinoArtBinding.IsCrystal`인 칸만 `clearedCrystals`에 기록 (여왕 증식 칸·가비지·애벌레·Top Out은 해당 없음). 능력은 `CombatManager.HandlePieceLocked`에서 수정 칸마다 발동

## 제작 결과 (2026-10-08) — 상세는 SPEC.md
- VARCO nano-banana-2 시트 3장 생성 (60크레딧). 수정 파괴는 생성 프레임을 정리해 사용, LOCK·LINE CLEAR는 생성 디자인을 따라 정확한 규격으로 재작성
- 시트: FX_Lock_sheet(216x432), FX_LineClear_sheet(270x310), FX_CrystalBurst_sheet(216x27)
- 미리보기 7개 시나리오 GIF/PNG 완료, Unity 미적용, 사용자 컨펌 대기

## Unity 적용 (2026-10-08, 사용자 승인 "오케이 이대로 적용하자")
- 에셋: `Assets/@Resources/Effects/BoardFX/` — `T_FX_Lock`(8x16 조각, PPU 108), `T_FX_LineClear`(10조각, PPU 108), `T_FX_CrystalBurst`(8조각, PPU 54), `T_FX_BoardMask`(4x4 흰색), 프리팹 `P_FX_Lock`·`P_FX_LineClear`·`P_FX_CrystalBurst` (Point, 비압축, Mipmap Off, Full Rect, 정렬 12, 보드 마스크 안에서만 보임)
- 코드: `BoardEffectFrames`(프레임 재생·자동 정리, 실제 시간), `BoardEffectPlayer`(매니저), `PieceSpawner.OnLockVisual` 연출 전용 알림 추가, `GridManager.ClearLines`에 줄·수정 칸 좌표 기록용 선택 인자 추가 (규칙 변화 없음)
- 씬: `Managers/BoardEffectManager`(+ `BoardMask`), GridManager 아래 아님
- [확인] 플레이 모드: 하드드롭 LOCK 4칸(마스크 맞음), 자연 낙하 고정(알림 1회, 5칸), 여왕 증식 5칸, 여러 줄 삭제(삭제 칸 LOCK 없음, 줄마다 CLEAR), 아랫줄만 삭제(남는 3칸이 압축 후 위치에서 LOCK), 수정 4개(알림에 받은 수와 같음, 압축 전 좌표, 지연 0.06초), 가비지·애벌레 제거·Top Out 줄 제거·보드 초기화·스테이지 시작에는 효과 없음, 연속 알림 중첩, timeScale 0에서도 재생 후 정리, 보드 가장자리 마스크 클리핑 캡처 (`preview/Unity_FX_capture_early|late.png`). 콘솔 오류 없음
- [미확인] 직접 키 입력 플레이로 본 체감, 16:9가 아닌 해상도, 빌드

## LINE CLEAR 파티클 수정안 (2026-10-08) — 미리보기만, Unity 미적용
- 요청: 긴 가로빛이 위에서 내려온 블록과 겹쳐 보이는 문제 → 지워지는 칸에서 작은 파편이 한 번 튀는 방식. LOCK은 유지, 수정 파괴는 대상 아님
- 확인: 프로젝트에 기존 파티클 리소스 없음(URP, Sprite-Unlit-Default·Particles/Unlit 셰이더 있음). 이미 가져온 4x4 흰색 `T_FX_BoardMask.png`를 파티클 텍스처로 재사용 가능 → VARCO 새 제작 없음(크레딧 0)
- 규칙(`tools/particles_sim.js`, Unity ParticleSystem 값과 동일): 수명 0.08~0.14초, 크기 3~5px(한 칸의 11~19%), 속도 110~230px/초(이동 약 0.5~1.2칸), 삭제 순간 1회 방출, 칸당 2개(한 줄)/1개(두 줄 이상), 최대 32개, 색 옅은 백색 30%·밝은 청록 40%·청록 30%, 수정 줄은 수정 칸 제외·나머지 절반·1px 작게, 중력·궤적 없음, 크기가 단계적으로 줄어 사라짐
- 위치: 삭제되는 칸의 압축 전 월드 좌표에서 방출, 월드 공간 시뮬레이션이라 블록 압축·하강을 따라가지 않음. 줄 삭제·압축·피해·가방 정산 타이밍은 바꾸지 않음
- 미리보기(합성, 실제 Unity 영상 아님): `tools/preview_particles.js` → `preview/Particles_S1~S5_actual.gif`(실제 속도), `_slow_x3.gif`(4배 느리게 3배 확대), `Particles_Compare.gif`·`_slow.gif`(이전 대 새 방식), `Particles_contact_x2.png`. 장면: 1줄+블록 하강, 2줄, 4줄, 높은 위치(11번째 줄), 수정 파괴 동시. GIF는 바뀐 부분만 저장(`lib_fx.writeGif` diff), 직접 디코딩해 원본과 비교 검증(`tools/gif_check.js`)
- 페이지: `preview/LineClear_Particles_Preview.html` (GIF 내장, 비공개 아티팩트로 게시)
- 참고: 요청서의 "GridManager 아래에 두어 삭제되지 않도록"은 모순(GridManager 자식은 보드 정리 때 지워짐) → 기존 규칙대로 GridManager 아래에는 두지 않고 BoardEffectManager 아래에 둘 예정
- [미적용] 코드·씬·프리팹 변경 없음, 승인 대기

## 수정 파괴 7색 (2026-10-08, "수정 이펙트는 7개의 색상마다 특색있게") — 미리보기만, Unity 미적용
- 색마다 모양을 다르게: I 청록 관통(바늘 파편+긴 4방향 빛), J 파랑 빙결(눈 결정+얼음 조각), L 주황 치명타(팔방 별빛+주황 파편), O 노랑 방어막(퍼지는 링+금색 판), S 초록 회복(+ 반짝임+잎 파편), T 보라 독(거품 링+보라 파편+자홍 방울), Z 빨강 폭발(폭발 불꽃+붉은 파편+주황 불씨). 파편 4개(+작은 요소), 27x27 8프레임 30fps 0.267초, 2배 표시(54px), 범위 ±9~13도트
- VARCO: nano-banana-2 7장 = 140크레딧 (`generated/burst_<T>_v1.png`, 초록 배경, S만 자홍 배경). 레퍼런스 업로드 없이 글 프롬프트만 사용
- 정리: `tools/extract_burst.js`(칸·도트 격자 추출), `tools/build_burst.js`(색 단계 팔레트로 정리, 파편 4개 중심 정렬, 칸 밖 조각은 통째로 제외, 1~7번 칸 + 빈 프레임), `tools/finish_burst7.js`(통합 시트·검증·GIF). 파편이 4개로 일정해 이번엔 4번 칸도 사용
- 결과: `sheets/FX_CrystalBurst_<T>.png`(216x27), 통합 `sheets/FX_CrystalBurst_7.png`(216x189, 행 = TetrominoType 순서 I J L O S T Z). 검증: 알파 0/255, 색 5~8종, 배경색 잔여 0, 마지막 프레임 비어 있음
- 미리보기: `preview/FX_CrystalBurst_<T>_x8.gif`, `FX_CrystalBurst_7colors(.gif|_slow.gif)`, `Particles_S6_*.gif`(두 줄 삭제 + 7색 동시, `tools/preview_particles.js` 장면 6), 페이지 `preview/CrystalBurst_7Colors_Preview.html`(비공개 아티팩트)
- 적용 시: 통합 시트를 7줄 클립으로, `BoardEffectFrames.Play(clip = (int)TetrominoType)`, `GridManager.ClearLines`/`OnLockVisual`에 지워진 수정 칸의 종류를 칸 좌표와 함께 전달. 기존 보라 단일 효과(`T_FX_CrystalBurst`)는 T 줄로 대체
- [미적용] 코드·씬·프리팹·에셋 변경 없음. LINE CLEAR 파티클 수정안도 승인 대기 중

## Unity 적용 2 — LINE CLEAR 파티클 + 수정 파괴 7색 (2026-10-08, 사용자 승인 "LINE CLEAR 파티클도 적용하고 수정 파괴 이펙트도 적용해줘")
- LINE CLEAR: 긴 가로빛 제거 → `P_FX_ClearParticles`(ParticleSystem 1개, 월드 공간·실제 시간·방출 끔, `M_FX_ClearParticle` = Sprite-Unlit-Default + 흰색 4x4, 정렬 12, 보드 마스크 안에서만 보임). `BoardEffectPlayer`가 시작 때 프리팹에서 한 개를 자기 자식으로 만들고, 삭제마다 파편 값(수명·크기·속도·색·시작 흩어짐)을 정해 `Emit` 한 번씩. 값은 미리보기와 같음(수명 0.08~0.14초, 3~5px, 속도 110~230px/초, 칸당 2/1개, 최대 32개, 수정 줄 절반·수정 칸 제외). 크기 감소는 계단식 곡선(1 → 0.75 → 0.5, 60%·85% 지점) — 미리보기의 "한 도트씩 감소"를 배율로 근사한 값
- 삭제한 옛 에셋: `P_FX_LineClear.prefab`, `T_FX_LineClear.png`(+meta) → 백업 복사본은 사용자 요청으로 삭제함(2026-10-08). 코드의 `clearPrefab` 필드와 씬 연결도 제거. 원본 시트는 `sheets/FX_LineClear_sheet.png`에 그대로 있음
- 수정 파괴 7색: `T_FX_CrystalBurst.png`를 `sheets/FX_CrystalBurst_7.png`(216x189)로 교체(기존 보라 8프레임 시트의 백업은 사용자 요청으로 삭제함, 제작 원본은 `sheets/FX_CrystalBurst_sheet.png`), 스프라이트 56개 `FX_CrystalBurst_<I|J|L|O|S|T|Z>_<0~7>`, 프리팹 frames 56개로 다시 연결(framesPerClip 8, 30fps). `PieceSpawner.OnLockVisual`에 네 번째 인자(지워진 수정 칸의 원본 종류, `OnPieceLocked`가 받는 목록과 같은 것)를 더했고, `BoardEffectPlayer`가 `(int)종류`를 클립 번호로 넘김
- 규칙 변화 없음: 능력 처리용 목록·줄 삭제 판정·피해·타이밍·낙하 속도·LOCK 지연은 그대로
- [확인] 플레이 모드(프레임 수동 진행): 한 줄 삭제 파편 20개(10칸x2, 위치 오차 최대 8.7px ≤ 9px, 수명 0.081~0.138초, 크기 3~5px, 색 3종), 두 줄 삭제+수정 7종 동시(수정 효과 7개 모두 종류별 클립·압축 전 칸 좌표·지연 0.06초 일치, 수정 줄 파편 절반, 남는 칸 LOCK 유지), 캡처 `preview/Unity_ClearParticles_capture.png`·`Unity_CrystalBurst7_capture.png`, timeScale 0에서 파편 20→14→0(7프레임) 후 정리, 마스크 안에서만 그려짐, 씬 저장 후 다시 읽어 연결 4개 확인, 옛 가로빛 GUID 참조 0, 콘솔 오류·경고 0
- [미확인] 직접 키 입력 플레이로 본 체감, 16:9가 아닌 해상도, 빌드
- 테스트 중 겪은 것: 정리 코드가 `BoardMask` 자식까지 지워 효과가 안 보였던 테스트 실수(플레이 모드 한정, 씬 영향 없음 → 플레이를 다시 시작해 재검증), 테스트가 윗줄까지 쌓아 Top Out이 걸린 것(테스트 상태)
