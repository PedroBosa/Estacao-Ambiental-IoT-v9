// ══════════════════════════════════════════════════
// interaction.js — Raycaster, labels e trilhas roteadas no chão
// ══════════════════════════════════════════════════

const groups = {};
const wireGroups = {};
const clickTargets = [];
const allLabels = [];
const componentZones = {};

// Altura Y separada por barramento → fios de tipos diferentes não se sobrepõem
const BUS_Y = {
  i2c:   0.032,
  rs485: 0.058,
  i2s:   0.084,
  irq:   0.045,
  pwr:   0.071,
  uart:  0.038,
  lora:  0.064,
};
const DEFAULT_Y = 0.04;

for (const bus of Object.keys(BUS_COLORS)) {
  wireGroups[bus] = [];
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// ── Criação de Labels ──
function makeLabel(text, pos) {
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');
  c.width = Math.max(420, Math.min(760, text.length * 24));
  c.height = 108;

  const grad = ctx.createLinearGradient(0, 0, c.width, c.height);
  grad.addColorStop(0, 'rgba(10, 20, 38, 0.78)');
  grad.addColorStop(1, 'rgba(16, 32, 56, 0.62)');
  ctx.fillStyle = grad;
  ctx.strokeStyle = 'rgba(129, 183, 255, 0.26)';
  ctx.lineWidth = 3;

  const radius = 22;
  ctx.beginPath();
  ctx.moveTo(24 + radius, 16);
  ctx.lineTo(c.width - 24 - radius, 16);
  ctx.quadraticCurveTo(c.width - 24, 16, c.width - 24, 16 + radius);
  ctx.lineTo(c.width - 24, c.height - 16 - radius);
  ctx.quadraticCurveTo(c.width - 24, c.height - 16, c.width - 24 - radius, c.height - 16);
  ctx.lineTo(24 + radius, c.height - 16);
  ctx.quadraticCurveTo(24, c.height - 16, 24, c.height - 16 - radius);
  ctx.lineTo(24, 16 + radius);
  ctx.quadraticCurveTo(24, 16, 24 + radius, 16);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.font = '600 24px "Space Grotesk", sans-serif';
  ctx.fillStyle = '#e6f1ff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, c.width / 2, c.height / 2 + 1);

  const texture = new THREE.CanvasTexture(c);
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false }));
  sprite.position.set(pos.x, pos.y + 2.05, pos.z);
  sprite.scale.set(c.width / 108, 0.96, 1);
  allLabels.push(sprite);
  return sprite;
}

// ── Posicionamento dos Componentes ──
for (const [id, data] of Object.entries(COMP_DATA)) {
  const builder = BUILDERS[id];
  if (!builder) {
    console.warn(`[3D] Builder não encontrado para: ${id}`);
    continue;
  }

  try {
    const group = builder();
    group.position.set(data.pos[0], data.pos[1], data.pos[2]);
    group.userData = { id, ...data };
    scene.add(group);
    groups[id] = group;

    group.traverse(child => {
      if (child.isMesh) {
        child.userData = { id, ...data };
        clickTargets.push(child);
      }
    });

    const bb = new THREE.Box3().setFromObject(group);
    const center = bb.getCenter(new THREE.Vector3());

    componentZones[id] = {
      edgeMinX: bb.min.x,
      edgeMaxX: bb.max.x,
      edgeMinZ: bb.min.z,
      edgeMaxZ: bb.max.z,
      centerX: center.x,
      centerZ: center.z,
    };

    const labelText = data.name.split('—')[0].split('🆕')[0].trim();
    scene.add(makeLabel(labelText, { x: data.pos[0], y: bb.max.y, z: data.pos[2] }));
  } catch (err) {
    console.error(`[3D] Erro ao construir ${id}:`, err);
  }
}

// ── Roteamento Ortogonal Geométrico ──
// Rotas limpas L ou Z (máx. 4 pontos), sem A*, sem zigzag

function getExitSide(fromId, toId) {
  const f = componentZones[fromId];
  const t = componentZones[toId];
  const dx = t.centerX - f.centerX;
  const dz = t.centerZ - f.centerZ;
  if (Math.abs(dx) >= Math.abs(dz)) return dx >= 0 ? 'right' : 'left';
  return dz >= 0 ? 'bottom' : 'top';
}

function isHSide(side) { return side === 'left' || side === 'right'; }

