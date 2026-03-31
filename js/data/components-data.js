// ══════════════════════════════════════════════════
// components-data.js — Dados dos componentes, fios e barramentos
// ══════════════════════════════════════════════════

const COMP_DATA = {
  heltec_ext: {
    name: 'Heltec LoRa32 V3 (Externo)',
    pos: [0, 0, 0],
    info: '<b>MCU:</b> ESP32-S3 · <b>LoRa:</b> SX1262 915MHz<br><b>I²C:</b> GPIO41(SDA)/GPIO42(SCL) — 6 dispositivos<br><b>UART1:</b> GPIO47(TX)/GPIO48(RX) → MAX485<br><b>I2S:</b> GPIO38/39/40 → ICS-43434<br><b>IRQ:</b> GPIO15(MISOL)·GPIO4(AS3935)·GPIO7(LTR390)<br><b>RS485 DE+RE:</b> GPIO6<br><b>Alimentação:</b> 5V via Buck DC-DC',
    tags: ['i2c', 'rs485', 'i2s', 'irq', 'lora'],
  },
  sen66: {
    name: 'SEN66 — PM/CO₂/VOC/NOx',
    pos: [-14, 0, -5],
    info: '<b>Sensirion</b> · <b>I²C:</b> 0x6B · JST-GH 6p<br><b>Mede:</b> PM1/2.5/4/10, CO₂(NDIR), T, UR, VOC, NOx<br><b>3.3V</b>(3.15–3.45V) · ~90mA ativo<br><b>🔴</b> Pin5/6 NÃO conectar · 3.3V obrigatório!',
    tags: ['i2c'],
  },
  bme690: {
    name: 'BME690 — T/UR/P/IAQ',
    pos: [-14, 0, 2],
    info: '<b>Bosch</b> · <b>I²C:</b> 0x76 (SDO=GND)<br><b>Mede:</b> T, UR, Pressão, VOC/IAQ(BSEC)<br><b>Config:</b> CS=3V3(I²C) · SDO=GND(0x76)<br><b>🔴</b> CS=HIGH obrigatório! BSEC 2.x!<br><b>🔧</b> Burn-in 24h',
    tags: ['i2c'],
  },
  sfa30: {
    name: 'SFA30 — HCHO/VOC',
    pos: [-14, 0, 9],
    info: '<b>Sensirion</b> · <b>I²C:</b> 0x5D · Molex 7p<br><b>Mede:</b> HCHO(±20ppb), VOC, T, UR<br><b>🔴 CRÍTICO:</b> SEL=GND ANTES de VDD!<br><b>Estabilização:</b> 1–2h HCHO',
    tags: ['i2c'],
  },
  ltr390: {
    name: 'LTR390 — UV/Lux',
    pos: [13, 0, -6],
    info: '<b>Lite-On</b> · <b>I²C:</b> 0x53<br><b>Mede:</b> UV-A→UVI, Visível→Lux<br><b>INT→GPIO7</b>(opcional)<br><b>⚠️</b> Exposição direta ao céu (PMMA)',
    tags: ['i2c', 'irq'],
  },
  as3935: {
    name: 'AS3935 — Raios',
    pos: [13, 0, 4],
    info: '<b>ams</b> · <b>I²C:</b> 0x03 (A0=A1=GND)<br><b>Detecta:</b> Raios 1–40km<br><b>IRQ→GPIO4</b> (borda subida)<br><b>Config:</b> CS=3V3, EN_V=3V3<br><b>⚠️</b> Mín. 10cm do SEN66',
    tags: ['i2c', 'irq'],
  },
  solo: {
    name: 'Solo Capacitivo I²C',
    pos: [13, 0, 11],
    info: '<b>STEMMA Soil</b> · <b>I²C:</b> 0x36<br><b>Mede:</b> Umidade(200–2000), T solo(±2°C)<br><b>Cabo:</b> ≤1m blindado<br><b>🔴</b> Eletrônica NÃO é waterproof!<br><b>📌</b> Hastes 5–10cm profundidade',
    tags: ['i2c'],
  },
  ics43434: {
    name: 'ICS-43434 — Mic MEMS',
    pos: [5, 0, 16],
    info: '<b>InvenSense</b> · <b>I2S:</b> BCLK→GPIO38, WS→GPIO39, DOUT→GPIO40<br><b>Mede:</b> Ruído dB(A) 29–116dB SPL<br><b>SEL:</b> GND (canal esq.)<br><b>🔧</b> Filtro IIR ponderação A',
    tags: ['i2s'],
  },
  misol: {
    name: 'MISOL — Pluviômetro',
    pos: [-9, 0, 16],
    info: '<b>Báscula reed</b> · <b>Resolução:</b> 0.3mm/pulso<br><b>Fio1→GND, Fio2→GPIO15</b><br><b>Proteção:</b> 100Ω + TVS SMAJ3.3A + 10kΩ pull-up<br><b>Debounce:</b> 15ms · <b>📌</b> 1.2–1.5m (WMO)',
    tags: ['irq'],
  },
  max485: {
    name: 'MAX485 — RS485 Transceiver',
    pos: [-2, 0, -11],
    info: '<b>UART TTL ↔ RS485</b><br><b>DI←GPIO47, RO→GPIO48, DE+RE←GPIO6</b><br><b>A/B→</b>Barramento RS485<br><b>Terminação:</b> 120Ω entre A e B',
    tags: ['rs485'],
  },
  anemometro: {
    name: 'Anemômetro+Biruta RS485',
    pos: [-10, 0, -23],
    info: '<b>RS485 Modbus RTU</b> · <b>Addr:</b> 0x01<br><b>Vel:</b> 0–60m/s(±0.3) · <b>Dir:</b> 0–360°(±3°)<br><b>12V DC</b> · 9600 8N1 · Cabo ≤30m<br><b>📌</b> Mastro ≥2m, livre 360°',
    tags: ['rs485', 'pwr'],
  },
  piranometro: {
    name: 'Piranômetro RS485',
    pos: [8, 0, -23],
    info: '<b>RS485 Modbus RTU</b> · <b>Addr:</b> 0x02<br><b>Radiação:</b> 0–2000 W/m²(±5%)<br><b>12V DC</b> · Espectro 300–3000nm<br><b>⚠️</b> Horizontal, sem sombra 360°',
    tags: ['rs485', 'pwr'],
  },
  buck: {
    name: 'Buck DC-DC 12V→5V',
    pos: [7, 0, -5],
    info: '<b>LM2596/MP1584</b><br><b>12V→5V</b> (~85% efic.)<br><b>Destino:</b> Heltec 5V pin<br><b>Pico:</b> ~240mA (LoRa TX)',
    tags: ['pwr'],
  },
  bateria: {
    name: 'Bateria 12V 7Ah SLA',
    pos: [22, 0, 2],
    info: '<b>SLA 12V 7Ah</b> (ou 3S Li-Ion 11.1V)<br><b>Alimenta:</b> Buck + RS485 sensores<br><b>Autonomia:</b> ~91h sem sol<br><b>Com painel 20W:</b> Indefinido',
    tags: ['pwr'],
  },
  painel: {
    name: 'Painel Solar 20W 18V',
    pos: [22, 8, -4],
    info: '<b>20W · 18V</b> · Geração ~96Wh/dia<br><b>Consumo:</b> ~22Wh/dia<br><b>Posição:</b> Norte geográfico, 7° inclinação<br><b>📌</b> Geração 4× consumo em Floriano',
    tags: ['pwr'],
  },
  mppt: {
    name: 'Controlador MPPT 12V',
    pos: [22, 4, -1],
    info: '<b>CN3791 ou equiv.</b><br><b>Entrada:</b> Painel 18V<br><b>Saída:</b> Bateria 12V (carga MPPT)',
    tags: ['pwr'],
  },
  heltec_base: {
    name: 'Heltec LoRa32 V3 (Base)',
    pos: [-21, 0, -4],
    info: '<b>ESP32-S3</b> · Receptor LoRa P2P contínuo<br><b>UART→ESP32-P4:</b> GPIO45(TX)/GPIO46(RX)<br><b>5V via ESP32-P4</b> · RX contínuo<br><b>🔴</b> NUNCA GPIO43/44!',
    tags: ['uart', 'lora', 'pwr'],
  },
  esp32p4: {
    name: 'ESP32-P4 Waveshare 7"',
    pos: [-21, 0, -15],
    info: '<b>ESP32-P4 400MHz</b> + ESP32-C6(WiFi6)<br><b>Display:</b> IPS 7" 1024×600 Touch<br><b>SD Card:</b> SDIO 3.0 (queue.jsonl)<br><b>RTC:</b> CR1220 · WiFi6→MQTT<br><b>USB-C 5V 2A</b>',
    tags: ['uart', 'pwr'],
  },
};

