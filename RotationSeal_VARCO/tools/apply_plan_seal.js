// Plan.md 의 회전 금지 표식 설명을 새 표식(수정여왕 회전 잠금 룬 메달)에 맞게 고침 (영어, CRLF+BOM 유지, 정확히 한 곳만)
const fs = require('fs'), path = require('path');
const f = path.join(__dirname, '..', '..', 'Tetrigeon', 'Plan.md'); let t = fs.readFileSync(f, 'utf8');
const rep = (a, b) => { const A = a.replace(/\n/g, '\r\n'), B = b.replace(/\n/g, '\r\n'), n = t.split(A).length - 1; if (n !== 1) throw new Error('바꿀 부분이 ' + n + '곳: ' + a.slice(0, 70)); t = t.replace(A, () => B); };
rep(`A small purple crown / rotation-prohibition seal is centered over the mino in NEXT, Hold and the active piece
    (visual updated 2026-10-14). Original block colors remain unchanged; the ghost has no seal. The seal gently
    pulses in opacity without rotating, follows the mino, and disappears on lock or when its view is removed.`,
`A rotation seal is centered over the mino in NEXT, Hold and the active piece
    (visual updated 2026-10-14: it is the Queen's rotation lock rune, two clockwise arrowhead arcs around a padlock on a
    dark disc in blue violet and white, 27x27 dots = 54 px on screen). Original block colors remain unchanged; the ghost
    has no seal. The seal is always fully opaque, neither rotates nor pulses, follows the mino, and disappears on lock
    or when its view is removed.`);
fs.writeFileSync(f, t, 'utf8'); console.log('Plan.md 수정 완료');
