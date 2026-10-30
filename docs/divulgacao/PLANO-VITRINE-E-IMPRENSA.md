# Plano de Vitrine, Imprensa e Distribuição Comunitária — Onde Pego (Cuiabá/MT)

> **Documento Estratégico de Comunicação, Engenharia e Impacto Social**  
> **Foco territorial:** Cuiabá e Baixada Cuiabana (Mato Grosso)  
> **Classificação:** Estratégia de Lançamento, Relações Públicas e Posicionamento Institucional  

---

## Sumário Executivo

O **Onde Pego** é uma aplicação web progressiva (PWA) pública, gratuita, sem fins lucrativos e sem anúncios, criada para responder à pergunta mais frequente de quem precisa de medicamento em Cuiabá: **"Onde eu consigo pegar o meu remédio de graça ou pelo menor custo?"**.

O aplicativo resolve essa dor ao cruzar, lado a lado e instantaneamente no navegador do usuário:
1. **Via 1 (SUS Cuiabá / REMUME):** Indica se o princípio ativo e a dosagem constam na lista oficial da rede pública municipal (unidades básicas, policlínicas e farmácias municipais).
2. **Via 2 (Farmácia Popular):** Indica se o medicamento é oferecido gratuitamente pelo Ministério da Saúde em drogarias privadas credenciadas da capital, mostrando as farmácias credenciadas mais próximas, telefones e rotas.

Tudo isso funciona com **privacidade radical (LGPD por design)** — sem login, sem rastreadores, sem salvar dados pessoais em servidores remotos — e com **acessibilidade exemplar para idosos e baixa visão** (WCAG 2.2 AA).

Este documento traça o plano de 4 pontas para transformar o **Onde Pego** em uma referência de engenharia de impacto em Cuiabá, no ecossistema mato-grossense (**Vale do Pacu**) e no cenário nacional de tecnologia cívica.

---

## 1. Vitrine Técnica de Portfólio (LinkedIn, GitHub e Comunidade Tech)

### 1.1 O Case de Engenharia de Software Sênior

No ecossistema de desenvolvimento, projetos cívicos costumam pecar por serem ou protótipos frágeis ou clones lentos de frameworks inchados. O **Onde Pego** foi construído sob padrões rigorosos de engenharia de produto, demonstrando competência sênior em:

* **Arquitetura Estática Extrema (`output: 'export'`):** O app compila 100% como HTML/JS/CSS estático, podendo ser hospedado em qualquer CDN global sem custos de infraestrutura e com zero superfície de ataque para servidores backend.
* **Orçamento de Performance Rigoroso:** Menos de 150 KB de JavaScript inicial na rota principal (Gzip), com LCP inferior a 2,5 segundos mesmo sob simulação de 4G lento (perfil real da periferia de Cuiabá).
* **Privacidade Radical por Design (LGPD):** O termo digitado na busca nunca vai para a URL (`?q=` proibido), nenhuma requisição de busca sai do aparelho, e a geolocalização só é solicitada mediante consentimento explícito, dispondo sempre de alternativa por seleção manual de bairro.
* **Acessibilidade Inegociável (WCAG 2.2 AA):** Tipografia base $\ge$ 18px (apoio $\ge$ 16px), contraste elevado ($\ge$ 4.5:1 / 7:1), alvos de toque mínimos de 48×48px, suporte nativo a leitores de tela (`aria-live`, `aria-pressed`, semântica estrita), modos Alto Contraste e Fonte Ampliada (24px) que preservam o layout sem overflow horizontal.
* **Mapeamento Offline com PMTiles:** Substituição de servidores de tiles comerciais por recorte local em formato `.pmtiles` servido via Service Worker com suporte offline total.
* **Tipagem Estrita e Contratos Zod:** Schema-first com Zod como fonte única de verdade para entidades médicas e estabelecimentos, validado via suite de testes automatizados com Vitest (> 120 testes).

---

### 1.2 Post 1 para LinkedIn — Foco: Impacto Social, Cidadania e Utilidade Pública

