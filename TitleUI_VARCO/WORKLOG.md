# Title UI — VARCO 작업 기록

기준 문서: `Plan.md`, `Tetrigeon_Pixel_Art_Guide_EN.md`
Unity 적용: **하지 않음** (승인 전까지 이 폴더 안에서만 작업)

## 결정 (2026-10-02)
- 로고: 강화 미노 기믹 추가로 디자인 갱신 예정이라 보류 (`tools/mino_logo.js` 시안은 그대로 둠)
- 배경: 레이어 분리 (동굴 배경 / 레미 / 센티넬 / 크리스탈 퀸 / 떨어지는 미노)
- 버튼: 타이틀 전용 큰 석판 START / OPTION / EXIT
- 마우스 올림: 테두리가 밝은 청록으로 빛남 — 타이틀 버튼만. 가이드상 흐린 발광 금지라 테두리 도트만 청록으로 바꾼 별도 그림(코드로 생성)으로 처리
- 기존 에셋은 완성본에 쓰지 않고, 레미·몬스터 디자인을 맞추기 위한 레퍼런스로만 사용

## 도트 밀도 계획
- 화면 1920×1080, 원본 640×360 기준 3배(정수) 표시. 게임 화면에서 레미가 약 3배로 보여 이에 맞춤
- 목표 원본 크기: 레미 약 70px, 센티넬 약 100px, 퀸 약 150px, 미노 블록 16px

## 레퍼런스 업로드 (`refs/u_*.png`, 인덱스 PNG, MD5 = 서버 키 일치 확인)
| 파일 | 내용 | 서버 키 |
| --- | --- | --- |
| u_Lemy.png | Golem1.png 1/8 축소 16색 ×2 | 53e00e99cd78f6b9de7f2f143fdcea0c |
| u_Sentinel.png | 센티넬 Idle 0프레임 ×3 | 55dc0250a8bde77b35d2375e977bc19c |
| u_Queen.png | 퀸 Idle 0프레임 ×2 | b2f04678edafadffe74c5fe171d3a6b7 |
| u_Minos.png | 미노 블록 7종 ×4 | 3a2a539ff0d30bd4488bc4f15b5bddba |
| u_Cave.png | 게임 화면 동굴 띠 1/8 16색 ×2 | 78003d3193b964a278c69ee2defc2781 |
| (기존) A_PauseWindow_01 | 버튼 석판 스타일 | e9801b0d1e5eb824bb4aaddb7cb19cf2 |

## 1차 생성 (nano-banana-2)
배경 16:9 ×2, 레미 1:1 ×2, 센티넬 1:1 ×1, 퀸 3:4 ×1, 미노 16:9 ×1, 버튼 4:3 ×2 = 9장 (약 180cr)
캐릭터·미노는 흰 단색 배경, 버튼은 남색 단색 배경으로 생성 후 테두리 연결 배경만 제거 예정

## 1차 결과
| 생성 | 사용 | 메모 |
| --- | --- | --- |
| BG_01 / BG_02 | BG_01 | 룬 아치 + 청록 포털, 가운데 비어 있음. BG_02는 바닥이 밋밋한 띠 |
| Lemy_01 / Lemy_02 | Lemy_01 | 원 디자인 유지, 오른쪽으로 점프 펀치, 왼쪽 가슴 코어 |
| Sentinel_01 | 사용 | 수정 덩어리 오른쪽·돌 주먹 왼쪽·청록 코어 유지 |
| Queen_01 | 사용 | 레퍼런스 수정 배치 거의 그대로 |
| Minos_01 | 블록만 | S·Z·L 모양이 틀려 색별 블록 1개씩 잘라 코드로 정확히 조립 |
| Buttons_01 / 02 | Buttons_02 | 양 끝 룬 블록이 있는 넓은 석판. EXIT 판만 모양이 달라 START 틀에 글자를 옮겨 3개 통일 |
| SentinelEdit_01 / QueenEdit_01 (EditImage, 40cr) | 미사용 | 도트 크기 오판으로 추가 생성. 센티넬은 수정 덩어리가 사라짐, 퀸은 기존 스프라이트 원본 |
총 11장 = 약 220cr

