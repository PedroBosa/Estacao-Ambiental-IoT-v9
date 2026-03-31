// -- MISOL Pluviômetro --
function buildMISOL() {
  const wrapper = new M.Group();
  const g = new M.Group();
  wrapper.add(g);

  const whiteMat = mat(0xffffff, { r: 0.1, m: 0.1 });
  const metalMat = mat(0xb0b5b9, { m: 0.8, r: 0.2 });
  const darkHole = mat(0x111111, { r: 0.8 });
  const gridMat = mat(0x888888, { wireframe: true });

  // Mastro de sustentação
  const pole = new M.Mesh(new M.CylinderGeometry(0.35, 0.35, 7.5, 16), metalMat);
  pole.position.set(3.8, -1.0, 0);
  g.add(pole);
const doubleWhite = mat(0xffffff, { r: 0.1, m: 0.1, side: M.DoubleSide });
  
  const body = new M.Mesh(new M.CylinderGeometry(1.6, 1.6, 3.5, 32, 1, true), doubleWhite); 
  body.position.y = 1.75;
  g.add(body);

  const innerDark = new M.Mesh(new M.CylinderGeometry(1.58, 1.58, 3.49, 32), darkHole);
  innerDark.position.y = 1.75;
  g.add(innerDark);

  const rim = new M.Mesh(new M.CylinderGeometry(1.85, 1.6, 0.8, 32, 1, true), doubleWhite);
  rim.position.y = 3.9;
  g.add(rim);

  const funnel = new M.Mesh(new M.CylinderGeometry(1.85, 0.2, 1.2, 32, 1, true), doubleWhite);
  funnel.position.y = 3.7;
  g.add(funnel);

  const lip = new M.Mesh(new M.TorusGeometry(1.85, 0.05, 16, 32), whiteMat);
  lip.rotation.x = Math.PI / 2;
  lip.position.y = 4.3;
  g.add(lip);

  const gridGrp = new M.Group();
  for (let i = -1.6; i <= 1.6; i += 0.2) {
    const len = Math.sqrt(1.8**2 - i**2) * 2;
    const b1 = new M.Mesh(new M.CylinderGeometry(0.025, 0.025, len, 8), metalMat);
    b1.rotation.z = Math.PI / 2;
    b1.position.z = i;
    gridGrp.add(b1);

    const b2 = new M.Mesh(new M.CylinderGeometry(0.025, 0.025, len, 8), metalMat);
    b2.rotation.x = Math.PI / 2;
    b2.position.x = i;
    gridGrp.add(b2);
  }
  const gridRing = new M.Mesh(new M.TorusGeometry(1.78, 0.03, 8, 32), metalMat);
  gridRing.rotation.x = Math.PI / 2;
  gridGrp.add(gridRing);

  gridGrp.position.y = 4.25;
  g.add(gridGrp);

  const core = new M.Mesh(new M.CylinderGeometry(0.85, 0.85, 2.7, 32), darkHole);
  core.position.y = -1.4;
  g.add(core);

  for(let i = 0; i < 6; i++) {
    const louver = new M.Mesh(new M.CylinderGeometry(0.9, 1.5, 0.4, 32, 1, false), whiteMat);
    louver.position.y = -0.3 - (i * 0.45);
    g.add(louver);
  }
  
  const bottomCap = new M.Mesh(new M.CylinderGeometry(0.9, 0.9, 0.1, 32), whiteMat);
  bottomCap.position.y = -0.3 - (5 * 0.45) - 0.2;
  g.add(bottomCap);

  const bracketGroup = new M.Group();
  
  const hPlate = new M.Mesh(new M.BoxGeometry(2.8, 0.1, 1.8), whiteMat);
  hPlate.position.set(2.0, 0, 0);
  bracketGroup.add(hPlate);

  const vPlate = new M.Mesh(new M.BoxGeometry(0.1, 1.5, 1.8), whiteMat);
  vPlate.position.set(3.40, -0.7, 0);
  bracketGroup.add(vPlate);

  const levelBase = new M.Mesh(new M.CylinderGeometry(0.18, 0.18, 0.12, 16), whiteMat);
  levelBase.position.set(2.2, 0.06, 0.6);
  bracketGroup.add(levelBase);

  const levelBubble = new M.Mesh(new M.CylinderGeometry(0.12, 0.12, 0.13, 16), mat(0x66ff66, { m: 0.1, r: 0.1 }));
  levelBubble.position.set(2.2, 0.06, 0.6);
  bracketGroup.add(levelBubble);

  for(let i = -0.4; i <= 0.4; i += 0.8) {
    const yPos = -0.7 + i;
    
    const uBoltCurve = new M.Mesh(new M.TorusGeometry(0.385, 0.045, 8, 24, Math.PI), metalMat);
    uBoltCurve.rotation.set(Math.PI / 2, 0, -Math.PI / 2);
    uBoltCurve.position.set(3.8, yPos, 0);
    bracketGroup.add(uBoltCurve);

    const tL = new M.Mesh(new M.CylinderGeometry(0.045, 0.045, 1.5), metalMat);   
    tL.rotation.z = Math.PI / 2;
    tL.position.set(3.05, yPos, 0.385);
    bracketGroup.add(tL);

    const tR = new M.Mesh(new M.CylinderGeometry(0.045, 0.045, 1.5), metalMat);   
    tR.rotation.z = Math.PI / 2;
    tR.position.set(3.05, yPos, -0.385);
    bracketGroup.add(tR);

    const flatMat = new M.MeshStandardMaterial({ color: 0xb0b5b9, metalness: 0.8, roughness: 0.2, flatShading: true });
    const nutL = new M.Mesh(new M.CylinderGeometry(0.1, 0.1, 0.08, 6), flatMat);
    nutL.rotation.set(Math.PI / 6, 0, Math.PI / 2);
    nutL.position.set(3.30, yPos, 0.385);
    bracketGroup.add(nutL);

    const nutR = new M.Mesh(new M.CylinderGeometry(0.1, 0.1, 0.08, 6), flatMat);
    nutR.rotation.set(Math.PI / 6, 0, Math.PI / 2);
    nutR.position.set(3.30, yPos, -0.385);
    bracketGroup.add(nutR);
  }

  g.add(bracketGroup);

  const port = new M.Mesh(new M.CylinderGeometry(0.15, 0.15, 0.2, 16), darkHole);
  port.rotation.z = Math.PI / 2;
  // Botão/Porta puxado mais para frente (-Z) e girado um pouco para a lateral pra nao encostar na base de tras
  port.position.set(1.48, 0.5, -0.6);
  g.add(port);

  g.scale.set(0.65, 0.65, 0.65);
  g.position.set(-1.0, 3.8, 0);

  return setCastShadow(wrapper);
}

