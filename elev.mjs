import * as THREE from 'three';
const scene = new THREE.Group();
const envMap = null, metals = [];
const gold   = new THREE.MeshStandardMaterial({name:'gold'});
const cedar  = new THREE.MeshStandardMaterial({name:'cedar'});
const bronze = new THREE.MeshStandardMaterial({name:'bronze'});
const cyl = (rt,rb,h,seg,mat,x,y,z,parent=scene) => {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg), mat);
  m.position.set(x,y,z); parent.add(m); return m;
};
    const harp = new THREE.Group();
    const SB0 = new THREE.Vector2(-2.6, 1.5), SB1 = new THREE.Vector2(3.0, 4.5);  // soundboard: bass foot → treble shoulder
    const NK0 = new THREE.Vector2(-3.1, 9.5), NK1 = new THREE.Vector2(3.3, 7.3);  // harmonic curve, over the same span
    const boardAt = (u) => new THREE.Vector2(SB0.x + (SB1.x - SB0.x) * u, SB0.y + (SB1.y - SB0.y) * u);
    const neckAt = (u) => new THREE.Vector2(
      NK0.x + (NK1.x - NK0.x) * u,
      NK0.y + (NK1.y - NK0.y) * u + Math.sin(u * Math.PI) * 1.15   // it arches; a harmonic curve is not a chord
    );
    // one tapered member of the frame, laid between two points of it
    const limb = (a, b, rt, rb, seg, mat, z = 0) => {
      const dx = b.x - a.x, dy = b.y - a.y;
      const m = cyl(rt, rb, Math.hypot(dx, dy), seg, mat, (a.x + b.x) / 2, (a.y + b.y) / 2, z, harp);
      m.rotation.z = Math.atan2(dy, dx) - Math.PI / 2;             // a cylinder points +Y; aim it down the member
      return m;
    };
    const bDir = SB1.clone().sub(SB0).normalize();
    const bN = new THREE.Vector2(-bDir.y, bDir.x);                 // the soundboard's normal, pointing at the neck
    // the soundbox: an octagonal cedar body slung under the board, fattest at the bass
    limb(SB0.clone().addScaledVector(bN, -1.2).addScaledVector(bDir, -0.25),
         SB1.clone().addScaledVector(bN, -0.7).addScaledVector(bDir, 0.35), 0.78, 1.5, 8, cedar);
    limb(SB0, SB1, 0.14, 0.19, 6, gold);                           // the rib the strings are pinned along
    cyl(1.1, 1.35, 0.5, 8, gold, -1.9, -0.95, 0, harp);            // the foot, set level with the belly it stands beside
    // the rose cut into the belly, where a soundbox is opened so it can sing
    const rc = boardAt(0.36).addScaledVector(bN, -0.85);
    const rose = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.1, 6, 14), gold);
    rose.position.set(rc.x, rc.y, 1.18); harp.add(rose);
    // the forepillar, carrying the whole pull of the strings down to the foot
    // run it a little past NK0 into the first course of the neck, so the two
    // members overlap at the shoulder instead of meeting in a notch
    limb(new THREE.Vector2(-3.5, -1.1), neckAt(0.035), 0.38, 0.56, 8, gold);
    // the neck, walked along the curve in twelve tapering courses
    for (let i = 0; i < 12; i++) {
      const u0 = i / 12, u1 = (i + 1) / 12;
      limb(neckAt(u0), neckAt(u1), 0.46 - u1 * 0.2, 0.46 - u0 * 0.2, 8, gold);
    }
    // a pomegranate finial over the pillar, like everything else golden here
    const finial = new THREE.Mesh(new THREE.SphereGeometry(0.6, 10, 8), gold);
    finial.position.set(NK0.x + 0.06, NK0.y + 0.6, 0); harp.add(finial);
    for (let c = 0; c < 4; c++) {
      const a = c * Math.PI / 2;
      const crown = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.48, 5), gold);
      crown.position.set(NK0.x + 0.06 + Math.cos(a) * 0.25, NK0.y + 1.21, Math.sin(a) * 0.25);
      crown.rotation.z = -Math.cos(a) * 0.42; crown.rotation.x = Math.sin(a) * 0.42;
      harp.add(crown);
    }
    // Freygish on D — the same mode the fifteen steps are tuned to, so the harp
    // and the ascent answer each other. The eighth string is the octave.
    const HARP_TUNING = [146.83, 155.56, 185.0, 196.0, 220.0, 233.08, 261.63, 293.66];
    const stringMat = new THREE.MeshStandardMaterial({ color: 0xfff1c4, metalness: 0.85, roughness: 0.22 });
    stringMat.envMap = envMap; metals.push(stringMat);
    const harpStrings = [];
    for (let st = 0; st < 8; st++) {
      const u = 0.085 + st * 0.125;
      const top = neckAt(u), bot = boardAt(u);
      const sm = limb(top, bot, 0.055, 0.055, 6, stringMat);
      sm.castShadow = false;
      const peg = cyl(0.1, 0.1, 1.5, 6, bronze, top.x, top.y, 0, harp);
      peg.rotation.x = Math.PI / 2;
      sm.userData = { amp: 0, ph: st * 1.7, peg };
      harpStrings.push(sm);
      if (st === 7) { sm.visible = false; peg.visible = false; }   // the eighth is still waiting
    }
    const revealEighth = () => {
      harpStrings[7].visible = true;
      harpStrings[7].userData.peg.visible = true;
    };

