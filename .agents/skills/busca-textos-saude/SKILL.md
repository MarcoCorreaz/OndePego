---
name: busca-textos-saude
description: Textos normativos e regras de conteúdo sobre medicamentos no Onde Pego (SUS Cuiabá/REMUME, Farmácia Popular, estados do card, avisos, pino do mapa, faixa de dado desatualizado). Use SEMPRE que escrever, alterar, traduzir ou revisar qualquer texto que fale de remédio, receita, disponibilidade, retirada, SUS, Farmácia Popular, farmácia credenciada, controlados ou aviso legal, inclusive mensagens de erro e estados vazios ligados a medicamento.
---

# Onde Pego — Textos de saúde

Texto sobre medicamento tem consequência real: uma viagem perdida no calor, ou pior, confusão sobre o que tomar. Esta skill existe para o agente **não improvisar** nesses textos.

## Princípios

1. O app informa **onde e como retirar**. Nunca orienta tratamento.
2. O texto nunca afirma mais do que a fonte oficial afirma.
3. Cada afirmação sobre fonte vem com a data da fonte.

## Proibições

Nunca escrever, em nenhum lugar da interface:

- Que algo "está disponível", "tem em estoque", "tem aqui" ou "garantido", salvo se existir fonte oficial de estoque (hoje não existe).
- Qualquer indicação de **substituição** ("equivalente", "pode trocar por", "use o genérico X").
- Dose, frequência, interação, indicação clínica ou "pode tomar".
- Que a pessoa "não precisa de receita" para itens que exigem receita.
- Que o app representa a Prefeitura, o SUS ou o Ministério da Saúde.

## Vocabulário

- Para a pessoa, "remédio"; em apoio técnico, "medicamento", princípio ativo e dosagem.
- "Posto" ou "unidade de saúde" (não "UBS" sozinho sem explicar na primeira vez).
- "Farmácia credenciada" (não "farmácia do governo").
- "Padronizado" aparece sempre com explicação ao lado: "consta na lista da Prefeitura".

## Os quatro blocos de texto

Os textos exatos de cada estado estão em `references/textos-normativos.md`. Use-os **literalmente**. Se precisar alterar, proponha a mudança e peça aprovação; não reescreva por conta própria.

Resumo de quando usar cada um:

| Situação | Bloco |
|---|---|
| Item está na REMUME | Via 1 — `PADRONIZADO_REMUME` |
| Item não está na REMUME | Via 1 — `NAO_CONSTA_REMUME` |
| Item é controlado | Variante de controlados da Via 1 |
| Item está no elenco do Farmácia Popular | Via 2 — gratuito |
| Item não está no elenco | Via 2 — não faz parte |
| Pino ou cartão de farmácia | Texto do pino (credenciada, confirmar disponibilidade) |
| Dados antigos | Faixa global de atualização (derivada de `meta.json`) |

`ALERTA_ABASTECIMENTO` está **reservado e desligado** na v1. Não use sem fonte oficial de estoque.

## Erros e estados vazios

- Busca sem resultado: diga o que fazer (conferir a grafia, olhar o nome na caixa ou na receita, perguntar na unidade de saúde). Não sugira outro remédio.
- Offline: diga que os dados salvos continuam valendo e a data deles.
- GPS negado: ofereça escolher o bairro.
- Erro ao carregar: diga o que aconteceu e como tentar de novo, sem culpar a pessoa e sem pedir desculpa vaga.

## Antes de publicar qualquer texto novo

- [ ] Não viola nenhuma proibição?
- [ ] Informa a data da fonte quando fala de dado oficial?
- [ ] Um teste com receita real (Fase 4) foi planejado para este texto?
- [ ] Os documentos exigidos para retirada no Farmácia Popular foram conferidos na página oficial do programa?
