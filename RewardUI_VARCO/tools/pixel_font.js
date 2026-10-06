// 비트맵 폰트 렌더러: 글리프 데이터 -> 색상별 아틀라스 PNG + 메트릭 JSON + 미리보기 PNG
const fs = require('fs'), path = require('path');
const p = require('C:/Users/MBC-501-15/Documents/Tetrigeon/PauseUI_VARCO/tools/pix.js'); // 기존 PNG 유틸 재사용
const GL = require('./pixel_font_glyphs.js'); // 글리프 원본 데이터
const OUT = path.join(__dirname, '..', 'font');
const OUTLINE = [14, 18, 28], CAP = 7, GAP = 1, PAD = 1, COLS = 16, LINE_GAP = 1, SCALE = 3; // 외곽선색, 캡 높이, 글자 간격, 셀 사이 여백, 열 수, 줄 간격 추가분, 미리보기 배율
const COLORS = { cream: { body: [236, 230, 205] }, gold: { body: [232, 184, 92], top: [236, 205, 120] }, teal: { body: [120, 190, 200] } }; // 색상별 본체색 (top = 맨 윗줄 하이라이트)

// 글리프 크기 계산: 본체 폭/높이, 외곽선 포함 사각형 크기
const chars = Object.keys(GL);
const info = {};
for (const ch of chars) {
  const g = GL[ch], bw = g.width || Math.max(...g.rows.map(r => r.length)); // 본체 폭 (공백은 width 사용)
  for (const r of g.rows) if (r.length !== bw) throw new Error(`행 폭 불일치: ${ch}`); // 행 폭이 다르면 데이터 오류
  info[ch] = { bw, bh: g.rows.length, rw: g.rows.length ? bw + 2 : 0, rh: g.rows.length ? g.rows.length + 2 : 0 };
}
const CELL_W = Math.max(...chars.map(c => info[c].rw)), CELL_H = Math.max(...chars.map(c => info[c].rh)); // 격자 셀 크기 = 가장 큰 글리프
const BASELINE = 1 + CAP; // 셀 윗줄에서 기준선까지 (외곽선 1행 + 캡 7행)
const drawn = chars.filter(c => info[c].rw); // 아틀라스에 그려지는 글리프 (공백 제외)
const ROWS = Math.ceil(drawn.length / COLS), AW = PAD + COLS * (CELL_W + PAD), AH = PAD + ROWS * (CELL_H + PAD); // 아틀라스 크기

// 글리프별 아틀라스 사각형과 메트릭
const glyphs = {};
drawn.forEach((ch, i) => { glyphs[ch] = { x: PAD + (i % COLS) * (CELL_W + PAD), y: PAD + Math.floor(i / COLS) * (CELL_H + PAD) }; });
const metrics = { cellHeight: CELL_H, baseline: BASELINE, lineHeight: CELL_H + LINE_GAP, outline: 1, glyphs: {} };
for (const ch of chars) {
  const m = info[ch], pos = glyphs[ch] || { x: 0, y: 0 };
  metrics.glyphs[ch] = { x: pos.x, y: pos.y, w: m.rw, h: m.rh, advance: m.bw + GAP, yOffset: m.rw ? GL[ch].y : 0 }; // 공백은 사각형 없음
}

// 색상 하나의 아틀라스 렌더: 외곽선(8방향) 먼저, 본체는 그 위에
function renderAtlas(col) {
  const img = p.blank(AW, AH), put = (x, y, c) => { const i = (y * AW + x) * 4; img.d[i] = c[0]; img.d[i + 1] = c[1]; img.d[i + 2] = c[2]; img.d[i + 3] = 255; };
  for (const ch of drawn) {
    const g = GL[ch], { x, y } = glyphs[ch], top = g.rows.findIndex(r => r.includes('#')); // 맨 윗 본체 줄 번호
    g.rows.forEach((row, r) => [...row].forEach((c, k) => { if (c === '#') for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) put(x + 1 + k + dx, y + 1 + r + dy, OUTLINE); })); // 외곽선
    g.rows.forEach((row, r) => [...row].forEach((c, k) => { if (c === '#') put(x + 1 + k, y + 1 + r, r === top && col.top ? col.top : col.body); })); // 본체
  }
  return img;
}

