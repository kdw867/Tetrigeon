// LINE CLEAR 파티클 규칙 (미리보기용 시뮬레이션). Unity ParticleSystem에 옮길 값과 같게 정함:
//  삭제 순간에 한 번만 방출(Emit), 월드 공간 시뮬레이션, 중력·궤적·지속 방출 없음, 크기는 단계적으로 줄어 마지막에 사라짐
// 단위는 FHD 화면 픽셀(1칸 = 27px, 월드 1유닛 = 108px)
(function (root) {
  const DEFAULT = {
    life: [0.08, 0.14],        // 수명(초)
    speed: [110, 230],         // 바깥으로 튀는 속도(px/초) → 수명 동안 약 0.5~1.2칸
    size: [3, 5],              // 파편 한 변(px), 한 칸 폭 27px의 약 11~19%
    perCellSingle: 2,          // 한 줄만 지워질 때 칸당 방출 수
    perCellMulti: 1,           // 두 줄 이상 동시에 지워질 때 칸당 방출 수 (보드가 덮이지 않게)
    maxTotal: 32,              // 한 번의 삭제에서 방출할 총량 상한
    startJitter: 9,            // 칸 가운데에서 시작 위치가 흩어지는 폭(px)
    crystalRowChance: 0.5,     // 수정 칸이 있는 줄에서는 파편을 반으로 줄이고 수정 칸 자체에는 내지 않음
    shrinkAt: [0.6, 0.85],     // 수명의 60%·85%에서 한 도트씩 작아짐
    colors: [['#f4fbff', 0.3], ['#8cecf4', 0.4], ['#3ec0d6', 0.3]], // 옅은 백색, 밝은 청록, 청록
  };
  function rng(seed) { let a = seed >>> 0; return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  // cells: 지워지는 칸 [{x, y, crystalRow: bool, crystal: bool}] (x,y = 칸 가운데 화면 좌표), rowCount: 동시에 지워진 줄 수
  function emit(cells, rowCount, params, seed) {
    const P = Object.assign({}, DEFAULT, params || {}), r = rng(seed || 1), out = [];
    const per = rowCount > 1 ? P.perCellMulti : P.perCellSingle;
    for (const c of cells) {
      if (c.crystal) continue; // 수정 칸에는 수정 파괴 이펙트가 있으므로 일반 파편을 내지 않음
      for (let k = 0; k < per; k++) {
        if (c.crystalRow && r() > P.crystalRowChance) continue; // 수정 줄은 약하게
        const ang = r() * Math.PI * 2, sp = P.speed[0] + r() * (P.speed[1] - P.speed[0]), s = P.size[0] + Math.floor(r() * (P.size[1] - P.size[0] + 1));
        let col = P.colors[0][0], pick = r(), acc = 0; for (const [h, w] of P.colors) { acc += w; if (pick <= acc) { col = h; break; } }
        out.push({ x0: c.x + (r() - 0.5) * 2 * P.startJitter, y0: c.y + (r() - 0.5) * 2 * P.startJitter, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life: P.life[0] + r() * (P.life[1] - P.life[0]), size: c.crystalRow ? Math.max(2, s - 1) : s, color: col, shrink: P.shrinkAt });
      }
    }
    while (out.length > P.maxTotal) out.splice(Math.floor(r() * out.length), 1); // 총량 상한: 무작위로 덜어냄
    return out;
  }
  // 방출 후 t초의 모양 (사라졌으면 null)
  function stateAt(p, t) {
    if (t < 0 || t >= p.life) return null;
    const f = t / p.life, size = f < p.shrink[0] ? p.size : f < p.shrink[1] ? Math.max(1, p.size - 1) : Math.max(1, p.size - 2);
    return { x: p.x0 + p.vx * t, y: p.y0 + p.vy * t, size, color: p.color };
  }
  root.ClearParticles = { DEFAULT, emit, stateAt };
})(typeof window !== 'undefined' ? window : module.exports);
