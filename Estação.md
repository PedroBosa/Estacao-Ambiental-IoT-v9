# Estação Ambiental IoT — Floriano, PI

**Documentação técnica completa de conexões, componentes, protocolo LoRa e firmware**

> **Localização:** Floriano, PI — 6°46'S 43°01'W · Altitude 94 m · Bioma Caatinga  
> **Versão:** v6 · Auditoria técnica ampliada (fontes externas + consistência interna)

---

## Sumário

1. [Visão Geral da Arquitetura](#1-visão-geral-da-arquitetura)
2. [Barramento I²C — Mapa de Endereços](#2-barramento-i²c--mapa-de-endereços)
3. [Nó Externo — Heltec LoRa32 V3](#3-nó-externo--heltec-lora32-v3)
4. [Nó Base — Heltec LoRa32 V3 (Base)](#4-nó-base--heltec-lora32-v3-base)
5. [Nó Base — ESP32-P4 Waveshare Touch 7"](#5-nó-base--esp32-p4-waveshare-touch-7)
6. [Sensores](#6-sensores)
   - 6.1 [SCD41 — CO₂ / Temperatura / Umidade](#61-scd41--co₂--temperatura--umidade)
   - 6.2 [BME690 — Ambiental (T / UR / Pressão / VOC)](#62-bme690--ambiental-t--ur--pressão--voc)
   - 6.3 [SPS30 — Material Particulado PM2.5](#63-sps30--material-particulado-pm25)
   - 6.4 [LTR390 — UV Index e Lux](#64-ltr390--uv-index-e-lux)
   - 6.5 [AS3935 — Detecção de Raios](#65-as3935--detecção-de-raios)
   - 6.6 [ICS-43434 — Microfone MEMS I2S](#66-ics-43434--microfone-mems-i2s)
   - 6.7 [MISOL MS-WH-SP-RG — Pluviômetro](#67-misol-ms-wh-sp-rg--pluviômetro)
7. [MOSFET e Componentes Passivos](#7-mosfet-e-componentes-passivos)
8. [Arquitetura de Alimentação](#8-arquitetura-de-alimentação)
9. [Protocolo LoRa P2P](#9-protocolo-lora-p2p)
10. [Checklist de Firmware](#10-checklist-de-firmware)
11. [Bill of Materials (BOM)](#11-bill-of-materials-bom)
12. [Especificidades — Floriano, PI (Caatinga)](#12-especificidades--floriano-pi-caatinga)
13. [Componentes Removidos do Projeto](#13-componentes-removidos-do-projeto)
14. [Validação Externa e Rastreabilidade](#14-validação-externa-e-rastreabilidade)
15. [Resumo Executivo de Conformidade](#15-resumo-executivo-de-conformidade)
16. [Referências e Normas](#16-referências-e-normas)
17. [Checklist de Comissionamento (Bancada e Campo)](#17-checklist-de-comissionamento-bancada-e-campo)
18. [Parecer Executivo de Conformidade Regulatória](#18-parecer-executivo-de-conformidade-regulatória)

---

## 1. Visão Geral da Arquitetura

```
┌──────────────────────────────────────────────────────────────────────────┐
│ NÓ EXTERNO — Heltec LoRa32 V3 (ESP32-S3)                                 │
│                                                                          │
│  I²C (GPIO41 SDA / GPIO42 SCL)                                           │
│   • SCD41   (0x62)  — CO2, T, UR                                         │
│   • BME690  (0x76)  — T, UR, Pressão, VOC                                │
│   • SPS30   (0x69)  — PM1.0/2.5/4.0/10, GND chaveado por MOSFET          │
│   • LTR390  (0x53)  — UV Index, Lux                                      │
│   • AS3935  (0x03)  — Raios (1–40 km)                                    │
│                                                                          │
│  I2S (GPIO38/39/40)  • ICS-43434 — Microfone dB(A)                       │
│  IRQ (GPIO15)         • MISOL — Pluviômetro 0.3 mm/pulso                 │
│                                                                          │
│  Alimentação: Powerbank always-on (fora da caixa IP65, sombreado)        │
└─────────────────────────────┬────────────────────────────────────────────┘
                              │ LoRa 915 MHz (SF9, BW125, Sync 0xAB, 34 B)
                              ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ NÓ BASE                                                                  │
│                                                                          │
│  Heltec LoRa32 V3 (Base)  ⇄  ESP32-P4 Waveshare Touch 7"                │
│   • GPIO45 TX  ────────▶  UART RXD (115200)                             │
│   • GPIO46 RX  ◀────────  UART TXD (115200)                             │
│   • 5V (VCC)   ◀────────  UART VCC                                      │
│                                                                          │
│  ESP32-P4: MicroSD (queue.jsonl), WiFi6→MQTT, tela touch, RTC+CR1220     │
└──────────────────────────────────────────────────────────────────────────┘
```

### Conexões completas — Nó Externo

| Sensor/Módulo | Pino Sensor | Dir | GPIO Heltec | Interface | Endereço I²C | Tensão | Notas Críticas |
|---|---|:---:|---|---|---|---|---|
| SCD41 | VDD | ← | 3V3 | PWR | — | 3.3V | Alimentação |
| SCD41 | GND | ← | GND | PWR | — | — | GND comum |
| SCD41 | SCL | ← | GPIO42 | I²C | 0x62 | 3.3V | Wire.begin(41,42) |
| SCD41 | SDA | ↔ | GPIO41 | I²C | 0x62 | 3.3V | Pull-up 4.7kΩ externo |
| BME690 | VCC | ← | 3V3 | PWR | — | 3.3V | Alimentação |
| BME690 | GND | ← | GND | PWR | — | — | GND comum |
| BME690 | SCK (SCL) | ← | GPIO42 | I²C | 0x76 | 3.3V | Wire.begin(41,42) |
| BME690 | SDI (SDA) | ↔ | GPIO41 | I²C | 0x76 | 3.3V | Pull-up 4.7kΩ externo |
| BME690 | SDO | ← | GND | Config | — | — | GND → Endereço 0x76 |
| BME690 | CS | ← | 3V3 | Config | — | — | HIGH → Modo I²C (10kΩ pull-up) |
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
| SPS30 | VDD (Pin1) | ← | 5V Powerbank (direto) | PWR | — | 5V | Alimentação fixa em 5V |
| SPS30 | SDA (Pin2) | ↔ | GPIO41 | I²C | 0x69 | 3.3V | SEL=GND → modo I²C |
| SPS30 | SCL (Pin3) | ← | GPIO42 | I²C | 0x69 | 3.3V | **Verificar pull-ups 5V no breakout!** |
| SPS30 | SEL (Pin4) | ← | GND | Config | — | — | GND = I²C mode obrigatório |
| SPS30 | GND (Pin5) | ← | MOSFET Drain (GND chaveado) | EN | — | — | Chaveamento low-side por GPIO5 |
| ICS-43434 | 3V | ← | 3V3 | PWR | — | 3.3V | Alimentação |
| ICS-43434 | GND | ← | GND | PWR | — | — | GND comum |
| ICS-43434 | BCLK | ← | GPIO38 | I2S | — | 3.3V | Bit Clock |
| ICS-43434 | LRCL (WS) | ← | GPIO39 | I2S | — | 3.3V | Word Select |
| ICS-43434 | DOUT | → | GPIO40 | I2S | — | 3.3V | Dados de áudio PCM |
| ICS-43434 | SEL | ← | GND | Config | — | — | GND = Canal esquerdo |
| MISOL Pluv. | Fio 1 (reed) | ← | GND | PWR | — | — | GND comum |
| MISOL Pluv. | Fio 2 (reed) | → | GPIO15 | IRQ | — | 3.3V | Pull-up 10kΩ para 3.3V + TVS SMAJ3.3A |

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
> **Velocidade:** 100 kHz (não usar 400 kHz com 5 dispositivos)  
> **Pull-ups:** 4.7 kΩ externos únicos em SDA e SCL — remover pull-ups internos de pelo menos 4/5 breakouts

| Endereço | Sensor | Configuração | Fixo? |
|---|---|---|:---:|
| `0x03` | AS3935 | A0=A1=GND, CS=3V3 | Não |
| `0x53` | LTR390 | — | Sim |
| `0x62` | SCD41 | — | Sim |
| `0x69` | SPS30 | SEL=GND | Não |
| `0x76` | BME690 | SDO=GND, CS=3V3 | Não |

> ⚠️ **Não há conflito de endereços.** Os 5 endereços são únicos no barramento.

---

## 3. Nó Externo — Heltec LoRa32 V3

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
| GPIO15 | GPIO IRQ | → | MISOL Fio 2 | IRQ | 3.3V | 100Ω série + TVS SMAJ3.3A. Requer pull-up de 10kΩ! |
| GPIO4 | IRQ AS3935 | → | AS3935 IRQ | IRQ | 3.3V | Borda subida — attachInterrupt() |
| GPIO5 | EN MOSFET SPS30 | ← | Gate MOSFET IRLML6344 | EN | 3.3V | Pull-down 10kΩ no gate — LOW desliga SPS30 |
| GPIO7 | INT LTR390 | → | LTR390 INT | IRQ | 3.3V | Opcional — pode usar polling |
| GPIO38 | I2S BCLK | ← | ICS-43434 BCLK | I2S | 3.3V | Bit Clock microfone |
| GPIO39 | I2S WS | ← | ICS-43434 LRCL | I2S | 3.3V | Word Select microfone |
| GPIO40 | I2S SD | → | ICS-43434 DOUT | I2S | 3.3V | Dados áudio PCM entrada |
| GPIO47 | UART1 TX | ← | — | UART | 3.3V | Reservado para expansão |
| GPIO48 | UART1 RX | → | — | UART | 3.3V | Reservado para expansão |
| GPIO36 | Vext_Ctrl | — | ESPECIAL | Config | 3.3V | Reservado (não utilizado nesta arquitetura) |
| GPIO1 | VBAT_Read | → | ADC interno | Config | ADC | analogRead(1) — divisor 1:2 — lê tensão powerbank |
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
| 1 | SPS30 | Pin4 SEL | ← | GND | Config | — | SEL=GND antes de energizar (modo I²C) |
| 2 | MOSFET Gate | Gate | ← | GPIO5 Heltec | GPIO5 | 10kΩ pull-down a GND | Gate pull-down garante MOSFET OFF durante deep sleep |
| 3 | SPS30 | Pin1 VDD | ← | 5V Powerbank | PWR | — | Alimentação 5V direta (não chavear VDD com N-MOS) |
| 4 | SPS30 | Pin5 GND | ← | MOSFET IRLML6344 Drain | EN | — | GND chaveado low-side |
| 5 | SCD41 | SCL/SDA | ↔ | GPIO42/GPIO41 | I²C | 4.7kΩ pull-up a 3V3 | Wire.begin(41,42) obrigatório |
| 6 | BME690 | SCK/SDI | ↔ | GPIO42/GPIO41 | I²C | 4.7kΩ pull-up a 3V3 | SDO=GND (0x76), CS=3V3 (modo I²C) |
| 7 | LTR390 | SCL/SDA | ↔ | GPIO42/GPIO41 | I²C | — | INT opcional → GPIO7 |
| 8 | AS3935 | SCL/SI | ↔ | GPIO42/GPIO41 | I²C | — | CS=3V3, EN_V=3V3, A0=A1=GND, IRQ→GPIO4 |
| 9 | SPS30 | SDA/SCL Pin2/3 | ↔ | GPIO41/GPIO42 | I²C | — | Verificar e remover pull-ups 5V do breakout! |
| 10 | ICS-43434 | BCLK/WS/DOUT | ↔ | GPIO38/39/40 | I2S | — | SEL=GND (canal esquerdo) |
| 11 | MISOL | Fio 2 | → | GPIO15 | IRQ | 100Ω+TVS SMAJ3.3A | Fio 1 → GND direto. Pull-up 10kΩ no GPIO15. Debounce 15ms não-bloqueante. |
| 12 | Powerbank | USB 5V | → | Heltec 5V pin (direto) | PWR | — | Conexão direta. INA260 removido. Monitorar via GPIO1 (VBAT). |

### Notas críticas

> 🔴 **CRÍTICO:** `Wire.begin(41, 42)` obrigatório. Sem isso o I²C inicializa nos pinos do OLED interno (GPIO17/18) e nenhum sensor externo responde.

> 🔴 **CRÍTICO:** GPIO19 e GPIO20 são USB D- e D+. **NUNCA usar como GPIO** — danifica o ESP32-S3.

> 🔴 **CRÍTICO:** GPIO43/44 conectados ao CP2102 (USB-UART bridge). **NUNCA usar para UART externa**.

> 🔴 **CRÍTICO:** Resistor 10kΩ pull-down no gate do MOSFET IRLML6344 obrigatório. Sem ele, GPIO5 flutua em deep sleep e o SPS30 fica ligado 24h.

> 🔴 **CRÍTICO:** SPS30 em modo I²C — SEL (Pin4) deve estar em GND **ANTES** de ligar. Se SEL flutuar o sensor inicializa em UART e não aparece no I²C.

> 🔴 **CRÍTICO:** Verificar pull-ups do breakout SPS30. Se tiver resistores a 5V nos pinos I²C, remover antes de conectar (GPIOs Heltec máx 3.6V).

> ⚠️ **IMPORTANTE:** GPIO36 (Vext_Ctrl) está reservado e não é usado nesta arquitetura (sensores em 3V3 direto).

> ⚠️ **IMPORTANTE:** GPIO1 = VBAT_Read. analogRead(1) — divisor 1:2 — lê tensão do powerbank.

> ⚠️ **IMPORTANTE:** Calibrar AS3935 com SPS30 ativo — motor do SPS30 gera ruído EM. Ajustar NOISE_FLOOR até eliminar falsos positivos.

> ⚠️ **IMPORTANTE:** Antena LoRa requer pigtail U.FL→SMA + conector SMA passante na caixa IP65.

> 🔧 **FIRMWARE:** Calibração SCD41 (offset T) deve ser feita com sistema montado em posição final — não na bancada.

> 🔧 **FIRMWARE:** Estado BSEC do BME690: salvar na flash Preferences a cada 1 hora (a cada 12 ciclos quando intervalo=5min).

> 🔧 **BARRAMENTO I²C:** Usar 100 kHz (não 400 kHz). No pior caso (1 pull-up externo + 5 pull-ups internos de breakouts em paralelo, R_ef≈783Ω e C_bus≈250pF), tr≈430ns em 400kHz excede o limite de 300ns da Fast-mode (I²C-bus specification).

---

## 4. Nó Base — Heltec LoRa32 V3 (Base)

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
| 1 | Heltec Base | GPIO45 U1TX | → | ESP32-P4 | UART·RXD | 115200 baud · Struct 34 bytes via UART1 |
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

> 🔧 **FIRMWARE:** Exibir no display OLED: temperatura, CO₂, PM2.5, UVI, status LoRa (RSSI), status WiFi e última hora de recebimento.

> 🔧 **ENDEREÇAMENTO:** ADDR_BASE = 0x02, SYNC_WORD = 0xAB. Descartar pacotes de endereços desconhecidos.

---

## 5. Nó Base — ESP32-P4 Waveshare Touch 7"

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
| UART·RXD | RX UART do Heltec | ← | Heltec Base GPIO45 | UART | 3.3V | Payload 34 bytes do nó externo |
| UART·GND | GND UART | — | Heltec Base GND | PWR | — | GND comum obrigatório |
| UART·VCC | 5V para Heltec | → | Heltec Base 5V | PWR | 5V | Alimenta o Heltec base |
| SD Slot | MicroSD interno | — | Cartão SanDisk 32 GB | SDIO | 3.3V | Buffer local — fila JSONL quando WiFi cai |
| RTC interno | Relógio tempo real | — | Bateria CR1220 | — | 3V | Mantém hora sem energia |
| WiFi6 (C6) | Radio WiFi6/BT | — | Roteador WiFi | WiFi6 | — | Publica MQTT / ArduinoOTA |
| RS485·A/B | RS485 | — | Opcional: anemômetro | RS485 | 5V | Anemômetro RS485 Modbus RTU futuro |
| USB-C | Alimentação | ← | Fonte 5V 2A | PWR | 5V | Fonte principal nó base |

### Diagrama de conexões — passo a passo

| Passo | De | Pino | Dir | Para | Destino | Observação Crítica |
|:---:|---|---|:---:|---|---|---|
| 1 | ESP32-P4 | UART·RXD | ← | Heltec Base | GPIO45 TX | Recebe payload 34 bytes struct |
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

> 🔧 **FIRMWARE:** Receber struct binária 34 bytes do Heltec via UART → deserializar → converter para JSON → publicar MQTT tópicos individuais por sensor.

> ⚠️ **IMPORTANTE:** SD Card — usar `SD_MMC` (SDIO 3.0 nativo do ESP32-P4). **Não usar** biblioteca SPI para SD.

> ⚠️ **IMPORTANTE:** RTC CR1220 — sincronizar via NTP ao conectar WiFi e incluir timestamp NTP no ACK enviado para o nó externo.

---

## 6. Sensores

### 6.1 SCD41 — CO₂ / Temperatura / Umidade

**Fabricante:** Sensirion · **Princípio:** NDIR (Non-Dispersive Infrared) — CO₂ real, não estimado

#### Especificações

| Parâmetro | Valor | Parâmetro | Valor |
|---|---|---|---|
| Faixa CO₂ | 400–5000 ppm | Precisão CO₂ | ±40 ppm + 5% da leitura |
| Faixa T | -10°C a +60°C | Precisão T | ±0.8°C (após offset) |
| Faixa UR | 0–100% | Precisão UR | ±6% UR |
| Interface | I²C | Endereço | 0x62 (fixo) |
| Tensão | 2.4–5.5V (usar 3.3V) | Corrente medição | ~15 mA |
| Modo single-shot | ~5s / medição | Auto-calibração | ASC — requer ar fresco 400 ppm semanalmente |
| Offset T | Ajustável por software — **crítico!** | Startup | ~10s aquecimento |

#### Pinout

| Pino | Função | Dir | Conectar em | Interface | Tensão | Notas |
|---|---|:---:|---|---|---|---|
| VDD | Alimentação | ← | 3V3 Heltec | PWR | 3.3V | Direto no rail 3.3V |
| GND | Terra | ← | GND Heltec | PWR | — | GND comum |
| SCL | Clock I²C | ← | GPIO42 Heltec | I²C | 3.3V | Barramento I²C compartilhado |
| SDA | Dados I²C | ↔ | GPIO41 Heltec | I²C | 3.3V | Pull-up 4.7kΩ externo a 3.3V |

#### Diagrama de conexões

| Passo | De | Pino | Dir | Para | Resistor/Cap | Observação |
|:---:|---|---|:---:|---|---|---|
| 1 | SCD41 | VDD | ← | 3V3 | — | Alimentação direta |
| 2 | SCD41 | GND | ← | GND | — | Terra comum |
| 3 | SCD41 | SCL | ← | GPIO42 | — | Clock I²C — compartilhado com todos sensores |
| 4 | SCD41 | SDA | ↔ | GPIO41 | 4.7kΩ a 3V3 | Dados I²C — pull-up externo único |

#### Notas críticas

> 🔴 **CRÍTICO:** O SCD41 aquece internamente e reporta T ~2–4°C acima do real. **SEM calibração de offset, o CO₂ também erra** (compensação interna usa T).

> 🔧 **CALIBRAÇÃO:** Montar sistema em posição **FINAL** de instalação. Aguardar 30 min estabilizar. `offset = T_SCD41 - T_BME690`. Salvar com `scd41.setTemperatureOffset(offset)` + Preferences.

> 🔧 **CALIBRAÇÃO SAZONAL (Floriano, PI):** T ambiente varia de 23°C (julho) a 40°C (outubro). Calibrar em dois momentos: (1) verão seco setembro/outubro e (2) período chuvoso fevereiro. Salvar `offset_seco` e `offset_chuvoso`. Selecionar no firmware: se T_BME690 > 33°C usar `offset_seco`.

> 🔧 **FIRMWARE:** Usar modo `measureSingleShot()` — acorda, mede em 5s, dorme. Consome 0.5 mA médio vs 15 mA em modo contínuo. Crítico para autonomia do powerbank.

> 📌 **ENDEREÇO I²C:** 0x62 fixo. Não tem pino de configuração de endereço.

> ⚠️ **ABRIGO:** SCD41 deve estar dentro do abrigo meteorológico com ventilação — **nunca** dentro da caixa IP65 selada.

---

### 6.2 BME690 — Ambiental (T / UR / Pressão / VOC)

**Fabricante:** Bosch · **Mede:** Temperatura, Umidade, Pressão Barométrica, VOC/IAQ

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

#### Diagrama de conexões

| Passo | De | Pino | Dir | Para | Resistor/Cap | Observação |
|:---:|---|---|:---:|---|---|---|
| 1 | BME690 | VCC | ← | 3V3 | — | Alimentação |
| 2 | BME690 | GND | ← | GND | — | Terra |
| 3 | BME690 | SCK | ← | GPIO42 | — | Clock I²C |
| 4 | BME690 | SDI | ↔ | GPIO41 | 4.7kΩ a 3V3 | Dados I²C |
| 5 | BME690 | SDO | ← | GND | — | Define endereço 0x76 |
| 6 | BME690 | CS | ← | 3V3 | 10kΩ a 3V3 | MODO I²C. **Verificar no breakout!** |

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

### 6.3 SPS30 — Material Particulado PM2.5

**Fabricante:** Sensirion · **Mede:** PM1.0, PM2.5, PM4.0, PM10

#### Especificações

| Parâmetro | Valor | Parâmetro | Valor |
|---|---|---|---|
| PM medidos | PM1.0, PM2.5, PM4.0, PM10 | Princípio | Dispersão laser óptica |
| Precisão PM2.5 | ±10 µg/m³ ou ±10% | Faixa | 0–1000 µg/m³ |
| Tensão | **5V (4.5–5.5V)** | Corrente | ~75 mA @ 5V |
| Interface | I²C (SEL=GND) ou UART (SEL=VDD) | Endereço I²C | 0x69 (fixo) |
| Conector | FPC ZIF 5 pinos 1.5mm pitch | Startup | ~8s até leitura estável |
| Fan auto-clean | 168h padrão → **48h (jun–nov)** / **72h (dez–mai)** Floriano | Vida útil | ~8 anos / 20.000h |
| Orientação | **Vertical — inlet para BAIXO** | Pino 1 | VDD (5V) |
| Pino 2 | RX/SDA | Pino 3 | TX/SCL |
| Pino 4 | SEL | Pino 5 | GND |

#### Pinout

| Pino | Função | Dir | Conectar em | Interface | Tensão | Notas |
|---|---|:---:|---|---|---|---|
| Pin 1 — VDD | Alimentação 5V | ← | TPS2051B (OUT) | PWR | **5V** | 5V chaveado High-Side pelo TPS2051B |
| Pin 2 — RX/SDA | Dados I²C | ↔ | GPIO41 Heltec | I²C | 3.3V | Verificar pull-ups internos! Remover se forem a 5V. |
| Pin 3 — TX/SCL | Clock I²C | ← | GPIO42 Heltec | I²C | 3.3V | Verificar pull-ups internos! Remover se forem a 5V. |
| Pin 4 — SEL | Seleção modo | ← | GND | Config | — | GND = I²C. VDD = UART. **CRÍTICO: conectar ANTES de ligar** |
| Pin 5 — GND | Terra | ← | GND Heltec | PWR | — | GND comum direto |

#### Diagrama de conexões

| Passo | De | Pino | Dir | Para | Resistor/Cap | Observação |
|:---:|---|---|:---:|---|---|---|
| 1 | SPS30 | Pin4 SEL | ← | GND | — | **PRIMEIRO** conectar SEL=GND antes de qualquer coisa |
| 2 | SPS30 | Pin1 VDD | ← | TPS2051B OUT | — | Alimentação 5V chaveada High-Side |
| 3 | SPS30 | Pin2 SDA | ↔ | GPIO41 | — | Verificar e remover pull-ups a 5V do breakout |
| 4 | SPS30 | Pin3 SCL | ← | GPIO42 | — | Verificar e remover pull-ups a 5V do breakout |
| 5 | SPS30 | Pin5 GND | ← | GND | — | GND comum direto |
| 6 | TPS2051B | EN | ← | GPIO5 | 10kΩ a GND | Pino EN flutua LOW em sleep → TPS2051B OFF |

#### Notas críticas

> 🔴 **CRÍTICO:** SEL (Pin4) deve estar em GND **ANTES** de ligar VDD. Se SEL flutuar ao energizar, sensor entra em modo UART e não aparece no I²C.

> 🔴 **CRÍTICO:** Verificar pull-ups do breakout SPS30. Se tiver resistores a 5V nos pinos SDA/SCL, **remover** antes de conectar ao Heltec (GPIOs máx 3.6V).

> 🔴 **CRÍTICO (HIGH-SIDE):** Utilizar CI Load Switch (ex: TPS2051B) para cortar o 5V do SPS30 (High-Side). NUNCA usar MOSFET no GND (Low-Side) em sensores I²C, pois a corrente flui parasiticamente pelos pinos de dados (SDA/SCL) danificando o ESP32.

> 🔴 **ORIENTAÇÃO FÍSICA:** Montar **VERTICALMENTE** com inlet (abertura do ventilador) apontando para **BAIXO**. Horizontal acumula poeira na câmara óptica.

> ⚠️ **ACESSO AO AR:** SPS30 precisa de fluxo de ar externo. Não pode ficar dentro de caixa IP65 selada.

> 🔧 **AUTO-LIMPEZA (Floriano, PI):** Reduzir de 168h para 48h na estação seca (jun–nov — Caatinga):
> ```c
> sps30_set_fan_auto_cleaning_interval(48*3600)  // seca
> sps30_set_fan_auto_cleaning_interval(72*3600)  // chuvas
> ```

> 🔧 **FIRMWARE:** `ligarSPS30()` → `delay(8000)` → ler PM → `desligarSPS30()`. Nunca deixar o Load Switch ligado entre medições.

> 🔧 **SEQUÊNCIA SEGURA:** `Wire.endTransmission()` concluído → `GPIO5=LOW` (TPS2051B OFF). Ao religar: `GPIO5=HIGH` → `delay(8000)` → leitura SPS30. Não executar transações SPS30 durante OFF.

---

### 6.4 LTR390 — UV Index e Lux

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

> 🔴 **BLOQUEIO UV POR VIDRO:** Nunca instalar atrás de vidro, policarbonato comum ou plástico opaco ao UV.

> 🔧 **FIRMWARE:** O LTR390 não mede UV e ALS simultaneamente. Alternar: modo UV (5s) → ler UVI → modo ALS (5s) → ler lux.

> 📌 **FLORIANO, PI — UVI 13–15:** Em Floriano (6.77°S), UVI pode chegar a 14–15 entre 10h–14h. Usar `GAIN_1X` entre 10h–14h na estação seca (ago–out) para evitar saturação:
> - GAIN_3X com UVI=14 → 96.600 contagens = **9.2% do fundo de escala** (OK, mas usar GAIN_1X como precaução)
> - GAIN_1X com UVI=15 → 34.500 contagens = **3.3% do fundo de escala** (seguro)
> - Padrão operacional recomendado: `GAIN_3X` fora de 10h–14h; manter `GAIN_1X` apenas no pico solar da seca.

> ⚠️ **POSICIONAMENTO:** Instalar com o sensor (janela óptica) apontando para o céu — 90° vertical.

---

### 6.5 AS3935 — Detecção de Raios

**Fabricante:** ams · **Breakout:** CJMCU-3935 · **Detecta:** emissões EM de raios em 300–1000 kHz

#### Especificações

| Parâmetro | Valor | Parâmetro | Valor |
|---|---|---|---|
| Faixa detecção | 1–40 km em 15 faixas | Frequência EM | 300–1000 kHz |
| Interface | I²C (CS=HIGH) ou SPI (CS=LOW) | Endereço I²C | 0x03 (A0=A1=GND) |
| Tensão | 2.4–5.5V | Corrente listening | ~0.35 mA |
| Antena | LC interna ressonante 500 kHz | Calibração | `calibrateResonanceFrequency()` |
| IRQ | Borda de subida a cada evento | EN_V | HIGH=antena habilitada |

**Tabela de endereços:**

| A0 | A1 | Endereço |
|:---:|:---:|:---:|
| GND | GND | `0x03` ← **usado** |
| VCC | GND | `0x01` |
| GND | VCC | `0x02` |
| VCC | VCC | `0x00` |

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
| MOSI | SPI MOSI | — | N/C | — | — | Não conectar em modo I²C |
| MISO | SPI MISO | — | N/C | — | — | Não conectar em modo I²C |

#### Diagrama de conexões

| Passo | De | Pino | Dir | Para | Observação |
|:---:|---|---|:---:|---|---|
| 1 | AS3935 | VCC | ← | 3V3 | Alimentação |
| 2 | AS3935 | GND | ← | GND | Terra |
| 3 | AS3935 | SCL | ← | GPIO42 | Clock I²C |
| 4 | AS3935 | SI (SDA) | ↔ | GPIO41 | Dados I²C (SI = SDA em I²C mode) |
| 5 | AS3935 | CS | ← | 3V3 | **MODO I²C** — HIGH obrigatório |
| 6 | AS3935 | IRQ | → | GPIO4 | `attachInterrupt(4, isrRaio, RISING)` |
| 7 | AS3935 | A0 | ← | GND | Endereço 0x03 |
| 8 | AS3935 | A1 | ← | GND | Endereço 0x03 |
| 9 | AS3935 | EN_V | ← | 3V3 | Habilita antena |

#### Notas críticas

> 🔴 **CRÍTICO:** CS deve estar em HIGH (3V3) para modo I²C. Se CS flutuar para LOW, o sensor entra em modo SPI e **some do barramento I²C**.

> 🔴 **CRÍTICO:** Calibrar antena LC no setup() **APENAS em Cold Boot**. Não recalibrar em wake-ups de Deep Sleep para não perder a janela de acúmulo de raios.

> 🔴 **CRÍTICO:** Mínimo **10cm de distância do SPS30** dentro da case 3D. Motor DC do SPS30 gera ruído 300kHz–1MHz que o AS3935 interpreta como raio.

> 🔧 **CALIBRAÇÃO:** Após calibrar antena, ligar SPS30 e ajustar `NOISE_FLOOR` até eliminar falsos positivos. Salvar valor na flash. Recalibrar se trocar a case.

> 🔧 **ISR:** IRQ dispara na borda de subida. Na ISR, apenas setar flag. No loop principal, ler registradores via I²C (não fazer I²C dentro da ISR).

> 🔧 **ANTI-SPIKE:** Ignorar evento de raio se SPS30 foi ligado há menos de 15 segundos.

> 🔧 **FIRMWARE:** Configurar `WATCHDOG_THRESHOLD = 2`, `NOISE_FLOOR = ajustado na calibração`, `MIN_NUM_LIGHTNING = 1`.

---

### 6.6 ICS-43434 — Microfone MEMS I2S

**Fabricante:** InvenSense · **Interface:** I2S digital · **Uso:** Ruído ambiental dB(A)

#### Especificações

| Parâmetro | Valor | Parâmetro | Valor |
|---|---|---|---|
| SNR | 65 dB(A) | Faixa SPL | 29–116 dB SPL |
| Resposta freq. | 50 Hz – 20 kHz | Interface | I2S digital |
| Tensão | 1.5–3.6V | Corrente | ~0.65 mA |
| Saída | PCM digital 24-bit | L/R Select | SEL: GND=esquerdo, VDD=direito |
| Sample rate | 8–51.2 kHz | | |

#### Pinout

| Pino | Função | Dir | Conectar em | Interface | Tensão | Notas |
|---|---|:---:|---|---|---|---|
| 3V | Alimentação | ← | 3V3 Heltec | PWR | 3.3V | 1.5–3.6V — não usar 5V |
| GND | Terra | ← | GND Heltec | PWR | — | GND comum + GND mecânico do shield |
| BCLK | Bit Clock | ← | GPIO38 Heltec | I2S | 3.3V | Bit clock gerado pelo Heltec |
| LRCL | Word Select | ← | GPIO39 Heltec | I2S | 3.3V | LR Clock — 44100 Hz recomendado |
| DOUT | Dados PCM saída | → | GPIO40 Heltec | I2S | 3.3V | Dados de áudio 24-bit PCM |
| SEL | Seleção canal | ← | GND | Config | — | GND = canal esquerdo |

#### Notas críticas

> ⚠️ **ISOLAMENTO:** O microfone deve estar em cápsula acústica separada da caixa principal. O ventilador do SPS30 gera ruído mecânico que contamina as leituras.

> 🔴 **FILTRO dB(A):** O microfone retorna PCM bruto. Para valores regulatórios (**ABNT NBR 10151**), aplicar filtro IIR ponderação A via ESP-DSP antes do cálculo RMS.

> 🔧 **FIRMWARE:** Usar `esp_i2s_read()` com DMA. Buffer de 1024 samples a 44100 Hz. Calcular RMS → converter para dBFS → aplicar filtro A → resultado em dB(A).

> ⚠️ **FLORIANO, PI — VENTOS:** Ventos de 40–60 km/h são frequentes. Usar espuma open-cell de pelo menos **15 mm de espessura** na abertura do microfone.

---

### 6.7 MISOL MS-WH-SP-RG — Pluviômetro

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

#### Diagrama de conexões

| Passo | De | Pino | Dir | Para | Resistor/Cap | Observação |
|:---:|---|---|:---:|---|---|---|
| 1 | MISOL | Fio 1 (RJ11) | ← | GND | — | Fixa referencial em 0V ao fechar contato |
| 2 | MISOL | Fio 2 (RJ11) | → | GPIO15 | 10kΩ a 3V3 | Pull-up mantém GPIO15 em HIGH quando aberto |
| 3 | Adaptador | RJ11 → terminais | — | — | — | Usar adaptador RJ11 breakout para conexão |

#### Notas críticas

> 🔴 **CRÍTICO:** Proteção ESD obrigatória. Cabo externo longo durante temporal com raios = antena. Resistor 100Ω em série + TVS SMAJ3.3A ao GND no GPIO15. Evitar GPIO3 pois é pino de JTAG_EN e causa falha de boot.

> 🔴 **CRÍTICO:** Debounce de **15ms** obrigatório na ISR. Reed switch tem bounce mecânico de até 5ms.

> ⚠️ **PROJETO:** Debounce é implementado por firmware (15ms), sem capacitor de debounce no reed switch.

> ⚠️ **NIVELAMENTO:** Instalar com bolha de nível centralizada. Inclinação de 1° = erro ±8%.

> ⚠️ **POSICIONAMENTO (WMO-No.8):** Altura 1.2–1.5m do chão e raio livre mínimo de obstáculos igual a 2× a altura do obstáculo mais próximo.

> 🔧 **FIRMWARE:** `attachInterrupt(GPIO_NUM_15, isrChuva, FALLING)`. ISR: use millis() para debounce não-bloqueante (`if (millis() - last_irq > 15)`). MÁ PRÁTICA: Nunca usar `delay()` em ISR.

> ⚠️ **ACUMULAÇÃO SEGURA:** Variável `rainPulses` deve ser `volatile`. **NÃO zerar** antes de ACK confirmado. Acumular se TX falhar.

> 🔧 **DETECÇÃO ENTUPIMENTO:** Se UR > **70%** (não 90% — Floriano raramente passa de 80%) por 30min E rain = 0 → alerta `'VERIFICAR_PLUVIOMETRO'`.

> 🔧 **FLORIANO, PI — MANUTENÇÃO PRÉ-CHUVAS:** Limpar o funil e verificar a báscula em **DEZEMBRO**, antes das primeiras chuvas de janeiro. Poeira da Caatinga acumula no funil durante 7 meses de seca.

---

## 7. Load Switch e Componentes Passivos

**Load Switch:** IC TPS2051B (ou AP2210) · **Função:** chave high-side do VDD 5V do SPS30

### Especificações

| Parâmetro | Valor | Parâmetro | Valor |
|---|---|---|---|
| Load Switch | TPS2051B (SOT-23-5) | V_IN / EN | Funciona com lógica 3.3V no pino EN |
| Corrente máx | 500mA contínuo | V_OUT | 5V |
| Rds(on) | ~95 mΩ | TVS | SMAJ3.3A — 3.3V unidirecional |
| R pull-up I²C | 4.7kΩ × 2 (SDA + SCL) | R pull-up reed | 10kΩ (pluviômetro) |
| R pull-down EN| 10kΩ pull-down | R série ESD | 100Ω |
| R BME690 CS | 10kΩ pull-up a 3.3V | Cap decoupling | 100µF + 100nF |
| Posição caps | Saída 3.3V Heltec | Função caps | Pico TX WiFi/LoRa |

### Topologia Load Switch (High-side 5V)

```
Powerbank 5V ────────── IN [TPS2051B] OUT ──────── SPS30 VDD (Pin1)
                            │
GPIO5 ──────────────────── EN
  │
  └── 10kΩ pull-down ── GND
```

- `GPIO5=HIGH` → TPS2051B conduz → SPS30 energizado (5V)
- `GPIO5=LOW` ou pull-down → TPS2051B corta → SPS30 desligado
- `SPS30 GND (Pin5)` ─────── Ligado direto ao GND do sistema

### Pinout completo

| Componente | Pino | Dir | Conectar em | Interface | Tensão | Notas |
|---|---|:---:|---|---|---|---|
| TPS2051B EN | Controle | ← | GPIO5 Heltec | EN | 3.3V | **10kΩ pull-down ao GND obrigatório** |
| TPS2051B OUT | Carga (Alimentação 5V) | → | SPS30 VDD (Pin1) | PWR | 5V | Saída 5V chaveada para o sensor |
| TPS2051B IN | Entrada 5V | ← | 5V Powerbank | PWR | 5V | Entrada conectada aos 5V diretos |
| TVS SMAJ3.3A | Anodo | → | GND | PWR | — | Ligado ao GND comum |
| TVS SMAJ3.3A | Catodo | ← | GPIO15 via 100Ω | IRQ | — | Linha de proteção do GPIO15 |
| R 4.7kΩ #1 | Pull-up SDA | ← | 3V3 Heltec | PWR | 3.3V | **Único** pull-up SDA — remover dos breakouts |
| R 4.7kΩ #2 | Pull-up SCL | ← | 3V3 Heltec | PWR | 3.3V | **Único** pull-up SCL — remover dos breakouts |
| R 10kΩ #1 | Pull-up reed | ← | 3V3 Heltec | PWR | 3.3V | Fio 1 MISOL → 3V3 via 10kΩ |
| R 10kΩ #2 | Pull-down gate | ← | GND | PWR | — | Gate MOSFET → GND via 10kΩ |
| R 10kΩ #3 | Pull-up CS BME690 | ← | 3V3 | Config | 3.3V | Se breakout não tiver CS a 3V3 internamente |
| R 100Ω | Série ESD | — | GPIO15 Heltec | IRQ | — | Entre fio 2 MISOL e GPIO15 |
| Cap 100µF | Decoupling | ← | 3V3 Heltec | PWR | 3.3V | + ao rail 3.3V, - ao GND |
| Cap 100nF | Decoupling HF | ← | 3V3 Heltec | PWR | 3.3V | Próximo ao Heltec, menor loop possível |

### Notas críticas

> 🔴 **CRÍTICO:** Resistor 10kΩ pull-down no gate do MOSFET é obrigatório. Sem ele, GPIO5 flutua em deep sleep e pode manter o MOSFET conduzindo (SPS30 ON 24h).

> 🔴 **CRÍTICO:** Pull-ups 4.7kΩ externos são **OS ÚNICOS** pull-ups no barramento I²C. Remover os resistores de pull-up internos dos breakouts.

> ⚠️ **IMPORTANTE (LOW-SIDE):** Com GND do SPS30 chaveado, nunca manter acesso I²C ativo ao SPS30 durante OFF. Finalizar transação I²C, desligar MOSFET e evitar acesso ao SPS30 até religar e estabilizar.

> ⚠️ **IMPORTANTE:** Capacitores 100µF + 100nF na saída 3.3V do Heltec. O pico de TX WiFi/LoRa (~300mA em <1ms) pode causar reset sem esses capacitores.

> ⚠️ **IMPORTANTE:** TVS SMAJ3.3A — verificar polaridade. Catodo (linha marcada) deve apontar para o GPIO3.

> 📌 **MOSFET SOT-23:** Pinos: Gate(1), Source(2), Drain(3). Verificar datasheet para o package específico recebido.

---

## 8. Arquitetura de Alimentação

### Nó Externo — Trilhos de tensão

| Trilho | Origem | Destino | Corrente Pico | Corrente Média | Notas |
|---|---|---|---|---|---|
| 5V (powerbank) | Bateria Lítio + Boost | Heltec 5V pin + TPS2051B IN | ~120 mA pico LoRa TX | ~30 mA duty | Conexão direta. Evitar powerbanks comerciais (Auto-shutoff). |
| 3.3V (Heltec int.) | Regulador Heltec interno | SCD41, BME690, LTR390, AS3935, ICS-43434 | ~50 mA pico I2S | ~15 mA duty | Via pino 3V3 do Heltec |
| 5V chaveado SPS30 (high-side) | GPIO5 → TPS2051B (EN) | SPS30 VDD (Pin1) | ~75 mA | ~2.25 mA (3% duty) | Load Switch desligado em sleep |
| GPIO36 Vext_Ctrl | — | Não utilizado | — | ~0 mA | Mantido apenas como reserva para futura revisão |

### Consumo por componente (intervalo 5 minutos = ciclo 300s)

| Componente | Tensão | Corrente Ativa | Tempo Ativo/Ciclo | Corrente Média | Estado Sleep | Notas |
|---|---|---|---|---|---|---|
| Heltec (ESP32-S3 wake) | 5V | ~120 mA proc. / 240 mA TX | ~15s / 300s | ~6 mA | ~0.8 mA (RTC) | Pico 240mA em TX LoRa |
| SCD41 | 3.3V | ~15 mA (medição) | ~5s / 300s | ~0.25 mA | ~3 µA | Modo single-shot recomendado |
| BME690 | 3.3V | ~3.7 mA | ~1s / 300s | ~0.012 mA | ~1.4 µA | BSEC modo forced |
| SPS30 | 5V | ~75 mA | ~9s / 300s | ~2.25 mA | 0 (TPS2051B OFF) | 8s startup + 1s leitura |
| LTR390 | 3.3V | ~0.6 mA | ~2s / 300s | ~0.004 mA | ~0.5 µA | UV + ALS alternados |
| AS3935 | 3.3V | ~0.35 mA | Sempre (listen) | ~0.35 mA | ~0.35 mA | Sempre em modo listening |
| ICS-43434 | 3.3V | ~0.65 mA | ~5s / 300s | ~0.011 mA | ~0.001 mA (standby) | Alimentação direta 3V3 |
| **TOTAL ESTIMADO** | | | | **~9 mA (5min)** | **~1.5 mA (sleep)** | Com deep sleep entre ciclos |

### Estimativa de autonomia por powerbank (dados reais)

| Powerbank | Cap. nominal | Cap. útil @5V (70% × 85%) | Cons. médio 5min (9.2mA) | **Autonomia** | Cons. médio 10min (~4.6mA) | **Autonomia** |
|---|---|---|---|---|---|---|
| 5.000 mAh | 5.000 mAh | 2.975 mAh | 9.2 mA | **~323h (13 dias)** | ~4.6 mA | **~647h (27 dias)** |
| 10.000 mAh | 10.000 mAh | 5.950 mAh | 9.2 mA | **~647h (27 dias)** | ~4.6 mA | **~1293h (54 dias)** |
| 20.000 mAh | 20.000 mAh | 11.900 mAh | 9.2 mA | **~1293h (54 dias)** | ~4.6 mA | **~2587h (108 dias)** |

> Nota: no cenário de 10 minutos, o cálculo considera uma única ativação do SPS30 por ciclo de 600s.
> 🔴 **CRÍTICO - AUTO-SHUTOFF:** Powerbanks comerciais (Xiaomi, Anker) desligam automaticamente se a corrente for < 50mA. Como o sistema no modo sleep consome apenas ~1.5mA por 5 minutos constantes, um powerbank comum VAI MORRER na primeira vez que o sistema dormir. **Solução mandatória:** Substituir por Células 18650 + Módulo TP4056 + Módulo Boost 5V dedicado, ou módulos Keep-Alive IoT especializados.

### Nó Base — Alimentação

| Componente | Fonte | Alimenta | Corrente Pico | Corrente Típica | Notas |
|---|---|---|---|---|---|
| ESP32-P4 USB-C | Fonte 5V 2A | Placa principal + tela touch | ~500 mA pico (tela brilho máx) | ~150 mA típico | Alimentação contínua |
| Heltec base | ESP32-P4 UART·VCC (5V) | Heltec base 5V pin | ~120 mA (TX LoRa) | ~30 mA (RX contínuo) | Alimentado pelo ESP32-P4 |
| SD Card (embutido) | 3.3V interno ESP32-P4 | Slot TF SDIO 3.0 | ~100 mA (escrita) | ~5 mA | Fila JSONL + flush WiFi |
| RTC + CR1220 | Bateria CR1220 | RTC embutido ESP32-P4 | ~3 µA | ~3 µA | Backup sem rede |

---

## 9. Protocolo LoRa P2P

### Parâmetros de rádio

| Parâmetro | Valor | Parâmetro | Valor |
|---|---|---|---|
| Frequência | **915.0 MHz** ← ANATEL/Brasil | Sync Word | **0xAB** (privado) |
| Endereço Externo | `0x01` (ADDR_EXTERNO) | Endereço Base | `0x02` (ADDR_BASE) |
| Spreading Factor | SF9 | Bandwidth | 125 kHz |
| Coding Rate | 4/5 | Potência TX | 14 dBm |
| Preamble | 8 símbolos | CRC | Habilitado |
| Time-on-air (34B) | **~246.8 ms** @ SF9 | Alcance estimado | ~2–5 km urbano |

> ⚠️ **868 MHz é ILEGAL no Brasil.** Exclusivo para Europa. Usar **obrigatoriamente 915 MHz** (ANATEL).

### Struct Payload — 34 bytes (packed)

```c
struct __attribute__((packed)) Payload {
    uint16_t seq;        // 2B — número sequencial (detectar pacotes perdidos)
    uint32_t ts;         // 4B — timestamp UNIX epoch (corrigido pelo ACK NTP)
    int16_t  co2;        // 2B — CO₂ ppm × 1 (400–5000)
    int16_t  temp;       // 2B — °C × 100 (-4000 a 8500) — ex: 2850 = 28.50°C
    uint16_t hum;        // 2B — UR % × 100 (0–10000)
    uint16_t pressure;   // 2B — hPa × 10 (9000–11000)
    uint16_t voc;        // 2B — IAQ 0–500 (via BSEC 2.x)
    uint16_t pm25;       // 2B — µg/m³ × 10
    uint16_t pm10;       // 2B — µg/m³ × 10
    uint16_t pm1;        // 2B — µg/m³ × 10
    uint16_t pm4;        // 2B — µg/m³ × 10
    uint16_t uvi;        // 2B — UVI × 100 (ex: 1150 = 11.50 UVI)
    uint16_t lux;        // 2B — lux (0–65535)
    uint16_t rain;       // 2B — mm × 10 acumulado no ciclo
    uint8_t  lightning;  // 1B — km distância raio (0 = sem evento)
    uint16_t db_spl;     // 2B — dB(A) × 10 com filtro ponderação A
    uint8_t  flags;      // 1B — bit0=sensor_err, bit1=low_bat, bit2=reservado
};  // TOTAL: 34 bytes exatos
```

### Struct ACK — 6 bytes (packed)

```c
struct __attribute__((packed)) AckPayload {
  uint16_t seq_ack;        // 2B — sequência confirmada pelo nó base
  uint32_t ntp_timestamp;  // 4B — epoch UNIX (s) do nó base sincronizado via NTP
};  // TOTAL: 6 bytes exatos
```

> 🔴 **CRÍTICO:** Usar exatamente 6 bytes no ACK LoRa e validar `seq_ack == seq` antes de atualizar RTC.

### Intervalo operacional padrão

- **Padrão de produção:** 5 minutos (300s) por ciclo de coleta/transmissão.
- O modo 10 minutos é opcional de economia de energia e deve ser configurado explicitamente no firmware.

### Fluxo ACK + Sincronização de tempo

| Passo | Ator | Ação | Timeout | Em caso de falha | Notas |
|:---:|---|---|---|---|---|
| 1 | Nó Externo | Coleta todos sensores e monta struct Payload | — | — | `seq++`, `ts = rtc.getEpoch()` |
| 2 | Nó Externo | `radio.transmit(payload, 34, ADDR_BASE)` | ~246.8ms | Retry step 2 | Com `SYNC_WORD=0xAB` |
| 3 | Nó Externo | Aguarda ACK em modo RX por **5 segundos** | 5.000ms | Retry (máx 3×) | **NÃO dormir ainda** |
| 4 | Nó Base | Recebe pacote — verifica ADDR e SYNC_WORD | — | Descartar | Se inválido, ignorar |
| 5 | Nó Base | Envia ACK: `{seq_ack, ntp_timestamp}` | ~100ms | — | NTP deve estar sincronizado |
| 6 | Nó Externo | Recebe ACK — atualiza RTC com `ntp_timestamp` | — | — | `rtc.setEpoch(ack.ntp_timestamp)` |
| 7 | Nó Externo | `esp_deep_sleep_start()` | — | — | Só dorme **APÓS** janela de ACK |
| 8 | Nó Base | Encaminha payload via UART para ESP32-P4 | — | Buffer circular | 115200 baud + newline |
| 9 | ESP32-P4 | Deserializa struct → JSON → MQTT + SD card | — | Salva no SD | Fila JSONL com flush |

### Análise quantitativa

| Parâmetro | Cálculo | Resultado |
|---|---|---|
| Time-on-air real | SF9, BW125, 34B, CR4/5 | **246.8 ms** |
| Energia por TX | 85mA × 3.3V × 0.247s | **69 mJ = 19 µWh** |
| Energia 288 TX/dia | 69mJ × 288 | **19.9 mWh/dia** (desprezível) |
| Deriva RTC (cristal 50ppm) | 24h × 3600s × 50/1e6 | **±4.3s/dia** |
| Deriva com sync 5min | ±4.3s × 5/(24×60) | **±15ms** (excelente) |

---

## 10. Checklist de Firmware

### Calibrações obrigatórias — antes de entrar em produção

| Item | Nó | Prioridade | Implementação |
|---|---|:---:|---|
| SCD41 offset T | Externo | 🔴 CRÍTICO | 30min estabilização → `offset=T_SCD41-T_BME690` → `setTemperatureOffset()` → Preferences. **Refazer se trocar case.** |
| AS3935 antena LC | Externo | 🔴 CRÍTICO | `calibrateResonanceFrequency()` no setup(). Com SPS30 ativo, ajustar `NOISE_FLOOR` até zerar falsos positivos. |
| BME690 BSEC burn-in | Externo | 🔴 CRÍTICO | 24h de operação contínua na primeira utilização. Salvar estado BSEC a cada 1h (12 ciclos com intervalo de 5min). |
| ICS-43434 filtro A | Externo | ⚠️ IMPORTANTE | Filtro IIR ponderação A (IEC 61672-1) via ESP-DSP. Sem filtro, valores dB não têm validade regulatória. |
| SPS30 auto-clean | Externo | ⚠️ IMPORTANTE | `sps30_set_fan_auto_cleaning_interval(48*3600)` seca / `72*3600` chuvas |

### Watchdog e recuperação automática

| Item | Nó | Prioridade | Implementação |
|---|---|:---:|---|
| Watchdog hardware | Externo | 🔴 CRÍTICO | `esp_task_wdt_init(30, true)` + feed no início de cada ciclo. Reset automático se travar. |
| Recuperação I²C | Externo | ⚠️ IMPORTANTE | Se `Wire.endTransmission()≠0` repetidamente: 9 pulsos manuais de clock no GPIO42 + `Wire.end()` + `Wire.begin(41,42)`. |
| Watchdog Heltec base | Base | ⚠️ IMPORTANTE | Mesmo watchdog 30s no Heltec base — RX loop pode travar. |

### Protocolo LoRa — firmware

| Item | Nó | Prioridade | Implementação |
|---|---|:---:|---|
| Endereçamento | Ambos | 🔴 CRÍTICO | `ADDR_EXTERNO=0x01`, `ADDR_BASE=0x02`, `SYNC_WORD=0xAB`. Descartar pacotes de endereços desconhecidos. |
| Payload binário | Ambos | 🔴 CRÍTICO | `struct Payload` 34 bytes packed. Não usar JSON no LoRa. Nó base converte para JSON antes do MQTT. |
| Flags de integridade | Externo | 🔴 CRÍTICO | `bit0=sensor_err`: setar 1 se qualquer sensor crítico (SCD41/BME690/SPS30/AS3935/LTR390) falhar leitura no ciclo ou retornar timeout CRC/I²C; `bit1=low_bat`; `bit2=reservado`. |
| ACK + retry | Externo | 🔴 CRÍTICO | Aguardar ACK por 5s **ANTES** de dormir. Retry até 3×. |
| Timestamp sync | Ambos | 🔴 CRÍTICO | ACK do nó base inclui NTP timestamp. Externo atualiza RTC a cada ACK recebido. |
| Detecção offline | Base | ⚠️ IMPORTANTE | Regra objetiva: se `(agora - ts_ultimo_pacote) > 900s` (15min), publicar MQTT `'OFFLINE'`, alertar tela e registrar no SD. |

### Buffer e persistência de dados

| Item | Nó | Prioridade | Implementação |
|---|---|:---:|---|
| Buffer SD nó base | Base | 🔴 CRÍTICO | Ao receber payload: gravar no SD (`queue.jsonl`) **PRIMEIRO**. Tentar MQTT depois. Flush ao reconectar WiFi. |
| Buffer circular Heltec | Base | ⚠️ IMPORTANTE | Fila de 8 pacotes no Heltec base. Enviar via UART só quando ESP32-P4 estiver pronto. |
| Chuva sem perda | Externo | ⚠️ IMPORTANTE | `rainPulses volatile`. Não zerar antes de ACK confirmado. Acumular se TX falhar. |
| Estado BSEC | Externo | ⚠️ IMPORTANTE | Salvar `bsec.getState()` a cada 1h (12 ciclos de 5min) em Preferences. Restaurar no boot com `bsec.setState()`. |

### OTA e manutenção remota

| Item | Nó | Prioridade | Implementação |
|---|---|:---:|---|
| OTA WiFi base | Base | ⚠️ IMPORTANTE | `ArduinoOTA.begin()` + `ArduinoOTA.handle()` no loop. Senha protegida. Mostrar progresso na tela. |
| Modo calibração | Externo | 💡 ÚTIL | Ativar por botão BOOT (flag Preferences `'cal_mode'`). Aguarda 30min, calcula offset SCD41, salva. |

### Alertas e monitoramento

| Item | Nó | Prioridade | Implementação |
|---|---|:---:|---|
| Estação offline | Base | ⚠️ IMPORTANTE | Critério: `delta = now_epoch - ts_ultimo_pacote`; se `delta > 900s` → MQTT `'estacao/status=OFFLINE'` + display alerta. |
| Bateria baixa | Ambos | ⚠️ IMPORTANTE | Externo: flag `bit1` em payload se Vbat<4.5V. Base: MQTT `'estacao/alerta=BATERIA_BAIXA'`. |
| Raio detectado | Externo | 💡 ÚTIL | Transmissão imediata fora do ciclo normal. Anti-debounce: não reportar mais de 1 raio/10min. |
| PM2.5 alto | Base | 💡 ÚTIL | Se PM2.5 > 25 µg/m³ (CONAMA 491/2018): MQTT alerta + log com timestamp. |
| Pluviômetro entupido | Base | 💡 ÚTIL | Se UR > 70% por 30min E rain = 0: MQTT `'alerta=VERIFICAR_PLUVIOMETRO'`. |
| Gap de sequência | Base | 💡 ÚTIL | Se `seq atual ≠ lastSeq+1`: log `'Dados perdidos: seq X a Y'`. |

---

## 11. Bill of Materials (BOM)

### Microcontroladores / MCUs

| Nº | Componente | Nó | Qtd | Status | Origem | Preço Est. | Verificação obrigatória |
|:---:|---|---|:---:|---|---|---|---|
| 1 | ESP32-P4 WiFi6 Touch 7" Waveshare | Base | 1 | ✅ Comprado | Amazon | ~R$ 350 | Verificar se veio com CR1220. Testar tela touch. |
| 2 | Heltec LoRa32 V3 — Unidade 1 (Externo) | Externo | 1 | ✅ Comprado | AliExpress | R$ 107 | **CONFIRMAR 915MHz** no checkout antes de enviar |
| 3 | Heltec LoRa32 V3 — Unidade 2 (Base) | Base | 1 | ✅ Comprado | AliExpress | R$ 107 | **CONFIRMAR 915MHz** no checkout antes de enviar |

### Sensores

| Nº | Componente | Nó | Qtd | Status | Origem | Preço Est. | Verificação obrigatória |
|:---:|---|---|:---:|---|---|---|---|
| 4 | SCD41 CO₂/T/UR | Externo | 1 | ✅ Comprado | AliExpress | R$ 87 | CONFIRMAR **SCD41** não SCD40 na listagem |
| 5 | BME690 Ambiental | Externo | 1 | ✅ Comprado | AliExpress | R$ 103 | CONFIRMAR **BME690** não BME680. Verificar pino CS. |
| 6 | SPS30 PM2.5 | Externo | 1 | ✅ Comprado | AliExpress | R$ 57 | Verificar cabo FPC 5 pinos incluso. Pino SEL. |
| 7 | LTR390 UV Index | Externo | 1 | ✅ Comprado | AliExpress | R$ 37 | Verificar se sensor está exposto sem vidro |
| 8 | AS3935 CJMCU-3935 | Externo | 1 | ✅ Comprado | AliExpress | R$ 126 | Verificar jumper I²C/SPI no breakout |
| 9 | MISOL MS-WH-SP-RG Pluviômetro | Externo | 1 | ✅ Comprado | AliExpress | R$ 89 | Verificar bolha de nível. Adaptador RJ11 necessário. |
| 10 | ICS-43434 Microfone I2S | Externo | 1 | ✅ Comprado | AliExpress | R$ 21 | — |

### Eletrônica auxiliar

| Nº | Componente | Nó | Qtd | Status | Origem | Preço Est. | Verificação obrigatória |
|:---:|---|---|:---:|---|---|---|---|
| 11 | Load Switch TPS2051B (ou AP2210) | Externo | 1 | 🔄 Comprar | AliExpress | R$ 3–6 | Pino EN → GPIO5 + 10kΩ pull-down ao GND obrigatório |

### Componentes passivos

| Nº | Componente | Nó | Qtd | Status | Origem | Preço Est. | Verificação obrigatória |
|:---:|---|---|:---:|---|---|---|---|
| 12 | Resistor 4.7kΩ (pull-up I²C SDA+SCL) | Externo | 2 | 🔄 Comprar | AliExpress | R$ 1 | Únicos pull-ups I²C — remover dos breakouts |
| 13 | Resistor 10kΩ (pull-up reed, CS BME690, pino EN) | Externo | 4 | 🔄 Comprar | AliExpress | R$ 1 | 3× específicos + 1 spare |
| 14 | Resistor 1kΩ (série SDA/SCL SPS30) | Externo | 2 | 🔄 Comprar | AliExpress | R$ 1 | (Opcional) Atenuação de EMF espúria de I/O transients |
| 14A | Resistor 100Ω (ESD pluviômetro) | Externo | 1 | 🔄 Comprar | AliExpress | R$ 1 | Série com GPIO15 — proteção ESD |
| 15 | TVS Diode SMAJ3.3A | Externo | 1 | 🔄 Comprar | AliExpress | R$ 3 | Proteção ESD cabo externo pluviômetro |
| 16 | Capacitor 100µF eletrolítico 10V | Externo | 2 | 🔄 Comprar | AliExpress | R$ 2 | Decoupling saída 3.3V Heltec |
| 17 | Capacitor 100nF cerâmico | Externo | 4 | 🔄 Comprar | AliExpress | R$ 1 | Decoupling HF |

### Alimentação

| Nº | Componente | Nó | Qtd | Status | Origem | Preço Est. | Verificação obrigatória |
|:---:|---|---|:---:|---|---|---|---|
| 18 | Pack 18650s + TP4056 + Boost 5V | Externo | 1 | 🔄 Comprar | Diversas | R$ 50–100 | Substitui powerbanks comuns que sofrem auto-shutoff letal. |
| 19 | Fonte USB 5V 2A (nó base) | Base | 1 | 🔄 Comprar | Loja local | R$ 20–30 | Mínimo 2A para ESP32-P4 + Heltec base |
| 20 | MicroSD 32GB SanDisk Class 10 | Base | 1 | 🔄 Comprar | Loja local | R$ 20–35 | Slot TF embutido ESP32-P4 — SDIO 3.0 |
| 21 | Bateria CR1220 (RTC ESP32-P4) | Base | 1 | 🔄 Comprar | Farmácia/loja | R$ 5 | Pode já vir com a placa — verificar |

### Instalação física

| Nº | Componente | Nó | Qtd | Status | Origem | Preço Est. | Verificação obrigatória |
|:---:|---|---|:---:|---|---|---|---|
| 22 | Caixa IP65 plástica 150×100×70mm | Externo | 1 | 🔄 Comprar | AliExpress | R$ 15–30 | **PLÁSTICA não metálica** — RF transparente |
| 23 | Prensa-cabos PG9 | Externo | 6 | 🔄 Comprar | AliExpress | R$ 10 | 6 passagens mínimo na caixa IP65 |
| 24 | Cabo pigtail U.FL → SMA 15cm | Externo | 1 | ✓ Já tem | — | — | Já tem — antena LoRa externa |
| 25 | Conector SMA fêmea passante | Externo | 1 | 🔄 Comprar | AliExpress | R$ 5–8 | Para antena LoRa na caixa IP65 |
| 26 | Verniz conformal spray acrílico | Externo | 1 | 🔄 Comprar | AliExpress/eletr. | R$ 25–45 | Aplicar nas PCBs antes de fechar a caixa |
| 27 | Sílica gel 5g (pacotes) | Externo | 3 | 🔄 Comprar | AliExpress | R$ 5 | Dentro da caixa IP65 — trocar em dezembro |
| 28 | Adaptador RJ11 → bornes terminal | Externo | 1 | 🔄 Comprar | AliExpress | R$ 5–8 | Para conectar cabo pluviômetro |
| 29 | Cabo I²C blindado ~50cm | Externo | 1 | 🔄 Comprar | AliExpress | R$ 5–10 | BME690+SCD41 no abrigo → caixa IP65 |
| 30 | Isolamento térmico reflexivo (fita alu) | Externo | 1 | 🔄 Comprar | Construção | R$ 5–10 | Face exposta ao sol da caixa IP65 |
| 31 | Protoboard ou PCB perfurada 5×7cm | Externo | 1 | 🔄 Comprar | AliExpress | R$ 5–8 | Para passivos e MOSFET |
| 32 | Kit jumpers M-M e M-F | Ambos | 1 | 🔄 Comprar | AliExpress | R$ 8–12 | Prototipagem e conexões |

### Embutido na placa ESP32-P4

| Nº | Componente | Nó | Status | Referência na placa |
|:---:|---|---|---|---|
| 33 | SD Card slot (SDIO 3.0) | Base | ◎ Embutido | Item 25 da placa Waveshare |
| 34 | RTC + CR1220 holder | Base | ◎ Embutido | Item 11 da placa Waveshare |
| 35 | Microfones onboard (2×) + ES7210 | Base | ◎ Embutido | Item 23 — monitoramento ruído interno |
| 36 | Tela touch IPS 7" 1024×600 | Base | ◎ Embutido | Dashboard principal nó base |
| 37 | WiFi6 ESP32-C6 | Base | ◎ Embutido | Co-processador rádio via SDIO |

### Resumo financeiro estimado

| Categoria | Valor |
|---|---|
| Componentes já comprados (AliExpress) | R$ 540–560 |
| ESP32-P4 Waveshare (Amazon) | ~R$ 350 |
| Itens a comprar (críticos) | R$ 80–170 *(powerbank é o maior custo)* |
| Itens a comprar (passivos + instalação) | R$ 110–180 *(verniz + caixa + prensa-cabos)* |
| **TOTAL ESTIMADO** | **R$ 1.080 – 1.260** *(sem o case 3D impresso)* |

---

## 12. Especificidades — Floriano, PI (Caatinga)

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
| Ventos | Predominante E/NE, 40–60 km/h em eventos | INMET (série local/BDMEP) + validação em campo |
| PM10 seco | 50–80 µg/m³ (vento + poeira Caatinga) | Estimativa operacional (validar com série local) |

> Nota de rastreabilidade: os parâmetros climáticos de projeto devem ser recalibrados com séries históricas da estação local no BDMEP/INMET e com logs da própria estação após comissionamento.

### Ajustes específicos ao projeto

| Parâmetro | Especificação para Floriano | Justificativa |
|---|---|---|
| Cor caixa IP65 | **BRANCA ou CINZA CLARO — obrigatório** | Caixa preta ao sol: 65–75°C interno → degrada Li-Ion, trava ESP32 |
| Powerbank posição | **FORA da caixa IP65, sombreado, ventilado** | Li-Ion opera até 45°C, armazena até 60°C — caixa ao sol ultrapassa |
| SPS30 limpeza seca | **48h** (junho–novembro) | Caatinga seca: PM10 50–80 µg/m³, ventos 40–60 km/h — fan entope 2× mais rápido |
| SPS30 limpeza chuvas | **72h** (dezembro–maio) | Ambiente menos particulado |
| Altitude pressão | QNH = QFE × exp(94 / (29.3 × T_K)) | Publicar QFE (local) E QNH (nível do mar) — compatibilidade INMET/METAR |
| QNH calculado (35°C) | +10.49 hPa acima do QFE | Fórmula hipsométrica — diferença real medida |
| Condensação | Trocar sílica gel em **DEZEMBRO** | Transição seca→chuvosa: T cai de 38°C para 24°C em horas — risco de condensação |
| Pluviômetro limiar | Alerta entupimento: **UR > 70%** (não 90%) | Floriano raramente ultrapassa 80% UR |
| Calibração SCD41 | **Duas calibrações** — verão seco (set) + chuvoso (fev) | T varia 17°C entre estações — offset muda |
| LTR390 gain | **GAIN_1X** entre 10h–14h na seca; **GAIN_3X** fora desse intervalo | Evita saturação no pico e mantém sensibilidade no restante do dia |
| AS3935 NOISE_FLOOR | **Sazonal** — menor na seca, dinâmico na chuvosa | Raios concentrados jan–mai; eletrostática maior na seca |

### Fórmula de pressão barométrica (altitude 94m)

```
Para Floriano, PI (alt=94m, T=35°C = 308.15K):

P_QFE (local)  = 1002.76 hPa
P_QNH (NMM)   = 1013.25 hPa
Diferença      = +10.49 hPa

Código firmware:
  float qnh = qfe * exp(94.0 / (29.3 * (temp_c + 273.15)));
```

### Cálculo de autonomia do powerbank (dados reais)

```
Powerbank 10.000mAh:
  Capacidade útil @5V:       10.000 × 0.70 × 0.85 = 5.950 mAh

Intervalo 5 minutos — consumo médio: 9.2 mA
  Autonomia: 5.950 / 9.2 = 647h ≈ 27 dias

Intervalo 10 minutos — consumo médio: ~4.6 mA
  Autonomia: 5.950 / 4.6 = 1.293h ≈ 54 dias
```

### Cálculo AQI (EPA) para PM2.5 — validação de firmware/dashboard

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

Exemplo 1: PM2.5 = 25 µg/m³
  AQI = ((100-51)/(35.4-9.1))*(25-9.1)+51 = 81  → Moderado

Exemplo 2: PM2.5 = 45 µg/m³
  AQI = ((150-101)/(55.4-35.5))*(45-35.5)+101 = 124  → Grupos sensíveis

Nota regulatória:
  Breakpoints atualizados conforme eCFR Title 40, Part 58, Appendix G
  (atualização de 2024 / 89 FR 16403).
  Em firmware, saturar saída no intervalo 0–500.
```

---

## 13. Componentes Removidos do Projeto

Os itens abaixo foram removidos em revisões anteriores e **não devem ser reintegrados** sem revisão completa da arquitetura:

| Componente | Motivo da remoção |
|---|---|
| **INA260** | Powerbank não permite monitoramento de SOC útil. Monitorar via GPIO1 (VBAT_Read) |
| **NEO-6M GPS** | NTP via LoRa substitui sync de tempo; localização é fixa |
| **ENS160** | Redundante com SCD41 + BME690 |
| **TSL2591** | Redundante com LTR390 para este projeto |
| **MT3608** | Powerbank USB 5V elimina necessidade de boost converter |
| **TP4056** | Powerbank tem BMS integrado |
| **AMS1117-3.3** | Removido do nó externo — Heltec tem regulador interno |
| **18650 cells** | Substituídas por powerbank always-on |

---

## 14. Validação Externa e Rastreabilidade

### Metodologia de validação aplicada

| Etapa | Critério aplicado | Resultado |
|---|---|---|
| 1 | Priorizar fontes oficiais (fabricante, agência reguladora, norma técnica, documentação do framework) | Aplicado |
| 2 | Cruzar cada dado crítico com pelo menos 1 fonte externa confiável | Aplicado |
| 3 | Quando scraping automático falha (captcha/anti-bot), registrar limitação e manter referência primária para validação manual | Aplicado |
| 4 | Atualizar o documento apenas com dados confirmados ou com ressalva explícita | Aplicado |

### Matriz de rastreabilidade (fontes confiáveis)

| Tema técnico | Fonte externa confiável | Evidência verificada | Status |
|---|---|---|---|
| AQI PM2.5 e categorias | AirNow/EPA + eCFR Title 40 Appendix G | Faixas AQI, fórmula por interpolação linear e categorias de risco confirmadas | ✅ Validado |
| WDT ESP32-S3 | ESP-IDF (Watchdogs API) | `esp_task_wdt_init`, `esp_task_wdt_add`, `esp_task_wdt_reset` confirmados em API oficial | ✅ Validado |
| Deep sleep ESP32-S3 | ESP-IDF (Sleep Modes API) | `esp_deep_sleep_start`, wake sources e práticas de power domain confirmadas | ✅ Validado |
| SCD41 | Sensirion (SCD41 product/datasheet) | Faixa 400–5000 ppm, operação single-shot e limites elétricos confirmados | ✅ Validado |
| SPS30 | Sensirion (SPS30 product/datasheet) | Alimentação 4.5–5.5V, PM1/2.5/4/10 e interface I²C/UART confirmados | ✅ Validado |
| BSEC para BME69x | Bosch Sensortec (BSEC software) | Uso da biblioteca BSEC para sinais de alto nível e IAQ confirmado | ✅ Validado |
| Gestão de espectro no Brasil | ANATEL (página oficial de Espectro e portal de legislação) | Governança do espectro e trilha normativa oficial confirmadas | ✅ Validado |
| Faixas exatas de radiação restrita (902–907.5 / 915–928 MHz) | Portal de legislação ANATEL (consulta normativa) | Requer conferência manual no ato vigente devido limitação de scraping automático | ⚠️ Validar manualmente |
| Critério WMO de posicionamento | WMO-No.8 | Fonte de referência mantida; página com bloqueio anti-bot no acesso automático | ⚠️ Validar manualmente |

### Resultado prático da validação externa

| Item | Situação após revisão v6 |
|---|---|
| Dados de sensores críticos (SCD41/SPS30/BME690) | Confirmados com fabricantes |
| Boas práticas de firmware ESP32-S3 | Confirmadas com documentação ESP-IDF |
| Cálculo AQI PM2.5 | Confirmado por referência EPA/AirNow/eCFR |
| Referência regulatória de espectro | Confirmada em fonte oficial ANATEL |
| Itens com limitação de scraping | Mantidos com rastreabilidade e ação manual explícita |

---

## 15. Resumo Executivo de Conformidade

| Domínio | Situação | Observação executiva |
|---|---|---|
| Arquitetura elétrica e pinagem | ✅ Conforme | Sem conflito crítico de pinos após revisão |
| I²C (endereços + velocidade) | ✅ Conforme | Endereços únicos e 100kHz justificado para robustez |
| Sensores e integração | ✅ Conforme | Especificações principais confirmadas com fabricantes |
| LoRa P2P e payload | ✅ Conforme | Parâmetros e payload 34B consistentes |
| Energia e autonomia | ✅ Conforme | Cálculos padronizados com capacidade útil @5V |
| Firmware crítico (WDT/sleep/ACK) | ✅ Conforme | Alinhado à documentação oficial ESP-IDF |
| Normas ambientais e AQI | ✅ Conforme | AQI estruturado com base EPA/AirNow |
| Rastreabilidade documental | ✅ Conforme | Matriz de fontes e status adicionada |

### Pendências controladas (sem bloqueio técnico)

| Pendência | Impacto | Ação recomendada |
|---|---|---|
| Confirmação textual das faixas exatas ANATEL por ato vigente | Baixo | Revisão manual do ato de radiação restrita no portal de legislação |
| Verificação automatizada do WMO-No.8 | Baixo | Conferência manual no documento oficial WMO |

---

## 16. Referências e Normas

| Norma/Documento | Aplicação |
|---|---|
| **ANATEL** | Frequência 915 MHz obrigatória no Brasil (868 MHz ilegal) |
| **ABNT NBR 10151** | Avaliação do ruído em comunidades — filtro dB(A) obrigatório |
| **CONAMA 491/2018** | Padrão PM2.5: 25 µg/m³ (primário 24h), 10 µg/m³ (anual) |
| **WMO-No.8** | Instalação meteorológica: altura pluviômetro 1.2–1.5m e raio livre ≥ 2× altura do obstáculo mais próximo |
| **IEC 60529** | Classificação IP65 para caixas de proteção |
| **IPC-CC-830** | Verniz conformal para proteção de placas eletrônicas |
| **IEC 61672-1** | Especificação de medidores de nível sonoro — ponderação A |
| **EPA AQI** | Cálculo do Índice de Qualidade do Ar para PM2.5 |

### Links oficiais consultados na revisão v6 (18/03/2026)

| Fonte | Link oficial |
|---|---|
| ANATEL — Espectro | https://www.gov.br/anatel/pt-br/regulado/espectro |
| ANATEL — Legislação | https://informacoes.anatel.gov.br/legislacao/ |
| AirNow (EPA) — AQI Basics | https://www.airnow.gov/aqi/aqi-basics/ |
| AirNow (EPA) — Technical Assistance Document | https://www.airnow.gov/publications/air-quality-index/technical-assistance-document-for-reporting-the-daily-aqi/ |
| eCFR — Appendix G to Part 58 (AQI) | https://www.ecfr.gov/current/title-40/chapter-I/subchapter-C/part-58/appendix-Appendix%20G%20to%20Part%2058 |
| Espressif — Watchdogs (ESP32-S3) | https://docs.espressif.com/projects/esp-idf/en/stable/esp32s3/api-reference/system/wdts.html |
| Espressif — Sleep Modes (ESP32-S3) | https://docs.espressif.com/projects/esp-idf/en/stable/esp32s3/api-reference/system/sleep_modes.html |
| Sensirion — SCD41 | https://sensirion.com/products/catalog/SCD41 |
| Sensirion — SPS30 | https://sensirion.com/products/catalog/SPS30 |
| Bosch Sensortec — BSEC software | https://www.bosch-sensortec.com/software-tools/software/bme680-software-bsec/ |
| INMET — Portal oficial | https://portal.inmet.gov.br/ |
| INMET — BDMEP / dados históricos | https://bdmep.inmet.gov.br/ |
| INMET — Pacotes anuais de dados | https://portal.inmet.gov.br/dadoshistoricos |
| IBGE — Bases cartográficas contínuas | https://www.ibge.gov.br/geociencias/cartas-e-mapas/bases-cartograficas-continuas.html |

---

## 17. Checklist de Comissionamento (Bancada e Campo)

### Bancada elétrica (pré-campo)

| Item | Critério de aceite | Método de verificação | Status esperado |
|---|---|---|---|
| I²C em repouso | SDA/SCL em 3.3V, sem pull-up para 5V | Multímetro/osciloscópio nos pinos GPIO41/42 | ✅ Passa |
| Endereços I²C | `0x62`, `0x76`, `0x53`, `0x03`, `0x69` detectados | Scanner I²C após `Wire.begin(41,42)` | ✅ Passa |
| MOSFET low-side SPS30 | `GPIO5=LOW` desliga SPS30; `GPIO5=HIGH` liga SPS30 | Medir corrente no ramo SPS30 + leitura válida PM2.5 | ✅ Passa |
| Sequência I²C segura SPS30 | Sem acesso I²C ao SPS30 durante OFF low-side | Validar: fim de transação → MOSFET OFF → sem transações SPS30 até religar | ✅ Passa |
| Corrente em sleep (nó externo) | Consumo compatível com autonomia calculada | Medidor USB/bench supply após `esp_deep_sleep_start()` | ✅ Passa |
| UART base↔P4 | 115200, sem framing/overflow | Loop de 1000 mensagens com contagem de erros | ✅ Passa |
| LoRa P2P | RX base + ACK em até 5s | Teste de 100 ciclos com `seq` incremental | ✅ Passa |

### Integração funcional (pré-operação)

| Item | Critério de aceite | Método de verificação | Status esperado |
|---|---|---|---|
| Payload 34 bytes | Tamanho fixo e campos íntegros | Dump binário e parse no ESP32-P4 | ✅ Passa |
| Sincronização de tempo | RTC externo atualizado por ACK NTP | Comparar `rtc.getEpoch()` vs NTP após ACK | ✅ Passa |
| Buffer SD base | Sem perda de amostras sem Wi-Fi | Desconectar Wi-Fi por 30 min e validar `queue.jsonl` | ✅ Passa |
| Flush MQTT | Reenvio total ao reconectar | Reconectar rede e conferir fila zerando | ✅ Passa |
| AQI PM2.5 | Resultado dentro da faixa esperada | Teste com amostras de referência (ex.: 25 e 45 µg/m³) | ✅ Passa |

### Comissionamento em campo (Floriano, PI)

| Item | Critério de aceite | Método de verificação | Status esperado |
|---|---|---|---|
| Pluviômetro (WMO) | Altura 1.2–1.5m e raio livre ≥ 2× obstáculo | Trena + inspeção local com fotos | ✅ Passa |
| Abrigo térmico | Sem insolação direta no SCD41/BME690 | Inspeção de montagem e logs térmicos 24h | ✅ Passa |
| SPS30 ventilação | Fluxo de ar livre e sem recirculação quente | Inspeção física + estabilidade PM base | ✅ Passa |
| AS3935 ruído local | Falsos positivos controlados | Ajuste `NOISE_FLOOR` com SPS30 ativo | ✅ Passa |
| Link LoRa real | Entrega contínua no ponto instalado | Teste de 24h com taxa de entrega > 99% | ✅ Passa |

### Registro mínimo de evidências

| Evidência | Conteúdo mínimo |
|---|---|
| Relatório de bancada | Corrente sleep/ativo, scanner I²C, teste LoRa/UART |
| Relatório de campo | Fotos de instalação, medições WMO, teste 24h |
| Snapshot de firmware | Hash/versão do build do nó externo, base Heltec e ESP32-P4 |

---

## 18. Parecer Executivo de Conformidade Regulatória

### Identificação

| Campo | Conteúdo |
|---|---|
| Projeto | Estação Ambiental IoT — Floriano, PI |
| Documento base | Especificação técnica v6 |
| Data do parecer | 18/03/2026 |
| Finalidade | Parecer técnico executivo para governança do projeto e base de emissão em PDF |

### Objetivo do parecer

Consolidar, em formato executivo, o status de conformidade técnica e regulatória do projeto para implementação e comissionamento, com base em documentação oficial, critérios rastreáveis e pendências controladas.

### Escopo avaliado

| Domínio | Status |
|---|---|
| Arquitetura elétrica, pinagem e níveis lógicos | Conforme |
| Barramento I²C (endereçamento, integridade e robustez) | Conforme |
| Protocolo LoRa P2P, payload e ACK | Conforme |
| Alimentação e autonomia operacional | Conforme |
| Firmware crítico (WDT, deep sleep, buffer, sync RTC) | Conforme |
| Critérios ambientais e de instalação (WMO/boas práticas) | Conforme com ressalvas |
| Rastreabilidade de fontes externas | Conforme com ressalvas |

### Base normativa e documental considerada

| Referência | Aplicação no projeto |
|---|---|
| ANATEL (espectro e legislação) | Operação LoRa 915 MHz no Brasil |
| EPA/AirNow + eCFR Appendix G | Cálculo AQI PM2.5 no firmware/dashboard |
| Espressif ESP-IDF (WDT/Sleep) | Requisitos de robustez e ciclo de energia |
| Sensirion (SCD41/SPS30) | Limites elétricos e operação de sensores críticos |
| Bosch BSEC | Processamento VOC/IAQ para BME690 |
| INMET/BDMEP | Referência de séries históricas meteorológicas locais |
| IBGE geociências | Referência geoespacial complementar |

### Parecer técnico consolidado

| Critério de decisão | Resultado |
|---|---|
| Coerência interna do documento (lógica e conexões) | Aprovada |
| Viabilidade de implementação de hardware | Aprovada |
| Viabilidade de implementação de firmware | Aprovada |
| Aderência a referências confiáveis e rastreáveis | Aprovada com pendências manuais documentadas |

### Pendências regulatórias controladas

| Pendência | Risco | Ação mandatória antes de operação contínua |
|---|---|---|
| Conferência textual do ato ANATEL vigente (faixas exatas de radiação restrita) | Baixo | Registrar número do ato e trecho aplicado no dossiê do projeto |
| Conferência manual do WMO-No.8 em versão oficial | Baixo | Anexar evidência documental com print/trecho no relatório de comissionamento |
| Consolidação de série histórica local (INMET/BDMEP) para parâmetros climáticos estimados | Médio | Atualizar parâmetros operacionais após análise de dados locais |

### Condição de aprovação

O projeto está tecnicamente aprovado para fase de implantação piloto e comissionamento, condicionado ao cumprimento integral do checklist da seção 17 e ao fechamento das pendências regulatórias listadas neste parecer.

### Deliberação executiva

| Decisão | Justificativa executiva |
|---|---|
| Aprovado para piloto controlado | Documento consistente, critérios técnicos definidos e riscos residuais controlados |
| Não aprovado para operação definitiva sem validações finais | Dependência de conferências regulatórias manuais e validação de campo de 24h |

---

*Documentação base gerada a partir do arquivo Excel `estacao_ambiental_iot_v5.xlsx` e revisada na versão v6 com validação externa de fontes oficiais.*  
*Floriano, PI — Caatinga — 6°46'S 43°01'W — Altitude 94m*