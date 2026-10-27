# Onde Pego — Documento de Arquitetura de Software (DAS)

**Versão:** 1.2 (MVP estático, local-first)
**Nome do produto:** Onde Pego (antes: BuscaRemédio Cuiabá; nomes de trabalho anteriores: RemédioAqui, MedPonto, PontoSaúde)
**Escopo geográfico:** Cuiabá/MT (recorte de mapa inclui Várzea Grande)
**Autor:** Marco Corrêa
**Status:** pronto para a Fase 0 (design e configuração do agente)

> O nome "Onde Pego" é uma proposta. Antes de registrar domínio ou divulgar, conferir disponibilidade no Registro.br e busca de anterioridade no INPI (ver seção 16).

---

## 0. Mudanças em relação à v1.0

| # | Mudança | Motivo |
|---|---|---|
| 1 | Novo nome: **Onde Pego** | "Bula" e derivados são marcas ocupadas e sugerem conteúdo de bula; o nome novo é a pergunta que a pessoa faz |
| 2 | Mapa: **MapLibre + PMTiles próprio** (recorte Cuiabá/VG), no lugar de Leaflet + tiles do OSM | A política do OSM permite bloquear uso pesado sem aviso e proíbe uso offline em `tile.openstreetmap.org`; o PWA offline conflita com isso (ADR-06) |
| 3 | **Busca primeiro**; mapa integrado ao resultado em tela dividida; atalho "perto de mim" na tela inicial | A pessoa chega com uma pergunta sobre um remédio, não sobre um lugar; evita pedir GPS na abertura (ADR-07) |
| 4 | O pino do mapa significa **"farmácia credenciada para retirar"**, nunca "tem em estoque" | Não existe dado de estoque por farmácia; o Ministério orienta confirmar a disponibilidade no balcão |
| 5 | `DADO_DESATUALIZADO` deixa de ser estado por medicamento e vira **faixa global** derivada de `meta.json` | É propriedade do conjunto de dados, não do item |
| 6 | `ALERTA_ABASTECIMENTO` fica **reservado** (feature flag, sem uso na v1) | Não há fonte de dados garantida; depende do pedido via LAI |
| 7 | **Zod como fonte única** de tipos; `id_dcb` e `codigo_atc` opcionais | Evita divergência entre interface e validação; evita gargalo de digitação |
| 8 | `normalizePTBR` corrigido; busca aproximada nunca autosseleciona | Bug do `ç` após remoção de diacríticos; risco de confusão entre nomes parecidos |
| 9 | Cron do GitHub Actions em UTC: `0 12 * * 1` | 08h de Cuiabá = 12h UTC |
| 10 | **Sistema de design** e orçamento de movimento (ADR-08) | Meta de produto visualmente próprio, sem pesar no celular simples |
| 11 | **Privacidade de URL e fontes autohospedadas** (ADR-09) | Query string e CDN de fontes vazam dados para terceiros |
| 12 | Cronograma de 5 semanas (nova Fase 0) | Inclui design e configuração do agente |

---

### 0.1 Revisão v1.1 → v1.2 (após revisão externa e verificação)

| # | Mudança | Situação da verificação |
|---|---|---|
| A | Skills em `.agents/skills/` (plural) | Confirmado no codelab oficial do Antigravity |
| B | Corpo das skills com Goal, Instructions, Examples e Constraints | Confirmado no codelab oficial |
| C | **Não hospedar o `.pmtiles` no GitHub Releases** | Confirmado: o download redireciona para um host que não envia CORS |
| D | Hospedagem do `.pmtiles`: mesma origem no Cloudflare Pages (limite de 25 MiB por arquivo) ou R2 com CORS configurado | Limite confirmado na documentação do Cloudflare; suporte a range requests e tamanho real a testar |
| E | `normalizePTBR`: `ç`→`s` antes da remoção de diacríticos, com `NFC` antes, e índice com variante sem cedilha | Testado em Node (ver seção 8) |
| F | Cron: a regra de 60 dias vale para repositório **público**; alerta de "dead man" no Healthchecks é a proteção principal | Regra confirmada na documentação do GitHub; efeito dos commits do próprio workflow **não confirmado** |
| G | Voltar do detalhe para os resultados sem usar URL: estado em memória + `sessionStorage` só para o último termo e a rolagem | Decisão de projeto (seção 5.3) |

