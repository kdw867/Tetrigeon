// VARCO 로고(Logo_Gpt_01) 후처리: 흰 바탕 제거 → 블록 하나 = 25도트로 축소 → 수정 블록 자리에 확정 수정 블록(MinoCrystal_VARCO lesswhite)을 그대로 넣음. 화면에는 2배로 표시 (Unity에는 넣지 않음)
const path = require('path'), px = require('../../PauseUI_VARCO/tools/pix.js');
const ROOT = path.join(__dirname, '..'), CRY = ROOT + '/../MinoCrystal_VARCO/work'; // 확정 수정 블록 (tile_{종류}_x8.png, lesswhite 최종 실행본)
const SRC = process.argv[2] || 'Logo_Gpt_01', PITCH = 47, N = 25; // 생성 이미지의 블록 간격(px), 게임 블록 도트 크기
const hsl = (d, i) => { const r = d[i] / 255, g = d[i + 1] / 255, b = d[i + 2] / 255, M = Math.max(r, g, b), m = Math.min(r, g, b), l = (M + m) / 2, dd = M - m; const s = dd ? dd / (1 - Math.abs(2 * l - 1)) : 0; let h = 0; if (dd) h = M === r ? ((g - b) / dd + 6) % 6 : M === g ? (b - r) / dd + 2 : (r - g) / dd + 4; return [h * 60, s, l]; };
function comps(img, test) { // 조건에 맞는 픽셀의 연결 영역 목록
  const { w, h } = img, seen = new Uint8Array(w * h), out = [];
  for (let i = 0; i < w * h; i++) {
    if (seen[i] || !test(i)) continue;
    const st = [i], px_ = []; seen[i] = 1;
    while (st.length) { const j = st.pop(); px_.push(j); const x = j % w; for (const k of [x > 0 ? j - 1 : -1, x < w - 1 ? j + 1 : -1, j - w, j + w]) if (k >= 0 && k < w * h && !seen[k] && test(k)) { seen[k] = 1; st.push(k); } }
    let x0 = w, y0 = h, x1 = 0, y1 = 0; for (const j of px_) { const x = j % w, y = (j / w) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } // 큰 영역도 되게 반복문으로
    out.push({ px: px_, x0, y0, x1, y1 });
  }
  return out;
}
function resize(img, W, H) { // 면적 평균 축소 (알파 가중), 알파는 0/255
  const o = px.blank(W, H), fx = img.w / W, fy = img.h / H;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let r = 0, g = 0, b = 0, a = 0, n = 0;
    for (let sy = Math.floor(y * fy); sy < Math.floor((y + 1) * fy); sy++) for (let sx = Math.floor(x * fx); sx < Math.floor((x + 1) * fx); sx++) { const i = (sy * img.w + sx) * 4, al = img.d[i + 3]; r += img.d[i] * al; g += img.d[i + 1] * al; b += img.d[i + 2] * al; a += al; n++; }
    const i = (y * W + x) * 4; if (a) { o.d[i] = r / a; o.d[i + 1] = g / a; o.d[i + 2] = b / a; } o.d[i + 3] = a / n >= 128 ? 255 : 0;
  }
  return o;
}

// 1. 흰 바탕 제거: 바깥 바탕 + O·R·G 안쪽 구멍만 투명, 돌 하이라이트와 수정 반짝임은 보존
const src = px.decode(`${ROOT}/generated/${SRC}.png`), sd = src.d;
const nearWhite = i => sd[i * 4] >= 232 && sd[i * 4 + 1] >= 232 && sd[i * 4 + 2] >= 232;
for (const c of comps(src, nearWhite)) { // 큰 흰 영역 또는 둘레 절반 이상이 어두운 외곽선인 흰 영역 = 바탕 (돌 하이라이트·수정 반짝임은 둘레가 돌·수정 색이라 남음)
  let edge = 0, dark = 0;
  for (const j of c.px) { const x = j % src.w; for (const k of [x > 0 ? j - 1 : -1, x < src.w - 1 ? j + 1 : -1, j - src.w, j + src.w]) { if (k < 0 || k >= src.w * src.h || nearWhite(k)) continue; edge++; if (Math.max(sd[k * 4], sd[k * 4 + 1], sd[k * 4 + 2]) < 90) dark++; } }
  let r = 0, b = 0; for (const j of c.px) { r += sd[j * 4]; b += sd[j * 4 + 2]; } // 바탕 흰색은 중립·푸른빛, 돌 하이라이트·이음선 심은 파랑이 빨강보다 낮음
  const bw = c.x1 - c.x0 + 1, bh = c.y1 - c.y0 + 1, gapLike = c.px.length > 100 && b >= r - c.px.length && Math.max(bw, bh) >= 2 * Math.min(bw, bh); // 블록 사이로 보이는 길쭉한 바탕 틈 (하이라이트·반짝임은 둥근 덩어리)
  if (c.px.length > 300 || dark > edge * 0.5 || gapLike) c.px.forEach(j => sd.fill(0, j * 4, j * 4 + 4));
}
const t = px.trim(src).img;

