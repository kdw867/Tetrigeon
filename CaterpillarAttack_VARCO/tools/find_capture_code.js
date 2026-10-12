// 대화 기록에서 이전에 Unity 프레임을 캡처했던 execute_code 코드를 찾아 출력 (작업 폴더 전용, 읽기만)
const fs = require('fs');
const rl = fs.readFileSync('C:/Users/MBC-501-15/.claude/projects/C--Users-MBC-501-15-Documents-Tetrigeon/1c733b5f-5eba-4df7-aeda-bb7d619f695f.jsonl', 'utf8').split('\n');
let found = 0;
for (let i = rl.length - 1; i >= 0 && found < 2; i--) {
  const l = rl[i];
  if (!(l.includes('ReadPixels') && l.includes('unity_frames'))) continue;
  try {
    const j = JSON.parse(l); const s = JSON.stringify(j);
    const idx = s.indexOf('ReadPixels');
    console.log('=== line', i, 'role', j.type || j.role); console.log(s.slice(Math.max(0, idx - 2500), idx + 1200).replace(/\n/g, '\n').replace(/\\"/g, '"'));
    found++;
  } catch (e) { }
}
