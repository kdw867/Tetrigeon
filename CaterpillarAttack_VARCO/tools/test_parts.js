// 마디 분리가 맞는지 시험: 정지 자세 복원 + 극단 자세 몇 개를 확대해서 저장 (작업 폴더 전용)
const L = require('./lib_cat.js');
const cfg = { domeH: 27, domeM: 39, legRow: 47, legH: 24, legM: 36, ext: 2 };
const base = L.loadIdle(0);
const layers = L.buildLayers(base, cfg);
console.log('layer pixels', ['H', 'M', 'R'].map(k => k + ':' + layers.L[k].length + '+' + layers.ext[k].length).join(' '));
const rest = L.compose(layers, { H: [0, 0], M: [0, 0], R: [0, 0] });
console.log('rest == idle01:', Buffer.compare(rest.d, base.d) === 0, JSON.stringify(L.inspect(rest)));
const poses = {
  rest: { H: [0, 0], M: [0, 0], R: [0, 0] },
  wind: { H: [2, 1], M: [1, 0], R: [0, 0] },
  mid1: { H: [-2, 0], M: [-1, 0], R: [0, 0] },
  strike: { H: [-5, -1], M: [-3, -1], R: [-1, 0] },
};
const frames = Object.values(poses).map(o => L.compose(layers, o));
Object.entries(poses).forEach(([k, o], i) => console.log(k.padEnd(7), JSON.stringify(L.inspect(frames[i]))));
const img = L.strip(frames, 12, [226, 226, 232], [4, 22, 52, 34]);
L.p.encode(img, L.R + '/work/test_parts_x12.png');