// -- Piran�metro RS485 --
function buildPyranometer() {
  const g = new M.Group();

  const baseMat = mat(0xcbd4d9, { m: 0.6, r: 0.3 }); // Prata/Alum�nio
  const darkMat = mat(0x1a1a1a, { r: 0.8 });         // Preto fosco
  const whiteMat= mat(0xf2f2f2, { r: 0.9 });         // Cer�mica/Pl�stico branco

  const base = new M.Mesh(new M.CylinderGeometry(1.6, 1.6, 0.25, 32), baseMat); 
  base.position.y = 0.275; 
  g.add(base);

  const baseTop = new M.Mesh(new M.CylinderGeometry(1.3, 1.3, 0.15, 32), baseMat);
  baseTop.position.y = 0.475; 
  g.add(baseTop);

  const innerRing = new M.Mesh(new M.CylinderGeometry(1.15, 1.15, 0.1, 32), baseMat);
  innerRing.position.y = 0.60; 
  g.add(innerRing);

  const wDisc = new M.Mesh(new M.CylinderGeometry(0.48, 0.48, 0.15, 32), whiteMat);
  wDisc.position.set(-0.52, 0.625, 0); 
  g.add(wDisc);

  const bDisc = new M.Mesh(new M.CylinderGeometry(0.48, 0.48, 0.15, 32), darkMat);
  bDisc.position.set(0.52, 0.625, 0);
  g.add(bDisc);

  const dome = new M.Mesh(
    new M.SphereGeometry(1.05, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
    mat(0xffffff, { o: 0.25, cc: 1, m: 0.2, r: 0.05 })
  );
  dome.position.y = 0.65; 
  g.add(dome);

  const bubbleBase = new M.Mesh(new M.CylinderGeometry(0.10, 0.10, 0.06, 16), darkMat);
  bubbleBase.position.set(1.01, 0.41, 1.01);
  g.add(bubbleBase);

  const bubbleGlass = new M.Mesh(
    new M.SphereGeometry(0.07, 16, 16, 0, Math.PI*2, 0, Math.PI/2),
    mat(0x88ff88, { o: 0.6, cc: 1, m: 0.1, r: 0.1 })
  );
  bubbleGlass.position.set(1.01, 0.43, 1.01);
  g.add(bubbleGlass);

  for (let i = 0; i < 3; i++) {
    const a = (i * (Math.PI * 2 / 3)) - Math.PI/2;
    const foot = new M.Mesh(new M.CylinderGeometry(0.2, 0.2, 0.15, 16), darkMat);
    foot.position.set(Math.cos(a) * 1.2, 0.075, Math.sin(a) * 1.2);
    g.add(foot);
  }

  const conn = new M.Mesh(new M.CylinderGeometry(0.12, 0.12, 0.3, 16), mat(0xff8c00, { m: 0.3 }));
  conn.rotation.z = Math.PI / 2;
  conn.position.set(-1.6, 0.275, 0); 
  g.add(conn);

  const cPts = [
    new M.Vector3(-1.75, 0.275, 0),
    new M.Vector3(-2.0, 0.275, 0),
    new M.Vector3(-2.0, 0, 0)
  ];
  const cable = new M.Mesh(
    new M.TubeGeometry(new M.CatmullRomCurve3(cPts), 8, 0.06, 8),
    darkMat
  );
  g.add(cable);

  return setCastShadow(g);
}

window.buildMISOL = buildMISOL;
window.buildPyranometer = buildPyranometer;
