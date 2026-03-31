// ══════════════════════════════════════════════════
// scene.js — Configuração da cena Three.js
// ══════════════════════════════════════════════════

// ── Cena e Câmera ──
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x070b16);
scene.fog = new THREE.FogExp2(0x070b16, 0.0054);

const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 500);
camera.position.set(28, 22, 32);

// ── Renderer ──
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.physicallyCorrectLights = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
document.body.appendChild(renderer.domElement);

// ── Controles Orbitais ──
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(0, 3, 0);
controls.enableZoom = false;
controls.panSpeed = 1.0;
controls.maxDistance = 150;

// Zoom linear customizado (independente da distância)
renderer.domElement.addEventListener('wheel', e => {
  e.preventDefault();
  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  const speed = 1.8;
  const step = e.deltaY > 0 ? -speed : speed;

  // No showcase, só mover câmera (manter target fixo no componente)
  if (window.Showcase && window.Showcase.isActive()) {
    const newPos = camera.position.clone().addScaledVector(dir, step);
    const distToTarget = newPos.distanceTo(controls.target);
    if (distToTarget > 1.5 && distToTarget < 80) {
      camera.position.copy(newPos);
    }
  } else {
    camera.position.addScaledVector(dir, step);
    controls.target.addScaledVector(dir, step);
  }
  controls.update();
}, { passive: false });

// ── Iluminação ──
scene.add(new THREE.HemisphereLight(0x8fb7ff, 0x06070c, 1.4));

const dirLight = new THREE.DirectionalLight(0xf6fbff, 2.8);
dirLight.position.set(20, 30, 15);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(2048, 2048);
dirLight.shadow.camera.left = -35;
dirLight.shadow.camera.right = 35;
dirLight.shadow.camera.top = 35;
dirLight.shadow.camera.bottom = -35;
dirLight.shadow.camera.near = 1;
dirLight.shadow.camera.far = 90;
dirLight.shadow.bias = -0.0002;
scene.add(dirLight);

const rimLight = new THREE.DirectionalLight(0x4f9dff, 1.4);
rimLight.position.set(-22, 14, -18);
scene.add(rimLight);

const accentLight = new THREE.PointLight(0x65c8ff, 22, 120, 2);
accentLight.position.set(0, 14, 12);
scene.add(accentLight);

const warmFill = new THREE.PointLight(0xffb05d, 10, 90, 2);
warmFill.position.set(18, 8, -10);
scene.add(warmFill);

// ── Chão e Grid ──
const floor = new THREE.Mesh(
  new THREE.CircleGeometry(42, 72),
  new THREE.MeshStandardMaterial({ color: 0x080d18, roughness: 0.88, metalness: 0.14 })
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.02;
floor.receiveShadow = true;
scene.add(floor);

// Anéis decorativos concêntricos (efeito radar)
[
  { r: 7,  w: 0.10, op: 0.22 },
  { r: 13, w: 0.08, op: 0.16 },
  { r: 20, w: 0.07, op: 0.11 },
  { r: 28, w: 0.06, op: 0.07 },
].forEach(({ r, w, op }) => {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(r - w, r + w, 80),
    new THREE.MeshBasicMaterial({ color: 0x2255aa, transparent: true, opacity: op, side: THREE.DoubleSide })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.001;
  scene.add(ring);
});

// Halo central difuso
const halo = new THREE.Mesh(
  new THREE.CircleGeometry(10, 64),
  new THREE.MeshBasicMaterial({ color: 0x1a3c78, transparent: true, opacity: 0.08, side: THREE.DoubleSide })
);
halo.rotation.x = -Math.PI / 2;
halo.position.y = 0.005;
scene.add(halo);

const grid = new THREE.GridHelper(80, 40, 0x1a2a44, 0x111a2a);
grid.material.transparent = true;
grid.material.opacity = 0.8;
scene.add(grid);

// ── Resize Handler ──
window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// Exportar para outros módulos
window.scene = scene;
window.camera = camera;
window.renderer = renderer;
window.controls = controls;