---

## 1. Visão e escopo

### 1.1 Problema

Quem tem uma receita em Cuiabá precisa descobrir duas coisas em fontes separadas: se o medicamento é padronizado na rede municipal (SUS) e se é gratuito no Programa Farmácia Popular (drogarias privadas credenciadas). As informações estão dispersas, descritas por princípio ativo e dosagem, e a pessoa acaba fazendo viagens perdidas sob calor intenso.

### 1.2 Proposta

Uma PWA gratuita e de utilidade pública, sem cadastro, em que a pessoa digita o nome do remédio (comercial ou princípio ativo) e vê, lado a lado:

- **Via 1 — SUS Cuiabá:** se o medicamento e a dosagem constam na REMUME, onde a retirada acontece e o que é necessário.
- **Via 2 — Farmácia Popular:** se o item está entre os 41 itens 100% gratuitos do programa e quais farmácias credenciadas ficam perto.

### 1.3 Não-objetivos da v1

- Informar **estoque** por unidade ou por farmácia (não há fonte confiável; ver 6.3).
- Dar orientação clínica, dose, interação ou **substituição entre princípios ativos**.
- Coletar qualquer dado pessoal ou de saúde.
- Relatos comunitários de falta (v2, ADR-04).
- Representar a Prefeitura, o Ministério da Saúde ou qualquer órgão público. É projeto independente de tecnologia cívica.

### 1.4 Público e restrições de uso

Muitos usuários são idosos ou pessoas com baixa visão, em celulares simples e 4G instável. Consequências diretas: texto grande, contraste alto no tema padrão, alvos de toque grandes, funcionamento offline e orçamento de performance rígido.

---

## 2. O que foi verificado e o que continua pendente

| Afirmação | Situação | Fonte / ação |
|---|---|---|
| Farmácia Popular tem 41 itens, todos gratuitos desde fev/2025 | Confirmado | Elenco PFPB (Ministério da Saúde); versão de 31/08/2026 lista 41 itens |
| Os 41 itens incluem **insumos** (ex.: fraldas geriátricas, absorventes, preservativos) | Confirmado | Não chamar todos de "remédios" na interface |
| Painel InfoMS de endereços: atualizado diariamente, filtra por UF/município/bairro, tem "Baixar Dados" | Confirmado | `infoms.saude.gov.br/extensions/SEIDIGI_DEMAS_PFPB_ENDERECOS/index.html`. O painel carrega por JavaScript: usar download manual, não scraping |
| Algumas credenciadas podem estar com a conexão ao sistema autorizador suspensa | Confirmado | Nota 3 da lista oficial de credenciadas. Texto do app deve mandar confirmar no balcão |
| REMUME de Cuiabá foi atualizada e tem **159 itens** | Confirmado (imprensa) | Obter o documento oficial vigente; o PDF antigo no site da prefeitura está defasado |
| Retirada no SUS exige consulta e receita, nas unidades; CDMIC não atende ao público | Confirmado | Textos normativos (seção 6) |
| Medicamentos controlados são retirados em um conjunto reduzido de unidades | Confirmado (imprensa) | A lista de unidades muda; manter em `data/`, não no código |
| Desabastecimento real na rede (MP, maio/2025: 39 de 153 itens em falta no CDMIC) | Confirmado | Justifica a cautela do texto "padronizado" ≠ "disponível" |
| Página atual da prefeitura com **status de estoque** por item | **Não encontrada** | Pedido via LAI (ver `docs/lai-pedido.md`). Precedente: São Paulo publica estoque por unidade (Remédio na Hora) |
| "24 farmácias em 19 bairros" em Cuiabá | **Não confirmado** | Filtrar Cuiabá no painel InfoMS; não publicar o número até conferir |
| "72 unidades de vacinação", status das UPAs | **Não confirmado** | Obter na SMS; tratar como dado editável em `estabelecimentos.json` |
| Integração/link com pontoos.com.br | **Não confirmado** | Tratar como link opcional; não depender dele |
| Nome "Onde Pego" disponível (domínio e INPI) | **Pendente** | Seção 16 |

---

## 3. Fontes de dados e método de atualização (v1)

