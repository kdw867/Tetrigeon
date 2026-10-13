# 수정여왕 SKILL 연출 — 작업 기록 (VARCO 작업 폴더, Assets 밖, Unity 미적용)

## 1. 요청과 범위 (2026-10-13)
- 수정여왕 SKILL 연출: **일반공격 몸동작은 그대로 재사용, 이펙트만 변경.** 제작·미리보기까지, 사용자가 "Unity에 적용해"라고 하기 전에는 Unity 코드·씬·프리팹·임포트 설정·Assets를 건드리지 않음. 커밋 안 함.
- 이번 단계 = 핵심 장면 4개(손 기운 / 공중 왕관 완성 / 왕관 파열 / 파편·파동 소멸) 컨펌용. 승인 뒤에 전체 프레임·GIF 비교 영상을 만든다.

## 2. 사전 확인
- 읽은 문서: `Tetrigeon/CLAUDE.md`, `Tetrigeon/Plan.md`(여왕 항목: 일반공격 모션 구현 기록, 능력 모션은 미제작), `C:/Users/MBC-501-15/.codex/AGENTS.md`·`CODEX.md`(전역 지침, 프로젝트 AGENTS.md는 없음).
- **재사용한 일반공격(승인·적용본)**: 캐릭터 셀 = `CrystalQueenAttack_VARCO/output/CastFrames_v3_cells/CrystalQueen_CastFrame_*.png`(Unity `T_CrystalQueen_Attack.png` 와 같은 8셀), 시간표 = `CastFrames_v3_timeline.json`(17단계, 940ms), 일반공격 이펙트 비교용 = `CastFrames_v3_fx/`. 폐기한 팔 교차 모션(`CrystalQueen_Attack_KeyPoses_*`, `KeyScenes_v1`)이나 옛 시트는 쓰지 않음. 전부 읽기 전용으로만 접근.
- **VARCO 실제 지원 기능**(`get_node_catalog`, 워크플로우 연결 뒤 확인): TextInput/ImageInput/3DInput/Rigged3DInput, AIAssistant(텍스트), GenerateImage·EditImage(모델 gpt-image-1.5/2/2.5, nano-banana-1/2/pro), Generate3D·Texture3D·Remesh·PBR·Rig·Animate(3D 전용). **투명 배경 스프라이트·2D 프레임 애니메이션·도트 격자 출력 노드는 없음.** → 이번 이펙트는 VARCO를 쓰지 않고, 이전 여왕 공격과 같은 방식으로 코드로 직접 그림(크레딧 0). 이전 작업에서 VARCO 결과는 게임 Idle 도트 격자(2x2 px)와 맞지 않아 후처리가 필요했던 점도 고려.

## 3. 화면 위쪽 여백 측정 (`tools/measure.js`, `tools/overlap_probe.js`)
- 게임 화면(1920x1080) 스테이지 10 보스 자리 기준, 셀(160x160) 원점 화면 y = -37, 배율 2 → **셀 줄 0~18 은 화면 밖, 첫 보이는 줄 = 19.**
- 일반공격 프레임의 가장 높은 수정 끝 = 셀 줄 29 (자세 6개 모두 29~31). 즉 수정 끝 위 빈 공간 = 줄 19~28 = **10px(5도트)**.
- 이펙트 캔버스 확장은 필요 없음(화면 위쪽이 막혀 있어 셀 위쪽으로 늘려도 안 보임). 왕관 맨 위를 줄 19(화면 y 1)에 붙임.
- 상충: 사용자가 요청한 "자세히 디테일한 왕관"은 10px 높이로는 불가능 → 왕관 높이 22px(11도트, 줄 19~40)로 하고 **아래 5도트가 여왕 맨 위 수정 끝과 겹침**(윤곽 N 으로 분리). 겹침 도트(왕관 157도트 중): 가로를 머리 따라가게 하면 15~18%, 36블록에 고정하면 뒤로 기울인 자세 4 / 중간 29 / 앞으로 뻗은 자세 20. → 고정 채택.

## 4. 사용자 피드백 반영 이력
- v1: 보라 수정 5개를 금 띠 위에 올린 안(높이 5도트). 사용자: "수정이 모여서 왕관이 되는 게 아니라 수정으로 만들어진 왕관 모양이었으면 좋겠다. 재료가 수정이고 모양은 디테일하게, 고급지게 다른 재료도 섞어서."
- v2: 같은 도안이 흐릿 → 선명해지는 방식(조각이 모이지 않음), 왕관 한 덩어리를 수정으로 깎은 모양 + 금 + 진주 + 하늘색 보석. 파열은 왕관 도안을 다섯 조각으로 쪼개 흩어지게. v1 산출물(`SkillScenes_v1_*`, `CrystalQueenSkill_KeyScenes_v1_*`)은 보존.

