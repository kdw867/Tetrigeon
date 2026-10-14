# 회전 금지 표식(미노 위 잠금 표시) 개선 — 작업 기록 (VARCO 작업 폴더, Assets 밖, Unity 미적용)

## 1. 요청과 범위 (2026-10-14)
- 사용자: "회전 금지 표식을 만들었는데 적용하니까 잘 안 보여서 VARCO 로 수정해서 눈에 확 띄게, 누가 봐도 잠금인 걸 알 수 있게 표식과 색을 수정해줘" → 이어서 "수정여왕이 스킬 쓸 때 이펙트 표식은 어때 / 그냥 자물쇠는 별로다".
- 제작·미리보기까지. **사용자가 적용을 승인하기 전에는 Unity 에셋·프리팹·코드를 바꾸지 않는다.** 사용자의 미커밋 작업(`RotationLockSeal.cs`, `P_RotationLockSeal.prefab`, `T_Queen_RotationSeal.png`, `PieceView/HoldView/NextView/PieceSpawner/PieceVisuals` 수정)은 그대로 보존.

## 2. 현재 표식이 안 보이는 이유 (실제 Unity 플레이 모드로 확인)
- 사용자 표식 = `Assets/@Resources/Resources/UI/RotationLock/T_Queen_RotationSeal.png`(1254x1254, PPU 4180) → 화면에서 **폭 32.4px**. 내용은 왕관 달린 장식 고리 + 회전 화살표 + 금지 사선, 가는 보라색 선.
- `RotationLockSeal.Update` 가 알파를 0.80±0.12(0.68~0.92)로 계속 흔들어 반투명. 보드·NEXT·Hold 모두 같은 표식 한 개(정렬 20)를 미노 중심에 얹음.
- 화면 중심(스테이지 10 캡처, 1920x1080): Hold (668,458), 조작 중 (947,423), NEXT 1 (1266,579), NEXT 2 (1266,680). 회색 돌 + 보라·청록 반짝임 위에서 가는 보라 선은 거의 안 보임(`output/RotSeal_candidates_in-game_x2.png` 첫 줄).

## 3. VARCO 사용 기록
- 캔버스 `Text to Image 2026-10-01 09:36`(기존 노드 198개) 오른쪽 끝(x 26000~)에 노드 추가: TextInput 2(`30f04535…` 빨강, `5ee139c4…` 금색) → GenerateImage 2(`e9a5567f…`, `d0d0b829…`, gpt-image-2-medium, 1:1, 각 2장), 연결 2개. 실행은 새 노드 2개로만 한정(전체 실행 아님), 4장 × 20크레딧 = **80크레딧**.
- 결과: 굵은 픽셀풍 자물쇠(빨강 몸통·은색 고리, 금색 몸통·은색 고리) 4장, `work/varco_raw/{red_1,red_2,gold_1,gold_2}.png`(1024x1024, 초록 배경, `https://3d.varco.ai/api/objects/<해시>.png`). 사용자가 "그냥 자물쇠는 별로"라고 해서 **채택하지 않음**(보존만).