// 텍스트 한 줄을 1배율 이미지로 배치 (메트릭 JSON으로 아틀라스에서 잘라 붙임)
function renderLine(atlas, text) {
  const adv = [...text].map(c => metrics.glyphs[c].advance), W = adv.reduce((a, b) => a + b, 0) + 2, line = p.blank(W, CELL_H);
  let pen = 1; // 첫 글리프 외곽선이 잘리지 않도록 1px 시작
  [...text].forEach(c => {
    const m = metrics.glyphs[c];
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) { // 불투명 픽셀만 복사
      const s = ((m.y + y) * atlas.w + m.x + x) * 4;
      if (atlas.d[s + 3]) atlas.d.copy(line.d, ((m.yOffset + y) * W + pen - metrics.outline + x) * 4, s, s + 4);
    }
    pen += m.advance;
  });
  return line;
}

// 미리보기: 색상별 블록, 샘플 문장을 3배 최근접 확대로 쌓음
const SAMPLES = ['STAGE 3 CLEAR   HP +15', 'CHOOSE AN UPGRADE', 'Choose 1 mino to strengthen.', 'S · HEAL', 'Lv.0 → Lv.1', '1 LINE CLEAR', '1 DMG', '+2 HP', '2T × 1 DMG', '+2 SHIELD', 'LASTS 2 TURNS.', 'Starts next enemy turn.', 'Base single-line clear • No bonus or crystal triggers.', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz', '0123456789 +-.,:\'/%()<>!?'];
fs.mkdirSync(OUT, { recursive: true });
const atlases = {};
for (const [name, col] of Object.entries(COLORS)) { atlases[name] = renderAtlas(col); p.encode(atlases[name], `${OUT}/PixelFont_${name}.png`); } // 색상별 아틀라스 저장
fs.writeFileSync(`${OUT}/PixelFont.json`, JSON.stringify(metrics, null, 1)); // 메트릭 저장

const MARGIN = 12 * SCALE, BLOCK_H = (SAMPLES.length + 1) * metrics.lineHeight * SCALE + MARGIN; // 블록 높이 (라벨 줄 포함)
const widths = SAMPLES.map(s => [...s].reduce((a, c) => a + metrics.glyphs[c].advance, 2));
const PW = Math.max(...widths) * SCALE + MARGIN * 2, PH = Object.keys(COLORS).length * BLOCK_H + MARGIN, prev = p.blank(PW, PH);
for (let i = 0; i < PW * PH; i++) prev.d.set([24, 31, 43, 255], i * 4); // 배경 남색
Object.keys(COLORS).forEach((name, b) => {
  [name.toUpperCase()].concat(SAMPLES).forEach((s, n) => { // 첫 줄은 색상 이름 라벨
    const up = p.nearestUp(renderLine(atlases[name], s), SCALE), ox = MARGIN, oy = MARGIN + b * BLOCK_H + n * metrics.lineHeight * SCALE;
    for (let y = 0; y < up.h; y++) for (let x = 0; x < up.w; x++) { const si = (y * up.w + x) * 4; if (up.d[si + 3]) up.d.copy(prev.d, ((oy + y) * PW + ox + x) * 4, si, si + 4); }
  });
});
p.encode(prev, `${OUT}/font_preview.png`);
console.log(`glyphs ${chars.length} (drawn ${drawn.length}), atlas ${AW}x${AH}, cellHeight ${CELL_H}, baseline ${BASELINE}, lineHeight ${metrics.lineHeight}, preview ${PW}x${PH}`);
