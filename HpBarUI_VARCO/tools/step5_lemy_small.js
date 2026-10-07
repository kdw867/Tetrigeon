// 5단계: 레미 HP바를 몬스터 HP바와 같은 크기(112x20)로 새로 그린다. 컨셉의 왼쪽 청록 보석 마구리 + 오른쪽 룬 마구리 + 초록 칸 채움을 따름.
// (사용자 요청: 레미 막대도 몬스터 막대 크기만큼 줄이기. 큰 컨셉 막대를 그냥 줄이면 보석·룬이 뭉개지고 숫자가 들어갈 높이도 안 나와서 도트로 다시 그림)
const p = require('../../PauseUI_VARCO/tools/pix.js'), path = require('path'), fs = require('fs');
const R = path.join(__dirname, '..'), LAY = R + '/parts/layers';
// 큰 레미 막대 레이어는 참고용으로 work에 보관
for (const n of ['Frame', 'Track', 'Fill']) { const f = `${LAY}/T_HpLemy_${n}.png`, bak = `${R}/work/T_HpLemy_${n}_big.png`; if (fs.existsSync(f) && !fs.existsSync(bak) && p.decode(f).w > 150) fs.copyFileSync(f, bak); }
const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const setPx = (img, x, y, h) => { if (x < 0 || y < 0 || x >= img.w || y >= img.h) return; const c = hex(h), o = (y * img.w + x) * 4; img.d[o] = c[0]; img.d[o + 1] = c[1]; img.d[o + 2] = c[2]; img.d[o + 3] = 255; };
const clear = (img, x, y) => img.d.fill(0, (y * img.w + x) * 4, (y * img.w + x) * 4 + 4);
let seed = 11; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;

// 112x20, 창 x14..106 (93px) y4..14 (11줄). 왼쪽 마구리 x1..12(보석), 오른쪽 마구리 x108..110(룬)
const W = 112, H = 20, WX = 14, WY = 4, WW = 93, WH = 11;
const frame = p.blank(W, H);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  if (x >= WX && x < WX + WW && y >= WY && y < WY + WH) continue; // 창은 비움
  let c;
  if (x === 0 || x === W - 1 || y === 0 || y === H - 1) c = '#060b18'; // 바깥 외곽선
  else if (x === WX - 1 || x === WX + WW || y === WY - 1 || y === WY + WH) c = '#0d111b'; // 창 안쪽선
  else if (y === 1) c = '#9e9ba2'; else if (y === 2) c = '#6c6e7d';
  else if (y === H - 4) c = '#565b6d'; else if (y === H - 3) c = '#3e465d'; else if (y === H - 2) c = '#2f3649';
  else c = x <= 12 ? '#565b6d' : '#6c6e7d'; // 왼쪽 마구리는 보석이 돋보이게 한 단계 어둡게
  setPx(frame, x, y, c);
}
for (const [x, y] of [[0, 0], [W - 1, 0], [0, H - 1], [W - 1, H - 1]]) clear(frame, x, y);
for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { const o = (y * W + x) * 4; if (!frame.d[o + 3] || rnd() > 0.1) continue; const d = rnd() < 0.5 ? -14 : 12; for (let c = 0; c < 3; c++) frame.d[o + c] = Math.max(0, Math.min(255, frame.d[o + c] + d)); } // 돌 질감 점
// 왼쪽 마구리의 청록 보석 (반지름 4 마름모, 가운데 (7,9))
for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
  const d = Math.abs(dx) + Math.abs(dy); if (d > 4) continue;
  setPx(frame, 7 + dx, 9 + dy, d === 4 ? '#063042' : d === 3 ? '#1b9cae' : '#3fd6e0');
}
setPx(frame, 6, 8, '#aef4f8'); setPx(frame, 7, 8, '#8fe9f2'); setPx(frame, 6, 9, '#8fe9f2'); setPx(frame, 5, 7, '#e8fdff'); // 보석 하이라이트
// 오른쪽 마구리의 룬 표시 (청록 점 몇 개)
for (const [x, y] of [[108, 7], [109, 7], [110, 7], [110, 8], [110, 9], [109, 10], [108, 10]]) setPx(frame, x, y, '#22d3ee');
// 보석 옆 안쪽선에 룬 점
for (const y of [6, 9, 12]) setPx(frame, WX - 1, y, '#1b9cae');
p.encode(frame, `${LAY}/T_HpLemy_Frame.png`);

// 채움(초록 11줄, 9칸 나눔선)과 빈 칸
const FR = ['#089a70', '#4fe8b0', '#25eaa2', '#20e99e', '#1fe99e', '#1fe99e', '#16d895', '#01b482', '#00ae80', '#019f75', '#01694f'];
const TR = ['#0d1424', '#141c2d', '#192133', '#192133', '#192133', '#192133', '#192133', '#192133', '#192133', '#141c2d', '#0d1424'];
const fill = p.blank(WW, WH), track = p.blank(WW, WH), divs = new Set(); for (let k = 1; k < 9; k++) divs.add(Math.round(k * WW / 9));
for (let y = 0; y < WH; y++) for (let x = 0; x < WW; x++) { setPx(fill, x, y, divs.has(x) ? FR[Math.min(WH - 1, y + 1)] : FR[y]); setPx(track, x, y, divs.has(x) ? '#10182a' : TR[y]); }
p.encode(fill, `${LAY}/T_HpLemy_Fill.png`); p.encode(track, `${LAY}/T_HpLemy_Track.png`);
console.log('레미(작은) 틀', frame.w + 'x' + frame.h, '창', WW + 'x' + WH, '색', p.countColors(frame));
