// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// sensors.js â€” Sensores menores (placas breakout)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

// â”€â”€ BME690 â”€â”€
function buildBME690() {
  const g = new M.Group();

  const w = 2.0, h = 0.08, d = 1.4;

  // PCB - Base azul clássica
  const pcbMat = mat(0x184285, { r: 0.4, m: 0.1 });
  const elev = 0.5;
  const pcb = new M.Mesh(new M.BoxGeometry(w, h, d), pcbMat);
  pcb.position.y = elev;
  g.add(pcb);

  // Furos de montagem nas 2 quinas inferiores
  const holeMat = mat(0x111111);
  const pcbGoldMat = mat(0xc5a059, { m: 0.8, r: 0.2 });
  const holePos = [
    [-w / 2 + 0.35, d / 2 - 0.25], // inferior esquerdo
    [w / 2 - 0.35, d / 2 - 0.25]   // inferior direito
  ];
  holePos.forEach(pos => {
    // Furo interno escuro
    const hole = new M.Mesh(new M.CylinderGeometry(0.14, 0.14, h + 0.05, 16), mat(0x050505));
    hole.position.set(pos[0], elev, pos[1]);
    g.add(hole);

    // Anel Dourado Superior
    const ring = new M.Mesh(new M.TorusGeometry(0.16, 0.04, 8, 20), mat(0xcca633, { m: 0.9, r: 0.2 }));
    ring.rotation.x = Math.PI / 2;
    ring.position.set(pos[0], h / 2 + 0.005 + elev, pos[1]);
    g.add(ring);
  });

  // Pads e Headers (Topo)
  const pinMat = mat(0xb89a32, { r: 0.22, m: 0.92 });
  const pinTopMat = mat(0xd9bd58, { r: 0.18, m: 0.96 });
  const baseMat = mat(0x202124, { r: 0.82 });
  const pinLen = 0.92;

  // Régua preta inferior do header
  const strip = new M.Mesh(new M.BoxGeometry(6 * 0.26, 0.16, 0.16), baseMat);
  strip.position.set(0, -h / 2 - 0.08 + elev, -d / 2 + 0.2);
  g.add(strip);

  // 6 Pinos em linha
  for (let i = 0; i < 6; i++) {
    const padX = - (2.5 * 0.26) + (i * 0.26);
    const padZ = -d / 2 + 0.2;

    const pad = new M.Mesh(new M.CylinderGeometry(0.08, 0.08, h * 1.05, 12), pcbGoldMat);
    pad.position.set(padX, elev, padZ);
    g.add(pad);

    const pin = new M.Mesh(new M.BoxGeometry(0.045, pinLen, 0.045), pinMat);
    pin.position.set(padX, -0.37 + elev, padZ);
    g.add(pin);

    const pinTop = new M.Mesh(new M.BoxGeometry(0.048, 0.095, 0.048), pinTopMat);
    pinTop.position.set(padX, h / 2 + 0.047 + elev, padZ);
    g.add(pinTop);
  }

  // Elemento Sensor BME Prateado (BEM MENOR, perfeitamente em escala 3x3mm)
  const bmeMat = mat(0xc7c7bd, { m: 1, r: 0.2 });
  const bmeW = 0.35; 
  const bme = new M.Mesh(new M.BoxGeometry(bmeW, 0.06, bmeW), bmeMat);
  bme.position.set(-0.55, h / 2 + 0.03 + elev, 0.05);
  g.add(bme);
  const bmeHole = new M.Mesh(new M.CylinderGeometry(0.02, 0.02, 0.08, 8), mat(0x111111));
  bmeHole.position.set(-0.45, h / 2 + 0.03 + elev, 0.12);
  g.add(bmeHole);
  const bmeBase = new M.Mesh(new M.BoxGeometry(bmeW * 1.05, 0.02, bmeW * 1.05), mat(0x666666));
  bmeBase.position.set(-0.55, h / 2 + 0.01 + elev, 0.05);
  g.add(bmeBase);

  // Chips LDO Reguladores (Proporções menores para despoluir a placa)
  const ldoMat = mat(0x181818, { r: 0.4 });
  const pinM = mat(0xc7c7c7, { m: 1 });

  // IC 1 LDO Central (SOT-23)
  const ic1 = new M.Mesh(new M.BoxGeometry(0.35, 0.06, 0.25), ldoMat);
  ic1.position.set(0.0, h / 2 + 0.03 + elev, 0.0);
  g.add(ic1);
  for (let i = 0; i < 3; i++) {
    const pt = new M.Mesh(new M.BoxGeometry(0.04, 0.02, 0.06), pinM);
    pt.position.set(0.0 - 0.1 + i * 0.1, h / 2 + 0.01 + elev, 0.0 - 0.13); g.add(pt);
    const pb = new M.Mesh(new M.BoxGeometry(0.04, 0.02, 0.06), pinM);
    pb.position.set(0.0 - 0.1 + i * 0.1, h / 2 + 0.01 + elev, 0.0 + 0.13); g.add(pb);
  }

  // IC 2 Level Shifter Direita (Espaçado dos furos)
  const ic2 = new M.Mesh(new M.BoxGeometry(0.25, 0.06, 0.35), ldoMat);
  ic2.position.set(0.55, h / 2 + 0.03 + elev, 0.0);
  g.add(ic2);
  for (let i = 0; i < 3; i++) {
    const pl = new M.Mesh(new M.BoxGeometry(0.06, 0.02, 0.04), pinM);
    pl.position.set(0.55 - 0.13, h / 2 + 0.01 + elev, 0.0 - 0.1 + i * 0.1); g.add(pl);
    const pr = new M.Mesh(new M.BoxGeometry(0.06, 0.02, 0.04), pinM);
    pr.position.set(0.55 + 0.13, h / 2 + 0.01 + elev, 0.0 - 0.1 + i * 0.1); g.add(pr);
  }

  // Componentes Passivos (Resistores/Caps) em tamanhos miúdos precisos
  const smdBlack = mat(0x111111, { r: 0.5 });
  const smdBrown = mat(0xa8754b, { r: 0.4 });
  const smds = [
    [-0.55, -0.25, smdBrown, 0.1, 0.06],
    [-0.3, -0.15, smdBlack, 0.06, 0.1],
    [0.25, -0.25, smdBrown, 0.1, 0.06],
    [0.3, 0.15, smdBrown, 0.06, 0.1],
    [0.0, 0.25, smdBlack, 0.1, 0.06],
    [-0.25, 0.15, smdBrown, 0.06, 0.1]
  ];

  smds.forEach(s => {
    const ms = new M.Mesh(new M.BoxGeometry(s[3], 0.03, s[4]), s[2]);
    ms.position.set(s[0], h / 2 + 0.015 + elev, s[1]);
    g.add(ms);
    const pad = new M.Mesh(new M.BoxGeometry(s[3] + 0.02, 0.01, s[4] + 0.02), pinM);
    pad.position.set(s[0], h / 2 + 0.005 + elev, s[1]);
    g.add(pad);
  });

  const trackMat = mat(0x2767c2);
  const track1 = new M.Mesh(new M.BoxGeometry(0.5, 0.005, 0.01), trackMat);
  track1.position.set(-0.25, h / 2 + 0.001 + elev, 0.1);
  track1.rotation.y = PI / 6;
  g.add(track1);

  return setCastShadow(g);
}

