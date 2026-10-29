---
name: busca-design-system
description: Identidade visual, tokens, tipografia, layout e tom de voz do app Onde Pego. Use SEMPRE que for criar ou alterar qualquer tela, componente, cor, fonte, espaçamento, ícone ou texto de interface, mesmo que o pedido seja só "ajustar um botão" ou "melhorar a aparência". Garante um visual próprio (não genérico) e legível para idosos em celular simples.
---

# Onde Pego — Design System

## Ponto de partida

O produto responde a uma pergunta ("onde pego meu remédio?") para quem está na rua, no calor, muitas vezes com baixa visão e celular simples. O visual vem desse mundo: **sinalização de rua e de ponto de ônibus**. A interface é uma sinalização que orienta: blocos de cor fortes, texto grande, pictogramas simples, hierarquia óbvia. Não é um app de "wellness" nem um painel de SaaS.

Os valores de cor, fonte e espaçamento abaixo são a **proposta v0**. Eles devem ser validados no protótipo antes de virar código final. Se mudar algum, atualize `references/tokens.md` primeiro.

## O elemento memorável (gaste a ousadia aqui)

O **card duplo** do detalhe do medicamento: duas "placas" lado a lado (empilhadas no celular), Via 1 e Via 2, cada uma com faixa de cor, pictograma grande e título curto. Todo o resto da interface fica quieto e disciplinado para que as placas sejam o que a pessoa lembra.

## Regras de composição

- Alinhamento à esquerda; uma coluna no celular; linhas de texto com no máximo ~65 caracteres.
- Estrutura visual codifica informação: borda, faixa e bloco de cor existem porque dizem algo (ex.: faixa verde = gratuito; faixa amarela = atenção; faixa vermelha = alerta). Sem borda ou divisória decorativa.
- Raios de borda diferentes por papel (placa, campo, chip), não um raio único em tudo.
- Sem sombras suaves em todo card. Use bloco de cor e borda sólida para separar.
- Numeração só quando o conteúdo é de fato uma sequência (ex.: "o que levar" em passos).

## O que evitar (marcas de design genérico)

Não usar como escolha padrão: fundo creme com serifada de alto contraste e acento terracota; fundo quase preto com um acento verde-ácido; layout de jornal com filetes finos; cartões arredondados idênticos com sombra cinza e gradientes decorativos; rótulo em CAIXA ALTA espaçada acima de cada título; metadados separados por pontos centrais; seta "→" em todo botão; destacar uma única palavra do título em itálico ou outra cor.

## Tipografia

- **Títulos e rótulos de placa:** Barlow Semi Condensed (peso 600 a 800), grotesca de ar de sinalização.
- **Texto corrido e interface:** Atkinson Hyperlegible, desenhada para legibilidade em baixa visão.
- Duas famílias claramente distintas, nada além disso.
- **Autohospedar** via pacotes `@fontsource/*` (confirmar nomes exatos dos pacotes). Proibido Google Fonts.
- Base 18px; escala de 1,25; entrelinha ≥ 1,5 no corpo; peso mínimo 400.

## Cor

Cores com função, nunca decorativas. Pares de texto/fundo devem manter os contrastes registrados em `references/tokens.md` (todos acima de 4,5:1). Conferir qualquer cor nova com a skill `busca-a11y-audit` antes de usar.

## Componentes-base

Campo de busca grande (herói da tela inicial), chip de atalho, placa de via (Via 1 / Via 2), selo "exato" / "aproximado", faixa global de atualização, bloco "o que levar", cartão de unidade/farmácia, botão de rota, barra inferior de navegação (ícone + texto), painel de acessibilidade, banner offline, estado vazio, estado de erro. Cada componente precisa dos estados: padrão, foco, pressionado, desabilitado, carregando e erro.

## Voz e copy

- Escreva do ponto de vista de quem usa; palavras do dia a dia ("remédio", "receita", "posto"). Termo técnico só como apoio (princípio ativo e dosagem aparecem sempre, mas em segundo plano).
- Frases curtas, voz ativa, sentence case, sem enfeite. Um elemento de texto faz um trabalho só.
- Botão diz o que acontece: "Ver rota", "Compartilhar no WhatsApp", "Ver farmácias perto de mim".
- Erro explica o que houve e o que fazer; não pede desculpa e nunca é vago. Tela vazia convida a agir.
- Todo texto sobre medicamento, SUS ou Farmácia Popular vem da skill `busca-textos-saude`. Não improvise.

## Processo ao criar uma tela

1. Plano curto: layout em 1 ou 2 frases + wireframe ASCII, tokens usados, onde está a "placa" ou o foco da tela.
2. Revise contra este documento: se alguma parte parece o que você faria em qualquer app de saúde, mude e diga o que mudou e por quê.
3. Construa mobile-first (começando em 360px de largura).
4. Critique: verifique em 200% de zoom, com foco de teclado visível, em escala de cinza (nada depende só de cor) e com movimento reduzido.
5. Passe pela skill `busca-a11y-audit` antes de dar a tela como pronta.
