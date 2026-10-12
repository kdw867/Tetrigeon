// 시전 핵심 장면 5개 (작업 폴더 전용, Unity와 무관):
//  1 손 모음(명치 앞) / 2 모은 손 사이 마법 / 3 마법 + 등 뒤 수정 3개 생성 / 4 팔 앞으로 뻗기 + 마법 / 5 마법 + 수정 발사
// 캐릭터 레이어(output/CastScenes_v1_cells/)와 이펙트 레이어(output/CastScenes_v1_fx/)를 따로 저장하고 같은 160x160 좌표로 합쳐 비교 이미지를 만든다.
const fs = require('fs'), path = require('path');
const p = require('../../PauseUI_VARCO/tools/pix.js');
const CP = require('./cast_poses.js'), FX = require('./fx_cast.js');
const R = path.join(__dirname, '..'), OUT = path.join(R, 'output'), VER = process.env.VER || 'v2', CD = path.join(OUT, 'CastScenes_' + VER + '_cells'), FD = path.join(OUT, 'CastScenes_' + VER + '_fx'); // 버전별 폴더 (이전 버전 보존)
fs.mkdirSync(CD, { recursive: true }); fs.mkdirSync(FD, { recursive: true });
const A = CP.build('A_clasp').img, B = CP.build('B_reach').img;
const HAND_A = [41, 50], HAND_B = [15, 46]; // 마법 중심 블록: A = 모은 손 사이, B = 뻗은 손 바로 앞(화면 왼쪽)
const CRY = [[66, 29], [69, 40], [66, 50]]; // 등 뒤(여왕 오른쪽 여백) 수정 3개의 왼쪽 위 블록. 높이를 달리함 (이전 핵심 장면과 같은 위치)
const FIRE_DX = [-15, -7, -1]; // 발사 중: 1번 30px(여왕 키의 약 25%) 이동, 2번 비행 중간, 3번 막 발사 (블록 단위)
const fx = (draw) => { const c = FX.blank(); draw(c); return c; };
const SC = [
  { key: '1_clasp', name: '손 모음', ch: A, fx: fx(() => { }) },
  { key: '2_spark', name: '손 사이 마법', ch: A, fx: fx(c => FX.placeC(c, 'spark1', ...HAND_A)) },
  { key: '3_spawn', name: '마법 + 등 뒤 수정 생성', ch: A, fx: fx(c => { FX.placeC(c, 'spark2', ...HAND_A); CRY.forEach(([i, j]) => FX.place(c, 'crystal', i, j)); }) },
  { key: '4_reach', name: '팔 뻗기 + 마법', ch: B, fx: fx(c => { FX.placeC(c, 'star', ...HAND_B); CRY.forEach(([i, j]) => FX.place(c, 'crystal', i, j)); }) },
  { key: '5_fire', name: '마법 + 수정 발사', ch: B, fx: fx(c => { FX.placeC(c, 'burst', ...HAND_B); CRY.forEach(([i, j], n) => FX.place(c, 'crystal', i + FIRE_DX[n], j)); }) }];
SC.forEach(s => { p.encode(s.ch, path.join(CD, 'CrystalQueen_Cast_' + s.key + '_character.png')); p.encode(s.fx, path.join(FD, 'CrystalQueen_Cast_' + s.key + '_fx.png')); });
const merge = (a, b) => { const o = { w: 160, h: 160, d: Buffer.from(a.d) }; for (let i = 0; i < 25600; i++) if (b.d[i * 4 + 3]) b.d.copy(o.d, i * 4, i * 4, i * 4 + 4); return o; }; // 캐릭터 위에 이펙트
const merged = SC.map(s => merge(s.ch, s.fx)), BG = [40, 46, 60];
function sheet(k, imgs, crop, gap) { const [cx, cy, cw, ch] = crop, W = cw * k * imgs.length + gap * (imgs.length - 1), H = ch * k, o = p.blank(W, H); for (let i = 0; i < W * H; i++) { o.d[i * 4] = BG[0]; o.d[i * 4 + 1] = BG[1]; o.d[i * 4 + 2] = BG[2]; o.d[i * 4 + 3] = 255; } imgs.forEach((c, i) => { const ox = i * (cw * k + gap); for (let y = 0; y < H; y++) for (let x = 0; x < cw * k; x++) { const si = ((cy + (y / k | 0)) * 160 + cx + (x / k | 0)) * 4; if (c.d[si + 3]) c.d.copy(o.d, (y * o.w + ox + x) * 4, si, si + 4); } }); return o; }
const CROP = [20, 20, 140, 135];
p.encode(sheet(2, merged, CROP, 4), path.join(OUT, 'CrystalQueen_CastScenes_' + VER + '_5scenes_actual-size_x2.png'));
p.encode(sheet(3, merged, CROP, 6), path.join(OUT, 'CrystalQueen_CastScenes_' + VER + '_5scenes_nearest_x3.png'));
p.encode(sheet(6, [merged[1], merged[2]], [44, 60, 70, 70], 10), path.join(OUT, 'CrystalQueen_CastScenes_' + VER + '_hands-magic_x6.png'));
p.encode(sheet(6, [merged[3], merged[4]], [20, 60, 70, 70], 10), path.join(OUT, 'CrystalQueen_CastScenes_' + VER + '_reach-magic_x6.png'));
p.encode(sheet(10, [A, B], [20, 76, 100, 50], 10), path.join(OUT, 'CrystalQueen_CastScenes_' + VER + '_arms-closeup_x10.png'));
fs.writeFileSync(path.join(OUT, 'CastScenes_' + VER + '_build_info.json'), JSON.stringify({ poses: CP.POSES, magicCenterBlocks: { A: HAND_A, B: HAND_B }, crystalTopLeftBlocks: CRY, fireOffsetBlocks: FIRE_DX, scenes: SC.map(s => s.key + ' ' + s.name) }, null, 1));
console.log('saved', SC.map(s => s.key).join(' '));
