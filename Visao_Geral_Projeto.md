# Visão Geral do Projeto: Malha Ambiental IoT para Cidades Inteligentes

Este documento descreve a topologia conceitual, a matriz energética, os fluxos de comunicação e as aplicações urbanas da **Estação Ambiental IoT (V9)**. O projeto atua como uma malha de telemetria preditiva, gerando alertas e dados em tempo real que impactam diretamente a saúde, segurança e rotina da infraestrutura municipal.

---

## 1. Arquitetura Descentralizada: Da Borda à Nuvem

O ecossistema foi projetado para operar sobre uma arquitetura de múltiplos níveis, separando o processamento pesado e a infraestrutura de internet (Nuvem/Gateway) da coleta severa em campo (Nó Remoto).

### 1.1. A Borda (Edge): O Nó Remoto Sensorial
Trata-se do pilar *outdoor* do projeto. Espalhado agressivamente pela cidade, telhados, topos de morros e bacias de rios, o **Nó Remoto** é 100% autônomo (não necessita de "tomada" ou internet). Seu cérebro lida com a aquisição simultânea de 10 sensores críticos industriais, filtra ruídos transientes e despacha pacotes via radiofrequência (RF) independentes de qualquer rede de operadoras 4G/5G.

### 1.2. O Gateway: A Estação Base Receptora
A Estação Base (composta por um poderoso microcontrolador móvel **ESP32-P4**, um módulo **LoRa** acoplado, Tela/Display operante e conectividade **Wi-Fi**) é instalada em dezenas de ambientes internos estratégicos (diretorias de escolas, recepção de hospitais, sede da guarda municipal). Ela capta pelo ar os dados da Estrela de Nós e cumpre dois papéis simultâneos:
1.  **Exibição On-Site**: Usa sua própria tela para alarmar a corporação civil ali presente (ex: "Alerta de Fumaça no Quarteirão").
2.  **Ponte de Internet**: Conecta-se à rede cabeada ou Wi-Fi do prédio para despachar essa leitura para a Nuvem de forma criptografada.

---

## 2. A Matriz Energética: 100% *Off-Grid* (Energia Solar)

Para que o projeto escale e possa ser instalado no topo de postes e em áreas de várzea sem furar paredes, a matriz de energia de todo **Nó Remoto** é baseada no sol.

*   **Painel Solar**: Um arranjo fotovoltaico dimensionado captura a irradiância e gera tensão bruta.
*   **Gerenciamento MPPT (Maximum Power Point Tracking)**: O controlador de carga extrai sempre o máximo de watts possíveis do painel em dias parcialmente nublados, protegendo o banco contra picos de descarga e sobrecorrentes.
*   **Armazenamento (Baterias)**: Um robusto pack de Baterias (ex: LiFePO4 / Lítio) é alocado internamente. A autonomia foi projetada para sustentar a leitura do microcontrolador e transmissões de rádio seguidas através de semanas consecutivas sem aberturas prolongadas de sol ("*Dias Sem Sol / No Sun Days - NSD*").
*   **Eficiência (Step-down / Buck)**: Os sensores requerem tensões muito limpas e isoladas. Conversores de altíssima eficiência step-down rebaixam brutalmente os `12V` das baterias/painel sem jogar calor fora, injetando exatos `3.3V` ou `5V` que barramentos digitais delicados (I²C / I2S) exigem. Parte da energia abastece os transceivers RS485 para conversação de longa fiação em ambientes com ruído elétrico pesado.

---

## 3. A Suíte de Sensores: O Setup do Nó Completo

Cada único Nó Remoto funciona como um laboratório completo de clima e ar para a sua microrregião. 

