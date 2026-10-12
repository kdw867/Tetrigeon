// 두 그래프 파일의 노드 차이(새로 생긴 노드)를 출력 (작업 폴더 전용)
const fs = require('fs');
const load = f => { const t = fs.readFileSync(f, 'utf8'); return JSON.parse(t.slice(t.indexOf('{'))).graph; };
const a = load(process.argv[2]), b = load(process.argv[3]);
const ids = new Set(a.nodes.map(n => n.id));
const added = b.nodes.filter(n => !ids.has(n.id));
console.log('before', a.nodes.length, 'after', b.nodes.length, 'added', added.length);
added.forEach(n => console.log(JSON.stringify(n).slice(0, 700)));
const eids = new Set(a.edges.map(e => JSON.stringify(e)));
console.log('added edges', b.edges.filter(e => !eids.has(JSON.stringify(e))).length);