**Público-alvo:** Líderes de impacto social, gestores públicos, imprensa, comunidade mato-grossense e rede de conexões.

```markdown
Quem já precisou de remédio em Cuiabá sabe o que é pegar dois ônibus debaixo de 40 graus, chegar na farmácia de uma unidade básica ou drogaria e ouvir: "Aqui não tem esse remédio".

No Brasil, milhões de pessoas têm direito a medicamentos gratuitos tanto pelo SUS quanto pelo programa Farmácia Popular em drogarias de bairro. Mas a informação está espalhada em PDFs de 80 páginas, portais lentos ou balcões com filas intermináveis.

Para mudar essa realidade na minha cidade, desenvolvi o Onde Pego (ondepego.com.br — versão Cuiabá).

É uma ferramenta pública, 100% gratuita, sem anúncios e totalmente independente:
👉 Você digita o nome do remédio ou princípio ativo (ex: Losartana, Metformina, Omeprazol).
👉 Na mesma tela, vê se ele é padronizado no SUS municipal (REMUME Cuiabá) ou se tem direito a retirar de graça pelo Farmácia Popular na drogaria mais perto de casa.
👉 Mostra o endereço oficial das drogarias credenciadas, mapa, telefone e a lista de documentos necessários para não perder a viagem.

Feito pensando nos nossos idosos e em quem usa celular simples: letras grandes, botões fáceis de tocar, navegação rápida mesmo em 4G fraco e respeito absoluto à privacidade (nenhum dado seu é coletado).

A tecnologia precisa servir a quem mais precisa. Se você conhece alguém em Cuiabá que toma remédio de uso contínuo ou ajuda um familiar idoso, compartilhe!

Link nos comentários 👇
#Cuiaba #MatoGrosso #SaudePublica #SUS #FarmaciaPopular #ImpactoSocial #InovacaoCivica #Tecnologia
```

---

### 1.3 Post 2 para LinkedIn — Foco: Arquitetura de Software e Engenharia de Produto

**Público-alvo:** Engenheiros de software, CTOs, arquitetos de soluções, tech leads e recrutadores internacionais.

```markdown
Como construir um aplicativo de saúde para usuários reais da periferia de Cuiabá, onde o 4G oscila e muitos usam celulares com Android antigo e telas trincadas?

Essa foi a restrição fundacional do Onde Pego. Não adiantava colocar um backend pesado, analytics vorazes ou bibliotecas visuais infladas. Cada kilobyte e cada milissegundo de CPU precisavam ser justificados.

Principais decisões arquiteturais do projeto:

1. Static-First & Zero Backend (Next.js App Router com output: 'export'):
O app inteiro é compilado para artefatos estáticos. A busca roda 100% no cliente usando Fuse.js com normalização fonética para PT-BR. Zero custo de servidor, zero latência de API e imunidade a indisponibilidade de backend.

2. LGPD Radical por Design:
Não coletamos nada. O termo de busca vive apenas na memória de sessão do cliente — proibimos expressamente colocar `?q=` na URL para que o histórico de navegação não exponha quais medicamentos o cidadão procura. Fontes são 100% autohospedadas (@fontsource); zero conexões a CDNs de terceiros.

3. Orçamento de Performance de Ferro:
Bundle JavaScript inicial < 150 KB (Gzip). LCP < 2,5s em 4G lento. O mapa vetorial (MapLibre + arquivo PMTiles recortado da Baixada Cuiabana) é carregado estritamente sob demanda via Service Worker offline.

4. Acessibilidade WCAG 2.2 AA (com mira no AAA):
Alvos de toque rigorosamente $\ge$ 48px. Texto base $\ge$ 18px. Modos nativos de "Fonte Extra Grande (24px)" e "Alto Contraste" sincronizados com LocalStorage com tratamento defensivo contra SecurityError (Safari private mode/iframes).

5. Single Source of Truth com Zod:
100% dos tipos TypeScript são inferidos via `z.infer<typeof Schema>`. Nenhum dado entra em produção sem passar pelo pipeline de validação automatizada e 123 testes unitários e de integração com Vitest.

Código limpo não é vaidade: para quem está com dor ou precisa do remédio do filho, software rápido e acessível é questão de dignidade.

O repositório e a documentação de arquitetura (ADRs) estão disponíveis. Feedbacks de outros engenheiros são muito bem-vindos! 🚀

#EngenhariaDeSoftware #NextJS #TypeScript #WebPerf #Acessibilidade #WebDevelopment #FrontendArchitecture
```

