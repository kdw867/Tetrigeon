// Plan.md 표식 설명을 "판 없는" 최종안에 맞게 고침 (영어, CRLF+BOM 유지, 정확히 한 곳만)
const fs = require('fs'), path = require('path');
const f = path.join(__dirname, '..', '..', 'Tetrigeon', 'Plan.md'); let t = fs.readFileSync(f, 'utf8');
const rep = (a, b) => { const A = a.replace(/\n/g, '\r\n'), B = b.replace(/\n/g, '\r\n'), n = t.split(A).length - 1; if (n !== 1) throw new Error('바꿀 부분이 ' + n + '곳: ' + a.slice(0, 70)); t = t.replace(A, () => B); };
rep(`two clockwise arrowhead arcs around a padlock on a
    dark disc in blue violet and white, 27x27 dots = 54 px on screen). Original block colors remain unchanged; the ghost`,
`two clockwise arrowhead arcs around a padlock in
    blue violet and white with a dark outline and no backing plate, 27x27 dots = 54 px on screen). Original block colors
    remain unchanged; the ghost`);
fs.writeFileSync(f, t, 'utf8'); console.log('Plan.md 수정 완료');
