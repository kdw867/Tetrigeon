// 원화(T_CrystalQueen.png)와 게임 Idle 01 의 도트 해상도 비교 (작업 폴더 전용)
const p = require('../../PauseUI_VARCO/tools/pix.js');
const t = p.decode('C:/Users/MBC-501-15/Documents/Tetrigeon/Tetrigeon/Assets/@Resources/Enemies/T_CrystalQueen.png');
const idle = p.crop(p.decode('C:/Users/MBC-501-15/Documents/Tetrigeon/Tetrigeon/Assets/@Resources/Enemies/CrystalQueenIdle/T_CrystalQueen_Idle.png'), 0, 0, 160, 160);
const bbox = (im) => { let x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1; for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) if (im.d[(y * im.w + x) * 4 + 3] > 0) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } return { x0, x1, y0, y1, w: x1 - x0 + 1, h: y1 - y0 + 1 }; };
const bt = bbox(t), bi = bbox(idle); console.log('원화 bbox', JSON.stringify(bt), '| Idle 01 bbox', JSON.stringify(bi));
console.log('원화 alpha 값 종류', (() => { const s = new Set(); for (let i = 0; i < t.w * t.h; i++) s.add(t.d[i * 4 + 3]); return [...s].slice(0, 8).join(','); })());
// 같은 색 가로 런 길이 히스토그램 (불투명 픽셀만)
const runs = (im, x0, x1, y0, y1) => { const h = {}; for (let y = y0; y <= y1; y++) { let r = 1; for (let x = x0 + 1; x <= x1 + 1; x++) { const same = x <= x1 && im.d[(y * im.w + x) * 4 + 3] && im.d.compare(im.d, (y * im.w + x) * 4, (y * im.w + x) * 4 + 3, (y * im.w + x - 1) * 4, (y * im.w + x - 1) * 4 + 3) === 0; if (same) r++; else { if (im.d[(y * im.w + x - 1) * 4 + 3]) h[r] = (h[r] || 0) + 1; r = 1; } } } return h; };
const top = (h, n) => Object.entries(h).sort((a, b) => b[1] - a[1]).slice(0, n).map(e => e.join(':')).join('  ');
console.log('원화 런 길이 상위', top(runs(t, bt.x0, bt.x1, bt.y0, bt.y1), 10));
console.log('Idle 런 길이 상위', top(runs(idle, bi.x0, bi.x1, bi.y0, bi.y1), 10));
// 원화의 도트 간격 추정: 색이 바뀌는 가로 경계 위치 간격의 최빈값
const edges = {}; for (let y = bt.y0; y <= bt.y1; y += 3) { let last = -1; for (let x = bt.x0 + 1; x <= bt.x1; x++) { const a = (y * t.w + x) * 4, b = a - 4; if (t.d[a + 3] && t.d[b + 3] && t.d.compare(t.d, a, a + 3, b, b + 3) !== 0) { if (last >= 0) { const g = x - last; edges[g] = (edges[g] || 0) + 1; } last = x; } } }
console.log('원화 경계 간격 상위', top(edges, 12));
