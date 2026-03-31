// ══════════════════════════════════════════════════
// sen66.js — Sensirion SEN66 (PM/CO₂/VOC/NOx)
// ══════════════════════════════════════════════════

function buildSEN66() {
  const g = new M.Group();
  const w = 2.6, d = 1.25, hTop = 0.4, hBot = 0.4, r = 0.15;

  // ── Forma Superior (com furos esculpidos) ──
  const shapeTop = new M.Shape();
  shapeTop.moveTo(-w / 2, d / 2 - r);
  shapeTop.lineTo(-w / 2, -d / 2 + r);
  shapeTop.quadraticCurveTo(-w / 2, -d / 2, -w / 2 + r, -d / 2);
  shapeTop.lineTo(w / 2 - r, -d / 2);
  shapeTop.quadraticCurveTo(w / 2, -d / 2, w / 2, -d / 2 + r);
  shapeTop.lineTo(w / 2, d / 2 - r);
  shapeTop.quadraticCurveTo(w / 2, d / 2, w / 2 - r, d / 2);
  shapeTop.lineTo(-w / 2 + r, d / 2);
  shapeTop.quadraticCurveTo(-w / 2, d / 2, -w / 2, d / 2 - r);

  // Furo do ventilador
  const fanHoleTop = new M.Path();
  fanHoleTop.absarc(-0.65, 0, 0.40, 0, PI * 2, true);
  shapeTop.holes.push(fanHoleTop);

  // Furo redondo (sensor)
  const rndHole = new M.Path();
  rndHole.absarc(0.85, -0.25, 0.11, 0, PI * 2, true);
  shapeTop.holes.push(rndHole);

  // Furo quadrado
  const sqHole = new M.Path();
  const scx = 0.85, scy = 0.3, shs = 0.11;
  sqHole.moveTo(scx - shs, scy - shs);
  sqHole.lineTo(scx - shs, scy + shs);
  sqHole.lineTo(scx + shs, scy + shs);
  sqHole.lineTo(scx + shs, scy - shs);
  sqHole.lineTo(scx - shs, scy - shs);
  shapeTop.holes.push(sqHole);

  // Dimple
  const dimple = new M.Path();
  dimple.absarc(-0.15, 0.15, 0.04, 0, PI * 2, true);
  shapeTop.holes.push(dimple);

  // ── Forma Inferior (recesso do JST) ──
  const shapeBot = new M.Shape();
  shapeBot.moveTo(-w / 2, d / 2 - r);
  shapeBot.lineTo(-w / 2, -d / 2 + r);
  shapeBot.quadraticCurveTo(-w / 2, -d / 2, -w / 2 + r, -d / 2);
  shapeBot.lineTo(-0.1, -d / 2);
  shapeBot.lineTo(0.1, -d / 2 + 0.35);
  shapeBot.lineTo(0.9, -d / 2 + 0.35);
  shapeBot.lineTo(1.1, -d / 2);
  shapeBot.lineTo(w / 2 - r, -d / 2);
  shapeBot.quadraticCurveTo(w / 2, -d / 2, w / 2, -d / 2 + r);
  shapeBot.lineTo(w / 2, d / 2 - r);
  shapeBot.quadraticCurveTo(w / 2, d / 2, w / 2 - r, d / 2);
  shapeBot.lineTo(-w / 2 + r, d / 2);
  shapeBot.quadraticCurveTo(-w / 2, d / 2, -w / 2, d / 2 - r);

  // ── Extrusão ──
  const extSet = { depth: 0.4, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 3 };
  const senMat = mat(0x1a1c1d, { r: 0.95, m: 0.05 });

  const botGeo = new M.ExtrudeGeometry(shapeBot, extSet);
  botGeo.rotateX(-PI / 2);
  const botMesh = new M.Mesh(botGeo, senMat);
  botMesh.position.y = 0.01;
  g.add(botMesh);

  const topGeo = new M.ExtrudeGeometry(shapeTop, extSet);
  topGeo.rotateX(-PI / 2);
  const topMesh = new M.Mesh(topGeo, senMat);
  topMesh.position.y = 0.44;
  g.add(topMesh);

  // ── Cavidade da Hélice ──
  const fanFloor = new M.Mesh(new M.CylinderGeometry(0.395, 0.395, 0.27, 32), senMat);
  fanFloor.position.set(-0.65, 0.575, 0);
  g.add(fanFloor);

  const darkBottom = new M.Mesh(
    new M.CylinderGeometry(0.395, 0.395, 0.005, 32),
    mat(0x050505, { r: 1 })
  );
  darkBottom.position.set(-0.65, 0.712, 0);
  g.add(darkBottom);

  // ── Hélices Animadas ──
  const bladeMat = mat(0x131313, { r: 0.25, m: 0.7 });
  const fanBlades = new M.Group();
  fanBlades.name = 'sen_fan';
  fanBlades.position.set(-0.65, 0.77, 0);

  const hubBase = new M.Mesh(new M.CylinderGeometry(0.14, 0.14, 0.035, 32), bladeMat);
  const hubCap = new M.Mesh(
    new M.SphereGeometry(0.14, 32, 16, 0, PI * 2, 0, PI / 2),
    mat(0x101010, { r: 0.4, m: 0.5 })
  );
  hubCap.scale.y = 0.25;
  hubCap.position.y = 0.017;

  const hubSticker = new M.Mesh(
    new M.CylinderGeometry(0.08, 0.08, 0.001, 32),
    mat(0x555555, { r: 0.2, m: 0.9, cc: 0.5 })
  );
  hubSticker.position.y = 0.053;
  hubSticker.rotation.y = PI / 4;

  fanBlades.add(hubBase, hubCap, hubSticker);

  for (let i = 0; i < 9; i++) {
    const blade = new M.Mesh(new M.BoxGeometry(0.30, 0.003, 0.12), bladeMat);
    blade.position.set(0.22, -0.012, 0);
    blade.rotation.x = PI / 6;
    blade.rotation.y = -PI / 10;
    blade.rotation.z = PI / 64;

    const pivot = new M.Group();
    pivot.rotation.y = i * (PI * 2 / 9);
    pivot.add(blade);
    fanBlades.add(pivot);
  }
  g.add(fanBlades);

  // ── Grelha ──
  const grilleY = 0.85;
  const grilleRot = PI / 4;

  const topHub = new M.Mesh(new M.CylinderGeometry(0.24, 0.24, 0.008, 32), senMat);
  topHub.position.set(-0.65, grilleY, 0);
  g.add(topHub);

  // Haste grossa
  const thickSpoke = new M.Mesh(new M.BoxGeometry(0.40, 0.008, 0.26), senMat);
  thickSpoke.position.set(0.20, 0, 0);
  const thickPivot = new M.Group();
  thickPivot.position.set(-0.65, grilleY, 0);
  thickPivot.rotation.y = grilleRot;
  thickPivot.add(thickSpoke);
  g.add(thickPivot);

  // Hastes finas
  const thinOffsets = [-PI * (2 / 3), PI * (2 / 3)];
  thinOffsets.forEach(offset => {
    const thin = new M.Mesh(new M.BoxGeometry(0.40, 0.008, 0.06), senMat);
    thin.position.set(0.20, 0, 0);
    const pivot = new M.Group();
    pivot.position.set(-0.65, grilleY, 0);
    pivot.rotation.y = offset + grilleRot;
    pivot.add(thin);
    g.add(pivot);
  });

  // ── Fundos dos furos menores ──
  const floorY = 0.82;

  const filterRnd = new M.Mesh(new M.CylinderGeometry(0.11, 0.11, 0.005, 16), mat(0xaaaaaa, { r: 0.1 }));
  filterRnd.position.set(0.85, floorY, 0.25);
  g.add(filterRnd);

  const filterSq = new M.Mesh(new M.BoxGeometry(0.22, 0.005, 0.22), mat(0x020202, { r: 1 }));
  filterSq.position.set(0.85, floorY, -0.3);
  g.add(filterSq);

  const dimpleFloor = new M.Mesh(new M.CylinderGeometry(0.04, 0.04, 0.005, 16), mat(0x050505, { r: 1 }));
  dimpleFloor.position.set(-0.15, floorY, -0.15);
  g.add(dimpleFloor);

  // ── Conector JST + Fios ──
  const jst = new M.Mesh(new M.BoxGeometry(0.35, 0.15, 0.25), mat(0xeaeaea, { r: 0.8 }));
  jst.position.set(0.5, 0.20, 0.41);
  g.add(jst);

  const colors = [0x0055ff, 0x00cc00, 0xffffff, 0xffcc00, 0xff0000, 0x111111];
  for (let i = 0; i < 6; i++) {
    const x = 0.35 + (i * 0.06);
    const curve = new M.CatmullRomCurve3([
      new M.Vector3(x, 0.15, 0.42),
      new M.Vector3(x, 0.09, 0.44),
      new M.Vector3(x, 0.05, 0.52),
      new M.Vector3(x, 0.04, 0.60),
      new M.Vector3(x, 0.04, 0.75),
    ]);
    const wire = new M.Mesh(
      new M.TubeGeometry(curve, 16, 0.012, 8, false),
      mat(colors[i], { r: 0.6 })
    );
    g.add(wire);
  }

  // ── Detalhes visuais (logo, clips) ──
  const logoBase = new M.Mesh(new M.BoxGeometry(0.6, 0.07, 0.001), mat(0xa0a0a0, { r: 0.5 }));
  logoBase.position.set(-0.65, 0.65, 0.626);
  g.add(logoBase);

  const clipMat = mat(0x050505, { r: 1 });
  const cl1 = new M.Mesh(new M.BoxGeometry(0.08, 0.06, 0.01), clipMat);
  cl1.position.set(-0.9, 0.55, 0.626);
  g.add(cl1);

  const cl2 = new M.Mesh(new M.BoxGeometry(0.08, 0.06, 0.01), clipMat);
  cl2.position.set(1.0, 0.55, 0.626);
  g.add(cl2);

  g.scale.set(1.5, 1.5, 1.5);

  return setCastShadow(g);
}

window.buildSEN66 = buildSEN66;
