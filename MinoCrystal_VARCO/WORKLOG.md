# 강화 미노 수정 칸 — VARCO 작업 기록

기준 문서: `Plan.md` (Crystal cells), `Tetrigeon_Pixel_Art_Guide_EN.md` §16
Unity 적용: **하지 않음** — 디자인 확정(2026-10-02), 수정 칸 기능 구현 전이라 적용 보류

## 결정 (2026-10-02)
- Lv.2부터 강화할 때마다 수정 칸이 1개씩 늘어남: Lv.2 1칸, Lv.3 2칸, Lv.4 3칸, Lv.5 4칸 전체
- 무작위 선택은 강화할 때 (남은 일반 칸 중 균등), 이후 같은 종류의 모든 조각에서 같은 칸이 수정
- 수정 색 = 그 미노의 색 (I 청록, J 파랑, L 주황, O 노랑, S 초록, T 보라, Z 빨강)
- 모양: 칸 전체가 수정 블록. 칸 크기·검은 외곽선·이웃 칸과 이어지는 색 이음선은 기존 강화 칸 그대로
- Plan.md Crystal cells 항목 갱신 (기존 "Lv.2~5 항상 1칸, 조각 생성 때마다 새로 뽑음" 대체)

## 기존 강화 칸 (`Assets/@Resources/Resources/MinoSprites/Upgraded/{I,J,L,O,S,T,Z}_{0..3}.png`)
- 종류마다 4칸, 칸마다 이웃과 맞닿는 변에 미노 색 이음선. PPU 128, 중심 피벗
- 게임에서는 칸 하나를 화면 25px 정사각형으로 맞춰 표시 (`PieceVisuals.ApplyMinoArt`)
- 실제 도트 격자 (tools/grid.js): I 5.5 / J 5.25 / L 5.5 / O 5.75 / S 5.25 / T 5.75 / Z 5.25 px → 칸 하나 약 25도트 (L만 25×20, 세로 원본을 90° 돌려 씀)
- 즉 게임 화면에서 도트 1칸 ≈ 화면 1px

## 레퍼런스 업로드 (MD5 = 서버 키 확인)
| 파일 | 내용 | 서버 키 |
| --- | --- | --- |
| refs/u_UpgradedCells.png | 강화 칸 7종(각 _1) 도트 해상도 ×4, 128색 | 866164c50b205cf0555a613cc3088b47 |
| (기존) u_Sentinel | 게임 속 자수정 표현 | 55dc0250a8bde77b35d2375e977bc19c |

## 1차 생성 — 수정 블록 7종 한 줄 (16:9)
nano-banana-2 ×1, gpt-image-2-medium ×1 (40cr). 이음선 없이 외곽선 있는 수정 블록만 요청 → 이음선·외곽선은 기존 칸 그림에서 그대로 가져와 코드로 합성 예정

## 1차 결과
| 생성 | 결과 |
| --- | --- |
| Crystal_Nano_01 (nano-banana-2) | 미사용: 3줄로 흩어지고 블록 잘림·중복 |
| Crystal_Gpt_01 (gpt-image-2-medium) | 사용: 7색 한 줄, 같은 면 배치·조명. 블록 약 187px |

### 합성 (`tools/crystal_cells.js` → `parts/Crystal/{I..Z}_{0..3}.png`, 28장)
- 블록마다 흰 바탕 제거(테두리 연결 흰색만) → 25×25도트 면적 평균 → 블록마다 10색
- 강화 칸의 돌 범위: 가장자리에서 안쪽 40px 안 마지막 선명한 이음선 색 다음 + 청회색 외곽선(밝기 90 미만) 건너뜀. 그 안만 수정 블록 안쪽(외곽선 제외)으로 최근접 채움, 바깥 외곽선·이음선은 원본 픽셀 그대로
- 원본과 같은 크기·같은 파일명 (Unity에서는 Upgraded 폴더와 섞이면 로더가 같은 칸 번호로 덮어쓰므로 별도 폴더 필요 — 구현 때 결정)
- L은 게임에서 90° 반시계로 돌려 쓰므로 수정 블록을 시계 방향으로 미리 돌려 하이라이트를 왼쪽 위로 맞춤
- 처음엔 이음선 안쪽의 흰빛 줄을 돌로 오인해 S 등 이음선이 덮였음 → 이음선 판정을 위처럼 바꿔 해결