// Atribui t (0..1) único a cada fio por borda de componente,
// ordenado pela posição transversal do alvo — evita cruzamentos.
function buildLaneAssignments() {
  const edgeWires = {}; // "compId:side" → [{wi, isFrom, sortKey}]
  for (let wi = 0; wi < WIRES.length; wi++) {
    const w = WIRES[wi];
    const fSide = getExitSide(w.from, w.to);
    const tSide = getExitSide(w.to,   w.from);
    const fk = `${w.from}:${fSide}`;
    const tk = `${w.to}:${tSide}`;
    if (!edgeWires[fk]) edgeWires[fk] = [];
    if (!edgeWires[tk]) edgeWires[tk] = [];
    const toC = componentZones[w.to];
    const frC = componentZones[w.from];
    // sortKey = posição transversal do outro componente
    edgeWires[fk].push({ wi, isFrom: true,  sortKey: isHSide(fSide) ? toC.centerZ : toC.centerX });
    edgeWires[tk].push({ wi, isFrom: false, sortKey: isHSide(tSide) ? frC.centerZ : frC.centerX });
  }
  const laneT = {};
  for (const entries of Object.values(edgeWires)) {
    entries.sort((a, b) => a.sortKey - b.sortKey);
    const n = entries.length;
    const padding = 1 / (n + 1);
    entries.forEach((e, i) => {
      laneT[`${e.wi}:${e.isFrom ? 'f' : 't'}`] = padding * (i + 1);
    });
  }
  return laneT;
}

// ── Distribuição das âncoras na borda dos componentes ──
function getAnchor(compId, side, t, y) {
  const z = componentZones[compId];
  const gap = 0.55; 
  const sx  = z.edgeMaxX - z.edgeMinX;
  const sz  = z.edgeMaxZ - z.edgeMinZ;
  
  // padding mais limpo para os conectores
  switch (side) {
    case 'left':   return new THREE.Vector3(z.edgeMinX - gap, y, z.edgeMinZ + t * sz);
    case 'right':  return new THREE.Vector3(z.edgeMaxX + gap, y, z.edgeMinZ + t * sz);
    case 'top':    return new THREE.Vector3(z.edgeMinX + t * sx, y, z.edgeMinZ - gap);
    case 'bottom': return new THREE.Vector3(z.edgeMinX + t * sx, y, z.edgeMaxZ + gap);
  }
}

// ── Verificação de obstaculoos em segmentos ──
function hSegClear(x1, x2, z, ignoreIds) {
  const lo = Math.min(x1, x2), hi = Math.max(x1, x2);
  const M = 1.0;
  for (const [id, zone] of Object.entries(componentZones)) {
    if (ignoreIds.has(id)) continue;
    if (hi > zone.edgeMinX - M && lo < zone.edgeMaxX + M &&
        z  > zone.edgeMinZ - M && z  < zone.edgeMaxZ + M) return false;
  }
  return true;
}

function vSegClear(x, z1, z2, ignoreIds) {
  const lo = Math.min(z1, z2), hi = Math.max(z1, z2);
  const M = 1.0;
  for (const [id, zone] of Object.entries(componentZones)) {
    if (ignoreIds.has(id)) continue;
    if (x  > zone.edgeMinX - M && x  < zone.edgeMaxX + M &&
        hi > zone.edgeMinZ - M && lo < zone.edgeMaxZ + M) return false;
  }
  return true;
}

function routeClear(pts, ignoreIds) {
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    if (Math.abs(a.x - b.x) >= Math.abs(a.z - b.z)) {
      if (!hSegClear(a.x, b.x, a.z, ignoreIds)) return false;
    } else {
      if (!vSegClear(a.x, a.z, b.z, ignoreIds)) return false;
    }
  }
  return true;
}

