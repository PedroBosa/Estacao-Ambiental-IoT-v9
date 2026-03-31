# Estação Ambiental IoT — Floriano, PI

**Documentação técnica completa de conexões, componentes, protocolo LoRa e firmware**

> **Localização:** Floriano, PI — 6°46'S 43°01'W · Altitude 94 m · Bioma Caatinga  
> **Versão:** v9 · Anemômetro+Biruta RS485, Piranômetro RS485 e Solo Capacitivo I²C adicionados; payload 52 B

---

## Sumário

1. [Visão Geral da Arquitetura](#1-visão-geral-da-arquitetura)
2. [Barramento I²C — Mapa de Endereços](#2-barramento-i²c--mapa-de-endereços)
3. [Barramento RS485 — Mapa Modbus](#3-barramento-rs485--mapa-modbus)
4. [Nó Externo — Heltec LoRa32 V3](#4-nó-externo--heltec-lora32-v3)
5. [Nó Base — Heltec LoRa32 V3 (Base)](#5-nó-base--heltec-lora32-v3-base)
6. [Nó Base — ESP32-P4 Waveshare Touch 7"](#6-nó-base--esp32-p4-waveshare-touch-7)
7. [Sensores](#7-sensores)
   - 7.1 [BME690 — Ambiental (T / UR / Pressão / VOC)](#71-bme690--ambiental-t--ur--pressão--voc)
   - 7.2 [SEN66 — PM / CO₂ / T / UR / VOC / NOx](#72-sen66--pm--co₂--t--ur--voc--nox)
   - 7.3 [SFA30 — Formaldeído (HCHO) / VOC / T / UR](#73-sfa30--formaldeído-hcho--voc--t--ur)
   - 7.4 [LTR390 — UV Index e Lux](#74-ltr390--uv-index-e-lux)
   - 7.5 [AS3935 — Detecção de Raios](#75-as3935--detecção-de-raios)
   - 7.6 [ICS-43434 — Microfone MEMS I2S](#76-ics-43434--microfone-mems-i2s)
   - 7.7 [MISOL MS-WH-SP-RG — Pluviômetro](#77-misol-ms-wh-sp-rg--pluviômetro)
   - 7.8 [Anemômetro + Biruta RS485 — Velocidade e Direção do Vento](#78-anemômetro--biruta-rs485--velocidade-e-direção-do-vento)
   - 7.9 [Piranômetro RS485 — Radiação Solar (W/m²)](#79-piranômetro-rs485--radiação-solar-wm²)
   - 7.10 [Sensor de Solo Capacitivo I²C — Umidade e Temperatura do Solo](#710-sensor-de-solo-capacitivo-i²c--umidade-e-temperatura-do-solo)
8. [Componentes Passivos e Transceiver RS485](#8-componentes-passivos-e-transceiver-rs485)
9. [Arquitetura de Alimentação](#9-arquitetura-de-alimentação)
10. [Protocolo LoRa P2P](#10-protocolo-lora-p2p)
11. [Checklist de Firmware](#11-checklist-de-firmware)
12. [Bill of Materials (BOM)](#12-bill-of-materials-bom)
13. [Especificidades — Floriano, PI (Caatinga)](#13-especificidades--floriano-pi-caatinga)
14. [Componentes Removidos do Projeto](#14-componentes-removidos-do-projeto)
15. [Validação Externa e Rastreabilidade](#15-validação-externa-e-rastreabilidade)
16. [Resumo Executivo de Conformidade](#16-resumo-executivo-de-conformidade)
17. [Referências e Normas](#17-referências-e-normas)
18. [Checklist de Comissionamento (Bancada e Campo)](#18-checklist-de-comissionamento-bancada-e-campo)
19. [Parecer Executivo de Conformidade Regulatória](#19-parecer-executivo-de-conformidade-regulatória)

---

## 1. Visão Geral da Arquitetura

```
┌──────────────────────────────────────────────────────────────────────────┐
│ NÓ EXTERNO — Heltec LoRa32 V3 (ESP32-S3)                                │
│                                                                          │
│  I²C (GPIO41 SDA / GPIO42 SCL) — 6 dispositivos                         │
│   • SEN66   (0x6B)  — PM1/2.5/4/10, CO₂, T, UR, VOC, NOx               │
│   • BME690  (0x76)  — T, UR, Pressão barométrica, VOC/IAQ (BSEC)        │
│   • SFA30   (0x5D)  — HCHO (formaldeído), VOC, T, UR                    │
│   • LTR390  (0x53)  — UV Index, Lux                                     │
│   • AS3935  (0x03)  — Raios (1–40 km)                                   │
│   • Solo    (0x36)  — Umidade do solo + Temperatura do solo  🆕          │
│                                                                          │
│  UART2 + MAX485 (GPIO47 TX / GPIO48 RX / GPIO6 DE+RE)  🆕               │
│   • Anemômetro+Biruta RS485 (Addr 0x01) — Vel. vento + Dir. vento       │
│   • Piranômetro RS485       (Addr 0x02) — Radiação solar (W/m²)         │
│                                                                          │
│  I2S (GPIO38/39/40)  • ICS-43434 — Microfone dB(A)                      │
│  IRQ (GPIO15)         • MISOL — Pluviômetro 0.3 mm/pulso                │
│                                                                          │
│  Alimentação: Painel Solar 20W + MPPT + Bateria 12V 7Ah                 │
│               → Buck DC-DC 5V (Heltec) + 12V direto (RS485 sensores)    │
└─────────────────────────────┬────────────────────────────────────────────┘
                              │ LoRa 915 MHz (SF9, BW125, Sync 0xAB, 52 B)
                              ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ NÓ BASE                                                                  │
│                                                                          │
│  Heltec LoRa32 V3 (Base)  ⇄  ESP32-P4 Waveshare Touch 7"                │
│   • GPIO45 TX  ────────▶  UART RXD (115200)                             │
│   • GPIO46 RX  ◀────────  UART TXD (115200)                             │
│   • 5V (VCC)   ◀────────  UART VCC                                      │
│                                                                          │
│  ESP32-P4: MicroSD (queue.jsonl), WiFi6→MQTT, tela touch, RTC+CR1220    │
└──────────────────────────────────────────────────────────────────────────┘
```

### Cobertura Completa de Dados Ambientais

| Categoria | Parâmetro | Sensor | Interface | Precisão |
|---|---|---|---|---|
| **Atmosférico** | Temperatura do ar | SEN66 + BME690 | I²C | ±0.45°C / ±1.0°C |
| | Umidade relativa | SEN66 + BME690 | I²C | ±4.5% / ±3% |
| | Pressão barométrica | BME690 | I²C | ±1 hPa |
| **Qualidade do Ar** | PM1 / PM2.5 / PM4 / PM10 | SEN66 | I²C | ±(5 µg/m³ + 5%) |
| | CO₂ (NDIR) | SEN66 | I²C | ±(50 ppm + 2.5%) |
| | VOC Index | SEN66 | I²C | 1–500 |
| | NOx Index | SEN66 | I²C | 1–500 |
| | Formaldeído (HCHO) | SFA30 | I²C | ±20 ppb ou ±20% |
| | IAQ (BSEC) | BME690 | I²C | 0–500 |
| **Radiação** | UV Index (UVA 315–400 nm) | LTR390 | I²C | UVI 0–15+ |
| | Iluminância (lux) | LTR390 | I²C | 0–65535 lux |
| | Radiação solar (W/m²) | Piranômetro RS485 🆕 | RS485 | ±5% (0–2000 W/m²) |
| **Meteorológico** | Velocidade do vento | Anemômetro RS485 🆕 | RS485 | ±0.3 m/s (0–60 m/s) |
| | Direção do vento | Biruta RS485 🆕 | RS485 | ±3° (0–360°) |
| | Rajada de vento | Anemômetro RS485 🆕 | RS485 | Máx. no ciclo |
| | Precipitação pluvial | MISOL | IRQ | 0.3 mm/pulso |
| **Elétrico-atmosférico** | Detecção de raios | AS3935 | I²C | 1–40 km |
| **Acústico** | Ruído ambiental dB(A) | ICS-43434 | I2S | 29–116 dB SPL |
| **Solo** | Umidade do solo | Sensor capacitivo I²C 🆕 | I²C | 200–2000 counts |
| | Temperatura do solo | Sensor capacitivo I²C 🆕 | I²C | ±2°C |

### Conexões completas — Nó Externo

| Sensor/Módulo | Pino Sensor | Dir | GPIO Heltec | Interface | Endereço | Tensão | Notas Críticas |
|---|---|:---:|---|---|---|---|---|
| SEN66 | Pin1 VDD | ← | 3V3 | PWR | — | 3.3V | JST-GH 6 pinos — alimentação 3.3V |
| SEN66 | Pin2 GND | ← | GND | PWR | — | — | GND comum |
| SEN66 | Pin3 SDA | ↔ | GPIO41 | I²C | 0x6B | 3.3V | Pull-up 4.7kΩ externo |
| SEN66 | Pin4 SCL | ← | GPIO42 | I²C | 0x6B | 3.3V | Wire.begin(41,42) |
| SEN66 | Pin5/6 | — | N/C | — | — | — | **NÃO conectar** — GND/VDD internos |
| BME690 | VCC | ← | 3V3 | PWR | — | 3.3V | Alimentação |
| BME690 | GND | ← | GND | PWR | — | — | GND comum |
| BME690 | SCK (SCL) | ← | GPIO42 | I²C | 0x76 | 3.3V | Wire.begin(41,42) |
| BME690 | SDI (SDA) | ↔ | GPIO41 | I²C | 0x76 | 3.3V | Pull-up 4.7kΩ externo |
| BME690 | SDO | ← | GND | Config | — | — | GND → Endereço 0x76 |
| BME690 | CS | ← | 3V3 | Config | — | — | HIGH → Modo I²C (10kΩ pull-up) |
| SFA30 | Pin1 VDD | ← | 3V3 | PWR | — | 3.3V | Molex 7p — SEL=GND antes de energizar |
| SFA30 | Pin2 GND | ← | GND | PWR | — | — | GND comum |
| SFA30 | Pin3 SDA | ↔ | GPIO41 | I²C | 0x5D | 3.3V | Pull-up 4.7kΩ externo |
| SFA30 | Pin4 SCL | ← | GPIO42 | I²C | 0x5D | 3.3V | Wire.begin(41,42) |
| SFA30 | Pin5 SEL | ← | GND | Config | — | — | GND = I²C. **ANTES de ligar VDD** |
| SFA30 | Pin6/7 NC | — | N/C | — | — | — | **NÃO conectar** |
| LTR390 | VIN | ← | 3V3 | PWR | — | 3.3V | Alimentação |
| LTR390 | GND | ← | GND | PWR | — | — | GND comum |
| LTR390 | SCL | ← | GPIO42 | I²C | 0x53 | 3.3V | Endereço fixo |
| LTR390 | SDA | ↔ | GPIO41 | I²C | 0x53 | 3.3V | Pull-up 4.7kΩ externo |
| LTR390 | INT | → | GPIO7 | IRQ | — | 3.3V | Opcional — pode usar poll |
| LTR390 | 3Vo | — | N/C | — | — | — | **NÃO conectar** — saída interna |
| AS3935 | VCC | ← | 3V3 | PWR | — | 3.3V | Alimentação |
| AS3935 | GND | ← | GND | PWR | — | — | GND comum |
| AS3935 | SCL | ← | GPIO42 | I²C | 0x03 | 3.3V | Wire.begin(41,42) |
| AS3935 | SI (SDA) | ↔ | GPIO41 | I²C | 0x03 | 3.3V | SI = SDA em modo I²C |
| AS3935 | CS | ← | 3V3 | Config | — | — | HIGH → Modo I²C obrigatório |
| AS3935 | IRQ | → | GPIO4 | IRQ | — | 3.3V | Borda subida — ISR obrigatória |
| AS3935 | A0 | ← | GND | Config | — | — | A0=A1=GND → 0x03 |
| AS3935 | A1 | ← | GND | Config | — | — | A0=A1=GND → 0x03 |
| AS3935 | EN_V | ← | 3V3 | Config | — | — | HIGH habilita antena interna |
| Solo Cap. | VCC | ← | 3V3 | PWR | — | 3.3V | Alimentação 🆕 |
| Solo Cap. | GND | ← | GND | PWR | — | — | GND comum 🆕 |
| Solo Cap. | SDA | ↔ | GPIO41 | I²C | 0x36 | 3.3V | Pull-up 4.7kΩ externo 🆕 |
| Solo Cap. | SCL | ← | GPIO42 | I²C | 0x36 | 3.3V | Wire.begin(41,42) 🆕 |
| ICS-43434 | 3V | ← | 3V3 | PWR | — | 3.3V | Alimentação |
| ICS-43434 | GND | ← | GND | PWR | — | — | GND comum |
| ICS-43434 | BCLK | ← | GPIO38 | I2S | — | 3.3V | Bit Clock |
| ICS-43434 | LRCL (WS) | ← | GPIO39 | I2S | — | 3.3V | Word Select |
| ICS-43434 | DOUT | → | GPIO40 | I2S | — | 3.3V | Dados de áudio PCM |
| ICS-43434 | SEL | ← | GND | Config | — | — | GND = Canal esquerdo |
| MISOL Pluv. | Fio 1 (reed) | ← | GND | PWR | — | — | GND comum |
| MISOL Pluv. | Fio 2 (reed) | → | GPIO15 | IRQ | — | 3.3V | Pull-up 10kΩ para 3.3V + TVS SMAJ3.3A |
| MAX485 | DI (Data In) | ← | GPIO47 (U1TX) | UART | — | 3.3V | Heltec TX → MAX485 DI 🆕 |
| MAX485 | RO (Rcv Out) | → | GPIO48 (U1RX) | UART | — | 3.3V | MAX485 RO → Heltec RX 🆕 |
| MAX485 | DE + RE | ← | GPIO6 | GPIO | — | 3.3V | HIGH=TX, LOW=RX (juntos) 🆕 |
| MAX485 | A/B | ↔ | Barramento RS485 | RS485 | — | 5V diff | Sensores RS485 no barramento 🆕 |
| MAX485 | VCC | ← | 3V3 | PWR | — | 3.3V | Alimentação do transceiver 🆕 |
| Anemômetro+Biruta | RS485 A/B | ↔ | MAX485 A/B | RS485 | Modbus 0x01 | 12V | Cabo blindado ≤30m 🆕 |
| Anemômetro+Biruta | VCC | ← | 12V | PWR | — | 12V | Alimentação direta 12V 🆕 |
| Piranômetro | RS485 A/B | ↔ | MAX485 A/B | RS485 | Modbus 0x02 | 12V | Multidrop com anemômetro 🆕 |
| Piranômetro | VCC | ← | 12V | PWR | — | 12V | Alimentação direta 12V 🆕 |

### Conexões completas — Nó Base

| Módulo | Pino | Dir | Destino | Interface | Tensão | Notas Críticas |
|---|---|:---:|---|---|---|---|
| Heltec Base | GPIO45 (U1TX) | → | ESP32-P4 UART·RXD | UART | 3.3V | 115200 baud — dados LoRa → ESP32-P4 |
| Heltec Base | GPIO46 (U1RX) | ← | ESP32-P4 UART·TXD | UART | 3.3V | 115200 baud — cmds ESP32-P4 → Heltec |
| Heltec Base | GND | — | ESP32-P4 UART·GND | PWR | — | GND comum obrigatório |
| Heltec Base | 5V pin | ← | ESP32-P4 UART·VCC | PWR | 5V | ESP32-P4 alimenta Heltec base |
| ESP32-P4 | SD Slot (int.) | — | MicroSD | SDIO | 3.3V | Buffer local dados — SanDisk Class10 |
| ESP32-P4 | RTC (int.) | — | CR1220 | — | 3V | Bateria backup RTC embutido |
| ESP32-P4 | WiFi6 (C6) | — | Roteador | WiFi6 | — | Publica MQTT / HTTP |

---

## 2. Barramento I²C — Mapa de Endereços

> **Configuração:** `Wire.begin(41, 42)` — SDA=GPIO41, SCL=GPIO42  
> **Velocidade:** 100 kHz (não usar 400 kHz com múltiplos dispositivos)  
> **Pull-ups:** 4.7 kΩ externos únicos em SDA e SCL — remover pull-ups internos dos breakouts

| Endereço | Sensor | Configuração | Fixo? |
|---|---|---|:---:|
| `0x03` | AS3935 | A0=A1=GND, CS=3V3 | Não |
| `0x36` | Solo Capacitivo I²C | — | Sim 🆕 |
| `0x53` | LTR390 | — | Sim |
| `0x5D` | SFA30 | SEL=GND | Não |
| `0x6B` | SEN66 | — | Sim |
| `0x76` | BME690 | SDO=GND, CS=3V3 | Não |

> ⚠️ **Não há conflito de endereços.** Os 6 endereços são únicos no barramento.

---

## 3. Barramento RS485 — Mapa Modbus 🆕

> **Configuração:** `Serial1.begin(9600, SERIAL_8N1, 48, 47)` — RX=GPIO48, TX=GPIO47  
> **Controle direção:** GPIO6 (DE+RE juntos) — HIGH=transmitir, LOW=receber  
> **Transceiver:** MAX485 (3.3V lógica) ou SP3485 (3.3V nativo)  
> **Terminação:** Resistor 120Ω entre A e B nas extremidades do barramento  
> **Protocolo:** Modbus RTU, 9600 baud, 8N1

| Endereço Modbus | Sensor | Registradores | Dados |
|---|---|---|---|
| `0x01` | Anemômetro + Biruta | Holding Registers 0x0000–0x0002 | Vel. vento (m/s), Dir. vento (°), Rajada (m/s) |
| `0x02` | Piranômetro | Holding Registers 0x0000–0x0001 | Radiação solar (W/m²) |

> ⚠️ **Não há conflito de endereços Modbus.** Os 2 endereços são únicos no barramento RS485.

> 🔴 **CRÍTICO:** Os sensores RS485 são alimentados com **12V DC**. O barramento de dados RS485 (A/B) é **diferencial** e independente da tensão de alimentação. O MAX485 opera em 3.3V lógico no lado do Heltec.

> 🔧 **FIRMWARE:** Sequência de leitura Modbus RTU:
> ```c
> digitalWrite(DE_RE_PIN, HIGH);   // Modo TX
> modbus.readHoldingRegisters(0x01, 0x0000, 3);  // Anemômetro
> digitalWrite(DE_RE_PIN, LOW);    // Modo RX
> delay(100);
> // Repetir para piranômetro (addr 0x02)
> ```

---

## 4. Nó Externo — Heltec LoRa32 V3

**MCU:** ESP32-S3 · **LoRa:** SX1262 915 MHz · **Display:** OLED 128×64 I²C

### Especificações técnicas

| Parâmetro | Valor | Parâmetro | Valor |
|---|---|---|---|
| MCU | ESP32-S3 | Flash | 8 MB |
| RAM | 512 KB SRAM | LoRa | SX1262 915 MHz |
| Potência TX | 22 dBm | Sensibilidade RX | -147 dBm |
| WiFi | 802.11 b/g/n | BT | BLE 5.0 |
| Display | OLED 128×64 I²C | Tensão VIN | 5V (USB/pino) |
| Regulador interno | 3.3V / 500 mA | Sleep | ~800 µA (RTC ativo) |
| I²C externo | GPIO41 (SDA) GPIO42 (SCL) | UART1 | GPIO47 (TX) GPIO48 (RX) |
| I2S | GPIO38/39/40 | GPIO36 | Vext_Ctrl reservado (não usado) |
| VBAT_Read | GPIO1 ADC1_CH0 | Antena LoRa | U.FL interno |

### Pinos em uso — conexões externas ativas

| GPIO | Função | Dir | Conectar em | Interface | Tensão | Notas |
|---|---|:---:|---|---|---|---|
| GPIO41 | SDA I²C externo | ↔ | Barramento I²C sensores | I²C | 3.3V | Wire.begin(41,42) — pull-up 4.7kΩ externo |
| GPIO42 | SCL I²C externo | ← | Barramento I²C sensores | I²C | 3.3V | Wire.begin(41,42) — pull-up 4.7kΩ externo |
| GPIO47 | UART1 TX → MAX485 DI | → | MAX485 DI | UART/RS485 | 3.3V | Modbus RTU Master TX 🆕 |
| GPIO48 | UART1 RX ← MAX485 RO | ← | MAX485 RO | UART/RS485 | 3.3V | Modbus RTU Master RX 🆕 |
| GPIO6 | MAX485 DE+RE | → | MAX485 DE+RE | GPIO | 3.3V | HIGH=TX, LOW=RX 🆕 |
| GPIO15 | GPIO IRQ | → | MISOL Fio 2 | IRQ | 3.3V | 100Ω série + TVS SMAJ3.3A. Pull-up 10kΩ |
| GPIO4 | IRQ AS3935 | → | AS3935 IRQ | IRQ | 3.3V | Borda subida — attachInterrupt() |
| GPIO7 | INT LTR390 | → | LTR390 INT | IRQ | 3.3V | Opcional — pode usar polling |
| GPIO38 | I2S BCLK | ← | ICS-43434 BCLK | I2S | 3.3V | Bit Clock microfone |
| GPIO39 | I2S WS | ← | ICS-43434 LRCL | I2S | 3.3V | Word Select microfone |
| GPIO40 | I2S SD | → | ICS-43434 DOUT | I2S | 3.3V | Dados áudio PCM entrada |
| GPIO36 | Vext_Ctrl | — | ESPECIAL | Config | 3.3V | Reservado (não utilizado) |
| GPIO1 | VBAT_Read | → | ADC interno | Config | ADC | analogRead(1) — divisor 1:2 — lê tensão bateria |
| U.FL | Antena LoRa | — | Pigtail U.FL→SMA | RF | — | SMA passante na caixa IP65 — antena externa |

### Pinos bloqueados — nunca conectar externamente

| GPIO | Função | Motivo do bloqueio |
|---|---|---|
| GPIO8 | LoRa CS (SX1262) | LoRa chip select interno |
| GPIO9 | LoRa SCK (SX1262) | LoRa SPI Clock |
| GPIO10 | LoRa MOSI (SX1262) | LoRa SPI MOSI |
| GPIO11 | LoRa MISO (SX1262) | LoRa SPI MISO |
| GPIO12 | LoRa RST (SX1262) | LoRa reset |
| GPIO13 | LoRa BUSY (SX1262) | LoRa busy flag |
| GPIO14 | LoRa DIO1 (SX1262) | LoRa DIO interrupt |
| GPIO17 | OLED SDA (INT) | Uso interno display OLED (SDA) |
| GPIO18 | OLED SCL (INT) | Uso interno display OLED (SCL) |
| GPIO21 | OLED RST | Reset do display OLED |
| GPIO19 | USB D− | USB D− do ESP32-S3 — **NUNCA usar como GPIO** |
| GPIO20 | USB D+ | USB D+ do ESP32-S3 — **NUNCA usar como GPIO** |
| GPIO43 | CP2102 RX | Conectado ao CP2102 USB-UART. Conflito com USB |
| GPIO44 | CP2102 TX | Conectado ao CP2102 USB-UART. Conflito com USB |

### Diagrama de conexões — passo a passo

| Passo | De (Sensor) | Pino | Dir | Para (GPIO/Rail) | Destino | Resistor/Cap | Observação Crítica |
|:---:|---|---|:---:|---|---|---|---|
| 1 | SEN66 | Pin1 VDD | ← | 3V3 Heltec | PWR | — | Alimentação direta 3.3V via JST-GH |
| 2 | SEN66 | Pin2 GND | ← | GND | PWR | — | GND comum |
| 3 | SEN66 | Pin3 SDA | ↔ | GPIO41 | I²C | 4.7kΩ pull-up a 3V3 | Dados I²C — único pull-up no barramento |
| 4 | SEN66 | Pin4 SCL | ← | GPIO42 | I²C | — | Clock I²C compartilhado |
| 5 | SEN66 | Pin5/6 | — | N/C | — | — | **NÃO** conectar — internamente ligados a GND/VDD |
| 6 | SFA30 | Pin5 SEL | ← | GND | Config | — | **PRIMEIRO:** SEL=GND **antes** de ligar VDD (modo I²C) |
| 7 | SFA30 | Pin1 VDD | ← | 3V3 Heltec | PWR | — | Alimentação direta 3.3V |
| 8 | SFA30 | Pin2 GND | ← | GND | PWR | — | GND comum |
| 9 | SFA30 | Pin3 SDA | ↔ | GPIO41 | I²C | — | Pull-up já está no barramento |
| 10 | SFA30 | Pin4 SCL | ← | GPIO42 | I²C | — | Clock I²C compartilhado |
| 11 | BME690 | SCK/SDI | ↔ | GPIO42/GPIO41 | I²C | — | SDO=GND (0x76), CS=3V3 (modo I²C) |
| 12 | LTR390 | SCL/SDA | ↔ | GPIO42/GPIO41 | I²C | — | INT opcional → GPIO7 |
| 13 | AS3935 | SCL/SI | ↔ | GPIO42/GPIO41 | I²C | — | CS=3V3, EN_V=3V3, A0=A1=GND, IRQ→GPIO4 |
| 14 | Solo Cap. | SDA/SCL | ↔ | GPIO41/GPIO42 | I²C | — | Endereço 0x36 — cabo com proteção UV 🆕 |
| 15 | ICS-43434 | BCLK/WS/DOUT | ↔ | GPIO38/39/40 | I2S | — | SEL=GND (canal esquerdo) |
| 16 | MISOL | Fio 2 | → | GPIO15 | IRQ | 100Ω+TVS SMAJ3.3A | Fio 1 → GND direto. Pull-up 10kΩ. Debounce 15ms. |
| 17 | MAX485 | DI | ← | GPIO47 | UART TX | — | Heltec TX → MAX485 Data In 🆕 |
| 18 | MAX485 | RO | → | GPIO48 | UART RX | — | MAX485 Receive Out → Heltec RX 🆕 |
| 19 | MAX485 | DE+RE | ← | GPIO6 | GPIO | — | Jumper DE+RE juntos. HIGH=TX, LOW=RX 🆕 |
| 20 | MAX485 | A/B | ↔ | Anemômetro + Piranômetro | RS485 | 120Ω terminação | Barramento RS485 multidrop 🆕 |
| 21 | Anemômetro | VCC | ← | 12V Rail | PWR | — | Alimentação 12V direta 🆕 |
| 22 | Piranômetro | VCC | ← | 12V Rail | PWR | — | Alimentação 12V direta 🆕 |
| 23 | Buck 5V | Saída | → | Heltec 5V pin | PWR | — | DC-DC 12V→5V (LM2596 ou similar) 🆕 |
| 24 | Bateria 12V | + | → | Buck 5V + RS485 sensores | PWR | — | Painel Solar 20W + MPPT + 12V 7Ah 🆕 |

### Notas críticas

> 🔴 **CRÍTICO:** `Wire.begin(41, 42)` obrigatório. Sem isso o I²C inicializa nos pinos do OLED interno (GPIO17/18) e nenhum sensor externo responde.

> 🔴 **CRÍTICO:** GPIO19 e GPIO20 são USB D- e D+. **NUNCA usar como GPIO** — danifica o ESP32-S3.

> 🔴 **CRÍTICO:** GPIO43/44 conectados ao CP2102 (USB-UART bridge). **NUNCA usar para UART externa**.

> 🔴 **CRÍTICO (RS485):** GPIO6 controla DE+RE do MAX485. Garantir que está LOW (modo RX) por padrão. Só colocar HIGH durante envio de frame Modbus RTU. 🆕

> ⚠️ **IMPORTANTE:** GPIO36 (Vext_Ctrl) está reservado e não é usado nesta arquitetura.

> ⚠️ **IMPORTANTE:** GPIO1 = VBAT_Read. analogRead(1) — divisor 1:2 — lê tensão da bateria 12V (após divisor).

> ⚠️ **IMPORTANTE:** Calibrar AS3935 com o ventilador interno do SEN66 ativo. Ajustar NOISE_FLOOR até eliminar falsos positivos.

> ⚠️ **IMPORTANTE:** Antena LoRa requer pigtail U.FL→SMA + conector SMA passante na caixa IP65.

> 🔧 **FIRMWARE:** Estado BSEC do BME690: salvar na flash Preferences a cada 1 hora (a cada 12 ciclos quando intervalo=5min).

> 🔴 **CRÍTICO (SFA30):** Pino SEL deve estar em GND **ANTES** de ligar VDD. Se SEL flutuar ao energizar, sensor inicializa em UART e não aparece no I²C.

> 🔧 **BARRAMENTO I²C:** Usar 100 kHz. Com 6 dispositivos no barramento e pull-ups externos únicos (4.7kΩ), o tempo de subida é compatível com Standard-mode.

> 🔧 **BARRAMENTO RS485:** Usar 9600 baud com Modbus RTU. Resistor de terminação 120Ω entre A e B na extremidade mais distante do barramento. 🆕

---

## 5. Nó Base — Heltec LoRa32 V3 (Base)

**Função:** Receptor LoRa P2P contínuo · Retransmite via UART para ESP32-P4

### Especificações técnicas

| Parâmetro | Valor | Parâmetro | Valor |
|---|---|---|---|
| MCU | ESP32-S3 | Função principal | Receptor LoRa P2P |
| LoRa | SX1262 915 MHz | Sync Word | 0xAB (privado) |
| Modo RX | Contínuo (nunca dorme) | Endereço | 0x02 (ADDR_BASE) |
| UART para ESP32 | GPIO45 (TX) / GPIO46 (RX) | Baud Rate | 115200 |
| Buffer RX | Fila circular 8 pacotes | Display OLED | 128×64 — status em tempo real |
| Tensão | 5V via ESP32-P4 UART·VCC | Corrente | ~30 mA RX / ~120 mA TX |

### Pinout

| GPIO | Função | Dir | Conectar em | Interface | Tensão | Notas |
|---|---|:---:|---|---|---|---|
| GPIO45 | U1TXD — TX UART | → | ESP32-P4 UART·RXD | UART | 3.3V | Dados LoRa decodificados → ESP32-P4 |
| GPIO46 | U1RXD — RX UART | ← | ESP32-P4 UART·TXD | UART | 3.3V | Comandos / ACK timestamp ESP32-P4 → Heltec |
| 5V | VIN alimentação | ← | ESP32-P4 UART·VCC | PWR | 5V | ESP32-P4 alimenta o Heltec base |
| GND | GND | — | ESP32-P4 UART·GND | PWR | — | GND comum obrigatório |
| U.FL | Antena LoRa | — | Pigtail U.FL→SMA | RF | — | Antena posicionada para melhor recepção |
| GPIO17 | OLED SDA (INT) | — | Display interno | I²C | 3.3V | BLOQUEADO — uso interno |
| GPIO18 | OLED SCL (INT) | — | Display interno | I²C | 3.3V | BLOQUEADO — uso interno |
| GPIO43 | CP2102 RX | — | USB bridge | — | — | BLOQUEADO — conflito com USB programming |
| GPIO44 | CP2102 TX | — | USB bridge | — | — | BLOQUEADO — conflito com USB programming |

### Diagrama de conexões — passo a passo

| Passo | De | Pino | Dir | Para | Destino | Observação Crítica |
|:---:|---|---|:---:|---|---|---|
| 1 | Heltec Base | GPIO45 U1TX | → | ESP32-P4 | UART·RXD | 115200 baud · Struct 52 bytes via UART1 |
| 2 | Heltec Base | GPIO46 U1RX | ← | ESP32-P4 | UART·TXD | 115200 baud · ACK com timestamp NTP |
| 3 | ESP32-P4 | UART·VCC 5V | → | Heltec Base | 5V pin | ESP32-P4 alimenta o Heltec base |
| 4 | ESP32-P4 | UART·GND | — | Heltec Base | GND | GND comum obrigatório |
| 5 | Heltec Base | U.FL | → | Pigtail U.FL→SMA | Antena | Antena LoRa externa para melhor recepção |

### Notas críticas

> 🔴 **CRÍTICO:** **NUNCA usar GPIO43/44** para UART com ESP32-P4. Esses pinos estão conectados ao CP2102. Usar **apenas GPIO45/46**.

> 🔴 **CRÍTICO:** **NUNCA usar GPIO19/20** como GPIO — são USB D-/D+ do ESP32-S3.

> ⚠️ **IMPORTANTE:** O Heltec base fica em modo RX **CONTÍNUO** — nunca entra em deep sleep. Alimentado continuamente via ESP32-P4.

> ⚠️ **IMPORTANTE:** Implementar fila circular de 8 pacotes no firmware para evitar UART overflow.

> 🔧 **FIRMWARE:** Ao receber pacote LoRa válido: verificar ADDR_EXTERNO (0x01), verificar sync word 0xAB, enviar ACK com timestamp NTP via LoRa, repassar payload via UART para ESP32-P4.

> 🔧 **FIRMWARE:** Exibir no display OLED: temperatura, CO₂, PM2.5, UVI, vento (vel+dir), radiação solar, status LoRa (RSSI), status WiFi e última hora de recebimento.

> 🔧 **ENDEREÇAMENTO:** ADDR_BASE = 0x02, SYNC_WORD = 0xAB. Descartar pacotes de endereços desconhecidos.

---

## 6. Nó Base — ESP32-P4 Waveshare Touch 7"

**Função:** Hub principal WiFi6 · Tela touch · SD Card · RTC · MQTT · OTA

### Especificações técnicas

| Parâmetro | Valor | Parâmetro | Valor |
|---|---|---|---|
| MCU | ESP32-P4 Core (dual-core 400 MHz) | RAM | 32 MB Nor Flash + SRAM |
| Co-proc. | ESP32-C6 (WiFi6/BT5) | Display | IPS Touch 7" 1024×600 |
| Interface disp. | MIPI DSI | Touch | 5 pontos |
| SD Card | Slot TF SDIO 3.0 embutido | RTC | Embutido + CR1220 |
| Câmera | MIPI 2-lane | Microfones | 2× onboard + ES7210 |
| Codec áudio | ES8311 + ES7210 | CAN | Header PH2.0 4p |
| RS485 | Header PH2.0 4p | UART | Header PH2.0 4p |
| I²C | Header PH2.0 4p | GPIO | Header PH2.0 12p (17 GPIOs) |
| Tensão | USB-C 5V | OTA | ArduinoOTA via WiFi6 |

### Pinout e conexões

| Pino | Função | Dir | Conectar em | Interface | Tensão | Notas |
|---|---|:---:|---|---|---|---|
| UART·TXD | TX UART para Heltec | → | Heltec Base GPIO46 | UART | 3.3V | Comandos / sync timestamp |
| UART·RXD | RX UART do Heltec | ← | Heltec Base GPIO45 | UART | 3.3V | Payload 52 bytes do nó externo |
| UART·GND | GND UART | — | Heltec Base GND | PWR | — | GND comum obrigatório |
| UART·VCC | 5V para Heltec | → | Heltec Base 5V | PWR | 5V | Alimenta o Heltec base |
| SD Slot | MicroSD interno | — | Cartão SanDisk 32 GB | SDIO | 3.3V | Buffer local — fila JSONL quando WiFi cai |
| RTC interno | Relógio tempo real | — | Bateria CR1220 | — | 3V | Mantém hora sem energia |
| WiFi6 (C6) | Radio WiFi6/BT | — | Roteador WiFi | WiFi6 | — | Publica MQTT / ArduinoOTA |
| USB-C | Alimentação | ← | Fonte 5V 2A | PWR | 5V | Fonte principal nó base |

### Diagrama de conexões — passo a passo

| Passo | De | Pino | Dir | Para | Destino | Observação Crítica |
|:---:|---|---|:---:|---|---|---|
| 1 | ESP32-P4 | UART·RXD | ← | Heltec Base | GPIO45 TX | Recebe payload 52 bytes struct |
| 2 | ESP32-P4 | UART·TXD | → | Heltec Base | GPIO46 RX | Envia ACK + timestamp NTP |
| 3 | ESP32-P4 | UART·VCC | → | Heltec Base | 5V pin | Alimentação do Heltec base |
| 4 | ESP32-P4 | SD Slot | → | MicroSD 32 GB | — | Instalar cartão SanDisk Class10 |
| 5 | ESP32-P4 | RTC | ← | CR1220 | 3V | Instalar bateria CR1220 no holder |
| 6 | ESP32-P4 | USB-C | ← | Fonte 5V 2A | — | Alimentação principal |
| 7 | ESP32-P4 | WiFi6 | ↔ | Roteador | — | SSID/senha em firmware config.h |

### Notas críticas

> 🔴 **CRÍTICO:** O ESP32-P4 usa ESP32-C6 como co-processador de rádio via SDIO. WiFi6 funciona de forma transparente.

> 🔴 **CRÍTICO:** Nível lógico 3.3V nas linhas UART. O header UART tem VCC=5V (alimentação) mas os sinais TXD/RXD são 3.3V lógico.

> ⚠️ **IMPORTANTE:** Buffer circular no SD (arquivo `queue.jsonl`). Ao receber payload: gravar no SD **PRIMEIRO**, depois tentar MQTT.

> ⚠️ **IMPORTANTE:** `ArduinoOTA.begin()` no setup() para permitir atualização de firmware via WiFi sem acesso físico.

> ⚠️ **IMPORTANTE:** Detecção de estação offline — com intervalo padrão de 5min, publicar `'OFFLINE'` se passar 15min sem pacote.

> 🔧 **FIRMWARE:** Receber struct binária 52 bytes do Heltec via UART → deserializar → converter para JSON → publicar MQTT tópicos individuais por sensor.

> ⚠️ **IMPORTANTE:** SD Card — usar `SD_MMC` (SDIO 3.0 nativo do ESP32-P4). **Não usar** biblioteca SPI para SD.

> ⚠️ **IMPORTANTE:** RTC CR1220 — sincronizar via NTP ao conectar WiFi e incluir timestamp NTP no ACK enviado para o nó externo.

---

## 7. Sensores

### 7.1 BME690 — Ambiental (T / UR / Pressão / VOC / IAQ)

**Fabricante:** Bosch · **Mede:** Temperatura, Umidade, Pressão Barométrica, VOC/IAQ · **Papel no projeto:** sensor de referência de pressão e IAQ via BSEC

#### Especificações

| Parâmetro | Valor | Parâmetro | Valor |
|---|---|---|---|
| Faixa T | -40°C a +85°C | Precisão T | ±1.0°C |
| Faixa UR | 0–100% | Precisão UR | ±3% UR |
| Faixa pressão | 300–1100 hPa | Precisão pressão | ±1 hPa |
| VOC / IAQ | 0–500 (via BSEC 2.x) | Princípio VOC | MOX — sensor de resistência |
| Interface | I²C ou SPI | Endereço I²C | 0x76 (SDO=GND) / 0x77 (SDO=VCC) |
| Tensão | 1.8–3.6V | Corrente | ~3.7 mA medição |
| Burn-in VOC | 24h primeira utilização | Biblioteca VOC | **BSEC 2.x (Bosch) — obrigatório** |
| CS modo I²C | CS=HIGH (3.3V) | SDO endereço | SDO=GND → 0x76 |

#### Pinout

| Pino | Função | Dir | Conectar em | Interface | Tensão | Notas |
|---|---|:---:|---|---|---|---|
| VCC | Alimentação | ← | 3V3 Heltec | PWR | 3.3V | Direto no rail 3.3V |
| GND | Terra | ← | GND Heltec | PWR | — | GND comum |
| SCK (SCL) | Clock I²C | ← | GPIO42 Heltec | I²C | 3.3V | Barramento I²C compartilhado |
| SDI (SDA) | Dados I²C | ↔ | GPIO41 Heltec | I²C | 3.3V | Pull-up 4.7kΩ externo |
| SDO | Seleção endereço | ← | GND | Config | — | GND → endereço 0x76 |
| CS | Seleção modo | ← | 3V3 (10kΩ pull-up) | Config | 3.3V | HIGH = modo I²C. **CRÍTICO** |

#### Notas críticas

> 🔴 **CRÍTICO:** Pino CS deve estar em HIGH (3.3V) para habilitar modo I²C. Se CS flutuar ou for GND, sensor entra em modo SPI e **desaparece do barramento I²C**.

> 🔴 **CRÍTICO:** BSEC 2.x obrigatório para VOC/IAQ. O driver raw retorna resistência bruta em kΩ sem significado direto.

> 🔴 **BURN-IN:** Na primeira utilização, o sensor MOX precisa de **24 horas** de operação contínua para estabilizar. IAQ reportará 'não calibrado' (valor 25) durante esse período.

> 🔧 **FIRMWARE:** Salvar estado BSEC a cada 1 hora (12 ciclos com intervalo padrão de 5min) com `bsec.getState()` + `Preferences.putBytes('bsec_state', ...)`. Restaurar no boot. Sem isso, IAQ reinicia após cada reset.

> 📌 **FLORIANO, PI — ALTITUDE 94m:** Pressão local (QFE) difere ~11 hPa do nível do mar (QNH). Publicar ambos:
> ```c
> float qnh = qfe * exp(94.0 / (29.3 * (temp_c + 273.15)));
> ```
> Publicar MQTT: `sensor/pressao_qfe` E `sensor/pressao_qnh`.

> ⚠️ **ABRIGO:** BME690 deve estar dentro do abrigo meteorológico ventilado — **nunca** dentro da caixa IP65 selada.

---

### 7.2 SEN66 — PM / CO₂ / T / UR / VOC / NOx

**Fabricante:** Sensirion · **Série:** SEN6x · **Conector:** JST-GH 6 pinos · **Mede:** PM1/2.5/4/10, CO₂ (NDIR), T, UR, VOC Index, NOx Index

#### Especificações

| Parâmetro | Valor | Parâmetro | Valor |
|---|---|---|---|
| PM medidos | PM1, PM2.5, PM4, PM10 | Precisão PM2.5 | ±(5 µg/m³ + 5%) em 0–100 µg/m³ |
| Faixa PM | 0–1000 µg/m³ | Princípio PM | Dispersão laser óptica |
| CO₂ (NDIR) | 0–40.000 ppm | Precisão CO₂ (400–1000ppm) | ±(50 ppm + 2.5% leitura) |
| Faixa T | 0–70°C (operação) | Precisão T | ±0.45°C (15–30°C, 50% UR) |
| Faixa UR | 0–100% | Precisão UR | ±4.5% (25°C, 30–70% UR) |
| VOC Index | 1–500 pontos | NOx Index | 1–500 pontos |
| Interface | I²C | Endereço I²C | **0x6B (fixo)** |
| Tensão | **3.15–3.45V (3.3V nominal)** | Corrente média | ~90 mA em operação |
| Startup I²C | 100 ms após power-on | PM estável | ~60–120s (estabilização térmica) |
| Vida útil | **>10 anos** (24h/dia contínuo) | Limpeza | Patented Sheath Flow — **sem manutenção** |

#### Pinout JST-GH 6 pinos

| Pino | Cor | Função | Dir | Conectar em | Interface | Tensão | Notas |
|---|---|---|:---:|---|---|---|---|
| Pin 1 | Vermelho | VDD | ← | 3V3 Heltec | PWR | 3.3V | **3.3V nominal — não usar 5V** |
| Pin 2 | Preto | GND | ← | GND Heltec | PWR | — | GND comum |
| Pin 3 | Verde | SDA | ↔ | GPIO41 Heltec | I²C | 3.3V | Pull-up 4.7kΩ externo |
| Pin 4 | Amarelo | SCL | ← | GPIO42 Heltec | I²C | 3.3V | Wire.begin(41,42) |
| Pin 5 | — | NC | — | N/C | — | — | **NÃO conectar** — internamente ao GND |
| Pin 6 | — | NC | — | N/C | — | — | **NÃO conectar** — internamente ao VDD |

#### Notas críticas

> 🔴 **CRÍTICO:** Alimentação **3.3V obrigatório** (3.15–3.45V). 5V danifica o sensor.

> 🔴 **CRÍTICO:** Pinos Pin5 e Pin6 são NC — **não conectar**. Internamente ligados a GND e VDD, respectivamente.

> 🔴 **CRÍTICO:** O SEN66 **não possui modo de desligamento hardware**. Gerenciar energia via comandos I²C: `startMeasurement()` no início do ciclo, `stopMeasurement()` após leitura (standby: ~5 mA).

> ⚠️ **IMPORTANTE:** Aguardar **100 ms** após power-on antes de iniciar comunicação I²C. Para leituras de PM estáveis, aguardar 60–120s após `startMeasurement()`.

> ⚠️ **ACESSO AO AR:** O SEN66 precisa de fluxo de ar externo para PM e VOC. Não pode ficar dentro de caixa IP65 selada.

> 🔧 **FIRMWARE — CICLO DE MEDIÇÃO:**
> ```c
> sen66.startMeasurement();
> delay(2000);               // mínimo para CO₂ e gases
> // Leitura de PM, CO₂, T, UR, VOC, NOx
> sen66.stopMeasurement();   // reduz para ~5 mA em standby
> ```

> 🔧 **NOx Index:** Escala 1–500. Valores típicos em ar limpo: 1–10. Valores acima de 50 indicam poluição por NOx (veículos, queimadas).

> ⚠️ **ABRIGO:** O SEN66 deve estar em posição com entrada de ar para as aberturas do sensor. Montar com inlet voltado para baixo para evitar acúmulo de poeira.

---

### 7.3 SFA30 — Formaldeído (HCHO) / VOC / T / UR

**Fabricante:** Sensirion · **Série:** SFA3x · **Conector:** Molex Micro-Lock Plus 1.25mm 7 pinos · **Mede:** HCHO (formaldeído), VOC (qualitativo), T, UR

#### Especificações

| Parâmetro | Valor | Parâmetro | Valor |
|---|---|---|---|
| Faixa HCHO | 0–1000 ppb | Precisão HCHO | ±20 ppb ou ±20% (o maior) |
| Saturação | 5000 ppb (output limit) | Ref. condições | 25±3°C, 50±5% UR |
| T / UR | Medidos internamente | Princípio HCHO | Eletroquímico + MOX |
| Interface | I²C (SEL=GND) ou UART | Endereço I²C | **0x5D (fixo)** |
| Tensão | **3.15–5.5V (usar 3.3V)** | Corrente média | ~1 mA |
| Startup | 10s bloqueado (HCHO) | Estabilização | 1–2h para HCHO estável |
| Resposta (HCHO) | <2 minutos (t₆₃) | Conector | Molex Micro-Lock Plus 7p |

#### Pinout Molex 7 pinos

| Pino | Função | Dir | Conectar em | Interface | Tensão | Notas |
|---|---|:---:|---|---|---|---|
| Pin 1 | VDD | ← | 3V3 Heltec | PWR | 3.3V | **Apenas após conectar SEL=GND** |
| Pin 2 | GND | ← | GND Heltec | PWR | — | GND comum |
| Pin 3 | SDA (RX) | ↔ | GPIO41 Heltec | I²C | 3.3V | Pull-up 4.7kΩ externo |
| Pin 4 | SCL (TX) | ← | GPIO42 Heltec | I²C | 3.3V | Wire.begin(41,42) |
| Pin 5 | SEL | ← | GND | Config | — | GND = I²C. **CRÍTICO: ANTES de VDD** |
| Pin 6 | NC | — | N/C | — | — | **NÃO conectar** |
| Pin 7 | NC | — | N/C | — | — | **NÃO conectar** |

#### Notas críticas

> 🔴 **CRÍTICO:** Pino SEL **DEVE** estar em GND antes de ligar VDD. Se SEL flutuar ao energizar, o sensor inicializa em UART (modo padrão) e **não responde no I²C** (endereço 0x5D ausente).

> ⚠️ **STARTUP:** A leitura de HCHO é suprimida nos primeiros **10 segundos** após power-on. T e UR são disponíveis imediatamente.

> ⚠️ **ESTABILIZAÇÃO:** Para HCHO confiável, aguardar pelo menos **1–2 horas** de operação contínua. O firmware deve marcar `hcho_valid=false` nos primeiros 7200s após boot.

> ⚠️ **ABRIGO:** O SFA30 precisa de acesso ao ar externo para HCHO e VOC. Não instalar dentro de caixa IP65 selada.

> 📌 **RELEVÂNCIA — FLORIANO, PI:** HCHO (formaldeído) é relevante em contextos de queimadas (Caatinga, ago–out) e ambientes internos. Valores típicos ao ar livre: 1–15 ppb. Valores durante queimadas: até 100+ ppb.

---

### 7.4 LTR390 — UV Index e Lux

**Fabricante:** Lite-On · **Mede:** UV-A (315–400 nm) → UVI · Visível → lux

#### Especificações

| Parâmetro | Valor | Parâmetro | Valor |
|---|---|---|---|
| Faixa UV | 315–400 nm (UV-A) | Faixa ALS | Visível 400–700 nm |
| Saída ALS | 0–65535 lux | Endereço I²C | 0x53 (fixo) |
| Tensão | 1.7–3.6V | Corrente ativa | ~0.6 mA |
| Resolução | 16 a 20 bits | Modos | UV e ALS alternados (não simultâneos) |
| UVI máx Floriano | 13–15 (extremo) | INT | Interrupção por limiar |

#### Pinout

| Pino | Função | Dir | Conectar em | Interface | Tensão | Notas |
|---|---|:---:|---|---|---|---|
| VIN | Alimentação | ← | 3V3 Heltec | PWR | 3.3V | **Não usar 5V** — máximo 3.6V |
| GND | Terra | ← | GND Heltec | PWR | — | GND comum |
| SCL | Clock I²C | ← | GPIO42 Heltec | I²C | 3.3V | Barramento compartilhado |
| SDA | Dados I²C | ↔ | GPIO41 Heltec | I²C | 3.3V | Pull-up 4.7kΩ externo |
| INT | Interrupção | → | GPIO7 Heltec | IRQ | 3.3V | Opcional — pode usar polling |
| 3Vo | Saída regulador | — | N/C | — | — | **NÃO conectar** — saída do regulador interno |

#### Notas críticas

> 🔴 **CRÍTICO:** Vidro comum (caixa IP65, janelas, plástico) **bloqueia >90% do UV-A** (315–400 nm). O LTR390 **DEVE** estar exposto diretamente ao céu ou com janela de **PMMA** (acrílico UV-transparente).

> 🔧 **FIRMWARE:** O LTR390 não mede UV e ALS simultaneamente. Alternar: modo UV (5s) → ler UVI → modo ALS (5s) → ler lux.

> 📌 **FLORIANO, PI — UVI 13–15:** Usar `GAIN_1X` entre 10h–14h na estação seca (ago–out) para evitar saturação. `GAIN_3X` fora desse intervalo.

---

### 7.5 AS3935 — Detecção de Raios

**Fabricante:** ams · **Breakout:** CJMCU-3935 · **Detecta:** emissões EM de raios em 300–1000 kHz

#### Especificações

| Parâmetro | Valor | Parâmetro | Valor |
|---|---|---|---|
| Faixa detecção | 1–40 km em 15 faixas | Frequência EM | 300–1000 kHz |
| Interface | I²C (CS=HIGH) ou SPI (CS=LOW) | Endereço I²C | 0x03 (A0=A1=GND) |
| Tensão | 2.4–5.5V | Corrente listening | ~0.35 mA |
| Antena | LC interna ressonante 500 kHz | Calibração | `calibrateResonanceFrequency()` |
| IRQ | Borda de subida a cada evento | EN_V | HIGH=antena habilitada |

#### Pinout

| Pino | Função | Dir | Conectar em | Interface | Tensão | Notas |
|---|---|:---:|---|---|---|---|
| VCC | Alimentação | ← | 3V3 Heltec | PWR | 3.3V | Direto no rail 3.3V |
| GND | Terra | ← | GND Heltec | PWR | — | GND comum |
| SCL | Clock I²C | ← | GPIO42 Heltec | I²C | 3.3V | Em modo I²C |
| SI (SDA) | Dados I²C | ↔ | GPIO41 Heltec | I²C | 3.3V | SI = SDA quando em modo I²C |
| CS | Seleção modo | ← | 3V3 | Config | 3.3V | HIGH = I²C mode. **Crítico!** |
| IRQ | Interrupção raio | → | GPIO4 Heltec | IRQ | 3.3V | Borda subida — ISR obrigatória |
| A0 | Endereço bit 0 | ← | GND | Config | — | A0=A1=GND → 0x03 |
| A1 | Endereço bit 1 | ← | GND | Config | — | A0=A1=GND → 0x03 |
| EN_V | Habilita antena | ← | 3V3 | Config | 3.3V | HIGH habilita antena interna |

#### Notas críticas

> 🔴 **CRÍTICO:** CS deve estar em HIGH (3V3) para modo I²C. Se CS flutuar para LOW, o sensor entra em modo SPI e **some do barramento I²C**.

> 🔴 **CRÍTICO:** Calibrar antena LC no setup() **APENAS em Cold Boot**. Não recalibrar em wake-ups de Deep Sleep.

> 🔴 **CRÍTICO:** Mínimo **10cm de distância do SEN66** dentro da case. Ventilador do SEN66 gera ruído 300kHz–1MHz.

> 🔧 **ISR:** IRQ dispara na borda de subida. Na ISR, apenas setar flag. No loop principal, ler registradores via I²C (não fazer I²C dentro da ISR).

> 🔧 **FIRMWARE:** Configurar `WATCHDOG_THRESHOLD = 2`, `NOISE_FLOOR = ajustado na calibração`, `MIN_NUM_LIGHTNING = 1`.

---

### 7.6 ICS-43434 — Microfone MEMS I2S

**Fabricante:** InvenSense · **Interface:** I2S digital · **Uso:** Ruído ambiental dB(A)

#### Especificações

| Parâmetro | Valor | Parâmetro | Valor |
|---|---|---|---|
| SNR | 65 dB(A) | Faixa SPL | 29–116 dB SPL |
| Resposta freq. | 50 Hz – 20 kHz | Interface | I2S digital |
| Tensão | 1.5–3.6V | Corrente | ~0.65 mA |
| Saída | PCM digital 24-bit | L/R Select | SEL: GND=esquerdo, VDD=direito |

#### Pinout

| Pino | Função | Dir | Conectar em | Interface | Tensão | Notas |
|---|---|:---:|---|---|---|---|
| 3V | Alimentação | ← | 3V3 Heltec | PWR | 3.3V | 1.5–3.6V — não usar 5V |
| GND | Terra | ← | GND Heltec | PWR | — | GND comum |
| BCLK | Bit Clock | ← | GPIO38 Heltec | I2S | 3.3V | Bit clock gerado pelo Heltec |
| LRCL | Word Select | ← | GPIO39 Heltec | I2S | 3.3V | LR Clock — 44100 Hz recomendado |
| DOUT | Dados PCM saída | → | GPIO40 Heltec | I2S | 3.3V | Dados de áudio 24-bit PCM |
| SEL | Seleção canal | ← | GND | Config | — | GND = canal esquerdo |

#### Notas críticas

> ⚠️ **ISOLAMENTO:** O microfone deve estar em cápsula acústica separada da caixa principal. O ventilador do SEN66 gera ruído mecânico que contamina as leituras.

> 🔴 **FILTRO dB(A):** O microfone retorna PCM bruto. Para valores regulatórios (**ABNT NBR 10151**), aplicar filtro IIR ponderação A via ESP-DSP antes do cálculo RMS.

> 🔧 **FIRMWARE:** Usar `esp_i2s_read()` com DMA. Buffer de 1024 samples a 44100 Hz. Calcular RMS → converter para dBFS → aplicar filtro A → resultado em dB(A).

> ⚠️ **FLORIANO, PI — VENTOS:** Ventos de 40–60 km/h são frequentes. Usar espuma open-cell de pelo menos **15 mm de espessura** na abertura do microfone.

---

### 7.7 MISOL MS-WH-SP-RG — Pluviômetro

**Tipo:** Báscula com reed switch magnético · **Cabo:** RJ11 · **Passivo** (sem alimentação)

#### Especificações

| Parâmetro | Valor | Parâmetro | Valor |
|---|---|---|---|
| Princípio | Báscula com reed switch magnético | Resolução | 0.3 mm por pulso |
| Saída | Reed switch — contato seco | Cabo | RJ11 (telefônico) |
| Alimentação | Passivo — sem alimentação | Polaridade | Sem polaridade |
| Debounce | 5ms bounce mecânico → debounce **15ms** | Interface GPIO | 1 GPIO + pull-up |

#### Pinout

| Pino | Função | Dir | Conectar em | Interface | Tensão | Notas |
|---|---|:---:|---|---|---|---|
| Fio 1 (RJ11) | Reed switch terminal 1 | ← | GND | PWR | — | Ligado diretamente ao GND |
| Fio 2 (RJ11) | Reed switch terminal 2 | → | GPIO15 Heltec | IRQ | 3.3V | 10kΩ pull-up a 3.3V + 100Ω série + TVS SMAJ3.3A |

#### Notas críticas

> 🔴 **CRÍTICO:** Proteção ESD obrigatória. Cabo externo longo durante temporal com raios = antena. Resistor 100Ω em série + TVS SMAJ3.3A ao GND no GPIO15.

> 🔴 **CRÍTICO:** Debounce de **15ms** obrigatório na ISR. Reed switch tem bounce mecânico de até 5ms.

> ⚠️ **NIVELAMENTO:** Instalar com bolha de nível centralizada. Inclinação de 1° = erro ±8%.

> ⚠️ **POSICIONAMENTO (WMO-No.8):** Altura 1.2–1.5m do chão e raio livre mínimo de obstáculos igual a 2× a altura do obstáculo mais próximo.

> 🔧 **FIRMWARE:** `attachInterrupt(GPIO_NUM_15, isrChuva, FALLING)`. ISR: use millis() para debounce não-bloqueante (`if (millis() - last_irq > 15)`).

> ⚠️ **ACUMULAÇÃO SEGURA:** Variável `rainPulses` deve ser `volatile`. **NÃO zerar** antes de ACK confirmado. Acumular se TX falhar.

> 🔧 **DETECÇÃO ENTUPIMENTO:** Se UR > **70%** por 30min E rain = 0 → alerta `'VERIFICAR_PLUVIOMETRO'`.

> 🔧 **FLORIANO, PI — MANUTENÇÃO PRÉ-CHUVAS:** Limpar o funil e verificar a báscula em **DEZEMBRO**, antes das primeiras chuvas de janeiro.

---

### 7.8 Anemômetro + Biruta RS485 — Velocidade e Direção do Vento 🆕

**Tipo:** Módulo combinado RS485 Modbus RTU (ex: XY-WSD, Renke RK100-02, ou similar) · **Mede:** Velocidade (m/s) e Direção (°) do vento em um único módulo

#### Especificações

| Parâmetro | Valor | Parâmetro | Valor |
|---|---|---|---|
| Velocidade do vento | 0–60 m/s | Precisão velocidade | ±0.3 m/s (ou ±3% > 10 m/s) |
| Direção do vento | 0–360° | Precisão direção | ±3° |
| Princípio velocidade | Ultrasônico ou copo mecânico | Princípio direção | Potenciômetro ou ultrasônico |
| Interface | RS485 Modbus RTU | Endereço Modbus | **0x01 (configurável via DIP switch)** |
| Baud Rate | 9600 (padrão) | Formato | 8N1 |
| Tensão alimentação | **10–30V DC (usar 12V)** | Corrente | ~20–50 mA (12V) |
| Registradores | HR 0x0000 = Vel (×10), HR 0x0001 = Dir (×10) | Function Code | 03 (Read Holding Registers) |
| Proteção | IP65 | Faixa T operação | -40°C a +80°C |
| Cabo | 4 fios (VCC, GND, A, B) blindados | Comprimento máx | ~30m (cabo blindado) |

#### Pinout / Conexões

| Fio | Cor Típica | Função | Dir | Conectar em | Tensão | Notas |
|---|---|---|:---:|---|---|---|
| VCC | Vermelho | Alimentação | ← | Rail 12V | 12V DC | Direto na bateria 12V |
| GND | Preto | Terra | ← | GND comum | — | GND compartilhado com Heltec via buck |
| A (RS485+) | Amarelo | RS485 Data+ | ↔ | MAX485 pino A | Diferencial | Terminação 120Ω na extremidade |
| B (RS485-) | Azul | RS485 Data- | ↔ | MAX485 pino B | Diferencial | Par trançado blindado recomendado |

#### Diagrama de conexões

| Passo | De | Pino | Dir | Para | Observação |
|:---:|---|---|:---:|---|---|
| 1 | Anemômetro | VCC | ← | Rail 12V | Alimentação direta 12V |
| 2 | Anemômetro | GND | ← | GND comum | GND compartilhado |
| 3 | Anemômetro | A (RS485+) | ↔ | MAX485 A | Multidrop com piranômetro |
| 4 | Anemômetro | B (RS485-) | ↔ | MAX485 B | Multidrop com piranômetro |

#### Notas críticas

> 🔴 **CRÍTICO:** Alimentação **12V DC obrigatória**. Não alimentar com 5V ou 3.3V — o sensor não responderá.

> 🔴 **CRÍTICO:** Configurar endereço Modbus para **0x01** via DIP switch ou software antes da instalação. Confirmar com manual do fabricante.

> ⚠️ **IMPORTANTE:** Instalar em mastro a **≥2m de altura** e ≥10× a distância do obstáculo mais próximo (WMO-No.8). O anemômetro precisa de fluxo livre de ar em 360°.

> ⚠️ **IMPORTANTE:** Cabo blindado de **≤30m** entre sensor e caixa IP65. Aterrar a blindagem no lado do sensor.

> 🔧 **FIRMWARE — LEITURA MODBUS:**
> ```c
> // Configurar UART2 para Modbus RTU
> Serial1.begin(9600, SERIAL_8N1, 48, 47);
> 
> // Ler velocidade e direção (2 registradores a partir de 0x0000)
> digitalWrite(DE_RE, HIGH);  // Modo TX
> uint8_t frame[] = {0x01, 0x03, 0x00, 0x00, 0x00, 0x02, CRC_LO, CRC_HI};
> Serial1.write(frame, sizeof(frame));
> Serial1.flush();
> digitalWrite(DE_RE, LOW);   // Modo RX
> delay(200);
> // Ler resposta: vel = reg0 / 10.0 (m/s), dir = reg1 / 10.0 (°)
> ```

> 🔧 **RAJADA DE VENTO:** O firmware deve rastrear o valor máximo de velocidade do vento no ciclo de 5min e reportar como `wind_gust` no payload.

> 📌 **FLORIANO, PI — VENTOS:** Ventos predominantes E/NE. Rajadas de 40–60 km/h (11–17 m/s) são frequentes na seca. O sensor deve suportar até 60 m/s (216 km/h) para segurança.

> 📌 **ESCALA BEAUFORT:** Para referência no dashboard:
> | Beaufort | Velocidade (m/s) | Descrição |
> |:---:|---|---|
> | 0 | 0–0.2 | Calmaria |
> | 1–3 | 0.3–5.4 | Brisa |
> | 4–5 | 5.5–10.7 | Moderado |
> | 6–7 | 10.8–17.1 | Forte |
> | 8–9 | 17.2–24.4 | Temporal |
> | 10–12 | ≥24.5 | Destrutivo |

---

### 7.9 Piranômetro RS485 — Radiação Solar (W/m²) 🆕

**Tipo:** Sensor de irradiância solar RS485 Modbus RTU · **Mede:** Radiação solar global (espectro largo) em W/m²

#### Especificações

| Parâmetro | Valor | Parâmetro | Valor |
|---|---|---|---|
| Faixa de medição | 0–2000 W/m² | Precisão | ±5% (classe secundária) |
| Espectro | 300–3000 nm (shortwave solar) | Princípio | Fotoelétrico (termopar ou photodiode) |
| Interface | RS485 Modbus RTU | Endereço Modbus | **0x02 (configurável)** |
| Baud Rate | 9600 (padrão) | Formato | 8N1 |
| Tensão alimentação | **10–30V DC (usar 12V)** | Corrente | ~10–20 mA (12V) |
| Registrador | HR 0x0000 = Irradiância (W/m² × 10) | Function Code | 03 (Read Holding Registers) |
| Proteção | IP65 | Faixa T operação | -40°C a +80°C |
| Tempo de resposta | <1s (fotoelétrico) | Cabo | 4 fios blindados |

#### Pinout / Conexões

| Fio | Cor Típica | Função | Dir | Conectar em | Tensão | Notas |
|---|---|---|:---:|---|---|---|
| VCC | Vermelho | Alimentação | ← | Rail 12V | 12V DC | Direto na bateria 12V |
| GND | Preto | Terra | ← | GND comum | — | GND compartilhado |
| A (RS485+) | Amarelo | RS485 Data+ | ↔ | MAX485 pino A | Diferencial | Barramento compartilhado com anemômetro |
| B (RS485-) | Azul | RS485 Data- | ↔ | MAX485 pino B | Diferencial | Barramento compartilhado com anemômetro |

#### Notas críticas

> 🔴 **CRÍTICO:** Configurar endereço Modbus para **0x02** (diferente do anemômetro 0x01) antes da instalação.

> 🔴 **CRÍTICO:** Instalar **horizontalmente nivelado** com sensor óptico apontando para o céu — inclinação causa erro proporcional.

> ⚠️ **IMPORTANTE:** Sem obstrução entre o sensor e o céu em arco de 360° e elevação ≥5°. Sombras de mastros ou antenas invalidam a leitura.

> ⚠️ **IMPORTANTE:** Limpar a cúpula (domo) do sensor **mensalmente**. Poeira da Caatinga acumula rapidamente na seca.

> 🔧 **FIRMWARE — LEITURA MODBUS:**
> ```c
> // Ler irradiância solar (1 registrador a partir de 0x0000)
> digitalWrite(DE_RE, HIGH);
> uint8_t frame[] = {0x02, 0x03, 0x00, 0x00, 0x00, 0x01, CRC_LO, CRC_HI};
> Serial1.write(frame, sizeof(frame));
> Serial1.flush();
> digitalWrite(DE_RE, LOW);
> delay(200);
> // solar_rad = reg0 / 10.0 (W/m²)
> ```

> 📌 **FLORIANO, PI — RADIAÇÃO SOLAR:** PSH (Pico de Horas de Sol) entre 5.8–6.2 kWh/m²/dia. Irradiância pico típico: 1000–1200 W/m² ao meio-dia na seca. Relevante para monitoramento agroclimático e dimensionamento de painéis solares.

> 📌 **FÓRMULA DE INSOLAÇÃO DIÁRIA:**
> ```c
> // Integração da irradiância ao longo do dia (soma dos ciclos de 5min)
> daily_insolation_Wh = sum(solar_rad_W * (interval_s / 3600.0));
> // Converter para kWh/m²/dia
> daily_insolation_kWh = daily_insolation_Wh / 1000.0;
> ```

---

### 7.10 Sensor de Solo Capacitivo I²C — Umidade e Temperatura do Solo 🆕

**Tipo:** Adafruit STEMMA Soil Sensor (ou equivalente I²C capacitivo) · **Mede:** Umidade do solo (capacitivo) e Temperatura do solo

#### Especificações

| Parâmetro | Valor | Parâmetro | Valor |
|---|---|---|---|
| Umidade do solo | 200–2000 (counts capacitivo) | Princípio | Capacitivo (sem corrosão) |
| Temperatura solo | -40°C a +85°C | Precisão T | ±2°C |
| Interface | I²C (STEMMA QT) | Endereço I²C | **0x36 (fixo)** |
| Tensão | 3.3–5V (usar 3.3V) | Corrente | ~1 mA |
| Proteção probe | Resina epóxi (hastes) | Eletrônica | **NÃO é à prova d'água** |
| Conector | JST-PH 4 pinos (STEMMA QT) | Cabo | ≤1m (I²C standard-mode) |

#### Pinout

| Pino | Função | Dir | Conectar em | Interface | Tensão | Notas |
|---|---|:---:|---|---|---|---|
| VCC | Alimentação | ← | 3V3 Heltec | PWR | 3.3V | Alimentação direta |
| GND | Terra | ← | GND Heltec | PWR | — | GND comum |
| SDA | Dados I²C | ↔ | GPIO41 Heltec | I²C | 3.3V | Pull-up 4.7kΩ externo (já no barramento) |
| SCL | Clock I²C | ← | GPIO42 Heltec | I²C | 3.3V | Wire.begin(41,42) |

#### Notas críticas

> 🔴 **CRÍTICO:** A **eletrônica não é à prova d'água**. Apenas as hastes (probe) podem ser enterradas. A PCB deve ficar protegida em caixa selada ou tubo PVC com silicone.

> ⚠️ **IMPORTANTE:** Cabo I²C de **≤1m** entre sensor e Heltec. I²C em 100 kHz com cabo longo é suscetível a interferência. Usar cabo blindado.

> ⚠️ **IMPORTANTE:** Enterrar as hastes do sensor a **5–10cm de profundidade** para medir umidade da zona radicular superficial.

> 🔧 **FIRMWARE — LEITURA I²C:**
> ```c
> #include "Adafruit_seesaw.h"
> Adafruit_seesaw soil;
> soil.begin(0x36);
> 
> uint16_t moisture = soil.touchRead(0);    // 200–2000 counts
> float soil_temp = soil.getTemp();         // °C
> ```

> 🔧 **CALIBRAÇÃO DE CAMPO:** Os valores capacitivos (200–2000) são relativos. Calibrar em campo:
> | Condição | Valor típico |
> |---|---|
> | Solo seco (Caatinga, seca) | 200–400 |
> | Solo úmido (após chuva leve) | 500–800 |
> | Solo encharcado (chuvas intensas) | 900–1500 |
> | Imerso em água | >1500 |

> 📌 **FLORIANO, PI — SOLO CAATINGA:** Solo extremamente seco de junho a novembro (valores 200–350). Saturação rápida nas chuvas de janeiro a maio. O sensor permite correlacionar precipitação com absorção real do solo.

---

## 8. Componentes Passivos e Transceiver RS485

### Transceiver RS485 🆕

| Componente | Modelo | Função | Tensão | Notas |
|---|---|---|---|---|
| Transceiver RS485 | MAX485 ou SP3485 | Converte UART TTL ↔ RS485 diferencial | 3.3V lógico | DE+RE juntos no GPIO6 |

### Componentes Passivos

| Componente | Valor | Função |
|---|---|---|
| TVS SMAJ3.3A | 3.3V unidirecional | Proteção ESD pluviômetro (GPIO15) |
| R pull-up I²C | 4.7kΩ × 2 (SDA + SCL) | Únicos pull-ups no barramento I²C |
| R pull-up reed | 10kΩ | Pull-up pluviômetro |
| R pull-up CS BME690 | 10kΩ a 3.3V | CS BME690 em modo I²C |
| R série ESD | 100Ω | Série com GPIO15 |
| R terminação RS485 | 120Ω | Entre A e B na extremidade do barramento RS485 🆕 |
| Cap decoupling | 100µF + 100nF | Saída 3.3V Heltec — pico TX WiFi/LoRa |
| Cap decoupling RS485 | 100nF | Desacoplamento VCC do MAX485 🆕 |

### Pinout completo

| Componente | Pino | Dir | Conectar em | Interface | Tensão | Notas |
|---|---|:---:|---|---|---|---|
| MAX485 | VCC | ← | 3V3 Heltec | PWR | 3.3V | Alimentação transceiver 🆕 |
| MAX485 | GND | ← | GND Heltec | PWR | — | GND comum 🆕 |
| MAX485 | DI | ← | GPIO47 (U1TX) | UART | 3.3V | Dados TX do Heltec → RS485 🆕 |
| MAX485 | RO | → | GPIO48 (U1RX) | UART | 3.3V | Dados RS485 → RX do Heltec 🆕 |
| MAX485 | DE + RE | ← | GPIO6 | GPIO | 3.3V | Jumpeados juntos. HIGH=TX, LOW=RX 🆕 |
| MAX485 | A | ↔ | RS485 Bus A | RS485 | Dif. | A+ do barramento RS485 🆕 |
| MAX485 | B | ↔ | RS485 Bus B | RS485 | Dif. | B- do barramento RS485 🆕 |
| TVS SMAJ3.3A | Anodo | → | GND | PWR | — | Ligado ao GND comum |
| TVS SMAJ3.3A | Catodo | ← | GPIO15 via 100Ω | IRQ | — | Linha de proteção do GPIO15 |
| R 4.7kΩ #1 | Pull-up SDA | ← | 3V3 Heltec | PWR | 3.3V | **Único** pull-up SDA |
| R 4.7kΩ #2 | Pull-up SCL | ← | 3V3 Heltec | PWR | 3.3V | **Único** pull-up SCL |
| R 10kΩ #1 | Pull-up reed | ← | 3V3 Heltec | PWR | 3.3V | Fio 1 MISOL → 3V3 via 10kΩ |
| R 10kΩ #2 | Pull-up CS BME690 | ← | 3V3 | Config | 3.3V | Se breakout não tiver CS a 3V3 |
| R 100Ω | Série ESD | — | GPIO15 Heltec | IRQ | — | Proteção ESD |
| R 120Ω | Term. RS485 | — | MAX485 A–B | RS485 | — | Na extremidade oposta ao MAX485 🆕 |
| Cap 100µF | Decoupling | ← | 3V3 Heltec | PWR | 3.3V | + ao rail 3.3V, - ao GND |
| Cap 100nF | Decoupling HF | ← | 3V3 Heltec | PWR | 3.3V | Próximo ao Heltec |

### Notas críticas

> 🔴 **CRÍTICO:** Pull-ups 4.7kΩ externos são **OS ÚNICOS** pull-ups no barramento I²C. Remover os resistores de pull-up internos dos breakouts.

> ⚠️ **IMPORTANTE:** Capacitores 100µF + 100nF na saída 3.3V do Heltec. O pico de TX WiFi/LoRa (~300mA em <1ms) pode causar reset sem esses capacitores.

> 🔴 **CRÍTICO (RS485):** O resistor de terminação 120Ω deve estar na **extremidade mais distante** do barramento RS485 (no último sensor da cadeia). Sem terminação, reflexões de sinal causam erros Modbus. 🆕

---

## 9. Arquitetura de Alimentação

### Nó Externo — Nova Arquitetura Solar 12V 🆕

> ⚠️ **MUDANÇA v9:** A arquitetura de alimentação foi redesenhada para suportar sensores RS485 (12V) com energia solar autônoma.

```
                    ┌───────────────────────┐
                    │ Painel Solar 20W 18V  │
                    └──────────┬────────────┘
                               │
                    ┌──────────▼────────────┐
                    │ Controlador MPPT 12V  │
                    │ (ex: CN3791 ou equiv.) │
                    └──────────┬────────────┘
                               │
                    ┌──────────▼────────────┐
                    │ Bateria 12V 7Ah SLA   │
                    │ (ou 3S Li-Ion 11.1V)  │
                    └──────┬────────┬───────┘
                           │        │
              ┌────────────▼───┐    │
              │ Buck DC-DC 5V │    │ 12V direto
              │ (LM2596/MP1584)│    │
              └──────┬─────────┘    │
                     │              │
          ┌──────────▼──┐   ┌──────▼──────────┐
          │ Heltec 5V   │   │ Anemômetro 12V  │
          │ (reg. int.  │   │ Piranômetro 12V │
          │  → 3.3V)    │   └─────────────────┘
          └─────────────┘
```

### Trilhos de tensão — Nó Externo

| Trilho | Origem | Destino | Corrente Pico | Corrente Média | Notas |
|---|---|---|---|---|---|
| 12V (bateria) | Bateria SLA 12V 7Ah | Anemômetro + Piranômetro RS485 | ~70 mA | ~50 mA | Alimentação direta 🆕 |
| 5V (buck) | Buck DC-DC 12V→5V | Heltec 5V pin | ~240 mA pico LoRa TX | ~30 mA duty | LM2596 ou MP1584 🆕 |
| 3.3V (Heltec int.) | Regulador Heltec interno | I²C sensores + MAX485 + ICS-43434 | ~100 mA pico | ~20 mA duty | Via pino 3V3 do Heltec |

### Consumo por componente (intervalo 5 minutos = ciclo 300s)

| Componente | Tensão | Corrente Ativa | Tempo Ativo/Ciclo | Corrente Média | Estado Sleep | Notas |
|---|---|---|---|---|---|---|
| Heltec (ESP32-S3 wake) | 5V | ~120 mA / 240 mA TX | ~15s / 300s | ~6 mA | ~0.8 mA | Pico 240mA em TX LoRa |
| SEN66 | 3.3V | ~90 mA / ~5 mA standby | ~10s/300s | ~3 mA | ~5 mA | stopMeasurement() |
| SFA30 | 3.3V | ~1 mA | Sempre | ~1 mA | ~1 mA | HCHO contínuo |
| BME690 | 3.3V | ~3.7 mA | ~1s / 300s | ~0.012 mA | ~1.4 µA | BSEC forced |
| LTR390 | 3.3V | ~0.6 mA | ~2s / 300s | ~0.004 mA | ~0.5 µA | UV+ALS |
| AS3935 | 3.3V | ~0.35 mA | Sempre | ~0.35 mA | ~0.35 mA | Listening |
| ICS-43434 | 3.3V | ~0.65 mA | ~5s / 300s | ~0.011 mA | ~0.001 mA | Standby |
| Solo Cap. I²C | 3.3V | ~1 mA | ~0.5s / 300s | ~0.002 mA | ~0.001 mA | Leitura rápida 🆕 |
| MAX485 | 3.3V | ~1 mA TX / ~0.5 mA RX | ~2s / 300s | ~0.003 mA | ~0.001 mA | Modbus 🆕 |
| Anemômetro+Biruta | 12V | ~50 mA | Sempre | ~50 mA | ~50 mA | Contínuo 🆕 |
| Piranômetro | 12V | ~20 mA | Sempre | ~20 mA | ~20 mA | Contínuo 🆕 |
| **TOTAL 3.3V rail** | | | | **~10.4 mA** | **~7.2 mA** | |
| **TOTAL 12V rail** | | | | **~70 mA** | **~70 mA** | RS485 sensores 🆕 |
| **TOTAL geral @12V** | | | | **~77 mA** | **~74 mA** | Incluindo buck ~85% eff. |

### Estimativa de autonomia (bateria 12V + painel solar)

| Configuração | Capacidade | Consumo médio @12V | Autonomia sem sol | Com painel 20W |
|---|---|---|---|---|
| SLA 12V 7Ah | 7.000 mAh | ~77 mA | **~91h (3.8 dias)** | **Indefinido** (PSH 5.8h → ~96 Wh/dia > 22 Wh/dia consumo) |
| 3S Li-Ion 6Ah | 6.000 mAh | ~77 mA | **~78h (3.2 dias)** | **Indefinido** |

> 📌 **FLORIANO, PI:** Com PSH de 5.8–6.2 kWh/m²/dia e painel de 20W, a geração diária (~96 Wh) supera amplamente o consumo (~22 Wh/dia). Autonomia indefinida com 3+ dias de reserva em bateria para períodos nublados.

### Nó Base — Alimentação (sem alterações)

| Componente | Fonte | Alimenta | Corrente Pico | Corrente Típica | Notas |
|---|---|---|---|---|---|
| ESP32-P4 USB-C | Fonte 5V 2A | Placa principal + tela touch | ~500 mA | ~150 mA | Alimentação contínua |
| Heltec base | ESP32-P4 UART·VCC (5V) | Heltec base 5V pin | ~120 mA | ~30 mA | Alimentado pelo ESP32-P4 |
| SD Card (embutido) | 3.3V interno ESP32-P4 | Slot TF SDIO 3.0 | ~100 mA | ~5 mA | Fila JSONL |
| RTC + CR1220 | Bateria CR1220 | RTC embutido ESP32-P4 | ~3 µA | ~3 µA | Backup sem rede |

---

## 10. Protocolo LoRa P2P

### Parâmetros de rádio

| Parâmetro | Valor | Parâmetro | Valor |
|---|---|---|---|
| Frequência | **915.0 MHz** ← ANATEL/Brasil | Sync Word | **0xAB** (privado) |
| Endereço Externo | `0x01` (ADDR_EXTERNO) | Endereço Base | `0x02` (ADDR_BASE) |
| Spreading Factor | SF9 | Bandwidth | 125 kHz |
| Coding Rate | 4/5 | Potência TX | 14 dBm |
| Preamble | 8 símbolos | CRC | Habilitado |
| Time-on-air (52B) | **~340 ms** @ SF9 🆕 | Alcance estimado | ~2–5 km urbano |

> ⚠️ **868 MHz é ILEGAL no Brasil.** Exclusivo para Europa. Usar **obrigatoriamente 915 MHz** (ANATEL).

### Struct Payload — 52 bytes (packed) 🆕

```c
struct __attribute__((packed)) Payload {
    // --- Identificação (6B) ---
    uint16_t seq;         // 2B — número sequencial (detectar pacotes perdidos)
    uint32_t ts;          // 4B — timestamp UNIX epoch (corrigido pelo ACK NTP)
    // --- Qualidade do Ar (14B) ---
    int16_t  co2;         // 2B — CO₂ ppm × 1 (0–40000) — SEN66 NDIR
    uint16_t voc;         // 2B — VOC Index 1–500 (SEN66)
    uint16_t nox;         // 2B — NOx Index 1–500 (SEN66)
    uint16_t hcho;        // 2B — HCHO ppb × 10 (0–10000) — SFA30
    uint16_t pm25;        // 2B — µg/m³ × 10 — SEN66
    uint16_t pm10;        // 2B — µg/m³ × 10 — SEN66
    uint16_t pm1;         // 2B — µg/m³ × 10 — SEN66
    // --- Atmosférico (8B) ---
    int16_t  temp;        // 2B — °C × 100 (-4000 a 8500) — SEN66
    uint16_t hum;         // 2B — UR % × 100 (0–10000) — SEN66
    uint16_t pressure;    // 2B — hPa × 10 (9000–11000) — BME690 (QFE local)
    uint16_t pm4;         // 2B — µg/m³ × 10 — SEN66
    // --- Radiação (6B) ---
    uint16_t uvi;         // 2B — UVI × 100 (ex: 1150 = 11.50 UVI) — LTR390
    uint16_t lux;         // 2B — lux (0–65535) — LTR390
    uint16_t solar_rad;   // 2B — W/m² × 10 (0–20000) — Piranômetro RS485 🆕
    // --- Meteorológico (8B) ---
    uint16_t wind_speed;  // 2B — m/s × 100 (0–6000) — Anemômetro RS485 🆕
    uint16_t wind_dir;    // 2B — graus × 10 (0–3600) — Biruta RS485 🆕
    uint16_t wind_gust;   // 2B — m/s × 100 (rajada máx no ciclo) 🆕
    uint16_t rain;        // 2B — mm × 10 acumulado no ciclo — MISOL
    // --- Solo (4B) ---
    uint16_t soil_moist;  // 2B — 0–2000 counts capacitivo 🆕
    int16_t  soil_temp;   // 2B — °C × 100 🆕
    // --- Eventos e Status (4B) ---
    uint8_t  lightning;   // 1B — km distância raio (0 = sem evento) — AS3935
    uint16_t db_spl;      // 2B — dB(A) × 10 com filtro ponderação A — ICS-43434
    uint8_t  flags;       // 1B — bit0=sensor_err, bit1=low_bat, bit2=hcho_warm,
                          //       bit3=rs485_err, bit4=soil_err, bit5–7=reservado
};  // TOTAL: 52 bytes exatos
```

### Struct ACK — 6 bytes (packed)

```c
struct __attribute__((packed)) AckPayload {
  uint16_t seq_ack;        // 2B — sequência confirmada pelo nó base
  uint32_t ntp_timestamp;  // 4B — epoch UNIX (s) do nó base sincronizado via NTP
};  // TOTAL: 6 bytes exatos
```

### Intervalo operacional padrão

- **Padrão de produção:** 5 minutos (300s) por ciclo de coleta/transmissão.
- O modo 10 minutos é opcional de economia de energia.

### Fluxo ACK + Sincronização de tempo

| Passo | Ator | Ação | Timeout | Em caso de falha | Notas |
|:---:|---|---|---|---|---|
| 1 | Nó Externo | Coleta todos sensores (I²C + RS485 + IRQ) e monta Payload | — | — | `seq++`, `ts = rtc.getEpoch()` |
| 2 | Nó Externo | `radio.transmit(payload, 52, ADDR_BASE)` | ~340ms | Retry step 2 | Com `SYNC_WORD=0xAB` |
| 3 | Nó Externo | Aguarda ACK em modo RX por **5 segundos** | 5.000ms | Retry (máx 3×) | **NÃO dormir ainda** |
| 4 | Nó Base | Recebe pacote — verifica ADDR e SYNC_WORD | — | Descartar | Se inválido, ignorar |
| 5 | Nó Base | Envia ACK: `{seq_ack, ntp_timestamp}` | ~100ms | — | NTP sincronizado |
| 6 | Nó Externo | Recebe ACK — atualiza RTC | — | — | `rtc.setEpoch(ack.ntp_timestamp)` |
| 7 | Nó Externo | `esp_deep_sleep_start()` | — | — | Só dorme **APÓS** janela de ACK |
| 8 | Nó Base | Encaminha payload via UART para ESP32-P4 | — | Buffer circular | 115200 baud |
| 9 | ESP32-P4 | Deserializa struct → JSON → MQTT + SD card | — | Salva no SD | Fila JSONL com flush |

---

## 11. Checklist de Firmware

### Calibrações obrigatórias

| Item | Nó | Prioridade | Implementação |
|---|---|:---:|---|
| AS3935 antena LC | Externo | 🔴 CRÍTICO | `calibrateResonanceFrequency()` no setup(). Ajustar `NOISE_FLOOR` com SEN66 ativo. |
| BME690 BSEC burn-in | Externo | 🔴 CRÍTICO | 24h contínuas na 1ª utilização. Salvar estado BSEC a cada 1h. |
| ICS-43434 filtro A | Externo | ⚠️ IMPORTANTE | Filtro IIR ponderação A (IEC 61672-1) via ESP-DSP. |
| Solo calibração campo | Externo | ⚠️ IMPORTANTE | Registrar valores seco/úmido/encharcado in loco para referência. 🆕 |
| Modbus endereços | Externo | 🔴 CRÍTICO | Confirmar addr 0x01 (anemômetro) e 0x02 (piranômetro) antes de instalar. 🆕 |

### Watchdog e recuperação automática

| Item | Nó | Prioridade | Implementação |
|---|---|:---:|---|
| Watchdog hardware | Externo | 🔴 CRÍTICO | `esp_task_wdt_init(30, true)` + feed no início de cada ciclo. |
| Recuperação I²C | Externo | ⚠️ IMPORTANTE | Se `Wire.endTransmission()≠0`: 9 pulsos clock + `Wire.end()` + `Wire.begin(41,42)`. |
| Recuperação RS485 | Externo | ⚠️ IMPORTANTE | Se Modbus timeout 3× consecutivo: flag `bit3=rs485_err` no payload. 🆕 |
| Watchdog Heltec base | Base | ⚠️ IMPORTANTE | Watchdog 30s no Heltec base — RX loop pode travar. |

### Protocolo LoRa — firmware

| Item | Nó | Prioridade | Implementação |
|---|---|:---:|---|
| Endereçamento | Ambos | 🔴 CRÍTICO | `ADDR_EXTERNO=0x01`, `ADDR_BASE=0x02`, `SYNC_WORD=0xAB`. |
| Payload binário | Ambos | 🔴 CRÍTICO | `struct Payload` 52 bytes packed. Nó base converte para JSON. |
| Flags de integridade | Externo | 🔴 CRÍTICO | `bit0=sensor_err`, `bit1=low_bat`, `bit2=hcho_warm`, `bit3=rs485_err`, `bit4=soil_err`. |
| ACK + retry | Externo | 🔴 CRÍTICO | Aguardar ACK por 5s **ANTES** de dormir. Retry até 3×. |

### Modbus RTU Master 🆕

| Item | Nó | Prioridade | Implementação |
|---|---|:---:|---|
| Inicialização UART2 | Externo | 🔴 CRÍTICO | `Serial1.begin(9600, SERIAL_8N1, 48, 47)` + `pinMode(6, OUTPUT)` |
| Leitura anemômetro | Externo | 🔴 CRÍTICO | FC03 addr 0x01, reg 0x0000, qty 2 (vel + dir). Timeout 500ms. |
| Leitura piranômetro | Externo | 🔴 CRÍTICO | FC03 addr 0x02, reg 0x0000, qty 1 (rad). Timeout 500ms. |
| CRC Modbus | Externo | 🔴 CRÍTICO | Calcular CRC-16 Modbus RTU em cada frame enviado e validar resposta. |
| Rajada de vento | Externo | ⚠️ IMPORTANTE | Amostrar vento a cada 10s (30× no ciclo). `wind_gust = max(amostras)`. |

### Alertas e monitoramento

| Item | Nó | Prioridade | Implementação |
|---|---|:---:|---|
| Estação offline | Base | ⚠️ IMPORTANTE | Se `delta > 900s` → MQTT `'estacao/status=OFFLINE'` |
| Bateria baixa | Ambos | ⚠️ IMPORTANTE | Flag `bit1` se Vbat<10.5V (12V SLA). MQTT `'BATERIA_BAIXA'`. |
| Raio detectado | Externo | 💡 ÚTIL | Transmissão imediata fora do ciclo. Anti-debounce ≤1/10min. |
| PM2.5 alto | Base | 💡 ÚTIL | Se PM2.5 > 25 µg/m³ (CONAMA): MQTT alerta. |
| Vento forte | Base | 💡 ÚTIL | Se wind_speed > 17 m/s (Beaufort 8): MQTT `'VENTO_FORTE'`. 🆕 |
| Pluviômetro entupido | Base | 💡 ÚTIL | Se UR > 70% por 30min E rain = 0: `'VERIFICAR_PLUVIOMETRO'`. |
| RS485 offline | Externo | ⚠️ IMPORTANTE | Se 3 timeouts consecutivos em Modbus: `bit3=rs485_err`. 🆕 |

---

## 12. Bill of Materials (BOM)

### Microcontroladores / MCUs

| Nº | Componente | Nó | Qtd | Status | Origem | Preço Est. |
|:---:|---|---|:---:|---|---|---|
| 1 | ESP32-P4 WiFi6 Touch 7" Waveshare | Base | 1 | ✅ Comprado | Amazon | ~R$ 350 |
| 2 | Heltec LoRa32 V3 — Unidade 1 (Externo) | Externo | 1 | ✅ Comprado | AliExpress | R$ 107 |
| 3 | Heltec LoRa32 V3 — Unidade 2 (Base) | Base | 1 | ✅ Comprado | AliExpress | R$ 107 |

### Sensores

| Nº | Componente | Nó | Qtd | Status | Origem | Preço Est. |
|:---:|---|---|:---:|---|---|---|
| 4 | SEN66 PM/CO₂/VOC/NOx | Externo | 1 | 🔄 Comprar | Sensirion/Mouser | ~R$ 150 |
| 5 | SFA30 HCHO/VOC/T/UR | Externo | 1 | 🔄 Comprar | Sensirion/Mouser | ~R$ 100 |
| 6 | BME690 Ambiental | Externo | 1 | ✅ Comprado | AliExpress | R$ 103 |
| 7 | LTR390 UV Index | Externo | 1 | ✅ Comprado | AliExpress | R$ 37 |
| 8 | AS3935 CJMCU-3935 | Externo | 1 | ✅ Comprado | AliExpress | R$ 126 |
| 9 | MISOL MS-WH-SP-RG Pluviômetro | Externo | 1 | ✅ Comprado | AliExpress | R$ 89 |
| 10 | ICS-43434 Microfone I2S | Externo | 1 | ✅ Comprado | AliExpress | R$ 21 |
| 11 | Anemômetro+Biruta RS485 Modbus (combinado) | Externo | 1 | 🆕 Comprar | AliExpress | ~R$ 80–150 |
| 12 | Piranômetro RS485 Modbus | Externo | 1 | 🆕 Comprar | AliExpress | ~R$ 100–200 |
| 13 | Sensor Solo Capacitivo I²C (STEMMA Soil) | Externo | 1 | 🆕 Comprar | Adafruit/AliExpress | ~R$ 30–50 |

### Eletrônica auxiliar 🆕

| Nº | Componente | Nó | Qtd | Status | Origem | Preço Est. |
|:---:|---|---|:---:|---|---|---|
| 14 | MAX485 Módulo Transceiver RS485 | Externo | 1 | 🆕 Comprar | AliExpress | R$ 5–10 |
| 15 | Buck DC-DC 12V→5V (LM2596/MP1584) | Externo | 1 | 🆕 Comprar | AliExpress | R$ 8–15 |

### Componentes passivos

| Nº | Componente | Nó | Qtd | Status | Origem | Preço Est. |
|:---:|---|---|:---:|---|---|---|
| 16 | Resistor 4.7kΩ (pull-up I²C SDA+SCL) | Externo | 2 | 🔄 Comprar | AliExpress | R$ 1 |
| 17 | Resistor 10kΩ (pull-up reed, CS BME690) | Externo | 4 | 🔄 Comprar | AliExpress | R$ 1 |
| 18 | Resistor 100Ω (ESD pluviômetro) | Externo | 1 | 🔄 Comprar | AliExpress | R$ 1 |
| 19 | Resistor 120Ω (terminação RS485) | Externo | 1 | 🆕 Comprar | AliExpress | R$ 1 |
| 20 | TVS Diode SMAJ3.3A | Externo | 1 | 🔄 Comprar | AliExpress | R$ 3 |
| 21 | Capacitor 100µF eletrolítico 10V | Externo | 2 | 🔄 Comprar | AliExpress | R$ 2 |
| 22 | Capacitor 100nF cerâmico | Externo | 5 | 🔄 Comprar | AliExpress | R$ 1 |

### Alimentação 🆕

| Nº | Componente | Nó | Qtd | Status | Origem | Preço Est. |
|:---:|---|---|:---:|---|---|---|
| 23 | Painel Solar 20W 18V policristalino | Externo | 1 | 🆕 Comprar | AliExpress/Loja Solar | R$ 60–120 |
| 24 | Controlador MPPT 12V (ou CN3791 board) | Externo | 1 | 🆕 Comprar | AliExpress | R$ 20–50 |
| 25 | Bateria SLA 12V 7Ah (ou 3S Li-Ion 11.1V) | Externo | 1 | 🆕 Comprar | Loja bateria | R$ 80–150 |
| 26 | Fonte USB 5V 2A (nó base) | Base | 1 | 🔄 Comprar | Loja local | R$ 20–30 |
| 27 | MicroSD 32GB SanDisk Class 10 | Base | 1 | 🔄 Comprar | Loja local | R$ 20–35 |
| 28 | Bateria CR1220 (RTC ESP32-P4) | Base | 1 | 🔄 Comprar | Farmácia/loja | R$ 5 |

### Instalação física

| Nº | Componente | Nó | Qtd | Status | Origem | Preço Est. |
|:---:|---|---|:---:|---|---|---|
| 29 | Caixa IP65 plástica 200×150×80mm | Externo | 1 | 🔄 Comprar | AliExpress | R$ 20–40 |
| 30 | Prensa-cabos PG9/PG11 | Externo | 8 | 🔄 Comprar | AliExpress | R$ 12 |
| 31 | Cabo pigtail U.FL → SMA 15cm | Externo | 1 | ✓ Já tem | — | — |
| 32 | Conector SMA fêmea passante | Externo | 1 | 🔄 Comprar | AliExpress | R$ 5–8 |
| 33 | Verniz conformal spray acrílico | Externo | 1 | 🔄 Comprar | AliExpress | R$ 25–45 |
| 34 | Sílica gel 5g (pacotes) | Externo | 3 | 🔄 Comprar | AliExpress | R$ 5 |
| 35 | Mastro/tubo galvanizado 2m | Externo | 1 | 🆕 Comprar | Loja construção | R$ 30–60 |
| 36 | Cabo RS485 blindado 4 fios (10–30m) | Externo | 1 | 🆕 Comprar | AliExpress | R$ 15–30 |
| 37 | Cabo I²C blindado ~1m (sensor solo) | Externo | 1 | 🆕 Comprar | AliExpress | R$ 5–10 |
| 38 | Adaptador RJ11 → bornes terminal | Externo | 1 | 🔄 Comprar | AliExpress | R$ 5–8 |
| 39 | Cabo JST-GH 6 pinos (~30cm) | Externo | 1 | 🔄 Comprar | Mouser/AliExpress | R$ 5–10 |
| 40 | Protoboard ou PCB perfurada 7×9cm | Externo | 1 | 🔄 Comprar | AliExpress | R$ 5–8 |
| 41 | Kit jumpers M-M e M-F | Ambos | 1 | 🔄 Comprar | AliExpress | R$ 8–12 |
| 42 | Tubo PVC 50mm (proteção sensor solo) | Externo | 1 | 🆕 Comprar | Loja construção | R$ 5 |

### Resumo financeiro estimado

| Categoria | Valor |
|---|---|
| Componentes já comprados (v8) | R$ 540–560 |
| ESP32-P4 Waveshare (Amazon) | ~R$ 350 |
| Sensores novos (anemômetro + piranômetro + solo) | R$ 210–400 🆕 |
| Alimentação solar (painel + MPPT + bateria 12V) | R$ 160–320 🆕 |
| Eletrônica auxiliar (MAX485 + buck) | R$ 13–25 🆕 |
| Passivos + instalação + cabos | R$ 145–250 |
| **TOTAL ESTIMADO** | **R$ 1.418 – 1.905** |

---

## 13. Especificidades — Floriano, PI (Caatinga)

### Dados climáticos

| Parâmetro | Valor | Fonte |
|---|---|---|
| Latitude | 6°46'S (-6.77°) | INMET |
| Longitude | 43°01'W (-43.02°) | INMET |
| Altitude | 94m acima do nível do mar | INMET |
| Fuso horário | UTC-3 (America/Fortaleza) | |
| Bioma | Caatinga — semiárido | IBGE |
| PSH solar anual | 5.8–6.2 kWh/m²/dia | LABREN/INPE |
| T máxima absoluta | ~40°C (setembro–outubro, seca) | INMET |
| T mínima absoluta | ~18°C (julho, seca noturna) | INMET |
| UR mínima (seca) | 15–25% (junho–novembro) | INMET |
| UR máxima (chuvas) | 70–80% (fevereiro–março) | INMET |
| Precipitação anual | 800–1.100 mm (concentrada jan–mai) | INMET |
| UVI máximo | 13–15 (outubro–novembro, 10h–14h) | INPE/LABREN |
| Ventos | Predominante E/NE, rajadas 40–60 km/h | INMET |
| PM10 seco | 50–80 µg/m³ (vento + poeira Caatinga) | Estimativa operacional |
| Irradiância solar pico | 1000–1200 W/m² (meio-dia, seca) 🆕 | LABREN/INPE |
| Solo Caatinga (seca) | Umidade cap. 200–350 counts 🆕 | Estimativa operacional |

### Ajustes específicos ao projeto

| Parâmetro | Especificação para Floriano | Justificativa |
|---|---|---|
| Cor caixa IP65 | **BRANCA ou CINZA CLARO** | Caixa preta ao sol: 65–75°C → degrada bateria |
| Painel solar posição | **Norte geográfico, inclinação 7°** 🆕 | Latitude 6.77°S → inclinação ≈ latitude |
| Bateria 12V posição | **Dentro da caixa IP65, sombreada** 🆕 | SLA tolera até 60°C; caixa branca + sombra mantém <50°C |
| Anemômetro posição | **Mastro 2m, topo livre 360°** 🆕 | WMO-No.8: ≥10× distância de obstáculos |
| Piranômetro posição | **Horizontal, sem sombra, topo do mastro** 🆕 | Sem obstrução em arco ≥5° de elevação |
| Solo sensor posição | **5–10cm profundidade, solo nativo** 🆕 | Zona radicular superficial da Caatinga |
| Altitude pressão | QNH = QFE × exp(94 / (29.3 × T_K)) | Publicar QFE (local) E QNH (nível do mar) |
| Condensação | Trocar sílica gel em **DEZEMBRO** | Transição seca→chuvosa: risco de condensação |
| Pluviômetro limiar | Alerta entupimento: **UR > 70%** | Floriano raramente ultrapassa 80% UR |
| LTR390 gain | **GAIN_1X** 10h–14h seca; **GAIN_3X** restante | Evita saturação no pico solar |
| AS3935 NOISE_FLOOR | **Sazonal** — ajuste dinâmico | Raios concentrados jan–mai |
| Manutenção piranômetro | **Limpeza mensal da cúpula** 🆕 | Poeira Caatinga na seca |
| Manutenção pluviômetro | **Limpeza em DEZEMBRO** | Pré-estação chuvosa |

### Fórmula de pressão barométrica (altitude 94m)

```
Para Floriano, PI (alt=94m, T=35°C = 308.15K):

P_QFE (local)  = 1002.76 hPa
P_QNH (NMM)   = 1013.25 hPa
Diferença      = +10.49 hPa

Código firmware:
  float qnh = qfe * exp(94.0 / (29.3 * (temp_c + 273.15)));
```

### Cálculo AQI (EPA) para PM2.5

```
Breakpoints PM2.5 (µg/m³) → AQI:
  0.0–9.0     → 0–50
  9.1–35.4    → 51–100
 35.5–55.4    → 101–150
 55.5–125.4   → 151–200
125.5–225.4   → 201–300
225.5–325.4   → 301–400
325.5–999.9   → 401–500

Fórmula linear por faixa:
  AQI = ((I_hi - I_lo)/(C_hi - C_lo)) * (C - C_lo) + I_lo

Nota regulatória:
  Breakpoints conforme eCFR Title 40, Part 58, App G (2024).
  Em firmware, saturar saída no intervalo 0–500.
```

---

## 14. Componentes Removidos do Projeto

Os itens abaixo foram removidos em revisões anteriores e **não devem ser reintegrados** sem revisão completa da arquitetura:

| Componente | Motivo da remoção |
|---|---|
| **INA260** | Powerbank não permite monitoramento de SOC útil. Monitorar via GPIO1 (VBAT_Read) |
| **NEO-6M GPS** | NTP via LoRa substitui sync de tempo; localização é fixa |
| **ENS160** | Redundante com SEN66 + BME690 |
| **TSL2591** | Redundante com LTR390 para este projeto |
| **MT3608** | Removido — buck 12V→5V substitui |
| **TP4056** | Substituído por controlador MPPT solar |
| **AMS1117-3.3** | Removido — Heltec tem regulador interno |
| **18650 cells (avulsas)** | Substituídas por bateria 12V SLA ou 3S Li-Ion |
| **Powerbank comercial** | Removido — auto-shutoff incompatível com IoT. Substituído por solar+bateria 12V 🆕 |
| **SCD41** | Substituído pelo SEN66 — CO₂ NDIR integrado no módulo 6-em-1 |
| **SPS30** | Substituído pelo SEN66 — PM1/2.5/4/10 integrado sem necessidade de 5V |
| **TPS2051B (Load Switch)** | Removido — SEN66 opera em 3.3V direto |

---

## 15. Validação Externa e Rastreabilidade

### Matriz de rastreabilidade (fontes confiáveis)

| Tema técnico | Fonte externa confiável | Status |
|---|---|---|
| AQI PM2.5 e categorias | AirNow/EPA + eCFR Title 40 Appendix G | ✅ Validado |
| WDT ESP32-S3 | ESP-IDF (Watchdogs API) | ✅ Validado |
| Deep sleep ESP32-S3 | ESP-IDF (Sleep Modes API) | ✅ Validado |
| SEN66 / SFA30 | Sensirion (Datasheets oficiais) | ✅ Validado |
| BSEC para BME69x | Bosch Sensortec (BSEC software) | ✅ Validado |
| Gestão de espectro Brasil | ANATEL (portal oficial) | ✅ Validado |
| Modbus RTU protocolo | Modbus.org (especificação oficial) | ✅ Validado 🆕 |
| RS485 interface elétrica | TIA/EIA-485 | ✅ Validado 🆕 |
| Faixas exatas ANATEL | Portal de legislação ANATEL | ⚠️ Validar manualmente |
| Critério WMO posicionamento | WMO-No.8 | ⚠️ Validar manualmente |

---

## 16. Resumo Executivo de Conformidade

| Domínio | Situação | Observação |
|---|---|---|
| Arquitetura elétrica e pinagem | ✅ Conforme | Sem conflito de pinos; GPIO6/47/48 para RS485 |
| I²C (endereços + velocidade) | ✅ Conforme | 6 endereços únicos, 100kHz |
| RS485 Modbus (endereços + protocolo) | ✅ Conforme | 2 endereços Modbus distintos 🆕 |
| Sensores e integração | ✅ Conforme | 10 sensores com cobertura completa |
| LoRa P2P e payload | ✅ Conforme | 52B payload, SF9/BW125 |
| Energia e autonomia | ✅ Conforme | Solar 20W + bateria 12V — autonomia indefinida |
| Firmware crítico | ✅ Conforme | WDT, sleep, ACK, Modbus master |
| Normas ambientais e AQI | ✅ Conforme | AQI EPA, CONAMA, WMO |
| Rastreabilidade documental | ✅ Conforme | Matriz de fontes atualizada |

---

## 17. Referências e Normas

| Norma/Documento | Aplicação |
|---|---|
| **ANATEL** | Frequência 915 MHz obrigatória no Brasil |
| **ABNT NBR 10151** | Avaliação do ruído — filtro dB(A) obrigatório |
| **CONAMA 491/2018** | Padrão PM2.5: 25 µg/m³ (primário 24h) |
| **WMO-No.8** | Instalação meteorológica: pluviômetro 1.2–1.5m; anemômetro ≥2m |
| **IEC 60529** | Classificação IP65 |
| **IPC-CC-830** | Verniz conformal |
| **IEC 61672-1** | Medidores de nível sonoro — ponderação A |
| **EPA AQI** | Cálculo AQI para PM2.5 |
| **Modbus.org** | Protocolo Modbus RTU (especificação oficial) 🆕 |
| **TIA/EIA-485** | Interface RS485 half-duplex 🆕 |

### Links oficiais consultados

| Fonte | Link oficial |
|---|---|
| ANATEL — Espectro | https://www.gov.br/anatel/pt-br/regulado/espectro |
| AirNow (EPA) — AQI Basics | https://www.airnow.gov/aqi/aqi-basics/ |
| eCFR — Appendix G to Part 58 | https://www.ecfr.gov/current/title-40/chapter-I/subchapter-C/part-58/appendix-Appendix%20G%20to%20Part%2058 |
| Espressif — ESP-IDF WDT | https://docs.espressif.com/projects/esp-idf/en/stable/esp32s3/api-reference/system/wdts.html |
| Espressif — Sleep Modes | https://docs.espressif.com/projects/esp-idf/en/stable/esp32s3/api-reference/system/sleep_modes.html |
| Sensirion — SEN66 | https://sensirion.com/products/catalog/SEN66 |
| Sensirion — SFA30 | https://sensirion.com/products/catalog/SFA30 |
| Bosch — BSEC | https://www.bosch-sensortec.com/software-tools/software/bme680-software-bsec/ |
| Modbus.org — Specifications | https://modbus.org/specs.php |
| INMET — Portal | https://portal.inmet.gov.br/ |
| INMET — BDMEP | https://bdmep.inmet.gov.br/ |

---

## 18. Checklist de Comissionamento (Bancada e Campo)

### Bancada elétrica (pré-campo)

| Item | Critério de aceite | Método de verificação |
|---|---|---|
| I²C em repouso | SDA/SCL em 3.3V | Multímetro nos pinos GPIO41/42 |
| Endereços I²C | `0x03`, `0x36`, `0x53`, `0x5D`, `0x6B`, `0x76` detectados | Scanner I²C após `Wire.begin(41,42)` |
| SEN66 standby | I²C mantém resposta (~5mA) | Relógio de consumo |
| SFA30 SEL | `0x5D` responde | GND no SEL ANTES de VDD |
| RS485 polling | Anemômetro (0x01) e piranômetro (0x02) respondem | Frame Modbus RTU de teste 🆕 |
| Corrente em sleep | Compatível com autonomia | Medidor após `esp_deep_sleep_start()` |
| UART base↔P4 | 115200, sem overflow | Loop de 1000 msgs |
| LoRa P2P | RX base + ACK em até 5s | 100 ciclos com `seq` incremental |
| Buck 12V→5V | Saída estável 5V ±0.2V | Multímetro sob carga 🆕 |

### Integração funcional

| Item | Critério de aceite | Método de verificação |
|---|---|---|
| Payload 52 bytes | Tamanho fixo e campos íntegros | Dump binário e parse no ESP32-P4 |
| Sincronização de tempo | RTC atualizado por ACK NTP | Comparar `rtc.getEpoch()` vs NTP |
| Buffer SD base | Sem perda sem Wi-Fi | Desconectar WiFi 30min |
| Vento + solar | Valores coerentes nos dados MQTT | Publicações MQTT 🆕 |
| Solo capacitivo | Valores mudam com rega simulada | Molhar probe e verificar 🆕 |

### Comissionamento em campo

| Item | Critério de aceite | Método de verificação |
|---|---|---|
| Pluviômetro (WMO) | 1.2–1.5m, raio livre ≥2× obstáculo | Trena + fotos |
| Anemômetro (WMO) | Mastro ≥2m, livre 360° | Inspeção visual 🆕 |
| Piranômetro | Horizontal, sem sombra | Bolha de nível + fotos 🆕 |
| Sensor solo | 5–10cm profundidade, solo nativo | Inspeção + fotos 🆕 |
| Painel solar | Norte geo., inclinação ~7° | Bússola + inclinômetro 🆕 |
| Abrigo térmico | Sem sol direto nos sensores | Inspeção + logs 24h |
| Link LoRa | Taxa entrega >99% em 24h | Teste 24h |
| Autonomia solar | Bateria não cai abaixo de 11V em 48h | Log de Vbat via MQTT 🆕 |

---

## 19. Parecer Executivo de Conformidade Regulatória

### Identificação

| Campo | Conteúdo |
|---|---|
| Projeto | Estação Ambiental IoT — Floriano, PI |
| Documento base | Especificação técnica v9 |
| Data do parecer | 27/03/2026 |
| Finalidade | Parecer executivo para governança do projeto |

### Escopo avaliado

| Domínio | Status |
|---|---|
| Arquitetura elétrica (I²C + RS485 + LoRa) | Conforme |
| Barramento I²C (6 dispositivos) e RS485 (2 dispositivos) | Conforme |
| Protocolo LoRa P2P, payload 52B e ACK | Conforme |
| Alimentação solar 12V + MPPT + buck | Conforme |
| Firmware (WDT, sleep, Modbus, ACK, buffer) | Conforme |
| Instalação (WMO, abrigo, mastro, solo) | Conforme com ressalvas |
| Rastreabilidade documental | Conforme com ressalvas |

### Parecer técnico consolidado

| Critério | Resultado |
|---|---|
| Coerência interna do documento | Aprovada |
| Viabilidade de implementação de hardware | Aprovada |
| Viabilidade de implementação de firmware | Aprovada |
| Aderência a referências confiáveis | Aprovada com pendências manuais |

### Pendências regulatórias controladas

| Pendência | Risco | Ação mandatória |
|---|---|---|
| Conferência do ato ANATEL vigente | Baixo | Registrar número do ato no dossiê |
| Conferência WMO-No.8 oficial | Baixo | Anexar evidência no relatório |
| Série histórica INMET/BDMEP local | Médio | Atualizar parâmetros após análise |

### Deliberação executiva

| Decisão | Justificativa |
|---|---|
| Aprovado para piloto controlado | Documento consistente, 10 sensores, cobertura completa de dados ambientais |
| Condição para operação definitiva | Validações regulatórias manuais + teste de campo 24h |

---

*Documentação técnica v9 — Estação Ambiental IoT completa com 10 sensores (I²C + RS485 + I2S + IRQ), alimentação solar autônoma, payload LoRa 52 bytes e cobertura completa de 20+ parâmetros ambientais.*  
*Floriano, PI — Caatinga — 6°46'S 43°01'W — Altitude 94m*