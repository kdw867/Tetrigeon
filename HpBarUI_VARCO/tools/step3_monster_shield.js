// 3단계: 몬스터 HP바(직접 그린 도트, 컨셉의 돌 틀·빨간 채움 색을 따름), 방패 막대, 방패 아이콘, 타겟 표시를 레이어로 만든다. 작업 폴더에만 저장
const p = require('../../PauseUI_VARCO/tools/pix.js'), path = require('path');
const R = path.join(__dirname, '..'), WORK = R + '/work', LAY = R + '/parts/layers', PART = R + '/parts';
const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const setPx = (img, x, y, h) => { if (x < 0 || y < 0 || x >= img.w || y >= img.h) return; const c = hex(h), o = (y * img.w + x) * 4; img.d[o] = c[0]; img.d[o + 1] = c[1]; img.d[o + 2] = c[2]; img.d[o + 3] = 255; };
const clear = (img, x, y) => img.d.fill(0, (y * img.w + x) * 4, (y * img.w + x) * 4 + 4);
let seed = 7; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296; // 돌 질감용 고정 난수 (매번 같은 결과)

// ── 몬스터 막대 틀: 112x17. 창(보이는 안쪽) x5..106, y4..11 (102x8). 위 2줄 밝은 돌, 아래 3줄 어두운 돌(입체감), 창 둘레에 어두운 안쪽선
const MW = 112, MH = 20, MX = 5, MY = 4, MWW = 102, MWH = 11;
const frame = p.blank(MW, MH);
for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
  let c = null;
  const inWin = x >= MX && x < MX + MWW && y >= MY && y < MY + MWH;
  if (inWin) continue; // 창은 비움
  if (x === 0 || x === MW - 1 || y === 0 || y === MH - 1) c = '#060b18'; // 바깥 외곽선
  else if (x === MX - 1 || x === MX + MWW || y === MY - 1 || y === MY + MWH) c = '#0d111b'; // 창 안쪽선
  else if (y === 1) c = '#9e9ba2'; // 윗면 하이라이트
  else if (y === 2) c = '#6c6e7d';
  else if (y === MH - 4) c = '#565b6d'; // 아랫면
  else if (y === MH - 3) c = '#3e465d';
  else if (y === MH - 2) c = '#2f3649';
  else c = (x <= 3 || x >= MW - 4) ? '#6c6e7d' : '#565b6d'; // 양끝 마구리는 조금 밝게
  setPx(frame, x, y, c);
}
for (const [x, y] of [[0, 0], [MW - 1, 0], [0, MH - 1], [MW - 1, MH - 1]]) clear(frame, x, y); // 바깥 모서리 깎임
for (let y = 1; y < MH - 1; y++) for (let x = 1; x < MW - 1; x++) { const o = (y * MW + x) * 4; if (!frame.d[o + 3] || rnd() > 0.1) continue; const d = rnd() < 0.5 ? -14 : 12; for (let c = 0; c < 3; c++) frame.d[o + c] = Math.max(0, Math.min(255, frame.d[o + c] + d)); } // 돌 질감 점
for (const [x, y] of [[2, 9], [MW - 3, 9]]) setPx(frame, x, y, '#9e9ba2'); // 마구리의 작은 못
p.encode(frame, `${LAY}/T_HpMonster_Frame.png`);

// 채움: 위는 밝은 빨강, 아래는 어두운 빨강. 10칸 나눔선(약 10.2px 간격)은 한 칸 어둡게
const FR = ['#c9344a', '#fd756f', '#fd6b68', '#fd6b68', '#fd6b68', '#f9605f', '#f2555e', '#e8404f', '#da2b48', '#d02640', '#c01f3c'];
const fill = p.blank(MWW, MWH), track = p.blank(MWW, MWH);
const TR = ['#0d1424', '#141c2d', '#192133', '#192133', '#192133', '#192133', '#192133', '#192133', '#192133', '#141c2d', '#0d1424'];
const divs = new Set(); for (let k = 1; k < 10; k++) divs.add(Math.round(k * MWW / 10));
for (let y = 0; y < MWH; y++) for (let x = 0; x < MWW; x++) {
  setPx(fill, x, y, divs.has(x) ? FR[Math.min(MWH - 1, y + 1)] : FR[y]);
  setPx(track, x, y, divs.has(x) ? '#10182a' : TR[y]);
}
p.encode(fill, `${LAY}/T_HpMonster_Fill.png`); p.encode(track, `${LAY}/T_HpMonster_Track.png`);

// ── 방패 아이콘: 컨셉(16x18)을 배경 제거 후 8색으로
{ const raw = p.decode(`${WORK}/shield_icon_raw.png`), BG = [...p.decode(`${R}/refs/ref_concept_hpbars.png`).d.subarray(0, 3)];
  const im = { w: raw.w, h: raw.h, d: Buffer.from(raw.d) }, mk = new Uint8Array(im.w * im.h), st = p.borderSeeds(im).map(([x, y]) => y * im.w + x);
  for (let i = 0; i < im.w * im.h; i++) im.d[i * 4 + 3] = 255;
  const isBg = i => Math.abs(im.d[i * 4] - BG[0]) + Math.abs(im.d[i * 4 + 1] - BG[1]) + Math.abs(im.d[i * 4 + 2] - BG[2]) < 60;
  while (st.length) { const i = st.pop(); if (mk[i]) continue; const x = i % im.w, y = (i - x) / im.w; if (!isBg(i)) continue; mk[i] = 1; if (x > 0) st.push(i - 1); if (x < im.w - 1) st.push(i + 1); if (y > 0) st.push(i - im.w); if (y < im.h - 1) st.push(i + im.w); }
  for (let i = 0; i < im.w * im.h; i++) if (mk[i]) im.d.fill(0, i * 4, i * 4 + 4);
  p.encode(p.trim(p.kmeans(im, 8)).img, `${LAY}/T_HpShield_Icon.png`); }

console.log('몬스터 틀', frame.w + 'x' + frame.h, '창', MWW + 'x' + MWH);
