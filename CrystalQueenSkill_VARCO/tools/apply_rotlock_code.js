// 수정여왕 회전 잠금 대상 지정 변경 (CRLF·BOM 유지, 한국어 줄 주석, 바꿀 곳이 정확히 1곳일 때만 적용)
const fs = require('fs'), path = require('path');
const R = path.join(__dirname, '..', '..', 'Tetrigeon', 'Assets', '@Scripts');
function edit(rel, pairs) {
  const f = path.join(R, rel); let t = fs.readFileSync(f, 'utf8'); const bom = t.charCodeAt(0) === 0xFEFF;
  for (const [a, b] of pairs) { const A = a.replace(/\n/g, '\r\n'), B = b.replace(/\n/g, '\r\n'), n = t.split(A).length - 1; if (n !== 1) throw new Error(rel + ': 바꿀 부분이 ' + n + '곳: ' + a.slice(0, 50)); t = t.replace(A, () => B); }
  if ((t.charCodeAt(0) === 0xFEFF) !== bom) throw new Error('BOM 변경됨'); if ((t.match(/(?<!\r)\n/g) || []).length) throw new Error(rel + ' LF 단독 줄 생김');
  fs.writeFileSync(f, t, 'utf8'); console.log('수정', rel);
}
edit('Managers/BagManager.cs', [[
`    // 수정여왕 회전 금지: NEXT 맨 위 미노 1개 (고정될 때까지 회전 불가)
    public void LockNextRotation()
    {
        queue.Peek().RotationLocked = true; // 바로 다음에 나올 미노
        OnQueueChanged?.Invoke(PeekNext()); // 침식 표시로 NEXT 갱신
    }`,
`    // 수정여왕 회전 금지: 발동 직후 새로 나올 미노(큐 0번)는 그대로 두고, 그다음 NEXT 2개(큐 1·2번)만 개체째 잠금 (고정될 때까지 회전 불가)
    // 이 능력은 미노가 고정된 직후, 다음 미노를 큐에서 꺼내기 전에 발동하므로 큐 0번이 곧 등장할 미노다.
    // 잠금은 MinoState 에 저장돼 큐·Hold 를 옮겨 다녀도 그 미노를 따라가고, 이미 잠긴 미노가 대상이면 그대로 둔다
    public void LockNextRotation()
    {
        int index = 0; // 큐 안의 순서 (0 = 발동 직후 새로 나올 미노)
        foreach (MinoState mino in queue)
        {
            if (index == 1 || index == 2) mino.RotationLocked = true; // 1·2번만 잠금 (0번과 세 번째 이후는 건드리지 않음)
            index++; // 다음 순서로
            if (index > 2) break; // 3번 이후는 볼 필요 없음
        }
        OnQueueChanged?.Invoke(PeekNext()); // 침식 표시로 NEXT 갱신
    }`]]);
edit('Managers/CombatManager.cs', [[
'        if (queenLocksRotation) BagManager.Instance.LockNextRotation(); // NEXT 맨 위 미노 회전 금지',
'        if (queenLocksRotation) BagManager.Instance.LockNextRotation(); // 발동 직후 새로 나올 미노 다음의 NEXT 2개 회전 금지']]);
