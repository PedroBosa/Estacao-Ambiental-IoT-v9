// ══════════════════════════════════════════════════
// primitives.js — Blocos construtivos reutilizáveis
// ══════════════════════════════════════════════════

function addScrew(group, x, y, z, radius = 0.09, color = 0xbfc7d8) {
  const screw = new M.Group();
  const head = new M.Mesh(
    new M.CylinderGeometry(radius, radius * 1.08, 0.05, 16),
    mat(color, { m: 0.9, r: 0.22 })
  );
  const slot = new M.Mesh(
    new M.BoxGeometry(radius * 1.15, 0.012, 0.02),
    mat(0x5f6774, { m: 0.8, r: 0.35 })
  );
  slot.position.y = 0.026;
  screw.add(head, slot);
  screw.position.set(x, y, z);
  group.add(screw);
  return screw;
}

function addBoardPads(group, width, depth, y = 0.11) {
  const padM = mat(0xd8a53d, { m: 0.8, r: 0.26, e: 0.04 });
  for (const z of [-depth / 2 + 0.18, depth / 2 - 0.18]) {
    let xPos = -width / 2 + 0.45;
    while (xPos <= width / 2 - 0.3) {
      const pad = new M.Mesh(new M.BoxGeometry(0.18, 0.02, 0.06), padM);
      pad.position.set(xPos, y, z);
      group.add(pad);
      xPos += 0.55;
    }
  }
}

function addMountingPosts(group, positions, y = 0.12, radius = 0.11, height = 0.12, color = 0xb68a17) {
  const postM = mat(color, { m: 0.85, r: 0.24 });
  for (const [x, z] of positions) {
    const post = new M.Mesh(new M.CylinderGeometry(radius, radius, height, 16), postM);
    post.position.set(x, y + height / 2, z);
    group.add(post);
    addScrew(group, x, y + height + 0.01, z, radius * 0.85, 0xd8dee8);
  }
}

function addTerminalBlock(group, x, y, z, poles = 2, color = 0x2c8f5a) {
  const body = new M.Mesh(
    new M.BoxGeometry(poles * 0.34, 0.28, 0.45),
    mat(color, { r: 0.42, m: 0.18, e: 0.05 })
  );
  body.position.set(x, y, z);
  group.add(body);

  for (let i = 0; i < poles; i++) {
    const offset = -((poles - 1) * 0.17) + i * 0.34;
    const bore = new M.Mesh(
      new M.CylinderGeometry(0.06, 0.06, 0.12, 12),
      mat(0x2a2f38, { m: 0.4, r: 0.48 })
    );
    bore.rotation.x = PI / 2;
    bore.position.set(x + offset, y + 0.02, z + 0.19);
    group.add(bore);
    const clamp = new M.Mesh(
      new M.CylinderGeometry(0.05, 0.05, 0.08, 10),
      mat(0xd7d9de, { m: 0.84, r: 0.24 })
    );
    clamp.position.set(x + offset, y + 0.08, z - 0.06);
    group.add(clamp);
  }
}

function addHeatsink(group, x, y, z, fins = 5, width = 1, depth = 0.8) {
  const sinkBase = new M.Mesh(new M.BoxGeometry(width, 0.1, depth), mat(0x3e4248, { m: 0.62, r: 0.3 }));
  sinkBase.position.set(x, y, z);
  group.add(sinkBase);
  for (let i = 0; i < fins; i++) {
    const fin = new M.Mesh(
      new M.BoxGeometry(0.05, 0.34, depth * 0.88),
      mat(0x585c63, { m: 0.66, r: 0.28 })
    );
    fin.position.set(
      x - width / 2 + 0.12 + i * ((width - 0.24) / Math.max(1, fins - 1)),
      y + 0.22, z
    );
    group.add(fin);
  }
}

/**
 * Cria uma placa PCB genérica com bordas arredondadas,
 * acento dourado e silkscreen.
 */
function pcbBoard(w, h, d, color) {
  const g = new M.Group();

  const shape = new M.Shape();
  const r = 0.15;
  shape.moveTo(-w / 2 + r, -d / 2);
  shape.lineTo(w / 2 - r, -d / 2);
  shape.quadraticCurveTo(w / 2, -d / 2, w / 2, -d / 2 + r);
  shape.lineTo(w / 2, d / 2 - r);
  shape.quadraticCurveTo(w / 2, d / 2, w / 2 - r, d / 2);
  shape.lineTo(-w / 2 + r, d / 2);
  shape.quadraticCurveTo(-w / 2, d / 2, -w / 2, d / 2 - r);
  shape.lineTo(-w / 2, -d / 2 + r);
  shape.quadraticCurveTo(-w / 2, -d / 2, -w / 2 + r, -d / 2);

  const geo = new M.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false });
  const board = new M.Mesh(geo, mat(color, { r: 0.6 }));
  board.rotation.x = -PI / 2;
  g.add(board);

  const accent = new M.Mesh(
    new M.BoxGeometry(w - 0.22, 0.015, d - 0.22),
    mat(0xd8b254, { m: 0.75, r: 0.28, e: 0.03 })
  );
  accent.position.y = h + 0.01;
  g.add(accent);

  const silkscreen = new M.Mesh(
    new M.BoxGeometry(w - 0.35, 0.004, d - 0.35),
    mat(0xf2f6f8, { m: 0.08, r: 0.74, e: 0.02, o: 0.24 })
  );
  silkscreen.position.y = h + 0.016;
  g.add(silkscreen);

  return g;
}

