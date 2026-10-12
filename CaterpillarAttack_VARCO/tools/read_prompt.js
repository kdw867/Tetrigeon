// 그래프 파일에서 지정한 노드의 프롬프트·연결을 출력 (작업 폴더 전용)
const fs = require('fs');
const t = fs.readFileSync(process.argv[2], 'utf8'), j = JSON.parse(t.slice(t.indexOf('{'))), g = j.graph;
const byId = Object.fromEntries(g.nodes.map(n => [n.id, n]));
for (const pre of process.argv.slice(3)) {
  const n = g.nodes.find(x => x.id.startsWith(pre));
  console.log('---', n.type, n.id);
  if (n.type === 'TextInput') console.log(n.intrinsic.value[0].value); else console.log(JSON.stringify(n.intrinsic));
  console.log('incoming:', g.edges.filter(e => e.to.nodeId === n.id).map(e => byId[e.from.nodeId].type + ':' + e.from.nodeId.slice(0, 8) + ' ' + e.from.portName + '->' + e.to.portName).join(' | '));
}
