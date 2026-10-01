# Pause UI — VARCO 작업 기록

기준 문서: `Plan.md`, `Tetrigeon_Pixel_Art_Guide_EN.md`
Unity 적용: **하지 않음** (승인 전까지 이 폴더 안에서만 작업)

## 현재 Unity UI 실측 (PauseCanvas, 1920×1080 ScaleWithScreenSize, 읽기만 함)
| 요소 | 화면 크기 | 1.75× 기준 원본 px(참고) |
| --- | --- | --- |
| PauseRoot / OptionRoot 패널 | 560×460 / 560×420 | 320×263 / 320×240 |
| SoundRoot 패널 | 680×420 | 389×240 |
| SensitivityRoot 패널 | 1000×480 | 571×274 |
| 버튼 (RESUME 등) | 360×76 | 206×43 |
| 감도 BACK 버튼 | 300×64 | 171×37 |
| 사운드 슬라이더 | 420×36 | 240×21 |
| 감도 슬라이더 | 520×26 | 297×15 |
| MS / F 입력칸 | 130×56 / 90×56 | 74×32 / 51×32 |

슬라이더에는 현재 Handle 오브젝트가 없음 (Background + Fill만).

## 레퍼런스 (refs/)
- `ref_MinoUpgrades_Nameplate.png` — 원본 그대로 업로드, MD5 일치 확인
- `ref_TurnRune_Frame.png` — 원본 그대로 업로드, MD5 일치 확인

## 1차 생성 (2026-10-01, nano-banana-2, 20cr×4)
VARCO 워크플로우 `Text to Image 2026-10-01 09:36` — 예시(고양이) 노드 삭제 후 구성.
- A: PAUSE 창 시안 (4:3, 2장) → `generated/A_PauseWindow_01.png`, `_02.png`
- B: 슬라이더 게이지 시안 (16:9, 2장) → `generated/B_SliderGauge_01.png`, `_02.png`

검증 결과:
- [확인] 철자 PAUSE / RESUME / OPTION / RESTART 정확 (A 2장 모두)
- [확인] 실제 픽셀아트 아님 — 색 16k~64k개, 확대 시 경계 블러 (`generated/inspect/`)
- [확인] 배경 불투명 RGB, 알파 없음
- [미검증] 게임 내 실제 크기 도트 밀도 — 후처리(그리드 스냅·팔레트 축소·리사이즈) 전

## 2차: A_01 + B_01 후처리 (사용자 선택, 글자는 그림에 포함하는 방식)
배율: 시안 RESUME 버튼 높이 121px → 기존 MINO UPGRADES 명패 높이 33px (÷3.667, 면적 평균) 후 공용 32색 k-means.
글자/명패 높이 비율이 기존 명패와 같아(약 1/3) 표시 1.75×에서 도트 밀도 일치.
스크립트: `tools/step1_downscale.js` → `tools/step2_parts.js` → `tools/step3_preview.js` (node, 외부 의존성 없음)

| 파츠 (parts/) | 원본 px | 1.75× 화면 px | 현재 Unity 크기 |
| --- | --- | --- | --- |
| T_Panel_Blank | 263×190 | 460×333 | PauseRoot 560×460 |
| T_Title_PAUSE | 143×42 | 250×74 | Text 520×70 |
| T_Btn_RESUME / OPTION / RESTART | 122×33 / 121×33 / 120×33 | 약 213×58 | 360×76 |
| T_Slider_Track | 331×47 | 579×82 | 사운드 420×36, 감도 520×26 |
| T_Slider_Fill | 199×23 | 348×40 | — |
| T_Slider_Handle | 39×41 | 68×72 | (현재 없음) |

- 빈 패널: 버튼 자리는 안쪽 최빈 남색, 제목판 자리 위 테두리는 이음매 없는 열(x=81) 복사로 복원.
- 제목판: 양 끝에 붙은 패널 테두리 조각 제거.
- 미리보기: `preview/Pause_x4.png`, `preview/Slider_x4.png`, `preview/InGame_1.75x.png`(실제 화면 위 합성)
- [확인] 투명 배경 RGBA, 파츠당 17~28색, 명패와 글자 크기 일치(합성 화면 육안)
- [미확인] Unity 임포트/9-slice/실제 씬 표시 — 승인 전 적용 안 함
- [남은 문제] 슬라이더가 현재 칸보다 두꺼움(82 vs 36/26), 버튼이 현재보다 작음(213×58 vs 360×76)

