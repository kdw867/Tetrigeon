// 승인 원화와 VARCO 결과의 몸 영역·마디 경계(윗선 골짜기)·발 돌 위치를 숫자로 비교 (작업 폴더 전용)
const path = require('path');
const p = require('../../PauseUI_VARCO/tools/pix.js');
function mask(img, white) { const m = new Uint8Array(img.w * img.h); for (let i = 0; i < m.length; i++) { const o = i * 4; m[i] = img.d[o + 3] < 128 ? 0 : (white ? ((255 - img.d[o]) + (255 - img.d[o + 1]) + (255 - img.d[o + 2]) > 120 ? 1 : 0) : 1); } return m; }
function stats(name, img, white) {
  const m = mask(img, white), W = img.w, H = img.h;
  let x0 = W, y0 = H, x1 = -1, y1 = -1; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (m[y * W + x]) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
  // 윗선(각 열의 맨 위 y)을 bbox 기준 0~1로 정규화하고, 두 개의 골짜기(마디 사이)를 찾음
  const top = []; for (let x = x0; x <= x1; x++) { let t = -1; for (let y = y0; y <= y1; y++) if (m[y * W + x]) { t = y; break; } top.push(t); }
  const valleys = []; for (let i = 8; i < top.length - 8; i++) { const win = top.slice(i - 8, i + 9); if (top[i] === Math.max(...win) && top[i] - Math.min(...win) > bh * 0.06) valleys.push(i); }
  // 가까운 골짜기는 하나로 묶기
  const vs = []; valleys.forEach(v => { if (!vs.length || v - vs[vs.length - 1] > 20) vs.push(v); });
  // 바닥 가까운 행(발 돌 줄)에서 불투명 구간 목록
  const row = y1 - Math.round(bh * 0.07), segs = []; let s = -1; for (let x = x0; x <= x1 + 1; x++) { const on = x <= x1 && m[row * W + x]; if (on && s < 0) s = x; if (!on && s >= 0) { if (x - s > bw * 0.02) segs.push([s - x0, x - 1 - x0]); s = -1; } }
  console.log(name.padEnd(8), 'bbox', x0, y0, x1, y1, ' w', bw, 'h', bh, ' w/h', (bw / bh).toFixed(3), ' valleys(rel 0~1)', vs.map(v => (v / bw).toFixed(3)).join(','), ' footrow segs(rel)', segs.map(([a, b]) => (a / bw).toFixed(2) + '-' + (b / bw).toFixed(2)).join(' '));
}
stats('source', p.decode(path.join(__dirname, '..', 'work', 'user_upload_caterpillar.png')), false);
stats('windup', p.decode(path.join(__dirname, '..', 'work', 'varco_round1', 'pose_windup_raw.png')), true);
stats('strike', p.decode(path.join(__dirname, '..', 'work', 'varco_round1', 'pose_strike_raw.png')), true);