// â”€â”€ SFA30 â”€â”€
function buildSFA30() {
  const g = new M.Group();

  const w = 3.6, h = 0.1, d = 1.9;

  // PCB - Base dourada (bordas) para dar o efeito de banho de ouro nas bordas
  const pcbGoldMat = mat(0xc5a059, { m: 0.8, r: 0.2 });
  const elev = 0.5;

  const pcbGold = new M.Mesh(new M.BoxGeometry(w, h * 0.9, d), pcbGoldMat);
  pcbGold.position.y = elev;
  g.add(pcbGold);

  const pcbGreenMat = mat(0x0a4122, { r: 0.7, m: 0.1 });
  const pcbGreen = new M.Mesh(new M.BoxGeometry(w * 0.98, h, d * 0.98), pcbGreenMat);
  pcbGreen.position.y = elev;
  g.add(pcbGreen);

  const holePos = [
    [-w / 2 + 0.35, d / 2 - 0.3], [-w / 2 + 0.35, -d / 2 + 0.3], [w / 2 - 0.25, d / 2 - 0.25]
  ];
  holePos.forEach(pos => {
    const hole = new M.Mesh(new M.CylinderGeometry(0.11, 0.11, h + 0.05, 16), mat(0x050505));
    hole.position.set(pos[0], elev, pos[1]);
    g.add(hole);
    const ring = new M.Mesh(new M.TorusGeometry(0.12, 0.035, 8, 20), mat(0xcca633, { m: 0.9, r: 0.2 }));
    ring.rotation.x = Math.PI / 2;
    ring.position.set(pos[0], h / 2 + 0.005 + elev, pos[1]);
    g.add(ring);
  });

  const pinMat = mat(0xb89a32, { r: 0.22, m: 0.92 });
  const pinTopMat = mat(0xd9bd58, { r: 0.18, m: 0.96 });
  const baseMat = mat(0x202124, { r: 0.82 });
  const pinLen = 0.92;
  const strip = new M.Mesh(new M.BoxGeometry(1.24, 0.16, 0.15), baseMat);
  strip.position.set(0.3 + 3 * 0.18, -h / 2 - 0.08 + elev, -d / 2 + 0.15);
  g.add(strip);

  for (let i = 0; i < 7; i++) {
    const padZ = -d / 2 + 0.15;
    const padX = 0.3 + (i * 0.18);
    const pad = new M.Mesh(new M.CylinderGeometry(0.06, 0.06, h * 1.05, 12), pcbGoldMat);
    pad.position.set(padX, elev, padZ);
    g.add(pad);
    const pin = new M.Mesh(new M.BoxGeometry(0.045, pinLen, 0.045), pinMat);
    pin.position.set(padX, -0.37 + elev, padZ);
    g.add(pin);
    const pinTop = new M.Mesh(new M.BoxGeometry(0.048, 0.095, 0.048), pinTopMat);
    pinTop.position.set(padX, h / 2 + 0.047 + elev, padZ);
    g.add(pinTop);
  }

  const connZ = 0.1;
  const connBase = new M.Mesh(new M.BoxGeometry(0.35, 0.45, 0.8), mat(0x111111, { r: 0.5 }));
  connBase.position.set(-w / 2 + 0.2, h / 2 + 0.22 + elev, connZ);
  g.add(connBase);
  const connTop = new M.Mesh(new M.BoxGeometry(0.15, 0.15, 0.6), mat(0x222222));
  connTop.position.set(-w / 2 + 0.35, h / 2 + 0.1 + elev, connZ);
  g.add(connTop);

  const sensX = w / 2 - 0.75;
  const sW = 1.3, sD = 1.3, sH = 0.2;
  const sBase = new M.Mesh(new M.BoxGeometry(sW * 0.95, sH * 0.5, sD * 0.95), mat(0x111111));
  sBase.position.set(sensX, h / 2 + sH * 0.25 + elev, 0);
  g.add(sBase);
  const sTop = new M.Mesh(new M.BoxGeometry(sW, sH, sD), mat(0xa83818, { r: 0.5, m: 0.2 }));
  sTop.position.set(sensX, h / 2 + sH * 0.8 + elev, 0);
  g.add(sTop);
  const sHole = new M.Mesh(new M.CylinderGeometry(0.06, 0.06, 0.02, 16), mat(0xdddddd));
  sHole.position.set(sensX, h / 2 + sH * 1.3 + elev, 0);
  g.add(sHole);
  const sHole2 = new M.Mesh(new M.CylinderGeometry(0.025, 0.025, 0.02, 12), mat(0xdddddd));
  sHole2.position.set(sensX + 0.45, h / 2 + sH * 1.3 + elev, -0.45);
  g.add(sHole2);
  const sPins = new M.Mesh(new M.BoxGeometry(sW * 1.05, 0.05, sD * 0.3), mat(0x222222));
  sPins.position.set(sensX, h / 2 + sH * 0.2 + elev, 0);
  g.add(sPins);

  const icMain = new M.Mesh(new M.BoxGeometry(0.5, 0.1, 0.4), mat(0x181818, { r: 0.3 }));
  icMain.position.set(-0.3, h / 2 + 0.05 + elev, 0.2);
  g.add(icMain);
  const pinM_IC = mat(0xc7c7c7, { m: 1 });
  for (let i = 0; i < 6; i++) {
    const p1 = new M.Mesh(new M.BoxGeometry(0.04, 0.02, 0.1), pinM_IC);
    p1.position.set(-0.3 - 0.2 + i * 0.08, h / 2 + 0.01 + elev, 0.4);
    g.add(p1);
    const p2 = new M.Mesh(new M.BoxGeometry(0.04, 0.02, 0.1), pinM_IC);
    p2.position.set(-0.3 - 0.2 + i * 0.08, h / 2 + 0.01 + elev, 0);
    g.add(p2);
  }
  const icSmall = new M.Mesh(new M.BoxGeometry(0.2, 0.06, 0.2), mat(0x181818, { r: 0.3 }));
  icSmall.position.set(0.3, h / 2 + 0.03 + elev, 0.3);
  g.add(icSmall);

  const smdBlack = mat(0x111111, { r: 0.5 });
  const smdBrown = mat(0xa8754b, { r: 0.4 });
  const smds_sfa = [
    [-0.45, -0.15, smdBrown, 0.1, 0.06],
    [-0.45, -0.05, smdBrown, 0.1, 0.06],
    [-0.45, 0.05, smdBlack, 0.1, 0.06],
    [-0.45, 0.15, smdBrown, 0.1, 0.06],
    [0.15, -0.15, smdBlack, 0.1, 0.06],
    [0.3, -0.15, smdBrown, 0.06, 0.1],
    [0.3, 0.0, smdBrown, 0.06, 0.1],
    [0.0, 0.25, smdBlack, 0.06, 0.1],
    [0.15, 0.25, smdBlack, 0.06, 0.1],
    [0.3, 0.25, smdBlack, 0.06, 0.1],
  ];

  smds_sfa.forEach(s => {
    const ms = new M.Mesh(new M.BoxGeometry(s[3], 0.04, s[4]), s[2]);
    ms.position.set(s[0], h / 2 + 0.02 + elev, s[1]);
    g.add(ms);
    const pad = new M.Mesh(new M.BoxGeometry(s[3] + 0.04, 0.01, s[4] + 0.02), pinM_IC);
    pad.position.set(s[0], h / 2 + 0.005 + elev, s[1]);
    g.add(pad);
  });

  return setCastShadow(g);
}

