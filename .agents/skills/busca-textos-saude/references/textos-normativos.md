# Textos normativos (literais)

Versão alinhada ao DAS v1.1, seção 6. Alterar apenas com aprovação do responsável pelo projeto.

## Via 1 — SUS Cuiabá

### PADRONIZADO_REMUME

- **Título:** Consta na lista da Prefeitura (REMUME)
- **Texto:** Este medicamento faz parte da lista de medicamentos essenciais da rede municipal de Cuiabá. A retirada é feita nas unidades de saúde, com consulta e receita médica, e depende do estoque da unidade no dia. O depósito central (CDMIC) não atende ao público.

### NAO_CONSTA_REMUME

- **Título:** Não consta na lista da Prefeitura
- **Texto:** Este item (ou esta dosagem) não consta na lista básica municipal. Isso não significa que você tenha de pagar: veja ao lado se é gratuito no Farmácia Popular ou pergunte na sua unidade sobre o Componente Especializado.

### Variante: medicamento controlado

- **Texto adicional:** Este medicamento é controlado. A retirada ocorre apenas em unidades específicas, com receita de controle especial.
- A lista das unidades vem de `data/estabelecimentos.json` (flag `dispensa_psicotropicos_sus`), nunca escrita no texto.

### ALERTA_ABASTECIMENTO (reservado, desligado na v1)

Só ativar quando existir fonte oficial de estoque. Texto a definir e aprovar nessa ocasião.

## Via 2 — Farmácia Popular

### Item no elenco

- **Título:** Gratuito no Farmácia Popular
- **Texto:** Leve documento oficial com foto e receita médica válida. Confirme com a farmácia se o item está disponível hoje.
- **Requisito adicional (`FRALDA_GERIATRICA`):** Para fralda geriátrica: ter 60 anos ou mais ou ser pessoa com deficiência, e apresentar prescrição, laudo ou atestado médico indicando a necessidade, conforme as regras do programa
- Antes de publicar, conferir a lista exata de documentos na página oficial do programa.

### Item fora do elenco

- **Título:** Fora do Farmácia Popular
- **Texto:** Este item não faz parte do Farmácia Popular.

### Pino ou cartão de farmácia

- **Texto:** Farmácia credenciada ao programa. A disponibilidade do item deve ser confirmada com a farmácia.

## Faixa global (dados antigos)

- **Texto:** Os dados refletem a última publicação oficial verificada em [data]. Confirme na unidade ou na farmácia antes de sair de casa.
- Exibida quando a data mais antiga relevante em `meta.json` passa do limite de dias configurado.

## Aviso de independência (rodapé e página Sobre)

- **Texto:** O Onde Pego é um projeto independente de tecnologia cívica que usa dados abertos públicos. Não tem vínculo com a Prefeitura de Cuiabá, o SUS ou o Ministério da Saúde. Nenhum medicamento é entregue sem avaliação e receita médica.

## Privacidade (página Sobre, resumo)

- **Texto:** Não pedimos seu nome, CPF, receita nem localização para uma conta. O que você digita na busca fica no seu aparelho. Se você tocar em "perto de mim", sua posição é usada só no aparelho para ordenar as farmácias e não é enviada a ninguém. Links compartilhados trazem o nome do medicamento na página.