---

## 2. Kit de Imprensa Local (Cuiabá e Mato Grosso)

### 2.1 Mapeamento de Veículos de Comunicação da Baixada Cuiabana

| Veículo | Canal / Formato | Perfil Editorial & Foco de Pauta | Contato / Redação |
|---|---|---|---|
| **TV Centro América (Rede Globo)** | TV aberta (canal 4.1) & G1 MT | Grande alcance estadual. Pautas de utilidade pública no Bom Dia MT e MT1; foco em filas de postos e economia doméstica. | WhatsApp da Redação: (65) 99982-1234 / pauta@tvca.com.br / g1mt@redeglobo.com.br |
| **Folhamax** | Portal de notícias web | Maior audiência de notícias online de MT; foco em fatos cotidianos, denúncias e ferramentas de utilidade para o cidadão da capital. | redacao@folhamax.com.br / (65) 99238-0000 |
| **Olhar Direto (Olhar Cidade)** | Portal de notícias web | Editoria 'Olhar Cidade' com forte cobertura urbana, novos aplicativos, histórias locais e empreendedorismo social. | redacao@olhardireto.com.br / (65) 3624-0010 |
| **MidiaNews** | Portal de notícias web | Leitura do público formador de opinião, profissionais liberais e servidores públicos; foco em gestão de saúde e tecnologia. | redacao@midianews.com.br / (65) 3052-7000 |
| **Gazeta Digital (Grupo Gazeta)** | Portal web, Rádio Vila Real, Jornal A Gazeta | Tradição em cobertura comunitária e de bairros; rádio comunitária matinal de forte apelo popular nos bairros de Cuiabá. | pauta@gazetadigital.com.br / (65) 3612-6000 |
| **CBN Cuiabá (95.9 FM)** | Rádio jornalismo | Entrevistas com especialistas, tecnologia, saúde preventiva e mobilidade urbana na Grande Cuiabá. | jornalismo@cbmcuiaba.com.br / (65) 3614-9590 |

---

### 2.2 Pauta Jornalística (Press Release Pronto para Envio)

**ASSUNTO:** SUGESTÃO DE PAUTA: Aplicativo gratuito e independente ajuda morador de Cuiabá a encontrar remédios de graça no SUS e Farmácia Popular sem sair de casa

**DATA DE LANÇAMENTO:** [Data da Semana]  
**CONTATO PARA ENTREVISTAS:** [Nome do Responsável / Telefone com WhatsApp / E-mail]  
**ENDEREÇO DO APP:** https://ondepego.cuiaba.br (ou URL oficial de publicação)  

---

#### TÍTULO:
**Plataforma cuiabana gratuita indica onde pegar remédios no SUS e Farmácia Popular sem pegar fila à toa**

#### SUBTÍTULO:
*Criado de forma independente para a realidade de Cuiabá, o "Onde Pego" compara a lista de medicamentos da Prefeitura e do Governo Federal, mostra farmácias credenciadas por bairro e funciona até em celulares antigos sem gastar internet.*

#### TEXTO DO RELEASE:

**CUIABÁ (MT)** — Saber se um medicamento receitado pelo médico pode ser retirado de graça pelo Sistema Único de Saúde (SUS) ou em uma farmácia credenciada perto de casa agora está a poucos toques na tela do celular. Entrou no ar nesta semana o **Onde Pego**, uma plataforma digital gratuita e independente projetada sob medida para os moradores de Cuiabá e Várzea Grande.

