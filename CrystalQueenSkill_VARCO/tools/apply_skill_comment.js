// EnemyView.PlayAttack 위 설명 주석 두 줄을 현재 동작에 맞게 수정 (CRLF 유지, 정확히 1곳씩)
const fs = require('fs'), path = require('path'); const f = path.join(__dirname, '..', '..', 'Tetrigeon', 'Assets', '@Scripts', 'Visuals', 'EnemyView.cs'); let t = fs.readFileSync(f, 'utf8');
const pairs = [
  ['    // 애벌레는 모든 행동에 같은 모션, 여왕은 일반 공격에만, 수호자는 일반 공격과 강공격에 같은 모션(강공격 전용 모션은 나중에 구분 예정)', '    // 애벌레는 모든 행동에 같은 모션, 수호자는 일반 공격과 강공격에 같은 모션(강공격 전용 모션은 나중에 구분 예정), 여왕은 일반 공격과 수정 증식 능력에 각각 다른 모션'],
  ['    // 여왕의 능력 모션과 수호자의 능력 사용·강공격 준비 모션은 아직 없음', '    // 여왕의 회전 금지 능력 모션과 수호자의 능력 사용·강공격 준비 모션은 아직 없음'] ];
for (const [a, b] of pairs) { const n = t.split(a).length - 1; if (n !== 1) throw new Error('바꿀 부분 ' + n + '곳: ' + a.slice(0, 40)); t = t.replace(a, () => b); }
fs.writeFileSync(f, t, 'utf8'); console.log('주석 수정 완료');
