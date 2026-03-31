// ══════════════════════════════════════════════════
// showcase.js — Modo Showcase / Pitch (componente isolado girando)
// ══════════════════════════════════════════════════

(function () {
  'use strict';

  let active = false;
  let showcaseGroup = null;       // clone isolado
  let originalVisibility = {};    // salva visible de cada objeto
  let savedCamPos = null;
  let savedTarget = null;
  let savedFog = null;
  let savedBg = null;
  let savedAutoRotate = false;
  let currentId = null;
  let savedScreenMesh = null;  // referência original do Dashboard screenMesh

  // Objetos auxiliares do ambiente showcase
  let showcaseFloor = null;
  let showcaseRing1 = null;
  let showcaseRing2 = null;
  let showcaseRing3 = null;
  let showcaseSpot = null;
  let showcaseFill = null;
  let showcaseAmbient = null;
  let showcaseBack = null;

  // ── Partículas SEN66 ──
  let sen66Particles = null;
  let sen66ParticleData = [];
  var SEN66_PARTICLE_COUNT = 120;

  // ── Chuva MISOL ──
  let misolRainPoints = null;
  let misolRainData = [];
  let misolSplashPoints = null;
  let misolSplashData = [];
  let misolFunnelInfo = null;
  var MISOL_RAIN_COUNT = 90;
  var MISOL_SPLASH_COUNT = 80;
  var MISOL_GRAVITY = -0.0025;
  // Funnel geometry em coords locais do grupo 'g'
  var MISOL_LIP_Y_LOCAL = 4.3;
  var MISOL_FUNNEL_BOT_Y_LOCAL = 3.1;
  var MISOL_FUNNEL_TOP_R_LOCAL = 1.85;
  var MISOL_FUNNEL_BOT_R_LOCAL = 0.2;

  // ── Vento Anemômetro ──
  let windPoints = null;
  let windTrailPoints = null;
  let windParticleData = [];
  let windTrailData = [];
  var WIND_COUNT = 100;
  var WIND_TRAIL_COUNT = 60;
  // Alturas locais: cups Y=6.18, vane Y=4.92, scale 1.7
  var WIND_CUPS_LOCAL_Y = 6.18;
  var WIND_VANE_LOCAL_Y = 4.92;

  // ── Gravação ──
  let mediaRecorder = null;
  let recordedChunks = [];
  let isRecording = false;
  let recordingStartTime = 0;
  let recordingTimer = null;

  // ── Helpers ──
  function hideAllSceneObjects() {
    originalVisibility = {};
    scene.children.forEach(function (child) {
      originalVisibility[child.uuid] = child.visible;
      child.visible = false;
    });
  }

  function restoreAllSceneObjects() {
    scene.children.forEach(function (child) {
      if (originalVisibility[child.uuid] !== undefined) {
        child.visible = originalVisibility[child.uuid];
      }
    });
    originalVisibility = {};
  }

  function createShowcaseEnv() {
    // Luz ambiente geral para não ficar escuro
    showcaseAmbient = new THREE.AmbientLight(0xd4eef7, 0.6);
    scene.add(showcaseAmbient);

    // Spotlight principal (branco quente, não só turquesa)
    showcaseSpot = new THREE.SpotLight(0xffffff, 6, 80, Math.PI / 3, 0.5, 1);
    showcaseSpot.position.set(0, 20, 0);
    showcaseSpot.target.position.set(0, 0, 0);
    showcaseSpot.castShadow = true;
    scene.add(showcaseSpot);
    scene.add(showcaseSpot.target);

    // Fill lateral (mais forte e mais perto)
    showcaseFill = new THREE.PointLight(0xb0dfff, 15, 60, 2);
    showcaseFill.position.set(10, 8, 8);
    scene.add(showcaseFill);

    // Contra-luz do outro lado
    showcaseBack = new THREE.PointLight(0x80ffd4, 10, 50, 2);
    showcaseBack.position.set(-8, 5, -6);
    scene.add(showcaseBack);

    // Plataforma circular
    var floorGeo = new THREE.CylinderGeometry(8, 8, 0.15, 64);
    var floorMat = new THREE.MeshStandardMaterial({
      color: 0x0a1820,
      roughness: 0.3,
      metalness: 0.6,
    });
    showcaseFloor = new THREE.Mesh(floorGeo, floorMat);
    showcaseFloor.position.y = -0.08;
    showcaseFloor.receiveShadow = true;
    scene.add(showcaseFloor);

    // Anel turquesa brilhante
    var ringMat1 = new THREE.MeshBasicMaterial({
      color: 0x00bfa5,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
    });
    showcaseRing1 = new THREE.Mesh(new THREE.RingGeometry(7.8, 8.1, 80), ringMat1);
    showcaseRing1.rotation.x = -Math.PI / 2;
    showcaseRing1.position.y = 0.01;
    scene.add(showcaseRing1);

    // Anel externo sutil
    var ringMat2 = new THREE.MeshBasicMaterial({
      color: 0x00bfa5,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
    });
    showcaseRing2 = new THREE.Mesh(new THREE.RingGeometry(9.5, 9.7, 80), ringMat2);
    showcaseRing2.rotation.x = -Math.PI / 2;
    showcaseRing2.position.y = 0.005;
    scene.add(showcaseRing2);

    // Grid radial fino
    var ringMat3 = new THREE.MeshBasicMaterial({
      color: 0x00bfa5,
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide,
    });
    showcaseRing3 = new THREE.Mesh(new THREE.RingGeometry(5, 5.05, 80), ringMat3);
    showcaseRing3.rotation.x = -Math.PI / 2;
    showcaseRing3.position.y = 0.005;
    scene.add(showcaseRing3);
  }

  function removeShowcaseEnv() {
    [showcaseFloor, showcaseRing1, showcaseRing2, showcaseRing3, showcaseSpot, showcaseFill, showcaseAmbient, showcaseBack].forEach(function (obj) {
      if (obj) {
        scene.remove(obj);
        if (obj.target) scene.remove(obj.target);
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
      }
    });
    showcaseFloor = showcaseRing1 = showcaseRing2 = showcaseRing3 = showcaseSpot = showcaseFill = showcaseAmbient = showcaseBack = null;
  }

  // ── Partículas de fumaça/poeira para SEN66 ──
  function createSEN66Particles() {
    if (sen66Particles) return;

    // Descobrir posição do fan no clone (world space)
    var fan = showcaseGroup.getObjectByName('sen_fan');
    if (!fan) return;
    fan.updateMatrixWorld(true);
    var fanWorldPos = new THREE.Vector3();
    fan.getWorldPosition(fanWorldPos);

    // Calcular posições world dos 3 slots da grelha
    var grpRotY = showcaseGroup.rotation.y;
    var slotTargets = getSlotWorldTargets(fanWorldPos, grpRotY);

    var geo = new THREE.BufferGeometry();
    var positions = new Float32Array(SEN66_PARTICLE_COUNT * 3);
    var alphas = new Float32Array(SEN66_PARTICLE_COUNT);
    var sizes = new Float32Array(SEN66_PARTICLE_COUNT);
    sen66ParticleData = [];

    for (var i = 0; i < SEN66_PARTICLE_COUNT; i++) {
      var p = initSEN66Particle(fanWorldPos, slotTargets);
      sen66ParticleData.push(p);
      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;
      alphas[i] = p.alpha;
      sizes[i] = p.size;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    var mat = new THREE.ShaderMaterial({
      uniforms: {},
      vertexShader: [
        'attribute float alpha;',
        'attribute float size;',
        'varying float vAlpha;',
        'void main() {',
        '  vAlpha = alpha;',
        '  vec4 mvPos = modelViewMatrix * vec4(position, 1.0);',
        '  gl_PointSize = size * (200.0 / -mvPos.z);',
        '  gl_Position = projectionMatrix * mvPos;',
        '}',
      ].join('\n'),
      fragmentShader: [
        'varying float vAlpha;',
        'void main() {',
        '  float d = length(gl_PointCoord - vec2(0.5));',
        '  if (d > 0.5) discard;',
        '  float soft = 1.0 - smoothstep(0.15, 0.5, d);',
        '  gl_FragColor = vec4(0.7, 0.75, 0.8, vAlpha * soft * 0.55);',
        '}',
      ].join('\n'),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    sen66Particles = new THREE.Points(geo, mat);
    scene.add(sen66Particles);
  }

  // Ângulos dos 3 espaços entre as hastes da grelha do SEN66
  // Hastes em: PI/4, PI/4 + 2PI/3, PI/4 + 4PI/3 (espaçadas 120°)
  // Cada espaço está 60° (PI/3) à frente de cada haste
  var GRILLE_ROT = Math.PI / 4;
  var SLOT_ANGLES = [
    GRILLE_ROT + Math.PI / 3,          // 105° — entre haste 0 e 2
    GRILLE_ROT + Math.PI,               // 225° — entre haste 2 e 1
    GRILLE_ROT + 5 * Math.PI / 3,      // 345° — entre haste 1 e 0
  ];
  var SLOT_RADIUS = 0.32; // centro do anel entre hub (0.24) e borda (0.40)
  var GRILLE_Y_OFFSET = 0.08; // grilleY(0.85) - fanY(0.77)

  function initSEN66Particle(fanWorldPos, slotTargets) {
    // Escolher um dos 3 slots aleatoriamente
    var slotIdx = Math.floor(Math.random() * 3);
    var target = slotTargets[slotIdx];

    // Partícula nasce acima e espalhada ao redor do slot escolhido
    var spreadAngle = SLOT_ANGLES[slotIdx] + (Math.random() - 0.5) * 1.2;
    var radius = 1.0 + Math.random() * 3.5;
    var heightAbove = 1.0 + Math.random() * 4.0;
    return {
      x: fanWorldPos.x + Math.cos(spreadAngle) * radius,
      y: fanWorldPos.y + heightAbove,
      z: fanWorldPos.z + Math.sin(spreadAngle) * radius,
      targetX: target.x,
      targetY: target.y,
      targetZ: target.z,
      life: Math.random(),
      speed: 0.003 + Math.random() * 0.006,
      alpha: 0,
      size: 0.06 + Math.random() * 0.14,
      spiralSpeed: (0.2 + Math.random() * 0.5) * (Math.random() > 0.5 ? 1 : -1),
      spiralRadius: 0.15 + Math.random() * 0.5,
      phase: Math.random() * Math.PI * 2,
      slotIdx: slotIdx,
    };
  }

  function getSlotWorldTargets(fanWorldPos, grpRotY) {
    // Calcular posições world dos 3 slots da grelha
    // Usa posição real do fan (já contabiliza centering) + rotação do grupo
    var targets = [];
    for (var i = 0; i < 3; i++) {
      var worldAngle = SLOT_ANGLES[i] + grpRotY;
      targets.push(new THREE.Vector3(
        fanWorldPos.x + Math.cos(worldAngle) * SLOT_RADIUS,
        fanWorldPos.y + GRILLE_Y_OFFSET + 0.03,
        fanWorldPos.z + Math.sin(worldAngle) * SLOT_RADIUS
      ));
    }
    return targets;
  }

  function updateSEN66Particles() {
    if (!sen66Particles || !showcaseGroup) return;

    var fan = showcaseGroup.getObjectByName('sen_fan');
    if (!fan) return;
    fan.updateMatrixWorld(true);
    var fanWorldPos = new THREE.Vector3();
    fan.getWorldPosition(fanWorldPos);

    // Recalcular slot targets (o grupo pode ter rotacionado com autoRotate)
    var grpRotY = showcaseGroup.rotation.y;
    var slotTargets = getSlotWorldTargets(fanWorldPos, grpRotY);

    var posArr = sen66Particles.geometry.attributes.position.array;
    var alphaArr = sen66Particles.geometry.attributes.alpha.array;
    var sizeArr = sen66Particles.geometry.attributes.size.array;

    for (var i = 0; i < SEN66_PARTICLE_COUNT; i++) {
      var p = sen66ParticleData[i];
      p.life += p.speed;

      if (p.life >= 1.0) {
        var np = initSEN66Particle(fanWorldPos, slotTargets);
        sen66ParticleData[i] = np;
        p = np;
      }

      // Atualizar target dinâmico (segue rotação do grupo)
      var tgt = slotTargets[p.slotIdx];

      var progress = p.life;
      var eased = progress * progress;

      // Espiral convergindo para o slot
      var spiralAngle = p.phase + progress * p.spiralSpeed * 8;
      var currentSpiralR = p.spiralRadius * (1.0 - eased);

      var baseX = p.x + (tgt.x - p.x) * eased;
      var baseY = p.y + (tgt.y - p.y) * eased;
      var baseZ = p.z + (tgt.z - p.z) * eased;

      posArr[i * 3]     = baseX + Math.cos(spiralAngle) * currentSpiralR;
      posArr[i * 3 + 1] = baseY;
      posArr[i * 3 + 2] = baseZ + Math.sin(spiralAngle) * currentSpiralR;

      // Alpha: fade in → visível → fade out ao entrar no slot
      if (progress < 0.15) {
        p.alpha = progress / 0.15;
      } else if (progress > 0.8) {
        p.alpha = (1.0 - progress) / 0.2;
      } else {
        p.alpha = 1.0;
      }

      sizeArr[i] = p.size * (1.0 - eased * 0.7);
      alphaArr[i] = p.alpha;
    }

    sen66Particles.geometry.attributes.position.needsUpdate = true;
    sen66Particles.geometry.attributes.alpha.needsUpdate = true;
    sen66Particles.geometry.attributes.size.needsUpdate = true;
  }

  function removeSEN66Particles() {
    if (sen66Particles) {
      scene.remove(sen66Particles);
      if (sen66Particles.geometry) sen66Particles.geometry.dispose();
      if (sen66Particles.material) sen66Particles.material.dispose();
      sen66Particles = null;
      sen66ParticleData = [];
    }
  }

  // ══════════════════════════════════════════════════
  // MISOL — Sistema de chuva com gotas, colisão e splash
  // ══════════════════════════════════════════════════

  function getMISOLFunnelInfo() {
    if (!showcaseGroup) return null;
    var gChild = showcaseGroup.children[0];
    if (!gChild) return null;
    showcaseGroup.updateMatrixWorld(true);

    var lipWorld = gChild.localToWorld(new THREE.Vector3(0, MISOL_LIP_Y_LOCAL, 0));
    var botWorld = gChild.localToWorld(new THREE.Vector3(0, MISOL_FUNNEL_BOT_Y_LOCAL, 0));
    var radius = MISOL_FUNNEL_TOP_R_LOCAL * gChild.scale.x;
    var botRadius = MISOL_FUNNEL_BOT_R_LOCAL * gChild.scale.x;

    return {
      lipCenter: lipWorld,
      funnelBottom: botWorld,
      radius: radius,
      botRadius: botRadius,
    };
  }

  function initMISOLRainDrop(info) {
    var angle = Math.random() * Math.PI * 2;
    var r = Math.sqrt(Math.random()) * info.radius * 1.6;
    var heightAbove = 3.0 + Math.random() * 6.0;
    var windDrift = 0.002;
    return {
      x: info.lipCenter.x + Math.cos(angle) * r,
      y: info.lipCenter.y + heightAbove,
      z: info.lipCenter.z + Math.sin(angle) * r,
      vy: -(0.015 + Math.random() * 0.025),
      vx: windDrift + (Math.random() - 0.5) * 0.004,
      vz: (Math.random() - 0.5) * 0.004,
      alpha: 0.55 + Math.random() * 0.45,
      size: 0.10 + Math.random() * 0.18,
    };
  }

  function initMISOLSplashSlot() {
    return {
      x: 0, y: -999, z: 0,
      vx: 0, vy: 0, vz: 0,
      alpha: 0,
      size: 0.02,
      life: 1.0,
      speed: 0.02,
      active: false,
      type: 'splash',
    };
  }

  function spawnMISOLSplash(ix, iy, iz, info) {
    var count = 4 + Math.floor(Math.random() * 3);
    var spawned = 0;
    for (var i = 0; i < MISOL_SPLASH_COUNT && spawned < count; i++) {
      var sp = misolSplashData[i];
      if (sp.active) continue;

      sp.active = true;
      sp.life = 0;
      sp.x = ix;
      sp.y = iy;
      sp.z = iz;

      if (spawned < count - 2) {
        // Splash micro-gotículas: burst para cima e para fora
        var a = Math.random() * Math.PI * 2;
        var spd = 0.015 + Math.random() * 0.035;
        sp.vx = Math.cos(a) * spd;
        sp.vy = 0.025 + Math.random() * 0.04;
        sp.vz = Math.sin(a) * spd;
        sp.size = 0.02 + Math.random() * 0.04;
        sp.speed = 0.012 + Math.random() * 0.012;
        sp.type = 'splash';
      } else {
        // Drip: água escorrendo para dentro do funil
        sp.vx = 0;
        sp.vy = -0.004 - Math.random() * 0.004;
        sp.vz = 0;
        sp.size = 0.03 + Math.random() * 0.03;
        sp.speed = 0.004 + Math.random() * 0.003;
        sp.type = 'drip';
      }
      sp.alpha = 1.0;
      spawned++;
    }
  }

  function createMISOLRain() {
    if (misolRainPoints) return;

    misolFunnelInfo = getMISOLFunnelInfo();
    if (!misolFunnelInfo) return;

    // ── Gotas de chuva ──
    var rainGeo = new THREE.BufferGeometry();
    var rPos = new Float32Array(MISOL_RAIN_COUNT * 3);
    var rAlpha = new Float32Array(MISOL_RAIN_COUNT);
    var rSize = new Float32Array(MISOL_RAIN_COUNT);
    misolRainData = [];

    for (var i = 0; i < MISOL_RAIN_COUNT; i++) {
      var p = initMISOLRainDrop(misolFunnelInfo);
      p.y -= Math.random() * 9.0;
      misolRainData.push(p);
      rPos[i * 3] = p.x; rPos[i * 3 + 1] = p.y; rPos[i * 3 + 2] = p.z;
      rAlpha[i] = p.alpha;
      rSize[i] = p.size;
    }

    rainGeo.setAttribute('position', new THREE.BufferAttribute(rPos, 3));
    rainGeo.setAttribute('alpha', new THREE.BufferAttribute(rAlpha, 1));
    rainGeo.setAttribute('size', new THREE.BufferAttribute(rSize, 1));

    var rainMat = new THREE.ShaderMaterial({
      uniforms: {},
      vertexShader: [
        'attribute float alpha;',
        'attribute float size;',
        'varying float vAlpha;',
        'void main() {',
        '  vAlpha = alpha;',
        '  vec4 mvPos = modelViewMatrix * vec4(position, 1.0);',
        '  gl_PointSize = size * (500.0 / -mvPos.z);',
        '  gl_Position = projectionMatrix * mvPos;',
        '}',
      ].join('\n'),
      fragmentShader: [
        'varying float vAlpha;',
        'void main() {',
        '  vec2 uv = gl_PointCoord - vec2(0.5);',
        '  uv.x *= 2.0;',
        '  float d = length(uv);',
        '  if (d > 0.5) discard;',
        '  float soft = 1.0 - smoothstep(0.0, 0.5, d);',
        '  gl_FragColor = vec4(0.35, 0.6, 1.0, vAlpha * soft * 0.8);',
        '}',
      ].join('\n'),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    misolRainPoints = new THREE.Points(rainGeo, rainMat);
    scene.add(misolRainPoints);

    // ── Splash + drip ──
    var splGeo = new THREE.BufferGeometry();
    var sPos = new Float32Array(MISOL_SPLASH_COUNT * 3);
    var sAlpha = new Float32Array(MISOL_SPLASH_COUNT);
    var sSize = new Float32Array(MISOL_SPLASH_COUNT);
    misolSplashData = [];

    for (var i = 0; i < MISOL_SPLASH_COUNT; i++) {
      misolSplashData.push(initMISOLSplashSlot());
      sPos[i * 3 + 1] = -999;
    }

    splGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
    splGeo.setAttribute('alpha', new THREE.BufferAttribute(sAlpha, 1));
    splGeo.setAttribute('size', new THREE.BufferAttribute(sSize, 1));

    var splMat = new THREE.ShaderMaterial({
      uniforms: {},
      vertexShader: [
        'attribute float alpha;',
        'attribute float size;',
        'varying float vAlpha;',
        'void main() {',
        '  vAlpha = alpha;',
        '  vec4 mvPos = modelViewMatrix * vec4(position, 1.0);',
        '  gl_PointSize = size * (400.0 / -mvPos.z);',
        '  gl_Position = projectionMatrix * mvPos;',
        '}',
      ].join('\n'),
      fragmentShader: [
        'varying float vAlpha;',
        'void main() {',
        '  float d = length(gl_PointCoord - vec2(0.5));',
        '  if (d > 0.5) discard;',
        '  float soft = 1.0 - smoothstep(0.05, 0.5, d);',
        '  gl_FragColor = vec4(0.65, 0.82, 1.0, vAlpha * soft * 0.9);',
        '}',
      ].join('\n'),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    misolSplashPoints = new THREE.Points(splGeo, splMat);
    scene.add(misolSplashPoints);
  }

  function updateMISOLRain() {
    if (!misolRainPoints || !misolSplashPoints) return;

    var info = getMISOLFunnelInfo();
    if (!info) return;
    misolFunnelInfo = info;

    // ── Atualizar gotas de chuva ──
    var posArr = misolRainPoints.geometry.attributes.position.array;
    var alphaArr = misolRainPoints.geometry.attributes.alpha.array;
    var sizeArr = misolRainPoints.geometry.attributes.size.array;

    for (var i = 0; i < MISOL_RAIN_COUNT; i++) {
      var p = misolRainData[i];

      p.vy += MISOL_GRAVITY;
      p.x += p.vx;
      p.y += p.vy;
      p.z += p.vz;

      // Colisão com nível da abertura do funil
      if (p.y <= info.lipCenter.y) {
        var dx = p.x - info.lipCenter.x;
        var dz = p.z - info.lipCenter.z;
        var dist = Math.sqrt(dx * dx + dz * dz);

        if (dist < info.radius * 0.95) {
          // ACERTOU o funil — splash!
          spawnMISOLSplash(p.x, info.lipCenter.y + 0.02, p.z, info);
          var np = initMISOLRainDrop(info);
          misolRainData[i] = np; p = np;
        } else if (p.y < info.lipCenter.y - 2.5) {
          // Errou — recicla
          var np2 = initMISOLRainDrop(info);
          misolRainData[i] = np2; p = np2;
        }
      }

      // Fade in no topo
      var topDist = info.lipCenter.y + 9.0 - p.y;
      if (topDist < 1.5) p.alpha = Math.max(0, topDist / 1.5) * (0.55 + Math.random() * 0.15);

      posArr[i * 3] = p.x;
      posArr[i * 3 + 1] = p.y;
      posArr[i * 3 + 2] = p.z;
      alphaArr[i] = p.alpha;
      sizeArr[i] = p.size;
    }

    misolRainPoints.geometry.attributes.position.needsUpdate = true;
    misolRainPoints.geometry.attributes.alpha.needsUpdate = true;
    misolRainPoints.geometry.attributes.size.needsUpdate = true;

    // ── Atualizar splash + drip ──
    var sp = misolSplashPoints.geometry.attributes.position.array;
    var sa = misolSplashPoints.geometry.attributes.alpha.array;
    var ss = misolSplashPoints.geometry.attributes.size.array;

    for (var i = 0; i < MISOL_SPLASH_COUNT; i++) {
      var d = misolSplashData[i];
      if (!d.active) { sa[i] = 0; continue; }

      d.life += d.speed;

      if (d.life >= 1.0) {
        d.active = false;
        d.alpha = 0;
        sa[i] = 0;
        sp[i * 3 + 1] = -999;
        continue;
      }

      if (d.type === 'splash') {
        d.vy += MISOL_GRAVITY * 0.6;
        d.vx *= 0.96;
        d.vz *= 0.96;
        d.x += d.vx;
        d.y += d.vy;
        d.z += d.vz;
        d.alpha = (1.0 - d.life) * (1.0 - d.life);
        ss[i] = d.size * (1.0 + d.life * 0.4);
      } else {
        // Drip: escorre pelo funil convergindo ao centro
        d.x += (info.funnelBottom.x - d.x) * 0.025;
        d.z += (info.funnelBottom.z - d.z) * 0.025;
        d.y += d.vy;
        d.vy -= 0.0002;
        // Brilho pulsante
        var ft = d.life;
        if (ft < 0.2) d.alpha = ft / 0.2;
        else if (ft > 0.7) d.alpha = (1.0 - ft) / 0.3;
        else d.alpha = 0.9 + 0.1 * Math.sin(ft * 25.0);
        ss[i] = d.size;
      }

      sp[i * 3] = d.x;
      sp[i * 3 + 1] = d.y;
      sp[i * 3 + 2] = d.z;
      sa[i] = d.alpha;
    }

    misolSplashPoints.geometry.attributes.position.needsUpdate = true;
    misolSplashPoints.geometry.attributes.alpha.needsUpdate = true;
    misolSplashPoints.geometry.attributes.size.needsUpdate = true;
  }

  function removeMISOLRain() {
    if (misolRainPoints) {
      scene.remove(misolRainPoints);
      if (misolRainPoints.geometry) misolRainPoints.geometry.dispose();
      if (misolRainPoints.material) misolRainPoints.material.dispose();
      misolRainPoints = null;
      misolRainData = [];
    }
    if (misolSplashPoints) {
      scene.remove(misolSplashPoints);
      if (misolSplashPoints.geometry) misolSplashPoints.geometry.dispose();
      if (misolSplashPoints.material) misolSplashPoints.material.dispose();
      misolSplashPoints = null;
      misolSplashData = [];
    }
    misolFunnelInfo = null;
  }

  // ══════════════════════════════════════════════════
  // ANEMÔMETRO — Sistema de vento com partículas + rastros
  // ══════════════════════════════════════════════════

  function getWindAnchor() {
    if (!showcaseGroup) return null;
    var cups = showcaseGroup.getObjectByName('cups');
    var vane = showcaseGroup.getObjectByName('vane');
    if (!cups) return null;
    showcaseGroup.updateMatrixWorld(true);
    cups.updateMatrixWorld(true);
    var cupsWorld = new THREE.Vector3();
    cups.getWorldPosition(cupsWorld);
    var vaneWorld = new THREE.Vector3();
    if (vane) { vane.updateMatrixWorld(true); vane.getWorldPosition(vaneWorld); }
    else vaneWorld.copy(cupsWorld).y -= 1.0;
    return { cups: cupsWorld, vane: vaneWorld };
  }

  function initWindParticle(anchor, isSeed) {
    // Direção do vento: -X → +X com leve variação
    var grpRotY = showcaseGroup ? showcaseGroup.rotation.y : 0;
    var windDirX = Math.cos(grpRotY);
    var windDirZ = Math.sin(grpRotY);

    // Centro entre cups e vane
    var centerY = (anchor.cups.y + anchor.vane.y) / 2;
    var verticalSpread = (anchor.cups.y - anchor.vane.y) * 1.4;

    // Nasce bem à esquerda do componente (direção do vento)
    var startDist = -(5.0 + Math.random() * 8.0);
    var lateralOffset = (Math.random() - 0.5) * 5.0;
    var yRand = centerY + (Math.random() - 0.5) * verticalSpread;

    // Velocidade principal na direção do vento
    var baseSpeed = 0.06 + Math.random() * 0.06;
    // Turbulência
    var turbPhase = Math.random() * Math.PI * 2;
    var turbAmp = 0.015 + Math.random() * 0.02;
    var turbFreq = 2.0 + Math.random() * 3.0;

    return {
      x: anchor.cups.x + windDirX * startDist + (-windDirZ) * lateralOffset,
      y: yRand,
      z: anchor.cups.z + windDirZ * startDist + windDirX * lateralOffset,
      vx: windDirX * baseSpeed,
      vz: windDirZ * baseSpeed,
      vy: 0,
      alpha: 0,
      size: 0.04 + Math.random() * 0.08,
      life: isSeed ? Math.random() : 0,
      speed: 0.005 + Math.random() * 0.004,
      turbPhase: turbPhase,
      turbAmp: turbAmp,
      turbFreq: turbFreq,
      deflected: false,
    };
  }

  function initWindTrail(anchor) {
    var grpRotY = showcaseGroup ? showcaseGroup.rotation.y : 0;
    var windDirX = Math.cos(grpRotY);
    var windDirZ = Math.sin(grpRotY);
    var centerY = (anchor.cups.y + anchor.vane.y) / 2;

    var startDist = -(3.0 + Math.random() * 5.0);
    var lateralOff = (Math.random() - 0.5) * 3.5;
    var yRand = centerY + (Math.random() - 0.5) * 2.5;
    var baseSpd = 0.04 + Math.random() * 0.03;

    return {
      x: anchor.cups.x + windDirX * startDist + (-windDirZ) * lateralOff,
      y: yRand,
      z: anchor.cups.z + windDirZ * startDist + windDirX * lateralOff,
      vx: windDirX * baseSpd,
      vz: windDirZ * baseSpd,
      vy: 0,
      alpha: 0,
      size: 0.15 + Math.random() * 0.25,
      life: Math.random(),
      speed: 0.003 + Math.random() * 0.002,
      turbPhase: Math.random() * Math.PI * 2,
      turbAmp: 0.01 + Math.random() * 0.015,
      turbFreq: 1.0 + Math.random() * 2.0,
    };
  }

  function createWindParticles() {
    if (windPoints) return;
    var anchor = getWindAnchor();
    if (!anchor) return;

    // ── Partículas velozes de vento ──
    var geo = new THREE.BufferGeometry();
    var pos = new Float32Array(WIND_COUNT * 3);
    var alpha = new Float32Array(WIND_COUNT);
    var sizes = new Float32Array(WIND_COUNT);
    windParticleData = [];

    for (var i = 0; i < WIND_COUNT; i++) {
      var p = initWindParticle(anchor, true);
      windParticleData.push(p);
      pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z;
      alpha[i] = 0; sizes[i] = p.size;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('alpha', new THREE.BufferAttribute(alpha, 1));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    var mat = new THREE.ShaderMaterial({
      uniforms: {},
      vertexShader: [
        'attribute float alpha;',
        'attribute float size;',
        'varying float vAlpha;',
        'void main() {',
        '  vAlpha = alpha;',
        '  vec4 mvPos = modelViewMatrix * vec4(position, 1.0);',
        '  gl_PointSize = size * (350.0 / -mvPos.z);',
        '  gl_Position = projectionMatrix * mvPos;',
        '}',
      ].join('\n'),
      fragmentShader: [
        'varying float vAlpha;',
        'void main() {',
        '  vec2 uv = gl_PointCoord - vec2(0.5);',
        '  uv.y *= 3.0;',   // streaks verticalmente finos
        '  float d = length(uv);',
        '  if (d > 0.5) discard;',
        '  float soft = 1.0 - smoothstep(0.0, 0.5, d);',
        '  gl_FragColor = vec4(0.85, 0.92, 1.0, vAlpha * soft * 0.6);',
        '}',
      ].join('\n'),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    windPoints = new THREE.Points(geo, mat);
    scene.add(windPoints);

    // ── Rastros suaves (maiores, mais lentos) ──
    var tGeo = new THREE.BufferGeometry();
    var tPos = new Float32Array(WIND_TRAIL_COUNT * 3);
    var tAlpha = new Float32Array(WIND_TRAIL_COUNT);
    var tSize = new Float32Array(WIND_TRAIL_COUNT);
    windTrailData = [];

    for (var i = 0; i < WIND_TRAIL_COUNT; i++) {
      var tr = initWindTrail(anchor);
      windTrailData.push(tr);
      tPos[i * 3] = tr.x; tPos[i * 3 + 1] = tr.y; tPos[i * 3 + 2] = tr.z;
      tAlpha[i] = 0; tSize[i] = tr.size;
    }

    tGeo.setAttribute('position', new THREE.BufferAttribute(tPos, 3));
    tGeo.setAttribute('alpha', new THREE.BufferAttribute(tAlpha, 1));
    tGeo.setAttribute('size', new THREE.BufferAttribute(tSize, 1));

    var tMat = new THREE.ShaderMaterial({
      uniforms: {},
      vertexShader: [
        'attribute float alpha;',
        'attribute float size;',
        'varying float vAlpha;',
        'void main() {',
        '  vAlpha = alpha;',
        '  vec4 mvPos = modelViewMatrix * vec4(position, 1.0);',
        '  gl_PointSize = size * (350.0 / -mvPos.z);',
        '  gl_Position = projectionMatrix * mvPos;',
        '}',
      ].join('\n'),
      fragmentShader: [
        'varying float vAlpha;',
        'void main() {',
        '  float d = length(gl_PointCoord - vec2(0.5));',
        '  if (d > 0.5) discard;',
        '  float soft = 1.0 - smoothstep(0.08, 0.5, d);',
        '  gl_FragColor = vec4(0.78, 0.88, 1.0, vAlpha * soft * 0.25);',
        '}',
      ].join('\n'),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    windTrailPoints = new THREE.Points(tGeo, tMat);
    scene.add(windTrailPoints);
  }

  function updateWindParticles() {
    if (!windPoints || !windTrailPoints || !showcaseGroup) return;
    var anchor = getWindAnchor();
    if (!anchor) return;

    var grpRotY = showcaseGroup.rotation.y;
    var windDirX = Math.cos(grpRotY);
    var windDirZ = Math.sin(grpRotY);
    var perpX = -windDirZ;
    var perpZ = windDirX;

    // ── Partículas rápidas ──
    var posArr = windPoints.geometry.attributes.position.array;
    var alphaArr = windPoints.geometry.attributes.alpha.array;
    var sizeArr = windPoints.geometry.attributes.size.array;

    for (var i = 0; i < WIND_COUNT; i++) {
      var p = windParticleData[i];
      p.life += p.speed;

      if (p.life >= 1.0) {
        var np = initWindParticle(anchor, false);
        windParticleData[i] = np; p = np;
      }

      // Turbulência sinusoidal
      var t = p.life * p.turbFreq;
      var turbY = Math.sin(t * Math.PI * 2 + p.turbPhase) * p.turbAmp;
      var turbLateral = Math.cos(t * Math.PI * 1.5 + p.turbPhase * 1.3) * p.turbAmp * 0.7;

      // Deflexão ao passar pelas cups — efeito de interação
      var dx = p.x - anchor.cups.x;
      var dz = p.z - anchor.cups.z;
      var dy = p.y - anchor.cups.y;
      var distH = Math.sqrt(dx * dx + dz * dz);
      var dist3D = Math.sqrt(distH * distH + dy * dy);

      var deflectX = 0, deflectY = 0, deflectZ = 0;
      if (dist3D < 2.5) {
        // Força de deflexão radial: vento desvia ao redor das cups
        var strength = (1.0 - dist3D / 2.5) * 0.015;
        if (distH > 0.01) {
          deflectX = (dx / distH) * strength;
          deflectZ = (dz / distH) * strength;
        }
        deflectY = dy > 0 ? strength * 0.5 : -strength * 0.5;
        if (!p.deflected) { p.deflected = true; }
      }

      p.x += p.vx + turbLateral * perpX + deflectX;
      p.y += turbY + deflectY;
      p.z += p.vz + turbLateral * perpZ + deflectZ;

      // Alpha: fade in → visível → fade out
      var progress = p.life;
      if (progress < 0.1) p.alpha = progress / 0.1;
      else if (progress > 0.75) p.alpha = (1.0 - progress) / 0.25;
      else p.alpha = 0.7 + 0.3 * Math.sin(progress * 12.0 + p.turbPhase);

      // Partículas deflectidas ficam mais brilhantes
      if (p.deflected && dist3D < 2.0) {
        p.alpha = Math.min(1.0, p.alpha * 1.4);
      }

      posArr[i * 3] = p.x;
      posArr[i * 3 + 1] = p.y;
      posArr[i * 3 + 2] = p.z;
      alphaArr[i] = p.alpha;
      sizeArr[i] = p.size;
    }

    windPoints.geometry.attributes.position.needsUpdate = true;
    windPoints.geometry.attributes.alpha.needsUpdate = true;
    windPoints.geometry.attributes.size.needsUpdate = true;

    // ── Rastros suaves ──
    var tPos = windTrailPoints.geometry.attributes.position.array;
    var tAlpha = windTrailPoints.geometry.attributes.alpha.array;
    var tSize = windTrailPoints.geometry.attributes.size.array;

    for (var i = 0; i < WIND_TRAIL_COUNT; i++) {
      var tr = windTrailData[i];
      tr.life += tr.speed;

      if (tr.life >= 1.0) {
        var nt = initWindTrail(anchor);
        nt.life = 0;
        windTrailData[i] = nt; tr = nt;
      }

      var tt = tr.life * tr.turbFreq;
      tr.x += tr.vx + Math.cos(tt * Math.PI * 2 + tr.turbPhase) * tr.turbAmp * perpX;
      tr.y += Math.sin(tt * Math.PI * 2 + tr.turbPhase) * tr.turbAmp;
      tr.z += tr.vz + Math.cos(tt * Math.PI * 2 + tr.turbPhase) * tr.turbAmp * perpZ;

      // Fade suave
      var tp = tr.life;
      if (tp < 0.15) tr.alpha = tp / 0.15;
      else if (tp > 0.7) tr.alpha = (1.0 - tp) / 0.3;
      else tr.alpha = 0.5 + 0.2 * Math.sin(tp * 8.0 + tr.turbPhase);

      tPos[i * 3] = tr.x;
      tPos[i * 3 + 1] = tr.y;
      tPos[i * 3 + 2] = tr.z;
      tAlpha[i] = tr.alpha;
      tSize[i] = tr.size * (0.8 + 0.4 * Math.sin(tp * 6.0));
    }

    windTrailPoints.geometry.attributes.position.needsUpdate = true;
    windTrailPoints.geometry.attributes.alpha.needsUpdate = true;
    windTrailPoints.geometry.attributes.size.needsUpdate = true;
  }

  function removeWindParticles() {
    if (windPoints) {
      scene.remove(windPoints);
      if (windPoints.geometry) windPoints.geometry.dispose();
      if (windPoints.material) windPoints.material.dispose();
      windPoints = null;
      windParticleData = [];
    }
    if (windTrailPoints) {
      scene.remove(windTrailPoints);
      if (windTrailPoints.geometry) windTrailPoints.geometry.dispose();
      if (windTrailPoints.material) windTrailPoints.material.dispose();
      windTrailPoints = null;
      windTrailData = [];
    }
  }

  function cloneGroupDeep(source) {
    var clone = source.clone(true);
    // Garante que materiais também sejam clonados pra não contaminar originais
    clone.traverse(function (child) {
      if (child.isMesh && child.material) {
        if (Array.isArray(child.material)) {
          child.material = child.material.map(m => m.clone());
        } else {
          child.material = child.material.clone();
        }
      }
    });
    return clone;
  }

  // ── API Principal ──
  function enter(componentId) {
    if (active && currentId === componentId) return;
    if (active) exit(); // sair do anterior

    var sourceGroup = groups[componentId];
    if (!sourceGroup) return;

    currentId = componentId;
    active = true;

    // Salvar estado da câmera
    savedCamPos = camera.position.clone();
    savedTarget = controls.target.clone();
    savedFog = scene.fog;
    savedBg = scene.background;
    savedAutoRotate = controls.autoRotate;

    // Esconder tudo
    hideAllSceneObjects();

    // Cena showcase (fundo um pouco mais claro)
    scene.background = new THREE.Color(0x0c1a24);
    scene.fog = new THREE.FogExp2(0x0c1a24, 0.005);

    createShowcaseEnv();

    // Clone do componente centralizado
    showcaseGroup = cloneGroupDeep(sourceGroup);
    showcaseGroup.visible = true;
    showcaseGroup.traverse(function (child) { child.visible = true; });
    showcaseGroup.position.set(0, 0, 0);
    showcaseGroup.rotation.set(0, 0, 0);
    showcaseGroup.scale.set(1, 1, 1);
    showcaseGroup.updateMatrixWorld(true);

    // Centralizar baseado no bounding box
    var bb = new THREE.Box3().setFromObject(showcaseGroup);
    var center = bb.getCenter(new THREE.Vector3());
    var size = bb.getSize(new THREE.Vector3());

    // Mover children para que o centro fique na origem
    showcaseGroup.children.forEach(function (child) {
      child.position.x -= center.x;
      child.position.y -= center.y;
      child.position.z -= center.z;
    });
    showcaseGroup.position.set(0, size.y / 2 + 0.15, 0);
    showcaseGroup.updateMatrixWorld(true);

    scene.add(showcaseGroup);

    // Dashboard: redirecionar screenMesh para o clone (ou desativar)
    if (typeof Dashboard !== 'undefined') {
      savedScreenMesh = Dashboard.getScreenMesh();
      if (componentId === 'esp32p4') {
        // Encontrar a tela PlaneGeometry no clone (não o vidro BoxGeometry)
        var foundScreen = null;
        showcaseGroup.traverse(function (child) {
          if (child.isMesh && child.userData && child.userData.isDashboard &&
              child.geometry && child.geometry.type === 'PlaneGeometry') {
            foundScreen = child;
          }
        });
        if (foundScreen) {
          foundScreen.material.side = THREE.DoubleSide;
          // Garantir que a worldMatrix esteja atualizada para o raycaster
          showcaseGroup.updateMatrixWorld(true);
          Dashboard.setScreenMesh(foundScreen);
        }
      } else {
        // Em outro componente, desativar para não capturar cliques fantasma no mesh original
        Dashboard.setScreenMesh(null);
      }
    }

    // Câmera
    var maxDim = Math.max(size.x, size.y, size.z);
    var dist = maxDim * 2.5 + 4;
    camera.position.set(dist * 0.7, dist * 0.5, dist * 0.7);
    controls.target.set(0, size.y / 2, 0);

    // Auto-rotate
    controls.autoRotate = true;
    controls.autoRotateSpeed = 2.5;
    controls.update();

    // UI
    updateShowcaseUI(componentId, true);

    // Efeitos de partículas específicos
    if (componentId === 'sen66') {
      createSEN66Particles();
    }
    if (componentId === 'misol') {
      createMISOLRain();
    }
    if (componentId === 'anemometro') {
      createWindParticles();
    }
  }

  function exit() {
    if (!active) return;
    active = false;
    currentId = null;

    // Remover partículas
    removeSEN66Particles();
    removeMISOLRain();
    removeWindParticles();


    // Remover clone e ambiente
    if (showcaseGroup) {
      scene.remove(showcaseGroup);
      showcaseGroup.traverse(function (child) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
      showcaseGroup = null;
    }
    removeShowcaseEnv();

    // Restaurar screenMesh original do Dashboard
    if (savedScreenMesh && typeof Dashboard !== 'undefined') {
      Dashboard.setScreenMesh(savedScreenMesh);
      savedScreenMesh = null;
    }

    // Restaurar cena
    restoreAllSceneObjects();
    scene.background = savedBg;
    scene.fog = savedFog;
    camera.position.copy(savedCamPos);
    controls.target.copy(savedTarget);
    controls.autoRotate = savedAutoRotate;
    controls.update();

    updateShowcaseUI(null, false);
  }

  // Animação do showcase (chamada no loop principal)
  function updateShowcase() {
    if (!active || !showcaseGroup) return;

    // Pulso suave no anel
    if (showcaseRing1) {
      var pulse = 0.4 + 0.2 * Math.sin(Date.now() / 800);
      showcaseRing1.material.opacity = pulse;
    }

    // Animações específicas do componente clonado
    var t = performance.now() / 1000;

    if (currentId === 'anemometro') {
      // Direção do vento em world space: flui na direção grpRotY
      var grpRotY = showcaseGroup.rotation.y;
      // No espaço local do grupo, o vento vem de -windDir e vai para +windDir
      // windDir world = (cos(grpRotY), sin(grpRotY))
      // Para converter para local do grupo (que rotacionou grpRotY), subtraímos a rotação:
      // localWindAngle = 0 (sempre vem da mesma direção relativa)
      // Mas o grupo gira com autoRotate, logo no local a direção muda.
      // Ângulo do vento no espaço local: windAngle_local = atan2(windDirZ, windDirX) - grpRotY = 0
      // Na verdade o vento flui em world angle = grpRotY, e o grupo rotacionou grpRotY,
      // então no local do grupo o vento SEMPRE vem do ângulo 0 (eixo +X local).
      // A biruta aponta NA DIREÇÃO para onde o vento vai (conveção meteorológica: vane points into wind).
      // A biruta (vane) tem o contrapeso no +X e cauda no -X local.
      // Vane.rotation.y = ângulo local do vento oposto = PI (vento vem de +X, biruta aponta -X → cauda atrás)

      // Cups: velocidade proporcional — variação suave simulando rajadas
      var windSpeed = 0.06 + 0.03 * Math.sin(t * 1.2) + 0.02 * Math.sin(t * 3.1);
      var cups = showcaseGroup.getObjectByName('cups');
      if (cups) cups.rotation.y += Math.abs(windSpeed); // gira para o outro lado (anti-horário real)

      // Vane: aponta contra o vento com leve oscilação de turbulência
      var vane = showcaseGroup.getObjectByName('vane');
      if (vane) {
        var vaneTargetAngle = Math.PI + Math.sin(t * 2.0) * 0.08 + Math.sin(t * 5.3) * 0.03;
        // Suavizar transição
        var currentAngle = vane.rotation.y;
        vane.rotation.y += (vaneTargetAngle - currentAngle) * 0.08;
      }

      updateWindParticles();
    }

    if (currentId === 'sen66') {
      var fan = showcaseGroup.getObjectByName('sen_fan');
      if (fan) fan.rotation.y -= 0.25;
      updateSEN66Particles();
    }

    if (currentId === 'misol') {
      updateMISOLRain();
    }
  }

  // ── Captura ──

  function takeShowcaseScreenshot() {
    if (!active) return;
    var statusEl = document.getElementById('sc-capture-status');
    if (statusEl) { statusEl.textContent = 'Renderizando…'; statusEl.style.opacity = '1'; }

    setTimeout(function () {
      try {
        var maxTex = renderer.capabilities.maxTextureSize;
        var width = 7680;
        var height = 4320;
        if (maxTex < 7680) {
          width = maxTex;
          height = Math.floor(maxTex / (7680 / 4320));
        }

        var origW = window.innerWidth;
        var origH = window.innerHeight;
        var origAspect = camera.aspect;
        var origPR = renderer.getPixelRatio();

        renderer.setPixelRatio(1);
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.render(scene, camera);

        var dataURL = renderer.domElement.toDataURL('image/png');

        renderer.setPixelRatio(origPR);
        renderer.setSize(origW, origH);
        camera.aspect = origAspect;
        camera.updateProjectionMatrix();

        var compName = (currentId || 'componente').replace(/[^a-z0-9]/gi, '_');
        var link = document.createElement('a');
        link.download = 'pitch_' + compName + '_' + width + 'x' + height + '.png';
        link.href = dataURL;
        link.click();

        if (statusEl) {
          statusEl.textContent = 'Salvo ' + width + '×' + height + ' ✓';
          setTimeout(function () { statusEl.style.opacity = '0'; }, 2500);
        }
      } catch (err) {
        console.error(err);
        if (statusEl) {
          statusEl.textContent = 'Erro — memória GPU insuficiente';
          setTimeout(function () { statusEl.style.opacity = '0'; }, 3000);
        }
      }
    }, 100);
  }

  function startRecording() {
    if (!active || isRecording) return;

    var canvas = renderer.domElement;
    var stream = canvas.captureStream(60);

    // Escolher codec de melhor qualidade disponível
    var mimeType = '';
    var codecs = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
    ];
    for (var i = 0; i < codecs.length; i++) {
      if (MediaRecorder.isTypeSupported(codecs[i])) { mimeType = codecs[i]; break; }
    }
    if (!mimeType) {
      alert('Seu navegador não suporta gravação de vídeo.');
      return;
    }

    recordedChunks = [];
    mediaRecorder = new MediaRecorder(stream, {
      mimeType: mimeType,
      videoBitsPerSecond: 50000000, // 50 Mbps — qualidade altíssima
    });

    mediaRecorder.ondataavailable = function (e) {
      if (e.data && e.data.size > 0) recordedChunks.push(e.data);
    };

    mediaRecorder.onstop = function () {
      var blob = new Blob(recordedChunks, { type: mimeType });
      var url = URL.createObjectURL(blob);
      var compName = (currentId || 'componente').replace(/[^a-z0-9]/gi, '_');
      var link = document.createElement('a');
      link.download = 'pitch_' + compName + '_' + new Date().toISOString().slice(0, 19).replace(/:/g, '-') + '.webm';
      link.href = url;
      link.click();
      setTimeout(function () { URL.revokeObjectURL(url); }, 5000);

      var statusEl = document.getElementById('sc-capture-status');
      if (statusEl) {
        statusEl.textContent = 'Vídeo salvo ✓';
        statusEl.style.opacity = '1';
        setTimeout(function () { statusEl.style.opacity = '0'; }, 2500);
      }
    };

    mediaRecorder.start(500); // chunk a cada 500ms
    isRecording = true;
    recordingStartTime = Date.now();
    updateRecordingUI();
  }

  function stopRecording() {
    if (!isRecording || !mediaRecorder) return;
    mediaRecorder.stop();
    isRecording = false;
    clearInterval(recordingTimer);
    recordingTimer = null;
    updateRecordingUI();
  }

  function updateRecordingUI() {
    var recBtn = document.getElementById('sc-btn-rec');
    var stopBtn = document.getElementById('sc-btn-stop');
    var timerEl = document.getElementById('sc-rec-timer');

    if (recBtn) recBtn.style.display = isRecording ? 'none' : '';
    if (stopBtn) stopBtn.style.display = isRecording ? '' : 'none';

    if (isRecording && timerEl) {
      timerEl.style.display = 'inline';
      clearInterval(recordingTimer);
      recordingTimer = setInterval(function () {
        var elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
        var min = String(Math.floor(elapsed / 60)).padStart(2, '0');
        var sec = String(elapsed % 60).padStart(2, '0');
        timerEl.textContent = min + ':' + sec;
      }, 500);
    } else if (timerEl) {
      timerEl.style.display = 'none';
      timerEl.textContent = '00:00';
    }
  }

  // ── UI ──
  var panelOpen = false;

  function togglePanel() {
    panelOpen = !panelOpen;
    var panel = document.getElementById('showcase-panel');
    var toggleBtn = document.getElementById('showcase-toggle');
    if (panel) panel.classList.toggle('is-open', panelOpen);
    if (toggleBtn) toggleBtn.classList.toggle('is-active', panelOpen);

    // Esconder cards da esquerda enquanto a barra de pitch estiver aberta
    var leftPanels = ['title-bar', 'info-panel', 'legend'];
    leftPanels.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.style.display = panelOpen ? 'none' : '';
    });
  }

  function buildUI() {
    if (document.getElementById('showcase-panel')) return;

    // Botão toggle — inserir no title-bar para ficar visível no mobile
    var controlsPanel = document.getElementById('title-bar');
    if (controlsPanel) {
      var btnWrap = document.createElement('div');
      btnWrap.style.marginTop = '12px';
      btnWrap.innerHTML = '<button id="showcase-toggle" onclick="window.Showcase.toggle()">🎬 Modo Pitch</button>';
      controlsPanel.appendChild(btnWrap);
    }

    // Painel (começa escondido)
    var panel = document.createElement('div');
    panel.id = 'showcase-panel';
    panel.innerHTML = [
      '<div class="showcase-header">',
      '  <div>',
      '    <div class="panel-kicker">Modo Pitch</div>',
      '    <h3>Showcase 3D</h3>',
      '  </div>',
      '  <button class="showcase-close" onclick="window.Showcase.toggle()">\u2715</button>',
      '</div>',
      '<div class="showcase-desc">Selecione um componente para isol\u00e1-lo na cena com rota\u00e7\u00e3o autom\u00e1tica — ideal para v\u00eddeo pitch.</div>',
      '<div id="showcase-toolbar" class="showcase-toolbar">',
      '  <div class="showcase-toolbar-label">Captura</div>',
      '  <div class="showcase-toolbar-btns">',
      '    <button class="sc-tool-btn" id="sc-btn-screenshot" onclick="window.Showcase.screenshot()" title="Screenshot 8K">',
      '      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="6" width="18" height="14" rx="2"/><circle cx="12" cy="13" r="3.5"/><path d="M7 6V4h10v2"/></svg>',
      '      <span>Print 8K</span>',
      '    </button>',
      '    <button class="sc-tool-btn sc-rec" id="sc-btn-rec" onclick="window.Showcase.startRec()" title="Gravar vídeo 60fps">',
      '      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4" fill="#ff4444" stroke="none"/></svg>',
      '      <span>Gravar</span>',
      '    </button>',
      '    <button class="sc-tool-btn sc-stop" id="sc-btn-stop" onclick="window.Showcase.stopRec()" title="Parar gravação" style="display:none">',
      '      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor" stroke="none"/></svg>',
      '      <span>Parar</span>',
      '      <span class="sc-rec-timer" id="sc-rec-timer">00:00</span>',
      '    </button>',
      '  </div>',
      '  <div class="sc-capture-status" id="sc-capture-status"></div>',
      '</div>',
      '<div id="showcase-list"></div>',
      '<button id="showcase-exit" onclick="window.Showcase.exit()">← Voltar \u00e0 Cena</button>',
    ].join('');

    document.body.appendChild(panel);

    // Preencher lista
    var list = document.getElementById('showcase-list');

    var categories = {
      'Sensores': ['sen66', 'bme690', 'sfa30', 'ltr390', 'as3935', 'solo', 'ics43434', 'misol'],
      'Instrumentos': ['anemometro', 'piranometro'],
      'Comunica\u00e7\u00e3o': ['heltec_ext', 'heltec_base', 'max485', 'esp32p4'],
      'Energia': ['buck', 'bateria', 'painel', 'mppt'],
    };

    Object.entries(categories).forEach(function (cat) {
      var catName = cat[0];
      var ids = cat[1];

      var catDiv = document.createElement('div');
      catDiv.className = 'showcase-cat';
      catDiv.innerHTML = '<div class="showcase-cat-label">' + catName + '</div>';

      ids.forEach(function (id) {
        var data = COMP_DATA[id];
        if (!data) return;

        var btn = document.createElement('button');
        btn.className = 'showcase-item';
        btn.dataset.id = id;
        btn.textContent = data.name.split('\u2014')[0].split('\uD83C\uDD95')[0].trim();
        btn.onclick = function () { enter(id); };
        catDiv.appendChild(btn);
      });

      list.appendChild(catDiv);
    });
  }

  function updateShowcaseUI(componentId, isActive) {
    var exitBtn = document.getElementById('showcase-exit');
    var items = document.querySelectorAll('.showcase-item');
    items.forEach(function (btn) {
      btn.classList.toggle('is-active', btn.dataset.id === componentId);
    });
    if (exitBtn) exitBtn.style.display = isActive ? 'block' : 'none';

    // Toolbar de captura — só visível quando componente ativo
    var toolbar = document.getElementById('showcase-toolbar');
    if (toolbar) toolbar.style.display = isActive ? 'block' : 'none';

    // Se parar gravação ao sair
    if (!isActive && isRecording) stopRecording();

    // Esconder/mostrar painéis principais (exceto showcase-panel)
    var mainPanels = ['title-bar', 'info-panel', 'legend', 'controls'];
    mainPanels.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.style.display = isActive ? 'none' : '';
    });

    // Ao entrar no showcase, garantir que painel showcase esteja visivel
    var panel = document.getElementById('showcase-panel');
    if (isActive) {
      panelOpen = true;
      if (panel) panel.classList.add('is-open');
    }

    // Info card no centro inferior
    var infoCard = document.getElementById('showcase-info');
    if (infoCard) {
      if (isActive && componentId && COMP_DATA[componentId]) {
        var data = COMP_DATA[componentId];
        document.getElementById('si-name').textContent = data.name;
        var tmp = document.createElement('div');
        tmp.innerHTML = data.info;
        document.getElementById('si-desc').textContent = tmp.textContent.replace(/\s+/g, ' ').trim();
        var tags = (data.tags || []).map(function(t) {
          return '<span class="tag tag-' + t + '">' + t.toUpperCase() + '</span>';
        }).join('');
        document.getElementById('si-tags').innerHTML = tags;
        infoCard.classList.add('visible');
      } else {
        infoCard.classList.remove('visible');
      }
    }
  }

  // Init
  function init() {
    buildUI();
  }

  // Expor
  window.Showcase = {
    init: init,
    enter: enter,
    exit: exit,
    toggle: togglePanel,
    screenshot: takeShowcaseScreenshot,
    startRec: startRecording,
    stopRec: stopRecording,
    update: updateShowcase,
    isActive: function () { return active; },
    currentId: function () { return currentId; },
  };
})();