### 실제 도트 격자 (tools/grid.js, runs.js로 측정)
- BG 약 5.7px → 240×135, 화면 8배
- Lemy 10.25px → 90px인데 몬스터보다 커져서 2칸→1칸으로 46px, 화면 4배 (184px)
- Sentinel 12.5px → 82×75 (화면 300px), Queen 10px → 84×120 (화면 480px)
- 레미 : 센티넬 : 퀸 키 = 46 : 75 : 120 ≈ 게임 속 비율(1 : 1.55 : 2.7)
- 미노 블록 16px, 버튼 111×27 (도트 2칸→1칸), 모두 화면 4배

### 파츠 (`parts/`, `tools/title_layers.js`)
T_Title_BG, T_Title_Lemy, T_Title_Sentinel, T_Title_Queen, T_Title_Mino_{I,O,T,S,Z,J,L}, T_Title_Btn_{START,OPTION,EXIT}(+_Hover)
- 배경 제거: 테두리와 이어진 순백(≥232)만 → 밝은 하이라이트 보존. (pix.floodClear는 테두리에 닿은 피사체 색까지 기준으로 써서 미노 하이라이트가 지워졌음)
- 버튼 마우스 올림: 바깥 외곽선 1줄 밝은 청록(120,248,236) + 그 밖 1줄 짙은 청록(34,167,168). 평상시 그림도 같은 크기(1px 여백)라 Sprite Swap으로 교체 가능
- 미리보기: `preview/Title_Layers_FHD.png` (`tools/title_preview.js`)
- [미확인] Unity 임포트/씬 구성/애니메이션 — 승인 전 적용 안 함
- [남은 문제] 레미는 2칸→1칸 축소라 몬스터보다 조금 흐림, 미노 룬이 16px에서 흐릿함, 버튼 글자 약 7px

## 2026-10-02 수정
- 타이틀 구성에서만 떨어지는 미노를 뺌 (`tools/title_preview.js`), 나중에 추가 예정. 미노 비주얼 업데이트 예정. 그 외 파일·게임은 변경 없음

## Unity 적용 (2026-10-02, "이 구성으로 부탁해" 승인 후)
- 에셋: `Assets/@Resources/UI/Title/` 10개 (BG, Lemy, Sentinel, Queen, Btn START/OPTION/EXIT + _Hover). parts와 MD5 동일. Point·압축 없음·밉맵 없음, PPU 배경 12.5(8배)·나머지 25(4배), 미노는 넣지 않음
- 설정 창 공유: PauseMenu에서 설정 창 로직을 `OptionMenu.cs`로 분리 → `Assets/@Resources/UI/P_OptionMenu.prefab` (OptionRoot/SoundRoot/SensitivityRoot). 닫힐 때 `OnClosed` 이벤트로 연 쪽(일시정지/타이틀)이 복귀
  - SampleScene PauseCanvas: OptionMenu 프리팹 인스턴스, 버튼 연결을 OptionMenu로 교체, PauseMenu.optionMenu 연결
- `TitleMenu.cs`: START → 빌드 1번 씬, OPTION → 설정 창, EXIT → Application.Quit (빌드에서만)
- `Assets/Scenes/TitleScene.unity`: Main Camera / UI(EventSystem, TitleCanvas 1920×1080 ScaleWithScreenSize). 버튼은 Sprite Swap(마우스 올림·누름 = _Hover)
- Build Settings: 0 TitleScene, 1 SampleScene
- 확인(Play): START 마우스 올림 시 _Hover 표시, OPTION→SOUND→BACK→BACK 복귀, START → SampleScene 로드(매니저 정상), SampleScene 일시정지 메뉴(설정·감도·슬라이더·재개) 기존과 동일, 콘솔 에러 없음
- 캡처: `preview/Unity_Title_Hover.png`, `preview/Unity_Title_Option.png`