// â”€â”€ LTR390 â”€â”€
function buildLTR390() {
  const g = new M.Group();

  // Placa LTR390 (Adafruit Style)
  const w = 2.5, h = 0.08, d = 1.6;
  const elev = 0.5;

  // --- PCB Principal Preta com Bordas Arredondadas (simulada com cruz e cilindros) ---
  const pcbMat = mat(0x151515, { r: 0.5, m: 0.2 });

  // Central horizontal e vertical
  const pcbH = new M.Mesh(new M.BoxGeometry(w, h, d - 0.5), pcbMat);
  pcbH.position.y = elev;
  g.add(pcbH);
  const pcbV = new M.Mesh(new M.BoxGeometry(w - 0.5, h, d), pcbMat);
  pcbV.position.y = elev;
  g.add(pcbV);

  // Furos de Montagem Dourados e Bordas redondas
  const holeX = w / 2 - 0.25;
  const holeZ = d / 2 - 0.25;
  for (let ix of [-1, 1]) {
    for (let iz of [-1, 1]) {
      // Borda redonda
      const corner = new M.Mesh(new M.CylinderGeometry(0.25, 0.25, h, 16), pcbMat);
      corner.position.set(ix * holeX, elev, iz * holeZ);
      g.add(corner);

      // Furo interno escuro
      const hole = new M.Mesh(new M.CylinderGeometry(0.12, 0.12, h + 0.02, 16), mat(0x050505));
      hole.position.set(ix * holeX, elev, iz * holeZ);
      g.add(hole);

      // Anel Dourado Superior
      const ring = new M.Mesh(new M.TorusGeometry(0.16, 0.05, 8, 20), mat(0xcca633, { m: 0.9, r: 0.2 }));
      ring.rotation.x = Math.PI / 2;
      ring.position.set(ix * holeX, h / 2 + 0.005 + elev, iz * holeZ);
      g.add(ring);
    }
  }

  // --- Silkscreen (Textos Brancos) ---
  const whiteMat = mat(0xeeeeee);

  // LTR390
  const ltrTxt = new M.Mesh(new M.BoxGeometry(0.7, 0.01, 0.15), whiteMat);
  ltrTxt.position.set(0.1, h / 2 + 0.005 + elev, -0.5);
  g.add(ltrTxt);

  // ALS+UV Sensor
  const alsTxt = new M.Mesh(new M.BoxGeometry(0.8, 0.01, 0.1), whiteMat);
  alsTxt.position.set(0.15, h / 2 + 0.005 + elev, -0.3);
  g.add(alsTxt);

  // Logo Flor Adafruit (Simulado com losangos rotacionados)
  for (let r = 0; r < 4; r++) {
    const petal = new M.Mesh(new M.BoxGeometry(0.3, 0.01, 0.08), whiteMat);
    petal.position.set(-0.6, h / 2 + 0.005 + elev, -0.35);
    petal.rotation.y = (Math.PI / 4) * r;
    g.add(petal);
  }

  // --- Componentes SMD no Centro ---
  // Sensor LTR390 (No meio exato da placa)
  const ltrBase = new M.Mesh(new M.BoxGeometry(0.2, 0.06, 0.2), mat(0x222222, { m: 0.5 }));
  ltrBase.position.set(0, h / 2 + 0.03 + elev, 0.1);
  g.add(ltrBase);
  // Janelinha transparente no topo do sensor
  const ltrWin = new M.Mesh(new M.BoxGeometry(0.12, 0.02, 0.12), mat(0x88bbff, { m: 0.8, o: 0.9 }));
  ltrWin.position.set(0, h / 2 + 0.065 + elev, 0.1);
  g.add(ltrWin);

  // CIs Pretos (Reguladores e Level Shifters)
  const icMat = mat(0x1a1a1a, { r: 0.4 });
  const pinMat = mat(0xcccccc, { m: 0.8, r: 0.4 });

  // CI Esquerdo (5/6 Pinos)
  const icL = new M.Mesh(new M.BoxGeometry(0.22, 0.08, 0.35), icMat);
  icL.position.set(-0.4, h / 2 + 0.04 + elev, 0.1);
  g.add(icL);
  for (let i = 0; i < 3; i++) {
    const p = new M.Mesh(new M.BoxGeometry(0.32, 0.02, 0.04), pinMat);
    p.position.set(-0.4, h / 2 + 0.01 + elev, 0.1 - 0.12 + (i * 0.12));
    g.add(p);
  }

  // CI Direito (Level Shifter, 6, 8 pinos)
  const icR = new M.Mesh(new M.BoxGeometry(0.25, 0.08, 0.4), icMat);
  icR.position.set(0.5, h / 2 + 0.04 + elev, 0.1);
  g.add(icR);
  for (let i = 0; i < 4; i++) {
    const p = new M.Mesh(new M.BoxGeometry(0.35, 0.02, 0.04), pinMat);
    p.position.set(0.5, h / 2 + 0.01 + elev, 0.1 - 0.15 + (i * 0.1));
    g.add(p);
  }

  // Resistores e Capacitores (Capacitor marrom, Resistor preto)
  const capM = mat(0xa8754b);
  const resM = mat(0x151515);
  const smds = [
    [-0.4, -0.2, capM], [-0.4, 0.45, capM], [-0.15, 0.45, capM],
    [0.2, 0.45, resM], [0.55, 0.45, resM], [0.55, -0.2, resM],
    [0.75, -0.2, capM]
  ];
  smds.forEach(pos => {
    const smd = new M.Mesh(new M.BoxGeometry(0.12, 0.04, 0.08), pos[2]);
    smd.position.set(pos[0], h / 2 + 0.02 + elev, pos[1]);
    g.add(smd);
    const pad = new M.Mesh(new M.BoxGeometry(0.16, 0.01, 0.1), pinMat);
    pad.position.set(pos[0], h / 2 + 0.005 + elev, pos[1]);
    g.add(pad);
  });

  // --- Conectores STEMMA QT (Qwiic) JST-SH Nas Laterais ---
  const qwiicM = mat(0x1a1a1a, { r: 0.6 });
  function addStemmaQT(px, py_raw, pz, rotY) {
    const qg = new M.Group();
    qg.position.set(px, py_raw + elev, pz);
    qg.rotation.y = rotY;

    // Base Plástica
    const base = new M.Mesh(new M.BoxGeometry(0.35, 0.25, 0.5), qwiicM);
    base.position.set(0, 0.125, 0);
    qg.add(base);

    // Aba superior de encaixe
    const topTab = new M.Mesh(new M.BoxGeometry(0.12, 0.04, 0.35), qwiicM);
    topTab.position.set(-0.16, 0.27, 0);
    qg.add(topTab);

    // 4 Pinos internos prateados brilhantes apontandos p/ dentro
    for (let i = 0; i < 4; i++) {
      const pin = new M.Mesh(new M.BoxGeometry(0.15, 0.02, 0.02), pinMat);
      pin.position.set(0.12, 0.15, -0.15 + (i * 0.1));
      qg.add(pin);
    }
    g.add(qg);
  }

  // Adiciona conectores na esquerda e direita (levemente deslocados para fora da placa)
  addStemmaQT(-w / 2 + 0.15, h / 2, 0, Math.PI); // Furo pra esquerda
  addStemmaQT(w / 2 - 0.15, h / 2, 0, 0);        // Furo pra direita


  // --- Pinos Inferiores Estilo Heltec (Barra Preta + Pinos Longos Dourados) ---
  const numPins = 6;
  const pinZ = d / 2 - 0.2;

  const hPinMat = mat(0xb89a32, { r: 0.22, m: 0.92 });
  const hPinTopMat = mat(0xd9bd58, { r: 0.18, m: 0.96 });
  const hBaseMat = mat(0x202124, { r: 0.82 });
  const pinLen = 0.92;

  // Base plástica preta inferior
  const stripW = numPins * 0.254 + 0.05;
  const strip = new M.Mesh(new M.BoxGeometry(stripW, 0.16, 0.15), hBaseMat);
  strip.position.set(0, -h / 2 - 0.08 + elev, pinZ);
  g.add(strip);

  const silkPins = ["VIN", "3Vo", "GND", "SCL", "SDA", "INT"];
  for (let i = 0; i < numPins; i++) {
    const px = (i - (numPins - 1) / 2) * 0.254;

    // Pad Dourado no furo da PCB
    const pad = new M.Mesh(new M.CylinderGeometry(0.09, 0.09, h + 0.02, 12), mat(0xcca633, { m: 0.9 }));
    pad.position.set(px, elev, pinZ);
    g.add(pad);

    // Pino inferior longo (fixacao na breadboard)
    const pin = new M.Mesh(new M.BoxGeometry(0.045, pinLen, 0.045), hPinMat);
    pin.position.set(px, -0.37 + elev, pinZ);
    g.add(pin);

    // Pino superior minúsculo (sinalizando a solda no topo)
    const pinTop = new M.Mesh(new M.BoxGeometry(0.048, 0.095, 0.048), hPinTopMat);
    pinTop.position.set(px, h / 2 + 0.047 + elev, pinZ);
    g.add(pinTop);

    // Etiqueta Branca em cima do pino
    const lbl = new M.Mesh(new M.BoxGeometry(0.15, 0.01, 0.06), whiteMat);
    lbl.position.set(px, h / 2 + 0.005 + elev, pinZ - 0.25);
    g.add(lbl);
  }

  return setCastShadow(g);
}

