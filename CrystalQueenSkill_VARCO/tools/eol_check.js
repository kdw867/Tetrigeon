// 줄 끝 형식 확인 (읽기 전용 진단): 파일별 전체 줄 수 / CRLF 줄 수 / LF 단독 줄 수
const fs = require('fs'), path = require('path');
const R = path.join(__dirname, '..', '..', 'Tetrigeon', 'Assets', '@Scripts');
for (const f of process.argv.slice(2)) { const t = fs.readFileSync(path.join(R, f), 'utf8'); const crlf = (t.match(/\r\n/g) || []).length, lf = (t.match(/\n/g) || []).length - crlf; console.log(f.padEnd(34), 'CRLF', crlf, 'LF단독', lf, 'BOM', t.charCodeAt(0) === 0xFEFF); }
