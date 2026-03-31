// ══════════════════════════════════════════════════
// app.js — Loop de Animação Principal
// ══════════════════════════════════════════════════

let t = 0;

function animate() {
  requestAnimationFrame(animate);
  t += 0.01;
  controls.update();

  // Anemômetro: rotação das conchas + oscilação da biruta
  const anemo = groups['anemometro'];
  if (anemo) {
    const cups = anemo.getObjectByName('cups');
    if (cups) cups.rotation.y -= 0.08;
    const vane = anemo.getObjectByName('vane');
    if (vane) vane.rotation.y = Math.sin(t * 0.5) * 0.3 + Math.PI / 4;
  }

  // SEN66: rotação do ventilador
  const sen = groups['sen66'];
  if (sen) {
    const fan = sen.getObjectByName('sen_fan');
    if (fan) fan.rotation.y -= 0.25;
  }

  // Pulso nos fios
  for (const lines of Object.values(wireGroups)) {
    lines.forEach(item => {
      if (!item.material) return;

      const baseOpacity = item.material.userData?.baseOpacity ?? item.material.opacity ?? 1;
      const pulseAmplitude = item.material.userData?.pulseAmplitude ?? 0.08;
      const pulse = 0.5 + 0.5 * Math.sin(t * 2.2 + (item.userData?.pulseOffset || 0));

      item.material.opacity = baseOpacity + pulseAmplitude * pulse;

      if (typeof item.material.emissiveIntensity === 'number') {
        const baseEmissive = item.material.userData?.baseEmissive ?? item.material.emissiveIntensity;
        item.material.emissiveIntensity = baseEmissive + 0.08 * pulse;
      }
    });
  }

  // Dashboard do ESP32-P4 (atualiza a cada 3 frames)
  if (typeof updateESP32Screen === 'function') {
    updateESP32Screen();
  }

  // Showcase mode (rotação/animação)
  if (typeof Showcase !== 'undefined' && Showcase.update) {
    Showcase.update();
  }

  renderer.render(scene, camera);
}

animate();

// Inicializar Showcase Mode
if (typeof Showcase !== 'undefined' && Showcase.init) {
  Showcase.init();
}
