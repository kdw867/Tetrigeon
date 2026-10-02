// 타이틀 레이어 합성 미리보기 (1920×1080). 모든 레이어 도트 1칸 = 화면 2px, 최근접 확대. 로고 자리는 비워 둠
const p = require('../../PauseUI_VARCO/tools/pix.js'), path = require('path');
const R = path.join(__dirname, '..'), P = n => p.decode(`${R}/parts/${n}.png`);
const W = 1920, H = 1080, out = p.blank(W, H);
function put(img, x0, y0, k) { // 정수 배율 최근접 + 이진 알파
  for (let y = 0; y < img.h * k; y++) for (let x = 0; x < img.w * k; x++) {
    const X = x0 + x, Y = y0 + y; if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
    const s = (Math.floor(y / k) * img.w + Math.floor(x / k)) * 4; if (img.d[s + 3] < 128) continue;
    img.d.copy(out.d, (Y * W + X) * 4, s, s + 3); out.d[(Y * W + X) * 4 + 3] = 255;
  }
}
const C = 2; // 도트 1칸 = 화면 2px (게임 몬스터와 같은 밀도)
put(P('T_Title_BG'), 0, 0, C);
const floor = 910; // 배경 돌 바닥 윗면 (화면 y)
const q = P('T_Title_Queen'), s = P('T_Title_Sentinel'), l = P('T_Title_Lemy');
const qx = 1890 - q.w * C, sx = qx + 40 - s.w * C; // 퀸은 오른쪽 끝, 센티넬은 퀸 앞쪽 왼편
put(q, qx, floor + 24 - q.h * C, C);
put(s, sx, floor + 24 - s.h * C, C);
put(l, 300, floor - 70 - l.h * C, C); // 레미는 왼쪽에서 뛰어오름
// 메뉴: START는 마우스를 올린 상태로 표시
const b = P('T_Title_Btn_START'), bx = Math.round((W - b.w * C) / 2);
put(P('T_Title_Btn_START_Hover'), bx, 520, C);
put(P('T_Title_Btn_OPTION'), bx, 640, C);
put(P('T_Title_Btn_EXIT'), bx, 760, C);
p.encode(out, `${R}/preview/Title_Layers_FHD.png`);
console.log(JSON.stringify({ floor, queen: [qx, floor + 24 - q.h * C, q.w * C, q.h * C], sentinel: [sx, floor + 24 - s.h * C, s.w * C, s.h * C], lemy: [300, floor - 70 - l.h * C, l.w * C, l.h * C], button: [bx, b.w * C, b.h * C] }));
