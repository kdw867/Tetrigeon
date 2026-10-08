// 7개 시나리오의 핵심 두 순간을 2배로 한 장에 모은 확인용 이미지 (실제 게임 영상이 아닌 합성)
const { p, R, ROOT, blit, solid } = require('./lib_fx');
const board = require(`${ROOT}/StageBoardUI_VARCO/tools/lib_board.js`);
const font = board.loadFont(`${ROOT}/RewardUI_VARCO/font/PixelFont.json`, `${ROOT}/RewardUI_VARCO/font/PixelFont_cream.png`);
const names = ['1 LOCK', '2 CLEAR x1', '3 CLEAR x4', '4 CRYSTAL x1', '5 CRYSTAL x5', '6 LOCK + CLEAR', '7 CLEAR + CRYSTAL'];
const ticks = [[1, 3], [2, 4], [2, 4], [2, 5], [2, 5], [2, 4], [5, 8]]; // 사건 시작 후 틱 (20ms 단위)
const items = names.map((n, i) => ({ n, a: p.decode(`${R}/work/dump2_S${i + 1}_t${ticks[i][0]}.png`), b: p.decode(`${R}/work/dump2_S${i + 1}_t${ticks[i][1]}.png`) }));
const g = 10, head = 26; let H = g; for (const it of items) H += head + Math.max(it.a.h, it.b.h) + g;
const W = Math.max(...items.map(it => it.a.w + it.b.w + 3 * g));
const out = solid(W, H, '#070c14'); let y = g;
for (const it of items) { board.drawText(out, font, it.n, g, y + 4, 2, 'l'); y += head; blit(out, it.a, g, y, 1); blit(out, it.b, 2 * g + it.a.w, y, 1); y += Math.max(it.a.h, it.b.h) + g; }
p.encode(out, `${R}/preview/Scenarios_contact_x2.png`); console.log(out.w + 'x' + out.h);