## 5. 설계 (v2)
- 해상도: 게임 Idle 과 같은 "2x2 스프라이트 픽셀 = 도트 1칸"(블록 위상 (1,1)). 이펙트 셀은 캐릭터와 같은 160x160 좌표·피벗 (0.5,0.45)(`tools/fx_skill.js`).
- 팔레트: 여왕 보라(N D P B L W) + 게임 UI 금색 룬(`T_SkillRune_Gold`)에서 뽑은 금색 4색(145,85,0 / 252,185,1 / 253,234,3 / 253,247,210) + 진주 은백(188,199,245, 여왕 코어색) + 하늘색 보석(51,229,239, 여왕 눈색). 몸 코어·눈·기존 수정 색은 캐릭터 셀을 그대로 쓰므로 변하지 않음.
- **손 기운**: 일반공격 손 이펙트(spark1·spark2·starS·star·burst2)와 같은 크기·같은 자리, 색만 변경 — 금 테두리 + 보라 안쪽 + 백색 중심 1도트. 검증: 같은 자리·같은 크기(바운딩 박스 일치).
- **공중 왕관**(`tools/crown_art.js`, 21x11 도트): 수정 뾰족 5개(밝은 연보라 면 L·B·P, 가운데 하늘색 보석 장식 + 금 받침, 안쪽 뾰족 금 끝, 바깥 뾰족 진주), 뾰족 사이 밑동 금 이음, 금 구슬 테두리, 수정 면 띠(진주·가운데 하늘색 보석). 가로 위치 36블록 고정(머리를 따라가지 않음).
- **나타남**: T04 작은 빛(금·백) → T05 왕관 절반(바둑판 솎음, 윤곽은 유지) → T06 4분의 3 → T07 완성. **파열**: T10 한 단계 밝아짐 + 반짝임 → T11 왕관이 다섯 조각으로 쪼개짐 + 밝은 섬광 + 보라·금 파동 고리 → T12~T13 조각이 더 멀리·성기게(금 조각·진주·보석 조각 포함) → T14 아주 성긴 어두운 점 → T15·T16 이펙트 층 비어 있음.

## 6. 시간표 제안 (몸동작은 일반공격 v3 그대로, 총 940ms 불변)
| 단계 | 시작 ms | 길이 | 몸 | 이펙트 |
| --- | --- | --- | --- | --- |
| T04 | 220 | 60 | 손 모음(뒤 5°) | 손 기운(작음) + 작은 빛 |
| T05 | 280 | 50 | 〃 | 손 기운 + 왕관 절반 |
| T06 | 330 | 50 | 〃 | 손 기운 + 왕관 4분의 3 |
| T07 | 380 | 70 | 〃 | 손 기운 + **왕관 완성** |
| T08 | 450 | 50 | 팔 뻗기 중간 | 손 기운 + 왕관 |
| T09 | 500 | 70 | 팔 뻗기(앞 15°) | 큰 손 기운 + 왕관 |
| T10 | 570 | 50 | 〃 | 큰 손 기운 + 왕관 밝아짐 |
| **T11** | **620** | 50 | 〃 | **왕관 파열 = 스킬 발동 기준 시점(제안, 전투 시점은 변경 안 함)** + 약해진 손 기운 |
| T12 | 670 | 50 | 〃 | 조각 흩어짐 + 파동 + 거의 꺼진 손 기운 |
| T13 | 720 | 50 | 〃 | 조각·파동 성김 |
| T14 | 770 | 50 | 〃 | 마지막 점 |
| T15·T16 | 820·880 | 60·60 | 팔 내리기 | 비어 있음 |
- 완성된 왕관이 보이는 시간: T07~T09 = 190ms(+T10 밝아짐 50ms = 240ms) → 요청한 0.15~0.25초 안. 일반공격 길이 안에서 해결되어 유지 구간 연장 안 필요.

