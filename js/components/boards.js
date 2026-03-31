// ══════════════════════════════════════════════════
// boards.js — MAX485 Transceiver + ESP32-P4
// ══════════════════════════════════════════════════

// ── MAX485 ──
function buildMAX485() {
  const g = new M.Group();

  // PCB Azul retangular (bordas retas, limpas)
  const board = new M.Mesh(
    new M.BoxGeometry(4.2, 0.1, 1.6), 
    mat(0x4b66e8, { m: 0.1, r: 0.8 }) // Azul bem característico
  );
  board.position.y = 0.05;
  g.add(board);

  // --- PINOS E HEADERS (Estilo Heltec) ---
  const pinBlockM = mat(0x202124, { r: 0.82 });
  const pinMat = mat(0xb89a32, { r: 0.22, m: 0.92 });
  const pinTopMat = mat(0xd9bd58, { r: 0.18, m: 0.96 });

  // Header Esquerdo (Plástico preto em baixo da placa)
  const leftBlock = new M.Mesh(new M.BoxGeometry(0.2, 0.16, 1.2), pinBlockM);
  leftBlock.position.set(-1.85, -0.03, 0); 
  g.add(leftBlock);

  // Header Direito (Plástico preto em baixo da placa)
  const rightBlock = new M.Mesh(new M.BoxGeometry(0.2, 0.16, 1.2), pinBlockM);
  rightBlock.position.set(1.85, -0.03, 0);
  g.add(rightBlock);

  for(let i=0; i<4; i++){
    const z = -0.45 + (i * 0.3);
    
    // Pinos esquerdos verticais (para baixo)
    const pinL = new M.Mesh(new M.BoxGeometry(0.045, 0.8, 0.045), pinMat);
    pinL.position.set(-1.85, -0.4, z);
    const topL = new M.Mesh(new M.BoxGeometry(0.048, 0.1, 0.048), pinTopMat);
    topL.position.set(-1.85, 0.15, z); // Pontinha da solda em cima da placa
    
    // Pinos direitos verticais (para baixo)
    const pinR = new M.Mesh(new M.BoxGeometry(0.045, 0.8, 0.045), pinMat);
    pinR.position.set(1.85, -0.4, z);
    const topR = new M.Mesh(new M.BoxGeometry(0.048, 0.1, 0.048), pinTopMat);
    topR.position.set(1.85, 0.15, z);
    
    g.add(pinL); g.add(topL);
    g.add(pinR); g.add(topR);
  }

  // --- COMPONENTES SMD ---
  const smdBlackM = mat(0x1a1a1a, { r: 0.6 });
  const smdOrangeM = mat(0xcc7722, { r: 0.4 });
  
  // 4 Resistores pretos à esquerda
  for(let i=0; i<4; i++){
    const smd = new M.Mesh(new M.BoxGeometry(0.25, 0.1, 0.16), smdBlackM);
    smd.position.set(-1.3, 0.15, -0.45 + (i*0.3));
    g.add(smd);
  }

  // Chip central (MAX485) - SOP8 com perninhas
  const chipM = mat(0x222222, {m: 0.1, r: 0.7});
  const chipBody = new M.Mesh(new M.BoxGeometry(0.65, 0.15, 0.8), chipM);
  chipBody.position.set(-0.4, 0.2, -0.1);
  g.add(chipBody);
  
  const legM = mat(0xdddddd, {m: 0.8, r: 0.2});
  for(let i=0; i<4; i++){
    const z = -0.4 + (i * 0.2); // Centralizado perfeitamente com os 0.8 de Y do chip
    // Pernas da esquerda (Left)
    const legL = new M.Mesh(new M.BoxGeometry(0.15, 0.04, 0.06), legM);
    legL.position.set(-0.75, 0.12, z);
    legL.rotation.z = Math.PI / 6;
    g.add(legL);
    
    // Pernas da direita (Right)
    const legR = new M.Mesh(new M.BoxGeometry(0.15, 0.04, 0.06), legM);
    legR.position.set(-0.05, 0.12, z);
    legR.rotation.z = -Math.PI / 6;
    g.add(legR);
  }

  // Capacitor Laranja 1 (Embaixo do chip)
  const cap1 = new M.Mesh(new M.BoxGeometry(0.4, 0.12, 0.2), smdOrangeM);
  cap1.position.set(-0.4, 0.16, 0.5);
  g.add(cap1);

  // Capacitor Laranja 2 (Direita Cima do chip)
  const cap2 = new M.Mesh(new M.BoxGeometry(0.4, 0.12, 0.2), smdOrangeM);
  cap2.position.set(0.4, 0.16, -0.3);
  g.add(cap2);

  // 3 Resistores pretos empilhados
  for(let i=0; i<3; i++){
    const smd = new M.Mesh(new M.BoxGeometry(0.35, 0.1, 0.15), smdBlackM);
    smd.position.set(0.4, 0.15, 0.05 + (i*0.25));
    g.add(smd);
  }

  // --- TERMINAL BLOCK VERDE (DG306) ---
  const termGroup = new M.Group();
  termGroup.position.set(1.1, 0.1, 0.0); // Centralizado no Z da placa

  const greenM = mat(0x136b28, { m:0.05, r:0.8 }); 
  
  // Corpo principal do terminal (agora mais estreito na profundidade/X)
  const blockBody = new M.Mesh(new M.BoxGeometry(0.6, 0.8, 1.2), greenM);
  blockBody.position.set(0.15, 0.4, 0); // Compensado em X para a frente não arredar
  termGroup.add(blockBody);

  // Ranhuras traseiras (opcional)
  const grooveBack = new M.Mesh(new M.BoxGeometry(0.1, 0.6, 0.9), mat(0x0a4a19));
  grooveBack.position.set(-0.15, 0.4, 0);
  termGroup.add(grooveBack);

  // Detalhes dos Furos e Parafusos
  for(let i=0; i<2; i++){
    const z = -0.3 + (i*0.6); // Alinhado ao longo do eixo Z
    
    // --- Parafusos no TOPO ---
    // Recuo do Parafuso redondo no topo
    const screwHole = new M.Mesh(new M.CylinderGeometry(0.16, 0.16, 0.02, 16), mat(0x050505));
    screwHole.position.set(0.15, 0.81, z); // Centralizado no novo X (0.15)
    
    // Cabeça do Parafuso prata no topo
    const screwHead = new M.Mesh(new M.CylinderGeometry(0.13, 0.13, 0.03, 16), mat(0xcccccc, {m:0.8, r:0.3}));
    screwHead.position.set(0.15, 0.81, z);

    // Fenda Phillips no topo
    const slit1 = new M.Mesh(new M.BoxGeometry(0.18, 0.04, 0.02), mat(0x111111));
    slit1.position.set(0.15, 0.82, z);
    const slit2 = new M.Mesh(new M.BoxGeometry(0.02, 0.04, 0.18), mat(0x111111));
    slit2.position.set(0.15, 0.82, z);

    // --- Entradas do Fio na FRENTE (+X) ---
    // Entrada do Fio (Quadrada, na face lateral)
    const wireEntry = new M.Mesh(new M.BoxGeometry(0.04, 0.35, 0.32), mat(0x050505));
    wireEntry.position.set(0.45, 0.35, z);

    // Contato interior prateado dentro da entrada do fio
    const wireContact = new M.Mesh(new M.BoxGeometry(0.06, 0.02, 0.25), mat(0xaaaaaa, {m:0.8, r:0.2}));
    wireContact.position.set(0.45, 0.25, z);

    termGroup.add(screwHole);
    termGroup.add(screwHead);
    termGroup.add(slit1);
    termGroup.add(slit2);
    termGroup.add(wireEntry);
    termGroup.add(wireContact);
  }

  g.add(termGroup);

  return setCastShadow(g);
}

