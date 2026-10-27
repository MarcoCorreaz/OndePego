# Onde Pego — regras do projeto

Estas regras valem para **toda** interação neste repositório. Detalhes de domínio ficam nas skills em `.agent/skills/` (ver seção 8). A especificação completa está em `docs/DAS.md`.

## 1. O que é este projeto

PWA estática e gratuita para moradores de Cuiabá/MT. A pessoa digita o nome de um remédio e vê, lado a lado: (Via 1) se ele é padronizado na rede municipal (REMUME, SUS) e (Via 2) se é gratuito no Programa Farmácia Popular e quais farmácias credenciadas ficam perto. É um projeto **independente**, sem vínculo com a Prefeitura nem com o Ministério da Saúde.

Público: muitos idosos e pessoas com baixa visão, em celulares simples e 4G instável.

## 2. Como trabalhar comigo

- **Antes de alterar qualquer coisa**, mostre o plano e a lista de arquivos que vai tocar.
- **Nunca** faça commit, push, migração, deploy ou comando destrutivo. Eu reviso o diff e faço isso.
- Se uma instrução conflitar com estas regras, aponte o conflito e pare; não escolha sozinho.
- Prefira mudanças pequenas e testáveis. Não refatore o que não foi pedido.
- Não instale dependência fora da stack (seção 5) sem perguntar.
- Não invente dado médico, de farmácia ou de endereço. Em testes, use fixtures marcadas com `__fixture: true`.

## 3. Regras invioláveis de conteúdo de saúde

1. Nunca sugerir **substituição** de um princípio ativo por outro, nem dar orientação clínica, de dose ou de uso.
2. Resultado de busca **aproximado** nunca é selecionado automaticamente. Sempre mostrar princípio ativo e dosagem, com rótulo "resultado aproximado".
3. "Padronizado na REMUME" **não** significa "disponível". Não escrever "disponível", "em estoque" ou equivalente sem uma fonte oficial de estoque.
4. O pino de farmácia no mapa significa **"credenciada ao Farmácia Popular"**, nunca "tem o item".
5. Toda tela com dado de saúde mostra a data da fonte.
6. Os textos normativos dos estados são fixos. Use a skill `busca-textos-saude`; não reescreva por conta própria.

## 4. Privacidade (LGPD) — regras duras

- Nenhum dado pessoal, texto digitado ou localização sai do aparelho. Sem backend, sem analytics de terceiros, sem formulários.
- **Nunca** colocar o texto da busca na URL (nem `?q=`). A busca vive em estado do cliente.
- Fontes **autohospedadas** (`@fontsource/*`). Proibido Google Fonts ou qualquer CDN de fontes/ícones/scripts.
- Preferências de acessibilidade ficam só em armazenamento local do aparelho.
- GPS só é pedido quando a pessoa toca em "perto de mim", e sempre existe a alternativa por bairro.

## 5. Stack e convenções

- Next.js (App Router) com `output: 'export'`; TypeScript **strict**; Tailwind CSS.
- Zod é a **fonte única** dos tipos (`src/types/schema.ts`); tipos derivados com `z.infer`.
- Busca: Fuse.js + `normalizePTBR` (a mesma função para índice e consulta).
- Mapa: MapLibre GL + arquivo PMTiles próprio. **Proibido** usar `tile.openstreetmap.org` em qualquer código.
- Movimento: Motion (`motion/react`), de forma enxuta.
- Testes: Vitest. Todo código de `lib/` tem teste.
- **Idioma:** textos de interface e campos de dados em português do Brasil; nomes de funções, componentes e arquivos de código em inglês. Frases em sentence case, voz ativa, sem jargão técnico para o usuário.
- Sem `localStorage` para dado de saúde; só para preferências de acessibilidade.

## 6. Acessibilidade (piso de qualidade, não opcional)

- Alvo: WCAG 2.2 AA.
- Texto base ≥ 18px; alvos de toque ≥ 48px; foco sempre visível; navegação por teclado completa.
- Contraste alto **no tema padrão**. Nada transmitido só por cor.
- Respeitar `prefers-reduced-motion` e o controle de "reduzir animações" do próprio app.
- O mapa sempre tem alternativa em lista.
- Todo componente novo ou copiado (inclusive de 21st.dev ou outras bibliotecas) passa pela skill `busca-a11y-audit` e tem a licença conferida antes de entrar.

## 7. Orçamento de performance (metas a medir)

- JS da rota inicial, comprimido, **sem o mapa**: ≤ 150 KB.
- LCP ≤ 2,5 s no perfil "Slow 4G" do Lighthouse.
- Mapa e `.pmtiles` carregam **sob demanda**, nunca no caminho crítico da busca.
- Funciona offline após a primeira visita (busca, dados e mapa).
- Não adicionar dependência pesada sem medir o impacto no bundle e relatar o número.

## 8. Quando usar cada skill

| Skill | Use quando |
|---|---|
| `busca-design-system` | Criar ou alterar qualquer tela, componente, cor, tipografia ou texto de interface |
| `busca-motion` | Adicionar ou alterar qualquer animação ou transição |
| `busca-textos-saude` | Escrever ou alterar texto sobre medicamento, SUS, Farmácia Popular, estados do card ou avisos |
| `busca-a11y-audit` | Antes de aceitar qualquer componente novo e ao fechar cada tela |
| `busca-dados-contratos` | Mexer em schemas, `data/*.json`, scripts de validação ou fixtures |
| `busca-mapa-pmtiles` | Mapa, `.pmtiles`, service worker de tiles, "perto de mim", rotas |

## 9. Definição de pronto

Uma tarefa só está pronta quando: tipos compilam em modo strict; `npm run validate`, `npm test` e `npm run build` passam; a checagem de acessibilidade da tela foi feita; nenhuma regra das seções 3 e 4 foi violada; e você resumiu o que mudou, o que **não** foi feito e qualquer dúvida em aberto.
