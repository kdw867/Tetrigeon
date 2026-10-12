// 선택한 팔 교차 후보 정리 (작업 폴더 전용): 회색 돌 고립 점 정리 → 연청(#BCC7F5) 점은 원본 Idle 01 의 위치(왕관 오른쪽·얼굴 왼쪽·가슴 코어 16도트)로만 남김
const path = require('path');
const p = require('../../PauseUI_VARCO/tools/pix.js');
const { denoise } = require('./denoise.js');
const [inp, out] = process.argv.slice(2), R = path.join(__dirname, '..');
const base = p.crop(p.decode('C:/Users/MBC-501-15/Documents/Tetrigeon/Tetrigeon/Assets/@Resources/Enemies/CrystalQueenIdle/T_CrystalQueen_Idle.png'), 0, 0, 160, 160), im = p.decode(inp);
const PB = [188, 199, 245], GRAY = [116, 119, 129], isPB = (d, o) => d[o] === PB[0] && d[o + 1] === PB[1] && d[o + 2] === PB[2];
const n0 = denoise(im); let toGray = 0, restored = 0, skipped = 0;
for (let y = 0; y < 160; y++) for (let x = 0; x < 160; x++) { const o = (y * 160 + x) * 4; if (im.d[o + 3] && isPB(im.d, o)) { im.d[o] = GRAY[0]; im.d[o + 1] = GRAY[1]; im.d[o + 2] = GRAY[2]; toGray++; } }
for (let y = 0; y < 160; y++) for (let x = 0; x < 160; x++) { const o = (y * 160 + x) * 4; if (base.d[o + 3] && isPB(base.d, o)) { if (!im.d[o + 3]) { skipped++; continue; } im.d[o] = PB[0]; im.d[o + 1] = PB[1]; im.d[o + 2] = PB[2]; restored++; } }
p.encode(im, out); console.log('denoise', n0, '연청→회색', toGray, '원본 위치 연청 복원', restored, '(투명이라 건너뜀', skipped + ')');
