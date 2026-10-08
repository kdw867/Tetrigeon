// LINE CLEAR 파티클 시안 페이지 (GIF 내장, 한 파일). 아티팩트로 올려 앱에서 움직이게 보기 위함
const fs = require('fs');
const R = require('path').join(__dirname, '..'), P = (n) => 'data:image/gif;base64,' + fs.readFileSync(`${R}/preview/${n}`).toString('base64');
const scenes = [
  [1, '1줄 삭제, 위쪽 블록이 바로 내려옴', '삭제된 줄 위의 블록이 같은 순간에 한 줄 내려옵니다. 파편은 내려오기 전 위치에서 나옵니다.'],
  [2, '2줄 동시 삭제', '두 줄이면 칸마다 1개씩 나옵니다.'],
  [3, '4줄 동시 삭제', '40칸에서 나올 파편을 32개로 줄여 보드가 덮이지 않게 했습니다.'],
  [4, '높은 위치의 줄 삭제', '보드 중간(11번째 줄)에서 지워져도 같은 방식으로 나옵니다.'],
  [5, '수정 칸 파괴와 동시', '수정 칸에는 일반 파편을 내지 않고 나머지 칸도 절반으로 줄여, 수정 파편(보라색)과 구분됩니다. 수정 파편은 0.06초 뒤에 이어집니다.'],
];
const html = `<title>LINE CLEAR 파티클</title>
<style>
:root{--bg:#0d1828;--panel:#14233a;--line:#23364c;--fg:#dbe7f3;--muted:#8fa3ba;--accent:#3ec0d6;--accent-fg:#06222a;--warn:#e9c46a;color-scheme:dark}
@media (prefers-color-scheme: light){:root:not([data-theme="dark"]){--bg:#eef3f8;--panel:#ffffff;--line:#cfdae6;--fg:#15263b;--muted:#51647b;--accent:#16798c;--accent-fg:#ffffff;--warn:#8a6100;color-scheme:light}}
:root[data-theme="light"]{--bg:#eef3f8;--panel:#ffffff;--line:#cfdae6;--fg:#15263b;--muted:#51647b;--accent:#16798c;--accent-fg:#ffffff;--warn:#8a6100;color-scheme:light}
:root[data-theme="dark"]{--bg:#0d1828;--panel:#14233a;--line:#23364c;--fg:#dbe7f3;--muted:#8fa3ba;--accent:#3ec0d6;--accent-fg:#06222a;--warn:#e9c46a;color-scheme:dark}
body{background:var(--bg);color:var(--fg);font-family:"Pretendard","Noto Sans KR",system-ui,sans-serif;line-height:1.6;padding-inline:max(16px,4vw);padding-block:28px 56px}
main{max-width:980px;margin-inline:auto;display:grid;gap:28px}
h1{font-size:1.6rem;margin:0;text-wrap:balance;letter-spacing:.01em}
h2{font-size:1.1rem;margin:0 0 6px;text-wrap:balance}
p{margin:0;max-width:68ch}
.note{border:1px solid var(--warn);color:var(--warn);padding:8px 12px;border-radius:6px;font-size:.92rem}
.muted{color:var(--muted);font-size:.92rem}
.params{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:1px;background:var(--line);border:1px solid var(--line);border-radius:8px;overflow:hidden}
.params div{background:var(--panel);padding:10px 14px;min-width:0}
.params b{display:block;font-size:.8rem;color:var(--muted);font-weight:600;letter-spacing:.04em;margin-bottom:2px}
.params span{font-variant-numeric:tabular-nums}
section{display:grid;gap:10px}
.pair{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:16px;align-items:start}
figure{margin:0;display:grid;gap:6px;min-width:0}
figcaption{font-size:.85rem;color:var(--muted)}
img{display:block;width:100%;height:auto;image-rendering:pixelated;border:1px solid var(--line);border-radius:4px;background:#070c14}
code{background:var(--panel);border:1px solid var(--line);border-radius:4px;padding:1px 5px;font-size:.88em}
ul{margin:0;padding-left:1.2em;display:grid;gap:4px;max-width:68ch}
</style>
<main>
  <header style="display:grid;gap:10px">
    <h1>LINE CLEAR 파티클 시안</h1>
    <p>긴 가로빛을 없애고, 지워지는 칸에서 작은 청록·백색 조각이 한 번 튀었다가 사라지게 바꾼 안입니다. LOCK 테두리와 수정 파괴는 그대로입니다.</p>
    <p class="note">실제 게임 화면 캡처 위에 같은 규칙으로 합성한 미리보기입니다. Unity 실행 영상이 아니며, 게임에는 아직 적용하지 않았습니다.</p>
  </header>
  <div class="params" aria-label="파티클 값">
    <div><b>수명</b><span>0.08 ~ 0.14초</span></div>
    <div><b>크기</b><span>3 ~ 5px (한 칸 27px의 11~19%)</span></div>
    <div><b>이동</b><span>바깥으로 약 0.5 ~ 1.2칸, 중력·궤적 없음</span></div>
    <div><b>방출</b><span>삭제 순간 한 번, 칸당 2개(한 줄) / 1개(두 줄 이상), 최대 32개</span></div>
    <div><b>색</b><span>옅은 백색 30% · 밝은 청록 40% · 청록 30%</span></div>
    <div><b>위치</b><span>삭제되는 칸의 압축 전 위치, 월드 기준</span></div>
  </div>
  <section>
    <h2>이전과 비교 (1줄 삭제)</h2>
    <p class="muted">왼쪽이 지금의 긴 가로빛, 오른쪽이 새 파티클입니다. 위쪽 블록이 내려와도 가로빛은 이전 줄에 남아 겹쳐 보입니다.</p>
    <div class="pair">
      <figure><img alt="이전 가로빛과 새 파티클 비교, 실제 속도" src="${P('Particles_Compare.gif')}"><figcaption>실제 속도</figcaption></figure>
      <figure><img alt="이전 가로빛과 새 파티클 비교, 4배 느리게" src="${P('Particles_Compare_slow.gif')}"><figcaption>4배 느리게</figcaption></figure>
    </div>
  </section>
${scenes.map(([id, t, d]) => `  <section>
    <h2>${id}. ${t}</h2>
    <p class="muted">${d}</p>
    <div class="pair">
      <figure><img alt="${t}, 실제 속도" src="${P(`Particles_S${id}_actual.gif`)}"><figcaption>실제 속도 (게임 화면 1배를 2배로 키움)</figcaption></figure>
      <figure><img alt="${t}, 4배 느리게" src="${P(`Particles_S${id}_slow_x3.gif`)}"><figcaption>4배 느리게, 3배 확대</figcaption></figure>
    </div>
  </section>`).join('\n')}
  <section>
    <h2>Unity에 옮길 때</h2>
    <ul>
      <li>Particle System 하나짜리 프리팹 <code>P_FX_ClearParticles</code>을 만들고, 이미 있는 4×4 흰색 텍스처를 재사용합니다. 새 아트는 만들지 않습니다.</li>
      <li><code>BoardEffectPlayer</code>가 지워진 줄의 칸마다 <code>Emit</code>으로 한 번만 내보냅니다. 월드 공간 시뮬레이션이라 블록이 내려와도 따라가지 않습니다.</li>
      <li>기존 가로빛 프리팹과 시트는 쓰지 않게 됩니다. 줄 삭제·압축·피해 계산·가방 정산 시점은 바꾸지 않습니다.</li>
    </ul>
  </section>
</main>
`;
fs.writeFileSync(`${R}/preview/LineClear_Particles_Preview.html`, html);
console.log('페이지 크기 KB', Math.round(html.length / 1024));