// Roteador ortogonal com desvio de obstáculos
function buildRoute(start, end, ignoredIds, wireSpread) {
  const y = start.y;
  const sp = wireSpread || 0;

  // L-shapes melhorados com offset lateral para garantir distanciamento
  const cornerAX = (start.z !== end.z) ? end.x + sp : end.x;
  const optA = [start, new THREE.Vector3(cornerAX, y, start.z), new THREE.Vector3(cornerAX, y, end.z), end];
  if (routeClear(optA, ignoredIds)) return optA;

  const cornerBZ = (start.x !== end.x) ? end.z + sp : end.z;
  const optB = [start, new THREE.Vector3(start.x, y, cornerBZ), new THREE.Vector3(end.x, y, cornerBZ), end];
  if (routeClear(optB, ignoredIds)) return optB;

  // Z-shapes baseados no trunk esquerdo/direito da central, caso falhem linhas diretas
  const heltecMinX = componentZones['heltec_ext'].edgeMinX - 3.0; 
  const heltecMaxX = componentZones['heltec_ext'].edgeMaxX + 3.0; 
  
  const trunkX = (start.x < componentZones['heltec_ext'].centerX) ? heltecMinX - sp : heltecMaxX + sp;

  const offsets = [0, 2, -2, 3.5, -3.5, 5, -5, 7, -7, 9, -9];
  for (const off of offsets) {
    const corridor = trunkX + off;
    const zA = [start, new THREE.Vector3(corridor, y, start.z), new THREE.Vector3(corridor, y, end.z), end];
    if (routeClear(zA, ignoredIds)) return zA;
  }
  
  const cx = (start.x + end.x) * 0.5;
  const cz = (start.z + end.z) * 0.5;
  // Fallback antigo caso trunkX falhe 
  for (const off of offsets) {
      const corridor = off + sp;
      const zB = [start, new THREE.Vector3(start.x, y, cz + corridor), new THREE.Vector3(end.x, y, cz + corridor), end];
      if (routeClear(zB, ignoredIds)) return zB;
  }

  return optA; // fallback
}

// Insere um micro-fillet em cada canto ortogonal para o TubeGeometry dobrar
// suavemente. r = raio do arco; arcs = nº de pontos no arco.
function filletCorners(pts, r, arcs) {
  if (pts.length <= 2) return pts;
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    if (i === 0 || i === pts.length - 1) { out.push(pts[i]); continue; }
    const prev = pts[i - 1];
    const curr = pts[i];
    const next = pts[i + 1];
    // vetores unitários em/out
    const d0 = new THREE.Vector3().subVectors(curr, prev).normalize();
    const d1 = new THREE.Vector3().subVectors(next, curr).normalize();
    const len0 = prev.distanceTo(curr);
    const len1 = curr.distanceTo(next);
    const safeR = Math.min(r, len0 * 0.45, len1 * 0.45);
    const yy = curr.y;
    const p0 = new THREE.Vector3(curr.x - d0.x * safeR, yy, curr.z - d0.z * safeR);
    const p1 = new THREE.Vector3(curr.x + d1.x * safeR, yy, curr.z + d1.z * safeR);
    out.push(p0);
    // arco quadrático via pontos intermediários
    for (let s = 1; s < arcs; s++) {
      const t2 = s / arcs;
      const t1 = 1 - t2;
      out.push(new THREE.Vector3(
        t1 * t1 * p0.x + 2 * t1 * t2 * curr.x + t2 * t2 * p1.x, yy,
        t1 * t1 * p0.z + 2 * t1 * t2 * curr.z + t2 * t2 * p1.z,
      ));
    }
    out.push(p1);
  }
  return out;
}

const wireNodes = {};     // Holds all interactive points: { wi: [Vector3, Vector3, ...] }
const wireMeshes = {};    // Holds Three.js objects [tube, line, handles...]

// Geometria e material compartilhados para os handles (nós arrastáveis)
const _sharedHandleGeo = new THREE.BoxGeometry(0.5, 0.3, 0.5);
const _sharedHandleMat = new THREE.MeshBasicMaterial({
  color: 0xffffff, transparent: true, opacity: 0.15, depthTest: false
});

