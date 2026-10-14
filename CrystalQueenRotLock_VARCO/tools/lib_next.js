// NEXT 연결 제안 합성 도우미 (작업 폴더 전용, 비주얼 제안이며 실제 UI 아님): 맨 위 두 칸 미노 둘레를 푸른 보라 점선으로 강조 + 오른쪽에 자물쇠 아이콘. 미노 픽셀은 절대 바꾸지 않는다.
const L = require('./lib_view.js'), { p, F, put } = L;
const ICON = (() => { const o = p.blank(7, 9); F.LOCK_UI.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === '.') return; const c = F.PAL[ch], q = (y * 7 + x) * 4; o.d[q] = c[0]; o.d[q + 1] = c[1]; o.d[q + 2] = c[2]; o.d[q + 3] = 255; })); return o; })();
function nextMarks(scr) {
  const px = (x, y) => (y * scr.w + x) * 4, bg = [scr.d[px(1215, 530)], scr.d[px(1215, 530) + 1], scr.d[px(1215, 530) + 2]]; // 두루마리 안쪽 바탕색
  const diff = (x, y) => Math.max(Math.abs(scr.d[px(x, y)] - bg[0]), Math.abs(scr.d[px(x, y) + 1] - bg[1]), Math.abs(scr.d[px(x, y) + 2] - bg[2]));
  const slots = [[454, 520], [548, 618]].map(([y0, y1]) => { // 맨 위 두 칸(J, S 미노)의 화면 영역
    const mask = new Set(); let bx1 = -1, by0 = 9999, by1 = -1;
    for (let y = y0; y < y1; y++) for (let x = 1222; x < 1312; x++) if (diff(x, y) > 28) { mask.add(x + ',' + y); bx1 = Math.max(bx1, x); by0 = Math.min(by0, y); by1 = Math.max(by1, y); }
    let cur = new Set(mask); const dist = new Map(); mask.forEach(k => dist.set(k, 0)); // 미노 실루엣에서의 거리(체비쇼프)
    for (let d = 1; d <= 6; d++) { const nxt = new Set(); cur.forEach(k => { const [x, y] = k.split(',').map(Number); for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const q = (x + dx) + ',' + (y + dy); if (!dist.has(q)) { dist.set(q, d); nxt.add(q); } } }); cur = nxt; }
    const ring = []; dist.forEach((d, k) => { if (d < 3 || mask.has(k)) return; const [x, y] = k.split(',').map(Number); if (diff(x, y) > 28) return; ring.push([x, y, d]); }); // 3~6px 띄운 띠, 바탕색인 픽셀만
    return { mask, ring, icon: [bx1 + 10, Math.round((by0 + by1) / 2) - 9] };
  });
  const set = (o, x, y, c) => { const q = (y * o.w + x) * 4; o.d[q] = c[0]; o.d[q + 1] = c[1]; o.d[q + 2] = c[2]; o.d[q + 3] = 255; };
  return {
    slots, apply(o, level, icon) { // level: 'full'(안쪽 c + 바깥 b 바둑판) / 'inner'(안쪽 c 만) / 'none'
      if (level !== 'none') for (const s of slots) for (const [x, y, d] of s.ring) { if (d <= 4) set(o, x, y, F.PAL.c); else if (level === 'full' && (((x >> 1) + (y >> 1)) % 2 === 0)) set(o, x, y, F.PAL.b); }
      if (icon) for (const s of slots) put(o, ICON, s.icon[0], s.icon[1], 2, [0, 0]);
    }
  };
}
module.exports = { ICON, nextMarks };
