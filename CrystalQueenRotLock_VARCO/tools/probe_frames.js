// 회전 잠금 이펙트 검사용 임시 시트 (작업 폴더 전용): T04~T14 를 캐릭터와 합성해 확대, 룬 둘레만 크게
const path = require('path'), L = require('./lib_view.js'), { p, F, S } = L;
const ids = ['T04', 'T05', 'T06', 'T07', 'T08', 'T09', 'T10', 'T11', 'T12', 'T13', 'T14'];
const tiles = ids.map(id => p.nearestUp(p.crop(L.flat(L.bodyCell(id), F.buildFx(id) || p.blank(160, 160)), 0, 12, 150, 100), 4));
p.encode(L.grid(tiles, 4, 6, ids.map(s => +s.slice(1))), path.join(L.OUT, 'probe_frames_x5.png'));
// 룬만 (몸 없이) 확대
const fxOnly = ids.map(id => { const o = L.opaque(160, 160, [20, 24, 40]); L.put(o, F.buildFx(id) || p.blank(160, 160), 0, 0, 1, [0, 0]); return p.nearestUp(p.crop(o, 30, 14, 80, 64), 6); });
p.encode(L.grid(fxOnly, 4, 6, ids.map(s => +s.slice(1))), path.join(L.OUT, 'probe_rune_only_x10.png'));
console.log('ok');