const S = 46, OX = 250, OY = 500;
const P = (x,y) => [OX + x*S, OY - y*S];
const out = [];
const col = { gold:'#d8ae3f', cedar:'#8a5a34', bronze:'#8a5a2b' };
for (const m of harp.children) {
  if (!m.isMesh || m.visible === false) continue;
  const p = m.geometry.parameters, t = m.geometry.type;
  const c = col[m.material.name] || '#eee9d0';
  const cx = m.position.x, cy = m.position.y, rz = m.rotation.z, rx = m.rotation.x;
  if (t === 'CylinderGeometry') {
    if (Math.abs(rx) > 0.1) { const [X,Y]=P(cx,cy); out.push(`<circle cx="${X}" cy="${Y}" r="${p.radiusTop*S}" fill="${c}" stroke="#000" stroke-opacity=".35"/>`); continue; }
    const hh = p.height/2, rt = p.radiusTop, rb = p.radiusBottom;
    const pts = [[-rb,-hh],[rb,-hh],[rt,hh],[-rt,hh]].map(([x,y]) => {
      const X = x*Math.cos(rz) - y*Math.sin(rz) + cx, Y = x*Math.sin(rz) + y*Math.cos(rz) + cy;
      return P(X,Y).join(',');
    });
    out.push(`<polygon points="${pts.join(' ')}" fill="${c}" stroke="#000" stroke-opacity=".35" stroke-width=".7"/>`);
  } else if (t === 'SphereGeometry') {
    const [X,Y]=P(cx,cy); out.push(`<circle cx="${X}" cy="${Y}" r="${p.radius*S}" fill="${c}" stroke="#000" stroke-opacity=".35"/>`);
  } else if (t === 'TorusGeometry') {
    const [X,Y]=P(cx,cy); out.push(`<circle cx="${X}" cy="${Y}" r="${p.radius*S}" fill="none" stroke="${c}" stroke-width="${p.tube*2*S}"/>`);
  } else if (t === 'ConeGeometry') {
    const hh=p.height/2, r=p.radius;
    const pts=[[-r,-hh],[r,-hh],[0,hh]].map(([x,y])=>{
      const X = x*Math.cos(rz)-y*Math.sin(rz)+cx, Y = x*Math.sin(rz)+y*Math.cos(rz)+cy; return P(X,Y).join(',');});
    out.push(`<polygon points="${pts.join(' ')}" fill="${c}"/>`);
  }
}
const [, gy] = P(0,0);
out.push(`<line x1="0" y1="${gy}" x2="640" y2="${gy}" stroke="#c33" stroke-dasharray="5 4"/>`);
console.log(`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="600" viewBox="0 0 640 600"><rect width="640" height="600" fill="#20262e"/>${out.join('')}</svg>`);
const lens = harpStrings.map(s => +s.geometry.parameters.height.toFixed(2));
console.error('meshes ' + harp.children.filter(m=>m.isMesh).length + ' | string lengths ' + lens.join(', '));