// ── ESP32-P4 Waveshare 7" ──

function buildESP32P4() {
  const g = new M.Group();

    // Corpo preto (caixa do tablet) - Escala aproximada de 7 polegadas
    const bodyMat = mat(0x0a0a0a, { r: 0.35, m: 0.05 });
      
    const sh = new M.Shape();
    const bw = 16.5 / 2;
    const bd = 10.0 / 2;
    const br = 0.4; // Raio das bordas arredondadas do tablet
      
    sh.moveTo(bw - br, bd);
    sh.quadraticCurveTo(bw, bd, bw, bd - br);
    sh.lineTo(bw, -bd + br);
    sh.quadraticCurveTo(bw, -bd, bw - br, -bd);
    sh.lineTo(-bw + br, -bd);
    sh.quadraticCurveTo(-bw, -bd, -bw, -bd + br);
    sh.lineTo(-bw, bd - br);
    sh.quadraticCurveTo(-bw, bd, -bw + br, bd);
    sh.lineTo(bw - br, bd);

    const extSet = { depth: 0.8, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 3 };
    const body = new M.Mesh(new M.ExtrudeGeometry(sh, extSet), bodyMat);
    body.rotation.x = -Math.PI / 2;
    body.position.y = 0;
    g.add(body);

    // Tela LCD com Dashboard interativo
    const screenTex = Dashboard.init();
    const screenMaterial = new M.MeshBasicMaterial({ map: screenTex });
    const screen = new M.Mesh(new M.PlaneGeometry(14.5, 8.2), screenMaterial);
    screen.rotation.x = -Math.PI / 2;
    screen.position.set(0, 0.865, 0);
    screen.userData.isDashboard = true;
    g.add(screen);
    Dashboard.setScreenMesh(screen);

    // Vidro touch
    const touchGlass = new M.Mesh(
      new M.BoxGeometry(14.7, 0.012, 8.4),
      mat(0xaaddff, { m: 0.06, r: 0.02, cc: 1, o: 0.08 })
    );
    touchGlass.position.set(0, 0.88, 0);
    touchGlass.userData.isDashboard = true;
    g.add(touchGlass);

    // Adiciona botão "Home" lateral / detalhezinho para dar robustez
    const btn = new M.Mesh(new M.BoxGeometry(0.8, 0.2, 0.4), mat(0x333333));
    btn.position.set(0, 0.4, 5.05);
    g.add(btn);

    return setCastShadow(g);
  }

function updateESP32Screen() {
  Dashboard.update();
}

window.buildMAX485 = buildMAX485;
window.buildESP32P4 = buildESP32P4;
window.updateESP32Screen = updateESP32Screen;
