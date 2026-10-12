// 양팔 낮게 벌리기 자세 3장(① 기본 ② 중간 ③ 최종) 저장 + 비교 이미지 (작업 폴더 전용)
const fs = require('fs'), path = require('path');
const p = require('../../PauseUI_VARCO/tools/pix.js');
const AA = require('./arm_art.js');
const R = path.join(__dirname, '..'), OUT = path.join(R, 'output'), VER = process.env.VER || 'v1', CELLS = path.join(OUT, 'OpenArms_' + VER + '_cells'), SRC = path.join(OUT, 'varco_sources');
fs.mkdirSync(CELLS, { recursive: true }); fs.mkdirSync(SRC, { recursive: true });
const stages = [['1_rest', 'rest'], ['2_mid', 'mid'], ['3_final', 'final']], cells = [], infos = {};
for (const [name, st] of stages) { const r = AA.buildStage(st, { guard: VER !== 'v1' }); cells.push(r.img); infos[name] = r.info; p.encode(r.img, path.join(CELLS, 'CrystalQueen_OpenArms_' + name + '.png')); }
fs.writeFileSync(path.join(OUT, 'OpenArms_' + VER + '_build_info.json'), JSON.stringify({ method: '2x2 스프라이트 픽셀 = 도트 1칸 격자(블록 위상 (1,1))에서 팔 블록 선 + 원본 손 패치, 비운 자리는 VARCO 팔 없는 바탕(2x2 스냅)·주변 보라색으로 채움', geometry_blocks: AA.GEO, infos }, null, 1));
// VARCO 원본 보존: 팔 없는 바탕(채택), 이번 지시로 만든 팔 벌리기 후보 4장(폐기)
for (const [from, to] of [['work/noarm1/noarm_4.png', 'noarm_r1_4_base.png'], ['work/noarm_art4.png', 'noarm_r1_4_base_art-grid_2x2.png'], ['work/open1/open_1.png', 'openarms_r1_1_discarded.png'], ['work/open1/open_2.png', 'openarms_r1_2_discarded.png'], ['work/open1/open_3.png', 'openarms_r1_3_discarded.png'], ['work/open1/open_4.png', 'openarms_r1_4_discarded.png']]) if (!fs.existsSync(path.join(SRC, to))) fs.copyFileSync(path.join(R, from), path.join(SRC, to));
const BG = [40, 46, 60];
function sheet(k, crop, gap) {
  const [cx, cy, cw, ch] = crop, W = cw * k * 3 + gap * 2, H = ch * k, o = p.blank(W, H);
  for (let i = 0; i < W * H; i++) { o.d[i * 4] = BG[0]; o.d[i * 4 + 1] = BG[1]; o.d[i * 4 + 2] = BG[2]; o.d[i * 4 + 3] = 255; }
  cells.forEach((c, i) => { const ox = i * (cw * k + gap); for (let y = 0; y < H; y++) for (let x = 0; x < cw * k; x++) { const si = ((cy + (y / k | 0)) * 160 + cx + (x / k | 0)) * 4; if (c.d[si + 3]) c.d.copy(o.d, (y * o.w + ox + x) * 4, si, si + 4); } });
  return o;
}
p.encode(sheet(2, [28, 20, 130, 131], 4), path.join(OUT, 'CrystalQueen_OpenArms_' + VER + '_3poses_actual-size_x2.png'));
p.encode(sheet(6, [28, 20, 130, 131], 12), path.join(OUT, 'CrystalQueen_OpenArms_' + VER + '_3poses_nearest_x6.png'));
p.encode(sheet(10, [48, 80, 70, 46], 12), path.join(OUT, 'CrystalQueen_OpenArms_' + VER + '_3poses_arms-closeup_x10.png'));
console.log('saved', stages.map(s => s[0]).join(' '), JSON.stringify(infos['3_final']));
