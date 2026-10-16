// 레미 "코어 방출" 미리보기·검사 (작업 폴더 전용, 합성 미리보기이며 실제 Unity 영상이 아님). Unity 플레이 모드에서 파츠를 직접 움직여 찍은 레미 캡처(work/capture) 위에 코드로 그린 이펙트 오버레이(work/overlay)를 얹는다.
// 사용: node build_preview.js  →  output/ 에 GIF·시트·시간표·검사 JSON (v1)
const fs = require('fs'), path = require('path');
const p = require('../../PauseUI_VARCO/tools/pix.js'), L = require('../../CrystalQueenRotLock_VARCO/tools/lib_view.js'), F = require('./lemy_fx.js');
const FXL = require('../../PixelFX_VARCO/tools/lib_fx.js'), GQ = require('./lib_mc.js'), { decode: gifDecode } = require('../../PixelFX_VARCO/tools/gif_check.js');
const ROOT = path.join(__dirname, '..'), W = path.join(ROOT, 'work'), OUT = path.join(ROOT, 'output'), VER = 'v2', REST = 600; fs.mkdirSync(OUT, { recursive: true });
const TL = JSON.parse(fs.readFileSync(path.join(W, 'timeline.json'), 'utf8')), FR = TL.frames;
const cap = (f) => p.decode(path.join(W, 'capture', f.id + '.png')), ovl = (f) => f.overlay ? p.decode(path.join(W, f.overlay)) : null;
const comp = (f) => { const c = cap(f), o = ovl(f); if (o) for (let i = 0; i < c.w * c.h; i++) if (o.d[i * 4 + 3]) { c.d[i * 4] = o.d[i * 4]; c.d[i * 4 + 1] = o.d[i * 4 + 1]; c.d[i * 4 + 2] = o.d[i * 4 + 2]; } c.d.forEach((v, i) => { if (i % 4 === 3) c.d[i] = 255; }); return c; };
const FRAMES = FR.map(comp), info = [], total = (a) => a.reduce((x, y) => x + y, 0);
const PROT = Object.values(F.C);
const name = (n, ext) => path.join(OUT, 'LemyCoreRelease_' + n + '_' + VER + '.' + ext);
function gif(n, imgs, delays) { const q = GQ.quantize(imgs, PROT), f = name(n, 'gif'); FXL.writeGif(f, q.frames, delays, { diff: true }); const g = gifDecode(fs.readFileSync(f)), sum = g.frames.reduce((a, fr) => a + fr.delay, 0); if (g.frames.length !== imgs.length || sum !== total(delays)) throw new Error(n + ' 프레임/시간 불일치');
  let w = 0, protectedWorst = 0; g.frames.forEach((fr, k) => { for (let i = 0; i < imgs[k].w * imgs[k].h; i++) { const key = (imgs[k].d[i * 4] << 16) | (imgs[k].d[i * 4 + 1] << 8) | imgs[k].d[i * 4 + 2], isProt = PROT.some(c => ((c[0] << 16) | (c[1] << 8) | c[2]) === key); for (let c = 0; c < 3; c++) { const d = Math.abs(fr.d[i * 4 + c] - imgs[k].d[i * 4 + c]); if (d > w) w = d; if (isProt && d > protectedWorst) protectedWorst = d; } } });
  info.push({ file: path.basename(f), size: imgs[0].w + 'x' + imgs[0].h, bytes: fs.statSync(f).size, frames: g.frames.length, total_ms: sum, max_color_diff: w, effect_color_diff: protectedWorst }); console.log(path.basename(f), imgs[0].w + 'x' + imgs[0].h, fs.statSync(f).size + 'B', g.frames.length + '장', sum + 'ms', '색차 최대', w, '(이펙트 색', protectedWorst + ')'); }
const delays = FR.map((f, i) => f.ms + (i === FR.length - 1 ? REST : 0));
const scale = (imgs, k) => imgs.map(im => k === 1 ? im : p.nearestUp(im, k)), cropAll = (imgs, x, y, w, h) => imgs.map(im => p.crop(im, x, y, w, h));
gif('1_loop_actual-size_x1', FRAMES, delays);
gif('2_loop_x2', scale(FRAMES, 2), delays);
gif('3_lemy-closeup_x4', scale(cropAll(FRAMES, 30, 40, 220, 140), 4), delays); // 레미 둘레 확대 (마법탄은 화면 밖으로 나감)
// 핵심 장면 6컷 + 전체 프레임 시트
const KEY = ['F00_rest', 'F02_crouch', 'F04_charge2', 'F06_charge4', 'F07_release', 'F11_fly4'], keyTiles = KEY.map(id => FRAMES[FR.findIndex(f => f.id === id)]);
const save = (img, n) => { const f = name(n, 'png'); p.encode(img, f); console.log(path.basename(f), img.w + 'x' + img.h); };
save(L.grid(keyTiles, 2, 8, ['1', '2', '3', '4', '5', '6']), 'KeyScenes_actual-size_x1'); save(L.grid(scale(keyTiles, 2), 2, 8, ['1', '2', '3', '4', '5', '6']), 'KeyScenes_x2');
{ const tiles = scale(FRAMES, 1), g = L.grid(tiles, 3, 6, FR.map((f, i) => String(i))); FR.forEach((f, i) => { const ox = (i % 3) * (560 + 6), oy = Math.floor(i / 3) * (185 + 6); L.label(g, ox + 6, oy + 24, f.ms, 2, [255, 255, 255]); }); save(g, 'AllFrames_x1'); }
// 이펙트 부품 시트 (x4, 어두운 바탕): 코어 고리 4단계, 모이는 빛 3단계, 섬광, 마법탄 2장, 소멸 2장
{ const BG = [24, 30, 44], mk = (img, cx, cy, w, h) => { const c = p.blank(w, h); for (let i = 0; i < w * h; i++) { c.d[i * 4] = BG[0]; c.d[i * 4 + 1] = BG[1]; c.d[i * 4 + 2] = BG[2]; c.d[i * 4 + 3] = 255; } for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const sx = cx - (w >> 1) + x - F.CX0, sy = cy - (h >> 1) + y - F.CY0; if (sx < 0 || sy < 0 || sx >= img.w || sy >= img.h) continue; const o = (sy * img.w + sx) * 4; if (img.d[o + 3]) img.d.copy(c.d, (y * w + x) * 4, o, o + 4); } return p.nearestUp(c, 4); };
  const core = F.CORE, parts = [F.coreGlow(1), F.coreGlow(2), F.coreGlow(3), F.coreGlow(4), F.converge(8, false), F.converge(4, true), F.flash(), F.boltFrame(core[0] + 150, core[1], 3, 0), F.fade(core[0] + 150, core[1], 1), F.fade(core[0] + 150, core[1], 2)], cxs = [core[0], core[0], core[0], core[0], core[0], core[0], core[0], core[0] + 150, core[0] + 150, core[0] + 150];
  const tiles = parts.map((im, i) => mk(im, cxs[i], core[1], 56, 40)); save(L.grid(tiles, 5, 8, ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].slice(0, tiles.length)), 'FxParts_x4'); }