## 4. 새 방향: 수정여왕 스킬의 룬을 표식으로 (코드로 도트 직접 제작)
- 스킬 룬(`CrystalQueenRotLock_VARCO/tools/fx_rotlock.js`: 화살촉 호 두 개 + 자물쇠, 푸른 보라 팔레트)을 표식용으로 굵게 재작도: `tools/marker_rune.js`. 도트 정확한 제어가 필요해서 VARCO 가 아니라 코드로 그림(VARCO 는 도트 격자 출력 노드가 없고 위 자물쇠 시안은 폐기). 원하면 최종안을 VARCO `EditImage` 로 광택·색만 다듬는 단계를 추가할 수 있음.
- 시안(네이티브 1도트=1px, 게임 2px/도트 = PPU 54): `output/markers/RotSeal_v1_skill_rune_asis_native.png`(21x21, 스킬 룬 그대로 = 가는 선), `..._v2_bold_rune_medal_native.png`(27x27, 굵은 룬 + 어두운 판), `..._v3_bold_rune_noplate_native.png`(27x27, 판 없음) + 각 `_x8.png`.
- 실제 게임 화면 합성(`tools/preview_in_game.js`, 표식을 끈 Unity 캡처 위에 같은 자리·같은 크기로 얹음) → `output/RotSeal_candidates_in-game_x2.png`: 0 현재 / 1 V1 α0.86 / 2 V2 α0.86 / 3 V2 α1.0 / 4 V3 α0.86 (열: Hold · 조작 중 · NEXT 1 · NEXT 2).
- 판단: V1 은 가늘어서 현재와 같은 문제, V3 는 미노 그림과 섞여 복잡, **V2(메달)가 가장 또렷**(어두운 판 위에 밝은 파랑 보라 화살촉 고리 + 흰 자물쇠). 알파는 1.0 에 가까울수록 확실(현재 코드의 0.68~0.92 흔들림은 약함).
- 적용하게 되면(미실행): 새 텍스처 `T_RotationLockSeal_*.png`(Point·비압축·PPU 54)를 추가하고 `P_RotationLockSeal.prefab` 의 스프라이트만 교체, 기존 `T_Queen_RotationSeal.png` 는 삭제하지 않음. 크기가 54px 로 커지므로(O 미노 54px 정사각형과 같음) 가리는 정도 확인 필요. `RotationLockSeal.Update` 알파 범위도 같이 정할 것.

## 5. 정리
- Unity: 플레이 모드로 캡처만 했고 플레이 종료. 에셋·프리팹·씬·코드 변경 없음(표식을 끈 것은 런타임 객체뿐).

## 6. Unity 적용 (2026-10-14, 사용자 "3번으로 하자")
- "3번" 해석: 첫 비교 이미지(`RotSeal_candidates_in-game_x2.png`)의 **3번 줄 = 굵은 룬 메달(V2), 알파 1.0**. (둘째 이미지의 번호는 1 스킬 룬 그대로 / 2 메달 / 3 판 없음이라 겹침 — 추천안과 알파 1.0 줄을 따라 메달로 진행, 판 없음(V3)이 맞다면 `RotSeal_v3_bold_rune_noplate_native.png` 로 한 번에 교체 가능.)
- 도구: `tools/apply_seal_code.js`(코드, CRLF·BOM 유지), `tools/apply_plan_seal.js`(Plan.md, CRLF+BOM 유지), `tools/verify_after.js`(적용 뒤 캡처 확인). 텍스처·프리팹은 Unity MCP `execute_code`(에디터 API).
- **새 텍스처** `Assets/@Resources/Resources/UI/RotationLock/T_RotationLockSeal_RuneMedal.png`(= `output/markers/RotSeal_v2_bold_rune_medal_native.png` 와 바이트 동일, 27x27): Sprite Single, **PPU 54(1도트 = 화면 2px → 54px)**, Point, 비압축, 알파 투명, 밉맵 없음, 피벗 중앙. 코드로 읽어 확인(폭 54.0px).
- **프리팹** `P_RotationLockSeal.prefab`: SpriteRenderer 의 스프라이트만 새 것으로 교체(정렬 20·색 흰색·스케일 1 그대로). 옛 `T_Queen_RotationSeal.png`(+meta)는 **삭제하지 않고 그대로 둠**(이제 아무도 참조하지 않음).
- **코드** `Visuals/RotationLockSeal.cs`(사용자 미커밋 파일): 알파 깜박임(0.80±0.12)을 하던 `Awake`·`Update`·`sealRenderer` 를 제거해 표식이 항상 불투명. 설명 주석 한 줄 갱신. 그 밖의 사용자 변경(`PieceView/HoldView/NextView/PieceSpawner/PieceVisuals`)은 건드리지 않음.
- Plan.md: 표식 설명 한 곳(회전 잠금 항목)을 새 표식·항상 불투명·회전/깜박임 없음으로 고침.
- 검증(플레이 모드, 스테이지 10, 현재 조각·Hold·NEXT 1·2번을 잠금): 표식 4개(조작 중 1 + NEXT 2 + Hold 1), 모두 스프라이트 `T_RotationLockSeal_RuneMedal`·폭 54.0px·색 흰색 알파 1·정렬 20, 잠기지 않은 NEXT 슬롯에는 표식 없음(`.LL..`), 화면 캡처 `output/RotSeal_applied_in-game_x2.png`(위 = 이전, 아래 = 적용 후). 콘솔 오류 0, 경고는 MCP 브리지의 포트 안내 2건뿐(게임과 무관). 컴파일 정상, 플레이 종료, 씬은 시작 전부터 dirty=True 였고 저장하지 않음.
- 알려진 점: 54px 라 O 미노(54x54)는 거의 다 가림, 알파 1.0 이라 Hold·NEXT 의 작은 미노에서도 미노 그림이 많이 가려짐(메달 중심 판이 어두움). 크기·판 투명도 조정이 필요하면 텍스처 PPU(예: 62 → 약 47px)나 판 알파(현재 235/255)로 조절 가능. 직접 손으로 플레이한 확인 안 함.