## 3차 준비 (2026-10-01, 사용자 결정)
- 슬라이더: 82px(1.75×) 그대로 사용, Unity 적용 시 슬라이더 칸을 키움
- 버튼·패널: 명패와 같은 밀도 크기로 축소 (버튼 약 213×58)
- 남은 글자 파츠: VARCO 생성, 작은 라벨도 그림으로
- 범위: 이 폴더 미리보기까지만. Unity 적용은 미리보기 승인 후

### 필요한 파츠 (현재 PauseCanvas 기준)
| 구분 | 내용 |
| --- | --- |
| 제목판 | OPTION, SOUND, SENSITIVITY (PAUSE는 2차에 있음) |
| 버튼 | SENSITIVITY, SOUND, BACK (RESUME/OPTION/RESTART는 2차에 있음) |
| 큰 라벨 (현재 28~34pt) | MUSIC, SFX, ARR, DAS, DCD, SDF |
| 작은 라벨 (현재 16~24pt) | SLOW, FAST, MS, F |
| 입력칸 | MS/F 숫자 입력칸 틀 (숫자는 텍스트 유지) |
| 패널 | Sound 680×420, Sensitivity 1000×480 → T_Panel_Blank 9-slice로 대응 (생성 안 함) |

숫자(입력값, SDF 현재값)는 동적이라 텍스트로 둔다.

### 생성 계획 (nano-banana-2, 노드 2개 × 2장 = 약 80cr)
레퍼런스: 1차 A_01(`/api/objects/e9801b0d1e5eb824bb4aaddb7cb19cf2.png`, 서버에 이미 있음) + MINO UPGRADES 명패(`8b11f0c5…`)

**C: 제목판·버튼 시트 (16:9)**
> Create an image for Tetrigeon, a 2D pixel art game, using the attached approved assets as references. The theme is a dark crystal cave and ancient stone magical ruins. Use cool gray stone, purple crystals, and turquoise magical energy. Preserve large pixel clusters, a limited palette, stepped contours, and squarish shapes with slightly rounded corners. Match the perceived pixel density of the attached pause window exactly. Prioritize simple shapes readable at the actual small in-game display size.
>
> Target: a UI component sheet of stone nameplates. On a plain flat solid dark navy background, show six separate plaques with clear empty space between them, in two columns. Left column: three small horizontal stone title plaques with the exact texts "OPTION", "SOUND", "SENSITIVITY", each styled exactly like the PAUSE title plaque in the attached pause window. Right column: three identical horizontal stone buttons with the exact texts "SENSITIVITY", "SOUND", "BACK", each styled exactly like the RESUME button in the attached pause window, with the same height, border thickness, lettering size, and pixel size. Plaque width fits the text with the same side margins and short turquoise rune accents on both sides. Front view, flat 2D game UI.
>
> Negative: no antialiasing, blur, smooth gradients, high-resolution microtextures, photographic materials, glossy 3D rendering, excessive glow, arbitrary cyan dots or particles, intricate ornaments, mixed pixel sizes, perspective tilt, checkerboard background, watermark, or any text other than OPTION, SOUND, SENSITIVITY, BACK.

**D: 라벨·입력칸 시트 (16:9)**
> (공통 앞부분 동일)
>
> Target: a UI lettering sheet for a settings menu. On a plain flat solid dark navy background, show separate words with clear empty space between them, as light-colored chunky pixel lettering with a one-pixel dark outline and no plaque behind them. Large words, with the same letter height and pixel size as the RESUME button lettering in the attached pause window: "MUSIC", "SFX", "ARR", "DAS", "DCD", "SDF". Small words, about half that letter height but the same pixel size: "SLOW", "FAST", "MS", "F". Also one small empty recessed stone input box, wider than tall, with a gray stone border and a dark navy inside, no text in it. Front view, flat 2D game UI.
>
> Negative: (C와 동일, 허용 글자만 MUSIC, SFX, ARR, DAS, DCD, SDF, SLOW, FAST, MS, F로 교체)

후처리는 2차와 같은 배율(÷3.667)·팔레트로 맞춘다. 작은 라벨이 축소 후 뭉개지면 글자 영역만 보정한다 (가이드 §14).

## 3차 결과 (2026-10-01, 총 200cr = 20cr × 10장)
| 생성 | 내용 | 사용 여부 |
| --- | --- | --- |
| C_01/02 (16:9) | 제목판·버튼 시트 | 미사용 — 버튼도 제목판 크기로 나옴, C_01은 버튼 글자가 청록, C_02는 수정·이끼 |
| D_01/02 (16:9) | 라벨 시트 | D_02 사용 (D_01은 MS 누락) |
| E_01/02 (4:3) | A_01 형제 구도 OPTION 창 | E_02 사용 (A_01과 좌표 동일) |
| F_01/02 (16:9) | MS/F 입력칸 + SLOW/FAST | F_01 입력칸만 사용 (F_02는 거의 같고 칸이 더 작음, SLOW/FAST는 둘 다 크게 나옴) |
| G_01/02 (4:3) | 수정·이끼 없는 SOUND/SENSITIVITY 제목판 | G_01 사용 (G_02는 패널 테두리가 붙음) |