O problema que motivou a criação do projeto é bem conhecido por quem frequenta a rede pública na Baixada Cuiabana: a peregrinação de unidade em unidade. Com temperaturas que frequentemente superam os 40°C e distâncias continentais entre bairros como o CPA, Coxipó, Tijucal e Pedra 90, um idoso ou mãe de família pode perder horas em ônibus e filas apenas para descobrir que o medicamento prescrito não é fornecido naquela unidade ou pertence a outro programa.

**Como funciona**  
O usuário acessa o site diretamente pelo navegador do celular (sem precisar baixar aplicativos pesados ou criar senhas) e digita o nome do remédio ou do princípio ativo (como Losartana, Metformina, Omeprazol ou Dipirona). 

Instantaneamente, a ferramenta exibe uma análise clara em duas vias:
1. **Via SUS Municipal (REMUME Cuiabá):** Esclarece se aquele remédio faz parte da lista padronizada pela Secretaria Municipal de Saúde de Cuiabá.
2. **Via Farmácia Popular (Ministério da Saúde):** Informa se o remédio é 100% gratuito pelo programa federal e lista as farmácias e drogarias privadas credenciadas mais próximas, com endereço, telefone para ligar antes de sair de casa e botão de traçar rota no mapa.

Além disso, o aplicativo detalha exatamente a lista de documentos necessários para a retirada (documento oficial com foto, CPF e a receita médica no prazo de validade), evitando que o cidadão seja pego de surpresa no balcão.

**Pensado para idosos e celulares simples**  
Diferente de aplicativos comerciais abarrotados de propagandas ou menus complexos, o **Onde Pego** foi desenhado com base em normas internacionais de acessibilidade (WCAG 2.2 AA). As letras são grandes, os contrastes visuais são reforçados para pessoas com baixa visão e existe um modo especial com botões ampliados.

A plataforma também não consome o pacote de dados do usuário após a primeira visita, pois foi construída para funcionar até mesmo quando a pessoa estiver offline ou com conexão 4G instável na rua.

**Privacidade e Independência**  
O projeto não tem vínculos partidários nem filiação com a Prefeitura de Cuiabá ou o Ministério da Saúde. Os dados sobre os medicamentos têm como fonte a Relação Municipal de Medicamentos (REMUME Cuiabá 2024/2025) e a listagem oficial de farmácias credenciadas do Painel InfoMS do Governo Federal.

"Nosso compromisso é com a transparência e com a saúde do cidadão. O aplicativo não coleta nenhuma informação pessoal, não pede telefone, CPF nem localização sem permissão. Queremos apenas que a dona de casa ou o aposentado não precisem atravessar a cidade debaixo de sol quente para conseguir o tratamento a que têm direito", explicam os desenvolvedores.

**Como acessar**  
O **Onde Pego** já está disponível gratuitamente para qualquer cidadão pelo endereço: **[INSERIR LINK OFICIAL]**.

---

### 2.3 FAQ Preparado: Respostas Blindadas para Perguntas Difíceis

**1. "O Onde Pego é um aplicativo da Prefeitura de Cuiabá ou do Ministério da Saúde?"**  
*Resposta:* "Não. O Onde Pego é uma iniciativa cívica e independente de tecnologia, mantida por profissionais locais. Ele utiliza exclusivamente bases de dados abertas e públicas, como a Relação Municipal de Medicamentos de Cuiabá (REMUME) e o cadastro oficial de estabelecimentos credenciados ao Farmácia Popular (InfoMS/Ministério da Saúde). Não recebemos recursos públicos e temos total independência editorial."

**2. "Se o aplicativo diz que o remédio é do SUS, isso garante que eu vou chegar no postinho e ele vai estar no estoque?"**  
*Resposta:* "É fundamental esclarecer: padronizado na lista NÃO significa garantia de estoque em tempo real. O aplicativo avisa de forma destacada ao usuário que o item consta na lista oficial que o município tem obrigação de fornecer, mas o estoque físico oscila diariamente por entregas de fornecedores e demanda. Por isso, o app orienta o cidadão a verificar na unidade básica do seu bairro e indica sempre o telefone das unidades e farmácias para que a pessoa possa ligar antes de se deslocar."