## 고해상도 2차 (2026-10-02, "해상도가 너무 떨어진다 — 최소 게임 화면과 동일, 그 이상도")
목표: 도트 느낌 유지, 모든 레이어 도트 1칸 = 화면 2px (게임 몬스터와 같은 밀도)
| 시도 | 결과 |
| --- | --- |
| EditImage로 BG_01·Sentinel_01·Queen_01 "도트 2~4배 세밀하게" (pro/2, 60cr) | 실패: 원본과 같은 도트 크기로 거의 그대로 재현 |
| BG·Sentinel 새로 생성, 모델 비교 (pro / gpt-image-2-medium, 80cr) | pro는 레퍼런스를 거의 복사(도트 그대로). **gpt-image-2-medium은 도트 3~5px로 훨씬 세밀** |
| Queen gpt-image-2-medium ×2 (40cr) | Queen_Gpt_01 사용 (02는 아래쪽이 거침) |
원인 추정: 1차 레퍼런스를 업로드 용량 때문에 축소 후 2~3배 확대해 올려서, 모델이 그 큰 도트를 따라 그림
이번 라운드 약 180cr (누적 약 400cr)

### 파츠 (모두 화면 2배)
- T_Title_BG 960×540 (BG_Gpt_01, 48색) — 1920×1080
- T_Title_Sentinel 165×150 (Sentinel_Gpt_01) — 화면 330×300
- T_Title_Queen 160×240 (Queen_Gpt_01) — 화면 320×480
- T_Title_Lemy 90×92 (Lemy_01을 2칸→1칸 축소 없이) — 화면 180×184
- T_Title_Btn_* 221×54 (Buttons_02 생성 격자 그대로) — 화면 442×108, 마우스 올림 테두리 2도트+2도트
- 미리보기: `preview/Title_Layers_FHD.png`
- [미적용] Unity 교체는 미리보기 승인 후 (같은 파일명으로 덮어써 GUID 유지, PPU 50으로 변경 예정)

### 레미 재생성 (2026-10-02, "레미도 다시 그리고 확인하고 승인하면 적용")
- gpt-image-2-medium 1:1 ×2 (40cr, 누적 약 440cr). 레퍼런스: Lemy_01(포즈) + u_Lemy(게임 디자인). 결과 Lemy_Gpt_01 / 02 둘 다 Lemy_01 포즈·디자인 유지, 도트 약 5~7px
- 사용: Lemy_Gpt_01 (외곽선·주먹이 더 또렷함). 02는 대안 — 비교 `preview/Lemy_Gpt_Compare.png` (왼쪽 01, 오른쪽 02)
- T_Title_Lemy 88×92 (키 92도트, 32색) — 화면 176×184. 배치 위치는 그대로
- 미리보기 `preview/Title_Layers_FHD.png` 갱신

## Unity 적용 — 고해상도 (2026-10-02, "승인 1번으로 적용해줘")
- `Assets/@Resources/UI/Title/` 10개를 parts로 덮어씀 (MD5 일치, .meta 유지 → GUID 그대로). 레미는 Lemy_Gpt_01
- 임포트: PPU 모두 50 (화면 2배), Point·압축 없음·밉맵 없음, 최대 크기 2048
- TitleScene: SetNativeSize + 위치 — Background (0,0) 1920×1080 / Queen (770,-154) 320×480 / Sentinel (485,-244) 330×300 / Lemy (-572,-208) 176×184 / 버튼 442×108 (0,-34)(0,-154)(0,-274)
- 실수 후 복구: 이름 "Background"로 찾아서 설정 창 슬라이더 6개의 Background까지 크기가 바뀜 → 프리팹 변경 되돌리기로 원복 (가득 채움, 0×0), 인스턴스에 남은 임의 변경 없음 확인
- 확인: 사용자가 Play에서 적용 확인, 콘솔 에러·경고 없음

