// 그래프 파일에서 지정한 노드들의 상태와 결과 이미지 주소를 출력 (작업 폴더 전용)
const fs = require('fs');
const t = fs.readFileSync(process.argv[2], 'utf8'), g = JSON.parse(t.slice(t.indexOf('{'))).graph;
for (const pre of process.argv.slice(3)) {
  const n = g.nodes.find(x => x.id.startsWith(pre));
  if (!n) { console.log(pre, 'NOT FOUND'); continue; }
  const o = JSON.stringify(n.output || []);
  console.log(n.type, n.id.slice(0, 8), 'status', n.status, 'progress', n.progress ?? '', o.length > 400 ? o.slice(0, 400) + '…' : o);
}
