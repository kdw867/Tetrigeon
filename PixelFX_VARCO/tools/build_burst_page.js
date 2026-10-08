// 수정 파괴 7색 시안 페이지 (GIF 내장, 한 파일)
const fs = require('fs');
const R = require('path').join(__dirname, '..'), P = (n) => 'data:image/gif;base64,' + fs.readFileSync(`${R}/preview/${n}`).toString('base64');
const types = [
  ['I', '청록', '관통', '긴 바늘 모양 파편이 곧게 뻗고, 중심은 가늘고 긴 4방향 빛줄기입니다.'],
  ['J', '파랑', '빙결', '눈 결정 모양 중심광과 얼음 조각 파편이 천천히 퍼지고, 끝에 눈 반짝임이 남습니다.'],
  ['L', '주황', '치명타', '팔방 별빛과 굵은 X 모양 중심광, 날카로운 주황 파편이 빠르게 튑니다.'],
  ['O', '노랑', '방어막', '방어막처럼 번지는 링 위에 금색 판 조각이 대칭으로 얹혀 퍼집니다.'],
  ['S', '초록', '회복', '+ 모양 반짝임과 잎 모양 파편이 위쪽으로 가볍게 떠오릅니다.'],
  ['T', '보라', '독', '거품이 터지는 링, 보라 파편과 자홍색 독 방울이 아래로 떨어집니다.'],
  ['Z', '빨강', '폭발', '뾰족한 폭발 불꽃과 큼직한 붉은 파편, 주황 불씨가 빠르게 튑니다.'],
];
const html = `<title>수정 파괴 7색</title>
<style>
:root{--bg:#0d1828;--panel:#14233a;--line:#23364c;--fg:#dbe7f3;--muted:#8fa3ba;--accent:#3ec0d6;--warn:#e9c46a;color-scheme:dark}
@media (prefers-color-scheme: light){:root:not([data-theme="dark"]){--bg:#eef3f8;--panel:#ffffff;--line:#cfdae6;--fg:#15263b;--muted:#51647b;--accent:#16798c;--warn:#8a6100;color-scheme:light}}
:root[data-theme="light"]{--bg:#eef3f8;--panel:#ffffff;--line:#cfdae6;--fg:#15263b;--muted:#51647b;--accent:#16798c;--warn:#8a6100;color-scheme:light}
:root[data-theme="dark"]{--bg:#0d1828;--panel:#14233a;--line:#23364c;--fg:#dbe7f3;--muted:#8fa3ba;--accent:#3ec0d6;--warn:#e9c46a;color-scheme:dark}
body{background:var(--bg);color:var(--fg);font-family:"Pretendard","Noto Sans KR",system-ui,sans-serif;line-height:1.6;padding-inline:max(16px,4vw);padding-block:28px 56px}
main{max-width:1000px;margin-inline:auto;display:grid;gap:28px}
h1{font-size:1.6rem;margin:0;text-wrap:balance}
h2{font-size:1.1rem;margin:0 0 6px;text-wrap:balance}
h3{font-size:1rem;margin:0}
p{margin:0;max-width:68ch}
.note{border:1px solid var(--warn);color:var(--warn);padding:8px 12px;border-radius:6px;font-size:.92rem}
.muted{color:var(--muted);font-size:.9rem}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,210px),1fr));gap:14px}
.card{background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:12px;display:grid;gap:8px;min-width:0;align-content:start}
.card header{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}
.tag{font-size:.78rem;color:var(--accent);letter-spacing:.06em;font-weight:600}
img{display:block;width:100%;height:auto;image-rendering:pixelated;border:1px solid var(--line);border-radius:4px;background:#070c14}
section{display:grid;gap:10px}
.pair{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:16px;align-items:start}
figure{margin:0;display:grid;gap:6px;min-width:0}
figcaption{font-size:.85rem;color:var(--muted)}
.params{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:1px;background:var(--line);border:1px solid var(--line);border-radius:8px;overflow:hidden}
.params div{background:var(--panel);padding:10px 14px;min-width:0}
.params b{display:block;font-size:.8rem;color:var(--muted);font-weight:600;letter-spacing:.04em;margin-bottom:2px}
code{background:var(--panel);border:1px solid var(--line);border-radius:4px;padding:1px 5px;font-size:.88em}
ul{margin:0;padding-left:1.2em;display:grid;gap:4px;max-width:68ch}
</style>
<main>
  <header style="display:grid;gap:10px">
    <h1>수정 파괴 7색</h1>
    <p>수정 칸 파괴 이펙트를 미노 색마다 다른 모양으로 만든 시안입니다. 지금 게임에는 보라색 한 가지만 들어 있습니다.</p>
    <p class="note">미리보기 영상은 실제 게임 화면 캡처 위에 합성한 것이고 Unity 실행 영상이 아닙니다. 게임에는 적용하지 않았습니다.</p>
  </header>
  <section>
    <h2>일곱 가지를 나란히</h2>
    <div class="pair">
      <figure><img alt="7색 수정 파괴 비교, 실제 속도" src="${P('FX_CrystalBurst_7colors.gif')}"><figcaption>실제 속도 (0.27초)</figcaption></figure>
      <figure><img alt="7색 수정 파괴 비교, 4배 느리게" src="${P('FX_CrystalBurst_7colors_slow.gif')}"><figcaption>4배 느리게</figcaption></figure>
    </div>
  </section>
  <section>
    <h2>색마다 특색</h2>
    <div class="cards">
${types.map(([t, c, a, d]) => `      <article class="card"><header><h3>${t} ${c}</h3><span class="tag">${a}</span></header><img alt="${t} ${c} ${a} 수정 파괴" src="${P(`FX_CrystalBurst_${t}_x8.gif`)}"><p class="muted">${d}</p></article>`).join('\n')}
    </div>
  </section>
  <section>
    <h2>보드 위에서 (두 줄 삭제, 7색 수정 동시)</h2>
    <p class="muted">줄 삭제 파편은 약하게 줄고, 수정 파편이 0.06초 뒤에 이어집니다. 색마다 모양이 달라 섞여도 구분됩니다.</p>
    <div class="pair">
      <figure><img alt="두 줄 삭제 7색 수정 동시 파괴, 실제 속도" src="${P('Particles_S6_actual.gif')}"><figcaption>실제 속도</figcaption></figure>
      <figure><img alt="두 줄 삭제 7색 수정 동시 파괴, 4배 느리게" src="${P('Particles_S6_slow_x3.gif')}"><figcaption>4배 느리게, 3배 확대</figcaption></figure>
    </div>
  </section>
  <section>
    <h2>규격</h2>
    <div class="params">
      <div><b>칸 / 프레임</b>27×27, 8프레임 (마지막은 빈 프레임)</div>
      <div><b>재생</b>30fps, 0.267초</div>
      <div><b>표시</b>2배 (화면 54px, 두 칸 안). 가장 큰 폭은 빨강(±13도트)</div>
      <div><b>파편 수</b>색마다 결정 파편 4개 (+ 작은 반짝임·방울·불씨)</div>
      <div><b>시트</b>종류별 216×27, 통합 216×189 (행 순서 I J L O S T Z)</div>
      <div><b>VARCO</b>색마다 한 장씩 7장 (140크레딧)</div>
    </div>
  </section>
  <section>
    <h2>Unity에 옮길 때</h2>
    <ul>
      <li>통합 시트를 한 장으로 가져와 7줄 각각을 한 가지 효과로 씁니다. 행 순서가 <code>TetrominoType</code> 순서라서 <code>BoardEffectFrames.Play</code>의 번호를 종류 번호 그대로 넘기면 됩니다.</li>
      <li>줄 삭제 때 지워진 수정 칸의 종류를 칸 좌표와 함께 넘기도록 연출 알림에 조금 보탭니다. 능력 발동에 쓰는 기존 목록은 바꾸지 않습니다.</li>
      <li>모양·재생 시간·위치·시간차는 지금 수정 파괴와 같고, 색과 모양만 종류별로 달라집니다.</li>
    </ul>
  </section>
</main>
`;
fs.writeFileSync(`${R}/preview/CrystalBurst_7Colors_Preview.html`, html);
console.log('페이지 크기 KB', Math.round(html.length / 1024));