스크립트: `tools/step4_round3.js`(파츠) → `tools/step5_preview_round3.js`(미리보기)
- 팔레트: 2차 파츠 8개의 31색에 가장 가까운 색으로 매핑 (시트 단독 k-means는 청록 룬이 회색으로 뭉개져 폐기)
- 배경 판정: 팔레트 적용 전 축소본에서 모서리 배경색과 거의 같은 픽셀만 (돌 홈이 남색으로 매핑돼 안쪽까지 지워지던 문제 수정)
- E_02 버튼·제목판: 2차 RESUME/OPTION/RESTART/PAUSE 알파를 틀로 같은 좌표에서 추출

| 파츠 | 출처 / 배율 | 크기 |
| --- | --- | --- |
| T_Title_OPTION | E_02 ÷3.667 (PAUSE 틀) | 143×42 |
| T_Btn_SENSITIVITY / SOUND / BACK | E_02 ÷3.667 (버튼 틀) | 122/121/120×33 |
| T_Title_SOUND / SENSITIVITY | G_01 ÷3.667 | 149×43 / 217×47 |
| T_Label_MUSIC SFX ARR DAS DCD SDF | D_02 ÷8.5 | 높이 16 (글자 13~14, RESUME 글자와 같음) |
| T_Label_SLOW / FAST | D_02 ÷8.5 | 33×11 / 31×10 |
| T_Input_MS / T_Input_F | F_01 ÷9.1 (단위 글자 포함) | 66×23 / 57×23 |

미리보기 (`preview/`): `Option_x3`, `Sound_x3`, `Sensitivity_x3`, `InGame_*_1.75x`
- SOUND 창 420×280 → 화면 735×490, SENSITIVITY 창 600×390 → 화면 1050×683 (슬라이더 82px 유지 결정에 맞춰 기존 680×420, 1000×480보다 커짐)
- 패널은 T_Panel_Blank 9-slice(모서리 62px, Sliced) 흉내
- 숫자(33 MS 등)는 자리 표시용 임시 도트 숫자. 실제는 Unity 텍스트
- [남은 문제] SENSITIVITY 버튼 글자가 다른 버튼보다 작음(긴 단어), SENSITIVITY 제목판이 PAUSE보다 5px 높음, 늘린 패널 왼쪽 아래 금이 약간 늘어나 보임
- [미확인] Unity 임포트·9-slice·실제 씬 표시 — 승인 전 적용 안 함

## Unity 적용 (2026-10-01, 사용자 승인 후)
- 에셋: `Assets/@Resources/UI/PauseMenu/` 24개 (parts와 MD5 동일). Sprite Single, Point, 압축 없음, 밉맵 없음, Clamp, FullRect, PPU 57.142857(=100/1.75, 캔버스 기준 PPU 100에서 Native Size가 1.75배)
  - T_Panel_Blank 9-slice 62px, T_Slider_Fill 좌우 5px
- SampleScene PauseCanvas: 패널 4개(PAUSE/OPTION Simple 460×333, SOUND Sliced 735×490, SENSITIVITY Sliced 1050×683), 제목·라벨 Text를 같은 오브젝트에서 Image로 교체, 버튼 스프라이트 + Label 비활성, 슬라이더 트랙/채움(Sliced) + 손잡이(Handle Slide Area/Handle 새로 추가, targetGraphic=Handle), Value_SDF·숫자 색 크림색
- P_SensitivityNumber.prefab 원본: T_Input_MS, 흰색, 115.5×40.25, 숫자 오른쪽 정렬·크림색, Unit 비활성. F 인스턴스 3개만 T_Input_F·크기·숫자 영역 오버라이드
  - 처음엔 씬에서 직접 바꿨다가 스프라이트 참조가 프리팹 오버라이드로 기록되지 않아 null이 됨 → 원본 수정 + 오버라이드 정식 기록으로 수정
- 확인: Play 모드에서 4개 창 렌더 캡처, 스프라이트 null 0개, 슬라이더 값→채움·손잡이·숫자 갱신, OPTION→SOUND→BACK→BACK→RESUME 버튼 흐름, 콘솔 에러 없음
- 씬 저장 시 PauseCanvas 밖 변경은 BoardBackground 임베드 스프라이트 교체(기존에 알던 현상)뿐
