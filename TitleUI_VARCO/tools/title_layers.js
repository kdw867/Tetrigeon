// 타이틀 레이어 후처리: 생성 이미지 → 실제 도트 격자로 축소 + 배경 제거 + 색 축소 (Unity에는 넣지 않음)
// 표시 배율: 캐릭터·버튼 2배 (게임 몬스터와 같은 밀도). 배경·센티넬·퀸은 고해상도 재생성본 기준
const p = require('../../PauseUI_VARCO/tools/pix.js'), path = require('path'), fs = require('fs');
const R = path.join(__dirname, '..'), G = R + '/generated', OUT = R + '/parts', PRE = R + '/parts/preview';
fs.mkdirSync(PRE, { recursive: true });

// 테두리와 이어진 거의 흰색 픽셀만 투명화 (밝은 하이라이트가 테두리에 닿아도 기준색이 흰색 하나라 지워지지 않음)
function clearWhite(img, min = 232) {
  const { w, h, d } = img, seen = new Uint8Array(w * h), st = p.borderSeeds(img).map(([x, y]) => y * w + x);
  const white = i => d[i * 4] >= min && d[i * 4 + 1] >= min && d[i * 4 + 2] >= min;
  while (st.length) {
    const i = st.pop(); if (seen[i]) continue; seen[i] = 1;
    if (!white(i)) continue;
    d.fill(0, i * 4, i * 4 + 4);
    const x = i % w, y = (i - x) / w;
    if (x > 0) st.push(i - 1); if (x < w - 1) st.push(i + 1); if (y > 0) st.push(i - w); if (y < h - 1) st.push(i + w);
  }
  return img;
}
// 단색 배경(왼쪽 위 색)과 비슷한 테두리 연결 픽셀만 투명화 (버튼 시트용)
function clearFlat(img, tol = 30) {
  const { w, h, d } = img, bg = [d[0], d[1], d[2]], seen = new Uint8Array(w * h), st = p.borderSeeds(img).map(([x, y]) => y * w + x);
  const near = i => Math.abs(d[i * 4] - bg[0]) + Math.abs(d[i * 4 + 1] - bg[1]) + Math.abs(d[i * 4 + 2] - bg[2]) < tol;
  while (st.length) {
    const i = st.pop(); if (seen[i]) continue; seen[i] = 1;
    if (!near(i)) continue;
    d.fill(0, i * 4, i * 4 + 4);
    const x = i % w, y = (i - x) / w;
    if (x > 0) st.push(i - 1); if (x < w - 1) st.push(i + 1); if (y > 0) st.push(i - w); if (y < h - 1) st.push(i + w);
  }
  return img;
}
// 축소 후 알파를 0/255로 정리하고 색 축소 (반투명 가장자리 없음)
function finish(img, f, colors) {
  const s = resize(img, Math.round(img.w / f), Math.round(img.h / f)); // 투명도 가중 평균 (가장자리 어두워짐 방지)
  for (let i = 0; i < s.w * s.h; i++) s.d[i * 4 + 3] = s.d[i * 4 + 3] >= 128 ? 255 : 0;
  return p.trim(p.kmeans(s, colors, 20)).img;
}
function resize(img, W, H) { // 가로·세로 배율을 따로 둔 면적 평균 축소 (알파 가중)
  const o = p.blank(W, H), fx = img.w / W, fy = img.h / H;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let r = 0, g = 0, b = 0, a = 0, n = 0;
    for (let sy = Math.floor(y * fy); sy < Math.floor((y + 1) * fy); sy++) for (let sx = Math.floor(x * fx); sx < Math.floor((x + 1) * fx); sx++) {
      const i = (sy * img.w + sx) * 4, al = img.d[i + 3]; r += img.d[i] * al; g += img.d[i + 1] * al; b += img.d[i + 2] * al; a += al; n++;
    }
    const i = (y * W + x) * 4; if (a) { o.d[i] = r / a; o.d[i + 1] = g / a; o.d[i + 2] = b / a; } o.d[i + 3] = n ? a / n : 0;
  }
  return o;
}
function fitHeight(img, h, colors) { // 피사체 높이를 h도트로 맞춰 축소
  const t = p.trim(img).img; return finish(t, t.h / h, colors);
}
const parts = {};
const save = (name, img, k = 6) => { parts[name] = img; p.encode(img, `${OUT}/${name}.png`); p.encode(p.nearestUp(img, k, [30, 40, 62]), `${PRE}/${name}_x${k}.png`); console.log(name, img.w + 'x' + img.h, 'colors', p.countColors(img)); };

