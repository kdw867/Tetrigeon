// 확인용: 장면 id의 사건 후 틱 목록을 배율 k로 한 장에 나란히 (사용: node pshots.js 1 0,1,2,3 3 out.png)
const { p, R, blit, solid, up } = require('./lib_fx');
const M = require('./preview_particles.js');
const [id, ticks, k, outFile] = process.argv.slice(2);
const sc = M.scenarios.find(s => s.id === +id), base = M.makeBase(sc.cropY, sc.cropH), parts = M.emitFor(sc, {});
const [rx, ry, rw, rh] = M.focusRect(sc);
const imgs = ticks.split(',').map(t => up(p.crop(M.frameAt(sc, base, parts, 'new', M.T0 + +t, {}), rx, ry, rw, rh), +k));
const g = 8, W = imgs.reduce((s, i) => s + i.w + g, g), H = imgs[0].h + 2 * g, o = solid(W, H, '#070c14'); let x = g; for (const i of imgs) { blit(o, i, x, g, 1); x += i.w + g; }
p.encode(o, outFile); console.log(o.w + 'x' + o.h);
