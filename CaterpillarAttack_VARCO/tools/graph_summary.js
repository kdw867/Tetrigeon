// VARCO 워크플로 그래프 JSON에서 노드 목록만 요약 (큰 이미지 데이터는 잘라서 표시)
const fs = require('fs');
const f = process.argv[2];
let t = fs.readFileSync(f, 'utf8');
let j; try { j = JSON.parse(t); } catch (e) { const s = t.indexOf('{'); j = JSON.parse(t.slice(s)); }
const cut = (v) => { const s = JSON.stringify(v); return s.length > 140 ? s.slice(0, 140) + '…(' + s.length + ')' : s; };
console.log('top keys', Object.keys(j));
const nodes = j.nodes || (j.graph && j.graph.nodes) || [];
console.log('nodes', nodes.length, 'edges', (j.edges || (j.graph && j.graph.edges) || []).length);
nodes.forEach(n => console.log(n.id, n.type, 'pos', n.x ?? (n.position && n.position.x), n.y ?? (n.position && n.position.y), 'status', n.status, cut(n.intrinsic)));
