// 2단계: 카드·버튼·제목을 레이어로 나눠서 만든다. 전부 작업 폴더(parts/, parts/layers/)에만 저장 (Unity 적용 아님)
// 카드 레이어: Frame(돌 테두리+모서리 보석) / Interior(안쪽 남색 면+얇은 안쪽선) / LevelOrnament(레벨 줄 장식) / EffectBox(효과 상자) / Glow(호버 빛)
const { p, R, blit, fill, put, measure, getAtlas, meta } = require('./lib_ui.js'), fs = require('fs');
const PART = R + '/parts', LAY = R + '/parts/layers', WORK = R + '/work', G = R + '/generated';
fs.mkdirSync(LAY, { recursive: true });

// ── 카드 틀: 원본에서 왼쪽 위 1/4만 취해 네 방향으로 거울 복사 (생성본은 아래 모서리가 더 크고 좌우 줄눈이 달라 비대칭)
const raw = p.decode(`${WORK}/card_K_Card_02_raw.png`), W = 98, H = 162, base = p.blank(W, H);
for (let y = 0; y < 81; y++) for (let x = 0; x < 49; x++) { const s = ((3 + y) * raw.w + 4 + x) * 4; for (const [dx, dy] of [[x, y], [W - 1 - x, y], [x, H - 1 - y], [W - 1 - x, H - 1 - y]]) raw.d.copy(base.d, (dy * W + dx) * 4, s, s + 4); }
const hexAt = (img, x, y) => { const i = (y * img.w + x) * 4; return img.d[i + 3] ? '#' + [img.d[i], img.d[i + 1], img.d[i + 2]].map(v => v.toString(16).padStart(2, '0')).join('') : null; };
const NAVY = '#15243b', DARK = '#0a1930', LINE = '#475865', SEP = '#2f3c4f', CYAN = '#22a7a8', INNER_LINE = '#6f7f8e';

// 안쪽 면: 카드 가운데에서 남색을 따라 퍼진 영역 + 그 경계의 얇은 안쪽선(#6f7f8e). 나머지(돌 테두리, 바깥 외곽선, 안쪽선 밖 남색 띠)는 Frame
const inMask = new Uint8Array(W * H), stack = [(81 * W + 49)];
while (stack.length) { const i = stack.pop(); if (inMask[i]) continue; const x = i % W, y = (i - x) / W; if (hexAt(base, x, y) !== NAVY) continue; inMask[i] = 1; if (x > 0) stack.push(i - 1); if (x < W - 1) stack.push(i + 1); if (y > 0) stack.push(i - W); if (y < H - 1) stack.push(i + W); }
const lineMask = new Uint8Array(W * H);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { if (inMask[y * W + x] || hexAt(base, x, y) !== INNER_LINE) continue; let near = false; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < W && Y < H && inMask[Y * W + X]) near = true; } if (near) lineMask[y * W + x] = 1; }
// 안쪽선 끝까지(모서리 대각선은 한 단계 어두운 선 색 #566573): 위에서 찾은 선 픽셀에서 8방향으로 이어진 같은 색 픽셀(모서리 대각선 포함)도 안쪽 면에 포함 (돌 테두리와는 어두운 외곽선으로 떨어져 있어 섞이지 않음)
{ const st = []; for (let i = 0; i < W * H; i++) if (lineMask[i]) st.push(i); while (st.length) { const i = st.pop(), x = i % W, y = (i - x) / W; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= W || Y >= H) continue; const j = Y * W + X; if (lineMask[j] || inMask[j] || (hexAt(base, X, Y) !== INNER_LINE && hexAt(base, X, Y) !== '#566573')) continue; lineMask[j] = 1; st.push(j); } } }
const frame = p.blank(W, H), interior = p.blank(W, H);
for (let i = 0; i < W * H; i++) { const dst = (inMask[i] || lineMask[i]) ? interior : frame; base.d.copy(dst.d, i * 4, i * 4, i * 4 + 4); }
p.encode(frame, `${LAY}/T_Card_Frame.png`); p.encode(interior, `${LAY}/T_Card_Interior.png`);