| Sensor | Medição e Indicador Principal | Aplicação Prática Urbana e Governamental |
| :--- | :--- | :--- |
| **SFA30** | Concentração de Formaldeídos (HCHO) e VOCs | Detectar plumas tóxicas vindas de incêndios em polos industriais ou queimadas rurais. Antecipa o risco respiratório direto na rua monitorada. |
| **BME690** | Índice de Qualidade do Ar (IAQ), Pressão e bVOCs | Mede um IAQ sintético preciso. Alertas sobre oscilação barométrica ajudam a prever tempestades cíclicas convectivas antes delas colapsarem na cidade. |
| **AS3935** | Ocorrência e Distância de Raios (até 40km) | **Defesa Vital**. Apita e rastreia distâncias de descargas elétricas na nuvem. Oferece tempo de reação para fechar parques abertos, suspender torneios de futebol e recolher alunos na escola. |
| **LTR390** | Radiação Ultravioleta (Índice UV) e Luz Âmbiente | Estabelece alertas de periculosidade para insolação e queimadura dérmica em dias de verão (acionar "bandeira vermelha UV"). |
| **MISOL Pluviômetro** | Precipitação Acumulada e Velocidade (mm/h) | Se uma margem do Rio Parnaíba desponta 40mm d'água em 20 minutos, o fluxo irá inevitavelmente causar o transbordamento do leito de concreto horas depois na cidade vizinha. |
| **Anemômetro / Biruta** | Vetorização de Vento (Intensidade e Direção) | Em casos de derramamento de gás asfixiante num polo industrial, a direção e velocidade ditam cruamente para quais bairros as sirenes de evacuação devem ser direcionadas primeiro. |
| **Piranômetro** | Irradiância Global (Watts por Metro Quadrado) | Calcula o stress térmico efetivo vivido nas ruas (sensação térmica com sol direto) e serve como fiscal da irradiação capturada pelas fazendas de matriz solar ao redor da cidade. |
| **Solo Capacitivo** | Nível de Saturação Hídrica (Terra) | Morros que marcam `100% de saturação` deixam de absorver chuva e passam a criar correntes pluviais avassaladoras, propiciando deslizamentos e instabilidade fundiária. |

---

## 4. O Coração de RF: O Protocolo LoRa (Long Range)

A comunicação entre a Base Integrada e o Nó Remoto não pode ser limitada por chips simcards e faturas caríssimas de operadoras locais de celular. Por isso a tecnologia base é **LoRa em 915 MHz**.

*   **Alcance Monstruoso**: Com linha de visada em topos de telhados, a onda de rádio de 915 MHz cruza bairros e quarteirões repletos de lajes, operando perfeitamente a raios entre `2 a 8 Km` dependendo da visada, cobrindo a cidade de ponta a ponta sem pedir permissão a operadoras clássicas.
*   **Baixo Consumo**: O pacote foi refinado milimetricamente para se alocar em incríveis **52 Bytes**. O Nó Remoto gasta apenas pouquíssimos miliwatts para despachar essa cápsula, permitindo anos úteis à bateria do sistema.
*   **Arquitetura Star (Raio/Topologia em Estrela)**: Gateways Base instalados em prefeituras/hospitais operam passivamente de ouvidos abertos, "pegando" múltiplos pacotes de Nós espalhados pela cidade simulataneamente.

---

## 5. Comunicação de Nuvem (O Cérebro da Cidade Inteligente)

Quando o Gateway recebe o minúsculo bloco (Payload) via Rádio (LoRa), ele já está nas dependências de uma rede de fibra ótica (ex. Recepção da prefeitura/Wi-Fi da rede central). O pipeline passa pela internet a partir daquele momento:

### 5.1. Desempacotamento e Encaminhamento Espacial (MQTT / HTTP REST)
A Estação Base desembrulha os `52 Bytes` comprimidos do rádio e os estrutura num padrão amigável JSON compreensível para APIs, usando corretores leves e instantâneos para "Nuvem Privada ou Pública" através de túneis (Ex: Protocolo MQTT com assinaturas seguras e QoS de confirmação de entrega).

### 5.2. Banco de Dados Analítico em Séries Temporais (Timeseries)
Cada variável, carimbada com de qual Nó pertence (MAC Address / Nome do Bairro), entra rotativamente para dentro do Banco de Dados Cloud escalável. 
Os motores lidam pesadamente com **registros temporais (Timeseries DB)** para cruzar o exato segundo em que choveu no "Sul" e emitiu o primeiro raio no "Norte".