function clearWireMeshes(wi) {
  if (wireMeshes[wi]) {
    wireMeshes[wi].forEach(obj => {
      scene.remove(obj);
      // Handles compartilham geometria/material — não dispor
      if (!(obj.userData && obj.userData.isWireHandle)) {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach(m => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      }
      // Remove from wireGroups array if it's there
      if (obj.userData && obj.userData.bus) {
        const arr = wireGroups[obj.userData.bus];
        if (arr) {
          const idx = arr.indexOf(obj);
          if (idx > -1) arr.splice(idx, 1);
        }
      }
    });
  }
  wireMeshes[wi] = [];
}

// Em vez de fire-and-forget, criamos via um render que permite reconstrução on-the-fly
function createTrail(wi, wire, pulseOffset) {
  clearWireMeshes(wi);
  const pts = wireNodes[wi];
  if (!pts || pts.length < 2) return;

  const col = BUS_COLORS[wire.bus];
  const raw = pts.map(p => new THREE.Vector3(p.x, p.y, p.z));
  
  // Respeitar estado do toggle de handles
  const handlesVisible = document.getElementById('tog-handles')
    ? document.getElementById('tog-handles').checked
    : true;

  pts.forEach((p, idx) => {
    const handle = new THREE.Mesh(_sharedHandleGeo, _sharedHandleMat);
    handle.position.copy(p);
    handle.userData = { isWireHandle: true, wi, idx, bus: wire.bus };
    handle.renderOrder = 999;
    handle.visible = handlesVisible;
    scene.add(handle);
    wireMeshes[wi].push(handle);
  });

  const filleted = filletCorners(raw, 0.28, 6);
  const curve = new THREE.CatmullRomCurve3(filleted, false, 'catmullrom', 0.0);
  const divisions = Math.max(filleted.length * 4, 32);

  const tubeMat = new THREE.MeshStandardMaterial({
    color: col,
    emissive: col,
    emissiveIntensity: 0.55,
    transparent: true,
    opacity: 0.36,
    roughness: 0.58,
    metalness: 0.04,
    depthWrite: false,
  });
  tubeMat.userData = { baseOpacity: 0.36, pulseAmplitude: 0.14, baseEmissive: 0.55 };

  // Usamos curvatura de wire também como HitBox grosso para Duplo Clique
  const tube = new THREE.Mesh(
    new THREE.TubeGeometry(curve, divisions, 0.15, 8, false), // Tubo ligeiramente mais grosso pro drag/hit
    tubeMat
  );
  tube.userData = { isWireTube: true, wi, bus: wire.bus, pulseOffset };
  tube.renderOrder = 2;
  scene.add(tube);
  wireGroups[wire.bus].push(tube);
  wireMeshes[wi].push(tube);

  const linePoints = curve.getPoints(divisions);
  const lineGeo = new THREE.BufferGeometry().setFromPoints(
    linePoints.map(p => new THREE.Vector3(p.x, p.y + 0.028, p.z))
  );
  const lineMat = new THREE.LineBasicMaterial({
    color: col,
    transparent: true,
    opacity: 0.88,
    depthWrite: false,
  });
  lineMat.userData = { baseOpacity: 0.88, pulseAmplitude: 0.10 };

  const line = new THREE.Line(lineGeo, lineMat);
  line.userData = { bus: wire.bus, pulseOffset: pulseOffset + 0.8 };
  line.renderOrder = 3;
  scene.add(line);
  wireGroups[wire.bus].push(line);
  wireMeshes[wi].push(line);

  // Respeitar toggle de barramento ao recriar fios (ex: durante drag)
  const busChk = document.getElementById('tog-' + wire.bus);
  if (busChk && !busChk.checked) {
    tube.visible = false;
    line.visible = false;
  }
}

// ── Execução do Roteamento ──
const laneT = buildLaneAssignments();

// Contar fios por bus para calcular spread
const busWireIdx = {};
for (const bus of Object.keys(BUS_COLORS)) busWireIdx[bus] = 0;

for (let wi = 0; wi < WIRES.length; wi++) {
  const wire = WIRES[wi];
  if (!groups[wire.from] || !groups[wire.to]) continue;
  
  if (wire.customRoute) {
    // Se tiver rota customizada gravada, usa direto:
    wireNodes[wi] = wire.customRoute.map(p => new THREE.Vector3(p.x, p.y, p.z));
    createTrail(wi, wire, wi * 0.63);
    continue;
  }
  
  const busY = BUS_Y[wire.bus] || DEFAULT_Y;
  const fSide = getExitSide(wire.from, wire.to);
  const tSide = getExitSide(wire.to,   wire.from);
  const ignoredIds = new Set([wire.from, wire.to]);
  const start = getAnchor(wire.from, fSide, laneT[`${wi}:f`] ?? 0.5, busY);
  const end   = getAnchor(wire.to,   tSide, laneT[`${wi}:t`] ?? 0.5, busY);
  
  // Spread único: cada fio do mesmo bus recebe offset incremental
  const idx = busWireIdx[wire.bus]++;
  const wireSpread = (idx - 2) * 0.55;
  
  // Guardamos as rotas e então mandamos renderizar:
  wireNodes[wi] = buildRoute(start, end, ignoredIds, wireSpread);
  createTrail(wi, wire, wi * 0.63);
}

// ── Manipulação e Drag & Drop de Fios ──
let draggedNodeInfo = null; // { wi, idx, startY }
const dragRaycaster = new THREE.Raycaster();
const dragPlaneGlobal = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

renderer.domElement.addEventListener('pointerdown', e => {
  if (e.button !== 0) return; // apenas botão esquerdo
  const mx = (e.clientX / innerWidth) * 2 - 1;
  const my = -(e.clientY / innerHeight) * 2 + 1;
  dragRaycaster.setFromCamera({ x: mx, y: my }, camera);

  // Pegar todos os handles visíveis
  const handles = [];
  Object.values(wireMeshes).forEach(arr => {
    handles.push(...arr.filter(o => o.userData && o.userData.isWireHandle));
  });

  const hits = dragRaycaster.intersectObjects(handles);
  if (hits.length > 0) {
    const ob = hits[0].object;
    draggedNodeInfo = {
      wi: ob.userData.wi,
      idx: ob.userData.idx,
      yPos: ob.position.y // fixa no plano dessa altura Y
    };
    if (typeof controls !== 'undefined') controls.enabled = false;
  }
});

window.addEventListener('pointermove', e => {
  if (!draggedNodeInfo) return;
  const mx = (e.clientX / innerWidth) * 2 - 1;
  const my = -(e.clientY / innerHeight) * 2 + 1;
  dragRaycaster.setFromCamera({ x: mx, y: my }, camera);

  dragPlaneGlobal.constant = -draggedNodeInfo.yPos; // ajusta o plano para y = yPos
  const intersect = new THREE.Vector3();
  if (dragRaycaster.ray.intersectPlane(dragPlaneGlobal, intersect)) {
    const pts = wireNodes[draggedNodeInfo.wi];
    const idx = draggedNodeInfo.idx;
    if (pts && pts[idx]) {
      let tx = intersect.x;
      let tz = intersect.z;
      
      // Efeito de alinhamento magnético ("Snap" ortogonal) 
      const snapDist = 1.2; // Sensibilidade do ímã (aumentada para facilitar alinhamento)
      const neighbors = [];
      if (idx > 0) neighbors.push(pts[idx - 1]);
      if (idx < pts.length - 1) neighbors.push(pts[idx + 1]);

      // Alinha aos eixos dos pontos vizinhos se o mouse estiver perto
      for (const nb of neighbors) {
        if (Math.abs(tx - nb.x) < snapDist) tx = nb.x;
        if (Math.abs(tz - nb.z) < snapDist) tz = nb.z;
      }

      pts[idx].x = tx;
      pts[idx].z = tz;
      createTrail(draggedNodeInfo.wi, WIRES[draggedNodeInfo.wi], draggedNodeInfo.wi * 0.63);
    }
  }
});

window.addEventListener('pointerup', () => {
  if (draggedNodeInfo) {
    draggedNodeInfo = null;
    if (typeof controls !== 'undefined') controls.enabled = true;
  }
});

renderer.domElement.addEventListener('dblclick', e => {
  const mx = (e.clientX / innerWidth) * 2 - 1;
  const my = -(e.clientY / innerHeight) * 2 + 1;
  dragRaycaster.setFromCamera({ x: mx, y: my }, camera);

  const interactables = [];
  Object.values(wireMeshes).forEach(arr => {
    interactables.push(...arr.filter(o => o.userData && (o.userData.isWireHandle || o.userData.isWireTube)));
  });

  const hits = dragRaycaster.intersectObjects(interactables);
  if (hits.length === 0) return;

  const d = hits[0].object.userData;

  if (d.isWireHandle) {
    // Duplo clique na dobra = remover. Exceto pontas (0 e length-1)
    const pts = wireNodes[d.wi];
    if (pts && d.idx > 0 && d.idx < pts.length - 1) {
      pts.splice(d.idx, 1);
      createTrail(d.wi, WIRES[d.wi], d.wi * 0.63);
    }
  } else if (d.isWireTube) {
    // Duplo clique no fio = add dobra
    const pts = wireNodes[d.wi];
    if (!pts) return;
    const hitPt = hits[0].point;
    
    // Qual segmento cortaremos? Achar menor distância de hitPt pra reta P[i]->P[i+1]
    let closestIdx = 0;
    let minD = Infinity;
    for (let i = 0; i < pts.length - 1; i++) {
        const line3 = new THREE.Line3(pts[i], pts[i+1]);
        const testPt = new THREE.Vector3();
        line3.closestPointToPoint(hitPt, true, testPt);
        const dist = testPt.distanceTo(hitPt);
        if (dist < minD) {
            minD = dist;
            closestIdx = i;
        }
    }
    // Inserir clone do hitpoint no mesmo plano Y do segmento original 
    const novoPonto = hitPt.clone();
    novoPonto.y = pts[closestIdx].y; // Manter no mesmo plano do barramento
    pts.splice(closestIdx + 1, 0, novoPonto);
    createTrail(d.wi, WIRES[d.wi], d.wi * 0.63);
  }
});

// ── Exportação de Rotas (Para salvar as edições) ──
window.addEventListener('keydown', e => {
  // Ignora se estiver digitando em um input/textarea
  const tag = (e.target.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;

  if (e.key.toLowerCase() === 'e') {
    const exportData = WIRES.map((wire, wi) => {
      const wExport = { ...wire };
      if (wireNodes[wi]) {
        // Arredonda os valores para ficar um código limpo
        wExport.customRoute = wireNodes[wi].map(p => ({
          x: Number(p.x.toFixed(3)),
          y: Number(p.y.toFixed(3)),
          z: Number(p.z.toFixed(3))
        }));
      }
      return wExport;
    });

    const jsonStr = "const WIRES = " + JSON.stringify(exportData, null, 2) + ";";
    navigator.clipboard.writeText(jsonStr).then(() => {
      console.log('✅ Novas rotas copiadas pro clipboard!');
      alert('As coordenadas das ligações editadas foram copiadas para a sua área de transferência (Clipboard)!\n\nAgora é só colar no arquivo components-data.js por cima do array "const WIRES = [...]".');
    }).catch(err => {
      console.error('Falha ao copiar rotas: ', err);
    });
  }
});

// ── Raycaster e Seleção ──
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let selectedGroup = null;

renderer.domElement.addEventListener('click', e => {
  mouse.x = (e.clientX / innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  // ── Verificar clique no Dashboard (ESP32-P4 screen) ──
  if (typeof Dashboard !== 'undefined') {
    const dashMesh = Dashboard.getScreenMesh();
    if (dashMesh && dashMesh.parent) {
      // Garantir worldMatrix atualizada (essencial após reposicionamento no showcase)
      dashMesh.updateMatrixWorld(true);

      // 1) Hit direto no PlaneGeometry da tela
      const dashHits = raycaster.intersectObject(dashMesh, false);
      if (dashHits.length > 0 && dashHits[0].uv) {
        if (Dashboard.handleClick(dashHits[0].uv)) return;
      }

      // 2) Fallback: hit no vidro/glass isDashboard → projetar para UV via worldToLocal
      const allHits = raycaster.intersectObjects(scene.children, true);
      for (const hit of allHits) {
        if (hit.object.userData && hit.object.userData.isDashboard && hit.object !== dashMesh) {
          const localPt = dashMesh.worldToLocal(hit.point.clone());
          const geo = dashMesh.geometry;
          const w = geo.parameters.width, h = geo.parameters.height;
          const u = (localPt.x / w) + 0.5;
          const v = (localPt.y / h) + 0.5;
          if (u >= 0 && u <= 1 && v >= 0 && v <= 1) {
            if (Dashboard.handleClick({ x: u, y: v })) return;
          }
        }
      }
    }
  }

  const hits = raycaster.intersectObjects(clickTargets);
  if (hits.length === 0) return;

  const d = hits[0].object.userData;

  if (selectedGroup) {
    selectedGroup.traverse(c => {
      if (c.isMesh && c.material.emissive) {
        c.material.emissiveIntensity = c.material.userData?.origE || 0.08;
      }
    });
  }

  const grp = groups[d.id];
  grp.traverse(c => {
    if (c.isMesh && c.material.emissive) {
      if (!c.material.userData) c.material.userData = {};
      c.material.userData.origE = c.material.emissiveIntensity;
      c.material.emissiveIntensity = 0.5;
    }
  });
  selectedGroup = grp;

  const tags = (d.tags || []).map(t => `<span class="tag tag-${t}">${t.toUpperCase()}</span>`).join('');
  document.getElementById('panel-title').textContent = d.name;
  document.getElementById('panel-detail').innerHTML = `${tags ? `<div class="tag-group">${tags}</div>` : ''}<div class="detail-copy">${d.info}</div>`;
});

renderer.domElement.addEventListener('mousemove', e => {
  mouse.x = (e.clientX / innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  // Dashboard hover
  if (typeof Dashboard !== 'undefined') {
    const dashMesh = Dashboard.getScreenMesh();
    if (dashMesh && dashMesh.parent) {
      dashMesh.updateMatrixWorld(true);

      const dashHits = raycaster.intersectObject(dashMesh, false);
      if (dashHits.length > 0 && dashHits[0].uv) {
        Dashboard.handleHover(dashHits[0].uv);
        renderer.domElement.style.cursor = 'pointer';
        return;
      }
      // Fallback: hit em vidro/glass isDashboard
      const allHits = raycaster.intersectObjects(scene.children, true);
      for (const hit of allHits) {
        if (hit.object.userData && hit.object.userData.isDashboard && hit.object !== dashMesh) {
          const localPt = dashMesh.worldToLocal(hit.point.clone());
          const geo = dashMesh.geometry;
          const w = geo.parameters.width, h = geo.parameters.height;
          const u = (localPt.x / w) + 0.5;
          const v = (localPt.y / h) + 0.5;
          if (u >= 0 && u <= 1 && v >= 0 && v <= 1) {
            Dashboard.handleHover({ x: u, y: v });
            renderer.domElement.style.cursor = 'pointer';
            return;
          }
        }
      }
      Dashboard.handleHover(null);
    }
  }

  renderer.domElement.style.cursor = raycaster.intersectObjects(clickTargets).length > 0 ? 'pointer' : 'grab';
});

function toggleBus(bus) {
  const visible = document.getElementById('tog-' + bus).checked;
  wireGroups[bus].forEach(item => {
    item.visible = visible;
  });
}

function toggleLabels() {
  const visible = document.getElementById('tog-labels').checked;
  allLabels.forEach(label => {
    label.visible = visible;
  });
}

function toggleHandles() {
  const visible = document.getElementById('tog-handles').checked;
  Object.values(wireMeshes).forEach(arr => {
    arr.forEach(obj => {
      if (obj.userData && obj.userData.isWireHandle) {
        obj.visible = visible;
      }
    });
  });
}

window.groups = groups;
window.wireGroups = wireGroups;
window.toggleBus = toggleBus;
window.toggleLabels = toggleLabels;
window.toggleHandles = toggleHandles;

function take8kScreenshot() {
  const btn = document.getElementById('btn-print-8k');
  if (btn) btn.innerHTML = '<span style="color:#000">â ³</span> Processando...';
  
  // Pequeno timeout para dar tempo da UI atualizar pra "Processando"
  setTimeout(() => {
    try {
      const maxTex = renderer.capabilities.maxTextureSize;
      
      let width = 7680;
      let height = 4320;

      // Se a GPU nao suportar 8K, cai para o maximo suportado
      if (maxTex < 7680) {
        console.warn("A placa de vÃ­deo nÃ£o suporta texturas 8K! Usando o mÃ¡ximo suportado:", maxTex);
        const aspect = 7680 / 4320;
        width = maxTex;
        height = Math.floor(maxTex / aspect);
      }

      // Guardar status original
      const originalWidth = window.innerWidth;
      const originalHeight = window.innerHeight;
      const originalAspect = camera.aspect;
      const originalPixelRatio = renderer.getPixelRatio();
      
      // Setup para high-res (forÃ§ar ratio 1 para nÃ£o multiplicar e passar de 16k no Mac/Retina)
      renderer.setPixelRatio(1);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      
      // ForÃ§ar a renderizaÃ§Ã£o sÃ­ncrona deste quadro gigante
      renderer.render(scene, camera);
      
      // Gerar PNG
      const dataURL = renderer.domElement.toDataURL('image/png');
      
      // Restaurar valores originais
      renderer.setPixelRatio(originalPixelRatio);
      renderer.setSize(originalWidth, originalHeight);
      camera.aspect = originalAspect;
      camera.updateProjectionMatrix();
      
      // Criar o download
      const link = document.createElement('a');
      link.download = `estacao_ambiental_render_${width}x${height}.png`;
      link.href = dataURL;
      link.click();
    } catch(err) {
      console.error(err);
      alert("Ocorreu um erro ao gerar o print 8K. MemÃ³ria GPU insuficiente?");
    }
    
    if (btn) btn.innerHTML = 'ðŸ“· Tirar Print 8K';
  }, 150);
}

window.take8kScreenshot = take8kScreenshot;