## 타이틀 OPTION 창 확대 (2026-10-02, "타이틀 화면에서만 OPTION 창의 크기를 더 키워보자")
- TitleScene의 OptionMenu 인스턴스에서 OptionRoot만 localScale 1.714 (= 3 / 1.75, 도트 1칸 화면 3px) → 460×333이 화면 789×570
- 프리팹 원본(P_OptionMenu)은 그대로 → 일시정지 메뉴 설정 창은 변화 없음. SOUND / SENSITIVITY 창은 그대로
- 확인(Play): `preview/Unity_Title_Option_Big.png`. 오른쪽 아래 모서리가 센티넬 왼팔 위에 조금 겹침

## 로고 (2026-10-06, "일반 미노, 강화 미노, 수정 미노를 사용해서 만들어줘" → "varco로 해줘", 수정은 확정본으로)
- 코드 시안(`tools/tier_logo.js`, 게임 칸 그림으로 글자 채움)은 만들었지만 VARCO로 하라는 요청에 따라 보여 주지 않음
- 레퍼런스 업로드 (MD5 = 서버 키 확인)
| 파일 | 내용 | 서버 키 |
| --- | --- | --- |
| refs/u_NormalPieces.png | 현재 게임 일반 미노 7종 조각 그대로, 40색 (`tools/logo_refs_pieces.js`) | 638257860760b7740974f4c8080fb1d4 |
| (MinoCrystal) u_UpgradedCells | 강화 칸 7종 | 866164c50b205cf0555a613cc3088b47 |
| refs/u_CrystalCells.png | 확정 수정 칸 7종 ×4 (`tools/logo_refs.js`) | 61832fc3244797286e6bf49631ccea57 |
- gpt-image-2-medium 16:9 ×2 (40cr, 타이틀 누적 약 480cr). 한 줄 TETRIGEON, 돌 약 절반 / 강화 약 1/4 / 수정 약 1/4, 어두운 외곽선 + 그림자
| 생성 | 결과 |
| --- | --- |
| Logo_Gpt_01 | 사용: 철자 정확, 글자 모양·블록 크기 고름, 7색 수정 고루 |
| Logo_Gpt_02 | 미사용: R 모양이 깨짐 |
- 후처리 `tools/logo_build.js` → `parts/T_Title_Logo.png` 786×133 (블록 하나 = 25도트, 게임 칸과 같음), 화면 2배 = 1572×266
  - 흰 바탕 제거: 300px 넘는 흰 영역 + 둘레 절반 이상이 어두운 외곽선인 흰 영역(O·R 구멍) + 중립색·길쭉한 100px 넘는 흰 틈(G 안쪽). 돌 하이라이트·이음선 흰 심·수정 반짝임은 보존
  - 블록 간격 47px → 25도트로 축소, 64색
  - 수정 블록 22개를 찾아(채도 높은 면, 채움 비율 0.6 이상, 색조는 축소 전 원본에서) 확정 수정 블록(MinoCrystal_VARCO lesswhite, 외곽선 안쪽)으로 교체. 생성본 수정은 비슷하지만 뭉개져 있어 확정본으로 바꿈
  - 처음엔 R의 주황 균열 돌이 빨강 수정으로 오인됨(채움 비율 0.20) → 채움 비율 조건으로 해결
- 미리보기 `preview/Title_Logo_FHD.png`: 화면 위쪽 가운데 (174, 50), 아치 꼭대기와 안 겹침
- G 반쪽 초록 고침 (2026-10-06): 생성본 G는 오른쪽 기둥 마지막 돌(484~505, 80~102)이 아래 줄(98~120)까지 내려와 초록이 14도트로 끼어 있었음
  - 1차(모서리 깎고 위 돌을 초록 수정으로)는 사용자 답 "없애지 말고 그냥 하나짜리로 만들어"로 폐기
  - 최종: 그 자리에 온전한 한 칸 초록 수정(478~501, 100~122, 24×23)을 넣음. 위 기둥 돌은 세로 23→19도트로 줄이고(아래 5줄에 걸친 초록은 같은 줄 돌 픽셀로 덮은 뒤), 새 초록은 2도트 내려 왼쪽 아래 돌과 밑변을 맞춤. 블록 사이 틈은 (9,12,19), 오른쪽 외곽선 띠는 (21,28,39). `logo_build.js` 4-1 단계
