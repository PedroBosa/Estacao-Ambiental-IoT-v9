// ══════════════════════════════════════════════════
// materials.js — Sistema de materiais com cache
// ══════════════════════════════════════════════════

const M = THREE;
const PI = Math.PI;

/**
 * Cache de materiais para evitar duplicação na GPU.
 * Chave = hash dos parâmetros, Valor = MeshPhysicalMaterial.
 */
const _materialCache = new Map();

/**
 * Cria ou reutiliza um MeshPhysicalMaterial.
 *
 * Aceita tanto shorthand quanto nomes completos:
 *   - m / metalness
 *   - r / roughness
 *   - e / emissiveIntensity
 *   - cc / clearcoat
 *   - o / opacity
 *   - side
 *
 * @param {number} color - Cor hexadecimal (ex: 0xff0000)
 * @param {object} opts  - Opções do material
 * @returns {THREE.MeshPhysicalMaterial}
 */
function mat(color, opts = {}) {
  const metalness       = opts.m         ?? opts.metalness       ?? 0.2;
  const roughness       = opts.r         ?? opts.roughness       ?? 0.4;
  const emissiveIntensity = opts.e       ?? opts.emissiveIntensity ?? 0.08;
  const clearcoat       = opts.cc        ?? opts.clearcoat       ?? 0;
  const opacity         = opts.o         ?? opts.opacity         ?? 1;
  const transparent     = opacity < 1;
  const side            = opts.side      ?? M.FrontSide;

  // Gerar chave de cache
  const key = `${color}_${metalness}_${roughness}_${emissiveIntensity}_${clearcoat}_${opacity}_${side}`;

  if (_materialCache.has(key)) {
    return _materialCache.get(key);
  }

  const material = new M.MeshPhysicalMaterial({
    color,
    metalness,
    roughness,
    emissive: color,
    emissiveIntensity,
    clearcoat,
    transparent,
    opacity,
    side,
  });

  _materialCache.set(key, material);
  return material;
}

/**
 * Percorre uma hierarquia e ativa castShadow/receiveShadow em todos os meshes.
 */
function setCastShadow(root) {
  root.traverse(child => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  return root;
}

// Disponibilizar globalmente
window.M = M;
window.PI = PI;
window.mat = mat;
window.setCastShadow = setCastShadow;