// ── AS3935 ──
function buildAS3935() {
  const g = new M.Group();

  const hBase = 0.08;
  const matPurple = mat(0x4a1464, { r: 0.4, m: 0.2 }); 
  const matGold = mat(0xd6a848, { m: 1.0, r: 0.15 });

  const sh = new M.Shape();
  sh.moveTo(0.65, 1.7);     
  sh.lineTo(-0.65, 1.7);    
  sh.lineTo(-0.65, 0.4);    
  sh.lineTo(-1.75, -0.4);   
  sh.lineTo(-1.75, -1.15);  
  sh.lineTo(-1.45, -1.35);  
  sh.lineTo(1.45, -1.35);   
  sh.lineTo(1.75, -1.15);   
  sh.lineTo(1.75, -0.4);    
  sh.lineTo(0.65, 0.4);     
  sh.lineTo(0.65, 1.7);     

  const elev = 0.5;

  const extrudeSet = { depth: hBase, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.04, bevelSegments: 2 };
  const pcb = new M.Mesh(new M.ExtrudeGeometry(sh, extrudeSet), [matPurple, matGold]);
  pcb.rotation.x = -Math.PI / 2;
  pcb.position.y = -hBase / 2 + elev;
  g.add(pcb);

  const cSilk = document.createElement('canvas');
  cSilk.width = 512; cSilk.height = 128;
  const ctx = cSilk.getContext('2d');
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, 512, 128); 
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 80px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('CJMCU', 256, 64);
  const textTex = new M.CanvasTexture(cSilk);
  textTex.needsUpdate = true;
  textTex.anisotropy = 4;
  const silkMat = new M.MeshBasicMaterial({
    map: textTex,
    transparent: true,
    blending: M.AdditiveBlending,
    depthWrite: false,
    depthTest: false,
    polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4, 
    side: M.DoubleSide
  });
  const silkPlane = new M.Mesh(new M.PlaneGeometry(1.4, 0.35), silkMat);
  silkPlane.rotation.x = -Math.PI / 2;
  silkPlane.position.set(0, hBase / 2 + 0.015 + elev, 0.85); 
  silkPlane.renderOrder = 999;
  g.add(silkPlane);

  const topAntZ = -1.6;
  const antMat = mat(0x1a1a1a, { r: 0.3 });
  const ant = new M.Mesh(new M.BoxGeometry(1.2, 0.18, 0.25), antMat);
  ant.position.set(0, hBase / 2 + 0.09 + elev, topAntZ);
  g.add(ant);
  const antG = new M.Mesh(new M.BoxGeometry(1.0, 0.15, 0.26), mat(0x38180d, { r: 0.4 })); 
  antG.position.set(0, hBase / 2 + 0.075 + elev, topAntZ);
  g.add(antG);

  const stC = document.createElement('canvas');
  stC.width = 512; stC.height = 128;
  const sCtx = stC.getContext('2d');
  sCtx.fillStyle = '#eeeeee';
  sCtx.fillRect(0, 0, 512, 128);
  sCtx.fillStyle = '#000000';
  sCtx.font = 'bold 75px monospace';
  sCtx.textAlign = 'center';
  sCtx.textBaseline = 'middle';
  sCtx.fillText('MA5532-AE', 256, 64);
  const stTex = new M.CanvasTexture(stC);
  stTex.needsUpdate = true;
  stTex.anisotropy = 4;
  const stickerMat = new M.MeshBasicMaterial({ map: stTex });
  const sticker = new M.Mesh(new M.PlaneGeometry(0.95, 0.16), stickerMat);
  sticker.rotation.x = -Math.PI / 2;
  sticker.rotation.z = Math.PI;
  sticker.position.set(0, hBase / 2 + 0.185 + elev, topAntZ);
  g.add(sticker);

  const holes = [
    [-0.35, -1.152], [0.35, -1.152], [-1.45, 0.85], [1.45, 0.85] 
  ];
  holes.forEach(pos => {
    const hCore = new M.Mesh(new M.CylinderGeometry(0.10, 0.10, hBase + 0.05, 16), mat(0x050505));
    hCore.position.set(pos[0], elev, pos[1]);
    g.add(hCore);
    const hRing = new M.Mesh(new M.TorusGeometry(0.10, 0.03, 8, 20), matGold);
    hRing.rotation.x = Math.PI / 2;
    hRing.position.set(pos[0], hBase / 2 + 0.005 + elev, pos[1]);
    g.add(hRing);
  });

  for (let vx = -1.4; vx <= 1.4; vx += 0.25) {
    for (let vz = -0.2; vz <= 1.0; vz += 0.25) {
      if (Math.abs(vx) - 0.7 < (vz * 0.9) && Math.abs(vx) > 0.6 && (vz < 1.0)) {
        const via = new M.Mesh(new M.CylinderGeometry(0.02, 0.02, 0.02, 8), matGold);
        via.position.set(vx, hBase / 2 + 0.005 + elev, vz);
        g.add(via);
      }
    }
  }

  const chipZ = 0.4;
  const chipSize = 0.38;
  const chip = new M.Mesh(new M.BoxGeometry(chipSize, 0.06, chipSize), mat(0x181818, { r: 0.3 }));
  chip.position.set(0, hBase / 2 + 0.03 + elev, chipZ);
  g.add(chip);
  const pinICMat = mat(0xc7c7c7, { m: 1.0 });
  const pinL = 0.06;
  const pinY = hBase / 2 + 0.015 + elev;
  for (let i = 0; i < 4; i++) {
    const px = -0.12 + (i * 0.08);
    const pTop = new M.Mesh(new M.BoxGeometry(0.03, 0.02, pinL), pinICMat);
    pTop.position.set(px, pinY, chipZ - 0.2);
    g.add(pTop);
    const pBot = new M.Mesh(new M.BoxGeometry(0.03, 0.02, pinL), pinICMat);
    pBot.position.set(px, pinY, chipZ + 0.2);
    g.add(pBot);
    const pLeft = new M.Mesh(new M.BoxGeometry(pinL, 0.02, 0.03), pinICMat);
    pLeft.position.set(-0.2, pinY, chipZ + px);
    g.add(pLeft);
    const pRight = new M.Mesh(new M.BoxGeometry(pinL, 0.02, 0.03), pinICMat);
    pRight.position.set(0.2, pinY, chipZ + px);
    g.add(pRight);
  }
  const icDot = new M.Mesh(new M.CylinderGeometry(0.02, 0.02, 0.01, 8), mat(0x444444));
  icDot.position.set(-0.12, hBase / 2 + 0.06 + elev, chipZ - 0.12);
  g.add(icDot);

  const smdBrn = mat(0xa8754b, { r: 0.4 });
  const smdBlk = mat(0x141414, { r: 0.4 });
  const smds = [
    [0.0, -0.65, smdBrn], [0.0, -0.45, smdBrn], [0.0, -0.25, smdBlk],
    [-0.45, 0.1, smdBrn], [-0.45, 0.3, smdBrn], [-0.45, 0.5, smdBlk], [-0.45, 0.7, smdBrn],
    [0.45, 0.1, smdBrn], [0.45, 0.4, smdBlk], [0.45, 0.6, smdBlk],
  ];
  smds.forEach(s => {
    const pad = new M.Mesh(new M.BoxGeometry(0.12, 0.01, 0.08), pinICMat);
    pad.position.set(s[0], hBase / 2 + 0.01 + elev, s[1]);
    g.add(pad);
    const m = new M.Mesh(new M.BoxGeometry(0.08, 0.04, 0.05), s[2]);
    m.position.set(s[0], hBase / 2 + 0.025 + elev, s[1]);
    g.add(m);
  });

  const numPins = 11;
  const pZ = 1.25;
  const basePitch = 0.254; 
  const pMat = mat(0xb89a32, { r: 0.22, m: 0.92 });
  const pTopMat = mat(0xd9bd58, { r: 0.18, m: 0.96 });
  const stripMat = mat(0x181818, { r: 0.82 });

  const stripW = numPins * basePitch + 0.05;
  const strip = new M.Mesh(new M.BoxGeometry(stripW, 0.16, 0.16), stripMat);
  strip.position.set(0, -0.08 + elev, pZ);
  g.add(strip);

  for (let i = 0; i < numPins; i++) {
    const px = (i - (numPins - 1) / 2) * basePitch;
    const pad = new M.Mesh(new M.TorusGeometry(0.065, 0.02, 8, 16), matGold);
    pad.rotation.x = Math.PI / 2;
    pad.position.set(px, hBase / 2 + 0.005 + elev, pZ);
    g.add(pad);
    const pin = new M.Mesh(new M.BoxGeometry(0.045, 0.92, 0.045), pMat);
    pin.position.set(px, -0.37 + elev, pZ);
    g.add(pin);
    const pinTop = new M.Mesh(new M.BoxGeometry(0.048, 0.095, 0.048), pTopMat);
    pinTop.position.set(px, hBase / 2 + 0.047 + elev, pZ);
    g.add(pinTop);
  }

  return setCastShadow(g);
}

