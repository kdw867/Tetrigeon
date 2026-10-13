// Plan.md: 타겟 화살표 겹침 문장을 플레이 모드에서 확인한 사실로 수정 (CRLF·BOM 유지, 1곳)
const fs = require('fs'), path = require('path'); const f = path.join(__dirname, '..', '..', 'Tetrigeon', 'Plan.md'); let t = fs.readFileSync(f, 'utf8');
const a = "    target arrow above the Queen can overlap the crown while she is targeted. Not yet played by hand in a full run.", b = "    target arrow above the Queen (drawn on top of everything) covers the lower centre of the crown while she is the\r\n    target (seen in play mode, not changed). Not yet played by hand in a full run.";
const n = t.split(a).length - 1; if (n !== 1) throw new Error('바꿀 부분 ' + n + '곳'); t = t.replace(a, () => b);
if (t.charCodeAt(0) !== 0xFEFF) throw new Error('BOM 손실'); if ((t.match(/(?<!\r)\n/g) || []).length) throw new Error('LF 단독 줄'); fs.writeFileSync(f, t, 'utf8'); console.log('Plan.md 문장 수정 완료');