// ---------- 검사 ----------
const A = (im, x, y) => (x < 0 || y < 0 || x >= im.w || y >= im.h) ? 0 : im.d[(y * im.w + x) * 4 + 3];
const palKeys = new Set(PROT.map(c => c.join(','))), report = { frames: {}, summary: {} }; let worst = { x0: 1e9, y0: 1e9, x1: -1, y1: -1 }, badPal = 0, nonBin = 0, misaligned = 0, hpHit = 0, eyeHit = 0, edge = 0;
const HP = [240, 268, 405, 297]; // 레미 체력바(화면)
FR.forEach((f, i) => { const o = ovl(f); if (!o) { report.frames[f.id] = { overlay: false }; return; }
  let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1, n = 0, hp = 0, eye = 0, mis = 0, nb = 0, bp = 0;
  for (let y = 0; y < o.h; y++) for (let x = 0; x < o.w; x++) { const q = (y * o.w + x) * 4, a = o.d[q + 3]; if (!a) continue; n++; if (a !== 255) nb++; if (!palKeys.has(o.d[q] + ',' + o.d[q + 1] + ',' + o.d[q + 2])) bp++; const X = x + F.CX0, Y = y + F.CY0; x0 = Math.min(x0, X); x1 = Math.max(x1, X); y0 = Math.min(y0, Y); y1 = Math.max(y1, Y);
    if (X >= HP[0] && X <= HP[2] && Y >= HP[1] && Y <= HP[3]) hp++; { const hb = f.head_box, eh = hb[3] - hb[1]; if (X >= hb[0] && X <= hb[2] && Y >= hb[1] + eh * 0.40 && Y <= hb[1] + eh * 0.66) eye++; }
    // 3x3 도트 격자 정렬: 이 픽셀이 속한 칸(원점 = CORE-1)의 아홉 픽셀이 모두 채워져 있어야 함
    const gx0 = f.id === "F07_release" || /^F(0[8-9]|1[0-5])/.test(f.id) ? TL.bolt_start : f.core, cx = Math.floor((X - (gx0[0] - 1)) / 3) * 3 + (gx0[0] - 1), cy = Math.floor((Y - (gx0[1] - 1)) / 3) * 3 + (gx0[1] - 1); let full = true; for (let j = 0; j < 3 && full; j++) for (let k = 0; k < 3; k++) if (!A(o, cx + k - F.CX0, cy + j - F.CY0)) { full = false; break; } if (!full) mis++; }
  const touch = (x0 <= F.CX0 || y0 <= F.CY0 || x1 >= F.CX0 + F.CW - 1 || y1 >= F.CY0 + F.CH - 1) ? 1 : 0;
  report.frames[f.id] = { dots_px: n, bbox: [x0, y0, x1, y1], nonBinaryAlpha: nb, offPalettePx: bp, misalignedPx: mis, overlapHpBarPx: hp, overlapEyesPx: eye, touchesCanvasEdge: touch };
  worst.x0 = Math.min(worst.x0, x0); worst.y0 = Math.min(worst.y0, y0); worst.x1 = Math.max(worst.x1, x1); worst.y1 = Math.max(worst.y1, y1); badPal += bp; nonBin += nb; misaligned += mis; hpHit += hp; eyeHit += eye; edge += touch; });
const poseOk = FR.every(f => [...f.head, ...f.l, ...f.r].every(v => v % 3 === 0));
report.summary = { total_ms: TL.total_ms, release_ms: TL.release_ms, fxScreenRange: [worst.x0, worst.y0, worst.x1, worst.y1], offPalettePx_total: badPal, nonBinaryAlphaPx_total: nonBin, misalignedPx_total: misaligned, overlapHpBarPx_total: hpHit, overlapEyesPx_total: eyeHit, touchesCanvasEdge_frames: edge, posesAre3pxMultiples: poseOk, palette: Object.entries(F.C).map(([k, v]) => k + '=#' + v.map(x => x.toString(16).padStart(2, '0')).join('')) };
fs.writeFileSync(name('verify', 'json'), JSON.stringify(report, null, 1)); fs.writeFileSync(name('gif-info', 'json'), JSON.stringify(info, null, 1)); fs.copyFileSync(path.join(W, 'timeline.json'), name('timeline', 'json')); console.log(JSON.stringify(report.summary));
