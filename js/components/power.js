// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// power.js â€” MÃ³dulos de energia
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

// â”€â”€ Buck DC-DC â”€â”€
function buildBuck() {
  const g = new M.Group();

  const w = 3.8, h = 0.1, d = 1.8; // Um pouco mais largo para acomodar tudo com folga

  // PCB azul
  const pcbMat = mat(0x184a8c, { r: 0.5, m: 0.2 });
  const pcb = new M.Mesh(new M.BoxGeometry(w, h, d), pcbMat);
  pcb.position.y = 0;
  g.add(pcb);

  // ------- FUNÇÃO DE TERMINAL BLOCK CUSTOMIZADA (Baseada no MAX485) -------
  function addCustomTerminalBlock(x, z, rotY) {
    const termGroup = new M.Group();
    termGroup.position.set(x, h/2 + 0.3, z);
    termGroup.rotation.y = rotY;

    // Plástico Azul do Borne
    const blueM = mat(0x1353a6, { m:0.1, r:0.8 });

    // Corpo principal (largo o suficiente para 2 pinos)
    const blockBody = new M.Mesh(new M.BoxGeometry(0.5, 0.6, 1.0), blueM);
    blockBody.position.set(0.1, 0, 0); 
    termGroup.add(blockBody);

    // Ranhuras traseiras do borne
    const grooveBack = new M.Mesh(new M.BoxGeometry(0.1, 0.45, 0.8), mat(0x0e3b6b));
    grooveBack.position.set(-0.15, -0.05, 0);
    termGroup.add(grooveBack);

    // Furos, parafusos e contatos (2 vias)
    for(let i=0; i<2; i++) {
      const sz = -0.25 + (i*0.5); 

      // Buraco escuro do parafuso no topo
      const screwHole = new M.Mesh(new M.CylinderGeometry(0.14, 0.14, 0.02, 16), mat(0x050505));
      screwHole.position.set(0.1, 0.31, sz); 

      // Cabeça do Parafuso prateada no topo
      const screwHead = new M.Mesh(new M.CylinderGeometry(0.12, 0.12, 0.03, 16), mat(0xcccccc, {m:0.8, r:0.3}));
      screwHead.position.set(0.1, 0.31, sz);

      // Fenda do parafuso
      const slit = new M.Mesh(new M.BoxGeometry(0.16, 0.04, 0.03), mat(0x111111));
      slit.position.set(0.1, 0.32, sz);

      // Buraco da entrada do fio na lateral da frente (+X local)
      const wireEntry = new M.Mesh(new M.BoxGeometry(0.04, 0.25, 0.28), mat(0x050505));
      wireEntry.position.set(0.35, -0.05, sz);

      // Metal de fixação lá dentro
      const wireContact = new M.Mesh(new M.BoxGeometry(0.06, 0.02, 0.22), mat(0xaaaaaa, {m:0.8, r:0.2}));
      wireContact.position.set(0.35, -0.12, sz);

      termGroup.add(screwHole, screwHead, slit, wireEntry, wireContact);
    }
    g.add(termGroup);
  }

  // --- Adicionando Terminal Blocks Reais ---
  // Input (Direita) - Vira os buracos de fio para fora (+X)
  addCustomTerminalBlock(w/2 - 0.25, d/2 - 0.5, 0);
  // Output (Esquerda) - Vira os buracos de fio para fora (-X)
  addCustomTerminalBlock(-w/2 + 0.25, d/2 - 0.5, Math.PI);


  // --- Conector P4 (Jack DC) - Topo Direita ---
  const dcMat = mat(0x111111, { r: 0.5 });
  const dcBase = new M.Mesh(new M.BoxGeometry(0.8, 0.45, 0.6), dcMat);
  dcBase.position.set(w/2 - 0.45, h/2 + 0.22, -d/2 + 0.35);
  g.add(dcBase);
  // Furo do P4
  const dcHole = new M.Mesh(new M.CylinderGeometry(0.16, 0.16, 0.82, 16), mat(0x333333, { m: 1 }));
  dcHole.rotation.z = Math.PI / 2;
  dcHole.position.set(w/2 - 0.45, h/2 + 0.22, -d/2 + 0.35);
  g.add(dcHole);
  // Pino prateado central do P4
  const dcPin = new M.Mesh(new M.CylinderGeometry(0.04, 0.04, 0.83, 12), mat(0xdddddd, { m: 1 }));
  dcPin.rotation.z = Math.PI / 2;
  dcPin.position.set(w/2 - 0.45, h/2 + 0.22, -d/2 + 0.35);
  g.add(dcPin);


  // --- Indutor Quadrado Grande (330) ---
  const indMat = mat(0xa8a8a8, { m: 0.6, r: 0.2 });
  const ind = new M.Mesh(new M.BoxGeometry(0.7, 0.5, 0.7), indMat);
  ind.position.set(-0.55, h/2 + 0.25, -0.2); // Movido para centro-esquerda trás
  g.add(ind);
  // Círculo sombreado em cima simulando ferrite
  const indCore = new M.Mesh(new M.CylinderGeometry(0.25, 0.25, 0.51, 16), mat(0x777777, { m: 0.5 }));
  indCore.position.set(-0.55, h/2 + 0.25, -0.2);
  g.add(indCore);
  // Texto 330
  const tMat = mat(0x1a1a1a);
  const t1 = new M.Mesh(new M.BoxGeometry(0.35, 0.01, 0.15), tMat);
  t1.position.set(-0.55, h/2 + 0.51, -0.2);
  g.add(t1);


  // --- Capacitores Eletrolíticos Prateados ---
  const capBodyMat = mat(0x888888, { m: 0.9, r: 0.2 });
  const capTopMat = mat(0xa8a8a8, { m: 0.8, r: 0.4 });
  const capPos = [
    [w/2 - 0.85, h/2 + 0.3, 0.1],   // Cap ENTRADA (Direita)
    [-1.0, h/2 + 0.3, d/2 - 0.4]   // Cap SAÍDA (Esquerda, perto do Borne)
  ];
  capPos.forEach(p => {
    // Cilindro do corpo
    const cap = new M.Mesh(new M.CylinderGeometry(0.26, 0.26, 0.6, 16), capBodyMat);
    cap.position.set(p[0], p[1], p[2]);
    g.add(cap);
    // Base preta SMD embaixo do capacitor
    const cBase = new M.Mesh(new M.BoxGeometry(0.6, 0.05, 0.6), mat(0x1a1a1a));
    cBase.position.set(p[0], h/2 + 0.02, p[2]);
    g.add(cBase);
    // Vinco prata no topo do capacitor (detalhe)
    const cTop = new M.Mesh(new M.CylinderGeometry(0.24, 0.24, 0.62, 16), capTopMat);
    cTop.position.set(p[0], p[1], p[2]);
    g.add(cTop);
  });


  // --- Conector USB Fêmea (Topo Esquerda) ---
  const usbMat = mat(0xdadada, { m: 1, r: 0.1 });
  const usbExt = new M.Mesh(new M.BoxGeometry(0.7, 0.35, 0.6), usbMat);
  usbExt.position.set(-w/2 + 0.15, h/2 + 0.17, -d/2 + 0.35);
  g.add(usbExt);
  // Borracha/plástico preto dentro da USB
  const usbIn = new M.Mesh(new M.BoxGeometry(0.71, 0.08, 0.5), mat(0x111111));
  usbIn.position.set(-w/2 + 0.15, h/2 + 0.1, -d/2 + 0.35);
  g.add(usbIn);


  // --- CIs / LM2596 (Centro Trás) e Transistores ---
  const icMat = mat(0x1a1a1a, { r: 0.3 });
  const pinMat = mat(0xc7c7c7, { m: 1 });

  // Regulador principal LM2596 (SOP-8) no Centro
  const icMain = new M.Mesh(new M.BoxGeometry(0.35, 0.08, 0.3), icMat);
  icMain.position.set(0.2, h/2 + 0.04, 0.4);
  g.add(icMain);
  for(let i=0; i<5; i++) {
    const p1 = new M.Mesh(new M.BoxGeometry(0.04, 0.02, 0.4), pinMat);
    p1.position.set(0.2 - 0.14 + i*0.07, h/2 + 0.01, 0.4);
    g.add(p1);
  }

  // Dois Diodos SS34 / DPAK (Espalhados)
  const pwrIC1 = new M.Mesh(new M.BoxGeometry(0.4, 0.1, 0.25), icMat);
  pwrIC1.position.set(0.25, h/2 + 0.05, -0.4);
  g.add(pwrIC1);
  
  const pwrIC2 = new M.Mesh(new M.BoxGeometry(0.4, 0.1, 0.25), icMat);
  pwrIC2.rotation.y = Math.PI / 2;
  pwrIC2.position.set(-0.35, h/2 + 0.05, 0.6);
  g.add(pwrIC2);


  // --- Trimpot Trimpot Azul (Regulador de Voltagem no topo da placa) ---
  const trimBase = new M.Mesh(new M.BoxGeometry(0.3, 0.3, 0.15), mat(0x0a41a3));
  trimBase.position.set(0.8, h/2 + 0.15, -0.1);
  g.add(trimBase);
  const trimScrew = new M.Mesh(new M.CylinderGeometry(0.08, 0.08, 0.18, 12), mat(0xc5a059, {m: 0.8}));
  trimScrew.rotation.x = Math.PI / 2;
  trimScrew.position.set(0.8, h/2 + 0.15, -0.1);
  g.add(trimScrew);


  // --- Resistores / Capacitores SMD ---
  const smdBlack = mat(0x111111, { r: 0.5 });
  const smdBrown = mat(0xa8754b, { r: 0.4 });
  const smds = [
    [0.9, 0.2, smdBrown, 0.1, 0.12], 
    [1.0, 0.2, smdBlack, 0.1, 0.12], 
    [0.7, 0.6, smdBrown, 0.1, 0.12],
    [0.55, 0.6, smdBlack, 0.1, 0.12],
    [-0.1, -0.1, smdBrown, 0.1, 0.12], 
    [-0.1, 0.1, smdBlack, 0.1, 0.12],   
  ];
  smds.forEach(s => {
    const ms = new M.Mesh(new M.BoxGeometry(s[3], 0.04, s[4]), s[2]);
    ms.position.set(s[0], h/2 + 0.02, s[1]);
    g.add(ms);
    const pad = new M.Mesh(new M.BoxGeometry(s[3]+0.02, 0.015, s[4]+0.04), pinMat);
    pad.position.set(s[0], h/2 + 0.007, s[1]);
    g.add(pad);
  });

  return setCastShadow(g);
}

