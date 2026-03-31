// ══════════════════════════════════════════════════
// anemometer.js — Anemômetro + Biruta RS485
// ══════════════════════════════════════════════════

function buildAnemometer() {
  const g = new M.Group();
  const mastHeight = 6;
  const rotorHeight = 6.18;
  const vaneHeight = 4.92;
  const armLength = 1.62;
  const cupRadius = 0.31;
  const armRadius = 0.038;

  // ── Base e Mastro ──
  const bracket = new M.Mesh(new M.BoxGeometry(1.0, 0.22, 1.0), mat(0x555555, { m: 0.6 }));
  bracket.position.y = 0.11;
  g.add(bracket);

  const basePlate = new M.Mesh(new M.BoxGeometry(1.18, 0.08, 1.18), mat(0x7b818c, { m: 0.7, r: 0.26 }));
  basePlate.position.y = 0.04;
  g.add(basePlate);

  const mastMat = mat(0xe0e0e0, { m: 0.9, r: 0.2 });
  const mast = new M.Mesh(new M.CylinderGeometry(0.15, 0.2, mastHeight, 16), mastMat);
  mast.position.y = mastHeight / 2;
  g.add(mast);

  const mastCollar = new M.Mesh(new M.CylinderGeometry(0.26, 0.26, 0.4, 18), mat(0x2a2d33, { r: 0.42 }));
  mastCollar.position.y = 2.5;
  g.add(mastCollar);

  const topHead = new M.Mesh(new M.CylinderGeometry(0.22, 0.3, 0.7, 20), mat(0x555b65, { m: 0.32, r: 0.4 }));
  topHead.position.y = 5.55;
  g.add(topHead);

  const spindle = new M.Mesh(new M.CylinderGeometry(0.04, 0.04, 0.92, 16), mat(0xcfd6de, { m: 0.86, r: 0.2 }));
  spindle.position.y = 5.98;
  g.add(spindle);

  // ── Rotor (conchas de velocidade) ──
  const rotorGrp = new M.Group();
  rotorGrp.name = 'cups';
  rotorGrp.position.y = rotorHeight;

  const hubBase = new M.Mesh(new M.CylinderGeometry(0.18, 0.22, 0.35, 24), mastMat);
  const hubDome = new M.Mesh(
    new M.SphereGeometry(0.18, 24, 16, 0, PI * 2, 0, PI / 2),
    mastMat
  );
  hubDome.position.y = 0.175;
  rotorGrp.add(hubBase, hubDome);

  const doubleSidedMat = mat(0xe0e0e0, { m: 0.9, r: 0.2, side: M.DoubleSide });
  const customArmLength = armLength * 0.75;

  for (let i = 0; i < 3; i++) {
    const azimuth = i * (PI * 2 / 3);
    const armPivot = new M.Group();
    armPivot.rotation.y = azimuth;

    // Braço
    const arm = new M.Mesh(new M.CylinderGeometry(armRadius, armRadius, customArmLength, 12), mastMat);
    arm.rotation.z = PI / 2;
    arm.position.x = customArmLength / 2;
    armPivot.add(arm);

    // Concha
    const cupGrp = new M.Group();
    const cupShell = new M.Mesh(
      new M.SphereGeometry(cupRadius, 32, 16, 0, PI * 2, 0, PI / 2),
      doubleSidedMat
    );
    const cupRim = new M.Mesh(new M.TorusGeometry(cupRadius, 0.015, 8, 32), mastMat);
    cupRim.rotation.x = -PI / 2;
    cupGrp.add(cupShell, cupRim);
    cupGrp.rotation.x = PI / 2;
    cupGrp.rotation.y = Math.PI;

    const zOffset = -cupRadius * 0.6;
    const xEdgeDistance = Math.sqrt(cupRadius ** 2 - zOffset ** 2);
    const exactCX = customArmLength + xEdgeDistance - 0.01;
    cupGrp.position.set(exactCX, 0, zOffset);
    armPivot.add(cupGrp);

    // Rebite
    const rivet = new M.Mesh(
      new M.CylinderGeometry(armRadius * 1.5, armRadius * 1.5, 0.08, 12),
      mastMat
    );
    rivet.rotation.z = PI / 2;
    rivet.position.set(customArmLength - 0.025, 0, 0);
    armPivot.add(rivet);

    // Porca interna (FIX: adicionada ao grupo)
    const innerNut = new M.Mesh(
      new M.SphereGeometry(armRadius * 1.4, 16, 16, 0, PI * 2, 0, PI / 2),
      mastMat
    );
    innerNut.rotation.z = -PI / 2;
    innerNut.position.set(customArmLength, 0, 0);
    armPivot.add(innerNut);

    rotorGrp.add(armPivot);
  }
  g.add(rotorGrp);

  // ── Biruta (direção do vento) ──
  const vaneGrp = new M.Group();
  vaneGrp.name = 'vane';
  vaneGrp.position.y = vaneHeight;

  const vaneMat = mastMat;
  const vaneHub = new M.Mesh(new M.CylinderGeometry(0.08, 0.08, 0.24, 16), vaneMat);
  vaneGrp.add(vaneHub);

  const vaneAxis = new M.Mesh(new M.CylinderGeometry(0.025, 0.025, 3.0, 14), vaneMat);
  vaneAxis.rotation.z = PI / 2;
  vaneAxis.position.set(-0.3, 0, 0);
  vaneGrp.add(vaneAxis);

  // Cauda (extrudada)
  const tailShape = new M.Shape();
  tailShape.moveTo(0, 0);
  tailShape.lineTo(0, 0.12);
  tailShape.lineTo(-0.25, 0.12);
  tailShape.lineTo(-0.7, 0.7);
  tailShape.lineTo(-1.45, 0.7);
  tailShape.lineTo(-1.6, 0.15);
  tailShape.lineTo(-1.6, 0);
  tailShape.lineTo(0, 0);

  const tailGeo = new M.ExtrudeGeometry(tailShape, {
    depth: 0.02,
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.005,
    bevelSegments: 3,
  });
  const tail = new M.Mesh(tailGeo, vaneMat);
  tail.position.set(-0.2, 0, -0.01);
  vaneGrp.add(tail);

  // Contrapeso
  const cwBody = new M.Mesh(new M.CylinderGeometry(0.06, 0.06, 0.25, 16), vaneMat);
  cwBody.rotation.z = PI / 2;
  cwBody.position.set(0.9, 0, 0);
  vaneGrp.add(cwBody);

  const cwNose = new M.Mesh(new M.CylinderGeometry(0.01, 0.06, 0.20, 16), vaneMat);
  cwNose.rotation.z = -PI / 2;
  cwNose.position.set(1.15, 0, 0);
  vaneGrp.add(cwNose);

  g.add(vaneGrp);

  // Tampa superior
  const topCap = new M.Mesh(new M.SphereGeometry(0.1, 14, 12), mat(0xd8dde4, { m: 0.84, r: 0.2 }));
  topCap.position.y = rotorHeight + 0.26;
  g.add(topCap);

  g.scale.set(1.7, 1.7, 1.7);

  return setCastShadow(g);
}

window.buildAnemometer = buildAnemometer;
