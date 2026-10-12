// 프레임별 VARCO 지시문 (v2, 세부 버전). 공통 블록 + 프레임별 포즈 변화 블록. 기록용으로 work/prompts_v2.json 에 저장.
const fs = require('fs'), path = require('path');
const COMMON = `TASK: This is a pixel-art game sprite of a stone golem called the Amethyst Sentinel on a plain white background. Edit it into ONE frame of an attack animation by changing ONLY the pose described under POSE CHANGE. Everything that is not mentioned must stay exactly the same design as the first (input) image. The second image is only a pose reference showing a neighboring pose: use it only to judge how far to move, never copy its drawing style.

DESIGN LOCK (identical in every frame):
1. HEAD: small gray stone head, two small cyan rectangular eyes, a crown of three small purple crystals on top.
2. TORSO: broad gray stone chest with a cyan diamond-shaped core in the middle of the chest (about 9 dots wide) and a few small purple crystals around it. The core keeps the same size and brightness.
3. PICTURE-LEFT SIDE: a stone shoulder with one small purple crystal, and an arm ending in a huge round gray stone fist with NO crystals on it.
4. PICTURE-RIGHT SIDE: ONE huge purple crystal-cluster arm attached to the right-side shoulder: a mass of tall faceted amethyst crystals with pale pink highlights on the upper-left facets, with a gray stone hand under the crystals. The cluster keeps exactly the same crystals in every frame (same shapes, same count, same size, same colors) and only moves and rotates as ONE rigid piece. Never redraw, enlarge, shrink, merge, split or add crystals.
5. LEGS: two thick gray stone legs with wide flat feet and one purple crystal on each leg. The feet stay on the same ground line.
ARM IDENTITY: the crystal arm is ALWAYS attached to the shoulder on the RIGHT side of the picture and the gray stone fist arm is ALWAYS on the LEFT side. Never swap, mirror or flip them. The golem keeps facing slightly toward the left of the picture.

COLOR LOCK: the stone body keeps the same gray tones as the input (not darker, not lighter, not bluer). Use only these colors: darkest outline #10121C; stone grays #1E1D29 #2B2B38 #3D3D4B #52525F #6A6974 #858088; light stone #A1999D (inside the body only); amethyst purples #3C1668 #531990 #6D1AAD #851FCA #9C2FDB #B547E8 #D374F2; pale highlight #EBA5F9 (inside crystals only); cyan #1BCAD7 #31E6EF #6DF7FB. No other colors, no gradients.

PIXEL RULES: hard-edged chunky pixel art with exactly the same dot size as the input. The whole outer silhouette has a clean 1-dot outline in the darkest color #10121C; the outermost edge is NEVER white, light gray or pink. No anti-aliasing, no blur, no speckle noise, no glow, no motion lines, no impact effects, no shadow, no text, no new parts or weapons. Keep the canvas, camera angle and dot grid the same. Plain pure white background.

CLOCK CONVENTION for the crystal arm (as seen by the viewer): 12 o'clock = straight up, 3 o'clock = toward the right edge of the picture, 6 o'clock = straight down, 9 o'clock = toward the left edge of the picture (toward the enemy target). The AXIS of the crystal arm is the line from the right shoulder to the far tip of the crystal cluster.
`;
const FR = {
  f02: { src: 'REST', ref: 'WINDUP', pose: `POSE CHANGE (frame 2 of 12, a very small anticipation, about 20 percent of the way from the input rest pose toward the wind-up pose in the reference):
- BODY: sinks about 2 dots (knees bend slightly). Ground line and feet positions stay exactly as in the input.
- HEAD: dips about 1 dot and turns a little more toward the left.
- TORSO/SHOULDERS: lean very slightly back toward the right.
- CRYSTAL ARM: rotates about 10 degrees outward so its axis points to about 12:20 instead of 12:00, and lifts about 2 dots away from the body. Same crystals, same size.
- LEFT STONE FIST: stays low in the same place, moving only 1 dot with the body.
The result must look almost the same as the input, with a tiny crouch.` },
  f03: { src: 'REST', ref: 'WINDUP', pose: `POSE CHANGE (frame 3 of 12, about 50 percent of the way from the input rest pose toward the wind-up pose in the reference):
- BODY: sinks about 4 dots, knees clearly bent.
- HEAD: tilted down about 1 dot, still looking toward the left of the picture.
- TORSO/SHOULDERS: the right shoulder starts pulling back; the chest turns slightly toward the right.
- CRYSTAL ARM: axis rotates to about 12:50 (roughly 25 degrees clockwise from the input), the whole arm is raised about 6 dots and pushed about 5 dots outward to the right. It is the SAME cluster as the input, just tilted and lifted.
- LEFT STONE FIST: moves forward and up about 3 dots.
- STANCE: the left foot moves 2 dots toward the left edge and the right foot moves 2 dots toward the right edge; both soles stay on the same ground line.` },
  f04: { src: 'WINDUP', ref: 'REST', pose: `POSE CHANGE (frame 4 of 12, about 85 percent of the way to the full wind-up; the input IS the full wind-up, the reference is the rest pose):
- CRYSTAL ARM: slightly less raised and less far back than in the input: axis at about 1:20 instead of the input's 1:30, tip about 4 dots lower, base about 2 dots closer to the body.
- BODY: about 1 dot higher than in the input (knees slightly less bent).
- TORSO/SHOULDERS: slightly less twisted than in the input (about 10 percent less).
- LEFT STONE FIST: about 1 dot lower.
- STANCE: each foot about 1 dot closer to the center than in the input.
Everything else, including the colors and every crystal, stays identical to the input.` },
  f06: { src: 'WINDUP', ref: 'STRIKE', pose: `POSE CHANGE (frame 6 of 12, the swing has just started, about 30 percent of the way from the input wind-up pose toward the strike pose in the reference):
- CRYSTAL ARM: rotates counter-clockwise over the top so its axis points to about 12:15 (almost straight up, tip slightly to the right of straight up), raised high above the head height. The arm is drawn BEHIND the head so the face stays fully visible.
- TORSO/SHOULDERS: begin turning from the right toward the front and left (about 20 degrees of the turn).
- HEAD: stays looking toward the left, down about 1 dot.
- LEFT STONE FIST: moves back and slightly down to a low guard position beside the left hip.
- BODY/STANCE: knees stay bent as in the input, weight starts shifting onto the left (picture-left) leg. Feet stay as in the input.` },
  f07: { src: 'STRIKE', ref: 'WINDUP', pose: `POSE CHANGE (frame 7 of 12, the arm is coming down fast, about 70 percent of the way from the wind-up pose in the reference toward the strike pose, which is the input):
- CRYSTAL ARM: axis points to about 10:30 (up and to the left, descending); it is still higher than in the input: its tip is about 10 dots higher and about 8 dots farther right than in the input. The arm is drawn behind the head.
- TORSO/SHOULDERS: twisted about 70 percent of the way toward the strike twist of the input.
- HEAD: leaning forward and to the left, looking toward the left.
- LEFT STONE FIST: pulled back and up near the left shoulder, as in the input.
- STANCE: wide, same as the input.` },
  f10: { src: 'RECOIL', ref: 'REST', pose: `POSE CHANGE (frame 10 of 12, about 45 percent of the way from the input recoil pose back toward the rest pose in the reference):
- CRYSTAL ARM: rising back up in front of the right shoulder: axis rotates clockwise from the input's about 8:00 to about 10:45 (tip pointing up and to the left). The arm is drawn behind the head (the face stays fully visible) but in front of the lower torso.
- TORSO/SHOULDERS: straighten toward upright (about halfway to the rest pose).
- HEAD: facing left, level.
- LEFT STONE FIST: at its normal low rest position on the left side.
- BODY/STANCE: knees straighten about halfway to the rest pose, each foot moves about 2 dots toward its rest position.` },
  f11: { src: 'REST', ref: 'RECOIL', pose: `POSE CHANGE (frame 11 of 12, almost back to the rest pose, only about 15 percent of the way from the input rest pose toward the recoil pose in the reference):
- CRYSTAL ARM: axis at about 11:45 (leaning very slightly to the left of straight up), lowered beside the right shoulder, almost exactly as in the input.
- BODY: about 1 dot lower than the input (knees very slightly bent).
- STANCE: feet exactly as in the input.
- Everything else stays identical to the input.` },
};
const out = {}; for (const k in FR) out[k] = { source: FR[k].src, reference: FR[k].ref, prompt: COMMON + '\n' + FR[k].pose };
fs.writeFileSync(path.join(__dirname, '..', 'work', 'prompts_v2.json'), JSON.stringify(out, null, 1));
console.log(Object.keys(out).map(k => k + ' ' + out[k].prompt.length + ' chars (' + out[k].source + ' <- ref ' + out[k].reference + ')').join('\n'));