// â”€â”€ Bateria 12V SLA â”€â”€
function buildBattery() {
  const g = new M.Group();

  const w = 4.2;
  const d = 1.8;
  const hBase = 1.7;
  const hLid = 0.5;
  const totalH = hBase + hLid;

  const plasticMat = mat(0x131313, { r: 0.6, m: 0.1 }); 
  const topCoverMat = mat(0x0a0a0a, { r: 0.2, m: 0.9 }); // Shiny pitch black pra tampa superior
  
  // Base Principal
  const base = new M.Mesh(new M.BoxGeometry(w, hBase, d), plasticMat);
  base.position.y = hBase / 2;
  g.add(base);

  // Fenda que divide a base da tampa
  const seam = new M.Mesh(new M.BoxGeometry(w * 0.99, 0.04, d * 0.99), mat(0x020202));
  seam.position.y = hBase;
  g.add(seam);

  // Tampa (Lid)
  const lid = new M.Mesh(new M.BoxGeometry(w, hLid, d), plasticMat);
  lid.position.y = hBase + hLid / 2;
  g.add(lid);

  // Cobertura Retangular Elevada (Válvulas) 
  const coverW = w - 0.8;
  const cover = new M.Mesh(new M.BoxGeometry(coverW, 0.04, d - 0.15), topCoverMat);
  cover.position.set((w - coverW)/2, totalH + 0.02, 0);
  g.add(cover);

  // Marcações base dos terminais
  const posColor = mat(0xdd2222, { r: 0.5 });
  const negColor = mat(0x060606, { r: 0.5 });

  const posBlock = new M.Mesh(new M.BoxGeometry(0.35, 0.02, 0.45), posColor);
  posBlock.position.set(-w/2 + 0.35, totalH + 0.01, d/2 - 0.4);
  g.add(posBlock);

  const negBlock = new M.Mesh(new M.BoxGeometry(0.35, 0.02, 0.45), negColor);
  negBlock.position.set(-w/2 + 0.35, totalH + 0.01, -d/2 + 0.4);
  g.add(negBlock);

  // Terminais Faston (L e chapa dobrada)
  const silverMat = mat(0xdddddd, { m: 0.9, r: 0.1 });
  
  function addBlade(x, z) {
    const tG = new M.Group();
    tG.position.set(x, totalH, z);
    
    // Base de solda/plastico embutida
    const bp = new M.Mesh(new M.BoxGeometry(0.15, 0.1, 0.15), mat(0x222222));
    bp.position.y = 0.05;
    tG.add(bp);

    // Haste vertical metálica
    const stem = new M.Mesh(new M.BoxGeometry(0.03, 0.35, 0.14), silverMat);
    stem.position.set(0, 0.22, 0);
    tG.add(stem);

    // Lâmina horizontal metálica (levemente angulada pra baixo/reto)
    const blade = new M.Mesh(new M.BoxGeometry(0.4, 0.02, 0.14), silverMat);
    blade.position.set(0.18, 0.385, 0); // Vira em direção ao centro da bateria (+X)
    tG.add(blade);

    // Furo do Faston
    const hole = new M.Mesh(new M.CylinderGeometry(0.04, 0.04, 0.04, 8), mat(0x050505));
    hole.position.set(0.28, 0.385, 0);
    tG.add(hole);

    g.add(tG);
  }

  addBlade(-w/2 + 0.35, d/2 - 0.4);  // +
  addBlade(-w/2 + 0.35, -d/2 + 0.4); // - 

  // --- Decalque Frontal Minimalista e Elegante ---
  const whiteMat = mat(0xeeeeee);
  const grayMat = mat(0x555555);
  const accentMat = mat(0x0c5aa9); // Azul corporativo
  const frontZ = d/2 + 0.01; // Mais saltado para garantir zero z-fighting

  // Linha de detalhe superior grossa azul (Dando a volta em toda a bateria)
  const stripe = new M.Mesh(new M.BoxGeometry(w + 0.02, 0.1, d + 0.02), accentMat);
  stripe.position.set(0, 1.25, 0);
  g.add(stripe);

  // Logo moderno redondo (Usando Torus pra ser um anel real vazado)
  const logoRing = new M.Mesh(new M.TorusGeometry(0.22, 0.025, 8, 32), whiteMat);
  logoRing.position.set(-1.0, 0.85, frontZ);
  g.add(logoRing);
  
  // Símbolo de raio no centro (Shape poligonal autêntico de raio)
  const boltShape = new M.Shape();
  // Traçando o raio (começa na ponta superior)
  boltShape.moveTo(0.04, 0.14);    // Ponta superior direita
  boltShape.lineTo(-0.06, 0.0);    // Raio desce pra esquerda
  boltShape.lineTo(0.01, 0.0);     // Corte horizontal pra direita
  boltShape.lineTo(-0.04, -0.14);  // Desce até a ponta afiada inferior
  boltShape.lineTo(0.06, 0.01);    // Sobe pra direita
  boltShape.lineTo(-0.01, 0.01);   // Corte interno pra esquerda
  boltShape.lineTo(0.04, 0.14);    // Retorna à ponta superior
  
  const boltGeo = new M.ExtrudeGeometry(boltShape, { 
    depth: 0.02, 
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.005,
    bevelSegments: 2
  });
  
  const boltMesh = new M.Mesh(boltGeo, whiteMat);
  // Posicionado no centro do anel, ajustando o Z para acompanhar a profundidade do Torus
  boltMesh.position.set(-1.0, 0.85, frontZ - 0.01);
  g.add(boltMesh);

  // Bloco limpo simulando o Título (único e polido)
  const titleTxt = new M.Mesh(new M.BoxGeometry(1.4, 0.15, 0.015), whiteMat);
  titleTxt.position.set(0.1, 0.9, frontZ);
  g.add(titleTxt);

  // Bloco simulando uma sub-linha fina elegante
  const subTxt = new M.Mesh(new M.BoxGeometry(0.9, 0.06, 0.015), grayMat);
  subTxt.position.set(-0.15, 0.75, frontZ);
  g.add(subTxt);

  return setCastShadow(g);
}

