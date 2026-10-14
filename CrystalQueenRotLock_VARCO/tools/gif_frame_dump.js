// GIF 프레임 확인용 덤프 (작업 폴더 전용): node gif_frame_dump.js <gif 파일명 일부> <프레임 번호들...> → output/probe_gifdump_*.png (한 장에 가로로 이어 붙임)
const fs = require('fs'), path = require('path'), L = require('./lib_view.js'), { p, OUT } = L, { decode } = require('../../PixelFX_VARCO/tools/gif_check.js');
const [name, ...idx] = process.argv.slice(2), f = fs.readdirSync(OUT).find(n => n.endsWith('.gif') && n.includes(name)); const g = decode(fs.readFileSync(path.join(OUT, f)));
const tiles = idx.map(i => ({ w: g.W, h: g.H, d: g.frames[+i].d })); const W = tiles.reduce((a, t) => a + t.w + 6, -6), H = Math.max(...tiles.map(t => t.h)), o = L.opaque(W, H, [12, 14, 20]);
let ox = 0; tiles.forEach(t => { for (let y = 0; y < t.h; y++) t.d.copy(o.d, (y * W + ox) * 4, y * t.w * 4, (y + 1) * t.w * 4); ox += t.w + 6; });
p.encode(o, path.join(OUT, 'probe_gifdump_' + name.slice(0, 12) + '.png')); console.log(f, '프레임', idx.join(','), '→', W + 'x' + H, '/ GIF 프레임 수', g.frames.length);