- [미적용] Unity — 승인 전 적용 안 함

### 로고 다시 만들기 — 격자 맞춤 (2026-10-06, "다시 새로 만들어줘 뭔가 안맞는다 / 크기를 동일하게 배치도 삐뚤빼뚤하지 않게")
- 위 Logo_Gpt_01 결과(`tools/logo_build.js`)는 대체됨. `parts/T_Title_Logo.png`는 아래 결과로 덮어씀
- gpt-image-2-medium 16:9 ×2 (40cr, 타이틀 누적 약 520cr). 같은 레퍼런스 3개 + 엄격한 격자 지시(모든 글자 5칸 높이·3칸 폭(N 4칸), 같은 크기 정사각 블록만, 반쪽·어긋난 블록 금지, 글자 사이 반 칸)
| 생성 | 결과 |
| --- | --- |
| Logo_Grid_01 | 사용: 5줄·블록 크기 거의 고름, 수정 7색. E 칸 폭만 좁고 N 대각선이 칸 사이 |
| Logo_Grid_02 | 미사용: 수정 적음, O 모서리 빔 |
- 생성만으로는 격자가 완전히 맞지 않아 코드로 강제: `tools/logo_grid.js`
  - 블록 면 찾기(밝은 면, 3px 깎아 이음선 연결 끊기, 붙은 블록은 크기로 나눔) → 87개
  - 블록 중심 x 사이 큰 틈으로 9글자 분리, 단어 전체 높이를 5줄로 균등 분할
  - 글자마다 열 수 = 폭 / 줄 높이 (N은 4칸 고정 모양 X..X / XX.X / X.XX / X..X / X..X)
  - 칸마다: 수정(채도 높은 면 55% 넘음)이면 확정 수정 25×25, 아니면 생성본 블록을 잘라 25×25로
  - 모든 블록 25도트 칸에 반듯하게, 글자 간격 14도트, 외곽선 4도트(21,28,39) + 그림자 4도트(9,12,19)
- 결과 `parts/T_Title_Logo.png` 764×131 → 화면 2배 1528×262, 미리보기 `preview/Title_Logo_FHD.png` (196, 50)
  - 글자별: T 3열 7칸(청록 수정 3) / E 10칸(파랑 1) / T 7칸(주황 3) / R 11칸(빨강 1) / I 5칸(노랑 1) / G 11칸(초록 1) / E 10칸(보라 1) / O 12칸(빨강 6) / N 4열 12칸(청록 5)
- [남은 문제] 강화 이음선 일부가 블록 가장자리에서 짧게 잘림 (생성본 블록을 잘라 쓰기 때문)
- [미적용] Unity — 승인 전 적용 안 함

## Unity 적용 — 로고 (2026-10-06, "이렇게 적용하자")
- `Assets/@Resources/UI/Title/T_Title_Logo.png` (parts와 MD5 일치) — Sprite Single, PPU 50(2배), Point, 압축 없음, 밉맵 없음, Clamp, FullRect
- TitleScene/UI/TitleCanvas에 `Logo` Image 추가: 순서 Background·Queen·Sentinel·Lemy → **Logo** → Menu → OptionMenu, 가운데 기준 (0, 359), SetNativeSize 1528×262, Raycast Target 끔
- 확인(Play): `preview/Unity_Title_Logo.png` (미리보기와 같은 자리, START 마우스 올림 정상), `preview/Unity_Title_Logo_Option.png` (설정 창이 로고 아래쪽 약 60px를 덮음 — 설정 창이 로고 위에 그려짐), 콘솔 에러·경고 없음

## EXIT 종료 (2026-10-06, "타이틀에서 EXIT 누르면 게임이 종료되게 해줘")
- `TitleMenu.Quit`: 에디터에서는 `EditorApplication.isPlaying = false`(플레이 모드 종료), 빌드에서는 `Application.Quit()` (`#if UNITY_EDITOR`). 버튼 연결(Btn_EXIT → TitleMenu.Quit)은 그대로
- 컴파일 에러 없음, 사용자가 에디터에서 종료 확인
