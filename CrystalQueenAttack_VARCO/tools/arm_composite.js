// 팔 영역 합성 (작업 폴더 전용): 원본 Idle 01 을 기준으로, 팔 영역 안에서 "부류(남색/회색/보라/청록)가 바뀐 픽셀"만 VARCO 결과(셀 좌표로 스냅한 것)로 교체한다.
// 영역 밖과 부류가 같은 픽셀은 원본 픽셀을 그대로 둔다 → 얼굴·왕관·몸통·날개·하단과 결정 면의 도트 격자·색이 원본과 완전히 같다(해상도 일치).
// 사용: node tools/arm_composite.js <snapcq 셀> <out.png>
const p = require('../../PauseUI_VARCO/tools/pix.js');
const IDLE = 'C:/Users/MBC-501-15/Documents/Tetrigeon/Tetrigeon/Assets/@Resources/Enemies/CrystalQueenIdle/T_CrystalQueen_Idle.png';
const GR = new Set(['72,79,97', '116,119,129', '88,94,108']);
const cls = (d, o) => { if (!d[o + 3]) return 'none'; const r = d[o], g = d[o + 1], b = d[o + 2], k = r + ',' + g + ',' + b; if (GR.has(k)) return 'gray'; if (g > 140 && b > 180 && r < 150 && g > r + 60) return 'cyan'; return (r + g + b < 200 && b - g < 60) ? 'navy' : 'purple'; };
// 보호 영역: 머리·목·몸통·하단 몸(회색 덩어리) + 윤곽 1도트. 팔 상자: 왼쪽 X50-78 Y84-124, 오른쪽 X86-120 Y96-126
function zoneMask(base) {
  const W = 160, isG = (x, y) => x >= 0 && y >= 0 && x < W && y < W && cls(base.d, (y * W + x) * 4) === 'gray', lab = new Int32Array(W * W).fill(-1), comps = [];
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) { if (!isG(x, y) || lab[y * W + x] >= 0) continue; const id = comps.length, st = [[x, y]]; lab[y * W + x] = id; let n = 0, x0 = x, x1 = x, y0 = y, y1 = y; while (st.length) { const [a, b] = st.pop(); n++; x0 = Math.min(x0, a); x1 = Math.max(x1, a); y0 = Math.min(y0, b); y1 = Math.max(y1, b); for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = a + dx, Y = b + dy; if (isG(X, Y) && lab[Y * W + X] < 0) { lab[Y * W + X] = id; st.push([X, Y]); } } } comps.push({ id, n, x0, x1, y0, y1 }); }
  // 팔이 아닌 큰 덩어리: 머리(Y61-86), 몸통(X79-96,Y83-102), 하단 몸(n>=300)
  const prot = new Set(comps.filter(c => (c.y0 >= 60 && c.y1 <= 86 && c.x0 >= 72) || (c.x0 >= 79 && c.x1 <= 96 && c.y0 >= 83 && c.y1 <= 102 && c.n > 100) || c.n >= 300).map(c => c.id));
  const protect = new Uint8Array(W * W); for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) if (lab[y * W + x] >= 0 && prot.has(lab[y * W + x])) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < W && Y < W) protect[Y * W + X] = 1; }
  const zone = new Uint8Array(W * W); for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) { const inL = x >= 50 && x <= 78 && y >= 84 && y <= 124, inR = x >= 86 && x <= 120 && y >= 96 && y <= 126; if ((inL || inR) && !protect[y * W + x]) zone[y * W + x] = 1; }
  return { zone, protect, comps };
}
function composite(base, v) {
  const { zone } = zoneMask(base), out = { w: 160, h: 160, d: Buffer.from(base.d) }; let replaced = 0;
  for (let i = 0; i < 25600; i++) { if (!zone[i]) continue; const o = i * 4, a = cls(base.d, o), b = cls(v.d, o); if (a === b) continue; v.d.copy(out.d, o, o, o + 4); replaced++; }
  return { img: out, replaced, zoneN: zone.reduce((a, b) => a + b, 0) };
}
module.exports = { composite, zoneMask, cls };
if (require.main === module) { const [inp, outp] = process.argv.slice(2), base = p.crop(p.decode(IDLE), 0, 0, 160, 160), v = p.decode(inp), r = composite(base, v); p.encode(r.img, outp); console.log('zone dots', r.zoneN, 'replaced', r.replaced); }
