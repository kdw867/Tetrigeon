// 센티넬 보호막 스킬 전체 프레임·시간표·GIF·검사 (작업 폴더 전용, Unity 와 무관). 사용: node build_all.js
// 분기: 실패(폭발) = 웅크림 → 보호막 생성 → 충전(LOCK 14번 압축) → 폭발 → 복귀 / 성공(녹아내림) = 웅크림 → 보호막 생성 → 충전 → 중간 파손 → 녹아내림 → 스턴 유지(별) → 복귀
const fs = require('fs'), path = require('path');
const T = require('./lib_scene.js'), { p, L } = T, F = require('./lib_shield_fx.js'), FXL = require('../../PixelFX_VARCO/tools/lib_fx.js'), GQ = require('../../CrystalQueenRotLock_VARCO/tools/lib_gifq.js'), { decode: gifDecode } = require('../../PixelFX_VARCO/tools/gif_check.js');
const ROOT = path.join(__dirname, '..'), VER = 'v1', OUT = path.join(ROOT, 'output', 'Frames_' + VER), CELLD = path.join(OUT, 'cells'); fs.mkdirSync(CELLD, { recursive: true });
const CELLS = path.join(ROOT, 'output', 'SentinelShield_cells_v1'), body = {}; for (const n of ['stand', 'mid', 'hold', 'stun']) body[n] = p.decode(path.join(CELLS, 'Sentinel_' + n + '.png'));
const D0 = F.dome(0), rng = (n) => Array.from({ length: n }, (_, i) => i), STARS = F.starFrames(body.stun), MELT = F.meltAll(), REST = 600;
const merge = (a, b) => { const g = Uint8Array.from(a); F.bover(g, b, 1); return g; };
// ---------- 시간표 ----------
const CMS = [90, 70, 70, 70, 70, 60, 80], create = rng(7).map(i => F.create(i)), SHMS = [50, 50, 60, 60, 70, 80];
const common = () => [{ id: 'S0', ms: 120, body: 'stand', note: '기본 자세' }, { id: 'S1', ms: 80, body: 'mid', note: '웅크리는 중' }, ...create.map((g, i) => ({ id: 'C' + i, ms: CMS[i], body: 'hold', fx: g, note: i === 0 ? '웅크림 + 바닥 룬 선' : (i === 5 ? '보호막 완성 번쩍임' : (i === 6 ? '안정' : '보호막 생성')) }))];
const charge = (k) => ({ id: 'L' + String(k).padStart(2, '0'), ms: 90, body: 'hold', fx: F.held(D0, k / 14), pct: Math.round(k / 14 * 100), note: '충전 ' + k + '/14 (압축 표시)' });
const fail = [...common(), ...rng(15).map(charge),
  { id: 'X0', ms: 120, body: 'hold', fx: F.held(D0, 1), pct: 100, note: '충전 완료 100% (불투명)' }, { id: 'X1', ms: 60, body: 'hold', fx: F.expand(1), note: '부풀기 1' }, { id: 'X2', ms: 60, body: 'hold', fx: F.expand(2), note: '부풀기 2 + 금' },
  { id: 'X3', ms: 50, body: 'hold', fx: F.burstFlash(), note: '폭발 정점(번쩍임) — 레미 피격 연결 시점', remi: true }, ...rng(6).map(i => ({ id: 'X' + (4 + i), ms: SHMS[i], body: 'hold', fx: F.shatter(i + 1), note: '조각·빛 입자 퍼짐 ' + (i + 1) + '/6' })),
  { id: 'R1', ms: 100, body: 'hold', fx: null, note: '보호막 사라짐' }, { id: 'R2', ms: 80, body: 'mid', note: '복귀 중' }, { id: 'R3', ms: 160, body: 'stand', note: '기본 자세 복귀' }];