### 미리보기 (`tools/crystal_preview.js`)
- `preview/Crystal_Levels_x1.png` (게임 크기: 칸 27px, 그림 25px), `_x3.png` 확대, `preview/Crystal_Tiles_x8.png` 블록 7종
- 강화 순서는 예시(고정). 실제 게임은 무작위
- [미적용] Unity — 승인 전 적용 안 함
- [남은 문제] 수정이 매끈한 보석 타일(사선 2분할 면)이라 결정 면이 단순하고 채도가 높음. 돌과 대비는 강함
1차 합계 40cr

## 2차 — 맑은 수정 (2026-10-02, "좀 더 맑은 수정이었으면 좋겠어")
- gpt-image-2-medium ×2 (40cr, 누적 80cr). 레퍼런스: Crystal_Gpt_01(배치·크기·외곽선 유지) + u_UpgradedCells(도트 밀도). 재질만 투명한 보석으로: 연한 색 위주, 비쳐 보이는 안쪽 컷 면, 안쪽 테두리 밝은 띠, 왼쪽 위 흰 반짝임
| 생성 | 결과 |
| --- | --- |
| Crystal_Clear_01 | 미사용: 가장 연하지만 컷 선이 가늘어 25도트로 줄이면 끊기고 흐려짐 |
| Crystal_Clear_02 | 사용: 가운데 네모 면 + 사선 컷이 25도트에서도 또렷, 맑고 밝음 |
- 비교: `preview/Crystal_Clear_Compare.png` (위 01, 아래 02, ×8)
- parts/Crystal 28장을 Crystal_Clear_02로 다시 합성 (`node tools/crystal_cells.js Crystal_Clear_02`), 미리보기 `preview/Crystal_Levels_x1.png` / `_x3.png` / `Crystal_Tiles_x8.png` 갱신
- [미적용] Unity — 승인 전 적용 안 함

## 3차 — 색 보정 (2026-10-02, 코드만 사용, 0cr)
- "색이 마음에 안 든다" → 코드 색 보정 후보 3개 비교 `preview/Crystal_Color_Options.png` (현재 / A 미노 색조 선명 / B 진한 보석색 / C 차분하게)
- 사용자 답: "흰색의 비중이 너무 많은 것 같아서 색감은 그대로 두고 흰색을 좀 줄여줄래" → A·B·C 미사용
- `tools/crystal_cells.js Crystal_Clear_02 lesswhite`: 색조는 그대로, 밝기 0.78 넘는 흰빛(테두리 띠·컷 선, 면의 약 20%)을 블록 색의 밝은 톤 두 단계(0.72 / 0.78, 채도는 중간 면 수준)로. 왼쪽 위 반짝임(밝기 0.9 초과, 9×9 안)만 흰색 유지
- 비교 `preview/Crystal_LessWhite_Compare.png` (위 현재, 아래 흰빛 줄임), parts/Crystal 28장 · 미리보기 갱신
- [미적용] Unity — 승인 전 적용 안 함

## 확정 (2026-10-02, "일단 이걸로 픽스해두고 지금 기능구현을 안해놔서 적용시키지는 말자")
- 확정 디자인: Crystal_Clear_02 + lesswhite 보정. 다시 만들 때: `node tools/crystal_cells.js Crystal_Clear_02 lesswhite`
- 확정 파일: `parts/Crystal/{I,J,L,O,S,T,Z}_{0..3}.png` 28장 (원본 강화 칸과 같은 크기·같은 파일명)
- Unity 적용 보류: 수정 칸 기능(Plan.md Crystal cells) 구현 때 같이 넣음
  - 넣을 때: Upgraded 폴더와 다른 폴더에 둠 (같은 폴더면 PieceVisuals의 Upgraded 로더가 같은 칸 번호로 덮어씀), 임포트는 원본 Upgraded와 같게 (PPU 128, Point, 압축 없음)
