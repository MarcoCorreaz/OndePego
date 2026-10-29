---
name: busca-a11y-audit
description: Checklist e processo de auditoria de acessibilidade (WCAG 2.2 AA) do Onde Pego, com foco em idosos, baixa visão e leitor de tela. Use SEMPRE antes de aceitar qualquer componente novo ou copiado de biblioteca (incluindo 21st.dev), ao fechar cada tela, ao introduzir cor, fonte ou animação nova, e quando pedirem "revisar", "auditar" ou "validar" a interface.
---

# Onde Pego — Auditoria de acessibilidade

Acessibilidade aqui é requisito do produto, não acabamento. Muitos usuários são idosos ou têm baixa visão. Alvo: **WCAG 2.2 AA**, com contraste alto **já no tema padrão**.

## Como executar

1. Liste o que foi criado ou alterado (telas, componentes, cores, animações).
2. Passe pelo checklist abaixo e marque cada item como OK, falha ou não se aplica.
3. Para cada falha: arquivo, problema, correção sugerida. **Não corrija sem mostrar o plano.**
4. Entregue um resumo curto: o que passou, o que falhou, o que depende de teste manual em aparelho real.

Você consegue verificar código e contraste por cálculo. **Não** consegue substituir teste em aparelho real com leitor de tela; sinalize isso no resumo.

## Checklist

### Percepção
- [ ] Texto base ≥ 18px; nada abaixo de 16px, nem em datas e fontes de dados.
- [ ] Contraste de texto ≥ 4,5:1 (≥ 3:1 para texto grande e componentes de interface); pares das cores do projeto estão em `busca-design-system/references/tokens.md`. Cor nova: calcular antes.
- [ ] Nenhuma informação transmitida só por cor (gratuito/atenção/alerta também têm texto e/ou ícone).
- [ ] Imagens e ícones informativos têm texto alternativo; decorativos são ocultados dos leitores de tela.
- [ ] Layout funciona com zoom de 200% e reflow em 320px de largura, sem rolagem horizontal (exceto tabelas e mapa dentro de contêiner próprio).
- [ ] Espaçamento de texto ajustável pela pessoa não quebra o layout.

### Operação
- [ ] Todo o fluxo funciona só com teclado, em ordem lógica; sem armadilha de foco.
- [ ] Foco **sempre visível**, com contraste suficiente.
- [ ] Alvos de toque ≥ 48px, com espaço entre eles.
- [ ] Nenhuma ação exige gesto complexo (arrastar, pinça) sem alternativa simples.
- [ ] Tempo: nada expira ou some sozinho sem aviso.

### Compreensão e robustez
- [ ] Campos têm rótulo visível e associado; erros dizem o que houve e como corrigir.
- [ ] Hierarquia de títulos correta; pontos de referência (`header`, `nav`, `main`) presentes; link "pular para o conteúdo".
- [ ] Nomes acessíveis em botões e links ("Ver rota para Farmácia X", não "clique aqui").
- [ ] Estados dinâmicos (resultados da busca, erro, offline) anunciados (`aria-live` adequado, sem excesso).
- [ ] Idioma da página definido (`pt-BR`).
- [ ] Prefere HTML nativo a ARIA; ARIA só onde não há elemento nativo.

### Movimento
- [ ] `prefers-reduced-motion` e o controle do app respeitados (ver `busca-motion`).
- [ ] Nada pisca mais de 3 vezes por segundo.

### Mapa
- [ ] Existe alternativa completa em lista, com a mesma informação e as mesmas ações.
- [ ] O mapa não prende o foco do teclado nem a rolagem da página no celular.
- [ ] Marcadores têm nome acessível e significado coerente com `busca-textos-saude` (credenciada, não "tem o item").

### Conteúdo de saúde
- [ ] Textos de saúde são os da skill `busca-textos-saude`, sem variações.
- [ ] Data da fonte visível onde há dado oficial.

## Entrada de componente de biblioteca (21st.dev e similares)

Antes de adicionar:

1. **Licença:** conferir os termos do componente e do pacote; registrar a origem em um comentário no topo do arquivo.
2. **Dependências:** listar o que traz; recusar se pesar no orçamento de bundle sem justificativa.
3. **Adaptação:** trocar cores, fontes, raios e espaçamentos pelos tokens do projeto; remover efeitos fora do orçamento de movimento.
4. **Acessibilidade:** rodar este checklist inteiro no componente adaptado.
5. **Texto:** substituir qualquer copy de exemplo; textos de saúde seguem `busca-textos-saude`.

Componente que não passa é reescrito ou descartado, não "aceito por enquanto".

## Testes manuais que o responsável deve fazer (sinalizar no resumo)

- Teclado puro, do início ao fim do fluxo principal.
- Leitor de tela no Android (TalkBack) e, se possível, iOS (VoiceOver).
- Zoom de 200% e fonte do sistema aumentada.
- Modo de alto contraste do app e escala de cinza.
- Aparelho Android simples, em 4G fraco e depois em modo avião.
- Pelo menos algumas pessoas idosas usando receitas reais (Fase 4 do cronograma).
