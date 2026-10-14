// 이펙트 점검용 접촉 시트 (작업 폴더 전용): 각 이펙트 프레임을 본체 위에 합성해 번호를 붙여 한 장으로 본다. 사용: node sheet_fx.js <create|charge|explode|break|melt|stars> [배율]
const path = require('path');
const p = require('../../PauseUI_VARCO/tools/pix.js'), L = require('../../CrystalQueenRotLock_VARCO/tools/lib_view.js'), F = require('./lib_shield_fx.js');
const CELLS = path.join(__dirname, '..', 'output', 'SentinelShield_cells_v1'), cell = (n) => p.decode(path.join(CELLS, 'Sentinel_' + n + '.png'));
const BG = [38, 44, 58];
function frame(body, g) { const o = L.opaque(F.FW, F.FH, BG); if (body) L.put(o, body, 32, 32, 1, [0, 0]); if (g) { const im = F.toImage(g); for (let i = 0; i < F.FW * F.FH; i++) { const a = im.d[i * 4 + 3] / 255; if (!a) continue; for (let c = 0; c < 3; c++) o.d[i * 4 + c] = Math.round(o.d[i * 4 + c] * (1 - a) + im.d[i * 4 + c] * a); } } return o; }
const CR = [20, 36, 172, 100]; // 이펙트 캔버스에서 자를 영역(텍스처 px)
const tile = (body, g, k) => p.nearestUp(p.crop(frame(body, g), ...CR), k);
const kind = process.argv[2], k = +process.argv[3] || 3, hold = cell('hold'), stun = cell('stun');
let tiles = [], tags = [];
if (kind === 'create') { for (let i = 0; i < 7; i++) { tiles.push(tile(hold, F.create(i), k)); tags.push(String(i)); } }
if (kind === 'charge') { for (const pr of [0, 0.25, 0.5, 0.75, 1]) { tiles.push(tile(hold, F.held(F.dome(0), pr), k)); tags.push(String(Math.round(pr * 100))); } }
if (kind === 'explode') { tiles.push(tile(hold, F.held(F.dome(0), 1), k)); tags.push('0'); tiles.push(tile(hold, F.expand(1), k)); tags.push('1'); tiles.push(tile(hold, F.expand(2), k)); tags.push('2'); tiles.push(tile(hold, F.burstFlash(), k)); tags.push('3'); for (let i = 1; i <= 6; i++) { tiles.push(tile(hold, F.shatter(i), k)); tags.push(String(3 + i)); } }
if (kind === 'break') { tiles.push(tile(hold, F.held(F.dome(0), 0.5), k)); tags.push('0'); tiles.push(tile(hold, F.hitFlash(), k)); tags.push('1'); tiles.push(tile(hold, F.midBreak(1), k)); tags.push('2'); tiles.push(tile(hold, F.midBreak(2), k)); tags.push('3'); }
if (kind === 'melt') { F.meltAll().forEach((g, i) => { tiles.push(tile(i < 4 ? hold : stun, g, k)); tags.push(String(i)); }); }
if (kind === 'stars') { F.starFrames(stun).frames.forEach((g, i) => { tiles.push(tile(stun, g, k)); tags.push(String(i)); }); }
const cols = +process.argv[4] || 4, out = L.grid(tiles, cols, 8, tags), f = path.join(__dirname, '..', 'work', 'probe_fx_' + kind + '.png'); p.encode(out, f); console.log(f, out.w + 'x' + out.h, 'clip', F.clipped());
