// Unity 에 넣을 시트 2장을 만든다 (작업 폴더 전용, Assets 밖에 먼저 만들고 사용자 승인 뒤 복사): 몸 자세 시트(144x104 셀 4칸) + 이펙트 시트(208x136 셀 46칸).
// 입력은 build_all.js 가 저장한 output/Frames_v1/cells/ 의 PNG 그대로(바이트 단위로 같은 픽셀). 매니페스트(스프라이트 이름·사각형·피벗)를 함께 저장해 임포트와 클립 제작에 쓴다.
const fs = require('fs'), path = require('path');
const p = require('../../PauseUI_VARCO/tools/pix.js');
const CELLS = path.join(__dirname, '..', 'output', 'Frames_v1', 'cells'), OUT = path.join(__dirname, '..', 'work', 'unity'); fs.mkdirSync(OUT, { recursive: true });
function sheet(name, w, h, cols, list, pivotY) { // list: [[스프라이트 이름, 원본 파일], ...]
  const rows = Math.ceil(list.length / cols), img = p.blank(cols * w, rows * h), man = [];
  list.forEach(([sn, file], i) => { const c = p.decode(path.join(CELLS, file)); if (c.w !== w || c.h !== h) throw new Error(file + ' 크기 ' + c.w + 'x' + c.h); const cx = (i % cols) * w, cy = Math.floor(i / cols) * h; for (let y = 0; y < h; y++) c.d.copy(img.d, ((cy + y) * img.w + cx) * 4, y * w * 4, (y + 1) * w * 4); man.push({ name: sn, file, x: cx, y: img.h - cy - h, w, h, pivot: [0.5, pivotY] }); }); // 유니티 사각형은 아래가 원점
  p.encode(img, path.join(OUT, name + '.png')); return { file: name + '.png', width: img.w, height: img.h, sprites: man };
}
const rng = (n) => Array.from({ length: n }, (_, i) => i), pad = (n) => String(n).padStart(2, '0');
const body = sheet('T_AmethystSentinel_Shield', 144, 104, 4, ['stand', 'mid', 'hold', 'stun'].map(n => ['AmethystSentinel_Shield_' + n, 'Sentinel_' + n + '.png']), 10 / 104); // 발 기준점 = 아래에서 10px (공격 시트와 같은 피벗 0.09615385)
const fx = sheet('T_AmethystSentinel_ShieldFx', 208, 136, 8, [
  ['ShieldFx_fill', 'fx_layer_fill.png'], ['ShieldFx_rim', 'fx_layer_rim.png'],
  ...rng(7).map(i => ['ShieldFx_create_' + i, 'fx_create_' + i + '.png']),
  ...rng(10).map(i => ['ShieldFx_explode_' + i, 'fx_explode_X' + i + '.png']),
  ...rng(3).map(i => ['ShieldFx_break_' + i, 'fx_break_M' + i + '.png']),
  ...rng(12).map(i => ['ShieldFx_melt_' + pad(i), 'fx_melt_' + pad(i) + '.png']),
  ...rng(12).map(i => ['ShieldFx_stars_' + pad(i), 'fx_stars_' + pad(i) + '.png'])], 10 / 136); // 발 기준점 = 아래에서 10px (피벗 0.07352941)
fs.writeFileSync(path.join(OUT, 'sheet_manifest.json'), JSON.stringify({ ppu: 75.6, body, fx }, null, 1));
console.log('몸', body.width + 'x' + body.height, body.sprites.length + '칸 / 이펙트', fx.width + 'x' + fx.height, fx.sprites.length + '칸');
