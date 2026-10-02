// 수정 칸 미리보기: 7종 × Lv.1~5 조각을 게임과 같은 칸 크기(27px 칸, 그림 25px)로 배치. 원본 크기 + ×3 확대
const p = require('../../PauseUI_VARCO/tools/pix.js'), path = require('path');
const R = path.join(__dirname, '..'), U = R + '/../Tetrigeon/Assets/@Resources/Resources/MinoSprites/Upgraded';
const TYPES = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
const SPAWN = { I: [[0, 2], [1, 2], [2, 2], [3, 2]], O: [[1, 1], [2, 1], [1, 2], [2, 2]], T: [[1, 2], [0, 1], [1, 1], [2, 1]], S: [[1, 2], [2, 2], [0, 1], [1, 1]], Z: [[0, 2], [1, 2], [1, 1], [2, 1]], J: [[0, 2], [0, 1], [1, 1], [2, 1]], L: [[2, 2], [0, 1], [1, 1], [2, 1]] }; // TetrominoData 스폰 칸 (칸 번호 순서)
const ORDER = { I: [2, 0, 3, 1], J: [1, 3, 0, 2], L: [3, 0, 2, 1], O: [0, 2, 3, 1], S: [2, 1, 3, 0], T: [0, 3, 1, 2], Z: [3, 1, 0, 2] }; // 예시 강화 순서 (Lv.2부터 앞에서부터 수정, 실제 게임은 무작위)
const CDIR = R + "/" + (process.argv[2] || "parts/Crystal"), NAME = process.argv[3] || "preview/Crystal_Levels"; // 수정 칸 폴더, 출력 이름 (비교용 후보는 work 아래)
const PITCH = 27, ART = 25, BG = [16, 21, 32], BACK = [24, 31, 43]; // 칸 간격, 그림 크기, 보드 바탕, 칸 바탕(CellBacking)
const cellArt = (T, k, crystal) => { // 칸 그림을 25×25로 최근접 샘플링 (Unity Point 필터와 같음) + L은 90° 반시계 회전
  const s = p.decode(crystal ? `${CDIR}/${T}_${k}.png` : `${U}/${T}_${k}.png`), o = p.blank(ART, ART);
  for (let y = 0; y < ART; y++) for (let x = 0; x < ART; x++) {
    const sx = Math.floor((x + 0.5) * s.w / ART), sy = Math.floor((y + 0.5) * s.h / ART);
    const [dx, dy] = T === 'L' ? [y, ART - 1 - x] : [x, y]; // 화면 기준 반시계 90°
    s.d.copy(o.d, (dy * ART + dx) * 4, (sy * s.w + sx) * 4, (sy * s.w + sx) * 4 + 4);
  }
  return o;
};
const COLS = 5, BOX = PITCH * 4 + 12, W = BOX * COLS, H = BOX * 7 * 0.62 | 0, out = p.blank(W, H);
for (let i = 0; i < W * H; i++) { out.d[i * 4] = BG[0]; out.d[i * 4 + 1] = BG[1]; out.d[i * 4 + 2] = BG[2]; out.d[i * 4 + 3] = 255; }
const rowH = H / 7 | 0;
TYPES.forEach((T, r) => {
  for (let lv = 1; lv <= 5; lv++) {
    const crystals = new Set(ORDER[T].slice(0, lv - 1)); // Lv.n은 (n-1)칸이 수정
    const cells = SPAWN[T], minX = Math.min(...cells.map(c => c[0])), maxY = Math.max(...cells.map(c => c[1]));
    const w = (Math.max(...cells.map(c => c[0])) - minX + 1) * PITCH, h = (maxY - Math.min(...cells.map(c => c[1])) + 1) * PITCH;
    const ox = (lv - 1) * BOX + ((BOX - w) >> 1), oy = r * rowH + ((rowH - h) >> 1);
    cells.forEach(([cx, cy], k) => {
      const x0 = ox + (cx - minX) * PITCH + 1, y0 = oy + (maxY - cy) * PITCH + 1, a = cellArt(T, k, crystals.has(k));
      for (let y = 0; y < ART; y++) for (let x = 0; x < ART; x++) { const s = (y * ART + x) * 4, d = ((y0 + y) * W + x0 + x) * 4; if (a.d[s + 3] < 128) { out.d[d] = BACK[0]; out.d[d + 1] = BACK[1]; out.d[d + 2] = BACK[2]; } else a.d.copy(out.d, d, s, s + 3); }
    });
  }
});
p.encode(out, `${R}/${NAME}_x1.png`);
p.encode(p.nearestUp(out, 3), `${R}/${NAME}_x3.png`);
console.log(W + 'x' + H);
