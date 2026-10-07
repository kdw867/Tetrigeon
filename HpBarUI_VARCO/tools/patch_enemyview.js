// EnemyView.cs 패치 (일회용): 체력 글자 첫 줄을 막대로, 막대는 전 등급 몸통 발 아래에
const fs = require('fs');
const f = 'C:/Users/MBC-501-15/Documents/Tetrigeon/Tetrigeon/Assets/@Scripts/Visuals/EnemyView.cs';
const raw = fs.readFileSync(f, 'utf8'), crlf = raw.includes('\r\n');
let s = raw.replace(/\r\n/g, '\n');
const rep = (a, b) => { if (!s.includes(a)) throw new Error('못 찾음: ' + a.slice(0, 70)); s = s.replace(a, b); };

rep('    private TextMesh targetMarker; // 현재 타겟임을 알리는 화살표\n',
  '    private TextMesh targetMarker; // 현재 타겟임을 알리는 화살표\n    private HpBarView hpBar; // 이 적의 체력 막대 (UI 캔버스 위, 몸통 발 아래)\n\n    private const float BarGap = 0.05f; // 발과 막대, 막대와 글자 사이 간격 (월드 단위)\n');
rep('    // 월드 좌표 텍스트를 자식으로 생성 (기존 라벨들과 같은 방식)',
  '    // 체력 막대를 UI 부모 아래에 만든다 (CombatManager가 적 생성 직후 호출)\n    public void CreateHpBar(HpBarView prefab, RectTransform root)\n    {\n        hpBar = Instantiate(prefab, root); // 적마다 막대 하나\n    }\n\n    private void OnDestroy()\n    {\n        if (hpBar != null) Destroy(hpBar.gameObject); // 적이 사라지면 막대도 함께 제거\n    }\n\n    // 월드 좌표 텍스트를 자식으로 생성 (기존 라벨들과 같은 방식)');
rep('        hpText.gameObject.SetActive(!dead); // 죽으면 체력·스킬·상태이상 표시를 모두 감춤 (DEAD 문구도 쓰지 않음)\n',
  '        hpText.gameObject.SetActive(!dead); // 죽으면 체력·스킬·상태이상 표시를 모두 감춤 (DEAD 문구도 쓰지 않음)\n        hpBar.gameObject.SetActive(!dead); // 체력 막대도 함께 감춤\n');
// hpText.text 줄: 첫 줄(체력) 제거
const i0 = s.indexOf('        hpText.text = $"{enemy.Hp}/{enemy.MaxHp}');
if (i0 < 0) throw new Error('hpText.text 줄 못 찾음');
const i1 = s.indexOf('\n', i0);
s = s.slice(0, i0) + '        hpBar.SetHp(enemy.Hp, enemy.MaxHp); // 체력은 막대와 가운데 숫자로\n        hpText.text = $"SKILL {enemy.TurnsUntilSkill}{status}"; // 능력까지 남은 턴 (막대 아래 글자)' + s.slice(i1);

// PlaceStatusRow: 체력이 위로 쌓이는 배치(일반 몹)는 없어졌으므로 분기 제거
const a = s.indexOf('    // 상태이상 줄을 체력 표시 바로 아래에 놓는다.'), b = s.indexOf('    // 등급에 맞는 아트 선택');
if (a < 0 || b < 0) throw new Error('PlaceStatusRow 구간 못 찾음');
s = s.slice(0, a) + [
  '    // 상태이상 줄을 아래로 늘어나는 체력 글자 바로 아래에 놓는다',
  '    private void PlaceStatusRow(bool hasStatus)',
  '    {',
  '        float scale = transform.lossyScale.y; // 적 루트 배율 (월드 크기를 루트 기준 로컬 위치로 환산)',
  '        float rowHeight = poisonIcon.sprite.bounds.size.y / scale; // 아이콘 한 줄 높이 (루트 로컬)',
  '        Vector3 hpPosition = hpText.transform.localPosition; // PlaceLabels가 정한 글자 위치',
  '        float hpHeight = hpTextRenderer.bounds.size.y / scale; // 글자 여러 줄의 실제 높이 (루트 로컬)',
  '        statusRow.localPosition = new Vector3(0f, hpPosition.y - hpHeight - rowHeight / 2f, 0f); // 글자 바로 아래',
  '    }',
  '', ''].join('\n') + s.slice(b);