// â”€â”€ Painel Solar 20W â”€â”€
function buildSolarPanel() {
  const g = new M.Group();

  // Quadro de alumÃ­nio principal (Base)
  const frameGEO = new M.BoxGeometry(7.8, 0.15, 5.4);
  const frameMAT = mat(0xd0d2d5, { m: 0.8, r: 0.2, cc: 0.3 });
  const frame = new M.Mesh(frameGEO, frameMAT);
  // Y center = 0, Top = 0.075
  g.add(frame);

  // Fundo branco do painel (Backsheet) ON TOP of frame
  const back = new M.Mesh(new M.BoxGeometry(7.4, 0.02, 5.0), mat(0xeeeeee, { r: 0.8 }));
  back.position.y = 0.085; // Top = 0.095
  g.add(back);

  // CÃ©lulas Solares (Grid 4x6)
  const cellGEO = new M.BoxGeometry(1.15, 0.015, 1.15);
  const cellMAT = mat(0x080f26, { m: 0.1, r: 0.1, cc: 0.9 }); // Azul escuro brilhante
  
  // Barramentos prateados (Busbars)
  const busGEO = new M.BoxGeometry(1.15, 0.005, 0.02);
  const busMAT = mat(0xe0e0e5, { m: 0.9, r: 0.2 });

  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 6; c++) {
      const cx = -3.125 + c * 1.25;
      const cz = -1.875 + r * 1.25;

      const cell = new M.Mesh(cellGEO, cellMAT);
      cell.position.set(cx, 0.105, cz); // Top = 0.1125
      g.add(cell);

      // 4 busbars por cÃ©lula
      for (let i = 0; i < 4; i++) {
        const bus = new M.Mesh(busGEO, busMAT);
        const bz = cz - 0.45 + i * 0.3;
        bus.position.set(cx, 0.115, bz);
        g.add(bus);
      }
      
      // Conector vertical entre as cÃ©lulas (Tabs)
      if (c < 5) {
         const tabGeo = new M.BoxGeometry(0.12, 0.004, 0.04);
         for(let i=0; i < 4; i++) {
            const tab = new M.Mesh(tabGeo, busMAT);
            const bz = cz - 0.45 + i * 0.3;
            tab.position.set(cx + 0.625, 0.115, bz);
            g.add(tab);
         }
      }
    }
  }

  // Vidro temperado frontal (Envolvendo as cÃ©lulas)
  const glass = new M.Mesh(
    new M.BoxGeometry(7.4, 0.04, 5.0),
    mat(0x95bad6, { m: 0.05, r: 0.05, cc: 1.0, o: 0.15 })
  );
  glass.position.y = 0.11; // Top = 0.13, Bottom = 0.09 (Fica acima do backsheet e cobre cÃ©lulas)
  g.add(glass);

  // Caixa de junÃ§Ã£o (Junction Box) abaixo do painel
  const jb = new M.Mesh(new M.BoxGeometry(0.8, 0.3, 0.6), mat(0x1a1a1a, { r: 0.6 }));
  jb.position.set(0, -0.2, -2.1);
  g.add(jb);

  // Hastes de fixaÃ§Ã£o e suporte
  const railMat = mat(0x5a6068, { m: 0.7, r: 0.3 });
  
  const railLeft = new M.Mesh(new M.BoxGeometry(0.25, 1.8, 0.25), railMat);
  railLeft.position.set(-3.0, -0.9, 1.8);
  g.add(railLeft);

  const railRight = railLeft.clone();
  railRight.position.x = 3.0;
  g.add(railRight);

  const brace = new M.Mesh(new M.BoxGeometry(6.25, 0.15, 0.15), railMat);
  brace.position.set(0, -1.4, 1.85);
  g.add(brace);

  g.rotation.x = -PI / 16;
  return setCastShadow(g);
}