| Fonte | Órgão | Conteúdo | Atualização na v1 |
|---|---|---|---|
| REMUME vigente | SMS Cuiabá | Medicamentos padronizados (159 itens) com tipo de unidade de dispensação | Conversão manual do documento oficial para JSON; revisão com farmacêutico (Fase 2) |
| Elenco PFPB | Ministério da Saúde | 41 itens, mapeados à DCB | Tabela versionada no Git; conferir a cada nova versão do elenco |
| Painel de endereços PFPB | Ministério da Saúde (InfoMS) | Farmácias credenciadas ativas | Download manual do CSV (mensal), auditoria das coordenadas |
| Rede física (UBS, policlínicas, UPAs) | SMS Cuiabá | Localização, tipo, flags operacionais | Cadastro auditado no Git |
| Boletim de estoque do CDMIC | SMS Cuiabá | Estoque por item | **Só se** a LAI for atendida em formato aberto; senão, a camada de status não existe |

---

## 4. Arquitetura

### 4.1 Princípios

1. **Estático e local-first:** sem backend, sem banco, sem API própria na v1. Dados em JSON versionado.
2. **Offline por padrão:** busca, dados e mapa funcionam sem conexão depois da primeira visita.
3. **Zero dados pessoais:** nada que a pessoa digita ou onde ela está sai do aparelho.
4. **Honestidade do dado:** a interface nunca afirma mais do que a fonte oficial afirma.
5. **Cada decisão vira ADR.**

### 4.2 Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js (App Router), `output: 'export'`, TypeScript strict |
| Estilo | Tailwind CSS + tokens CSS (ver `docs/design/`) |
| Busca | Fuse.js + `normalizePTBR` |
| Mapa | MapLibre GL + PMTiles (arquivo próprio, recorte Cuiabá/VG) |
| Movimento | Motion (`motion/react`), carregado de forma enxuta (LazyMotion) |
| Validação | Zod (fonte única dos tipos) |
| Testes | Vitest |
| Fontes | Autohospedadas (pacotes `@fontsource/*`), sem Google Fonts |
| Hospedagem | Cloudflare Pages ou Vercel; `.pmtiles` em host estático com suporte a HTTP range requests |
| Pipeline | GitHub Actions + Healthchecks.io |

### 4.3 Topologia em camadas

- **Camada 1 — Dados e validação (CI):** cron semanal `0 12 * * 1` (UTC) valida `data/*.json` com Zod, confere limites geográficos de Cuiabá/VG, atualiza `ultima_verificacao_ci` e avisa o Healthchecks. A documentação do GitHub diz que, em repositório **público**, workflows agendados são desativados após 60 dias sem atividade no repositório (repositório privado não tem essa regra). Proteção em duas camadas: (1) o Healthchecks.io configurado para alertar se o ping de segunda-feira não chegar em até 2 horas (funciona mesmo se o workflow for desativado, porque o alerta nasce da ausência do ping); (2) se o repositório for público, um commit de manutenção periódico. Não está confirmado que commits feitos com o `GITHUB_TOKEN` do próprio workflow reiniciem o relógio; tratar como melhor esforço. Se o workflow for desativado, reativar com `gh workflow enable`. Um passo dentro do próprio workflow não consegue reativá-lo depois de desativado, porque ele deixa de rodar.
- **Camada 2 — Entrega estática:** build exportado, HTTPS, compressão Brotli. O `.pmtiles` fica fora do bundle e só é pedido quando o mapa aparece.
- **Camada 3 — Cliente PWA:** carrega os JSON, registra service worker (shell, JSON e tiles), faz busca e distância localmente.

### 4.4 Estrutura do repositório

Árvore completa no `README.md` do projeto. Resumo:

```
onde-pego/
├── GEMINI.md
├── .agents/skills/            # 6 skills (ver seção 13)
├── docs/                     # DAS.md, adr/, design/, prompts/, lai-pedido.md
├── data/                     # medicamentos.json, estabelecimentos.json, meta.json
├── scripts/                  # validate-schemas.ts, import-infoms-csv.ts, extract-tiles.md
├── public/                   # manifest, ícones, sw.js
├── src/                      # app/, components/, lib/, styles/, types/
├── tests/
└── .github/workflows/
```