// 레벨 줄 장식: 가는 선 + 바깥 끝 십자 다이아몬드. 70x3, 카드 안 u14..83 / v31..33
const diamond = (img, cx, cy, hex) => { for (const [dx, dy] of [[0, -1], [-1, 0], [0, 0], [1, 0], [0, 1]]) put(img, cx + dx, cy + dy, hex); };
const orn = p.blank(70, 3);
for (let x = 18; x <= 30; x++) { put(orn, x - 14, 1, LINE); put(orn, 69 - (x - 14), 1, LINE); }
diamond(orn, 1, 1, CYAN); diamond(orn, 68, 1, CYAN);
p.encode(orn, `${LAY}/T_Card_LevelOrnament.png`);
// 효과 상자: 어두운 면 + 1px 외곽선(모서리 한 칸씩 비움) + 구분선 둘 + 머리글 양옆 다이아몬드. 66x46, 카드 안 u16..81 / v78..123
const BW0 = 66, BH0 = 46, box = p.blank(BW0, BH0);
fill(box, 1, 1, BW0 - 2, BH0 - 2, DARK);
for (let x = 1; x < BW0 - 1; x++) { put(box, x, 0, LINE); put(box, x, BH0 - 1, LINE); }
for (let y = 1; y < BH0 - 1; y++) { put(box, 0, y, LINE); put(box, BW0 - 1, y, LINE); }
for (let x = 1; x < BW0 - 1; x++) { put(box, x, 10, SEP); put(box, x, 24, SEP); } // 머리글/첫째 줄/둘째 줄 구분선
diamond(box, 6, 5, CYAN); diamond(box, BW0 - 7, 5, CYAN);
p.encode(box, `${LAY}/T_Card_EffectBox.png`);

// 합성본(미리보기와 대조용): 레이어를 제자리에 얹은 것
const comp = p.blank(W, H); blit(comp, interior, 0, 0); blit(comp, frame, 0, 0); blit(comp, orn, 14, 31); blit(comp, box, 16, 78);
p.encode(comp, `${PART}/T_Card_Frame.png`);

// 빛: 카드 알파(Frame+Interior)를 두 칸 부풀려 바깥 1칸 밝은 청록, 2칸 어두운 청록 (선택/호버 표시)
const M = 2, GW = W + 2 * M, GH = H + 2 * M, glow = p.blank(GW, GH), a0 = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? 0 : comp.d[(y * W + x) * 4 + 3];
for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
  const cx = x - M, cy = y - M; if (a0(cx, cy)) continue;
  let d = 9; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (a0(cx + dx, cy + dy)) d = Math.min(d, Math.max(Math.abs(dx), Math.abs(dy)));
  if (d <= 2) { const o = (y * GW + x) * 4, c = d === 1 ? [0x5f, 0xe3, 0xe6] : [0x1f, 0x8f, 0x96]; glow.d[o] = c[0]; glow.d[o + 1] = c[1]; glow.d[o + 2] = c[2]; glow.d[o + 3] = 255; }
}
p.encode(glow, `${LAY}/T_Card_Glow.png`); p.encode(glow, `${PART}/T_Card_Glow.png`);

// ── SELECT 버튼 (직접 그린 도트): 70x17. 돌판 + 양끝 다이아몬드 + 크림색 글꼴. 레이어: 슬랩(T_Btn_Select_Slab) / 글자(T_Btn_Select_Label)
const BW = 70, BH = 17, slab = p.blank(BW, BH);
fill(slab, 0, 0, BW, BH, '#031228'); fill(slab, 1, 1, BW - 2, BH - 2, '#6f7f8e'); fill(slab, 1, 1, BW - 2, 1, '#98a8b2'); fill(slab, 1, BH - 3, BW - 2, 2, '#374558');
for (const [x, y] of [[0, 0], [BW - 1, 0], [0, BH - 1], [BW - 1, BH - 1]]) slab.d.fill(0, (y * BW + x) * 4, (y * BW + x) * 4 + 4);
for (const cx of [7, BW - 8]) for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const dd = Math.abs(dx) + Math.abs(dy); if (dd === 2) put(slab, cx + dx, 8 + dy, '#374558'); else if (dd <= 1) put(slab, cx + dx, 8 + dy, '#98a8b2'); }
const total = measure('SELECT') - 1, lw = total + 2, label = p.blank(lw, 9); // 글자 레이어: 외곽선 포함 (몸통 너비 + 2) x 9
{ const a = getAtlas('cream'); let pen = 1; for (const ch of 'SELECT') { const g = meta.glyphs[ch]; blit(label, a, pen - meta.outline, 0, 1, g.x, g.y, g.w, g.h); pen += g.advance; } }
p.encode(slab, `${LAY}/T_Btn_Select_Slab.png`); p.encode(label, `${LAY}/T_Btn_Select_Label.png`);
const btn = p.blank(BW, BH); blit(btn, slab, 0, 0); blit(btn, label, Math.round((BW - total) / 2) - 1, 4); p.encode(btn, `${PART}/T_Btn_SELECT.png`);

