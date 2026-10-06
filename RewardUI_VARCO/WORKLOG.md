# 스테이지 보상 화면 (RewardUI_VARCO)

## 요청과 결정 (2026-10-06)
- 요청: 컨셉 아트(`refs/ref_concept_reward.png`, 사용자가 VARCO에 올려 둔 이미지)와 최대한 똑같이. 미노 표시는 게임에 이미 있는 그림, 텍스트·버튼·피해·능력 표시는 컨셉대로. 7종 전부, 그림은 레이어로 나눔
- 표시 값: 한 줄(피해 1) 지울 때의 실제 정수값 (반올림 때문에 평평한 구간이 보이는 것까지 확정). 수정 칸 위치는 숨김(고를 때 정해지는 기존 규칙 유지)
- 컨셉과 다르게 한 곳: 독 설명을 "Starts next enemy turn." → "Starts 1 turn later." (새 독은 바로 이어지는 적 턴을 건너뛰므로 실제 동작에 맞춤, Plan.md 상태이상 타이밍)

## VARCO 생성 (nano-banana-2, 총 120cr = 40 x 3)
- 레퍼런스: A_01(일시정지 창), 사용자가 올린 컨셉 아트(`18ec5408…`). 노드는 워크플로 끝(x 3000~3600, y 24000~25600)
- `generated/K_Card_01/02.png` (3:4, 896x1200): 카드 틀. **K_Card_02 사용** (01은 더 크고 균열·비대칭)
- `generated/K_Select_01/02.png` (16:9): SELECT 버튼 시트. **미사용** — 버튼 도트 간격(약 5.75px)이 카드(약 6px)와 같아 5배로 쓰면 카드 폭보다 커짐. 대신 팔레트색으로 직접 그림
- `generated/K_Title_01/02.png` (16:9): CHOOSE AN UPGRADE 금색 제목. **K_Title_01 사용**
- 도트 한 칸 크기를 `tools/pitch.js`로 측정 (카드 6.0px, 버튼·제목 5.75px) → 그 값으로 축소해야 한 칸 = 1픽셀

## 후처리 (전부 이 폴더 안, Unity 적용은 미리보기 승인 뒤)
- `tools/step1_card.js`: 배경 제거 → 6px/도트 축소(106x168) → 일시정지 창 31색 공용 팔레트
- `tools/step2_compose.js`: 카드를 왼쪽 위 1/4 거울 복사로 좌우·상하 대칭(98x162) → **레이어 분리**: Frame / Interior / LevelOrnament / EffectBox / Glow, SELECT 슬랩·글자, 제목 글자·장식. 합성본 `parts/T_Card_Frame.png`
- `tools/pixel_font.js` + `pixel_font_glyphs.js`: 직접 만든 5x7 도트 글꼴(A-Z a-z 0-9 기호, 크림·금색·청록 3색, 외곽선 1px). `font/PixelFont.json` 등
- `tools/lib_ui.js`, `tools/step3_preview.js`: 1920x1080 미리보기 (`preview/Reward_Screen_A/B/C.png`)
- 배율: 카드·버튼 5배, 제목 4배, 글자 5/4/3/2배, 아이콘·미노 3배 (일시정지 창 1.75배와 다름: 컨셉의 도트 크기가 더 큼)

## Unity 적용 (2026-10-06, 미리보기 승인 뒤)
- 에셋: `Assets/@Resources/UI/RewardScreen/` — `Layers/` 9장, `Font/` 아틀라스 3장 + `PixelFont_*.asset` 3개, `P_RewardCard.prefab`
- 임포트: Sprite, Point, 압축 없음, FullRect, 카드·버튼 레이어 PPU 20, 제목 PPU 25, 글꼴은 조각으로 나눔
- 씬: SampleScene > UI > RewardCanvas > UpgradeRoot를 전체 화면 어두운 배경으로. 기존 글자 제목과 Btn_UP0~2 삭제, StageText·TitleText·TitleOrnamentL/R·SubtitleText·FooterText·Cards(RewardCard_0~2) 추가. RewardPrompt에 stageText, cards 연결
- 코드: `PixelFontData`, `PixelText`, `RewardCard`(신규), `RewardPrompt`(카드 방식으로 개편), `CombatManager.AbilityValue`(공용 수치식, 실제 발동도 같은 식 사용)/`PoisonTurns`·`ShieldTurns` public, `PieceVisuals.GetMinoSprite(..., previewUpgraded)`
- [확인] 플레이 모드: 7종 전부 카드 렌더(`preview/Unity_Reward_A/B/C/Final.png`), AbilityValue 210조합이 기존 식과 일치, 실제 발동 경로(I,J,O,S,Z,L,T) 값 일치, 후보 3장 흐름·카드 클릭 선택(Lv 증가, 화면 닫힘)·후보 2개일 때 3번째 카드 숨김·호버 빛, 콘솔 오류 없음
- [미확인] 실제 마우스 클릭으로 한 판 플레이, 해상도 1920x1080 외 비율, 빌드