// â”€â”€ MPPT â”€â”€
function buildMPPT() {
  const g = new M.Group();
  
  const w = 3.6;
  const d = 1.6;
  const hBase = 0.08;
  const pcbMat = mat(0x1a4b8c, { r: 0.4, m: 0.2 }); // Blue PCB
  
  // Placa
  const sh = new M.Shape();
  const r = 0.1;
  sh.moveTo(-w/2 + r, -d/2);
  sh.lineTo(w/2 - r, -d/2);
  sh.quadraticCurveTo(w/2, -d/2, w/2, -d/2 + r);
  sh.lineTo(w/2, d/2 - r);
  sh.quadraticCurveTo(w/2, d/2, w/2 - r, d/2);
  sh.lineTo(-w/2 + r, d/2);
  sh.quadraticCurveTo(-w/2, d/2, -w/2, d/2 - r);
  sh.lineTo(-w/2, -d/2 + r);
  sh.quadraticCurveTo(-w/2, -d/2, -w/2 + r, -d/2);

  const pcb = new M.Mesh(new M.ExtrudeGeometry(sh, {
     depth: hBase,
     bevelEnabled: true,
     bevelThickness: 0.015,
     bevelSize: 0.015,
     bevelSegments: 2
  }), pcbMat);
  pcb.rotation.x = -Math.PI / 2;
  pcb.position.y = -hBase / 2;
  g.add(pcb);

  const whiteMat = mat(0xeeeeee);
  const silverMat = mat(0xdddddd, { m: 0.8, r: 0.2 });
  const blackMat = mat(0x111111, { r: 0.4 });
  const pinMat = mat(0xcccccc, { m: 1 });
  
  // Terminal Branco (JST-XH 2 pinos realistas e ocos)
  function addJST(x, z, rotY) {
    const jg = new M.Group();
    jg.position.set(x, hBase/2, z);
    jg.rotation.y = rotY;

    // Shroud principal (caixa envolvente vazada na frente)
    // +X é a frente aberta
    const back = new M.Mesh(new M.BoxGeometry(0.1, 0.4, 0.45), whiteMat);
    back.position.set(-0.125, 0.2, 0);
    jg.add(back);

    const top = new M.Mesh(new M.BoxGeometry(0.25, 0.05, 0.45), whiteMat);
    top.position.set(0.05, 0.375, 0);
    jg.add(top);

    const bot = new M.Mesh(new M.BoxGeometry(0.25, 0.05, 0.45), whiteMat);
    bot.position.set(0.05, 0.025, 0);
    jg.add(bot);

    const side1 = new M.Mesh(new M.BoxGeometry(0.25, 0.3, 0.05), whiteMat);
    side1.position.set(0.05, 0.2, -0.2);
    jg.add(side1);

    const side2 = new M.Mesh(new M.BoxGeometry(0.25, 0.3, 0.05), whiteMat);
    side2.position.set(0.05, 0.2, 0.2);
    jg.add(side2);

    // Trilhos de encaixe superioes
    const slot1 = new M.Mesh(new M.BoxGeometry(0.15, 0.06, 0.02), whiteMat);
    slot1.position.set(0.1, 0.4, -0.1);
    jg.add(slot1);
    const slot2 = new M.Mesh(new M.BoxGeometry(0.15, 0.06, 0.02), whiteMat);
    slot2.position.set(0.1, 0.4, 0.1);
    jg.add(slot2);

    // Pinos internos prateados
    for(let i of [-1, 1]) {
      const pinH = new M.Mesh(new M.BoxGeometry(0.25, 0.04, 0.04), silverMat);
      pinH.position.set(0.05, 0.15, i * 0.1);
      jg.add(pinH);
      
      const pinV = new M.Mesh(new M.BoxGeometry(0.04, 0.15, 0.04), silverMat);
      pinV.position.set(-0.1, 0.075, i * 0.1);
      jg.add(pinV);
    }

    g.add(jg);
  }

  addJST(-w/2 + 0.175, -d/2 + 0.35, Math.PI); // Top-Left
  addJST(-w/2 + 0.175,  d/2 - 0.35, Math.PI); // Bot-Left
  addJST( w/2 - 0.175, -d/2 + 0.35, 0); // Top-Right
  addJST( w/2 - 0.175,  d/2 - 0.35, 0); // Bot-Right

  // Capacitor de Aluminio VT 47 50V
  const capG = new M.Group();
  capG.position.set(-w/2 + 0.8, hBase/2, -0.1);
  
  const capBase = new M.Mesh(new M.BoxGeometry(0.52, 0.05, 0.52), blackMat);
  capBase.position.y = 0.025;
  capG.add(capBase);
  
  const capCyl = new M.Mesh(new M.CylinderGeometry(0.24, 0.24, 0.6, 24), mat(0xa0a0a0, { m: 0.9, r: 0.1 }));
  capCyl.position.y = 0.35;
  capG.add(capCyl);
  
  const capTop = new M.Mesh(new M.CylinderGeometry(0.235, 0.235, 0.02, 24), mat(0xd0d0d0, { m: 0.8 }));
  capTop.position.y = 0.65;
  capG.add(capTop);
  
  const capMark = new M.Mesh(new M.BoxGeometry(0.46, 0.025, 0.22), blackMat);
  capMark.position.set(0, 0.65, -0.11);
  capG.add(capMark);
  g.add(capG);

  // IC Principal - CN3791
  const ic = new M.Mesh(new M.BoxGeometry(0.45, 0.06, 0.45), blackMat);
  ic.position.set(-0.15, hBase/2 + 0.03, -0.1);
  g.add(ic);
  const p1 = new M.Mesh(new M.BoxGeometry(0.55, 0.02, 0.35), pinMat);
  p1.position.set(-0.15, hBase/2 + 0.01, -0.1);
  g.add(p1);
  const p2 = new M.Mesh(new M.BoxGeometry(0.35, 0.02, 0.55), pinMat);
  p2.position.set(-0.15, hBase/2 + 0.01, -0.1);
  g.add(p2);

  // Indutor 100 Cinza Grande
  const inductor = new M.Mesh(new M.BoxGeometry(0.5, 0.35, 0.5), mat(0x7a7a7a, { r: 0.8 }));
  inductor.position.set(0.55, hBase/2 + 0.175, -0.2);
  g.add(inductor);

  // Diodo SS54
  const diode = new M.Mesh(new M.BoxGeometry(0.3, 0.1, 0.2), blackMat);
  diode.position.set(0.55, hBase/2 + 0.05, -0.6);
  g.add(diode);

  // R050 Resistor Preto
  const r050 = new M.Mesh(new M.BoxGeometry(0.35, 0.06, 0.2), mat(0x111111));
  r050.position.set(1.0, hBase/2 + 0.03, 0.05);
  g.add(r050);

  // Capacitor Tântalo 106E
  const tanCap = new M.Mesh(new M.BoxGeometry(0.25, 0.12, 0.15), mat(0xdca140, { m:0.2, r:0.6 }));
  tanCap.position.set(1.15, hBase/2 + 0.06, 0.35);
  g.add(tanCap);

  // SMDs Adicionais
  const smds = [
    [-w/2 + 1.25,  0.4], [-w/2 + 1.1,  0.4],
    [-0.3, 0.45], [0.0, 0.4], [0.25,  0.45], [0.45,  0.45],
    [0.65, 0.3], [0.55, 0.35]
  ];
  smds.forEach(p => {
    const s = new M.Mesh(new M.BoxGeometry(0.08, 0.04, 0.05), mat(0x444444));
    s.position.set(p[0], hBase/2 + 0.02, p[1]);
    g.add(s);
  });

  // Textos Silkscreen
  function addSilk(wText, dText, x, z) {
    const t = new M.Mesh(new M.BoxGeometry(wText, 0.01, dText), whiteMat);
    t.position.set(x, hBase/2 + 0.005, z);
    g.add(t);
  }
  
  addSilk(0.5, 0.1, -w/2 + 1.0, d/2 - 0.2); // SOLAR IN
  addSilk(0.4, 0.1, w/2 - 0.8, -d/2 + 0.4); // BAT OUT
  addSilk(0.2, 0.15, -0.15, 0.2); // IC Silk
  addSilk(0.3, 0.1, 1.0, -0.2); // R050 Silk

  // --- Pinos Inferiores (4 pinos de Header) ---
  const numPins = 4;
  const pinZ = d/2 - 0.15;
  const hPinMat = mat(0xb89a32, { r: 0.22, m: 0.92 });
  const hPinTopMat = mat(0xd9bd58, { r: 0.18, m: 0.96 });
  const hBaseMat = mat(0x181818, { r: 0.82 });
  const pinLen = 0.92;

  const stripW = numPins * 0.254 + 0.05;
  const strip = new M.Mesh(new M.BoxGeometry(stripW, 0.16, 0.16), hBaseMat);
  strip.position.set(0.4, -0.08, pinZ); 
  g.add(strip);
  
  for (let i = 0; i < numPins; i++) {
    const px = 0.4 + (i - (numPins - 1)/2) * 0.254; 
    
    // Anel de solda na placa superior
    const pad = new M.Mesh(new M.CylinderGeometry(0.07, 0.07, hBase+0.02, 12), mat(0xcca633, {m: 0.9}));
    pad.position.set(px, hBase/2, pinZ);
    g.add(pad);

    // Barra de contato do pino para baixo
    const pin = new M.Mesh(new M.BoxGeometry(0.045, pinLen, 0.045), hPinMat);
    pin.position.set(px, -0.37, pinZ);
    g.add(pin);

    // Elevação de solda no topo do pino
    const pinTop = new M.Mesh(new M.BoxGeometry(0.048, 0.095, 0.048), hPinTopMat);
    pinTop.position.set(px, hBase + 0.047, pinZ);
    g.add(pinTop);
  }

  g.position.y = 0.5; // Levanta o MPPT para acomodar os pinos

  return setCastShadow(g);
}

window.buildBuck = buildBuck;
window.buildBattery = buildBattery;
window.buildSolarPanel = buildSolarPanel;
window.buildMPPT = buildMPPT;