---

## 5. Telas e navegação

### 5.1 Telas do MVP

| # | Rota | Tela | Papel |
|---|---|---|---|
| 1 | `/` | Início / Busca | Campo de busca como elemento central; atalhos populares (diabetes, pressão, asma, colesterol); botão "Ver farmácias perto de mim"; faixa de atualização |
| 2 | `/buscar` | Resultados | Lista com princípio ativo e dosagem visíveis; selo "exato" ou "aproximado"; estado vazio que orienta |
| 3 | `/medicamento/[slug]` | Detalhe (tela-herói) | Card duplo Via 1 e Via 2, seletor de dosagem, o que levar, mapa dividido com farmácias por distância |
| 4 | `/unidades` | Farmácias e unidades | Lista/mapa, filtro por bairro, "perto de mim" |
| 5 | `/plantao` | Plantão e alertas | Status das UPAs e policlínicas, campanhas de vacinação |
| 6 | `/sobre` | Fontes, privacidade e aviso | Origem e data de cada fonte, aviso de não vínculo, privacidade em linguagem simples, contato para reportar erro |

Estados que exigem design próprio: primeira carga, offline, dado desatualizado, GPS negado, erro de carregamento, 404, convite de instalação do PWA.

### 5.2 Navegação

Barra inferior com três painéis (Buscar, Unidades, Plantão). "Sobre" no menu superior. Acessibilidade (fonte, contraste, reduzir movimento) em painel acessível de qualquer tela.

### 5.3 Rotas e build

`medicamento/[slug]` é gerado no build a partir do JSON (`generateStaticParams`). A busca vive em estado do cliente: **o texto digitado não vai para a URL** (ADR-09). Para o botão "Voltar" do celular devolver a lista de resultados sem depender da URL: manter termo e resultados em estado em memória num provedor no layout raiz (sobrevive à navegação no cliente) e gravar em `sessionStorage` apenas o último termo e a posição de rolagem, como apoio para recarga ou restauração da aba. `sessionStorage` não é enviado pela rede e some ao fechar a aba. Nunca usar `localStorage` para isso. Páginas que usam parâmetros de navegação no cliente precisam de `Suspense` no export estático.

### 5.4 Fluxo principal

1. Pessoa digita o remédio (ou toca num atalho).
2. Escolhe o resultado (nunca selecionado automaticamente se aproximado).
3. Vê o card duplo; o mapa mostra as farmácias credenciadas ordenadas por distância (se houver GPS) ou por bairro.
4. Toca em "Ver rota" (abre o Google Maps por link, sem API) ou compartilha por WhatsApp.

---

## 6. Regras de produto e textos obrigatórios

### 6.1 Regras invioláveis

1. Nunca sugerir **substituição** entre princípios ativos.
2. Nunca autosselecionar resultado de busca **aproximado**; sempre mostrar princípio ativo e dosagem.
3. "Padronizado na REMUME" **não** é "disponível". Nunca escrever "disponível" ou "tem em estoque" sem fonte de estoque.
4. O pino de farmácia significa **credenciada**, não **tem o item**.
5. Nenhum conselho clínico, de dose ou de uso.
6. Toda tela com dado de saúde mostra a data da fonte.

### 6.2 Estados da Via 1 (SUS Cuiabá)

| Estado | Título no card | Texto |
|---|---|---|
| `PADRONIZADO_REMUME` | Consta na lista da Prefeitura (REMUME) | "Este medicamento faz parte da lista de medicamentos essenciais da rede municipal de Cuiabá. A retirada é feita nas unidades de saúde, com consulta e receita médica, e depende do estoque da unidade no dia. O depósito central (CDMIC) não atende ao público." |
| `NAO_CONSTA_REMUME` | Não consta na lista da Prefeitura | "Este item (ou esta dosagem) não consta na lista básica municipal. Isso não significa que você tenha de pagar: veja ao lado se é gratuito no Farmácia Popular ou pergunte na sua unidade sobre o Componente Especializado." |
| `ALERTA_ABASTECIMENTO` | *(reservado; desligado na v1)* | Só ativar se houver fonte oficial de estoque. |

Variante para controlados: "Este medicamento é controlado. A retirada ocorre apenas em unidades específicas, com receita de controle especial." (a lista de unidades vem de `data/`).

