// Plan.md 수정 (영문 문서, CRLF + BOM 유지): 6장에 레미 공격 모션 항목(work/plan_lemy_block.txt)을 추가하고 머리 날짜를 갱신한다. 바꿀 곳이 정확히 1곳인지 확인한다.
const fs = require('fs'), path = require('path');
const f = path.join(__dirname, '..', '..', 'Tetrigeon', 'Plan.md'); let t = fs.readFileSync(f, 'utf8'); if (t.charCodeAt(0) !== 0xFEFF) throw new Error('BOM 없음');
const block = fs.readFileSync(path.join(__dirname, '..', 'work', 'plan_lemy_block.txt'), 'utf8').replace(/\r?\n/g, '\n');
const rep = (a, b) => { const A = a.replace(/\n/g, '\r\n'), B = b.replace(/\n/g, '\r\n'), n = t.split(A).length - 1; if (n !== 1) throw new Error('바꿀 곳 ' + n + '개: ' + a.slice(0, 70)); t = t.replace(A, () => B); };
rep('Guardian shield skill motion: 2026-10-16)', 'Guardian shield skill motion: 2026-10-16; Lemy attack motion: 2026-10-16)');
rep('upgrade abilities (section 7). Special pieces are not implemented.\n', 'upgrade abilities (section 7). Special pieces are not implemented.\n' + block);
fs.writeFileSync(f, t, 'utf8'); const b = fs.readFileSync(f); console.log('저장 BOM', b[0] === 0xEF && b[1] === 0xBB && b[2] === 0xBF, 'LF만 있는 줄', (b.toString().replace(/\r\n/g, '').match(/\n/g) || []).length);
