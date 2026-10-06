// TETRIGEON 로고 시안: 글자를 테트로미노로 채우고 조각마다 일반 / 강화 / 수정(강화 Lv.2~5의 수정 칸) 단계를 정함. 블록은 게임 그림 그대로 (Unity에는 넣지 않음)
const path = require('path'), px = require('../../PauseUI_VARCO/tools/pix.js'), logo = require('./mino_logo.js');
const ROOT = path.join(__dirname, '..');
const ORDER = { I: [2, 0, 3, 1], J: [1, 3, 0, 2], L: [3, 0, 2, 1], O: [0, 2, 3, 1], S: [2, 1, 3, 0], T: [0, 3, 1, 2], Z: [3, 1, 0, 2] }; // 종류별 수정 칸이 늘어나는 순서 (게임처럼 같은 종류는 같은 칸)
const tierAt = (type, lv, cell) => lv === 0 ? 'N' : ORDER[type].slice(0, lv - 1).includes(cell) ? 'C' : 'U'; // Lv.0 일반, Lv.1 강화, Lv.n은 (n-1)칸 수정
let seed = 11; const rand = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
const VARIANTS = {
  Grow: (() => { // 성장형: 왼쪽 글자부터 돌 → 강화 → 수정 (조각마다 한 단계씩 엇갈림)
    const base = [0, 0, 1, 1, 2, 3, 4, 5, 5];
    return (li, l, pi, cell) => tierAt(l.pieces[pi].type, Math.max(0, base[li] - (pi % 2)), cell);
  })(),
  Mix: (() => { // 섞임형: 조각마다 단계를 섞되 돌이 바탕
    const lv = new Map();
    return (li, l, pi, cell) => {
      const k = li + ':' + pi; if (!lv.has(k)) { const r = rand(); lv.set(k, r < 0.45 ? 0 : r < 0.7 ? 1 : r < 0.88 ? 2 + Math.floor(rand() * 3) : 5); }
      return tierAt(l.pieces[pi].type, lv.get(k), cell);
    };
  })(),
};
const { dark, cyan } = logo.sampleColors();
const bg = px.decode(ROOT + '/preview/Title_Layers_FHD.png'); // 고해상도 타이틀 미리보기 위에 얹어 봄
const crops = [];
for (const [name, tierOf] of Object.entries(VARIANTS)) {
  const { img } = logo.renderWord(['TETRIGEON'], 1, 1, tierOf);
  for (const [v, im] of [['A', logo.dropShadow(logo.ring(img, 3, dark), 6, dark)], ['B', logo.dropShadow(logo.ring(logo.ring(img, 3, dark), 2, cyan), 6, dark)]]) { // A 외곽선+그림자, B 바깥 청록 테두리
    px.encode(im, `${ROOT}/parts/T_Logo_Tier_${name}_${v}.png`);
    const out = { w: bg.w, h: bg.h, d: Buffer.from(bg.d) }, ox = (bg.w - im.w) >> 1, oy = 110; // 화면 위쪽 가운데
    for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) { const s = (y * im.w + x) * 4; if (im.d[s + 3] < 128) continue; im.d.copy(out.d, ((oy + y) * out.w + ox + x) * 4, s, s + 3); }
    px.encode(out, `${ROOT}/preview/Logo_Tier_${name}_${v}_FHD.png`);
    crops.push(px.crop(out, 0, 80, out.w, 360));
    console.log(name, v, im.w + 'x' + im.h);
  }
}
const sheet = px.blank(1920, crops.length * 360 + (crops.length - 1) * 8); // 위부터 Grow A, Grow B, Mix A, Mix B (위쪽 360px만)
crops.forEach((c, i) => c.d.copy(sheet.d, i * 368 * 1920 * 4));
px.encode(sheet, `${ROOT}/preview/Logo_Tier_Compare.png`);
