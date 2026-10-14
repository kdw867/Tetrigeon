// VARCO 노드 상태 확인·다운로드 (작업 폴더 전용): get_flow_graph 가 저장한 가장 최근 결과 파일에서 지정한 노드의 상태와 출력 주소를 읽는다.
// 사용: node node_status.js <이름=노드id> ... [--download]  → --download 이면 work/varco_raw/<이름>_<번호>.png 로 저장
const fs = require('fs'), path = require('path'), cp = require('child_process');
const DIR = 'C:/Users/MBC-501-15/.claude/projects/C--Users-MBC-501-15-Documents-Tetrigeon/1c733b5f-5eba-4df7-aeda-bb7d619f695f/tool-results';
const files = fs.readdirSync(DIR).filter(n => n.includes('get_flow_graph')).map(n => [n, fs.statSync(path.join(DIR, n)).mtimeMs]).sort((a, b) => b[1] - a[1]);
const t = fs.readFileSync(path.join(DIR, files[0][0]), 'utf8'), g = JSON.parse(t.slice(t.indexOf('{'))).graph, args = process.argv.slice(2), dl = args.includes('--download');
const OUT = path.join(__dirname, '..', 'work', 'varco_raw'); fs.mkdirSync(OUT, { recursive: true });
for (const a of args.filter(x => x.includes('='))) {
  const [name, id] = a.split('='), n = g.nodes.find(x => x.id === id); if (!n) { console.log(name, '노드 없음'); continue; }
  const outs = n.output || []; console.log(name, '상태', n.status, '| 출력', outs.map(o => o.status + (o.error ? '(' + o.error + ')' : '')).join(','));
  if (dl) outs.forEach((o, i) => { if (o.status !== 'success') return; const url = (o.value.url.startsWith('http') ? '' : 'https://3d.varco.ai') + o.value.url, f = path.join(OUT, name + '_' + (i + 1) + '.png'); cp.execFileSync('curl', ['-s', '-o', f, url]); console.log('  저장', path.basename(f), fs.statSync(f).size + 'B', url); });
}