**3. "Como o projeto se sustenta financeiramente? Vocês vendem dados dos usuários ou cobram das farmácias para aparecer no mapa?"**  
*Resposta:* "Zero fins lucrativos. Não vendemos anúncios, não cobramos taxa de farmácias para aparecer no topo e não comercializamos nenhum dado. Inclusive, por arquitetura técnica, nossos servidores não sabem quem é o usuário nem o que ele pesquisou — o processamento acontece dentro do próprio aparelho da pessoa. Os custos de manutenção de domínio e hospedagem estática são irrisórios e absorvidos como contribuição voluntária para a cidade."

**4. "E se a pessoa tomar o remédio errado por causa da busca?"**  
*Resposta:* "O Onde Pego tem regras inegociáveis de segurança em saúde: nunca sugerimos troca ou substituição de medicamentos, não fazemos diagnóstico e não recomendamos doses. Se a pessoa digita um nome aproximado, a tela alerta em amarelo que se trata de resultado aproximado e exige que a pessoa confira o princípio ativo e a dosagem impressa na sua receita médica. A orientação final sempre cabe ao médico prescritor e ao farmacêutico no balcão."

---

## 3. Estratégia de Distribuição Comunitária em Cuiabá

Para alcançar as camadas populares que mais dependem do SUS e do Farmácia Popular na capital, a comunicação direta via WhatsApp e cartazes físicos em pontos estratégicos tem conversão infinitamente superior a anúncios em redes sociais.

### 3.1 Mensagens de WhatsApp para Repasse Comunitário e Familiar

#### Texto Geral (Família e Grupos de Amigos):
```text
Gente, dica de ouro pra quem mora aqui em Cuiabá e Várzea Grande! 💊

Descobri um site gratuito que mostra se o remédio que o médico passou tem de graça no SUS (postinho de Cuiabá) ou se você consegue pegar DE GRAÇA pelo Farmácia Popular na drogaria perto da sua casa:

👉 [LINK DO APP]

Você só digita o nome do remédio e ele já fala onde tem, o que precisa levar de documento e até o telefone da farmácia pra você ligar antes de sair de casa debaixo desse sol quente.

É de graça, não precisa baixar nada da Play Store nem fazer cadastro. Repassem nos grupos de família, ajuda muito quem toma remédio contínuo e os nossos idosos! 🙏
```

#### Texto Regionalizado 1 — Região do CPA (CPA I, II, III, IV, Morada do Ouro, Três Barras):
```text
Atenção pessoal do CPA e Morada da Serra! 📢

Quantas vezes a gente vai na Policlínica do CPA ou na farmácia do postinho e dá viagem perdida porque o remédio não é dali?

Fizeram um site gratuito excelente pra nossa região: o Onde Pego.
Você coloca o nome do remédio e ele mostra se o remédio é da lista do SUS de Cuiabá ou se tem de graça pelo Farmácia Popular nas drogarias aqui do CPA (mostra as drogarias credenciadas mais perto da sua rua com telefone e rota).

👉 Acesse aqui: [LINK DO APP]

Ajuda muito a economizar tempo e sol quente. Compartilhem no grupo do bairro!
```

#### Texto Regionalizado 2 — Região do Coxipó e Tijucal (Tijucal, Osmar Cabral, Pascoal Ramos, Parque Cuiabá):
```text
Moradores do Coxipó, Tijucal e redondezas! 🏥

Para não ficar rodando de posto em posto de saúde procurando remédio, usem essa ferramenta gratuita:

👉 [LINK DO APP]

Ela consulta na hora a lista oficial da saúde de Cuiabá e as farmácias credenciadas no Farmácia Popular aqui do Coxipó e Tijucal. Mostra quais documentos tem que levar certinho pra não dar viagem perdida.

É 100% grátis e feito para quem mora na nossa capital. Repasse pro grupo da igreja, do bairro e da família!
```

