// 핵심 장면 4개 (작업 폴더 전용): 기본 / 팔 교차 완료 / 등 뒤 수정 3개 생성 / 수정 발사와 소멸 섬광
// 캐릭터 레이어(output/KeyScenes_v1_cells/)와 이펙트 레이어(output/KeyScenes_v1_fx/)를 따로 저장하고, 같은 160x160 셀 좌표로 합쳐 보여준다.
const fs = require('fs'), path = require('path');
const p = require('../../PauseUI_VARCO/tools/pix.js');
const FXQ = require('./fx_queen.js');
const R = path.join(__dirname, '..'), OUT = path.join(R, 'output'), CD = path.join(OUT, 'KeyScenes_v1_cells'), FD = path.join(OUT, 'KeyScenes_v1_fx');
fs.mkdirSync(CD, { recursive: true }); fs.mkdirSync(FD, { recursive: true });
const IDLE = 'C:/Users/MBC-501-15/Documents/Tetrigeon/Tetrigeon/Assets/@Resources/Enemies/CrystalQueenIdle/T_CrystalQueen_Idle.png';
const rest = p.crop(p.decode(IDLE), 0, 0, 160, 160), cross = p.decode(path.join(R, 'work', 'cross_final.png'));
// 수정 3개: 등 뒤(여왕 오른쪽 여백)에서 생성, 왼쪽(레미 방향)으로 짧게 발사. 높이를 달리함. 발사 거리 30도트 = 여왕 키(119)의 약 25%
const SPAWN = [[141, 64], [147, 85], [141, 106]], DIST = 30;
const fxCell = (draw) => { const c = p.blank(160, 160); draw(c); return c; };
const SC = [
  { key: '1_rest', name: '기본 자세', ch: rest, fx: fxCell(() => { }) },
  { key: '2_cross', name: '팔 교차 완료', ch: cross, fx: fxCell(() => { }) },
  { key: '3_spawn', name: '등 뒤 수정 3개 생성', ch: cross, fx: fxCell(c => SPAWN.forEach(([x, y]) => FXQ.stamp(c, FXQ.crystal(2), x, y))) },
  { key: '4_fire', name: '수정 발사와 소멸 섬광', ch: cross, fx: fxCell(c => { // 1번은 사라지는 위치에서 섬광, 2번은 비행 중간, 3번은 막 발사
    FXQ.stamp(c, FXQ.flash(0), SPAWN[0][0] - DIST, SPAWN[0][1]); FXQ.stamp(c, FXQ.crystal(2), SPAWN[1][0] - 14, SPAWN[1][1]); FXQ.stamp(c, FXQ.crystal(2), SPAWN[2][0] - 3, SPAWN[2][1]); }) }];
SC.forEach(s => { p.encode(s.ch, path.join(CD, 'CrystalQueen_Scene_' + s.key + '_character.png')); p.encode(s.fx, path.join(FD, 'CrystalQueen_Scene_' + s.key + '_fx.png')); });
// 합성: 캐릭터 → 이펙트 순서(이펙트가 위)
const merge = (a, b) => { const o = { w: 160, h: 160, d: Buffer.from(a.d) }; for (let i = 0; i < 25600; i++) if (b.d[i * 4 + 3]) b.d.copy(o.d, i * 4, i * 4, i * 4 + 4); return o; };
const merged = SC.map(s => merge(s.ch, s.fx));
const CROP = [28, 20, 130, 135], BG = [40, 46, 60];
function sheet(k, imgs, gap) { const W = CROP[2] * k * imgs.length + gap * (imgs.length - 1), H = CROP[3] * k, o = p.blank(W, H); for (let i = 0; i < W * H; i++) { o.d[i * 4] = BG[0]; o.d[i * 4 + 1] = BG[1]; o.d[i * 4 + 2] = BG[2]; o.d[i * 4 + 3] = 255; } imgs.forEach((c, i) => { const ox = i * (CROP[2] * k + gap); for (let y = 0; y < H; y++) for (let x = 0; x < CROP[2] * k; x++) { const si = ((CROP[1] + (y / k | 0)) * 160 + CROP[0] + (x / k | 0)) * 4; if (c.d[si + 3]) c.d.copy(o.d, (y * o.w + ox + x) * 4, si, si + 4); } }); return o; }
p.encode(sheet(4, merged, 8), path.join(OUT, 'CrystalQueen_KeyScenes_v1_4scenes_x4.png'));
p.encode(sheet(2, merged, 4), path.join(OUT, 'CrystalQueen_KeyScenes_v1_actual-size_x2.png'));
console.log('saved scenes', SC.map(s => s.key).join(' '));