### 6.3 Via 2 (Farmácia Popular)

- Item no elenco: "Gratuito no Farmácia Popular. Leve documento oficial com foto e receita médica válida. Confirme com a farmácia se o item está disponível hoje." (Antes de publicar, conferir a lista de documentos na página oficial do programa.)
- Item fora do elenco: "Este item não faz parte do Farmácia Popular."
- Pino do mapa: "Farmácia credenciada ao programa. A disponibilidade do item deve ser confirmada com a farmácia."

### 6.4 Faixa global de atualização

`DADO_DESATUALIZADO` é calculado em tempo de execução: se a data mais antiga relevante em `meta.json` passar de N dias (configurável), exibir faixa fixa: "Os dados refletem a última publicação oficial verificada em [data]. Confirme na unidade ou na farmácia antes de sair de casa."

---

## 7. Contratos de dados

Fonte única em `src/types/schema.ts`, escrita em **Zod**; tipos TypeScript derivados com `z.infer`. Especificação completa e regras em `.agents/skills/busca-dados-contratos/`. Pontos principais:

- `MedicamentoCatalogo`: `id_dcb?`, `codigo_atc?`, `principio_ativo`, `nomes_comerciais[]`, `termos_populares[]`, `apresentacoes[]`.
- `ApresentacaoMedicamento`: dosagem, `status_remume_cuiaba`, `local_dispensacao_sus`, `farmacia_popular_gratuito`, `requisito_farmacia_popular`, nota opcional.
- `EstabelecimentoSaude`: tipo, bairro, endereço, telefone opcional, coordenadas com `auditado_manualmente`, atributos operacionais.
- `Meta`: versão, datas por fonte, `ultima_verificacao_ci`.
- Coordenadas validadas contra a caixa geográfica de Cuiabá/VG.
- Itens de teste marcados com `__fixture: true`; nunca inventar dado médico real.

---

## 8. Busca

- `normalizePTBR`, nesta ordem: minúsculas; `NFC` (une `c` + cedilha decomposta em `ç`); `ç`→`s`; `NFD` e remoção de diacríticos; regras fonéticas (ph→f, y→i, ch→x, ss→s, z→s, c antes de e/i→s); remover caracteres não alfanuméricos; colapsar espaços. O `ç`→`s` precisa vir **antes** do `NFD`: depois dele o `ç` já virou `c`. Código e casos de teste em `docs/prompts/02-motor-de-busca.md`.
- Quem digita no celular costuma omitir a cedilha ("acucar" em vez de "açúcar"). Por isso o índice guarda **duas chaves** por termo: uma com `ç`→`s` e outra com `ç`→`c`; a consulta é comparada com ambas.
- A **mesma** função normaliza índice e consulta.
- Retorno: `{ item, exato }`. `exato` só quando a consulta normalizada é igual a um nome normalizado.
- Resultado aproximado: rótulo "resultado aproximado", princípio ativo e dosagem sempre visíveis, nunca selecionado sozinho.
- Testes obrigatórios com pares de nomes parecidos (ex.: losartana e lovastatina) garantindo que não retornem como exato.
- Aceitar entrada com dosagem ("metformina 850") sem quebrar.

---

## 9. Mapa

- **Renderização:** MapLibre GL; plano B Leaflet com plugin do Protomaps se o WebGL pesar em aparelhos antigos (testar em Android simples antes de fechar).
- **Dados do mapa:** `pmtiles extract` do mapa do Protomaps com a caixa de Cuiabá e Várzea Grande, zoom máximo definido ao medir o tamanho do arquivo.
- **Hospedagem:** arquivo estático com suporte a HTTP range requests e, se estiver em outra origem, com CORS liberado para o site. **Não usar o GitHub Releases** (o download redireciona para um host sem cabeçalhos CORS, então o navegador bloqueia a leitura) e **não usar `tile.openstreetmap.org`** em produção. Opção preferida: servir o arquivo na **mesma origem** do site no Cloudflare Pages, desde que fique abaixo do limite de 25 MiB por arquivo. Se passar disso, usar Cloudflare R2 com bucket público e regras de CORS: um subdomínio é outra origem e exige CORS. Antes de fechar, confirmar na aba de rede respostas 206 e o tamanho real do arquivo.
- **Offline:** o service worker guarda o `.pmtiles` e os JSON; permitido porque o arquivo é nosso.
- **Carregamento:** código do mapa e arquivo de tiles só carregam quando o mapa é exibido.
- **Rotas:** link do Google Maps por URL (sem API); GPS do navegador; cálculo de distância (Haversine) local.
- **Atribuição:** exibir © OpenStreetMap e créditos exigidos pelo basemap.
- **GPS:** pedido somente quando a pessoa toca em "perto de mim"; alternativa por bairro.

