// T13 의 눈·코어색 겹침 위치 확인 (읽기 전용 진단)
const path = require('path'), p = require('../../PauseUI_VARCO/tools/pix.js'), S = require('./skill_frames.js');
const J = JSON.parse(require('fs').readFileSync(path.join(S.OUT, 'SkillFrames_v1_timeline.json'), 'utf8'));
const s = J.steps.find(x => x.step === 'T13'), fx = p.decode(path.join(S.OUT, s.fx)), ch = p.decode(path.join(S.OUT, s.character));
for (let y = 0; y < 160; y++) for (let x = 0; x < 160; x++) { const o = (y * 160 + x) * 4; if (!fx.d[o + 3] || !ch.d[o + 3]) continue; const cc = ch.d[o] + ',' + ch.d[o + 1] + ',' + ch.d[o + 2]; if (cc === '51,229,239' || cc === '188,199,245') console.log('겹침', x, y, '캐릭터색', cc, 'FX색', fx.d[o] + ',' + fx.d[o + 1] + ',' + fx.d[o + 2]); }
console.log('T13 캐릭터 파일', s.character, '얼굴 이동', JSON.stringify(S.step('T13').mark_shift_px));