const success = [...common(), ...rng(8).map(charge),
  { id: 'M0', ms: 50, body: 'hold', fx: F.hitFlash(), note: '피격 번쩍임(보호막이 순간 불투명)' }, { id: 'M1', ms: 60, body: 'hold', fx: F.midBreak(1), note: '중간 파손 1: 금·조각' }, { id: 'M2', ms: 70, body: 'hold', fx: F.midBreak(2), note: '중간 파손 2: 금 확대' },
  ...MELT.map((g, m) => ({ id: 'D' + String(m).padStart(2, '0'), ms: 70, body: m < 4 ? 'hold' : 'stun', fx: m >= 8 ? merge(g, STARS.frames[m - 8]) : g, note: '녹아내림 ' + (m + 1) + '/12' + (m === 4 ? ' · 힘 빠진 자세로 처짐' : '') + (m === 8 ? ' · 스턴 별 시작' : '') })),
  ...rng(24).map(i => ({ id: 'T' + String(i).padStart(2, '0'), ms: 70, body: 'stun', fx: STARS.frames[(i + 4) % 12], note: '스턴 유지(별 루프)' })),
  { id: 'R1', ms: 100, body: 'hold', fx: null, note: '스턴 해제: 별 사라짐·일어남' }, { id: 'R2', ms: 80, body: 'mid', note: '복귀 중' }, { id: 'R3', ms: 160, body: 'stand', note: '기본 자세 복귀' }];
const total = (s) => s.reduce((a, f) => a + f.ms, 0), startOf = (s, id) => { let t = 0; for (const f of s) { if (f.id === id) return t; t += f.ms; } };
// ---------- 합성 ----------
const BGC = [38, 44, 58], CR = [20, 30, 172, 106], GC = [1300, 0, 480, 290];
const fxImg = (g) => g ? F.toImage(g) : null;
function texFrame(bn, g, noBody) { const o = L.opaque(F.FW, F.FH, BGC); if (bn && !noBody) L.put(o, body[bn], 32, 32, 1, [0, 0]); const im = fxImg(g); if (im) for (let i = 0; i < F.FW * F.FH; i++) { const a = im.d[i * 4 + 3] / 255; if (!a) continue; for (let c = 0; c < 3; c++) o.d[i * 4 + c] = Math.round(o.d[i * 4 + c] * (1 - a) + im.d[i * 4 + c] * a); } return o; }
const cellView = (f, k, opt = {}) => { const o = p.nearestUp(p.crop(texFrame(f.body, f.fx, opt.fxOnly), ...CR), k); if (opt.label && f.pct !== undefined) L.label(o, 8, 8, f.pct, 3, [255, 255, 255]); return o; };
const gameView = (f, k) => { const o = p.crop(T.scene(body[f.body], fxImg(f.fx)), ...GC); return k === 1 ? o : p.nearestUp(o, k); };
// ---------- GIF ----------
const PROT = (() => { const m = new Map(), add = (c) => m.set((c[0] << 16) | (c[1] << 8) | c[2], c); for (const n in body) { const im = body[n]; for (let i = 0; i < im.w * im.h; i++) if (im.d[i * 4 + 3]) add([im.d[i * 4], im.d[i * 4 + 1], im.d[i * 4 + 2]]); } F.TONE.forEach(add); Object.values(F.COL).forEach(add); add(BGC); return [...m.values()]; })();
const info = [], GN = (n) => path.join(OUT, 'SentinelShield_' + n + '_' + VER + '.gif'), total_ms = (a) => a.reduce((x, y) => x + y, 0);
function gif(name, imgs, delays) { const q = GQ.prequant(imgs, PROT), f = GN(name); FXL.writeGif(f, q.frames, delays, { diff: true }); const g = gifDecode(fs.readFileSync(f)), sum = g.frames.reduce((a, fr) => a + fr.delay, 0); if (g.frames.length !== imgs.length || sum !== total_ms(delays)) throw new Error(name + ' 프레임/시간 불일치 ' + g.frames.length + '/' + sum);
  let w = 0, cnt = 0; g.frames.forEach((fr, k) => { for (let i = 0; i < imgs[k].w * imgs[k].h; i++) for (let c = 0; c < 3; c++) { const d = Math.abs(fr.d[i * 4 + c] - imgs[k].d[i * 4 + c]); if (d > w) w = d; if (d > 8) cnt++; } });
  info.push({ file: path.basename(f), size: imgs[0].w + 'x' + imgs[0].h, bytes: fs.statSync(f).size, frames: g.frames.length, total_ms: sum, max_color_diff: w, px_over8: cnt }); console.log(path.basename(f), imgs[0].w + 'x' + imgs[0].h, fs.statSync(f).size + 'B', g.frames.length + '장', sum + 'ms', '색차 최대', w, '(8 초과 ' + cnt + ')'); }