#### Texto Regionalizado 3 — Região do Pedra 90:
```text
Pessoal do Pedra 90! 💊

Dica de utilidade pública: antes de pegar ônibus pra ir atrás de remédio na policlínica ou no centro, consulte esse site:

👉 [LINK DO APP]

Ele mostra se o remédio é fornecido pelo SUS ou se sai de graça pelo Farmácia Popular nas farmácias credenciadas mais perto da sua casa aqui na região do Pedra 90. Funciona direto no celular e não gasta sua internet depois que abre.
```

---

### 3.2 Cartaz A4 com QR Code (Pronto para Impressão e Murais)

Este layout pode ser diagramado em folha A4 vertical (em Word, Canva ou HTML estático) e colado em murais de UBS, salas de espera de policlínicas, centros comunitários, paróquias e comércios locais.

```text
+-----------------------------------------------------------------------+
|                                                                       |
|   ONDE PEGO                                                           |
|   Consulta pública gratuita de medicamentos em Cuiabá                 |
|                                                                       |
|   =================================================================   |
|                                                                       |
|   PRECISA DE REMÉDIO EM CUIABÁ?                                       |
|   NÃO PERCA A VIAGEM NO SOL QUENTE!                                   |
|                                                                       |
|   Descubra no seu celular em menos de 1 minuto:                       |
|                                                                       |
|   [✓] Se o remédio é fornecido de graça pelo SUS Cuiabá               |
|   [✓] Se sai DE GRAÇA pelo Programa Farmácia Popular                  |
|   [✓] As drogarias credenciadas mais perto da sua casa                |
|   [✓] Telefones para ligar antes e quais documentos levar             |
|                                                                       |
|   -----------------------------------------------------------------   |
|                                                                       |
|               +-------------------------------+                       |
|               |                               |                       |
|               |       [ APONTE A CÂMERA ]     |                       |
|               |       [   DO CELULAR    ]     |                       |
|               |       [   PARA O QR     ]     |                       |
|               |       [      CODE       ]     |                       |
|               |                               |                       |
|               +-------------------------------+                       |
|                                                                       |
|                  Ou acesse direto no navegador:                       |
|                       ONDEPEGO.CUIABA.BR                              |
|                                                                       |
|   -----------------------------------------------------------------   |
|                                                                       |
|   • 100% Gratuito e Sem Anúncios                                      |
|   • Não precisa instalar nada na loja de aplicativos                  |
|   • Letras grandes e fácil de usar para idosos                        |
|   • Nenhum dado pessoal é coletado (privacidade total)                |
|                                                                       |
|   *Projeto cívico independente. Dados oficiais: REMUME Cuiabá e MS.   |
+-----------------------------------------------------------------------+
```

---

## 4. Conexão Institucional com o Ecossistema de Mato Grosso

Para consolidar o projeto a médio e longo prazo, o **Onde Pego** deve ser apresentado às principais lideranças e instituições que formam o ecossistema de inovação, saúde e tecnologia da Baixada Cuiabana:

### 4.1 Ecossistema de Inovação "Vale do Pacu" & Sebrae MT
* **Oportunidade:** O ecossistema *Vale do Pacu* reúne as iniciativas mais inovadoras da Baixada Cuiabana nos eixos de Cidades Inteligentes, GovTech e Saúde. O Sebrae MT lidera os programas de pré-aceleração e tração (*Start&UP* e *Startup Day Cuiabá*).
* **Ação Recomendada:**
  1. Inscrever o case no próximo ciclo do programa **Start&UP do Sebrae MT** na vertical de Impacto Social / GovTech.
  2. Apresentar o aplicativo nos encontros mensais do **Pulso do Vale** e em eventos no Centro de Eventos do Pantanal (Sebrae Hacking), demonstrando a aplicação prática de dados abertos para a cidadania.

