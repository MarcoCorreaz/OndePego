---
name: busca-motion
description: Regras e padrões de animação (biblioteca Motion, `motion/react`) do app Onde Pego, com orçamento de movimento para celular simples e acessibilidade. Use SEMPRE que for adicionar, alterar ou remover qualquer animação, transição, microinteração, efeito de entrada, scroll animado ou "deixar mais bonito/dinâmico", mesmo que o pedido não cite animação explicitamente.
---

# Onde Pego — Movimento

Movimento aqui serve para **mostrar o que mudou**, não para enfeitar. O público inclui idosos e pessoas sensíveis a movimento, em aparelhos simples. Menos é mais.

## Orçamento de movimento

**Permitido** (responde a uma ação da pessoa ou comunica mudança de estado):
- Entrada do resultado no detalhe: as duas placas (Via 1 e Via 2) entram em sequência curta. É o **único momento orquestrado** do app.
- Abrir e fechar painéis (acessibilidade, ficha de unidade) e trocar lista/mapa.
- Mudança de estado de chip, selo e botão (pressionado, confirmado).
- Transição entre páginas, simples e curta.
- Foco do mapa deslocando-se até a farmácia mais próxima quando o resultado abre.

**Proibido:**
- Animação de entrada em cada seção ao rolar, hover animado em todo card, parallax, rolagem sequestrada, loops infinitos, partículas, fundos animados, contadores decorativos.
- Qualquer movimento no campo de busca enquanto a pessoa digita (exceto o foco).
- Animar propriedades que forçam layout (largura, altura, top/left). Use `transform` e `opacity`.

## Parâmetros

- Duração de 150 a 300 ms; o momento orquestrado pode chegar a 500 ms no total.
- Sem efeito de mola com "quique". Easing suave de desaceleração.
- Deslocamentos pequenos (até 12 a 16 px).

## Acessibilidade (obrigatório)

- Respeitar `prefers-reduced-motion` e o controle "reduzir animações" do próprio app: com qualquer um dos dois ativo, trocar movimento por mudança imediata ou fade muito curto.
- No Motion, configure o respeito às preferências do usuário na raiz (ex.: `MotionConfig` com `reducedMotion="user"`) e faça o controle do app alimentar a mesma decisão.
- Nunca depender de animação para transmitir informação: o estado final precisa estar legível sem ela.

## Peso e implementação

- Carregue o Motion de forma enxuta (`LazyMotion` com o conjunto mínimo de recursos e componentes `m`), e não importe a biblioteca inteira.
- Código de animação do mapa e de transições secundárias entra por importação dinâmica; **nada de animação pesada no caminho crítico da busca**.
- Não chame `motion.create()` dentro de renderização.
- Meça o impacto no bundle (meta do projeto: JS da rota inicial ≤ 150 KB, sem mapa) e relate o número.
- Teste em Android simples com CPU limitada; se engasgar, remova o efeito.

## Documentação

Para consultar a API do Motion, use o servidor MCP oficial (`mcp.motion.dev`) quando estiver conectado, em vez de lembrar a API de memória. Se não estiver conectado, consulte `motion.dev/docs`.

## Checklist antes de entregar

- [ ] A animação mostra uma mudança real ou responde a uma ação?
- [ ] Funciona e comunica igual com movimento reduzido?
- [ ] Só `transform` e `opacity`?
- [ ] Duração dentro do orçamento?
- [ ] Impacto no bundle medido e relatado?
- [ ] Testada em aparelho simples (ou com CPU limitada)?