function addChip(group, x, z, w, d, color) {
  const chip = new M.Mesh(
    new M.BoxGeometry(w, 0.12, d),
    mat(color || 0x111111, { m: 0.5, r: 0.3 })
  );
  chip.position.set(x, 0.25, z);
  group.add(chip);

  const top = new M.Mesh(
    new M.BoxGeometry(w * 0.72, 0.014, d * 0.72),
    mat(0x2b3138, { m: 0.18, r: 0.78, e: 0.02 })
  );
  top.position.set(x, 0.317, z);
  group.add(top);

  const legM = mat(0x888888, { m: 0.8 });
  for (let i = 0; i < 4; i++) {
    const leg = new M.Mesh(new M.BoxGeometry(0.05, 0.06, d + 0.15), legM);
    leg.position.set(x - w / 2 + 0.1 + i * ((w - 0.2) / 3), 0.19, z);
    group.add(leg);
  }

  const pinDot = new M.Mesh(
    new M.CylinderGeometry(0.03, 0.03, 0.015, 12),
    mat(0xd2d6dd, { m: 0.8, r: 0.22 })
  );
  pinDot.rotation.x = PI / 2;
  pinDot.position.set(x - w * 0.27, 0.318, z - d * 0.27);
  group.add(pinDot);
}

function addPinHeader(group, x, z, count, vertical) {
  const pinM = mat(0xcccc00, { m: 0.9, r: 0.2 });
  const baseM = mat(0x222222, { r: 0.8 });
  const base = new M.Mesh(
    new M.BoxGeometry(vertical ? 0.3 : count * 0.25, 0.25, vertical ? count * 0.25 : 0.3),
    baseM
  );
  base.position.set(x, 0.3, z);
  group.add(base);

  for (let i = 0; i < count; i++) {
    const pin = new M.Mesh(new M.CylinderGeometry(0.03, 0.03, 0.62, 4), pinM);
    if (vertical) pin.position.set(x, 0.38, z - count * 0.12 + i * 0.25);
    else pin.position.set(x - count * 0.12 + i * 0.25, 0.38, z);
    group.add(pin);
  }
}

function addUSB(group, x, z) {
  const shell = new M.Mesh(new M.BoxGeometry(0.54, 0.24, 0.38), mat(0xb5bcc5, { m: 0.82, r: 0.22 }));
  shell.position.set(x, 0.28, z);
  group.add(shell);

  const tongue = new M.Mesh(new M.BoxGeometry(0.28, 0.03, 0.14), mat(0x0f1118, { m: 0.12, r: 0.72 }));
  tongue.position.set(x + 0.06, 0.28, z);
  group.add(tongue);

  const cut = new M.Mesh(new M.BoxGeometry(0.1, 0.06, 0.24), mat(0x7f8792, { m: 0.68, r: 0.28 }));
  cut.position.set(x - 0.18, 0.28, z);
  group.add(cut);
}

function addLED(group, x, z, color) {
  const base = new M.Mesh(
    new M.CylinderGeometry(0.05, 0.05, 0.03, 10),
    mat(0xd8dce2, { m: 0.78, r: 0.26 })
  );
  base.position.set(x, 0.285, z);
  group.add(base);

  const led = new M.Mesh(
    new M.SphereGeometry(0.055, 12, 10),
    mat(color, { e: 0.65, cc: 0.9, o: 0.85, r: 0.12 })
  );
  led.scale.y = 0.72;
  led.position.set(x, 0.325, z);
  group.add(led);
}

// Disponibilizar globalmente
window.addScrew = addScrew;
window.addBoardPads = addBoardPads;
window.addMountingPosts = addMountingPosts;
window.addTerminalBlock = addTerminalBlock;
window.addHeatsink = addHeatsink;
window.pcbBoard = pcbBoard;
window.addChip = addChip;
window.addPinHeader = addPinHeader;
window.addUSB = addUSB;
window.addLED = addLED;
