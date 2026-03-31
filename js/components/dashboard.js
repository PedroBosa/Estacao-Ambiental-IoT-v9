// ══════════════════════════════════════════════════
// dashboard.js — Dashboard interativo do ESP32-P4
// Paleta: Turquesa Dark · Design escuro elegante
// ══════════════════════════════════════════════════

(function () {
  'use strict';

  const W = 1024, H = 600;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  let texture = null;
  let screenMesh = null;
  let currentPage = 'home';
  let selectedSensor = null;
  let hoverZone = null;
  let navHover = -1;
  let frameCount = 0;

  // ── Paleta Turquesa Dark ──
  const P = {
    bg1: '#0b1a1e', bg2: '#0f2228',
    card: '#142c33',
    cardHov: '#1a3a42',
    border: '#1e4450',
    topBg: '#0e1f25',
    navBg: '#0e1f25',
    pri: '#00BFA5',
    priDk: '#00897B',
    priLt: '#1a5c52',
    priGlow: 'rgba(0,191,165,0.12)',
    txt: '#e8f0f0',
    txt2: '#a0bec5',
    txt3: '#607d86',
    ok: '#00E676',
    err: '#FF5252',
    warn: '#FFB300',
    shadow: 'rgba(0,0,0,0.35)',
    grid: 'rgba(255,255,255,0.06)',
  };

  // ── Sensores ──
  const SENSORS = [
    { id: 'temp',  label: 'Temperatura',  unit: '\u00B0C',    color: '#FF6B4A', icon: '\uD83C\uDF21\uFE0F', base: 25, amp: 3,   period: 8000,  range: [15, 45],  desc: 'BME690 Bosch \u00B7 I\u00B2C 0x76' },
    { id: 'humid', label: 'Umidade',      unit: '%',     color: '#00BFA5', icon: '\uD83D\uDCA7', base: 62, amp: 8,   period: 10000, range: [20, 100], desc: 'BME690 + SEN66 \u00B7 I\u00B2C' },
    { id: 'irrad', label: 'Irradi\u00E2ncia',  unit: 'W/m\u00B2',  color: '#FFB300', icon: '\u2600\uFE0F', base: 680, amp: 120, period: 6000,  range: [0, 2000], desc: 'Piran\u00F4metro RS485 \u00B7 0x02' },
    { id: 'wind',  label: 'Vento',        unit: 'm/s',   color: '#26A69A', icon: '\uD83D\uDCA8', base: 3.2, amp: 1.8, period: 5000,  range: [0, 60],   desc: 'Anem\u00F4metro RS485 \u00B7 0x01' },
    { id: 'pm25',  label: 'PM 2.5',       unit: '\u00B5g/m\u00B3', color: '#7C4DFF', icon: '\uD83C\uDF2B\uFE0F', base: 12,  amp: 5,   period: 12000, range: [0, 500],  desc: 'SEN66 \u00B7 I\u00B2C 0x6B' },
    { id: 'press', label: 'Press\u00E3o',      unit: 'hPa',   color: '#009688', icon: '\uD83D\uDCCA', base: 1013, amp: 4,  period: 15000, range: [900, 1100], desc: 'BME690 \u00B7 I\u00B2C 0x76' },
    { id: 'uv',    label: '\u00CDndice UV',    unit: 'UVI',   color: '#E84A8A', icon: '\uD83D\uDD06', base: 6,   amp: 3,   period: 7000,  range: [0, 14],   desc: 'LTR390 \u00B7 I\u00B2C 0x53' },
    { id: 'co2',   label: 'CO\u2082',          unit: 'ppm',   color: '#42A5F5', icon: '\uD83E\uDEE7', base: 420, amp: 40,  period: 11000, range: [300, 5000], desc: 'SEN66 NDIR \u00B7 I\u00B2C 0x6B' },
    { id: 'hcho',  label: 'HCHO',         unit: 'ppb',   color: '#AB47BC', icon: '\u2697\uFE0F', base: 18,  amp: 8,   period: 13000, range: [0, 500],  desc: 'SFA30 \u00B7 I\u00B2C 0x5D' },
    { id: 'soil',  label: 'Solo Umid.',   unit: 'cap',   color: '#8D6E63', icon: '\uD83C\uDF31', base: 650, amp: 120, period: 14000, range: [200, 2000], desc: 'STEMMA Soil \u00B7 I\u00B2C 0x36' },
    { id: 'rain',  label: 'Chuva',        unit: 'mm/h',  color: '#29B6F6', icon: '\uD83C\uDF27\uFE0F', base: 1.5, amp: 2,   period: 9000,  range: [0, 100],  desc: 'MISOL Reed \u00B7 GPIO15' },
    { id: 'noise', label: 'Ru\u00EDdo',        unit: 'dB(A)', color: '#EF5350', icon: '\uD83D\uDD0A', base: 42,  amp: 10,  period: 4000,  range: [29, 116], desc: 'ICS-43434 \u00B7 I2S' },
  ];

  const STATUS_ITEMS = [
    { name: 'LoRa 915 MHz',   ok: true },
    { name: 'I\u00B2C Bus',        ok: true },
    { name: 'RS485 Bus',      ok: true },
    { name: 'WiFi 6 (MQTT)',   ok: true },
    { name: 'SD Card (SDIO)',  ok: true },
    { name: 'Bateria 12V',    ok: true },
    { name: 'Buck 5V',        ok: true },
    { name: 'Painel Solar',   ok: true },
  ];

  const NAV = [
    { label: 'Dashboard', icon: '\uD83C\uDFE0', page: 'home' },
    { label: 'Sensores',  icon: '\uD83D\uDCE1', page: 'sensors' },
    { label: 'LoRa',      icon: '\uD83D\uDCF6', page: 'lora' },
    { label: 'Sistema',   icon: '\u2699\uFE0F', page: 'system' },
    { label: 'Parear',    icon: '\uD83D\uDD17', page: 'pairing' },
  ];

  const HISTORY_LEN = 60;
  const history = {};
  SENSORS.forEach(function(s) { history[s.id] = []; });

  // ── Pareamento ──
  let pairingCode = '';
  let pairingCodeTs = 0;

  function generatePairingCode() {
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    var code = 'EST-';
    for (var i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
    code += '-';
    for (var i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  }

  function getPairingCode() {
    var now = Date.now();
    if (!pairingCode || now - pairingCodeTs > 300000) {
      pairingCode = generatePairingCode();
      pairingCodeTs = now;
    }
    return pairingCode;
  }

  // ── Helpers ──
  function sv(s, t) { return s.base + Math.sin(t / s.period) * s.amp; }

  function rr(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function card(x, y, w, h, r, hover) {
    ctx.save();
    ctx.shadowColor = P.shadow;
    ctx.shadowBlur = hover ? 16 : 10;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = hover ? 4 : 2;
    ctx.fillStyle = hover ? P.cardHov : P.card;
    rr(x, y, w, h, r || 10);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = P.border;
    ctx.lineWidth = 0.8;
    rr(x, y, w, h, r || 10);
    ctx.stroke();
  }

  function drawBg() {
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, P.bg1);
    g.addColorStop(1, P.bg2);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function drawTopBar(title) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = P.topBg;
    ctx.fillRect(0, 0, W, 48);
    ctx.restore();

    // Turquoise accent
    ctx.fillStyle = P.pri;
    ctx.fillRect(0, 48, W, 2.5);

    // Title
    ctx.fillStyle = P.txt;
    ctx.font = 'bold 15px Manrope, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(title, 20, 26);

    // Subtitle location
    ctx.fillStyle = P.txt3;
    ctx.font = '400 10px Manrope, sans-serif';
    ctx.fillText('Floriano, PI \u00B7 v2.1.0', 20, 42);

    // Live indicator
    var blink = Math.sin(Date.now() / 500) > 0;
    ctx.fillStyle = blink ? P.ok : 'rgba(0,200,83,0.3)';
    ctx.beginPath();
    ctx.arc(W - 128, 24, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = P.ok;
    ctx.font = '600 9px Manrope, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('LIVE', W - 136, 27);

    // Time + Date
    ctx.fillStyle = P.txt;
    ctx.font = '600 13px Manrope, sans-serif';
    ctx.fillText(new Date().toLocaleTimeString('pt-BR'), W - 20, 22);
    ctx.fillStyle = P.txt3;
    ctx.font = '400 10px Manrope, sans-serif';
    ctx.fillText(new Date().toLocaleDateString('pt-BR'), W - 20, 40);
    ctx.textAlign = 'left';
  }

  function drawNavBar() {
    var barH = 44, barY = H - barH;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = -2;
    ctx.fillStyle = P.navBg;
    ctx.fillRect(0, barY, W, barH);
    ctx.restore();

    ctx.fillStyle = P.border;
    ctx.fillRect(0, barY, W, 1);

    var itemW = W / NAV.length;
    NAV.forEach(function(nav, i) {
      var x = i * itemW;
      var active = nav.page === currentPage;
      var hover = navHover === i;

      if (active) {
        ctx.fillStyle = P.pri;
        rr(x + itemW / 2 - 20, barY + 2, 40, 3, 1.5);
        ctx.fill();
        ctx.fillStyle = P.priGlow;
        ctx.fillRect(x, barY + 1, itemW, barH - 1);
      } else if (hover) {
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        ctx.fillRect(x, barY + 1, itemW, barH - 1);
      }

      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(nav.icon, x + itemW / 2, barY + 20);

      ctx.fillStyle = active ? P.pri : hover ? P.txt2 : P.txt3;
      ctx.font = active ? '600 10px Manrope, sans-serif' : '400 10px Manrope, sans-serif';
      ctx.fillText(nav.label, x + itemW / 2, barY + 36);
    });
    ctx.textAlign = 'left';
  }

  // ── Zones ──
  var zones = [];
  function addZone(x, y, w, h, action, data) {
    zones.push({ x: x, y: y, w: w, h: h, action: action, data: data });
  }

  // ══════════════════════════════════════════
  //  HOME
  // ══════════════════════════════════════════
  function drawHome(t) {
    drawTopBar('Esta\u00E7\u00E3o Ambiental IoT \u2014 Painel de Controle');

    var main = SENSORS.slice(0, 6);
    var cw = 158, ch = 86, gap = 10;
    var sx = 16, sy = 62;

    main.forEach(function(s, i) {
      var col = i % 3, row = Math.floor(i / 3);
      var cx = sx + col * (cw + gap);
      var cy = sy + row * (ch + gap);
      var val = sv(s, t);
      var hov = hoverZone && hoverZone.data === s.id;

      card(cx, cy, cw, ch, 10, hov);

      ctx.fillStyle = s.color;
      rr(cx + 4, cy + 12, 3, ch - 24, 1.5);
      ctx.fill();

      ctx.font = '20px sans-serif';
      ctx.fillText(s.icon, cx + 14, cy + 32);

      ctx.fillStyle = P.txt3;
      ctx.font = '500 10px Manrope, sans-serif';
      ctx.fillText(s.label, cx + 40, cy + 22);

      ctx.fillStyle = P.txt;
      ctx.font = 'bold 22px Manrope, sans-serif';
      var vs = val.toFixed(s.unit === '%' || s.unit === 'hPa' || s.unit === 'ppm' ? 0 : 1);
      ctx.fillText(vs, cx + 40, cy + 50);
      var vw = ctx.measureText(vs).width;

      ctx.fillStyle = P.txt3;
      ctx.font = '500 10px Manrope, sans-serif';
      ctx.fillText(s.unit, cx + 44 + vw, cy + 50);

      // Sparkline
      var hist = history[s.id];
      if (hist.length > 2) {
        var sw2 = cw - 52, sh = 14, sparkY = cy + ch - 12, sparkX = cx + 40;
        var min = Math.min.apply(null, hist), max = Math.max.apply(null, hist), rng = max - min || 1;
        ctx.strokeStyle = s.color + '55';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        hist.forEach(function(v, j) {
          var px = sparkX + (j / (hist.length - 1)) * sw2;
          var py = sparkY - ((v - min) / rng) * sh;
          j === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        });
        ctx.stroke();
      }

      addZone(cx, cy, cw, ch, 'sensor', s.id);
    });

    // ── Chart ──
    var gx = 520, gy = 62, gw = 490, gh = 178;
    card(gx, gy, gw, gh, 10);

    ctx.fillStyle = P.txt2;
    ctx.font = '600 12px Manrope, sans-serif';
    ctx.fillText('Telemetria \u2014 \u00DAltimas 24h', gx + 16, gy + 22);

    ctx.strokeStyle = P.grid;
    ctx.lineWidth = 0.5;
    for (var i = 0; i <= 4; i++) {
      var yy = gy + 38 + i * ((gh - 56) / 4);
      ctx.beginPath(); ctx.moveTo(gx + 45, yy); ctx.lineTo(gx + gw - 12, yy); ctx.stroke();
      ctx.fillStyle = P.txt3;
      ctx.font = '9px Manrope, sans-serif';
      ctx.fillText((40 - i * 10).toString(), gx + 16, yy + 3);
    }

    [SENSORS[0], SENSORS[1], SENSORS[3]].forEach(function(s, si) {
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      for (var p = 0; p < 60; p++) {
        var px = gx + 47 + p * ((gw - 64) / 60);
        var val = s.base + Math.sin(t / 20000 + p * 0.3 + si * 2) * s.amp;
        var norm = (val - s.base + s.amp) / (s.amp * 2);
        var py = gy + 38 + (gh - 56) * (1 - norm);
        p === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.stroke();
    });

    var lx = gx + gw - 200;
    [['Temp', SENSORS[0].color], ['Umid', SENSORS[1].color], ['Vento', SENSORS[3].color]].forEach(function(l, i) {
      var llx = lx + i * 68;
      ctx.fillStyle = l[1];
      rr(llx, gy + 10, 8, 8, 2);
      ctx.fill();
      ctx.fillStyle = P.txt3;
      ctx.font = '9px Manrope, sans-serif';
      ctx.fillText(l[0], llx + 12, gy + 18);
    });

    // ── Status ──
    var sty = 250;
    card(16, sty, 490, 82, 10);
    ctx.fillStyle = P.txt2;
    ctx.font = '600 11px Manrope, sans-serif';
    ctx.fillText('Status do Sistema', 32, sty + 20);

    STATUS_ITEMS.forEach(function(st, i) {
      var col = i % 4, row = Math.floor(i / 4);
      var stx = 32 + col * 120, sty2 = sty + 34 + row * 22;
      var flickerOk = st.name === 'Bateria 12V' ? Math.sin(t / 7000) > -0.8 : st.ok;
      ctx.fillStyle = flickerOk ? P.ok : P.err;
      ctx.beginPath(); ctx.arc(stx + 4, sty2 + 3, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = P.txt2;
      ctx.font = '11px Manrope, sans-serif';
      ctx.fillText(st.name, stx + 14, sty2 + 7);
    });

    // ── LoRa summary ──
    card(520, sty, 490, 82, 10);
    ctx.fillStyle = P.txt2;
    ctx.font = '600 11px Manrope, sans-serif';
    ctx.fillText('\u00DAltima Transmiss\u00E3o LoRa', 536, sty + 20);

    ctx.fillStyle = P.txt;
    ctx.font = '11px Manrope, sans-serif';
    ctx.fillText('Hor\u00E1rio: ' + new Date().toLocaleTimeString('pt-BR') + '   |   Payload: 52 bytes', 536, sty + 40);
    ctx.fillStyle = P.txt3;
    ctx.fillText('RSSI: -67 dBm  |  SNR: 9.5  |  SF7BW125  |  915.2 MHz', 536, sty + 58);
    ctx.fillText('P2P Heltec\u2192Heltec  \u2022  Uptime: 48d 6h', 536, sty + 74);

    // ── Extra sensors ──
    var extra = SENSORS.slice(6);
    var ew = 160, eh = 48, eGap = 8;
    var ey = 342;
    extra.forEach(function(s, i) {
      var col = i % 6, row = Math.floor(i / 6);
      var ex = 16 + col * (ew + eGap);
      var eyy = ey + row * (eh + eGap);
      var val = sv(s, t);
      var hov = hoverZone && hoverZone.data === s.id;

      card(ex, eyy, ew, eh, 8, hov);

      ctx.fillStyle = s.color;
      rr(ex + 4, eyy + 8, 3, eh - 16, 1.5);
      ctx.fill();

      ctx.font = '15px sans-serif';
      ctx.fillText(s.icon, ex + 12, eyy + 30);

      ctx.fillStyle = P.txt3;
      ctx.font = '9px Manrope, sans-serif';
      ctx.fillText(s.label, ex + 34, eyy + 18);

      ctx.fillStyle = P.txt;
      ctx.font = 'bold 14px Manrope, sans-serif';
      var vs2 = val.toFixed(s.unit === 'cap' || s.unit === 'ppm' || s.unit === 'ppb' ? 0 : 1);
      ctx.fillText(vs2 + ' ' + s.unit, ex + 34, eyy + 36);

      addZone(ex, eyy, ew, eh, 'sensor', s.id);
    });

    // ── Quick pairing badge ──
    card(16, 400, 200, 50, 10);
    ctx.fillStyle = P.pri;
    ctx.font = '600 11px Manrope, sans-serif';
    ctx.fillText('\uD83D\uDD17  Parear Dispositivo', 32, 420);
    ctx.fillStyle = P.txt3;
    ctx.font = '10px Manrope, sans-serif';
    ctx.fillText('Toque para conectar via QR', 32, 438);
    addZone(16, 400, 200, 50, 'nav', 'pairing');
  }

  // ══════════════════════════════════════════
  //  SENSOR DETAIL
  // ══════════════════════════════════════════
  function drawDetail(t) {
    var s = SENSORS.find(function(x) { return x.id === selectedSensor; });
    if (!s) { currentPage = 'home'; return; }

    drawTopBar('\uD83D\uDCE1 ' + s.label + ' \u2014 Monitoramento');

    var val = sv(s, t);
    var hist = history[s.id];

    // Back
    card(16, 58, 80, 32, 8);
    ctx.fillStyle = P.pri;
    ctx.font = '500 12px Manrope, sans-serif';
    ctx.fillText('\u2190 Voltar', 30, 78);
    addZone(16, 58, 80, 32, 'back', null);

    // Main value
    var cy = 100;
    card(16, cy, 520, 120, 12);
    ctx.fillStyle = s.color;
    rr(20, cy + 14, 4, 92, 2);
    ctx.fill();

    ctx.font = '38px sans-serif';
    ctx.fillText(s.icon, 36, cy + 58);

    ctx.fillStyle = P.txt;
    ctx.font = 'bold 44px Manrope, sans-serif';
    var bv = val.toFixed(1);
    ctx.fillText(bv, 86, cy + 64);
    var bvw = ctx.measureText(bv).width;

    ctx.fillStyle = P.txt3;
    ctx.font = '18px Manrope, sans-serif';
    ctx.fillText(s.unit, 92 + bvw, cy + 62);

    ctx.fillStyle = P.txt2;
    ctx.font = '12px Manrope, sans-serif';
    ctx.fillText(s.desc, 86, cy + 88);
    ctx.fillText('Range: ' + s.range[0] + ' \u2013 ' + s.range[1] + ' ' + s.unit, 86, cy + 106);

    // Stats
    var stx = 550;
    var stats = [
      { label: 'M\u00EDnimo', val: (s.base - s.amp).toFixed(1) + ' ' + s.unit },
      { label: 'M\u00E1ximo', val: (s.base + s.amp).toFixed(1) + ' ' + s.unit },
      { label: 'M\u00E9dia',  val: s.base.toFixed(1) + ' ' + s.unit },
    ];
    stats.forEach(function(st, i) {
      var sy2 = cy + i * 42;
      card(stx, sy2, 230, 36, 8);
      ctx.fillStyle = P.txt3;
      ctx.font = '10px Manrope, sans-serif';
      ctx.fillText(st.label, stx + 12, sy2 + 14);
      ctx.fillStyle = P.txt;
      ctx.font = 'bold 14px Manrope, sans-serif';
      ctx.fillText(st.val, stx + 12, sy2 + 30);
    });

    // Gauge
    var gcx = W - 100, gcy = cy + 60, gr = 42;
    var norm = (val - s.range[0]) / (s.range[1] - s.range[0]);
    var sa = Math.PI * 0.75, ea = Math.PI * 2.25;
    var va = sa + norm * (ea - sa);

    ctx.strokeStyle = P.border;
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(gcx, gcy, gr, sa, ea); ctx.stroke();
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(gcx, gcy, gr, sa, va); ctx.stroke();

    ctx.fillStyle = P.txt;
    ctx.font = 'bold 16px Manrope, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(val.toFixed(1), gcx, gcy + 5);
    ctx.fillStyle = P.txt3;
    ctx.font = '9px Manrope, sans-serif';
    ctx.fillText(s.unit, gcx, gcy + 18);
    ctx.textAlign = 'left';

    // History chart
    var ghx = 16, ghy = 232, ghw = W - 32, ghh = 190;
    card(ghx, ghy, ghw, ghh, 10);
    ctx.fillStyle = P.txt2;
    ctx.font = '600 12px Manrope, sans-serif';
    ctx.fillText('Hist\u00F3rico (\u00FAltimos 60 ciclos)', ghx + 16, ghy + 22);

    if (hist.length > 2) {
      var min = Math.min.apply(null, hist), max = Math.max.apply(null, hist), rng = max - min || 1;
      var px0 = ghx + 50, py0 = ghy + 36, pw = ghw - 66, ph = ghh - 52;

      ctx.strokeStyle = P.grid;
      ctx.lineWidth = 0.5;
      for (var ii = 0; ii <= 5; ii++) {
        var gridY = py0 + ii * (ph / 5);
        ctx.beginPath(); ctx.moveTo(px0, gridY); ctx.lineTo(px0 + pw, gridY); ctx.stroke();
        ctx.fillStyle = P.txt3;
        ctx.font = '9px Manrope, sans-serif';
        ctx.fillText((max - (ii / 5) * rng).toFixed(1), ghx + 10, gridY + 3);
      }

      // Area
      ctx.beginPath();
      hist.forEach(function(v, j) {
        var x = px0 + (j / (hist.length - 1)) * pw;
        var y = py0 + ph - ((v - min) / rng) * ph;
        j === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.lineTo(px0 + pw, py0 + ph);
      ctx.lineTo(px0, py0 + ph);
      ctx.closePath();
      var grad = ctx.createLinearGradient(0, py0, 0, py0 + ph);
      grad.addColorStop(0, s.color + '22');
      grad.addColorStop(1, s.color + '03');
      ctx.fillStyle = grad;
      ctx.fill();

      // Line
      ctx.beginPath();
      hist.forEach(function(v, j) {
        var x = px0 + (j / (hist.length - 1)) * pw;
        var y = py0 + ph - ((v - min) / rng) * ph;
        j === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Dot
      var lx2 = px0 + pw;
      var ly2 = py0 + ph - ((hist[hist.length - 1] - min) / rng) * ph;
      ctx.fillStyle = s.color;
      ctx.beginPath(); ctx.arc(lx2, ly2, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(lx2, ly2, 2, 0, Math.PI * 2); ctx.fill();
    }

    // Bottom info
    var biy = 432;
    var barItems = [
      { label: 'Per\u00EDodo', val: (s.period / 1000).toFixed(0) + 's' },
      { label: '\u00DAltima Leitura', val: new Date().toLocaleTimeString('pt-BR') },
      { label: 'Status', val: '\u25CF Online', isOk: true },
      { label: 'Barramento', val: s.desc.split('\u00B7')[1] || 'I\u00B2C' },
    ];
    barItems.forEach(function(bi, i) {
      var bx = 16 + i * 250;
      card(bx, biy, 238, 44, 8);
      ctx.fillStyle = P.txt3;
      ctx.font = '9px Manrope, sans-serif';
      ctx.fillText(bi.label, bx + 12, biy + 16);
      ctx.fillStyle = bi.isOk ? P.ok : P.txt;
      ctx.font = 'bold 13px Manrope, sans-serif';
      ctx.fillText(bi.val, bx + 12, biy + 35);
    });
  }

  // ══════════════════════════════════════════
  //  SENSORS GRID
  // ══════════════════════════════════════════
  function drawSensors(t) {
    drawTopBar('\uD83D\uDCE1 Monitoramento \u2014 Todos os Sensores');

    var cw = 158, ch = 100, gap = 9;
    var cols = 6, sx = 14, sy = 58;

    SENSORS.forEach(function(s, i) {
      var col = i % cols, row = Math.floor(i / cols);
      var cx = sx + col * (cw + gap);
      var cy = sy + row * (ch + gap);
      var val = sv(s, t);
      var hov = hoverZone && hoverZone.data === s.id;

      card(cx, cy, cw, ch, 8, hov);

      ctx.fillStyle = s.color;
      rr(cx + 4, cy + 10, 3, ch - 20, 1.5);
      ctx.fill();

      ctx.font = '20px sans-serif';
      ctx.fillText(s.icon, cx + 14, cy + 32);

      ctx.fillStyle = P.txt3;
      ctx.font = '500 10px Manrope, sans-serif';
      ctx.fillText(s.label, cx + 40, cy + 22);

      ctx.fillStyle = P.txt;
      ctx.font = 'bold 22px Manrope, sans-serif';
      var vs = val.toFixed(s.unit === '%' || s.unit === 'hPa' || s.unit === 'ppm' || s.unit === 'ppb' || s.unit === 'cap' ? 0 : 1);
      ctx.fillText(vs, cx + 40, cy + 50);
      var vw2 = ctx.measureText(vs).width;

      ctx.fillStyle = P.txt3;
      ctx.font = '10px Manrope, sans-serif';
      ctx.fillText(s.unit, cx + 44 + vw2, cy + 50);

      var hist = history[s.id];
      if (hist.length > 2) {
        ctx.strokeStyle = s.color + '44';
        ctx.lineWidth = 1;
        ctx.beginPath();
        var sw3 = cw - 52, sh2 = 16, spY = cy + ch - 14, spX = cx + 40;
        var min2 = Math.min.apply(null, hist), max2 = Math.max.apply(null, hist), rng2 = max2 - min2 || 1;
        hist.forEach(function(v, j) {
          var px = spX + (j / (hist.length - 1)) * sw3;
          var py = spY - ((v - min2) / rng2) * sh2;
          j === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        });
        ctx.stroke();
      }

      ctx.fillStyle = P.txt3;
      ctx.font = '8px Manrope, sans-serif';
      ctx.fillText(s.desc.split('\u00B7')[0].trim(), cx + 14, cy + ch - 6);

      addZone(cx, cy, cw, ch, 'sensor', s.id);
    });

    // Bus architecture
    card(14, 278, W - 28, 170, 10);
    ctx.fillStyle = P.txt2;
    ctx.font = '600 12px Manrope, sans-serif';
    ctx.fillText('Arquitetura de Barramento', 30, 298);

    var buses = [
      { name: 'I\u00B2C', color: '#00BFA5', sensors: 'SEN66, BME690, SFA30, LTR390, AS3935, Solo', pins: 'SDA=GPIO41, SCL=GPIO42' },
      { name: 'RS485', color: '#FFB300', sensors: 'Anem\u00F4metro, Piran\u00F4metro', pins: 'TX=GPIO47, RX=GPIO48, DE=GPIO6' },
      { name: 'I2S', color: '#7C4DFF', sensors: 'ICS-43434 (Microfone)', pins: 'BCLK=GPIO38, WS=GPIO39, DOUT=GPIO40' },
      { name: 'IRQ', color: '#FF5252', sensors: 'MISOL(GPIO15), AS3935(GPIO4)', pins: 'Interrup\u00E7\u00E3o por borda' },
      { name: 'LoRa', color: '#E84A8A', sensors: 'Heltec\u2192Heltec P2P', pins: 'SX1262 915MHz SF7BW125' },
    ];
    buses.forEach(function(b, i) {
      var by = 316 + i * 26;
      ctx.fillStyle = b.color;
      rr(30, by, 10, 10, 2);
      ctx.fill();
      ctx.fillStyle = P.txt;
      ctx.font = 'bold 11px Manrope, sans-serif';
      ctx.fillText(b.name, 46, by + 10);
      ctx.fillStyle = P.txt2;
      ctx.font = '11px Manrope, sans-serif';
      ctx.fillText(b.sensors, 100, by + 10);
      ctx.fillStyle = P.txt3;
      ctx.font = '10px Manrope, sans-serif';
      ctx.fillText(b.pins, 520, by + 10);
    });
  }

  // ══════════════════════════════════════════
  //  SYSTEM
  // ══════════════════════════════════════════
  function drawSystem(t) {
    drawTopBar('\u2699\uFE0F Sistema \u2014 Informa\u00E7\u00F5es do Dispositivo');

    var info = [
      ['MCU Campo', 'ESP32-S3 (Heltec LoRa32 V3)', 'Flash 8MB \u00B7 PSRAM 8MB \u00B7 240MHz'],
      ['MCU Base', 'ESP32-S3 (Heltec LoRa32 V3)', 'Receptor LoRa P2P cont\u00EDnuo'],
      ['Dashboard', 'ESP32-P4 Waveshare 7"', '400MHz \u00B7 1024\u00D7600 IPS Touch'],
      ['WiFi', 'ESP32-C6 (WiFi 6)', 'MQTT \u2192 Broker Cloud'],
      ['Armazenamento', 'SD Card SDIO 3.0', 'queue.jsonl \u00B7 Logs cont\u00EDnuos'],
      ['RTC', 'CR1220 Backup', 'Sincroniza\u00E7\u00E3o NTP via WiFi'],
    ];

    info.forEach(function(inf, i) {
      var col = i % 2, row = Math.floor(i / 2);
      var cx = 16 + col * 502;
      var cy = 58 + row * 78;

      card(cx, cy, 490, 68, 8);
      ctx.fillStyle = P.pri;
      rr(cx + 4, cy + 12, 3, 44, 1.5);
      ctx.fill();

      ctx.fillStyle = P.txt;
      ctx.font = 'bold 13px Manrope, sans-serif';
      ctx.fillText(inf[0], cx + 16, cy + 24);
      ctx.fillStyle = P.txt2;
      ctx.font = '12px Manrope, sans-serif';
      ctx.fillText(inf[1], cx + 16, cy + 42);
      ctx.fillStyle = P.txt3;
      ctx.font = '10px Manrope, sans-serif';
      ctx.fillText(inf[2], cx + 16, cy + 58);
    });

    // Energy
    var ey = 300;
    card(16, ey, W - 32, 100, 10);
    ctx.fillStyle = P.txt2;
    ctx.font = '600 12px Manrope, sans-serif';
    ctx.fillText('\u26A1 Energia e Autonomia', 32, ey + 22);

    var energy = [
      { label: 'Bateria', val: '12V 7Ah SLA', extra: '~91h sem sol' },
      { label: 'Painel Solar', val: '20W 18V', extra: '~96Wh/dia gera\u00E7\u00E3o' },
      { label: 'Consumo', val: '~22Wh/dia', extra: 'Gera\u00E7\u00E3o 4\u00D7 consumo' },
      { label: 'Buck', val: '12V\u21925V LM2596', extra: '~85% efici\u00EAncia' },
    ];
    energy.forEach(function(e, i) {
      var ex = 32 + i * 248;
      ctx.fillStyle = P.txt;
      ctx.font = 'bold 12px Manrope, sans-serif';
      ctx.fillText(e.label, ex, ey + 48);
      ctx.fillStyle = P.txt2;
      ctx.font = '11px Manrope, sans-serif';
      ctx.fillText(e.val, ex, ey + 66);
      ctx.fillStyle = P.txt3;
      ctx.font = '10px Manrope, sans-serif';
      ctx.fillText(e.extra, ex, ey + 82);
    });

    // Uptime bar
    var ubY = 414;
    card(16, ubY, W - 32, 44, 8);
    ctx.fillStyle = P.ok;
    ctx.font = 'bold 11px Manrope, sans-serif';
    ctx.fillText('\u25CF SISTEMA OPERACIONAL', 32, ubY + 18);
    ctx.fillStyle = P.txt2;
    ctx.font = '11px Manrope, sans-serif';
    ctx.fillText('Uptime: 48d 6h 23m  |  Ciclos TX: 104.832  |  Erros I\u00B2C: 0  |  Resets: 1', 32, ubY + 34);
  }

  // ══════════════════════════════════════════
  //  LORA
  // ══════════════════════════════════════════
  function drawLora(t) {
    drawTopBar('\uD83D\uDCF6 LoRa \u2014 Comunica\u00E7\u00E3o Ponto a Ponto');

    // Config
    card(16, 58, 490, 160, 10);
    ctx.fillStyle = P.txt2;
    ctx.font = '600 12px Manrope, sans-serif';
    ctx.fillText('Configura\u00E7\u00E3o LoRa P2P', 32, 78);

    var loraConf = [
      ['Frequ\u00EAncia', '915.2 MHz'],
      ['Spreading Factor', 'SF7'],
      ['Bandwidth', '125 kHz'],
      ['Coding Rate', '4/5'],
      ['TX Power', '22 dBm'],
      ['Payload', '52 bytes'],
      ['Intervalo TX', '60 s'],
      ['Modo', 'P2P (Heltec\u2192Heltec)'],
    ];
    loraConf.forEach(function(lc, i) {
      var col = i % 2, row = Math.floor(i / 2);
      var llx = 32 + col * 240, ly = 94 + row * 28;
      ctx.fillStyle = P.txt3;
      ctx.font = '11px Manrope, sans-serif';
      ctx.fillText(lc[0] + ':', llx, ly + 10);
      ctx.fillStyle = P.txt;
      ctx.font = 'bold 11px Manrope, sans-serif';
      ctx.fillText(lc[1], llx + 130, ly + 10);
    });

    // Link Budget
    card(520, 58, 490, 160, 10);
    ctx.fillStyle = P.txt2;
    ctx.font = '600 12px Manrope, sans-serif';
    ctx.fillText('Link Budget & Qualidade', 536, 78);

    var rssi = -67 + Math.sin(t / 3000) * 5;
    var snr = 9.5 + Math.sin(t / 4000) * 2;

    // RSSI
    ctx.fillStyle = P.txt3;
    ctx.font = '11px Manrope, sans-serif';
    ctx.fillText('RSSI', 536, 102);
    ctx.fillStyle = P.border;
    rr(536, 108, 200, 12, 4);
    ctx.fill();
    var rn = Math.max(0, Math.min(1, (rssi + 120) / 80));
    ctx.fillStyle = rn > 0.5 ? P.ok : rn > 0.25 ? P.warn : P.err;
    rr(536, 108, 200 * rn, 12, 4);
    ctx.fill();
    ctx.fillStyle = P.txt;
    ctx.font = 'bold 12px Manrope, sans-serif';
    ctx.fillText(rssi.toFixed(0) + ' dBm', 742, 119);

    // SNR
    ctx.fillStyle = P.txt3;
    ctx.font = '11px Manrope, sans-serif';
    ctx.fillText('SNR', 536, 140);
    ctx.fillStyle = P.border;
    rr(536, 146, 200, 12, 4);
    ctx.fill();
    var sn = Math.max(0, Math.min(1, snr / 15));
    ctx.fillStyle = sn > 0.5 ? P.ok : sn > 0.3 ? P.warn : P.err;
    rr(536, 146, 200 * sn, 12, 4);
    ctx.fill();
    ctx.fillStyle = P.txt;
    ctx.font = 'bold 12px Manrope, sans-serif';
    ctx.fillText(snr.toFixed(1) + ' dB', 742, 157);

    ctx.fillStyle = P.txt3;
    ctx.font = '11px Manrope, sans-serif';
    ctx.fillText('Pacotes TX: 104.832  |  RX: 104.830  |  Perdidos: 2 (0.002%)', 536, 188);
    ctx.fillText('Dist\u00E2ncia: ~150m  |  Time-on-Air: 36ms', 536, 206);

    // Payload
    var py = 232;
    card(16, py, W - 32, 130, 10);
    ctx.fillStyle = P.txt2;
    ctx.font = '600 12px Manrope, sans-serif';
    ctx.fillText('Estrutura do Payload (52 bytes)', 32, py + 22);

    ctx.fillStyle = '#091318';
    rr(32, py + 34, W - 64, 84, 6);
    ctx.fill();

    ctx.fillStyle = '#4dd8a0';
    ctx.font = '11px monospace';
    var pl = [
      '{ "ts": ' + Math.floor(Date.now() / 1000) + ',',
      '  "temp": ' + sv(SENSORS[0], t).toFixed(1) + ', "hum": ' + sv(SENSORS[1], t).toFixed(0) + ', "pres": ' + sv(SENSORS[5], t).toFixed(0) + ',',
      '  "pm25": ' + sv(SENSORS[4], t).toFixed(0) + ', "co2": ' + sv(SENSORS[7], t).toFixed(0) + ', "wind": ' + sv(SENSORS[3], t).toFixed(1) + ',',
      '  "irrad": ' + sv(SENSORS[2], t).toFixed(0) + ', "uv": ' + sv(SENSORS[6], t).toFixed(1) + ', "rain": ' + sv(SENSORS[10], t).toFixed(1) + ',',
      '  "noise": ' + sv(SENSORS[11], t).toFixed(0) + ', "hcho": ' + sv(SENSORS[8], t).toFixed(0) + ', "soil": ' + sv(SENSORS[9], t).toFixed(0) + ' }',
    ];
    pl.forEach(function(ln, i) { ctx.fillText(ln, 42, py + 52 + i * 14); });

    var blk = Math.sin(t / 500) > 0;
    ctx.fillStyle = blk ? '#22ff66' : '#115533';
    ctx.beginPath();
    ctx.arc(W - 40, py + 16, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = P.txt3;
    ctx.font = '9px Manrope, sans-serif';
    ctx.fillText('TX', W - 52, py + 20);
  }

  // ══════════════════════════════════════════
  //  QR CODE RENDERER
  // ══════════════════════════════════════════
  function drawQR(x, y, size, code) {
    var n = 25;
    var cs = size / n;

    // White bg
    ctx.fillStyle = '#ffffff';
    rr(x - 8, y - 8, size + 16, size + 16, 8);
    ctx.fill();
    ctx.strokeStyle = P.border;
    ctx.lineWidth = 1;
    rr(x - 8, y - 8, size + 16, size + 16, 8);
    ctx.stroke();

    // Hash seed
    var h = 5381;
    for (var i = 0; i < code.length; i++) h = ((h << 5) + h + code.charCodeAt(i)) | 0;

    function inFinder(r, c) {
      return (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);
    }

    function finderDark(r, c) {
      var lr, lc;
      if (r < 7 && c < 7) { lr = r; lc = c; }
      else if (r < 7 && c >= n - 7) { lr = r; lc = c - (n - 7); }
      else { lr = r - (n - 7); lc = c; }
      if (lr === 0 || lr === 6 || lc === 0 || lc === 6) return true;
      if (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4) return true;
      return false;
    }

    for (var r = 0; r < n; r++) {
      for (var c = 0; c < n; c++) {
        var dark;
        if (inFinder(r, c)) {
          dark = finderDark(r, c);
        } else if (r === 6) {
          dark = c % 2 === 0;
        } else if (c === 6) {
          dark = r % 2 === 0;
        } else {
          var seed = ((h + r * 997 + c * 131) >>> 0);
          seed = (seed * 1103515245 + 12345) >>> 0;
          dark = ((seed >>> 16) & 0xff) > 95;
        }
        if (dark) {
          ctx.fillStyle = '#1a1a1a';
          rr(x + c * cs + 0.3, y + r * cs + 0.3, cs - 0.6, cs - 0.6, cs > 6 ? 1.5 : 0.8);
          ctx.fill();
        }
      }
    }
  }

  // ══════════════════════════════════════════
  //  PAIRING
  // ══════════════════════════════════════════
  function drawPairing(t) {
    drawTopBar('\uD83D\uDD17 Pareamento \u2014 Conectar Dispositivo');

    var code = getPairingCode();
    var elapsed = Date.now() - pairingCodeTs;
    var remaining = Math.max(0, 300 - Math.floor(elapsed / 1000));
    var min = Math.floor(remaining / 60);
    var sec = remaining % 60;

    // ── Left: QR ──
    card(16, 58, 440, 440, 14);

    ctx.fillStyle = P.txt;
    ctx.font = 'bold 16px Manrope, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Escaneie para Parear', 236, 88);

    ctx.fillStyle = P.txt3;
    ctx.font = '12px Manrope, sans-serif';
    ctx.fillText('Aponte a c\u00E2mera do app para o QR Code', 236, 108);

    drawQR(108, 120, 256, code);

    // Pairing code button
    ctx.fillStyle = P.pri;
    rr(86, 394, 300, 48, 12);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Manrope, sans-serif';
    ctx.fillText(code, 236, 424);

    // Timer
    ctx.fillStyle = P.txt3;
    ctx.font = '11px Manrope, sans-serif';
    ctx.fillText('C\u00F3digo expira em ' + min + ':' + (sec < 10 ? '0' : '') + sec, 236, 460);

    // Timer bar
    var prog = remaining / 300;
    ctx.fillStyle = P.border;
    rr(136, 468, 200, 4, 2);
    ctx.fill();
    ctx.fillStyle = prog > 0.3 ? P.pri : P.warn;
    rr(136, 468, 200 * prog, 4, 2);
    ctx.fill();

    // Regenerate button
    ctx.fillStyle = P.priGlow;
    rr(166, 478, 140, 14, 4);
    ctx.fill();
    ctx.fillStyle = P.pri;
    ctx.font = '600 9px Manrope, sans-serif';
    ctx.fillText('Gerar Novo C\u00F3digo', 236, 489);
    ctx.textAlign = 'left';
    addZone(166, 478, 140, 14, 'regenerate', null);

    // ── Right Top: Steps ──
    card(472, 58, 536, 196, 14);
    ctx.fillStyle = P.txt;
    ctx.font = 'bold 15px Manrope, sans-serif';
    ctx.fillText('Como Parear', 492, 86);

    var steps = [
      { n: '1', title: 'Baixe o App', desc: 'Instale o aplicativo da Esta\u00E7\u00E3o IoT' },
      { n: '2', title: 'Escaneie o QR Code', desc: 'Ou insira o c\u00F3digo manualmente acima' },
      { n: '3', title: 'Confirme no App', desc: 'Aceite a solicita\u00E7\u00E3o de pareamento' },
      { n: '4', title: 'Pronto!', desc: 'Dados sincronizados automaticamente' },
    ];
    steps.forEach(function(step, i) {
      var sy = 104 + i * 36;
      ctx.fillStyle = P.pri;
      ctx.beginPath();
      ctx.arc(502, sy + 6, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Manrope, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(step.n, 502, sy + 10);
      ctx.textAlign = 'left';

      ctx.fillStyle = P.txt;
      ctx.font = '600 12px Manrope, sans-serif';
      ctx.fillText(step.title, 522, sy + 6);
      ctx.fillStyle = P.txt3;
      ctx.font = '11px Manrope, sans-serif';
      ctx.fillText(step.desc, 522, sy + 22);
    });

    // ── Right Middle: Status ──
    card(472, 268, 536, 100, 14);

    var pulsing = Math.sin(t / 600) > 0;
    ctx.fillStyle = P.txt;
    ctx.font = 'bold 14px Manrope, sans-serif';
    ctx.fillText('Status da Conex\u00E3o', 492, 294);

    ctx.fillStyle = pulsing ? P.pri : P.priLt;
    ctx.beginPath();
    ctx.arc(502, 324, 6, 0, Math.PI * 2);
    ctx.fill();

    // Animated dots
    var dots = '';
    var dotCount = Math.floor((t / 400) % 4);
    for (var d = 0; d < dotCount; d++) dots += '.';

    ctx.fillStyle = P.txt2;
    ctx.font = '13px Manrope, sans-serif';
    ctx.fillText('Aguardando pareamento' + dots, 516, 328);

    ctx.fillStyle = P.txt3;
    ctx.font = '11px Manrope, sans-serif';
    ctx.fillText('Dispositivos pareados: 0/3  |  WiFi: Conectado  |  BLE: Ativo', 492, 354);

    // ── Right Bottom: Compatibility ──
    card(472, 382, 536, 116, 14);
    ctx.fillStyle = P.txt;
    ctx.font = 'bold 13px Manrope, sans-serif';
    ctx.fillText('Compatibilidade', 492, 408);

    var compat = [
      { icon: '\uD83D\uDCF1', name: 'iOS 15+' },
      { icon: '\uD83E\uDD16', name: 'Android 10+' },
      { icon: '\uD83D\uDCBB', name: 'Web Dashboard' },
      { icon: '\uD83D\uDCE1', name: 'MQTT Client' },
    ];
    compat.forEach(function(c, i) {
      var ccx = 492 + i * 130;
      ctx.font = '16px sans-serif';
      ctx.fillText(c.icon, ccx, 436);
      ctx.fillStyle = P.txt2;
      ctx.font = '11px Manrope, sans-serif';
      ctx.fillText(c.name, ccx + 22, 436);

      ctx.fillStyle = P.ok;
      ctx.beginPath();
      ctx.arc(ccx + 6, 452, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 8px Manrope, sans-serif';
      ctx.fillText('\u2713', ccx + 3, 455);

      ctx.fillStyle = P.txt3;
      ctx.font = '9px Manrope, sans-serif';
      ctx.fillText('Suportado', ccx + 16, 456);
    });

    // Connection ring animation
    var ringAlpha = (Math.sin(t / 800) + 1) / 2;
    ctx.strokeStyle = 'rgba(0,191,165,' + (ringAlpha * 0.3).toFixed(2) + ')';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(502, 324, 14 + ringAlpha * 6, 0, Math.PI * 2);
    ctx.stroke();
  }

  // ══════════════════════════════════════════
  //  MAIN RENDER
  // ══════════════════════════════════════════
  function draw() {
    var t = Date.now();
    zones.length = 0;
    ctx.textAlign = 'left';

    if (frameCount % 30 === 0) {
      SENSORS.forEach(function(s) {
        history[s.id].push(sv(s, t));
        if (history[s.id].length > HISTORY_LEN) history[s.id].shift();
      });
    }
    frameCount++;

    drawBg();

    switch (currentPage) {
      case 'home':    drawHome(t); break;
      case 'detail':  drawDetail(t); break;
      case 'sensors': drawSensors(t); break;
      case 'system':  drawSystem(t); break;
      case 'lora':    drawLora(t); break;
      case 'pairing': drawPairing(t); break;
      default:        drawHome(t);
    }

    drawNavBar();

    // Nav zones
    var barH = 44, barY = H - barH;
    var itemW = W / NAV.length;
    NAV.forEach(function(nav, i) {
      addZone(i * itemW, barY, itemW, barH, 'nav', nav.page);
    });

    if (texture) texture.needsUpdate = true;
  }

  // ══════════════════════════════════════════
  //  PUBLIC API
  // ══════════════════════════════════════════
  function init() {
    texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    draw();
    return texture;
  }

  function update() { draw(); }
  function setScreenMesh(mesh) { screenMesh = mesh; }
  function getScreenMesh() { return screenMesh; }

  function handleClick(uv) {
    if (!uv) return false;
    var px = uv.x * W, py = (1 - uv.y) * H;
    for (var i = 0; i < zones.length; i++) {
      var z = zones[i];
      if (px >= z.x && px <= z.x + z.w && py >= z.y && py <= z.y + z.h) {
        if (z.action === 'sensor')     { selectedSensor = z.data; currentPage = 'detail'; draw(); return true; }
        if (z.action === 'back')       { currentPage = 'home'; draw(); return true; }
        if (z.action === 'nav')        { currentPage = z.data; draw(); return true; }
        if (z.action === 'regenerate') { pairingCode = ''; pairingCodeTs = 0; draw(); return true; }
      }
    }
    return false;
  }

  function handleHover(uv) {
    if (!uv) { hoverZone = null; navHover = -1; return; }
    var px = uv.x * W, py = (1 - uv.y) * H;
    hoverZone = null; navHover = -1;
    for (var i = 0; i < zones.length; i++) {
      var z = zones[i];
      if (px >= z.x && px <= z.x + z.w && py >= z.y && py <= z.y + z.h) {
        if (z.action === 'sensor') hoverZone = z;
        if (z.action === 'nav') {
          navHover = -1;
          for (var j = 0; j < NAV.length; j++) {
            if (NAV[j].page === z.data) { navHover = j; break; }
          }
        }
        break;
      }
    }
  }

  window.Dashboard = { init: init, update: update, handleClick: handleClick, handleHover: handleHover, setScreenMesh: setScreenMesh, getScreenMesh: getScreenMesh };
})();
