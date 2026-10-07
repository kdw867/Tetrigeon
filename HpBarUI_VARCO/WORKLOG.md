# HP바 (HpBarUI_VARCO)

## 요청과 결정 (2026-10-07)
- 요청: 컨셉 아트(`refs/ref_concept_hpbars.png`, 사용자가 VARCO에 올려 둔 이미지)로 레미 HP바와 몬스터 HP바를 레이어로 분리해 만들기. 숫자는 0~9를 만들어 조합하는 방식
- 결정(사용자 답변): 방패 줄은 막대 없이 아이콘+숫자만 / HP 숫자는 막대 가운데 / 모든 HP바는 캐릭터 아래 / **레미 막대도 몬스터 막대와 같은 크기로 줄임**
- 컨셉과 다른 곳: 컨셉의 큰 막대(몬스터 734px, 레미 833px)는 3마리가 나란히 서는 간격(약 195px)에 안 들어가서 몬스터 막대를 168px로 줄임. 숫자가 막대 안에 들어가도록 창을 11줄로 키움. 컨셉의 방패 막대와 타겟 ▼ 아이콘은 쓰지 않음(타겟 화살표는 기존 글자 유지)

## 제작 (VARCO 생성 없음 → 크레딧 0)
- `tools/step1_extract.js`: 컨셉에서 막대를 3.1px/도트로 줄여 잘라냄 (레미 큰 막대 270x36, 몬스터 238x29, 방패 아이콘 16x18). 큰 레미 막대 레이어는 `work/T_HpLemy_*_big.png`에 보관(미사용)
- `tools/step2_lemy.js`: 큰 레미 막대를 틀/빈 칸/채움으로 분리 (틀과 창 안쪽을 따로 색 줄임, 72%만 찬 채움을 한 주기씩 밀어 100%로 확장). 사용자 요청으로 작은 크기로 바꾸며 **최종 레이어는 step5로 대체**
- `tools/step3_monster_shield.js`: 몬스터 막대 112x20(창 102x11) 도트로 직접 그림 (컨셉의 돌 회색·빨간 채움 색), 방패 아이콘(컨셉 추출, 15x16)
- `tools/step5_lemy_small.js`: 레미 막대 112x20(창 93x11): 왼쪽 청록 보석 마구리, 오른쪽 룬 마구리, 초록 11줄 채움
- `tools/digits.js`: 숫자 0~9, "/", "+" 굵은 도트 글꼴 (6x9 격자, 컨셉의 크림색 숫자 모양, 크림·청록 2색). 컨셉에 없는 5·6·9는 같은 격자 규칙으로 새로 그림
- 미리보기: `preview/HpBars_Sheet.png`, `HpBars_InGame_Mock.png`, 실제 Unity 캡처 `Unity_HpBars_1/2.png`

## Unity 적용 (2026-10-07)
- 에셋 `Assets/@Resources/UI/HpBars/`: `Layers/` 7장(Frame/Track/Fill x 레미·몬스터, 방패 아이콘; PPU 66.67 = 1.5배), `Font/HpDigits_cream|cyan.png` + `.asset`(PixelFontData), `P_HpBarLemy.prefab`, `P_HpBarMonster.prefab`
- 코드: `HpBarView`(신규: 채움 비율·가운데 숫자·방패 줄·월드→UI 위치), `PixelText`(배율을 실수로), `EnemyView`(체력 막대 생성·배치, 체력 글자 첫 줄 제거, 전 등급 막대를 발 아래로, 일반 몹 글자도 아래로), `CombatUIView`(PLAYER 글자 → 레미 막대), `CombatManager`(적 생성 때 막대 생성, 프리팹·부모 연결)
- 씬: UI 그룹 아래 `HpBarCanvas`(오버레이, 정렬 20) > `PlayerHpBar`, `EnemyHpBars`. Player 그룹 아래 `PlayerBarAnchor`(레미 발 아래 월드 점). 기존 `PlayerHpLabel` 글자 삭제
- [확인] 플레이 모드: 스테이지 10(일반·에픽·보스)에서 막대 위치와 숫자, 낮은 체력, 보호막 +n, 독 아이콘 줄, 적 사망 시 막대 숨김, 스테이지 전환 시 이전 막대 정리(활성 막대 수 4 유지), 콘솔 오류 없음
- [미확인] 실제 키 입력으로 한 판 플레이, 16:9가 아닌 해상도, 빌드

## 스킬 카운터: 룬 + 숫자 (2026-10-07)
- 요청: 컨셉(`refs/ref_concept_skill_counter.webp`)처럼 몬스터 막대 오른쪽 아래에 파란 룬 + 남은 턴, 1턴 남으면 금색 룬 + 금색 "1 !". 룬 그림은 사용자가 올린 `refs/ref_rune_blue.png`, `ref_rune_gold.png`(1254x1254)
- 제작 (VARCO 생성 없음 → 크레딧 0): `tools/rune_extract.js`가 올린 룬을 9x9 도트(한 칸 약 33px)로 변환 → `parts/layers/T_SkillRune_blue|gold.png`. `tools/digits.js`에 "!" 글자(2x9)와 금색(몸통 252,206,48 / 외곽선 46,26,4) 추가 → `font/HpDigits_gold.png`(+`.tsv`). 크림·청록 글꼴 에셋은 그대로(느낌표는 금색에만 있음)
- Unity: `Layers/T_SkillRune_Blue|Gold.png`(PPU 66.67 = 1.5배, 13.5px), `Font/HpDigits_gold.png/.asset`, `P_HpBarMonster.prefab`에 SkillRune·SkillText(크림)·SkillTextNext(금색) 추가. 막대 중심 기준 룬 x+57/y-24.75, 숫자 왼쪽 끝 x+67.5 (막대 오른쪽 끝 +84)
- 코드: `HpBarView.SetSkill(turnsLeft)`·`SkillRowWorldHeight`, `EnemyView`(SKILL 글자 제거 → `hpBar.SetSkill`, 상태 글자는 스킬 줄 밑에서 시작, 글자가 비면 높이 0으로 계산)
- 규칙: 남은 턴 2 이상 = 파랑 룬 + 크림 숫자, 1 이하 = 금색 룬 + 금색 `1 !`. 일반 3 / 에픽 5 / 보스 6턴 주기는 그대로
- [확인] 플레이 모드: 스테이지 10에서 3/5/6 표시, 일반 몹 적 턴 진행 3→2→1(금색)→3(초기화), 독 줄이 스킬 줄 바로 밑에 붙음, 콘솔 오류 없음. 캡처 `preview/Unity_SkillCounter_full1~3.png`
- [미확인] 실제 키 입력 플레이, 16:9가 아닌 해상도, 빌드. 컨셉의 왼쪽 아래 상태 아이콘 줄(해골·방패 등)은 이번에 안 함(상태 아이콘은 기존 위치)

## 스테이지 패널 표시 제거 (2026-10-07)
- 요청: 화면 오른쪽 위의 `STAGE 10 / ENEMIES 3 / 3 / [TAB] TARGET` 글자를 지우고 싶음 (씬 오브젝트 이름은 `UI/EnemyHpLabel`이었고 이름과 달리 이 글자였음)
- 변경: 씬에서 `UI/EnemyHpLabel` 삭제, `CombatUIView`에서 `enemyHpText` 필드와 갱신 줄(남은 적 수 집계 포함) 삭제. TAB 타겟 전환 기능과 `CombatManager.StageNumber` 데이터는 그대로