// 1. 배경: 도트 약 5.73px → 240×134
{ const b = p.decode(G + '/BG_Gpt_01.png'), s = p.kmeans(resize(b, 960, 540), 48, 20); save('T_Title_BG', s, 2); } // 2배 = 1920×1080 (gpt-image 고해상도본)

// 2. 캐릭터: 실제 도트 격자 기준 (레미는 2칸을 1칸으로 줄여 몬스터와 크기 관계를 맞춤)
save('T_Title_Lemy', fitHeight(clearWhite(p.decode(G + '/Lemy_Gpt_01.png')), 92, 32)); // 키 92도트 (화면 2배 = 184px, gpt-image 고해상도본)
save('T_Title_Sentinel', fitHeight(clearWhite(p.decode(G + '/Sentinel_Gpt_01.png')), 150, 32)); // 키 150도트 (화면 2배 = 300px)
save('T_Title_Queen', fitHeight(clearWhite(p.decode(G + '/Queen_Gpt_01.png')), 240, 32)); // 키 240도트 (화면 2배 = 480px)

// 3. 미노: 색마다 블록 하나를 16×16으로 줄인 뒤 정확한 테트로미노 모양으로 조립 (시트의 S/Z/L 모양 오류 보정)
{
  const sheet = clearWhite(p.decode(G + '/Minos_01.png'));
  const box = { I: [0, 0, 145, 135], O: [240, 0, 150, 138], T: [705, 0, 150, 138], S: [965, 0, 145, 138], Z: [408, 365, 145, 140], J: [884, 365, 150, 140], L: [1230, 365, 146, 140] };
  const shape = { I: ['XXXX'], O: ['XX', 'XX'], T: ['.X.', 'XXX'], S: ['.XX', 'XX.'], Z: ['XX.', '.XX'], J: ['X..', 'XXX'], L: ['..X', 'XXX'] };
  for (const [n, [x, y, w, h]] of Object.entries(box)) {
    const blk = p.trim(p.crop(sheet, x, y, w, h)).img; // 블록 하나 (외곽선 포함)
    for (let i = 0; i < blk.w * blk.h; i++) if (blk.d[i * 4] >= 240 && blk.d[i * 4 + 1] >= 240 && blk.d[i * 4 + 2] >= 240) blk.d.fill(0, i * 4, i * 4 + 4); // 블록 사이 흰 틈 제거
    const b16 = p.kmeans(resize(blk, 16, 16), 12, 20); // 정확히 16×16 블록
    console.log('  block', n, blk.w + 'x' + blk.h);
    for (let i = 0; i < b16.w * b16.h; i++) b16.d[i * 4 + 3] = b16.d[i * 4 + 3] >= 128 ? 255 : 0;
    const rows = shape[n], pc = p.blank(rows[0].length * 16, rows.length * 16);
    rows.forEach((r, ry) => [...r].forEach((c, rx) => { if (c === 'X') for (let yy = 0; yy < 16; yy++) b16.d.copy(pc.d, ((ry * 16 + yy) * pc.w + rx * 16) * 4, yy * b16.w * 4, yy * b16.w * 4 + 64); }));
    save('T_Title_Mino_' + n, pc);
  }
}