// 2. 블록 하나 = 25도트가 되게 축소 + 색 정리
const f = PITCH / N, logo = px.kmeans(resize(t, Math.round(t.w / f), Math.round(t.h / f)), 64, 20), ld = logo.d;

// 3. 확정 수정 블록 25×25 복원 (×8 미리보기를 칸 중심에서 샘플, 미리보기 바탕색은 투명)
const TYPE_BY_HUE = [[183, 'I'], [225, 'J'], [30, 'L'], [54, 'O'], [102, 'S'], [275, 'T'], [3, 'Z']]; // 시트에서 잰 수정 블록 색조 → 미노 종류
const tiles = {};
for (const [, T] of TYPE_BY_HUE) {
  const s = px.decode(`${CRY}/tile_${T}_x8.png`), o = px.blank(N, N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const i = ((y * 8 + 4) * s.w + x * 8 + 4) * 4; if (s.d[i] === 30 && s.d[i + 1] === 40 && s.d[i + 2] === 62) continue; s.d.copy(o.d, (y * N + x) * 4, i, i + 3); o.d[(y * N + x) * 4 + 3] = 255; }
  const dark = (x, y) => { const i = (y * N + x) * 4; return o.d[i + 3] < 128 || Math.max(o.d[i], o.d[i + 1], o.d[i + 2]) < 75; }; // 수정 블록 외곽선
  let l = 0; while (dark(l, N >> 1)) l++; let r = N - 1; while (dark(r, N >> 1)) r--; let tp = 0; while (dark(N >> 1, tp)) tp++; let b = N - 1; while (dark(N >> 1, b)) b--;
  tiles[T] = { o, l, tp, r, b }; // 외곽선 안쪽 범위
}
const hueDist = (a, b) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b));

