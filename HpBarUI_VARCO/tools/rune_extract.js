// 사용자가 올린 룬 그림(파랑/금색, 1254x1254)을 9x9 도트 스프라이트로 변환. 작업 폴더에만 저장
// 한 칸 = 가로 300/9, 세로 311/9 (경계 상자를 9칸으로 나눠 칸 가운데 색을 읽음), 배경(흰색)은 투명
const p = require('../../PauseUI_VARCO/tools/pix.js');
const N = 9;
for (const n of ['blue', 'gold']) {
  const a = p.decode(`${__dirname}/../refs/ref_rune_${n}.png`);
  const isBg = (i) => a.d[i + 3] < 10 || (a.d[i] > 235 && a.d[i + 1] > 235 && a.d[i + 2] > 235);
  let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
  for (let y = 0; y < a.h; y++) for (let x = 0; x < a.w; x++) if (!isBg((y * a.w + x) * 4)) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const cw = (x1 - x0 + 1) / N, ch = (y1 - y0 + 1) / N, out = p.blank(N, N), pal = {};
  for (let cy = 0; cy < N; cy++) for (let cx = 0; cx < N; cx++) {
    // 칸 가운데 3x3 영역의 평균색 (경계 번짐을 피함)
    const mx = Math.round(x0 + (cx + 0.5) * cw), my = Math.round(y0 + (cy + 0.5) * ch); let s = [0, 0, 0], k = 0, bg = 0;
    for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { const i = ((my + dy) * a.w + mx + dx) * 4; if (isBg(i)) { bg++; continue; } s[0] += a.d[i]; s[1] += a.d[i + 1]; s[2] += a.d[i + 2]; k++; }
    if (bg > 24 || k === 0) continue; // 대부분 배경이면 투명
    const o = (cy * N + cx) * 4, c = s.map(v => Math.round(v / k)); out.d[o] = c[0]; out.d[o + 1] = c[1]; out.d[o + 2] = c[2]; out.d[o + 3] = 255;
    const key = c.join(','); pal[key] = (pal[key] || 0) + 1;
  }
  // 색을 비슷한 것끼리 합침 (거리 30 이하)
  const reps = []; const map = {};
  for (const key of Object.keys(pal).sort((u, v) => pal[v] - pal[u])) { const c = key.split(',').map(Number); let r = reps.find(q => Math.abs(q[0] - c[0]) + Math.abs(q[1] - c[1]) + Math.abs(q[2] - c[2]) < 40); if (!r) { r = c; reps.push(r); } map[key] = r; }
  for (let i = 0; i < N * N; i++) { if (!out.d[i * 4 + 3]) continue; const r = map[[out.d[i * 4], out.d[i * 4 + 1], out.d[i * 4 + 2]].join(',')]; out.d[i * 4] = r[0]; out.d[i * 4 + 1] = r[1]; out.d[i * 4 + 2] = r[2]; }
  p.encode(out, `${__dirname}/../parts/layers/T_SkillRune_${n}.png`);
  console.log(n, 'bbox', x0, y0, x1, y1, 'cell', cw.toFixed(1), ch.toFixed(1), 'colors', reps.length, reps.map(c => '#' + c.map(v => v.toString(16).padStart(2, '0')).join('')).join(' '));
  const idx = {}; reps.forEach((c, i) => idx[c.join(',')] = 'abcdefgh'[i]);
  for (let y = 0; y < N; y++) { let l = ''; for (let x = 0; x < N; x++) { const o = (y * N + x) * 4; l += out.d[o + 3] ? idx[[out.d[o], out.d[o + 1], out.d[o + 2]].join(',')] : '.'; } console.log('  ' + l); }
}
