// 카운트다운 미리보기 페이지 (한 파일, 이미지·GIF 내장, 속도·크기를 바꿔 볼 수 있음). 합성 미리보기이며 Unity 실행 영상이 아님
const fs = require('fs'), path = require('path');
const R = path.join(__dirname, '..');
const b64 = (file, mime) => `data:${mime};base64,` + fs.readFileSync(path.join(R, file)).toString('base64');
const png = (f) => b64(f, 'image/png'), gif = (f) => b64(f, 'image/gif');
const info = JSON.parse(fs.readFileSync(path.join(R, 'work', 'digits_info.json'), 'utf8'));
const html = `<title>카운트다운 숫자</title>
<style>
:root{--bg:#0d1828;--panel:#14233a;--line:#23364c;--fg:#dbe7f3;--muted:#8fa3ba;--accent:#3ec0d6;--warn:#e9c46a;--stage:#070c14;color-scheme:dark}
@media (prefers-color-scheme: light){:root:not([data-theme="dark"]){--bg:#eef3f8;--panel:#ffffff;--line:#cfdae6;--fg:#15263b;--muted:#51647b;--accent:#16798c;--warn:#8a6100;--stage:#0d1828;color-scheme:light}}
:root[data-theme="light"]{--bg:#eef3f8;--panel:#ffffff;--line:#cfdae6;--fg:#15263b;--muted:#51647b;--accent:#16798c;--warn:#8a6100;--stage:#0d1828;color-scheme:light}
:root[data-theme="dark"]{--bg:#0d1828;--panel:#14233a;--line:#23364c;--fg:#dbe7f3;--muted:#8fa3ba;--accent:#3ec0d6;--warn:#e9c46a;--stage:#070c14;color-scheme:dark}
body{background:var(--bg);color:var(--fg);font-family:"Pretendard","Noto Sans KR",system-ui,sans-serif;line-height:1.6;padding-inline:max(16px,4vw);padding-block:28px 56px}
main{max-width:1040px;margin-inline:auto;display:grid;gap:30px}
h1{font-size:1.6rem;margin:0;text-wrap:balance}
h2{font-size:1.1rem;margin:0 0 4px;text-wrap:balance}
p{margin:0;max-width:70ch}
section{display:grid;gap:12px;min-width:0}
.note{border:1px solid var(--warn);color:var(--warn);padding:8px 12px;border-radius:6px;font-size:.92rem}
.muted{color:var(--muted);font-size:.9rem}
img,canvas{display:block;max-width:100%;height:auto;border:1px solid var(--line);border-radius:4px;background:var(--stage)}
.px{image-rendering:pixelated}
figure{margin:0;display:grid;gap:6px;min-width:0;align-content:start}
figcaption{font-size:.85rem;color:var(--muted)}
.row{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:16px;align-items:start}
.ctl{background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:14px;display:grid;gap:12px}
.ctl .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));gap:12px 18px}
label{display:grid;gap:2px;font-size:.88rem;color:var(--muted)}
label output{color:var(--fg);font-variant-numeric:tabular-nums}
input[type=range]{width:100%;accent-color:var(--accent)}
select,button{font:inherit;color:var(--fg);background:var(--bg);border:1px solid var(--line);border-radius:6px;padding:6px 12px;cursor:pointer}
button:hover,select:hover{border-color:var(--accent)}
.btns{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.params{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:1px;background:var(--line);border:1px solid var(--line);border-radius:8px;overflow:hidden}
.params div{background:var(--panel);padding:10px 14px;min-width:0}
.params b{display:block;font-size:.8rem;color:var(--muted);font-weight:600;letter-spacing:.04em;margin-bottom:2px}
code{background:var(--panel);border:1px solid var(--line);border-radius:4px;padding:1px 5px;font-size:.86em;overflow-wrap:anywhere}
ul{margin:0;padding-left:1.2em;display:grid;gap:4px;max-width:70ch}
.swatches{display:flex;gap:6px;flex-wrap:wrap}
.sw{display:flex;align-items:center;gap:6px;font-size:.82rem;color:var(--muted)}
.sw i{width:18px;height:18px;border:1px solid var(--line);display:inline-block}
</style>
<main>
  <header style="display:grid;gap:10px">
    <h1>카운트다운 숫자 3 · 2 · 1</h1>
    <p>게임 시작과 스테이지 시작에 쓸 카운트다운 숫자와 연출 시안입니다. 숫자는 청록색 석재 느낌으로, 보드 한가운데에 하나씩 나타났다가 커지면서 사라집니다.</p>
    <p class="note">2단계 구현·적용을 마쳤습니다. “합성”이라고 적힌 영상은 게임 캡처 위에 합성한 미리보기이고, “Unity 실제 렌더”는 적용 뒤 Unity가 실제로 그린 프레임입니다.</p>
  </header>

  <section>
    <h2>Unity 실제 렌더 (적용 후)</h2>
    <p class="muted">게임에 구현한 카운트다운이 그린 프레임을 0.02초 간격으로 캡처한 것입니다(실시간 녹화가 아니라 프레임을 하나씩 진행해 캡처). 합성 미리보기와 같은 시간끼리 비교하면 평균 색 차이 0.64(255 기준)이고, 어긋나는 곳은 확대 중 도트 경계가 반올림되는 부분뿐입니다.</p>
    <div class="row">
      <figure><img class="px" alt="Unity 실제 렌더, 보드 실제 크기" src="${gif('output/Countdown_Unity_actual_board.gif')}"><figcaption>Unity 실제 렌더 — 보드 실제 크기 (280×604, 105프레임)</figcaption></figure>
      <figure><img alt="Unity 실제 렌더, 숫자 2 진행 중" src="${png('work/unity_frames/full_049.png')}"><figcaption>Unity 실제 렌더 — 숫자 2 (0.98초 지점)</figcaption></figure>
    </div>
    <figure><img alt="Unity 실제 렌더, 카운트다운 중 일시정지" src="${png('work/unity_frames/full_paused_during_countdown.png')}" style="max-width:720px"><figcaption>카운트다운 중 ESC: 일시정지 창이 숫자 위에 표시됨 (숫자 1의 받침만 창 아래로 보임)</figcaption></figure>
  </section>

  <section>
    <h2>재생해 보기 (합성)</h2>
    <div class="ctl">
      <div class="btns">
        <button id="play" type="button">일시정지</button>
        <button id="restart" type="button">처음부터</button>
        <button id="reset" type="button">처음 설정으로</button>
        <label style="display:flex;gap:6px;align-items:center">속도
          <select id="speed"><option value="1">1배</option><option value="0.5">0.5배</option><option value="0.25">0.25배</option></select></label>
        <label style="display:flex;gap:6px;align-items:center">숫자 도트 크기
          <select id="dot"><option value="2">2px (게임 기준 2배)</option><option value="3">3px</option></select></label>
      </div>
      <div class="grid">
        <label>숫자 하나당 시간 <output id="oSec"></output><input id="sec" type="range" min="0.4" max="1.2" step="0.05" value="0.7"></label>
        <label>처음 선명하게 유지 <output id="oHold"></output><input id="hold" type="range" min="0" max="0.4" step="0.05" value="0.15"></label>
        <label>사라질 때 최대 배율 <output id="oSmax"></output><input id="smax" type="range" min="1" max="2" step="0.05" value="1.4"></label>
        <label>재생 위치 <output id="oT"></output><input id="scrub" type="range" min="0" max="1000" step="1" value="0"></label>
      </div>
    </div>
    <div class="row">
      <figure><canvas id="full" width="1920" height="1080" aria-label="게임 전체 화면에 합성한 카운트다운"></canvas><figcaption>게임 전체 화면 (FHD, 줄여서 표시)</figcaption></figure>
      <div style="display:grid;gap:16px">
        <figure><canvas id="board" class="px" width="280" height="604" aria-label="보드 실제 크기"></canvas><figcaption>보드 실제 크기 (1:1, 보드 안쪽 270×594)</figcaption></figure>
        <figure><canvas id="zoom" class="px" width="280" height="280" style="width:100%;max-width:560px" aria-label="숫자 부근 확대"></canvas><figcaption>숫자 부근 확대 (2배) — 확대 중 도트 경계가 조금씩 달라지는 모습 확인용</figcaption></figure>
      </div>
    </div>
  </section>

  <section>
    <h2>처음 설정으로 만든 영상 (합성)</h2>
    <p class="muted">숫자당 0.7초 · 전체 2.1초 · 배율 1.0→1.4 · 처음 0.15초 선명. 앞 0.3초는 빈 보드, 뒤 0.5초는 숫자가 사라진 보드입니다. 50프레임/초.</p>
    <div class="row">
      <figure><img class="px" alt="보드 실제 크기 합성 영상" src="${gif('output/Countdown_Preview_board_composite.gif')}"><figcaption>보드 실제 크기 (280×604)</figcaption></figure>
      <figure><img class="px" alt="숫자 부근 2배 확대 합성 영상" src="${gif('output/Countdown_Preview_zoom_x2_composite.gif')}"><figcaption>숫자 부근 2배 확대 (560×560)</figcaption></figure>
    </div>
  </section>

  <section>
    <h2>시점별 정지 장면</h2>
    <p class="muted">숫자마다 왼쪽부터 0초(시작) · 0.15초(선명 구간 끝) · 0.425초(중간) · 0.65초(거의 사라짐).</p>
    <div class="row">
      <figure><img class="px" alt="실제 크기 정지 장면" src="${png('output/Countdown_Stills_actual_size_composite.png')}"><figcaption>실제 표시 크기 (1:1)</figcaption></figure>
      <figure><img class="px" alt="2배 확대 정지 장면" src="${png('output/Countdown_Stills_zoom_x2_composite.png')}"><figcaption>2배 확대</figcaption></figure>
    </div>
  </section>

  <section>
    <h2>숫자 3장</h2>
    <p class="muted">세 숫자는 높이 51도트, 굵기·색·장식 수준이 같습니다. 숫자 1은 폭이 좁지만 윗부분 깃과 아랫부분 받침으로 무게를 맞췄고, 눈에 보이는 가운데는 0.5도트 안쪽으로 맞춰 두었습니다.</p>
    <div class="row">
      <figure><img class="px" alt="숫자 3장 실제 크기" src="${png('output/Countdown_Digits_compare_actual_x2.png')}" style="max-width:520px"><figcaption>실제 표시 크기 (도트 2px)</figcaption></figure>
      <figure><img class="px" alt="숫자 3장 6배 확대" src="${png('output/Countdown_Digits_compare_zoom_x6.png')}"><figcaption>6배 확대</figcaption></figure>
    </div>
    <figure><img alt="VARCO가 만든 원본 시트" src="${png('output/Countdown_VARCO_original_sheet.png')}" style="max-width:720px"><figcaption>VARCO가 만든 원본 시트(노란색, 1376×768). 이 모양 그대로 도트 격자에서 읽어 청록색으로 색만 바꿨습니다.</figcaption></figure>
  </section>

  <section>
    <h2>규격과 저장 위치</h2>
    <div class="params">
      <div><b>숫자 원본</b>${info.CW}×${info.CH}px 투명 PNG 3장, 도트 1칸 = 1px, 중앙 기준점 (40, 40.5). 숫자는 높이 51도트, 폭 34 / 34 / 30도트</div>
      <div><b>표시 크기</b>도트 2px(게임의 2배 기준): 캔버스 160×162px, 숫자 높이 102px. 배율 1.4일 때 224×227px, 숫자 높이 143px</div>
      <div><b>위치</b>보드 안쪽(270×594px) 가운데 — FHD 화면 좌표 (960, 693). 위치는 고정, 크기와 투명도만 변함</div>
      <div><b>연출 초안</b>숫자당 0.7초, 전체 2.1초. 처음 0.15초는 배율 1.0·불투명, 이후 0.55초 동안 배율 1.0→1.4, 불투명도 1→0 (직선 변화). 다 사라진 뒤 다음 숫자로 교체</div>
      <div><b>색</b><span class="swatches">${['#0e3a47 외곽선', '#1d6f82', '#2a8ea0', '#3ec0d6', '#8cecf4 빛 받는 면'].map(s => `<span class="sw"><i style="background:${s.split(' ')[0]}"></i>${s}</span>`).join('')}</span></div>
      <div><b>VARCO</b>nano-banana-2, 16:9 시트 4장 = 80크레딧(노란색 2장 + 석재 느낌을 강조한 2장 중 1장 채택). 색을 청록으로 바꾸는 것은 크레딧 없이 색 단계 매핑으로 처리</div>
      <div><b>저장 위치</b><code>CountdownUI_VARCO/output/</code> — <code>T_Countdown_3.png</code> <code>T_Countdown_2.png</code> <code>T_Countdown_1.png</code>, 비교 이미지, 합성 GIF·정지 장면, 이 페이지(<code>Countdown_Preview_composite.html</code>)</div>
    </div>
  </section>

  <section>
    <h2>적용된 값</h2>
    <ul>
      <li>숫자당 0.7초, 처음 0.15초 선명, 이후 배율 1.0→1.4·불투명도 1→0, 전체 2.1초, 도트 2px. 값은 <code>CountdownManager</code>의 설정 칸에서 바꿀 수 있습니다.</li>
      <li>실행 시점: 새 게임 시작(타이틀 START·재시작 포함)과 보상 선택 후 모든 스테이지(보스 포함). 카운트다운 동안 조각이 나오지 않아 이동·회전·Hold·하드드롭·낙하·LOCK과 전투 진행이 일어나지 않습니다.</li>
      <li>일시정지하면 멈추고 재개하면 이어지며, 재시작·타이틀 이동 때는 취소됩니다.</li>
    </ul>
  </section>
</main>
<script>
(function(){
  var $=function(id){return document.getElementById(id);};
  var SRC={bg:'${png('work/game_screen_empty_board.png')}',d3:'${png('output/T_Countdown_3.png')}',d2:'${png('output/T_Countdown_2.png')}',d1:'${png('output/T_Countdown_1.png')}'};
  function load(s){return new Promise(function(res){var i=new Image();i.onload=function(){res(i);};i.src=s;});}
  Promise.all([load(SRC.bg),load(SRC.d3),load(SRC.d2),load(SRC.d1)]).then(function(im){
    var CX=960,CY=693,RW=520,RH=520,RX=CX-260,RY=CY-260,LEAD=0.3,TAIL=0.5;
    var master=document.createElement('canvas');master.width=1920;master.height=1080;
    var m=master.getContext('2d',{willReadFrequently:true});m.drawImage(im[0],0,0);
    var baseData=m.getImageData(RX,RY,RW,RH);
    var dig=[1,2,3].map(function(k){var c=document.createElement('canvas');c.width=im[k].width;c.height=im[k].height;var x=c.getContext('2d');x.drawImage(im[k],0,0);return x.getImageData(0,0,c.width,c.height);}); // 3,2,1 순서
    var full=$('full').getContext('2d'),board=$('board').getContext('2d'),zoom=$('zoom').getContext('2d');
    var P={sec:0.7,hold:0.15,smax:1.4,dot:2,speed:1};
    var t=0,playing=true,last=performance.now();
    function total(){return LEAD+3*P.sec+TAIL;}
    function state(tt){tt-=LEAD;if(tt<0||tt>=3*P.sec)return null;var i=Math.floor(tt/P.sec),lt=tt-i*P.sec;if(lt<P.hold)return{i:i,s:1,a:1};var k=(lt-P.hold)/(P.sec-P.hold);return{i:i,s:1+(P.smax-1)*k,a:1-k};}
    function draw(tt){
      var out=new ImageData(new Uint8ClampedArray(baseData.data),RW,RH),st=state(tt);
      if(st){var d=dig[st.i],k=P.dot*st.s,W=d.width*k,H=d.height*k,left=CX-W/2,top=CY-H/2;
        for(var y=Math.max(RY,Math.floor(top));y<Math.min(RY+RH,Math.ceil(top+H));y++)for(var x=Math.max(RX,Math.floor(left));x<Math.min(RX+RW,Math.ceil(left+W));x++){
          var u=Math.floor((x+0.5-left)/k),v=Math.floor((y+0.5-top)/k);if(u<0||v<0||u>=d.width||v>=d.height)continue;
          var s=(v*d.width+u)*4;if(!d.data[s+3])continue;var o=((y-RY)*RW+(x-RX))*4;
          for(var c=0;c<3;c++)out.data[o+c]=Math.round(d.data[s+c]*st.a+out.data[o+c]*(1-st.a));}}
      m.putImageData(out,RX,RY);
      full.drawImage(master,0,0);
      board.drawImage(master,820,391,280,604,0,0,280,604);
      zoom.drawImage(master,820,553,280,280,0,0,280,280);
      $('oT').textContent=tt.toFixed(2)+' / '+total().toFixed(2)+'초'+(st?'  (숫자 '+[3,2,1][st.i]+', 배율 '+st.s.toFixed(2)+', 불투명도 '+st.a.toFixed(2)+')':'');
      $('scrub').value=Math.round(tt/total()*1000);
    }
    function labels(){$('oSec').textContent=P.sec.toFixed(2)+'초 (전체 '+(3*P.sec).toFixed(2)+'초)';$('oHold').textContent=P.hold.toFixed(2)+'초';$('oSmax').textContent=P.smax.toFixed(2)+'배';}
    function frame(now){var dt=(now-last)/1000;last=now;if(playing){t+=dt*P.speed;if(t>=total())t-=total();}draw(t);requestAnimationFrame(frame);}
    function bind(id,key,isNum){$(id).addEventListener('input',function(e){P[key]=+e.target.value;if(key==='hold'&&P.hold>=P.sec)P.hold=P.sec-0.05;labels();if(t>total())t=0;});}
    bind('sec','sec');bind('hold','hold');bind('smax','smax');
    $('dot').addEventListener('change',function(e){P.dot=+e.target.value;});
    $('speed').addEventListener('change',function(e){P.speed=+e.target.value;});
    $('play').addEventListener('click',function(){playing=!playing;$('play').textContent=playing?'일시정지':'재생';});
    $('restart').addEventListener('click',function(){t=0;playing=true;$('play').textContent='일시정지';});
    $('reset').addEventListener('click',function(){P.sec=0.7;P.hold=0.15;P.smax=1.4;$('sec').value=0.7;$('hold').value=0.15;$('smax').value=1.4;labels();t=0;});
    $('scrub').addEventListener('input',function(e){playing=false;$('play').textContent='재생';t=+e.target.value/1000*total();});
    labels();requestAnimationFrame(frame);
  });
})();
</script>
`;
fs.writeFileSync(path.join(R, 'output', 'Countdown_Preview_composite.html'), html);
console.log('saved', (html.length / 1048576).toFixed(2) + 'MB');
