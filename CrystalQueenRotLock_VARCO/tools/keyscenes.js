// 수정여왕 회전 잠금 SKILL 핵심 장면 4개 + 자물쇠 아이콘 + NEXT 연결 제안 합성 (작업 폴더 전용, Unity 영상 아님): 이펙트 셀을 저장하고, 저장한 PNG 를 다시 읽어 승인된 일반공격 캐릭터 셀과 합성한다.
const fs = require('fs'), path = require('path'), L = require('./lib_view.js'), { p, F, S, OUT } = L;
const VER = 'v1', SCENES = [['T05', '1_hand-aura'], ['T07', '2_rune-appears'], ['T11', '3_lock-closes'], ['T12', '4_lock-held']];
const FXD = path.join(OUT, 'RotLockScenes_' + VER + '_fx'); fs.mkdirSync(FXD, { recursive: true });
const fxFile = (id) => path.join(FXD, 'CrystalQueenRotLock_Fx_' + id + '.png');
const info = SCENES.map(([id, name]) => { const s = S.step(id); p.encode(F.buildFx(id), fxFile(id)); return { scene: name, step: id, start_ms: s.start_ms, ms: s.ms, character: path.relative(OUT, path.join(S.ATK, s.character)).replace(/\\/g, '/'), fx: path.relative(OUT, fxFile(id)).replace(/\\/g, '/') }; });
fs.writeFileSync(path.join(OUT, 'RotLockScenes_' + VER + '_build_info.json'), JSON.stringify({ note: '수정여왕 회전 잠금 핵심 장면 4개 (미리보기 전용, Unity 미적용). 캐릭터 = 승인된 일반공격 v3 셀 재사용(수정 없음).', cell: [160, 160], pivot_unity: [0.5, 0.45], rune_center_block: F.RC, rune_ring_radius_blocks: F.RR, scenes: info }, null, 1));
const FX = SCENES.map(([id]) => p.decode(fxFile(id))), CH = SCENES.map(([id]) => L.bodyCell(id)); // 저장한 이펙트를 다시 읽음
const save = (img, name) => { const f = path.join(OUT, 'CrystalQueenRotLock_' + name + '.png'); p.encode(img, f); console.log(path.basename(f), img.w + 'x' + img.h); };
const scr = L.SCR();
// 1) 실제 게임 화면 합성 (보스 자리 오른쪽 위 320x310 → ×2)
const TIGHT = [1600, 0, 320, 310];
save(L.grid(CH.map((c, i) => p.nearestUp(p.crop(L.onScreen(scr, c, FX[i]), ...TIGHT), 2)), 2, 8), 'KeyScenes_' + VER + '_game-screen_x2');
// 2) 룬·손 확대 (셀 x 4~124, 줄 14~112 → ×6, 평평한 배경)
save(L.grid(CH.map((c, i) => p.nearestUp(p.crop(L.flat(c, FX[i]), 4, 14, 120, 98), 6)), 2, 8), 'KeyScenes_' + VER + '_closeup_x6');
// 3) 손 기운 비교: 위 = 일반공격, 가운데 = 증식 SKILL, 아래 = 회전 잠금 (같은 단계·같은 몸동작, 손 둘레 48x36 → ×8)
const hc = { T05: S.HA, T07: S.HA, T11: S.HB, T12: S.HB };
const hand = (c, f, id) => { const cx = 2 * hc[id][0] + 1, cy = 2 * hc[id][1] + 1; return p.nearestUp(p.crop(L.flat(c, f), Math.max(0, cx - 24), cy - 18, 48, 36), 8); };
const ids = SCENES.map(s => s[0]);
save(L.grid([...CH.map((c, i) => hand(c, L.normalFx(ids[i]), ids[i])), ...CH.map((c, i) => hand(c, L.growthFx(ids[i]), ids[i])), ...CH.map((c, i) => hand(c, FX[i], ids[i]))], 4, 6, [...ids.map(s => +s.slice(1)), ...ids.map(s => +s.slice(1)), ...ids.map(s => +s.slice(1))]), 'KeyScenes_' + VER + '_hands-normal-growth-lock_x8');
// 4) 룬 자리 비교: A(채택, 몸과 겹치지 않음) vs B(머리 바로 위, 몸과 겹침) — 같은 T11, 실제 게임 화면 ×3
function placed(cx, cy, id) { const keep = F.RC.slice(); F.RC[0] = cx; F.RC[1] = cy; const f = F.buildFx(id); F.RC[0] = keep[0]; F.RC[1] = keep[1]; return f; }
const body11 = L.bodyCell('T11'), fa = placed(F.RC[0], F.RC[1], 'T11'), fb = placed(40, 19, 'T11');
let over = 0; for (let i = 0; i < 160 * 160; i++) if (fb.d[i * 4 + 3] && body11.d[i * 4 + 3]) over++;
const tileAB = (f) => p.nearestUp(p.crop(L.onScreen(scr, body11, f), 1600, 0, 320, 200), 3);
save(L.grid([tileAB(fa), tileAB(fb)], 1, 8, ['1', '2']), 'KeyScenes_' + VER + '_placement_A-vs-B_x3');
console.log('B(머리 바로 위)에서 몸 픽셀과 겹치는 이펙트 픽셀 수(셀 px):', over, '= 도트 약', Math.round(over / 4));
// 5) 자물쇠 아이콘 (별도 재사용 파일): UI 7x9 도트 닫힘(네이티브 7x9 px, 1도트=1px) + 룬 안 자물쇠 세 상태(7x8)
const ICON = p.blank(7, 9); F.LOCK_UI.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === '.') return; const c = F.PAL[ch], o = (y * 7 + x) * 4; ICON.d[o] = c[0]; ICON.d[o + 1] = c[1]; ICON.d[o + 2] = c[2]; ICON.d[o + 3] = 255; }));
save(ICON, 'LockIcon_' + VER + '_ui_7x9_native');
save(p.nearestUp(ICON, 2), 'LockIcon_' + VER + '_ui_7x9_x2');
const ST = ['open', 'near', 'closed'], strip = p.blank(7 * 3 + 2, 8);
ST.forEach((st, n) => { const art = F.lockArt(st); art.forEach((row, ry) => [...row].forEach((ch, x) => { if (ch === '.') return; const y = ry + 8 - art.length, c = F.PAL[ch], o = (y * strip.w + n * 8 + x) * 4; strip.d[o] = c[0]; strip.d[o + 1] = c[1]; strip.d[o + 2] = c[2]; strip.d[o + 3] = 255; })); });
save(strip, 'LockStates_' + VER + '_open-near-closed_native');
const view = L.opaque(strip.w * 12, strip.h * 12, [40, 46, 60]); L.put(view, strip, 0, 0, 12, [0, 0]); save(view, 'LockStates_' + VER + '_open-near-closed_x12');
const iconView = L.opaque(7 * 16 + 32, 9 * 16 + 32, [40, 46, 60]); L.put(iconView, ICON, 16, 16, 16, [0, 0]); save(iconView, 'LockIcon_' + VER + '_ui_7x9_x16');
// 6) ④ NEXT 연결 제안 합성 (비주얼 제안, 실제 UI 아님): 실제 게임 화면의 FATE 두루마리 위 두 미노(잠금 완료 직후 NEXT 맨 위 두 칸) 둘레를 보라색으로 강조 + 오른쪽에 작은 자물쇠
const o = { w: scr.w, h: scr.h, d: Buffer.from(scr.d) }; L.put(o, CH[3], L.SX, L.SY, 2, [0, 0]); L.put(o, FX[3], L.SX, L.SY, 2, [0, 0]); // 여왕 T12
const px = (x, y) => (y * o.w + x) * 4, BGC = [o.d[px(1215, 530)], o.d[px(1215, 530) + 1], o.d[px(1215, 530) + 2]];
const diff = (x, y) => Math.max(Math.abs(o.d[px(x, y)] - BGC[0]), Math.abs(o.d[px(x, y) + 1] - BGC[1]), Math.abs(o.d[px(x, y) + 2] - BGC[2]));
const SLOTS = [[454, 520], [548, 618]], X0 = 1222, X1 = 1312, rep = [];
for (const [y0, y1] of SLOTS) {
  const mask = new Set(); let bx0 = 9999, bx1 = -1, by0 = 9999, by1 = -1;
  for (let y = y0; y < y1; y++) for (let x = X0; x < X1; x++) if (diff(x, y) > 28) { mask.add(x + ',' + y); bx0 = Math.min(bx0, x); bx1 = Math.max(bx1, x); by0 = Math.min(by0, y); by1 = Math.max(by1, y); }
  rep.push({ bbox: [bx0, by0, bx1, by1], pixels: mask.size });
  let cur = new Set(mask); const dist = new Map(); mask.forEach(k => dist.set(k, 0));
  for (let d = 1; d <= 6; d++) { const nxt = new Set(); cur.forEach(k => { const [x, y] = k.split(',').map(Number); for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const q = (x + dx) + ',' + (y + dy); if (!dist.has(q)) { dist.set(q, d); nxt.add(q); } } }); cur = nxt; }
  dist.forEach((d, k) => { if (d < 3) return; const [x, y] = k.split(',').map(Number), bxk = x >> 1, byk = y >> 1; let col = null; if (d <= 4) col = F.PAL.c; else if ((bxk + byk) % 2 === 0) col = F.PAL.b; if (!col || mask.has(k) || diff(x, y) > 28) return; o.d[px(x, y)] = col[0]; o.d[px(x, y) + 1] = col[1]; o.d[px(x, y) + 2] = col[2]; });
  const ix = bx1 + 10, iy = Math.round((by0 + by1) / 2) - 9; // 아이콘 7x9 도트 = 14x18 px (2px/도트), 미노 오른쪽 가운데
  L.put(o, ICON, ix, iy, 2, [0, 0]); rep[rep.length - 1].icon = [ix, iy, 14, 18];
}
console.log('NEXT 대상 미노 영역(화면 px):', JSON.stringify(rep));
save(p.crop(o, 1180, 0, 740, 950), 'KeyScenes_' + VER + '_scene4_next-link_x1');
save(p.nearestUp(p.crop(o, 1190, 430, 160, 210), 4), 'KeyScenes_' + VER + '_scene4_next-link_detail_x4');