### 5.3. Visualização e Regras do Dashboard Governamental
O ciclo se fecha em um Dashboard da plataforma central da Defesa Civil / Meio Ambiente da prefeitura. Os dados parados tornam-se alertas em painéis:
1.  **Mapas de Calor Pluviais Livres**: Interpola os nós e avisa quais esquinas da metrópole estão ilhadas sob a enxurrada.
2.  **Alarmes Autônomos em APIs e Sirenes**: Se a "Previsão + Leitura Instantânea de Raio + Acúmulo no Solo" passar de determinado limiar (Exemplo de Threshold ou Webhook), o Dashboard prefeitura avisa o servidor que aciona APIs do Whatsapp das comunidades de ribeirinhos ou aciona as Sirenes Visuais no estádio municipal em alerta para temporal perigoso.

---

## 6. O Aplicativo Cidadão: Mapa e Dashboard Interativo

Para garantir que os dados beneficiem não apenas a governança, mas a população direta, o projeto possui um **Aplicativo Mobile Dedicado** que leva a telemetria à palma da mão.

*   **Mapa Interativo Local**: Uma interface cartográfica (estilo Google Maps) exibindo os *pins* de todas as Bases e Sensores instalados pela cidade. Visualmente, manchas de cores indicam a dinâmica do clima (ex: uma nuvem virtual avançando na aba de Chuva).
*   **Aba Exclusiva de Sensores**: Uma dashboard pública padrão onde o morador comum pode consultar o histórico e o dado bruto ao vivo de toda a cidade: "Qual é a Umidade Crítica no Centro neste exato minuto? O ar já ficou suportável na Avenida principal?".
*   **Camadas de Filtro Preditivo**: Menus de fácil acesso no app para as principais frentes de impacto civil: Alerta de Raios, Índice de Incidência UV, Poeira/Fumaça (VOCs), Risco de Alagamento e Escassez de Umidade. Assim, o app substitui a previsão do tempo genérica do celular por *dados táticos reais de quarteirões*.

---

## 7. A Revolução do Crowdsourcing: O "Sensor Residencial"

O projeto pode crescer infinitamente rápido através da colaboração popular, e para isso surge a ideia estratégica da **Estação Lite Residencial**.

*   **A Ideia de Negócio**: Você oferece uma versão "Lite" (comercial, menor e mais acessível) do sistema para que os próprios moradores a comprem. Essa caixinha compacta é projetada esteticamente para varandas externas e quintais.
*   **O Hardware Residencial (Versão Lite)**: Sem precisar do sistema autônomo solar industrial e sem todos os pluviômetros, essa versão operaria apenas no essencial: Um sensor de Qualidade do Ar / Temperatura / Umidade (BME690) e de Intensidade UV (LTR390). O morador liga o dispositivo numa tomada externa e no *Wi-Fi de sua própria casa*.
*   **A Ideia do Ganho-Duplo (Win-Win)**:
    1.  **O Quintal Inteligente**: O morador que instala a versão lite ganha o benefício dentro do app de ter o clima do "Seu Próprio Quintal". O aplicativo avisa ao morador exclusivamente: *"A fumaça tóxica acabou de chegar na sua rua, feche as janelas"* ou *"Sua estufa bateu UV perigoso"*.
    2.  **Contribuição para a Malha da Cidade**: Por trás das cortinas (sob concordância), essa miniestação residencial cede anonimamente os dados locais para a nuvem global. 
*   **O Impacto (Crowdsensing Neural)**: Onde a prefeitura poderia instalar as "15 Estações Base Industriais", a população injeta centenas de Estações Residenciais de forma orgânica. A malha meteorológica de Floriano se tornaria imensa e hiperfocal (casa a casa, quarteirão a quarteirão), sem investimento massivo de infraestrutura pública, criando uma rede de *Smart City* movida pelos próprios cidadãos.

Isso é, em essência, o ápice da estratégia IoT: Mutações visuais na cidade inteira guiadas pelo pulso cardíaco contínuo de hardwares governamentais *somados à comunidade civil* engajada (Crowdsensing) alimentando um aplicativo que antecipa o clima.
