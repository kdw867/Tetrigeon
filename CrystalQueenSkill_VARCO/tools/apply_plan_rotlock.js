// Plan.md 에 수정여왕 회전 잠금 대상 지정 변경(2026-10-14) 기록 (영어, CRLF·BOM 유지, 정확히 1곳씩만 바꿈)
const fs = require('fs'), path = require('path');
const f = path.join(__dirname, '..', '..', 'Tetrigeon', 'Plan.md'); let t = fs.readFileSync(f, 'utf8');
if (t.charCodeAt(0) !== 0xFEFF) throw new Error('BOM 없음');
const rep = (a, b) => { const A = a.replace(/\n/g, '\r\n'), B = b.replace(/\n/g, '\r\n'), n = t.split(A).length - 1; if (n !== 1) throw new Error('바꿀 부분 ' + n + '곳: ' + a.slice(0, 50)); t = t.replace(A, () => B); };
// 1) 머리 날짜 목록
rep('Queen growth skill motion: 2026-10-13)', 'Queen growth skill motion: 2026-10-13; Queen rotation lock targets: 2026-10-14)');
// 2) 몬스터 스킬 표
rep('rotation lock seals the top NEXT mino |', 'rotation lock seals the two NEXT minos that come after the one appearing right away |');
// 3) 회전 잠금 항목 + Hold 항목
rep(`- Rotation lock: only the top NEXT mino. It cannot rotate until it locks;
  moving, soft drop, and hard drop still work. It is shown slightly darkened
  (eroded tint) in NEXT, Hold, the active piece, and its ghost; the tint ends on lock.
- Hold keeps the growth and the rotation lock. Top Out's bag reset discards
  modified NEXT minos like any other remaining bag piece. T-Spin detection is
  unchanged.`,
`- Rotation lock (targets changed 2026-10-14, implemented): the skill fires right after a mino locks and before the next
  mino is taken from the queue, so the front mino of NEXT at that instant is the one that appears right after the
  skill. That mino stays normal; the next two NEXT minos get the lock; every later mino is normal. Example: if the
  coming order is T -> I -> S -> O, then T is normal, I is locked, S is locked, O is normal. A mino that is already
  being controlled is never given a new lock, and the Hold content is never a target.
  - The lock belongs to the individual mino (its \`MinoState\`), not to a mino type or a NEXT slot. It follows that mino
    when the queue moves (also across the bag boundary) and when it goes into Hold and comes back out, and it never
    moves to another mino, even one of the same type. A mino that is already locked keeps its lock, and no third mino
    is added. The extra cell from growth and the upgrade crystals are untouched, so one mino can carry both a grown
    cell and the lock. There is no separate counter: the existing per-mino flag is reused
    (\`BagManager.LockNextRotation\`).
  - A locked mino cannot rotate (clockwise, counterclockwise or 180 degrees). A blocked rotation changes nothing:
    orientation, position, wall kick, the T-Spin rotation record, lock delay and the DAS cut stay as they were.
    Moving, soft drop, and hard drop still work. The lock role ends when the mino locks. It is shown slightly
    darkened (eroded tint) in NEXT, Hold, the active piece, and its ghost, following the real lock state; the tint
    ends on lock.
  - Verified 2026-10-14 in play mode (stage 10) through the real lock -> bag settlement -> Queen skill -> next spawn
    path, the real Top Out coroutine, and direct calls for Hold swaps, rotation input handlers and bag boundaries.
    Real key presses (Z / X / Up / A) could not be injected into the editor and are not verified.
- Hold keeps the growth and the rotation lock of the mino placed in it. Swapping with a normal mino never moves a lock
  onto it. Hold charges and the other Hold rules are unchanged. Top Out's bag reset discards the NEXT minos together
  with their locks like any other remaining bag piece, and the Hold is cleared as before, so no lock carries over. A
  new stage or a new game starts with no locks. T-Spin detection is unchanged.`);
if (t.charCodeAt(0) !== 0xFEFF) throw new Error('BOM 손실'); if ((t.match(/(?<!\r)\n/g) || []).length) throw new Error('LF 단독 줄');
fs.writeFileSync(f, t, 'utf8'); console.log('Plan.md 수정 완료, BOM 유지, LF 단독 0');