const loopDelays = (s) => s.map((f, i) => f.ms + (i === s.length - 1 ? REST : 0));
const save = (img, name) => { const f = path.join(OUT, 'SentinelShield_' + name + '_' + VER + '.png'); p.encode(img, f); console.log(path.basename(f), img.w + 'x' + img.h); };
// ---------- 프레임 파일 저장 (이펙트 캔버스 208x136, 발 기준점 (104,126)) ----------
for (const n in body) p.encode(body[n], path.join(CELLD, 'Sentinel_' + n + '.png'));
const savedFx = [], saveFx = (name, g) => { const f = 'fx_' + name + '.png'; p.encode(F.toImage(g), path.join(CELLD, f)); savedFx.push(f); return f; };
create.forEach((g, i) => saveFx('create_' + i, g)); for (const pr of [0, 0.25, 0.5, 0.75, 1]) saveFx('held_' + Math.round(pr * 100), F.held(D0, pr));
{ const fl = F.G(), rm = F.G(); F.bover(fl, D0.fill, 1); F.bover(rm, D0.rim, 1); saveFx('layer_fill', fl); saveFx('layer_rim', rm); } // 농도 조절용 두 층(불투명 원본)
[['X0', F.held(D0, 1)], ['X1', F.expand(1)], ['X2', F.expand(2)], ['X3', F.burstFlash()], ...rng(6).map(i => ['X' + (4 + i), F.shatter(i + 1)])].forEach(([n, g]) => saveFx('explode_' + n, g));
[['M0', F.hitFlash()], ['M1', F.midBreak(1)], ['M2', F.midBreak(2)]].forEach(([n, g]) => saveFx('break_' + n, g)); MELT.forEach((g, m) => saveFx('melt_' + String(m).padStart(2, '0'), g)); STARS.frames.forEach((g, i) => saveFx('stars_' + String(i).padStart(2, '0'), g));
// ---------- 1) 몸 동작 ----------
{ const seq = [{ body: 'stand', ms: 400 }, { body: 'mid', ms: 100 }, { body: 'hold', ms: 600 }, { body: 'mid', ms: 100 }, { body: 'stand', ms: 600 }]; gif('1a_body_crouch-hold-return_x4', seq.map(f => cellView({ ...f }, 4)), seq.map(f => f.ms));
  const s2 = [{ body: 'hold', ms: 400 }, { body: 'stun', ms: 1000 }, { body: 'hold', ms: 100 }, { body: 'mid', ms: 80 }, { body: 'stand', ms: 600 }]; gif('1b_body_stun-slump-recover_x4', s2.map(f => cellView({ ...f }, 4)), s2.map(f => f.ms));
  save(L.grid(['stand', 'mid', 'hold', 'stun'].map(n => cellView({ body: n }, 4)), 4, 8, ['1', '2', '3', '4']), 'Body_4poses_x4'); }
// ---------- 2) 보호막 생성·유지 ----------
{ const fr = [{ id: 'pre', ms: 300, body: 'hold' }, ...create.map((g, i) => ({ id: 'C' + i, ms: CMS[i], body: 'hold', fx: g })), ...rng(15).map(charge)]; fr[fr.length - 1].ms = 900; gif('2_shield_create-and-density_x4', fr.map(f => cellView(f, 4, { label: true })), fr.map(f => f.ms));
  save(L.grid(create.map((g, i) => cellView({ body: 'hold', fx: g }, 3)), 4, 8, rng(7).map(String)), 'ShieldCreate_7frames_x3'); save(L.grid([0, 0.25, 0.5, 0.75, 1].map(pr => cellView({ body: 'hold', fx: F.held(D0, pr) }, 3)), 5, 8, ['0', '25', '50', '75', '100']), 'ShieldDensity_5levels_x3'); }
// ---------- 3) 폭발 ----------
{ const ex = fail.filter(f => /^X/.test(f.id)); gif('3a_explosion_fx-only_x4', ex.map(f => cellView(f, 4, { fxOnly: true })), loopDelays(ex)); gif('3b_explosion_with-body_x4', ex.map(f => cellView(f, 4)), loopDelays(ex));
  save(L.grid(ex.map(f => cellView(f, 3)), 4, 8, ex.map((f, i) => String(i))), 'Explosion_10frames_x3'); }
// ---------- 4) 중간 파손 + 녹아내림 ----------
{ const me = success.filter(f => /^(M|D)/.test(f.id)); gif('4a_break-melt_fx-only_x4', me.map(f => cellView(f, 4, { fxOnly: true })), loopDelays(me)); gif('4b_break-melt_with-body_x4', me.map(f => cellView(f, 4)), loopDelays(me));
  save(L.grid(me.map(f => cellView(f, 3)), 4, 8, me.map((f, i) => String(i))), 'BreakMelt_15frames_x3'); }