## 7. 산출물 (`output/`)
- 이펙트 셀(160x160, 투명 PNG): `SkillScenes_v2_fx/CrystalQueenSkill_Fx_T05·T09·T11·T14.png`, 정보 `SkillScenes_v2_build_info.json`(재사용한 캐릭터 셀 경로·손 중심 블록·왕관 위치).
- 미리보기(합성, 실제 Unity 영상 아님): `CrystalQueenSkill_KeyScenes_v2_game-screen_x2.png`(실제 게임 화면 위쪽 포함), `..._crown-closeup_x6.png`, `..._normal-vs-skill_x3.png`, `..._hands-normal-vs-skill_x8.png`, 왕관 도안 `CrystalQueenSkill_Crown_v2_design_x14.png`.
- 도구: `tools/fx_skill.js`(도안), `crown_art.js`(왕관), `skill_frames.js`(단계별 이펙트), `skill_scenes_preview.js`, `verify_skill.js`, `measure.js`, `overlap_probe.js`, `crown_view.js`, `zoom_hands.js`, `palette_probe.js`.

## 8. 검증 (`node tools/verify_skill.js`, 저장한 PNG를 다시 읽음, 위반 0)
- 알파 0/255, 팔레트 밖 0, 2x2 격자 어긋남 0, 화면 위쪽 잘림 0(맨 위 화면 y = 1), 셀 가로 밖 0.
- 눈·코어색 픽셀 위 겹침 0, 얼굴 상자(원본 X75~84·Y63~70 + 이동량) 겹침 0.
- 손 이펙트 자리·크기가 일반공격과 같음(T05·T09·T11 바운딩 박스 일치).
- 캐릭터 셀은 일반공격 v3 파일 그대로 읽어 합성(수정 없음).

## 9. 한계·확인 필요
- **왕관이 여왕 맨 위 수정 끝과 겹침**(앞으로 뻗은 자세 20도트). 겹침 없이 하려면 높이 5도트(v1 크기)로 줄여야 함 → 사용자 결정 필요.
- 왕관이 화면 맨 위(y=1)에 붙어 위쪽 여유가 없음.
- 파열 단계의 조각이 여왕 머리 쪽 수정 위로 떨어짐(아주 짧게). 파동 고리는 여왕 위쪽에서 얇게 퍼짐.
- 아직 전체 17단계 이펙트 셀·시트·GIF 비교·Unity 연결은 만들지 않음(컨펌 후).
- "원화" 기준(게임 Idle vs `T_CrystalQueen.png`) 질문은 이전부터 답이 없고, 게임 Idle 기준으로 진행.

