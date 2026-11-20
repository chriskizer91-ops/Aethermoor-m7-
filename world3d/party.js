// party.js (November 20): how the three who don't lead walk with the one who does. Not in single file (Chris): each
// keeps a loose spot of their own beside and behind the leader, drifting a little as they go (Pip wanders wide, Bryn
// hangs back), on the leader's own trail so nobody cuts through a wall; when the party stops they spread out round the
// leader and turn to look about. A spot that isn't walkable pulls in toward the trail until it is.
//   const party = M7_PARTY.create(W);  party.set(leader, followers);  party.step(dt, t)  (every frame)
(function (G) {
  'use strict';
  // each follower's spot: how far back along the trail (m), how far to the side (m, + is the leader's right), and how
  // much and how fast that wanders
  const SPOTS = [
    { back: 1.35, side: -1.05, wob: 0.45, f: 0.23, lag: 1.0 },
    { back: 1.75, side: 1.15, wob: 0.55, f: 0.17, lag: 0.85 },
    { back: 2.85, side: 0.25, wob: 0.6, f: 0.13, lag: 0.7 },
  ];
  function create(W) {
    let leader = null, followers = [], trail = [], still = 0;
    const st = [];   // per follower: its own drift phase, and the way it looks when the party stops
    function set(l, fs) {
      leader = l; followers = fs; trail = [];
      const p = l.root.position, ry = l.root.rotation.y;
      fs.forEach((f, i) => {
        const s = SPOTS[i % SPOTS.length];
        f.root.position.set(p.x - Math.sin(ry) * s.back + Math.cos(ry) * s.side, p.y, p.z - Math.cos(ry) * s.back - Math.sin(ry) * s.side);
        f.root.rotation.y = ry;
        st[i] = { ph: i * 2.1 + 0.7, look: (i - 1) * 0.6 };
      });
    }
    // the point `need` metres back along the trail, and the way the trail runs there
    function along(need) {
      const p = leader.root.position; let q = p.clone(), dir = null;
      for (let k = 0; k < trail.length - 1 && need > 0; k++) {
        const a = trail[k], b = trail[k + 1], d = a.distanceTo(b);
        if (d > 1e-4) dir = [a.x - b.x, a.z - b.z, d];
        if (d >= need) { q = a.clone().lerp(b, need / d); need = 0; break; }
        need -= d; q = b.clone();
      }
      const ry = leader.root.rotation.y;
      if (need > 0) { q.x -= Math.sin(ry) * need; q.z -= Math.cos(ry) * need; }
      const fw = dir ? [dir[0] / dir[2], dir[1] / dir[2]] : [Math.sin(ry), Math.cos(ry)];
      return { q, fw };
    }
    function canStand(x, z) { const M = W.P.M; const px = M.px(x), py = M.py(z); try { return W.P.walkable(px, py); } catch (e) { return true; } }
    function heightAt(x, z, y0) { const M = W.P.M; try { return W.P.walkH(M.px(x), M.py(z)); } catch (e) { return y0; } }
    function step(dt, t) {
      if (!leader) return;
      const p = leader.root.position, l0 = trail[0];
      if (!l0 || l0.distanceTo(p) > 0.05) { trail.unshift(p.clone()); if (trail.length > 500) trail.length = 500; still = 0; } else still += dt;
      if (l0 && l0.distanceTo(p) > 6) trail = [p.clone()];   // the leader jumped (a new place): start again
      const rest = Math.min(1, Math.max(0, (still - 0.6) / 1.2));   // 0 walking, 1 standing about
      followers.forEach((f, i) => {
        const s = SPOTS[i % SPOTS.length], S = st[i];
        S.ph += dt * s.f * (1 - rest * 0.7);
        const { q, fw } = along(s.back * (1 - rest * 0.25));
        const rt = [fw[1], -fw[0]];   // the trail's right hand
        let side = (s.side + Math.sin(S.ph * 6.283) * s.wob) * (1 + rest * 0.35);
        // pull in toward the trail until the spot is walkable
        let tx = q.x + rt[0] * side, tz = q.z + rt[1] * side;
        for (let k = 0; k < 4 && !canStand(tx, tz); k++) { side *= 0.5; tx = q.x + rt[0] * side; tz = q.z + rt[1] * side; }
        if (!canStand(tx, tz)) { tx = q.x; tz = q.z; }
        const fp = f.root.position, dx = tx - fp.x, dz = tz - fp.z, d = Math.hypot(dx, dz), moving = d > 0.05;
        const k = Math.min(1, dt * 6 * s.lag);
        if (d > 9) { fp.set(tx, q.y, tz); } else { fp.x += dx * k; fp.z += dz * k; }
        const ty = heightAt(fp.x, fp.z, q.y); fp.y += (ty - fp.y) * Math.min(1, dt * 10);
        // facing: where they walk; standing, the leader's way, each turned a little to look about
        let want = moving && d > 0.12 ? Math.atan2(dx, dz) : leader.root.rotation.y + S.look + Math.sin(t * 0.3 + i) * 0.25 * rest;
        let a = want - f.root.rotation.y; a = Math.atan2(Math.sin(a), Math.cos(a)); f.root.rotation.y += a * Math.min(1, dt * (moving ? 9 : 2.5));
        f.walkRun = leader.walkRun && d > 1.2;
        f.animate(0, moving && d > 0.12 ? 1 : 0, t + i * 0.37, dt * (moving ? Math.min(2.3, Math.max(0.6, d * 5)) : 1));
      });
    }
    return { set, step, reset() { trail = []; } };
  }
  G.M7_PARTY = { create };
})(window);