// 4. 버튼: START 판 틀 하나에 세 글자를 옮겨 붙여 크기 통일 → 도트 2칸을 1칸으로 축소 → 마우스 올림용 청록 테두리
{
  const sh = p.decode(G + '/Buttons_02.png');
  const frame = [122, 78, 956, 220]; // START 판 (x, y, w, h)
  const letters = { START: [464, 158, 271, 64], OPTION: [446, 416, 308, 64], EXIT: [507, 669, 186, 64] }; // 각 판의 글자 범위 (x, y, w, h)
  const inner = [28, 40, 64]; // 판 안쪽 남색
  const isInner = (d, i) => Math.abs(d[i] - inner[0]) + Math.abs(d[i + 1] - inner[1]) + Math.abs(d[i + 2] - inner[2]) < 24;
  for (const [name, [lx, ly, lw, lh]] of Object.entries(letters)) {
    const t = p.crop(sh, ...frame);
    const m = 8, ex0 = 464 - 122 - m, ey0 = 158 - 78 - m; // START 글자 자리를 안쪽 남색으로 지움 (외곽선 여유 8px)
    for (let y = ey0; y < ey0 + 64 + 2 * m; y++) for (let x = ex0; x < ex0 + 271 + 2 * m; x++) { const i = (y * t.w + x) * 4; t.d[i] = inner[0]; t.d[i + 1] = inner[1]; t.d[i + 2] = inner[2]; }
    const ox = Math.round((frame[2] - lw) / 2) - m, oy = 158 - 78 - m; // 새 글자를 판 가운데에 (글자 높이 기준은 START와 같음)
    for (let y = 0; y < lh + 2 * m; y++) for (let x = 0; x < lw + 2 * m; x++) { // 원래 판의 글자+외곽선만 복사 (안쪽 남색은 건너뜀)
      const si = ((ly - m + y) * sh.w + lx - m + x) * 4; if (isInner(sh.d, si)) continue;
      sh.d.copy(t.d, ((oy + y) * t.w + ox + x) * 4, si, si + 4);
    }
    const btn = finish(clearFlat(t), 4.4, 24); // 생성 도트 격자 그대로 (화면 2배)
    // 마우스 올림: 바깥 외곽 2줄을 밝은 청록, 그 밖 2줄을 짙은 청록 (흐림 없는 2단 빛, 화면 2배에서 4px씩)
    const B = 2, pad = (src) => { const o = p.blank(src.w + 2 * B, src.h + 2 * B); for (let y = 0; y < src.h; y++) src.d.copy(o.d, ((y + B) * o.w + B) * 4, y * src.w * 4, (y + 1) * src.w * 4); return o; };
    const H = pad(btn), N = pad(btn); // 평상시 그림도 같은 크기로 여백을 둠 (Sprite Swap 때 위치 고정)
    const solid = Uint8Array.from({ length: H.w * H.h }, (_, i) => H.d[i * 4 + 3] > 0 ? 1 : 0);
    const dist = new Int32Array(H.w * H.h).fill(-1), q = []; // 불투명/투명 경계로부터의 거리
    for (let y = 0; y < H.h; y++) for (let x = 0; x < H.w; x++) {
      const i = y * H.w + x, nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const X = x + dx, Y = y + dy; return X < 0 || Y < 0 || X >= H.w || Y >= H.h ? solid[i] : solid[Y * H.w + X] !== solid[i]; });
      if (nb) { dist[i] = 1; q.push(i); } // 경계에 맞닿은 픽셀 = 1번째 줄
    }
    for (let k = 0; k < q.length; k++) { const i = q[k], x = i % H.w, y = (i - x) / H.w; if (dist[i] >= B) continue; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= H.w || Y >= H.h) continue; const j = Y * H.w + X; if (dist[j] < 0 && solid[j] === solid[i]) { dist[j] = dist[i] + 1; q.push(j); } } }
    for (let i = 0; i < H.w * H.h; i++) if (dist[i] > 0 && dist[i] <= B) { const c = solid[i] ? [120, 248, 236] : [34, 167, 168]; H.d[i * 4] = c[0]; H.d[i * 4 + 1] = c[1]; H.d[i * 4 + 2] = c[2]; H.d[i * 4 + 3] = 255; } // 안쪽 2줄 밝은 청록, 바깥 2줄 짙은 청록
    save('T_Title_Btn_' + name, N); save('T_Title_Btn_' + name + '_Hover', H);
  }
}
fs.writeFileSync(R + '/work/layers.json', JSON.stringify(Object.fromEntries(Object.entries(parts).map(([k, v]) => [k, [v.w, v.h]]))));
