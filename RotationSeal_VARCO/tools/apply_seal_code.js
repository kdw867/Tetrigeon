// 회전 금지 표식 코드 수정 (CRLF·BOM 유지, 한국어 줄 주석): RotationLockSeal 의 알파 깜박임(0.68~0.92)을 없애 표식이 항상 불투명(프리팹 색 흰색·알파 1)으로 보이게 한다. 바꿀 곳이 정확히 1곳인지 확인.
const fs = require('fs'), path = require('path');
const f = path.join(__dirname, '..', '..', 'Tetrigeon', 'Assets', '@Scripts', 'Visuals', 'RotationLockSeal.cs'); let t = fs.readFileSync(f, 'utf8');
const rep = (a, b) => { const A = a.replace(/\n/g, '\r\n'), B = b.replace(/\n/g, '\r\n'), n = t.split(A).length - 1; if (n !== 1) throw new Error('바꿀 부분이 ' + n + '곳: ' + a.slice(0, 60)); t = t.replace(A, () => B); };
rep('    private SpriteRenderer sealRenderer; // 밝기를 바꿀 렌더러\n', '');
rep(`
    private void Awake()
    {
        sealRenderer = GetComponent<SpriteRenderer>(); // 매 프레임 컴포넌트 검색 방지
    }

    private void Update()
    {
        float alpha = 0.80f + 0.12f * Mathf.Sin(Time.time * Mathf.PI * 1.5f); // 크기·방향은 고정하고 밝기만 천천히 변화
        sealRenderer.color = new Color(1f, 1f, 1f, alpha); // 원본 보라색 유지
    }
`, '');
rep('// NEXT·HOLD·조작 중인 미노에 공통으로 쓰는 회전 잠금 표식\n', '// NEXT·HOLD·조작 중인 미노에 공통으로 쓰는 회전 잠금 표식 (프리팹의 스프라이트를 항상 불투명하게 그대로 표시)\n');
fs.writeFileSync(f, t, 'utf8'); console.log('RotationLockSeal.cs 수정 완료');