const WIRES = [
  {
    "from": "sen66",
    "to": "heltec_ext",
    "bus": "i2c",
    "customRoute": [
      { "x": -12.727, "y": 0.032, "z": -4.945 },
      { "x": -6.583, "y": 0.032, "z": -4.945 },
      { "x": -6.583, "y": 0.032, "z": -0.608 },
      { "x": -3.359, "y": 0.032, "z": -0.608 }
    ]
  },
  {
    "from": "bme690",
    "to": "heltec_ext",
    "bus": "i2c",
    "customRoute": [
      { "x": -12.964, "y": 0.032, "z": 2 },
      { "x": -10.872, "y": 0.032, "z": 2 },
      { "x": -10.872, "y": 0.032, "z": 3.474 },
      { "x": -1.702, "y": 0.032, "z": 3.474 },
      { "x": -1.702, "y": 0.032, "z": 1.909 }
    ]
  },
  {
    "from": "sfa30",
    "to": "heltec_ext",
    "bus": "i2c",
    "customRoute": [
      { "x": -12.171, "y": 0.032, "z": 9.025 },
      { "x": -0.845, "y": 0.032, "z": 9.025 },
      { "x": -0.845, "y": 0.032, "z": 1.896 }
    ]
  },
  {
    "from": "ltr390",
    "to": "heltec_ext",
    "bus": "i2c",
    "customRoute": [
      { "x": 11.718, "y": 0.032, "z": -6.007 },
      { "x": 10.846, "y": 0.032, "z": -6.007 },
      { "x": 10.846, "y": 0.032, "z": -0.624 },
      { "x": 3.528, "y": 0.032, "z": -0.624 }
    ]
  },
  {
    "from": "as3935",
    "to": "heltec_ext",
    "bus": "i2c",
    "customRoute": [
      { "x": 11.98, "y": 0.032, "z": 3.8 },
      { "x": 5.814, "y": 0.032, "z": 3.8 },
      { "x": 5.814, "y": 0.032, "z": 0.673 },
      { "x": 3.526, "y": 0.032, "z": 0.673 }
    ]
  },
  {
    "from": "solo",
    "to": "heltec_ext",
    "bus": "i2c",
    "customRoute": [
      { "x": 12.989, "y": 0.032, "z": 11.631 },
      { "x": 12.989, "y": 0.032, "z": 13.377 },
      { "x": 10.606, "y": 0.032, "z": 13.377 },
      { "x": 10.606, "y": 0.032, "z": 9.9 },
      { "x": 1.667, "y": 0.032, "z": 9.9 },
      { "x": 1.667, "y": 0.032, "z": 1.88 }
    ]
  },
  {
    "from": "heltec_ext",
    "to": "max485",
    "bus": "rs485",
    "customRoute": [
      { "x": 0.081, "y": 0.058, "z": -2.061 },
      { "x": 0.081, "y": 0.058, "z": -4.616 },
      { "x": -1.645, "y": 0.058, "z": -4.616 },
      { "x": -1.645, "y": 0.058, "z": -10.182 }
    ]
  },
  {
    "from": "max485",
    "to": "anemometro",
    "bus": "rs485",
    "customRoute": [
      { "x": -4.132, "y": 0.058, "z": -10.984 },
      { "x": -9.994, "y": 0.058, "z": -10.984 },
      { "x": -9.994, "y": 0.058, "z": -21.965 }
    ]
  },
  {
    "from": "max485",
    "to": "piranometro",
    "bus": "rs485",
    "customRoute": [
      { "x": 0.126, "y": 0.058, "z": -10.998 },
      { "x": 7.147, "y": 0.058, "z": -10.998 },
      { "x": 7.147, "y": 0.058, "z": -21.396 }
    ]
  },
  {
    "from": "ics43434",
    "to": "heltec_ext",
    "bus": "i2s",
    "customRoute": [
      { "x": 4.995, "y": 0.084, "z": 15.184 },
      { "x": 4.995, "y": 0.084, "z": 13.061 },
      { "x": 0.823, "y": 0.084, "z": 13.061 },
      { "x": 0.823, "y": 0.084, "z": 1.865 }
    ]
  },
  {
    "from": "misol",
    "to": "heltec_ext",
    "bus": "irq",
    "customRoute": [
      { "x": -8.99, "y": 4.125, "z": 16.0 },
      { "x": -8.99, "y": 0.045, "z": 16.0 },
      { "x": -7.056, "y": 0.045, "z": 15.952 },
      { "x": 0.001, "y": 0.045, "z": 15.952 },
      { "x": 0.001, "y": 0.045, "z": 1.879 }
    ]
  },
  {
    "from": "as3935",
    "to": "heltec_ext",
    "bus": "irq",
    "customRoute": [
      { "x": 11.969, "y": 0.045, "z": 4.2 },
      { "x": 2.467, "y": 0.045, "z": 4.2 },
      { "x": 2.467, "y": 0.045, "z": 1.879 }
    ]
  },
  {
    "from": "ltr390",
    "to": "heltec_ext",
    "bus": "irq",
    "customRoute": [
      { "x": 13.041, "y": 0.045, "z": -5.167 },
      { "x": 13.041, "y": 0.045, "z": 0.009 },
      { "x": 3.533, "y": 0.045, "z": 0.009 }
    ]
  },
  {
    "from": "painel",
    "to": "mppt",
    "bus": "pwr",
    "customRoute": [
      { "x": 21.5, "y": 7.0, "z": -3.5 },
      { "x": 21.5, "y": 4.5, "z": -3.5 },
      { "x": 21.5, "y": 4.5, "z": -1.5 }
    ]
  },
  {
    "from": "mppt",
    "to": "bateria",
    "bus": "pwr",
    "customRoute": [
      { "x": 22.5, "y": 3.5, "z": -0.5 },
      { "x": 22.5, "y": 0.071, "z": -0.5 },
      { "x": 22.5, "y": 0.071, "z": 1.5 }
    ]
  },
  {
    "from": "bateria",
    "to": "buck",
    "bus": "pwr",
    "customRoute": [
      { "x": 19.765, "y": 0.071, "z": 2.738 },
      { "x": 15.508, "y": 0.071, "z": 2.738 },
      { "x": 15.508, "y": 0.071, "z": -7.704 },
      { "x": 9.975, "y": 0.071, "z": -7.704 },
      { "x": 9.975, "y": 0.071, "z": -4.559 },
      { "x": 8.756, "y": 0.071, "z": -4.559 }
    ]
  },
  {
    "from": "buck",
    "to": "heltec_ext",
    "bus": "pwr",
    "customRoute": [
      { "x": 5.109, "y": 0.071, "z": -4.608 },
      { "x": 0.853, "y": 0.071, "z": -4.608 },
      { "x": 0.853, "y": 0.071, "z": -2.058 }
    ]
  },
  {
    "from": "bateria",
    "to": "anemometro",
    "bus": "pwr",
    "customRoute": [
      { "x": 19.767, "y": 0.071, "z": 1.525 },
      { "x": 17.3, "y": 0.071, "z": 1.525 },
      { "x": 17.3, "y": 0.071, "z": -27.117 },
      { "x": -9.976, "y": 0.071, "z": -27.117 },
      { "x": -9.976, "y": 0.071, "z": -24.025 }
    ]
  },
  {
    "from": "bateria",
    "to": "piranometro",
    "bus": "pwr",
    "customRoute": [
      { "x": 19.771, "y": 0.071, "z": 2.113 },
      { "x": 16.383, "y": 0.071, "z": 2.113 },
      { "x": 16.383, "y": 0.071, "z": -11.006 },
      { "x": 8.784, "y": 0.071, "z": -11.006 },
      { "x": 8.784, "y": 0.071, "z": -21.428 }
    ]
  },
  {
    "from": "heltec_ext",
    "to": "heltec_base",
    "bus": "lora",
    "customRoute": [
      { "x": -3.362, "y": 0.064, "z": 0.655 },
      { "x": -16.18, "y": 0.064, "z": 0.655 },
      { "x": -16.18, "y": 0.064, "z": -4 },
      { "x": -18.076, "y": 0.064, "z": -4 }
    ]
  },
  {
    "from": "heltec_base",
    "to": "esp32p4",
    "bus": "uart",
    "customRoute": [
      { "x": -22.1, "y": 0.038, "z": -5.316 },
      { "x": -22.1, "y": 0.038, "z": -12.704 }
    ]
  },
  {
    "from": "esp32p4",
    "to": "heltec_base",
    "bus": "pwr",
    "customRoute": [
      { "x": -19.9, "y": 0.071, "z": -12.686 },
      { "x": -19.9, "y": 0.071, "z": -5.299 }
    ]
  }
];

const BUS_COLORS = {
  i2c:  0x00c8ff,
  rs485: 0xffa000,
  i2s:  0xb400ff,
  irq:  0xff3c3c,
  pwr:  0x00ff64,
  uart: 0xffff00,
  lora: 0xff00c8,
};

// Mapa de builders
const BUILDERS = {
  heltec_ext:  () => buildHeltec(false),
  heltec_base: () => buildHeltec(true),
  sen66:       buildSEN66,
  bme690:      buildBME690,
  sfa30:       buildSFA30,
  ltr390:      buildLTR390,
  as3935:      buildAS3935,
  solo:        buildSoilSensor,
  ics43434:    buildICS43434,
  misol:       buildMISOL,
  max485:      buildMAX485,
  anemometro:  buildAnemometer,
  piranometro: buildPyranometer,
  buck:        buildBuck,
  bateria:     buildBattery,
  painel:      buildSolarPanel,
  mppt:        buildMPPT,
  esp32p4:     buildESP32P4,
};

window.COMP_DATA = COMP_DATA;
window.WIRES = WIRES;
window.BUS_COLORS = BUS_COLORS;
window.BUILDERS = BUILDERS;
