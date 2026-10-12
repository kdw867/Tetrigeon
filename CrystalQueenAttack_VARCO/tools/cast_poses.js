// 수정여왕 시전 자세 2종 (작업 폴더 전용): A = 명치 앞에서 손 모으기, B = 두 팔을 앞(화면 왼쪽)으로 뻗기
// arm_art.js 의 블록 팔(전완 수정 암가드)·원본 손 패치(90도 단위 회전)를 그대로 쓰고, 블록 좌표로 기하만 지정한다. (블록 (i,j) = 픽셀 (2i+1..2i+2, 2j+1..2j+2))
const path = require('path');
const p = require('../../PauseUI_VARCO/tools/pix.js');
const AA = require('./arm_art.js');
// S 어깨, E 팔꿈치, W 손목(전완 끝), hand.at 손목 끝 블록(손이 여기서 rot 방향으로 뻗음)
const POSES = {
  A_clasp: { order: ['R', 'L'], geo: { // 손 모음: 팔꿈치를 몸 바깥으로 벌려 전완(수정 암가드)을 안쪽 수평으로 모으고, 두 손이 명치 앞에서 서로 마주보며 2px 떨어짐 (암가드는 위쪽으로 두껍게)
    L: { S: [36, 43], E: [31, 48], W: [36, 49], hand: { rot: 'right', at: [36, 50] }, wide: 'up' },
    R: { S: [46, 44], E: [51, 48], W: [49, 49], hand: { rot: 'left', at: [49, 49] }, wide: 'up' } } },
  B_reach: { order: ['R', 'L'], geo: { // 앞으로 뻗기: 가까운 팔(화면 왼쪽)은 길게, 먼 팔(화면 오른쪽)은 가슴 앞을 가로질러 약간 아래에서 같은 방향
    L: { S: [36, 43], E: [31, 45], W: [26, 46], hand: { rot: 'left', at: [25, 46] }, wide: 'down' },
    R: { S: [46, 44], E: [41, 48], W: [36, 50], hand: { rot: 'left', at: [35, 50] }, wide: 'down' } } }
};
function build(name) { const o = POSES[name]; return AA.buildStage('final', { guard: true, geo: o.geo, order: o.order }); }
// 두 손 사이 빈 픽셀 수 (같은 줄에서 왼손 맨 오른쪽 ~ 오른손 맨 왼쪽, 윤곽 포함), 줄별 최솟값
function handGap(r) { const L = {}, R = {}; for (const [x, y] of r.hands.L || []) L[y] = Math.max(L[y] ?? -1, x); for (const [x, y] of r.hands.R || []) R[y] = Math.min(R[y] ?? 999, x); const g = Object.keys(L).filter(y => y in R).map(y => R[y] - L[y] - 1); return g.length ? { min: Math.min(...g), rows: g.length } : null; }
module.exports = { POSES, build, handGap };
if (require.main === module) { for (const n of Object.keys(POSES)) { const r = build(n); p.encode(r.img, process.argv[2] + '/' + n + '.png'); console.log(n, JSON.stringify(r.info), '두 손 빈 픽셀', JSON.stringify(handGap(r))); } }