### 4.2 SENAI Hub de Inovação MT & Impact Hub Cuiabá
* **Oportunidade:** O SENAI MT e o Impact Hub Cuiabá são referências físicas de networking para negócios de impacto socioambiental e tecnologia aplicada.
* **Ação Recomendada:**
  1. Submeter o projeto a bancas de avaliação de impacto social para obter mentorias e conexões com fundos de investimento cívico e ESG de Mato Grosso.
  2. Utilizar os espaços comunitários para testes de usabilidade com turmas da terceira idade e alunos de cursos profissionalizantes.

### 4.3 Universidade Federal de Mato Grosso (UFMT)
A academia oferece validação científica e sustentabilidade técnica essencial:
* **Instituto de Computação (IC-UFMT):** Articulação com professores e grupos de extensão para transformar a arquitetura de PWA offline-first e acessibilidade em artigo científico ou tema de pesquisa em Sistemas de Informação.
* **Instituto de Saúde Coletiva (ISC-UFMT) e Faculdade de Farmácia:** Apresentação da ferramenta como instrumento de combate ao abandono de tratamento médico crônico por falta de acesso à informação. Os alunos de farmácia e saúde coletiva podem atuar como validadores das informações de REMUME e assistência farmacêutica.

### 4.4 Conselho Regional de Farmácia de Mato Grosso (CRF-MT)
* **Importância:** O CRF-MT zela pela atuação ética das farmácias e farmacêuticos em Cuiabá e no interior.
* **Ação Recomendada:**
  1. Enviar ofício de apresentação institucional ao presidente e à comissão de comunicação do CRF-MT.
  2. Destacar que o aplicativo **valoriza o papel do farmacêutico**, recomendando expressamente que o cidadão leve sua receita ao profissional para tirar dúvidas e nunca faça automedicação.
  3. Propor uma nota técnica conjunta ou publicação no portal do CRF-MT orientando os farmacêuticos da capital a recomendar a ferramenta aos pacientes.

### 4.5 Secretaria Municipal de Saúde de Cuiabá (SMS Cuiabá)
* **Objetivo de Longo Prazo:** Parceria de Transparência Ativa e Dados Abertos.
* **Abordagem Estratégica:**
  1. O **Onde Pego** deve ser apresentado à SMS Cuiabá não como uma cobrança, mas como um **aliado da gestão pública**.
  2. O aplicativo desafoga as linhas telefônicas e os balcões de atendimento, organizando o fluxo de pacientes que procuram itens que sequer pertencem à atenção básica municipal.
  3. No futuro, abrir canal de diálogo para que a prefeitura forneça um endpoint público (API JSON ou exportação periódica) do estoque real de medicamentos, permitindo que a capital mato-grossense tenha o sistema de transparência em saúde mais moderno do Centro-Oeste brasileiro.

---

## 5. Cronograma Tático de Execução

| Semana | Foco de Ação | Entregáveis Principais |
|---|---|---|
| **Semana 1** | Lançamento Técnico e Repositório | • Publicação dos 2 artigos no LinkedIn (Social e Arquitetura).<br>• README do GitHub alinhado com o case de engenharia.<br>• Verificação final de acessibilidade e performance em produção. |
| **Semana 2** | Distribuição Comunitária nos Bairros | • Disparo dos textos regionalizados de WhatsApp para lideranças e grupos comunitários do CPA, Coxipó, Tijucal e Pedra 90.<br>• Impressão e fixação dos primeiros 50 cartazes A4 com QR Code. |
| **Semana 3** | Relações Públicas e Imprensa | • Envio da pauta jornalística para redações de TV Centro América, Folhamax, Olhar Direto, MidiaNews e Gazeta Digital.<br>• Acompanhamento de retorno das assessorias e agendamento de entrevistas. |
| **Semana 4** | Articulação Institucional | • Contato oficial com CRF-MT, Sebrae MT (Start&UP) e coordenações da UFMT.<br>• Análise das métricas de acesso (páginas mais consultadas e bairros de maior interesse, sem coletar dados individuais). |

---

*Documento mantido pela equipe de engenharia e produto do Onde Pego Cuiabá.*