// ---------- 5) 스턴 별 ----------
{ const sf = STARS.frames.map(g => ({ body: 'stun', fx: g })); gif('5a_stun-stars_loop_x6', sf.map(f => cellView(f, 6)), sf.map(() => 70)); gif('5b_stun-stars_fx-only_x6', sf.map(f => cellView(f, 6, { fxOnly: true })), sf.map(() => 70));
  save(L.grid(sf.map(f => cellView(f, 4)), 4, 8, rng(12).map(String)), 'StunStars_12frames_x4'); }
// ---------- 6·7) 분기 전체 ----------
for (const [key, seq, label] of [['FAIL', fail, '6'], ['SUCCESS', success, '7']]) {
  gif(label + 'a_' + key + '_cell_x4', seq.map(f => cellView(f, 4, { label: true })), loopDelays(seq)); gif(label + 'b_' + key + '_game-screen_x2', seq.map(f => gameView(f, 2)), loopDelays(seq)); gif(label + 'c_' + key + '_game-screen_actual-size_x1', seq.map(f => gameView(f, 1)), loopDelays(seq));
  save(L.grid(seq.map(f => cellView(f, 2)), 8, 6, seq.map((f, i) => String(i))), key + '_all-frames_x2'); }
// 실제 크기 핵심 장면 (게임 화면 ×1 · ×2)
{ const pick = (seq, ids) => ids.map(id => seq.find(f => f.id === id)), fk = pick(fail, ['S1', 'C3', 'L07', 'L14', 'X1', 'X3', 'X5', 'X8']), sk = pick(success, ['S1', 'C4', 'L07', 'M0', 'M2', 'D03', 'D08', 'T05']);
  for (const [nm, ks] of [['FAIL', fk], ['SUCCESS', sk]]) { const t = ks.map(f => gameView(f, 1)); save(L.grid(t, 4, 8, ks.map((f, i) => String(i + 1))), nm + '_key-scenes_game-screen_actual-size_x1'); save(p.nearestUp(L.grid(t, 4, 8, ks.map((f, i) => String(i + 1))), 2), nm + '_key-scenes_game-screen_x2'); } }
// ---------- 시간표 JSON ----------
const row = (s, f) => ({ id: f.id, ms: f.ms, start_ms: startOf(s, f.id) ?? null, body: f.body, fx: f.fx ? true : false, charge_percent: f.pct ?? null, note: f.note || '', remi_hit: !!f.remi });
const tl = { version: VER, note: '합성 미리보기(실제 Unity 영상 아님). 충전 구간은 LOCK 14번을 90ms 간격으로 압축 표시, 실제 게임에서는 플레이어 진행 속도에 따름. 반복 GIF 는 마지막 장면 뒤에 ' + REST + 'ms 쉼.',
  canvas: { body_cell: '144x104, 발 기준점 (72,94)', fx_canvas: '208x136 (셀 원점 = (32,32)), 발 기준점 (104,126)', block: '2x2 텍스처 px = 화면 4px', screen_origin_fx: [T.FX0, T.FY0], screen_origin_cell: [T.SX, T.SY] },
  fail: { total_ms: total(fail), explosion_start_ms: startOf(fail, 'X0'), remi_hit_ms: startOf(fail, 'X3'), remi_hit_offset_from_explosion_start_ms: startOf(fail, 'X3') - startOf(fail, 'X0'), explosion_total_ms: total(fail.filter(f => /^X/.test(f.id))), explosion_peak_frame: 'X3', frames: fail.map(f => row(fail, f)) },
  success: { total_ms: total(success), melt_start_ms: startOf(success, 'D00'), stun_start_ms: startOf(success, 'D04'), stars_start_ms: startOf(success, 'D08'), recover_start_ms: startOf(success, 'R1'), frames: success.map(f => row(success, f)) },
  stars_loop: { frames: 12, ms_each: 70, orbit: STARS.info }, files: { cells: 'cells/', fx_files: savedFx } };
fs.writeFileSync(path.join(OUT, 'SentinelShield_timeline_' + VER + '.json'), JSON.stringify(tl, null, 1)); console.log('시간표 저장: 실패 총', total(fail), 'ms (레미 피격 시점', startOf(fail, 'X3'), 'ms) / 성공 총', total(success), 'ms');
fs.writeFileSync(path.join(OUT, 'SentinelShield_gif-info_' + VER + '.json'), JSON.stringify(info, null, 1));
module.exports = { fail, success, body, STARS, MELT, create, T, F };
