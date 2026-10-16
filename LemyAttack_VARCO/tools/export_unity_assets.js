// 레미 "코어 방출" v2 Unity 에셋 내보내기 (작업 폴더 전용): 시트 2장 + 매니페스트(TSV) + 클립 키 표. Unity 쪽 임포트·클립 제작 코드가 이 파일들을 읽는다.
// 1) T_Lemy_AttackParts.png : 파생 스프라이트 3칸 (BodyFeet_Open 164x191, LeftArm_Glint 81x191, RightArm_Glint 75x191), 칸 사이 2px 빈 줄, 피벗은 픽셀 지정(원본 파츠와 같은 점).
// 2) T_Lemy_AttackFx.png : 이펙트 9칸 (칸 25x19 도트, 도트 1칸 = 텍스처 1px = 화면 3px → PPU 10.8), 칸 가운데 도트가 이펙트 중심. 도트 격자에서 직접 뽑아 미리보기와 한 칸도 다르지 않다.
const fs = require('fs'), path = require('path');
const p = require('../../PauseUI_VARCO/tools/pix.js'), F = require('./lemy_fx.js'), W = path.join(__dirname, '..', 'work'), OUT = path.join(W, 'unity_assets'); fs.mkdirSync(OUT, { recursive: true });
const TL = JSON.parse(fs.readFileSync(path.join(W, 'timeline.json'), 'utf8')), V = path.join(W, 'variants');
// ---------- 1) 파츠 시트 ----------
const parts = [['LemyAttack_BodyFeetOpen', 'BodyFeet_Open.png', [82, 95.5]], ['LemyAttack_LeftArmGlint', 'LeftArm_Glint.png', [28.5, 95.5]], ['LemyAttack_RightArmGlint', 'RightArm_Glint.png', [47.5, 95.5]]];
{ const imgs = parts.map(([, f]) => p.decode(path.join(V, f))), GAP = 2, w = imgs.reduce((a, i) => a + i.w, 0) + GAP * (imgs.length - 1), h = 191, sheet = p.blank(w, h); let x = 0; const rows = [];
  imgs.forEach((im, i) => { for (let y = 0; y < im.h; y++) im.d.copy(sheet.d, (y * w + x) * 4, y * im.w * 4, (y + 1) * im.w * 4); rows.push([parts[i][0], x, 0, im.w, im.h, parts[i][2][0], parts[i][2][1]]); x += im.w + GAP; });
  p.encode(sheet, path.join(OUT, 'T_Lemy_AttackParts.png')); fs.writeFileSync(path.join(OUT, 'parts.tsv'), rows.map(r => r.join('\t')).join('\n')); console.log('파츠 시트', w + 'x' + h); }
// ---------- 2) 이펙트 시트 (도트 해상도) ----------
const HW = 12, HH = 9, CW = 25, CH = 19, CORE = [300, 150]; // 칸 가운데 도트 = 이펙트 중심
function sample(img) { const c = p.blank(CW, CH); for (let gy = -HH; gy <= HH; gy++) for (let gx = -HW; gx <= HW; gx++) { const X = CORE[0] + gx * F.D - F.CX0, Y = CORE[1] + gy * F.D - F.CY0; if (X < 0 || Y < 0 || X >= img.w || Y >= img.h) continue; const o = (Y * img.w + X) * 4; if (img.d[o + 3]) img.d.copy(c.d, ((gy + HH) * CW + gx + HW) * 4, o, o + 4); } return c; }
F.CORE[0] = CORE[0]; F.CORE[1] = CORE[1];
const fx = [
  ['LemyFx_core1', () => F.over(F.coreGlow(1), F.converge(8, false))], ['LemyFx_core2', () => F.over(F.coreGlow(2), F.converge(6, false))],
  ['LemyFx_core3', () => F.over(F.coreGlow(3), F.converge(4, true))], ['LemyFx_core4', () => F.over(F.coreGlow(4), F.converge(2, true))],
  ['LemyFx_release', () => F.over(F.flash(), F.boltFrame(CORE[0] + 21, CORE[1], 0, 0))],
  ['LemyFx_boltA', () => F.boltFrame(CORE[0], CORE[1], 3, 1)], ['LemyFx_boltB', () => F.boltFrame(CORE[0], CORE[1], 3, 0)],
  ['LemyFx_fade1', () => F.fade(CORE[0], CORE[1], 1)], ['LemyFx_fade2', () => F.fade(CORE[0], CORE[1], 2)]];
{ const cols = 5, rows = Math.ceil(fx.length / cols), sheet = p.blank(cols * CW, rows * CH), man = [];
  fx.forEach(([name, fn], i) => { const cell = sample(fn()), cx = (i % cols) * CW, cy = Math.floor(i / cols) * CH; for (let y = 0; y < CH; y++) cell.d.copy(sheet.d, ((cy + y) * sheet.w + cx) * 4, y * CW * 4, (y + 1) * CW * 4); man.push([name, cx, sheet.h - cy - CH, CW, CH, CW / 2, CH / 2]); }); // 유니티 사각형은 아래가 원점, 피벗 = 가운데(픽셀)
  p.encode(sheet, path.join(OUT, 'T_Lemy_AttackFx.png')); fs.writeFileSync(path.join(OUT, 'fx.tsv'), man.map(r => r.join('\t')).join('\n')); console.log('이펙트 시트', sheet.w + 'x' + sheet.h, fx.length + '칸'); }
// ---------- 3) 클립 키 표 ----------
// 열: id, 시작(초), s, headDx, headDy, tilt, lDx, lDy, rDx, rDy, variant, coreFx 스프라이트('-'=없음), coreFx 화면 x,y(중심 도트 가운데), bolt 스프라이트, bolt 화면 x,y
const coreSprite = { F03_charge1: 'LemyFx_core1', F04_charge2: 'LemyFx_core2', F05_charge3: 'LemyFx_core3', F06_charge4: 'LemyFx_core4', F07_release: 'LemyFx_release' };
const [BX, BY] = TL.bolt_start, boltSprite = { F08_fly1: ['LemyFx_boltA', 48], F09_fly2: ['LemyFx_boltB', 96], F10_fly3: ['LemyFx_boltA', 156], F11_fly4: ['LemyFx_boltB', 228], F12_fly5: ['LemyFx_boltA', 300], F13_fly6: ['LemyFx_boltB', 372], F14_fade1: ['LemyFx_fade1', 420], F15_fade2: ['LemyFx_fade2', 420] };
const rows = TL.frames.map(f => { const c = coreSprite[f.id] || '-', b = boltSprite[f.id], cx = f.core[0] + 0.5, cy = f.core[1] + 0.5; return [f.id, (f.start_ms / 1000).toFixed(3), f.s, f.head[0], f.head[1], f.tilt, f.l[0], f.l[1], f.r[0], f.r[1], f.variant, c, cx, cy, b ? b[0] : '-', b ? BX + b[1] + 0.5 : 0, b ? BY + 0.5 : 0].join('\t'); });
fs.writeFileSync(path.join(OUT, 'clip_keys.tsv'), rows.join('\n')); console.log('클립 키', rows.length, '줄, 합계', TL.total_ms + 'ms');