// ── Sensor de Solo ──
function buildSoilSensor() {
  const g = new M.Group();

  const w = 1.4, h = 0.1;
  const elev = 0;
  const topY = -0.6;      // Topo (que na rotação vira Z=0.6)
  const rectBaseY = 4.0;  // Base reta
  const tipY = 4.8;       // Ponta fina

  const shape = new M.Shape();
  shape.moveTo(-w / 2, topY);
  shape.lineTo(-w / 2, 0.4);
  shape.quadraticCurveTo(-w / 2 + 0.2, 0.5, -w / 2, 0.6);
  shape.lineTo(-w / 2, rectBaseY);
  shape.lineTo(0, tipY);
  shape.lineTo(w / 2, rectBaseY);
  shape.lineTo(w / 2, 0.6);
  shape.quadraticCurveTo(w / 2 - 0.2, 0.5, w / 2, 0.4);
  shape.lineTo(w / 2, topY);
  shape.lineTo(-w / 2, topY);

  const extSet = { depth: h, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 2 };
  const pcbMat = mat(0x050505, { r: 0.6, m: 0.05 }); // Preto absoluto, muito fosco
  const pcb = new M.Mesh(new M.ExtrudeGeometry(shape, extSet), pcbMat);
  pcb.rotation.x = -Math.PI / 2;
  pcb.position.y = -h / 2 + elev;
  g.add(pcb);

  // ── Silkscreen "Capacitive Soil Moisture Sensor v1.2" (Corrigida) ──
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256; // ratio 4:1
  const ctx = canvas.getContext('2d');

  // Fundo OPACO igual à cor da placa, assim o renderizador do three.js não "esconde" a transparência
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#ffffff';
  // Fonte menor para ser mais proporcional ao layout v2.0
  ctx.font = 'bold 64px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // Adiciona espaçamento vertical ligeiramente menor entre as linhas
  ctx.fillText('Capacitive Soil', 512, 100);
  ctx.fillText('Moisture Sensor v2.0', 512, 180);

  const textTexture = new THREE.CanvasTexture(canvas);
  textTexture.needsUpdate = true;
  textTexture.anisotropy = 8;

  const textMat = new THREE.MeshBasicMaterial({
    map: textTexture,
    transparent: true,
    blending: THREE.AdditiveBlending, // Técnica infalível: soma o branco, ignora o preto
    depthWrite: false,
    polygonOffset: true, // Anti-flicker: Força a renderização um pouco à frente na tela
    polygonOffsetFactor: -4,
    polygonOffsetUnits: -4
  });

  const textPlane = new M.Mesh(new THREE.PlaneGeometry(3.6, 0.9), textMat);
  textPlane.rotation.x = -Math.PI / 2;
  // Girar -90 para o texto fluir do JST em direção à ponta
  textPlane.rotation.z = -Math.PI / 2;
  // Z position maior pra não colidir ou piscar na placa
  textPlane.position.set(0, h / 2 + 0.015 + elev, -2.0);
  g.add(textPlane);

  // ── Linha Divisória Branca (Marca o limiar seguro de inserção no solo) ──
  const divLineMat = mat(0xffffff);
  // Extensão que cobre quase toda a largura da placa
  const divLine = new M.Mesh(new THREE.BoxGeometry(w * 0.95, 0.005, 0.02), divLineMat);
  // Colocada exatemente após o fim dos "buracos" (recortes guia nas laterais da placa)
  divLine.position.set(0, h / 2 + 0.005 + elev, -0.68);
  g.add(divLine);

  const pinM = mat(0xc7c7c7, { m: 1, r: 0.2 });

  // ── Conector Realista Idêntico à Referência (Aberto com frestas, side-entry) ──
  const jstGrp = new M.Group();
  jstGrp.position.set(0, h / 2 + elev, 0.55); // Na borda virado pra fora

  const jstM = mat(0xf2f2f2, { r: 0.9 }); // Branco plástico

  // Base inferior (chão do conector)
  const jstBot = new M.Mesh(new M.BoxGeometry(0.8, 0.05, 0.35), jstM);
  jstBot.position.set(0, 0.025, 0);
  jstGrp.add(jstBot);

  // Parede traseira (fechando o fundo perto dos componentes)
  const jstBack = new M.Mesh(new M.BoxGeometry(0.8, 0.25, 0.05), jstM);
  jstBack.position.set(0, 0.125, -0.15); // Atrás
  jstGrp.add(jstBack);

  // Paredes laterais
  const jstL = new M.Mesh(new M.BoxGeometry(0.08, 0.25, 0.3), jstM);
  jstL.position.set(-0.36, 0.125, 0.025);
  jstGrp.add(jstL);

  const jstR = new M.Mesh(new M.BoxGeometry(0.08, 0.25, 0.3), jstM);
  jstR.position.set(0.36, 0.125, 0.025);
  jstGrp.add(jstR);

  // Parede superior fragmentada com precisão (Fendas/Recortes finos como a foto)
  const jstTopL = new M.Mesh(new M.BoxGeometry(0.23, 0.05, 0.3), jstM);
  jstTopL.position.set(-0.285, 0.225, 0);
  jstGrp.add(jstTopL);

  const jstTopM = new M.Mesh(new M.BoxGeometry(0.26, 0.05, 0.3), jstM);
  jstTopM.position.set(0, 0.225, 0);
  jstGrp.add(jstTopM);

  const jstTopR = new M.Mesh(new M.BoxGeometry(0.23, 0.05, 0.3), jstM);
  jstTopR.position.set(0.285, 0.225, 0);
  jstGrp.add(jstTopR);

  // Pinos internos prateados espetando na horizontal
  for (let i = 0; i < 3; i++) {
    const px = -0.2 + i * 0.2;
    // Pino espetado pra fora (+Z)
    const pin = new M.Mesh(new M.BoxGeometry(0.03, 0.03, 0.28), pinM);
    pin.position.set(px, 0.1, 0.0);
    jstGrp.add(pin);
    // Solda do pino mergulhando na base de plastico e na placa
    const solder = new M.Mesh(new M.BoxGeometry(0.05, 0.1, 0.05), pinM);
    solder.position.set(px, 0.05, -0.12);
    jstGrp.add(solder);
  }
  g.add(jstGrp);

  // Labels GND VCC AOUT em texto fino simulado (silkscreen)
  const lblMat = mat(0xeeeeee);
  for (let i = 0; i < 3; i++) {
    const lbl = new M.Mesh(new M.BoxGeometry(0.12, 0.005, 0.04), lblMat);
    lbl.position.set(-0.2 + i * 0.2, h / 2 + 0.002 + elev, 0.32);
    g.add(lbl);
  }

  // ── Componentes NE555 e SMDs ──
  const ic = new M.Mesh(new M.BoxGeometry(0.35, 0.06, 0.25), mat(0x111111, { r: 0.3 }));
  ic.position.set(-0.1, h / 2 + 0.03 + elev, 0.0);
  g.add(ic);

  for (let i = 0; i < 4; i++) {
    const p1 = new M.Mesh(new M.BoxGeometry(0.04, 0.02, 0.08), pinM);
    p1.position.set(-0.1 - 0.12 + i * 0.08, h / 2 + 0.01 + elev, -0.15);
    g.add(p1);
    const p2 = new M.Mesh(new M.BoxGeometry(0.04, 0.02, 0.08), pinM);
    p2.position.set(-0.1 - 0.12 + i * 0.08, h / 2 + 0.01 + elev, 0.15);
    g.add(p2);
  }

  const icDot = new M.Mesh(new M.CylinderGeometry(0.02, 0.02, 0.01, 8), mat(0x333333));
  icDot.position.set(-0.22, h / 2 + 0.06 + elev, -0.08);
  g.add(icDot);

  const smdBlack = mat(0x111111, { r: 0.5 });
  const smdBrown = mat(0xa8754b, { r: 0.4 });
  const smds_soil = [
    [-0.45, -0.15, smdBrown, 0.1, 0.06],
    [-0.45, -0.05, smdBrown, 0.1, 0.06],
    [-0.45, 0.05, smdBlack, 0.1, 0.06],
    [-0.45, 0.15, smdBrown, 0.1, 0.06],

    [0.15, -0.15, smdBlack, 0.1, 0.06],
    [0.3, -0.15, smdBrown, 0.06, 0.1],
    [0.3, 0.0, smdBrown, 0.06, 0.1],

    [0.0, 0.25, smdBlack, 0.06, 0.1],
    [0.15, 0.25, smdBlack, 0.06, 0.1],
    [0.3, 0.25, smdBlack, 0.06, 0.1],
  ];

  smds_soil.forEach(s => {
    const ms = new M.Mesh(new M.BoxGeometry(s[3], 0.04, s[4]), s[2]);
    ms.position.set(s[0], h / 2 + 0.02 + elev, s[1]);
    g.add(ms);
    const pad = new M.Mesh(new M.BoxGeometry(s[3] + 0.02, 0.01, s[4] + 0.02), pinM);
    pad.position.set(s[0], h / 2 + 0.005 + elev, s[1]);
    g.add(pad);
  });

  return setCastShadow(g);
}

