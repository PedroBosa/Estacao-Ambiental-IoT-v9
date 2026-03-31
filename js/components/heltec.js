// ══════════════════════════════════════════════════
// heltec.js — Heltec LoRa32 V3
// ══════════════════════════════════════════════════

function buildHeltec(isBase) {
  const g = new M.Group();
  const w = 5.8, d = 2.6, h = 0.15, cx = 0.4;

  // Variáveis para controlar a ponta direita ("triângulo sem ponta")
  const rectEndX = w / 2 - 0.4;       // Onde termina a parte 100% retangular
  const tipEndX = w / 2;              // Onde termina a ponta (mantém o comprimento original)
  const triangleBaseWidth = 1.8;      // <-- LARGURA DA BASE DO TRIÂNGULO (diminua para ele começar mais para o "meio")
  const tipWidth = 0.8;               // <-- LARGURA DA PONTA

  // ── Placa Base (Branca, bordas chanfradas) ──
  const shape = new M.Shape();
  shape.moveTo(-w / 2, -d / 2 + cx);
  shape.lineTo(-w / 2 + cx, -d / 2);
  
  // Linha superior
  shape.lineTo(rectEndX, -d / 2);                             // Vai até o fim do retângulo
  shape.lineTo(rectEndX, -triangleBaseWidth / 2);             // Desce formando um "degrau" (para não começar na borda)
  shape.lineTo(tipEndX, -tipWidth / 2);                       // Diagonal até a ponta
  
  // Ponta Frontal
  shape.lineTo(tipEndX, tipWidth / 2);
  
  // Linha Inferior
  shape.lineTo(rectEndX, triangleBaseWidth / 2);              // Diagonal de volta para a base do triângulo
  shape.lineTo(rectEndX, d / 2);                              // Sobe formando o "degrau" de volta para a borda
  
  shape.lineTo(-w / 2 + cx, d / 2);
  shape.lineTo(-w / 2, d / 2 - cx);
  shape.lineTo(-w / 2, -d / 2 + cx);

  const extSet = { depth: h, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.015, bevelSegments: 3 };
  const pcbMat = mat(0xeaeef0, { r: 0.78, m: 0.08 });
  const pcb = new M.Mesh(new M.ExtrudeGeometry(shape, extSet), pcbMat);
  pcb.rotation.x = -PI / 2;
  pcb.position.y = -h / 2;
  g.add(pcb);

  const goldMat = mat(0xd4af37, { r: 0.2, m: 1 });

  const pinCount = 18;
  const pinSpan = w - 1.0;
  const pinStep = pinSpan / (pinCount - 1);
  const pinStartX = -pinSpan / 2;

  // ── Pin Headers (com pinos visíveis no topo e na base) ──
  const pinMat = mat(0xb89a32, { r: 0.22, m: 0.92 });
  const pinTopMat = mat(0xd9bd58, { r: 0.18, m: 0.96 });
  const baseMat = mat(0x202124, { r: 0.82 });
  const pinLen = 0.92;

  for (const zSide of [-1, 1]) {
    const zPos = zSide * (d / 2 - 0.12);

    // Base plástica preta compacta, logo abaixo da PCB
    const strip = new M.Mesh(
      new M.BoxGeometry(pinSpan + 0.18, 0.16, 0.15),
      baseMat
    );
    strip.position.set(0, -h / 2 - 0.08, zPos);
    g.add(strip);

    for (let i = 0; i < pinCount; i++) {
      const px = pinStartX + i * pinStep;

      // Pino metálico saindo pouco no topo e descendo na face inferior
      const pin = new M.Mesh(
        new M.BoxGeometry(0.045, pinLen, 0.045),
        pinMat
      );
      pin.position.set(px, -0.37, zPos);
      g.add(pin);

      const pinTop = new M.Mesh(
        new M.BoxGeometry(0.048, 0.095, 0.048),
        pinTopMat
      );
      pinTop.position.set(px, h / 2 + 0.047, zPos);
      g.add(pinTop);
    }
  }

  // ── Porta USB-C (extrudado oco com pino central) ──
  const usbGrp = new M.Group();
  const ow = 0.65, oh = 0.22, rOut = 0.08;
  const iw = 0.5, ih = 0.12, rIn = 0.04;

  const shapeUsbc = new M.Shape();
  shapeUsbc.moveTo(-ow / 2 + rOut, -oh / 2);
  shapeUsbc.lineTo(ow / 2 - rOut, -oh / 2);
  shapeUsbc.quadraticCurveTo(ow / 2, -oh / 2, ow / 2, -oh / 2 + rOut);
  shapeUsbc.lineTo(ow / 2, oh / 2 - rOut);
  shapeUsbc.quadraticCurveTo(ow / 2, oh / 2, ow / 2 - rOut, oh / 2);
  shapeUsbc.lineTo(-ow / 2 + rOut, oh / 2);
  shapeUsbc.quadraticCurveTo(-ow / 2, oh / 2, -ow / 2, oh / 2 - rOut);
  shapeUsbc.lineTo(-ow / 2, -oh / 2 + rOut);
  shapeUsbc.quadraticCurveTo(-ow / 2, -oh / 2, -ow / 2 + rOut, -oh / 2);

  const holeUsbc = new M.Path();
  holeUsbc.moveTo(-iw / 2 + rIn, -ih / 2);
  holeUsbc.lineTo(iw / 2 - rIn, -ih / 2);
  holeUsbc.quadraticCurveTo(iw / 2, -ih / 2, iw / 2, -ih / 2 + rIn);
  holeUsbc.lineTo(iw / 2, ih / 2 - rIn);
  holeUsbc.quadraticCurveTo(iw / 2, ih / 2, iw / 2 - rIn, ih / 2);
  holeUsbc.lineTo(-iw / 2 + rIn, ih / 2);
  holeUsbc.quadraticCurveTo(-iw / 2, ih / 2, -iw / 2, ih / 2 - rIn);
  holeUsbc.lineTo(-iw / 2, -ih / 2 + rIn);
  holeUsbc.quadraticCurveTo(-iw / 2, -ih / 2, -iw / 2 + rIn, -ih / 2);
  shapeUsbc.holes.push(holeUsbc);

  const usbDepth = 0.6;
  const usbShellGeo = new M.ExtrudeGeometry(shapeUsbc, {
    depth: usbDepth, bevelEnabled: true,
    bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 2,
  });
  usbShellGeo.center();
  const usbShell = new M.Mesh(usbShellGeo, mat(0xc8c8c8, { r: 0.28, m: 0.92 }));
  usbShell.rotation.y = -PI / 2;
  usbGrp.add(usbShell);

  const usbBg = new M.Mesh(
    new M.BoxGeometry(0.05, ih + 0.04, iw + 0.04),
    mat(0x050505, { r: 1 })
  );
  usbBg.position.x = usbDepth / 2 - 0.02;
  usbGrp.add(usbBg);

  const usbPin = new M.Mesh(
    new M.BoxGeometry(0.4, 0.03, iw - 0.05),
    mat(0x1a1a1a, { r: 0.5 })
  );
  const usbGoldPin = new M.Mesh(
    new M.BoxGeometry(0.35, 0.032, iw - 0.08),
    goldMat
  );
  usbGrp.add(usbPin, usbGoldPin);
  usbGrp.position.set(-w / 2 - 0.15, h / 2 + 0.13, 0);
  g.add(usbGrp);

  function addTactSwitch(x, z) {
    const switchBody = new M.Mesh(
      new M.BoxGeometry(0.33, 0.08, 0.33),
      mat(0x5f646a, { m: 0.85, r: 0.22 })
    );
    switchBody.position.set(x, h / 2 + 0.04, z);
    g.add(switchBody);

    const switchCap = new M.Mesh(
      new M.CylinderGeometry(0.1, 0.1, 0.045, 18),
      mat(0x2c2f33, { r: 0.75, m: 0.18 })
    );
    switchCap.position.set(x, h / 2 + 0.102, z);
    g.add(switchCap);

    for (const side of [-1, 1]) {
      const tab = new M.Mesh(
        new M.BoxGeometry(0.05, 0.018, 0.11),
        pinTopMat
      );
      tab.position.set(x + side * 0.16, h / 2 + 0.01, z);
      g.add(tab);
    }
  }

  // ── Botões laterais no estilo tact switch real ──
  addTactSwitch(-w / 2 + 0.55, -d / 2 + 0.42);
  addTactSwitch(-w / 2 + 0.55, d / 2 - 0.42);

  // ── Antena Mola LoRa (mais fina e compacta, como na referência) ──
  const copperMat = mat(0xb87333, { r: 0.28, m: 0.86 });
  const antX = -w / 2 + 0.95, antZ = -d / 2 + 0.62;

  // Posts base verticais
  const legA = new M.Mesh(new M.CylinderGeometry(0.03, 0.03, 0.16, 8), copperMat);
  legA.position.set(antX - 0.06, h / 2 + 0.08, antZ);
  g.add(legA);
  const legB = new M.Mesh(new M.CylinderGeometry(0.03, 0.03, 0.16, 8), copperMat);
  legB.position.set(antX + 0.06, h / 2 + 0.08, antZ);
  g.add(legB);

  // Espiral mais estreita e alta
  const springMat = mat(0xd4813d, { r: 0.26, m: 0.9 });
  const springCurve = new M.CatmullRomCurve3(
    Array.from({ length: 60 }, (_, i) => {
      const t = i / 59;
      const angle = t * PI * 14;
      return new M.Vector3(Math.cos(angle) * 0.11, t * 0.5, Math.sin(angle) * 0.11);
    })
  );
  const spring = new M.Mesh(new M.TubeGeometry(springCurve, 96, 0.021, 8), springMat);
  spring.position.set(antX, h / 2 + 0.16, antZ);
  g.add(spring);

  // ── ICs Principais ──
  const icMat = mat(0x181818, { r: 0.48, m: 0.28 });
  // ESP32-S3 (chip maior)
  const ic1 = new M.Mesh(new M.BoxGeometry(0.55, 0.1, 0.55), icMat);
  ic1.position.set(-w / 2 + 1.55, h / 2 + 0.05, 0.1);
  g.add(ic1);
  // SX1262 LoRa (chip menor)
  const ic2 = new M.Mesh(new M.BoxGeometry(0.35, 0.08, 0.35), icMat);
  ic2.position.set(-w / 2 + 0.8, h / 2 + 0.04, 0.15);
  g.add(ic2);

  // ── Cristal ──
  const quartz = new M.Mesh(
    new M.BoxGeometry(0.24, 0.1, 0.12),
    mat(0xa2a6aa, { r: 0.38, m: 0.78 })
  );
  quartz.position.set(-w / 2 + 1.3, h / 2 + 0.05, d / 2 - 0.35);
  g.add(quartz);

  // ── SMDs ──
  const smdMat = mat(0x111111, { r: 0.65 });
  [
    [-w / 2 + 0.5, -d / 2 + 0.45, 0.12, 0.07],
    [-w / 2 + 1.6, 0.55,           0.1,  0.06],
    [-w / 2 + 1.85, -d / 2 + 0.45, 0.08, 0.05],
    [-w / 2 + 2.0, d / 2 - 0.55,   0.1,  0.06],
  ].forEach(([sx, sz, sw, sd]) => {
    const smd = new M.Mesh(new M.BoxGeometry(sw, 0.04, sd), smdMat);
    smd.position.set(sx, h / 2 + 0.02, sz);
    g.add(smd);
  });

  // ── Conectores pretos pequenos (2 headers no lado da antena) ──
  const hdrMat = mat(0x1a1a1a, { r: 0.78 });
  const hdr1 = new M.Mesh(new M.BoxGeometry(0.22, 0.15, 0.18), hdrMat);
  hdr1.position.set(-w / 2 + 1.85, h / 2 + 0.075, -d / 2 + 0.32);
  g.add(hdr1);


  // ── Tela OLED (moldura fina prateada + tela preta + 4 screws) ──
  // Encurtada levemente e deslocada para a esquerda para abrir espaço na direita
  const oledW = 3.1, oledD = 2.1, oledFH = 0.12;
  const oledX = 0.7;
  const frameMat = mat(0xbcc0c8, { r: 0.2, m: 0.9 });

  // Moldura prateada (fina, como na referência)
  const oledFrame = new M.Mesh(
    new M.BoxGeometry(oledW, oledFH, oledD),
    frameMat
  );
  oledFrame.position.set(oledX, h / 2 + oledFH / 2, 0);
  g.add(oledFrame);

  // Tela preta recuada dentro da moldura
  // Shader animado para simulação de display OLED
  const oledScreenGeo = new M.BoxGeometry(oledW - 0.28, 0.03, oledD - 0.28);
  // Canvas para dashboard OLED
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 340;
  const ctx = canvas.getContext('2d');
  // Função para desenhar dashboard com visual premium
  function drawOledDashboard(data) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    
    // Fundo com leve gradiente estruturado
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#0a1a2f');
    bgGrad.addColorStop(1, '#020b14');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Efeito de scanline sutil
    ctx.strokeStyle = 'rgba(0, 255, 231, 0.03)';
    ctx.lineWidth = 1;
    for(let i = 0; i < canvas.height; i += 6) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }

    ctx.textAlign = 'left';
    
    // Título em destaque com brilho
    ctx.font = 'bold 44px "Courier New", monospace';
    ctx.fillStyle = '#00ffe7';
    ctx.shadowColor = '#00ffe7';
    ctx.shadowBlur = 12;
    ctx.fillText(data.title, 30, 60);
    ctx.shadowBlur = 0;
    
    // Subtítulos
    ctx.font = '24px "Courier New", monospace';
    ctx.fillStyle = '#8892b0';
    ctx.fillText(data.time, 30, 110);
    
    ctx.font = 'bold 32px "Courier New", monospace';
    ctx.fillStyle = '#ccd6f6';
    ctx.fillText('Signal: ' + data.signal, 30, 170);
    
    ctx.font = '32px "Courier New", monospace';
    ctx.fillText(data.distance, 30, 220);
    
    // Bússola / Radar central
    ctx.save();
    ctx.translate(380, 140);
    
    // Círculos do radar
    ctx.strokeStyle = 'rgba(0, 255, 231, 0.4)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, 85, 0, 2 * Math.PI);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(0, 255, 231, 0.1)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 50, 0, 2 * Math.PI);
    ctx.stroke();

    // Cruz de centro do alvo
    ctx.beginPath();
    ctx.moveTo(-10, 0); ctx.lineTo(10, 0);
    ctx.moveTo(0, -10); ctx.lineTo(0, 10);
    ctx.stroke();
    
    // Círculo luminoso demarcando o destino
    ctx.save();
    ctx.rotate(data.pointerAngle);
    ctx.beginPath();
    ctx.arc(85, 0, 10, 0, 2 * Math.PI);
    ctx.strokeStyle = '#00ffe7';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = 'rgba(0, 255, 231, 0.3)';
    ctx.fill();
    ctx.restore();
    
    // Ponteiro (seta sólida perfeitamente apontada)
    ctx.save();
    ctx.rotate(data.pointerAngle);
    ctx.beginPath();
    ctx.moveTo(55, 0);    // Ponta
    ctx.lineTo(25, 15);   // Cabeça bot-right
    ctx.lineTo(25, 5);    // Pescoço inferior
    ctx.lineTo(-20, 5);   // Cauda inferior
    ctx.lineTo(-20, -5);  // Cauda superior
    ctx.lineTo(25, -5);   // Pescoço superior
    ctx.lineTo(25, -15);  // Cabeça top-right
    ctx.closePath();
    ctx.fillStyle = '#00ffe7';
    ctx.shadowColor = '#00ffe7';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.restore();
    
    ctx.restore(); // Fim do radar
    
    // Indicadores inferiores (Paging dots)
    ctx.save();
    ctx.translate(canvas.width / 2, 300);
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      let x = (i - 1) * 35;
      ctx.arc(x, 0, 8, 0, 2 * Math.PI);
      if (i === data.page) {
        ctx.fillStyle = '#00ffe7';
        ctx.shadowColor = '#00ffe7';
        ctx.shadowBlur = 10;
      } else {
        ctx.fillStyle = 'rgba(0, 255, 231, 0.2)';
        ctx.shadowBlur = 0;
      }
      ctx.fill();
    }
    ctx.restore();
    
    ctx.restore();
  }

  // Ângulo base: o externo aponta para a base (-21, -4) e a base aponta para o externo (0, 0)
  // atan2(deltaZ, deltaX)
  const baseAngle = isBase ? Math.atan2(4, 21) : Math.atan2(-4, -21);

  const oledData = {
    title: isBase ? 'EXT01' : 'BASE', // Nome do alvo que está recebendo/enviando
    time: 'Online',
    signal: isBase ? '92%' : '87%',
    distance: '2.4 km',
    pointerAngle: baseAngle,
    page: 1,
  };

  // ── REINSERÇÃO: Textura Three.js e Aplicação no OLED ──
  const oledTexture = new THREE.CanvasTexture(canvas);
  oledTexture.minFilter = THREE.LinearFilter;
  oledTexture.magFilter = THREE.LinearFilter;
  oledTexture.anisotropy = 4;

  const oledScreenMat = new THREE.MeshBasicMaterial({
    map: oledTexture,
    transparent: true,
    color: 0xffffff,
  });
  const oledScreen = new M.Mesh(oledScreenGeo, oledScreenMat);
  oledScreen.position.set(oledX, h / 2 + oledFH - 0.005, 0);
  g.add(oledScreen);
  // ────────────────────────────────────────────────────────

  // Array global para gerenciar múltiplas instâncias de telas OLED
  if (!window._heltecInstances) {
    window._heltecInstances = [];
    
    window._heltecOledAnim = function animateHeltecOled() {
      const now = performance.now();
      window._heltecInstances.forEach(inst => {
        // Oscilação mínima para dar sensação de "leitura contínua"
        const jitter = Math.sin(now * 0.002 + inst.phase) * 0.03;
        inst.data.pointerAngle = inst.baseAngle + jitter;
        inst.draw(inst.data);
        inst.texture.needsUpdate = true;
      });
      requestAnimationFrame(window._heltecOledAnim);
    };
    window._heltecOledAnim();
  }
  
  // Registra esta instância no array global para animação correta de ambos os Heltecs
  window._heltecInstances.push({
    data: oledData,
    draw: drawOledDashboard,
    texture: oledTexture,
    baseAngle: baseAngle,
    phase: Math.random() * Math.PI * 2
  });

  // Faixa dourada de contatos (borda do FPC)
  const goldStrip = new M.Mesh(
    new M.BoxGeometry(0.08, 0.006, oledD - 0.45),
    goldMat
  );
  goldStrip.position.set(oledX - oledW / 2 + 0.12, h / 2 + oledFH + 0.001, 0);
  g.add(goldStrip);

  // 4 parafusos nos cantos do OLED (pequenos, flush)
  const scrCw = oledW / 2 - 0.16, scrCd = oledD / 2 - 0.16;
  [[-scrCw, -scrCd], [-scrCw, scrCd], [scrCw, -scrCd], [scrCw, scrCd]].forEach(([ox, oz]) => {
    addScrew(g, oledX + ox, h / 2 + oledFH + 0.01, oz, 0.06, 0xc5ccd5);
  });

  // ── Cabo FPC (flat, do OLED para a metade esquerda do PCB) ──
  const fpc = new M.Mesh(
    new M.BoxGeometry(0.3, 0.018, 0.9),
    mat(0xccaa40, { r: 0.42 })
  );
  fpc.position.set(oledX - oledW / 2 - 0.08, h / 2 + 0.04, 0);
  g.add(fpc);

  // ── Conector IPEX (Voltado ao centro livre, na frente da tela) ──
  const ipexX = tipEndX - 0.25; // Bem no cantinho direito do novo triângulo
  const ipexZ = 0; // Exatamente no MEIO, como pedido
  const ipexBase = new M.Mesh(new M.BoxGeometry(0.2, 0.07, 0.2), goldMat);
  ipexBase.position.set(ipexX, h / 2 + 0.035, ipexZ);
  g.add(ipexBase);
  const ipexRing = new M.Mesh(new M.TorusGeometry(0.06, 0.022, 8, 16), goldMat);
  ipexRing.rotation.x = PI / 2;
  ipexRing.position.set(ipexX, h / 2 + 0.07, ipexZ);
  g.add(ipexRing);

  // ── Silkscreen "V3" ──
  const silkBase = new M.Mesh(new M.BoxGeometry(0.3, 0.012, 0.2), mat(0x111111));
  silkBase.position.set(ipexX - 0.3, h / 2 + 0.008, ipexZ);
  g.add(silkBase);

  return setCastShadow(g);
}

window.buildHeltec = buildHeltec;
