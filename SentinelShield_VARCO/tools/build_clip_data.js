// 시간표 JSON 에서 Unity 애니메이션 클립 6개의 키 목록을 뽑는다 (작업 폴더 전용). 출력 work/unity/clips.tsv: 클립 \t 길이(초) \t 반복(0/1) \t 경로 \t 스프라이트 이름('-' = 비움) \t 시간(초)
// 경로 '' = 몸통(EpicIdle 자신), EpicShieldFill/EpicShieldRim = 보호막 층(농도는 스크립트가 알파로), EpicShieldFx = 생성·폭발·파손·녹아내림 프레임, EpicStunStars = 스턴 별.
const fs = require('fs'), path = require('path');
const T = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'output', 'Frames_v1', 'SentinelShield_timeline_v1.json'), 'utf8'));
const B = (n) => 'AmethystSentinel_Shield_' + n, pad = (n) => String(n).padStart(2, '0'), sec = (ms) => +(ms / 1000).toFixed(3);
const fail = T.fail.frames, succ = T.success.frames, by = (fr, id) => { const f = fr.find(x => x.id === id); if (!f) throw new Error('프레임 없음 ' + id); return f; };
const clips = []; const add = (name, length, loop, rows) => clips.push({ name, length, loop, rows });
// 1) 웅크리며 보호막 생성: 몸 mid(S1) → hold(C0~C6), 이펙트 create_0~6. 기준 = 성공/실패 공통 앞부분(S1, C0~C6)
{ const s1 = by(fail, 'S1'); let t = s1.ms; const rows = [['', B('mid'), 0], ['', B('hold'), sec(t)], ['EpicShieldFx', '-', 0]];
  for (let i = 0; i < 7; i++) { const c = by(fail, 'C' + i); rows.push(['EpicShieldFx', 'ShieldFx_create_' + i, sec(t)]); t += c.ms; }
  rows.push(['', B('hold'), sec(t)], ['EpicShieldFx', '-', sec(t)]); add('AmethystSentinel_ShieldCast', sec(t), 0, rows); }
// 2) 보호막 유지: 몸 hold, 면·테두리 층 스프라이트 (농도는 스크립트 알파)
add('AmethystSentinel_ShieldHold', 1, 1, [['', B('hold'), 0], ['', B('hold'), 1], ['EpicShieldFill', 'ShieldFx_fill', 0], ['EpicShieldFill', 'ShieldFx_fill', 1], ['EpicShieldRim', 'ShieldFx_rim', 0], ['EpicShieldRim', 'ShieldFx_rim', 1]]);
// 3) 폭발 → 복귀: X0~X9 이펙트, R1 몸 hold 유지(이펙트 없음), R2 mid, R3 stand
{ const t0 = by(fail, 'X0').start_ms, rows = []; for (let i = 0; i < 10; i++) { const f = by(fail, 'X' + i); rows.push(['EpicShieldFx', 'ShieldFx_explode_' + i, sec(f.start_ms - t0)]); }
  const r1 = by(fail, 'R1'), r2 = by(fail, 'R2'), r3 = by(fail, 'R3'), end = r3.start_ms + r3.ms - t0; rows.push(['EpicShieldFx', '-', sec(r1.start_ms - t0)], ['EpicShieldFx', '-', sec(end)]);
  rows.push(['', B('hold'), 0], ['', B('mid'), sec(r2.start_ms - t0)], ['', B('stand'), sec(r3.start_ms - t0)], ['', B('stand'), sec(end)]); add('AmethystSentinel_ShieldExplode', sec(end), 0, rows); }
// 4) 중간 파손 + 녹아내림: M0~M2, D00~D11, 몸은 D04 부터 스턴 자세, 별은 D08 부터 (스턴 유지 클립의 별 4번부터 이어짐)
{ const t0 = by(succ, 'M0').start_ms, rows = [], ids = ['M0', 'M1', 'M2', ...Array.from({ length: 12 }, (_, i) => 'D' + pad(i))]; let endMs = 0;
  ids.forEach((id) => { const f = by(succ, id), name = id[0] === 'M' ? 'ShieldFx_break_' + id[1] : 'ShieldFx_melt_' + id.slice(1); rows.push(['EpicShieldFx', name, sec(f.start_ms - t0)]); endMs = f.start_ms + f.ms - t0; });
  rows.push(['EpicShieldFx', '-', sec(endMs)]); rows.push(['', B('hold'), 0], ['', B('stun'), sec(by(succ, 'D04').start_ms - t0)], ['', B('stun'), sec(endMs)]);
  rows.push(['EpicStunStars', '-', 0]); // 별은 D08 부터 보이므로 그 전에는 비움 (첫 키 이전에는 첫 키 값이 유지되기 때문)
  for (let i = 0; i < 4; i++) rows.push(['EpicStunStars', 'ShieldFx_stars_' + pad(i), sec(by(succ, 'D' + pad(8 + i)).start_ms - t0)]); rows.push(['EpicStunStars', 'ShieldFx_stars_04', sec(endMs)]);
  add('AmethystSentinel_ShieldBreak', sec(endMs), 0, rows); }
// 5) 스턴 유지(반복): 몸 stun, 별 12프레임을 4번부터 한 바퀴 (파손 클립이 별 3번에서 끝나므로 이어짐)
{ const rows = [['', B('stun'), 0], ['', B('stun'), 0.84]]; for (let i = 0; i < 12; i++) rows.push(['EpicStunStars', 'ShieldFx_stars_' + pad((i + 4) % 12), sec(i * 70)]); rows.push(['EpicStunStars', 'ShieldFx_stars_04', 0.84]); add('AmethystSentinel_StunHold', 0.84, 1, rows); }
// 6) 일어서기: R1 hold → R2 mid → R3 stand (폭발 뒤 복귀와 같은 박자, 별 없음)
{ const r1 = by(fail, 'R1'), r2 = by(fail, 'R2'), r3 = by(fail, 'R3'), end = r1.ms + r2.ms + r3.ms; add('AmethystSentinel_ShieldRecover', sec(end), 0, [['', B('hold'), 0], ['', B('mid'), sec(r1.ms)], ['', B('stand'), sec(r1.ms + r2.ms)], ['', B('stand'), sec(end)]]); }
const lines = []; for (const c of clips) for (const [p, s, t] of c.rows.sort((a, b) => a[0].localeCompare(b[0]) || a[2] - b[2])) lines.push([c.name, c.length, c.loop, p || '.', s, t].join('\t'));
fs.writeFileSync(path.join(__dirname, '..', 'work', 'unity', 'clips.tsv'), lines.join('\n')); console.log(clips.map(c => c.name + ' ' + c.length + 's 키 ' + c.rows.length).join('\n'));
