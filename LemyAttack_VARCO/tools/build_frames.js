// 레미 "코어 방출" v2 시간표·이펙트 오버레이 생성 (작업 폴더 전용). 입력: lemy_poses.js(포즈), work/core_centers.tsv(Unity 캡처에서 잰 프레임별 코어·머리 위치). 출력: work/timeline.json, work/overlay/ovl_XX.png
// 이펙트는 프레임마다 실제 코어 위치(몸통이 눌리면 코어도 내려감)에 맞춰 그린다. 마법탄 길은 발사 프레임의 코어 위치에서 시작.
const fs = require('fs'), path = require('path');
const p = require('../../PauseUI_VARCO/tools/pix.js'), F = require('./lemy_fx.js'), P = require('./lemy_poses.js');
const W = path.join(__dirname, '..', 'work'), OV = path.join(W, 'overlay'); fs.mkdirSync(OV, { recursive: true });
const cen = {}; for (const line of fs.readFileSync(path.join(W, 'core_centers.tsv'), 'utf8').trim().split('\n')) { const f = line.split('\t'); cen[f[0]] = { core: [+f[1], +f[2]], head: [+f[3], +f[4], +f[5], +f[6]] }; }
const rel = cen['F07_release'].core, BX = Math.round(rel[0]), BY = Math.round(rel[1]); // 마법탄 출발 기준
const FX = {
  F03_charge1: () => F.over(F.coreGlow(1), F.converge(8, false)),
  F04_charge2: () => F.over(F.coreGlow(2), F.converge(6, false)),
  F05_charge3: () => F.over(F.coreGlow(3), F.converge(4, true)),
  F06_charge4: () => F.over(F.coreGlow(4), F.converge(2, true)),
  F07_release: () => F.over(F.flash(), F.boltFrame(BX + 21, BY, 0, 0)),
  F08_fly1: () => F.boltFrame(BX + 48, BY, 3, 1), F09_fly2: () => F.boltFrame(BX + 96, BY, 3, 0), F10_fly3: () => F.boltFrame(BX + 156, BY, 3, 1),
  F11_fly4: () => F.boltFrame(BX + 228, BY, 3, 0), F12_fly5: () => F.boltFrame(BX + 300, BY, 3, 1), F13_fly6: () => F.boltFrame(BX + 372, BY, 3, 0),
  F14_fade1: () => F.fade(BX + 420, BY, 1), F15_fade2: () => F.fade(BX + 420, BY, 2)
};
let t = 0; const tl = P.map((r, i) => {
  const id = r[0], c = cen[id]; F.CORE[0] = Math.round(c.core[0]); F.CORE[1] = Math.round(c.core[1]); // 이 프레임의 실제 코어 중심
  const ov = FX[id] ? FX[id]() : null, file = ov ? 'overlay/ovl_' + String(i).padStart(2, '0') + '.png' : null;
  p.encode(ov || F.blank(), path.join(OV, 'ovl_' + String(i).padStart(2, '0') + '.png'));
  const o = { id, index: i, ms: r[1], start_ms: t, s: r[2], head: [r[3], r[4]], tilt: r[5], l: [r[6], r[7]], r: [r[8], r[9]], variant: r[10], note: r[11], core: F.CORE.slice(), head_box: c.head, overlay: file }; t += r[1]; return o; });
fs.writeFileSync(path.join(W, 'timeline.json'), JSON.stringify({ total_ms: t, crop: [F.CX0, F.CY0, F.CW, F.CH], dot_px: F.D, release_ms: tl.find(f => f.id === 'F07_release').start_ms, bolt_start: [BX, BY], frames: tl }, null, 1));
console.log('프레임', tl.length, '합계', t + 'ms, 발사 시작', tl.find(f => f.id === 'F07_release').start_ms + 'ms, 마법탄 기준', BX, BY);