// â”€â”€ ICS-43434 (Microfone MEMS) â”€â”€
function buildICS43434() {
  const g = new M.Group();

  const w = 1.6, d = 1.4;
  const hBase = 0.08;

  // PCB - Base preta fosca realista
  const pcbMat = mat(0x1a1b1d, { r: 0.6, m: 0.2 });
  const pcbGold = mat(0xd6a848, { m: 1.0, r: 0.15 });
  
  // --- Shape com Cantos Arredondados ---
  const sh = new M.Shape();
  const r = 0.2; // Raio da curva
  const hw = w / 2, hd = d / 2;
  
  // Traçado anti-horário
  sh.moveTo(hw - r, hd);          
  sh.lineTo(-hw + r, hd);         
  sh.absarc(-hw + r, hd - r, r, Math.PI/2, Math.PI, false); 
  sh.lineTo(-hw, -hd + r);        
  sh.absarc(-hw + r, -hd + r, r, Math.PI, -Math.PI/2, false); 
  sh.lineTo(hw - r, -hd);         
  sh.absarc(hw - r, -hd + r, r, -Math.PI/2, 0, false); 
  sh.lineTo(hw, hd - r);          
  sh.absarc(hw - r, hd - r, r, 0, Math.PI/2, false); 
  
  const elev = 0.5;

  const extrudeSet = { depth: hBase, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.02, bevelSegments: 3 };
  const pcb = new M.Mesh(new M.ExtrudeGeometry(sh, extrudeSet), [pcbMat, pcbGold]);
  pcb.rotation.x = -Math.PI / 2;
  pcb.position.y = -hBase / 2 + elev;
  g.add(pcb);

  // --- Silkscreen Canvas ---
  const cSilk = document.createElement('canvas');
  cSilk.width = 512; cSilk.height = 512;
  const ctx = cSilk.getContext('2d');
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, 512, 512);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 36px monospace';
  ctx.fillText('ICS-43434', 256, 95);  
  ctx.font = 'bold 24px monospace';
  ctx.fillText('I2S MIC', 256, 135);    
  ctx.font = 'bold 32px monospace';
  const labels = ["3V", "GND", "SCK", "SD", "WS", "L/R"];
  labels.forEach((lbl, i) => {
    const px_world = (i - 2.5) * 0.254; 
    const px_canvas = ((px_world + (w/2)) / w) * 512; 
    ctx.fillText(lbl, px_canvas, 360); 
  });
  const textTex = new M.CanvasTexture(cSilk);
  textTex.needsUpdate = true;
  textTex.anisotropy = 4;
  const silkMat = new M.MeshBasicMaterial({ 
    map: textTex, transparent: true, blending: M.AdditiveBlending, 
    depthTest: false, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4, 
    side: M.DoubleSide 
  });
  const silkPlane = new M.Mesh(new M.PlaneGeometry(w, d), silkMat);
  silkPlane.rotation.x = -Math.PI / 2;
  silkPlane.position.set(0, hBase / 2 + 0.012 + elev, 0); 
  silkPlane.renderOrder = 999;
  g.add(silkPlane);

  // --- Furos ---
  const holePos = [[-w/2 + 0.3, -d/2 + 0.3], [w/2 - 0.3, -d/2 + 0.3]];
  holePos.forEach(pos => {
    const hole = new M.Mesh(new M.CylinderGeometry(0.12, 0.12, hBase + 0.05, 16), mat(0x050505));
    hole.position.set(pos[0], elev, pos[1]);
    g.add(hole);
    const ring = new M.Mesh(new M.TorusGeometry(0.14, 0.035, 8, 20), pcbGold);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(pos[0], hBase / 2 + 0.005 + elev, pos[1]);
    g.add(ring);
  });

  // --- Pinos ---
  const numPins = 6;
  const pinMat = mat(0xb89a32, { r: 0.22, m: 0.92 });
  const pinTopMat = mat(0xd9bd58, { r: 0.18, m: 0.96 });
  const baseMat = mat(0x181818, { r: 0.82 });
  const basePitch = 0.254; 
  const padZ = d / 2 - 0.2;
  const stripW = numPins * basePitch + 0.05;
  const strip = new M.Mesh(new M.BoxGeometry(stripW, 0.16, 0.16), baseMat);
  strip.position.set(0, -0.08 + elev, padZ);
  g.add(strip);
  for (let i = 0; i < numPins; i++) {
    const padX = (i - 2.5) * basePitch;
    const pad = new M.Mesh(new M.TorusGeometry(0.065, 0.02, 8, 16), pcbGold);
    pad.rotation.x = Math.PI / 2;
    pad.position.set(padX, hBase / 2 + 0.005 + elev, padZ);
    g.add(pad);
    const pin = new M.Mesh(new M.BoxGeometry(0.045, 0.92, 0.045), pinMat);
    pin.position.set(padX, -0.37 + elev, padZ);
    g.add(pin);
    const pinTop = new M.Mesh(new M.BoxGeometry(0.048, 0.095, 0.048), pinTopMat);
    pinTop.position.set(padX, hBase / 2 + 0.047 + elev, padZ);
    g.add(pinTop);
  }

  // --- MEMS Capsule ---
  const micMat = mat(0xe8e8e8, { m: 1.0, r: 0.15 });
  const micW = 0.38, micD = 0.48, micH = 0.14;
  const mic = new M.Mesh(new M.BoxGeometry(micW, micH, micD), micMat);
  mic.position.set(0, hBase / 2 + micH/2 + elev, -0.05); 
  g.add(mic);
  const mHole = new M.Mesh(new M.CylinderGeometry(0.04, 0.04, micH + 0.01, 16), mat(0x050505));
  mHole.position.set(0, hBase / 2 + micH/2 + elev, 0.08); 
  g.add(mHole);

  // --- SMDs ---
  const smdBlack = mat(0x1a1a1a, { r: 0.4 });
  const smdBrown = mat(0x9c6239, { r: 0.4 });
  const pinCMat = mat(0xc7c7c7, { m: 1 }); 
  const smds = [
    [-0.35, 0.0, smdBrown, 0.08, 0.16], [-0.35, -0.2, smdBrown, 0.08, 0.16],
    [0.35, 0.0, smdBlack, 0.15, 0.08], [0.35, -0.2, smdBlack, 0.15, 0.08],
  ];
  smds.forEach(s => {
    const ms = new M.Mesh(new M.BoxGeometry(s[3], 0.04, s[4]), s[2]);
    ms.position.set(s[0], hBase / 2 + 0.02 + elev, s[1]);
    g.add(ms);
    const pW = (s[4] > s[3]) ? s[3] + 0.02 : s[3] + 0.04;
    const pD = (s[4] > s[3]) ? s[4] + 0.04 : s[4] + 0.02;
    const pad = new M.Mesh(new M.BoxGeometry(pW, 0.015, pD), pinCMat);
    pad.position.set(s[0], hBase / 2 + 0.007 + elev, s[1]);
    g.add(pad);
  });

  g.rotation.y = Math.PI; 
  return setCastShadow(g);
}

// Disponibilizar globalmente
window.buildBME690 = buildBME690;
window.buildSFA30 = buildSFA30;
window.buildLTR390 = buildLTR390;
window.buildAS3935 = buildAS3935;
window.buildSoilSensor = buildSoilSensor;
window.buildICS43434 = buildICS43434;





