// 4. 수정 블록 찾기 (채도 높고 밝은 면) → 붙은 영역은 블록 크기로 나눔 → 확정 수정 블록 안쪽을 최근접으로 채움
const crystal = i => { const [, s, l] = hsl(ld, i * 4); return ld[i * 4 + 3] && s > 0.45 && l > 0.35 && l < 0.92; };
const found = [];
function paste(T, X0, Y0, X1, Y1) { // 확정 수정 블록 안쪽을 사각 범위에 최근접으로 채움
  const tl = tiles[T];
  for (let y = Y0; y <= Y1; y++) for (let x = X0; x <= X1; x++) {
    const tx = tl.l + Math.min(tl.r - tl.l, Math.floor((x - X0 + 0.5) / (X1 - X0 + 1) * (tl.r - tl.l + 1))), ty = tl.tp + Math.min(tl.b - tl.tp, Math.floor((y - Y0 + 0.5) / (Y1 - Y0 + 1) * (tl.b - tl.tp + 1)));
    const s = (ty * N + tx) * 4, di = (y * logo.w + x) * 4; tl.o.d.copy(ld, di, s, s + 3); ld[di + 3] = 255; // 블록 안의 빈 점까지 확정 수정으로 채움
  }
  found.push(`${T}@${X0},${Y0} ${X1 - X0 + 1}x${Y1 - Y0 + 1}`);
}
for (const c of comps(logo, crystal)) {
  const w = c.x1 - c.x0 + 1, h = c.y1 - c.y0 + 1; if (w < 12 || h < 12 || c.px.length < 120 || c.px.length / (w * h) < 0.6) continue; // 이음선(가는 선)과 색 균열이 섞인 돌(채움 비율 낮음)은 제외
  const hues = c.px.map(j => { const x = j % logo.w, y = (j / logo.w) | 0, sx = Math.floor((x + 0.5) * t.w / logo.w), sy = Math.floor((y + 0.5) * t.h / logo.h); return hsl(t.d, (sy * t.w + sx) * 4)[0]; }).sort((a, b) => a - b), hue = hues[hues.length >> 1], T = TYPE_BY_HUE.slice().sort((a, b) => hueDist(a[0], hue) - hueDist(b[0], hue))[0][1]; // 색조는 축소·색 정리 전 원본에서 (색 정리로 빨강이 주황 쪽으로 밀리지 않게)
  const nx = Math.max(1, Math.round(w / (N - 1))), ny = Math.max(1, Math.round(h / (N - 1))); // 가로·세로로 붙은 블록 수
  for (let by = 0; by < ny; by++) for (let bx = 0; bx < nx; bx++)
    paste(T, c.x0 + Math.round(bx * w / nx), c.y0 + Math.round(by * h / ny), c.x0 + Math.round((bx + 1) * w / nx) - 1, c.y0 + Math.round((by + 1) * h / ny) - 1);
}
// 4-1. G 오른쪽 아래 반쪽 초록 수정 고치기 (Logo_Gpt_01 전용, 좌표는 25도트 기준): 생성본 G의 오른쪽 기둥 마지막 돌이 아래 줄 높이까지 내려와 초록이 반쪽으로 끼어 있음
// → 반쪽 초록을 온전한 한 칸(24×23)으로: 위 기둥 돌은 세로 23→19도트로 줄이고, 새 초록은 2도트 내려 아래 줄 왼쪽 돌과 밑변을 맞춤
if (SRC === 'Logo_Gpt_01') {
  const at = (x, y) => (y * logo.w + x) * 4, BAND = [21, 28, 39], EDGE = [9, 12, 19]; // 글자 외곽선 띠 남색, 블록 사이 안쪽 선 (G 아래 외곽선에서 잰 색)
  const fill = (x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const i = at(x, y); ld[i] = c[0]; ld[i + 1] = c[1]; ld[i + 2] = c[2]; ld[i + 3] = 255; } };
  const stone = px.crop(logo, 484, 80, 22, 23); // 오른쪽 기둥 마지막 돌 (줄이기 전 원본)
  for (let y = 18; y < 23; y++) stone.d.copy(stone.d, y * 22 * 4, (y * 22 + 8) * 4, (y * 22 + 16) * 4); // 아래 5줄 왼쪽 8도트에 걸친 반쪽 초록을 같은 줄 오른쪽 돌로 덮음
  for (let y = 0; y < 19; y++) stone.d.copy(ld, at(484, 80 + y), Math.floor((y + 0.5) * 23 / 19) * 22 * 4, (Math.floor((y + 0.5) * 23 / 19) + 1) * 22 * 4); // 돌 세로 23→19 (최근접)
  fill(484, 99, 505, 99, EDGE); // 줄인 돌 아래 틈
  fill(476, 97, 483, 99, EDGE); fill(476, 100, 477, 122, EDGE); // 왼쪽 초록과 새 초록 사이 틈 (반쪽 초록 윗부분 자리 포함)
  fill(502, 100, 502, 123, EDGE); fill(503, 100, 507, 127, BAND); fill(478, 123, 501, 123, EDGE); // 새 초록 오른쪽·아래 테두리 → 글자 외곽선과 이어짐
  found.splice(found.findIndex(f => f.startsWith('S@478,98')), 1); // 반쪽 초록은 목록에서 빼고
  paste('S', 478, 100, 501, 122); // 온전한 한 칸 초록 수정
}
px.encode(logo, `${ROOT}/parts/T_Title_Logo.png`);
px.encode(px.nearestUp(logo, 4, [30, 40, 62]), `${ROOT}/parts/preview/T_Title_Logo_x4.png`);

// 5. 타이틀 미리보기에 2배로 얹기 (화면 위쪽 가운데)
const bg = px.decode(`${ROOT}/preview/Title_Layers_FHD.png`), C = 2, ox = (bg.w - logo.w * C) >> 1, oy = 50; // 아치 꼭대기(약 y 318)와 겹치지 않게
for (let y = 0; y < logo.h * C; y++) for (let x = 0; x < logo.w * C; x++) { const s = (((y / C) | 0) * logo.w + ((x / C) | 0)) * 4; if (!ld[s + 3]) continue; ld.copy(bg.d, ((oy + y) * bg.w + ox + x) * 4, s, s + 3); }
px.encode(bg, `${ROOT}/preview/Title_Logo_FHD.png`);
console.log(SRC, 'logo', logo.w + 'x' + logo.h, 'screen', logo.w * C + 'x' + logo.h * C, 'at', ox + ',' + oy, '\ncrystal blocks', found.length, found.join(' | '));