## 10. 전체 프레임 v1 (2026-10-13, 사용자 "지금 크기 그대로 프레임 만들어줘")
- 결정: 왕관 크기는 **지금 크기(21x11도트, 42x22px) 그대로**, 여왕 맨 위 수정 끝과 겹치는 것을 허용(윤곽으로 분리). 핵심 장면 4개의 도안·위치를 그대로 써서 17단계 전부 제작. 핵심 장면 v2 PNG 와 바이트까지 같음을 확인(T05·T09·T11·T14).
- 만든 도구: `tools/skill_build_all.js`(17단계 이펙트 셀 + 시간표), `tools/skill_preview_all.js`(GIF 7개 + 검사 이미지 2장), `tools/verify_skill_all.js`(전체 검증), 보조 `gif_fx_color_check.js`·`gif_frame_dump.js`·`probe_t13.js`.
- **이펙트 파일(Assets 밖)**: `output/SkillFrames_v1_fx/CrystalQueenSkill_Fx_T04~T14.png`(11장, 160x160 투명 PNG). T00~T03·T15·T16 은 이펙트 없음(빈 단계, 파일 없음). 시간표 `output/SkillFrames_v1_timeline.json`(단계별 시작·길이·몸 셀 경로·이펙트 경로·역할, 발동 기준, 왕관 크기, 손 기운 블록, 재생 방법).
- **셀 크기·프레임 수·FPS·기준점**: 셀 160x160 px(몸·이펙트 동일), 단계 17개(이펙트 있는 단계 11개), 고정 FPS 없음 = 가변 시간표(10ms 배수, 총 940ms, 일반공격과 같음), 피벗 (0.5, 0.45) = 셀 왼쪽 위 기준 (80, 88)px, PPU 75.6, flipX 0. 캔버스 확장 없음(왕관이 화면에 보이는 줄 19 이후에 들어감). 자동 크롭·중앙 정렬 없음.
- **재생 방법**: 몸(승인된 일반공격 v3 셀 8장)과 이펙트(캐릭터 앞 한 층)를 같은 시간표로 동시에 바꿈. 이펙트는 단계가 비면 스프라이트 없음. 일반공격과 SKILL 은 동시에 재생되지 않게 연결 예정(미연결).
- **왕관 파열 = 스킬 발동 기준 시점(제안)**: T11, 시작 620ms (왕관이 다섯 조각으로 갈라지는 프레임). 전투 처리 시점은 바꾸지 않음. 완성 왕관 유지 T07~T09 = 190ms, 밝아짐 포함 240ms(요청 0.15~0.25초).
- 미리보기(합성, 실제 Unity 영상 아님, `output/CrystalQueenSkill_Frames_v1_*`): `preview_1_skill-fx-only_x4.gif`(이펙트 단독), `2_skill-composite_x4.gif`(최근접 ×4 합성), `3_skill-composite_actual-size_x2.gif`(게임 표시 크기), `4_skill-game-screen_x2.gif`(실제 게임 화면 합성, 위쪽 포함), `5_normal-vs-skill_x3.gif`(왼쪽 일반공격 / 오른쪽 SKILL), `6_skill-play-once_x4.gif`(1회 재생, 반복 없음, 마지막 기본 자세 1.5초 정지), `7_idle-skill-idle_game-screen_x2.gif`(기본 자세 → SKILL → 기본 자세, 반복), 검사 이미지 `frames-composite_x2.png`·`frames-fx_x2.png`(단계 번호·ms, 금색 점 = 파열 단계). 반복판은 첫 단계 앞에 기본 자세 500ms 쉼.
- 검증(`node tools/verify_skill_all.js`, 위반 0): ①시간표·몸 셀·총 길이가 일반공격과 같음 ②이펙트 11장 알파 0/255·팔레트 밖 0·2x2 격자 어긋남 0·화면 위쪽 잘림 0(맨 위 화면 y 1)·셀 가로 밖 0 ③눈(청록)·코어 자리·얼굴 상자 위 겹침 0 ④수정 투사체 크기 덩어리(연결 16px 이상)가 일반공격 수정 구역에 없음, 일반공격 대비 GIF 로도 확인 ⑤T07~T09 왕관 영역 = 완성 도안 그대로, T10 = 한 단계 밝은 도안, T05·T06 = 솎은 도안 ⑥손 기운 8단계(T04~T11) 자리·크기가 일반공격 손 이펙트와 같음 ⑦파열 이후 이펙트 도트 수 186→153→92→59→0→0 로 줄고 T15·T16 비어 있음.
- GIF 색: 평평한 배경판은 색차 5, 게임 화면판은 배경 그라데이션과 256색을 나눠 캐릭터 색이 최대 25 어긋나지만 이펙트 색은 1 이하(`gif_fx_color_check.js`). 정확한 색은 PNG 이펙트 셀과 검사 이미지가 기준.
- VARCO 사용 여부(2026-10-13): 요청서는 "VARCO 워크플로우를 이용하되"였으나 이펙트는 코드로만 제작함(크레딧 0). 사용자가 이를 지적했으나 "일단 만들었으니 됐다"고 해서 VARCO 왕관 시안 단계는 하지 않음 — VARCO 쪽에는 업로드·노드 생성·실행 없음(열린 워크플로우 `Text to Image 2026-10-01 09:36` 의 기존 노드 198개 그대로). 시안용 입력 이미지만 로컬에 만들어 둠: `tools/make_varco_input.js`, `output/varco_in/crown_current_x16_in.png`(+`.b64.txt`), 사용 안 함.
- 알려진 점: 왕관은 여왕 맨 위 수정 끝과 겹침(앞으로 뻗은 자세 20도트, 뒤로 기울인 자세 4도트). T13 에서 파편 한 점이 여왕 수정 위 연청 하이라이트(4px)를 50ms 가림(눈·코어·얼굴 아님). 손 기운은 일반공격과 같은 T04 부터 시작(T01~T03 은 일반공격처럼 없음). 기본 자세 ↔ SKILL 연결 미리보기는 Idle 01 정지 프레임 기준(Idle 반복 애니메이션 전체가 아님). 직접 손으로 플레이한 확인은 안 함(Unity 연결은 11장).