// ── 제목 글자(K_Title_01): 배경 제거 → 5.75px/도트로 축소 → 색 줄이기 → 글자(금색)와 양옆 장식(청록)으로 분리
const tsrc = p.decode(`${G}/K_Title_01.png`), tbg = [...tsrc.d.subarray(0, 3)];
const tfg = (x, y) => { const i = (y * tsrc.w + x) * 4; return Math.abs(tsrc.d[i] - tbg[0]) + Math.abs(tsrc.d[i + 1] - tbg[1]) + Math.abs(tsrc.d[i + 2] - tbg[2]) > 60; };
let tx0 = 1e9, ty0 = 1e9, tx1 = -1, ty1 = -1; for (let y = 0; y < tsrc.h; y++) for (let x = 0; x < tsrc.w; x++) if (tfg(x, y)) { tx0 = Math.min(tx0, x); tx1 = Math.max(tx1, x); ty0 = Math.min(ty0, y); ty1 = Math.max(ty1, y); }
const TF = 5.75, tw = Math.round((tx1 - tx0 + 1) / TF) * TF, th = Math.round((ty1 - ty0 + 1) / TF) * TF, tcx = Math.round((tx0 + tx1) / 2 - tw / 2 + 0.5), tcy = Math.round((ty0 + ty1) / 2 - th / 2 + 0.5);
const traw = p.boxDown(p.crop(tsrc, tcx - 12, tcy - 12, Math.round(tw) + 24, Math.round(th) + 24), TF);
const isBgT = i => Math.abs(traw.d[i * 4] - tbg[0]) + Math.abs(traw.d[i * 4 + 1] - tbg[1]) + Math.abs(traw.d[i * 4 + 2] - tbg[2]) < 50;
const tm = new Uint8Array(traw.w * traw.h), ts = p.borderSeeds(traw).map(([x, y]) => y * traw.w + x);
while (ts.length) { const i = ts.pop(); if (tm[i]) continue; const x = i % traw.w, y = (i - x) / traw.w; if (!isBgT(i)) continue; tm[i] = 1; if (x > 0) ts.push(i - 1); if (x < traw.w - 1) ts.push(i + 1); if (y > 0) ts.push(i - traw.w); if (y < traw.h - 1) ts.push(i + traw.w); }
for (let i = 0; i < traw.w * traw.h; i++) if (tm[i]) traw.d.fill(0, i * 4, i * 4 + 4);
const title = p.trim(p.kmeans(traw, 10)).img; p.encode(title, `${PART}/T_Title_Choose.png`);
const isGold = (img, x, y) => { const i = (y * img.w + x) * 4; return img.d[i + 3] && img.d[i] > 140 && img.d[i] > img.d[i + 2] + 40; }; // 금색 글자 픽셀
let gx0 = 1e9, gx1 = -1; for (let y = 0; y < title.h; y++) for (let x = 0; x < title.w; x++) if (isGold(title, x, y)) { gx0 = Math.min(gx0, x); gx1 = Math.max(gx1, x); }
gx0 -= 2; gx1 += 2; // 글자 바깥 외곽선 여유
const tText = p.crop(title, gx0, 0, gx1 - gx0 + 1, title.h), tOrnFull = p.crop(title, 0, 0, gx0, title.h); // 가운데는 글자, 왼쪽 나머지는 장식(오른쪽은 거울로 사용)
const ornL = p.trim(tOrnFull), txt = p.trim(tText);
p.encode(ornL.img, `${LAY}/T_Title_Ornament.png`); p.encode(txt.img, `${LAY}/T_Title_Text.png`);
console.log('title', title.w + 'x' + title.h, '글자 x', gx0, gx1, '→ 글자', txt.img.w + 'x' + txt.img.h, '(오프셋', txt.x0, txt.y0 + ')', '장식', ornL.img.w + 'x' + ornL.img.h, '(오프셋', ornL.x0, ornL.y0 + ')', '| 오른쪽 장식 시작 x', title.w - 1 - (ornL.x0 + ornL.img.w - 1));
