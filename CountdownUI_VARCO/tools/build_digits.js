// 읽어 낸 숫자 도트를 5색 팔레트로 정리하고, 같은 크기 캔버스의 가운데에 맞춰 숫자별 투명 PNG 3장으로 저장 (작업 폴더 전용)
// 사용: node build_digits.js <태그>   → output/T_Countdown_3|2|1.png (도트 1칸 = 1px 원본)
const fs = require('fs'), path = require('path');
const R = path.join(__dirname, '..');
const p = require(path.join(R, '..', 'PauseUI_VARCO', 'tools', 'pix.js'));
const TAG = process.argv[2];
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
// 시트에서 읽은 색 단계 그대로: 외곽선, 어두운 호박색, 호박색, 노랑(몸통), 옅은 노랑(빛 받는 면)
const PAL = ['#201000', '#b07000', '#d8a010', '#f8d810', '#f8e890'].map(hex);
// 출력 색: 'teal'은 프로젝트에 이미 쓰는 청록 단계(밝은 청록 #8cecf4, 청록 #3ec0d6, 어두운 청록 #2a8ea0, 깊은 청록 #1d6f82)에 어두운 외곽선을 더함. 'yellow'는 시트 원색 그대로
const OUT = { teal: ['#0e3a47', '#1d6f82', '#2a8ea0', '#3ec0d6', '#8cecf4'], yellow: ['#201000', '#b07000', '#d8a010', '#f8d810', '#f8e890'] }[process.argv[3] || 'teal'].map(hex);
const OUTDIR = process.argv[3] === 'yellow' ? path.join(R, 'work', 'yellow') : path.join(R, 'output'); // 노란색은 참고용으로 work에만 저장
fs.mkdirSync(OUTDIR, { recursive: true });
const CW = 80, CH = 81; // 캔버스: 숫자 51도트 x 1.4배 = 72도트가 들어가는 여유, 세로를 홀수로 해서 높이 51 숫자의 가운데가 칸 가운데에 정확히 놓임
const raw = JSON.parse(fs.readFileSync(path.join(R, 'work', `digit_raw_${TAG}.json`), 'utf8')).cells.map(c => ({ w: c.w, h: c.h, bbox: c.bbox, d: Buffer.from(c.d, 'base64') }));
const names = ['3', '2', '1'];
function snap(f) {
  const o = p.blank(f.w, f.h);
  for (let i = 0; i < f.w * f.h; i++) {
    if (!f.d[i * 4 + 3]) continue; let b = OUT[0], bd = 1e18;
    PAL.forEach((q, qi) => { const d = (f.d[i * 4] - q[0]) ** 2 * 0.3 + (f.d[i * 4 + 1] - q[1]) ** 2 * 0.59 + (f.d[i * 4 + 2] - q[2]) ** 2 * 0.11; if (d < bd) { bd = d; b = OUT[qi]; } }); // 가장 가까운 원색 단계를 찾아 같은 단계의 출력 색으로 바꿈
    o.d[i * 4] = b[0]; o.d[i * 4 + 1] = b[1]; o.d[i * 4 + 2] = b[2]; o.d[i * 4 + 3] = 255;
  }
  return o;
}
const A = (f, x, y) => (x < 0 || y < 0 || x >= f.w || y >= f.h) ? 0 : f.d[(y * f.w + x) * 4 + 3];
const info = [];
raw.forEach((cell, k) => {
  const f = snap(cell);
  // 이웃이 하나도 없는 외톨이 도트 제거
  let stray = 0; for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) { if (!A(f, x, y)) continue; let n = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && A(f, x + dx, y + dy)) n++; if (!n) { f.d[(y * f.w + x) * 4 + 3] = 0; stray++; } }
  // 경계 상자와 무게 중심
  let x0 = f.w, y0 = f.h, x1 = -1, y1 = -1, n = 0, sx = 0, sy = 0;
  for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) if (A(f, x, y)) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); n++; sx += x + 0.5; sy += y + 0.5; }
  const bw = x1 - x0 + 1, bh = y1 - y0 + 1, bcx = (x0 + x1 + 1) / 2, mcx = sx / n; // 경계 상자 가운데 / 무게 중심 (도트 단위)
  // 가로 기준: 경계 상자 가운데와 무게 중심의 평균 (숫자 1처럼 한쪽으로 몰린 모양도 눈에 중앙으로 보이게). 세로는 높이가 모두 같으니 경계 상자 가운데
  const centerX = (bcx + mcx) / 2; // 숫자 안 기준점 (원본 격자 좌표)
  const dstX = Math.round(CW / 2 - (centerX - x0)); // 캔버스에서 경계 상자 왼쪽 위치
  const dstY = Math.round((CH - bh) / 2);
  const out = p.blank(CW, CH);
  for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) { const s = ((y0 + y) * f.w + x0 + x) * 4; if (!f.d[s + 3]) continue; const d = ((dstY + y) * CW + dstX + x) * 4; out.d[d] = f.d[s]; out.d[d + 1] = f.d[s + 1]; out.d[d + 2] = f.d[s + 2]; out.d[d + 3] = 255; }
  p.encode(out, path.join(OUTDIR, `T_Countdown_${names[k]}.png`));
  info.push({ name: names[k], bw, bh, bboxCenterMinusCanvas: (dstX + bw / 2) - CW / 2, massCenterMinusCanvas: (dstX + (mcx - x0)) - CW / 2, top: dstY, bottom: dstY + bh - 1, dots: n, stray });
});
console.log(JSON.stringify(info, null, 1));
fs.writeFileSync(path.join(R, 'work', 'digits_info.json'), JSON.stringify({ CW, CH, info }));