## 11. Unity 적용 — 수정여왕 증식 능력 SKILL (2026-10-13, 사용자 "수정 여왕이 미노에 하나 추가하는 기믹일 때만 행동하도록 적용해줘" + "SKILL이 두 개 있잖아? 미노 회전을 고정시킬 때 쓰는 건 좀 있다 만들자")
- 승인: 전체 프레임 v1 그대로(왕관 21x11도트 유지). 범위: 여왕이 **증식**(NEXT 미노에 칸 1개 추가) 능력을 쓰는 턴에만 재생. **회전 금지 능력 턴은 모션 없음**(나중에 따로 제작), 일반 공격 턴은 기존 일반 공격 모션 그대로.
- 도구: `tools/build_unity_skill_sheet.js`(이펙트 셀 11장 → 시트 `output/T_CrystalQueen_SkillFx.png` 800x480, 셀 단위 일치·빈 칸 투명 확인, 매핑 `output/CrystalQueenSkill_unity_mapping.json`), `tools/apply_skill_code.js`·`apply_skill_comment.js`(코드, CRLF 유지), `apply_plan_skill.js`·`apply_plan_skill2.js`(Plan.md), `unity_playcheck_sheet.js`·`unity_targeted_sheet.js`(Unity 렌더 확인 이미지), `eol_check.js`.
- **Unity 에셋(`Assets/@Resources/Enemies/CrystalQueenSkill/`)**: `T_CrystalQueen_SkillFx.png`(800x480, 160x160 셀, 11칸 사용, 스프라이트 `CrystalQueenSkillFx_00~10`, 임포트 설정이 `T_CrystalQueen_AttackFx` 와 전부 동일: PPU 75.6·피벗 (0.5,0.45)·Point·비압축·FullRect 등을 코드로 비교해 일치 확인), `CrystalQueen_Skill.anim`(길이 0.94초, 일반공격 클립을 복사해 몸 곡선(`CrystalQueen_Attack_00~07`)은 그대로 두고 자식 `BossAttackFx` 이펙트 곡선만 새 시트로 교체, 키 14개 = 시간표 그대로, 마지막 0.82 이후 비어 있음).
- **컨트롤러** `CrystalQueenIdle/CrystalQueen_Idle.controller`: 트리거 `Skill`, 상태 `Skill`(Idle→Skill 트리거·전이 시간 0, Skill→Idle 끝나면·종료 시각 1, 일반공격과 같은 설정), 기존 `Attack` 상태·전이 변화 없음(diff 는 추가만 84줄). **프리팹 `P_Enemy`·씬 변경 없음**(일반공격이 쓰던 자식 `BossAttackFx` 재사용).
- **코드(한국어 줄 주석, CRLF 유지)**: `Data/EnemyActionKind.cs` 에 `QueenGrowth`·`QueenRotationLock` 추가, `Gameplay/Enemy.cs` `NotifyAction` 이 여왕 능력 턴에서 `queenUsedGrowth` 상태로 증식/회전 금지를 구분해 알림(교대는 `TakeQueenGrowthTurn` 이 알림 뒤에 뒤집으므로 알림 시점 값으로 이번 능력을 앎), `Visuals/EnemyView.cs` `PlayAttack` 이 `QueenGrowth` 일 때만 `Skill` 트리거. 전투 수치·순서·타이밍·`CombatManager` 변경 없음(이번 작업에서 안 건드림).
- Plan.md(CRLF+BOM 유지, 영어): 머리 날짜, 여왕 일반 공격 항목 문장 2곳, 새 항목 "Growth skill motion". 기존에 들어 있던 다른 사람의 S 수정 회복 변경은 그대로.
- 검증(플레이 모드, 스테이지 10 = 애벌레·수호자·여왕, 적 턴을 리플렉션으로 36번 실행): 여왕 일반 공격 턴 전부 `Attack` 트리거, **증식 턴(6·18·30) `Skill` 트리거**, **회전 금지 턴(12·24·36) 트리거 없음**, 애벌레·수호자는 이전과 같음(애벌레 모든 행동 Attack, 수호자 일반 공격·강공격 Attack / 능력·준비 없음). 애니메이터를 0.01초씩 진행해 Skill 상태 시간 표본 76개(키 경계 ±0.003초 17개 제외)에서 몸·이펙트 스프라이트가 시간표와 불일치 0, 종료 뒤 상태 `CrystalQueen_Idle`·이펙트 비어 있음·몸 `CrystalQueen_Idle_01`. 게임 화면 렌더(`output/CrystalQueen_Skill_UnityPlayCheck_stage10_all_x1.png`·`..._4scenes_x2.png`)가 미리보기와 같음. 콘솔 오류·경고 0, 씬 `SampleScene` 변경 없음(dirty=false), 플레이 종료.
- 확인된 한계: 앞으로 뻗은 자세의 손 마법이 왼쪽 이웃(수호자) 위에 겹침(일반공격과 같음). 여왕이 타겟이면 타겟 화살표(▼, 정렬 100)가 왕관 아래 가운데를 가림(`..._targeted_x3.png`, 변경 안 함). 왕관은 여왕 맨 위 수정 끝과 겹침. 직접 손으로 플레이한 확인 안 함. 피해·증식 처리와 왕관 파열(0.62초) 동기화는 안 함(전투 타이밍 변경 금지).