---

## 10. Privacidade e acessibilidade

### 10.1 Privacidade (LGPD)

- Nenhum CPF, nome, receita, texto digitado ou localização é enviado a servidores.
- O texto da busca **nunca** entra na URL (a query string chega ao servidor de hospedagem).
- O slug do medicamento na URL (links compartilhados) vem do catálogo e é aceitável; a página "Sobre" deve informar isso.
- Fontes autohospedadas; nenhuma chamada a CDN de fontes ou analytics de terceiros no MVP.
- Preferências de acessibilidade ficam só no aparelho (`localStorage`). O último termo buscado fica só em memória e em `sessionStorage` da aba, nunca enviado pela rede.

### 10.2 Acessibilidade (meta: WCAG 2.2 AA)

- Controles nativos: tamanho de fonte, alto contraste, redução de movimento (além de `prefers-reduced-motion`).
- Texto base de 18px ou mais; alvo de toque mínimo de 48px; foco visível; navegação por teclado; leitor de tela testado.
- Contraste alto **no tema padrão**, não só em modo opcional.
- Mapa com alternativa em lista, sempre.
- Nenhuma informação transmitida apenas por cor.
- Todo componente copiado de bibliotecas (ex.: 21st.dev) passa pela skill `busca-a11y-audit` e tem a licença conferida.

---

## 11. Performance e offline (metas)

| Meta | Valor-alvo |
|---|---|
| Rota inicial, JS comprimido (sem mapa) | ≤ 150 KB |
| LCP no perfil "Slow 4G" do Lighthouse | ≤ 2,5 s |
| Busca após JSON em memória | resposta imediata |
| Mapa | carregado sob demanda, nunca no caminho crítico da busca |
| Offline | busca, dados e mapa funcionam após a primeira visita |

São metas de projeto a medir no CI e em aparelho real, não resultados já obtidos.

---

## 12. Pipeline

- `scripts/validate-schemas.ts` trava o build se um JSON for inválido.
- `scripts/import-infoms-csv.ts` lê o CSV do InfoMS preservando coordenadas já auditadas.
- Workflow semanal: validar, atualizar carimbo, avisar monitoramento.
- Sem commits ou migrações automáticas fora do carimbo de verificação.

---

## 13. Skills e regras do agente (Antigravity)

Regras sempre carregadas em `GEMINI.md`. Skills em `.agents/skills/` (caminho de workspace conforme o codelab oficial do Antigravity; o escopo global fica fora do repositório):

| Skill | Função |
|---|---|
| `busca-design-system` | Identidade visual, tokens, tipografia, componentes, tom de voz |
| `busca-motion` | Orçamento e padrões de animação com Motion |
| `busca-textos-saude` | Textos normativos e proibições de conteúdo de saúde |
| `busca-a11y-audit` | Checklist de acessibilidade para aceitar qualquer componente |
| `busca-dados-contratos` | Zod, validação, fixtures, regras dos JSON |
| `busca-mapa-pmtiles` | Extração do recorte, hospedagem, MapLibre, service worker |

---

## 14. Registro de decisões arquiteturais (resumo)

| ADR | Decisão | Status |
|---|---|---|
| 01 | Git-backed estático, zero backend na v1 | Aprovado |
| 02 | Busca e geoprocessamento locais | Aprovado |
| 03 | Geocodificação auditada manualmente | Aprovado |
| 04 | Escrita comunitária adiada para a v2 | Aprovado |
| 05 | Privacidade por design e acessibilidade | Aprovado |
| 06 | Mapa com MapLibre + PMTiles próprio | Aprovado |
| 07 | Busca primeiro; mapa no resultado; atalho "perto de mim" | Aprovado, validar em teste A/B (Fase 4) |
| 08 | Sistema de design próprio e orçamento de movimento | Aprovado |
| 09 | Privacidade de URL e fontes autohospedadas | Aprovado |