## 7. 판 없는 안(V3)으로 교체 + 나머지 삭제 (2026-10-14, 사용자 "판 없는걸로 적용 해, 나머지는 유니티에서 삭제하도록")
- 최종 표식 = **V3 굵은 룬, 판 없음**(어두운 윤곽만, 27x27도트 = 54px): 새 텍스처 `Assets/@Resources/Resources/UI/RotationLock/T_RotationLockSeal_Rune.png`(= `output/markers/RotSeal_v3_bold_rune_noplate_native.png` 와 바이트 동일, Sprite Single·PPU 54·Point·비압축, 메달과 같은 설정), 프리팹 `P_RotationLockSeal.prefab` 스프라이트만 교체(정렬 20·색 흰색 알파 1).
- **Unity 에서 삭제**(`manage_asset delete`): `T_Queen_RotationSeal.png`(사용자의 옛 표식)·`T_RotationLockSeal_RuneMedal.png`(방금 만든 메달) 각 +meta. 삭제 전 두 에셋을 아무도 참조하지 않는지 GUID 검색으로 확인, **사본은 `work/removed_from_unity/` 에 보관**(되돌리려면 Assets 폴더로 복사). 코드 실행 도구의 안전 검사가 `MoveAssetToTrash` 를 막아 삭제 전용 도구를 씀. 지금 Unity 폴더에는 프리팹 + 새 텍스처만 남음. (V1·V2·VARCO 자물쇠 4장은 원래 Unity 에 없었고 작업 폴더에 그대로.)
- Plan.md: 표식 설명의 "어두운 판 위" 문구를 "어두운 윤곽, 판 없음"으로 고침.
- 테스트(플레이 모드, 스테이지 10, 실제 경로): 7번째 조각 고정 → 여왕 `QueenRotationLock`(RotLock 모션 트리거) → 다음 조각(원래 0번) 정상, 그다음 NEXT 맨 위 `LL...`; 이어서 잠긴 J 가 조작 중으로 나옴.
  · 이동 따라가기(프레임 처리 뒤 측정): 생성 (3,19) 표식 화면 (946.5, 423.0) → 왼쪽 3칸 (0,19) → 오른쪽 6칸 (6,19) 화면 x 1027.5(기대 946.5+27×3 과 같음) → 아래 8칸 (6,11) 화면 y 639.0(기대 423+27×8 과 같음). 매번 표식-블록 중심 월드 차이 (0.0000, 0.0000), 표식 z회전 0°, 스케일 1.
  · 회전 시도 3종(시계·반시계·180°) 모두 false, 칸·회전상태 변화 없음. 고스트에는 표식 없음.
  · Hold 교환: Hold(J, 잠금) 표식 (668,458), 새 조작 중 I(잠금) 표식 생성(960,410). 하드 드롭 고정 → 조작 중 표식 사라지고 Hold 것만 남음, 다음 미노 T(정상)는 표식 없음. 새 스테이지(StartStage) 뒤 표식 0개·Hold 비어 있음.
  · 표식 스프라이트 `T_RotationLockSeal_Rune`, 알파 1. 스크린샷 `output/RotSeal_noplate_follow_test_x1.png`(1 이동 후, 2 오른쪽, 3 아래+회전 시도, 4 Hold 교환).
- 주의(측정 방법): 한 번의 호출 안에서는 프레임이 지나지 않아, 이동 직후 곧바로 측정하면 이전 위치가 나옴(처음 한 번 그렇게 잘못 읽었다가 한 프레임 뒤 다시 잰 값이 위 값).
