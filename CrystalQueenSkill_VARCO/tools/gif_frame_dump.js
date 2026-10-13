// GIF 한 프레임을 PNG 로 저장해 눈으로 확인 (읽기 전용 진단): node gif_frame_dump.js <gif> <프레임번호> <출력png>
const fs = require('fs'), p = require('../../PauseUI_VARCO/tools/pix.js'), { decode } = require('../../PixelFX_VARCO/tools/gif_check.js');
const g = decode(fs.readFileSync(process.argv[2])), f = g.frames[+process.argv[3]]; console.log('프레임', g.frames.length, '크기', g.W + 'x' + g.H, '지연', f.delay);
p.encode({ w: g.W, h: g.H, d: f.d }, process.argv[4]);