Detalhes de 06 a 09 em `docs/adr/`.

---

## 15. Riscos

| Risco | Impacto | Mitigação |
|---|---|---|
| Pessoa interpretar "padronizado" como "tem" | Viagem perdida, perda de confiança | Textos normativos, regra 3 da seção 6.1, testes com receitas reais |
| Pino de farmácia interpretado como estoque | Idem | Texto do pino, regra 4 |
| Confusão por nomes parecidos na busca | Risco à saúde | Nunca autosselecionar aproximado; testes com pares parecidos |
| REMUME ou elenco desatualizados | Informação errada | Datas visíveis, faixa global, revisão por farmacêutico |
| LAI não atendida | Sem camada de status | O produto já funciona sem ela (camada estável) |
| WebGL pesado em aparelho antigo | Mapa lento | Carregamento sob demanda, plano B Leaflet, lista como alternativa |
| Credenciadas descredenciadas ou suspensas | Dado errado | Atualização mensal, aviso para confirmar no balcão |
| Percepção de vínculo oficial | Risco reputacional/legal | Aviso de independência visível em "Sobre" e no rodapé |

---

## 16. Pendências e decisões em aberto

- Verificar o nome: Registro.br (domínio) e INPI (anterioridade) antes de divulgar. Não foi encontrado app ou site com o nome "Onde Pego" na pesquisa feita, mas isso não substitui a busca formal.
- Conferir no painel InfoMS o número real de farmácias e bairros de Cuiabá.
- Obter a REMUME oficial vigente (159 itens) em formato utilizável.
- Protocolar o pedido via LAI (`docs/lai-pedido.md`).
- Medir o tamanho do `.pmtiles` de Cuiabá/VG (a estimativa de poucos MB não foi verificada) e confirmar suporte a range requests no host escolhido.
- Decidir se o repositório será público ou privado (afeta a regra de 60 dias do cron).
- Decidir o limite de dias da faixa "dado desatualizado".
- Teste A/B da tela inicial (busca primeiro versus mapa primeiro) na Fase 4.

---

## 17. Cronograma (5 semanas)

| Fase | Semana | Entregáveis |
|---|---|---|
| **0. Design e agente** | 1 | Direção visual aprovada, protótipo das 3 telas principais (detalhe, busca, unidades), `GEMINI.md` e 6 skills instalados, protocolo da LAI |
| **1. Dados e mapa** | 2 | REMUME em JSON, 41 itens PFPB, CSV do InfoMS, auditoria das coordenadas, extração do `.pmtiles` e escolha do host |
| **2. Validação farmacêutica** | 3 | Revisão da matriz de dispensação com farmacêutico de UBS/policlínica e de drogaria credenciada; dicionário de sinônimos; validação dos textos |
| **3. Construção do MVP** | 4 | Scaffold, schemas, busca com testes, telas 1 a 6, mapa, PWA offline, pipeline |
| **4. Testes reais e publicação** | 5 | 15 a 20 moradores com receitas reais; teste A/B da tela inicial; auditoria de acessibilidade; domínio; divulgação |

---

## 18. Referências

- Política de uso de tiles do OSM: `operations.osmfoundation.org/policies/tiles/`
- Protomaps e formato PMTiles: `protomaps.com`; MapLibre: `maplibre.org`
- Painel de endereços do Farmácia Popular: `infoms.saude.gov.br/extensions/SEIDIGI_DEMAS_PFPB_ENDERECOS/index.html`
- Página do Programa Farmácia Popular: `gov.br/saude/pt-br/composicao/sectics/farmacia-popular`
- Motion (docs e MCP): `motion.dev`
- Skills do Antigravity: codelab oficial "Authoring Google Antigravity Skills" (`codelabs.developers.google.com/getting-started-with-antigravity-skills`)
- Limites do Cloudflare Pages: `developers.cloudflare.com/pages/platform/limits/`
- Desativação de workflows agendados: documentação do GitHub Actions, "Disabling and enabling a workflow"
- Lei de Acesso à Informação: Lei nº 12.527/2011