// PlaceLabels: 전 등급 막대를 발 아래에
const c = s.indexOf('    // 몸통 크기가 등급마다 달라서');
if (c < 0) throw new Error('PlaceLabels 구간 못 찾음');
s = s.slice(0, c) + [
  '    // 몸통 크기가 등급마다 달라서, 아트의 위아래 끝에 맞춰 막대와 글자를 배치한다 (막대는 모두 캐릭터 발 아래, 그 밑에 SKILL 글자)',
  '    private void PlaceLabels()',
  '    {',
  '        hpText.anchor = TextAnchor.UpperCenter; // 모든 등급이 막대 아래로 글자가 늘어남',
  '',
  '        if (enemy.Tier == EnemyTier.Normal && normalIdleBody != null) // 투명 셀 여백 대신 실제 몸 높이로 배치',
  '        {',
  '            float floorY = normalIdleBody.transform.localPosition.y; // 발바닥 피벗의 고정 높이',
  '            float height = 28f / normalIdleBody.sprite.pixelsPerUnit; // 모든 프레임을 포함하는 고정 몸 높이',
  '            PlaceHpBar(floorY); // 발 아래 막대와 그 밑 글자',
  '            targetMarker.transform.localPosition = new Vector3(0f, floorY + height + 0.8f, 0f); // 몸 위 타겟 화살표',
  '            return;',
  '        }',
  '        if (enemy.Tier == EnemyTier.Epic && epicIdleBody != null) // 발바닥 피벗이라 정지 아트 기준 계산을 쓸 수 없음',
  '        {',
  '            float epicFloorY = epicIdleBody.transform.localPosition.y; // 발바닥 피벗의 고정 높이',
  '            float epicHeight = 74f / epicIdleBody.sprite.pixelsPerUnit; // 발바닥 위로 올라오는 고정 몸 높이',
  '            PlaceHpBar(epicFloorY); // 발 아래 막대와 그 밑 글자',
  '            targetMarker.transform.localPosition = new Vector3(0f, epicFloorY + epicHeight + 0.15f, 0f); // 머리 위 수정보다 위에 화살표',
  '            return;',
  '        }',
  '',
  '        if (enemy.Tier == EnemyTier.Boss && bossIdleBody != null) // 셀에 투명 여백이 많아 정지 아트 기준 계산을 쓸 수 없음',
  '        {',
  '            float pivotY = bossIdleBody.transform.localPosition.y; // 셀 고정 기준점 높이',
  '            float ppu = bossIdleBody.sprite.pixelsPerUnit;',
  '            float bottomY = pivotY - 60f / ppu; // 보이는 하단 수정은 기준점보다 60픽셀 아래',
  '            float topY = pivotY + 58f / ppu; // 가장 높은 결정은 기준점보다 58픽셀 위',
  '            PlaceHpBar(bottomY); // 하단 수정 아래 막대와 그 밑 글자',
  '            targetMarker.transform.localPosition = new Vector3(bossIdleBody.transform.localPosition.x, topY - 0.15f, 0f); // 보스 기준점에 가로 정렬하고 상단 잘림 방지 높이는 유지',
  '            return;',
  '        }',
  '',
  '        float halfHeight = body.sprite != null ? body.sprite.bounds.extents.y : 0.5f; // Idle 참조가 없을 때의 기존 배치: 아트 절반 높이',
  '        PlaceHpBar(-halfHeight); // 몸통 아래 막대와 그 밑 글자',
  '        targetMarker.transform.localPosition = new Vector3(0f, halfHeight + labelMargin, 0f); // 몸통 위',
  '    }',
  '',
  '    // 막대를 발(feetLocalY, 루트 로컬) 아래에 놓고, 그 바로 밑에 SKILL 글자가 시작하게 한다',
  '    private void PlaceHpBar(float feetLocalY)',
  '    {',
  '        float barHeight = hpBar.WorldHeight; // 막대 높이 (월드)',
  '        hpBar.PlaceAtWorld(transform.TransformPoint(new Vector3(0f, feetLocalY, 0f)) + Vector3.down * (BarGap + barHeight * 0.5f)); // 발 바로 아래 막대 가운데',
  '        hpText.transform.localPosition = new Vector3(0f, feetLocalY - (BarGap * 2f + barHeight) / transform.lossyScale.y, 0f); // 막대 밑에서 글자 시작',
  '    }',
  '}',
  ''].join('\n');
fs.writeFileSync(f, crlf ? s.replace(/\n/g, '\r\n') : s);
console.log('EnemyView 패치 완료, CRLF', crlf);
