import { describe, expect, it } from 'vitest';
import {
  NORMATIVE_TEXTS,
  formatIsoDatePTBR,
  getStaleBannerCopy,
  getVia1Copy,
  getVia2Copy,
} from '@/lib/healthCopy';
import type { Apresentacao } from '@/types/schema';

describe('Textos normativos de saúde (src/lib/healthCopy.ts)', () => {
  it('retorna literalmente o texto de PADRONIZADO_REMUME para item padronizado de UBS', () => {
    const ap: Apresentacao = {
      id_apresentacao: 'ap-ubs-1',
      descricao_dosagem: '50 mg comprimido',
      status_remume_cuiaba: 'PADRONIZADO_REMUME',
      local_dispensacao_sus: 'UBS',
      farmacia_popular_gratuito: false,
      requisito_farmacia_popular: 'NAO_DISPONIVEL',
    };

    const via1 = getVia1Copy(ap);
    expect(via1.padronizado).toBe(true);
    expect(via1.controlado).toBe(false);
    expect(via1.titulo).toBe('Consta na lista da Prefeitura (REMUME)');
    expect(via1.explicacaoPadronizado).toContain('consta na lista da Prefeitura');
    expect(via1.texto).toBe(
      'Este medicamento faz parte da lista de medicamentos essenciais da rede municipal de Cuiabá. A retirada é feita nas unidades de saúde, com consulta e receita médica, e depende do estoque da unidade no dia. O depósito central (CDMIC) não atende ao público.',
    );
    expect(via1.textoControlado).toBeUndefined();
  });

  it('aciona a variante de medicamento controlado quando PADRONIZADO_REMUME e POLICLINICA_PORTARIA344', () => {
    const apControlado: Apresentacao = {
      id_apresentacao: 'ap-ctrl-1',
      descricao_dosagem: '2 mg comprimido',
      status_remume_cuiaba: 'PADRONIZADO_REMUME',
      local_dispensacao_sus: 'POLICLINICA_PORTARIA344',
      farmacia_popular_gratuito: false,
      requisito_farmacia_popular: 'NAO_DISPONIVEL',
    };

    const via1 = getVia1Copy(apControlado);
    expect(via1.padronizado).toBe(true);
    expect(via1.controlado).toBe(true);
    expect(via1.textoControlado).toBe(
      'Este medicamento é controlado. A retirada ocorre apenas em unidades específicas, com receita de controle especial.',
    );
    expect(via1.documentosParaLevar.some((d) => d.includes('controle especial'))).toBe(true);
  });

  it('retorna literalmente o texto de NAO_CONSTA_REMUME quando fora da REMUME', () => {
    const apFora: Apresentacao = {
      id_apresentacao: 'ap-fora-1',
      descricao_dosagem: '10 mg comprimido',
      status_remume_cuiaba: 'NAO_CONSTA_REMUME',
      local_dispensacao_sus: 'NAO_APLICAVEL',
      farmacia_popular_gratuito: false,
      requisito_farmacia_popular: 'NAO_DISPONIVEL',
    };

    const via1 = getVia1Copy(apFora);
    expect(via1.padronizado).toBe(false);
    expect(via1.titulo).toBe('Não consta na lista da Prefeitura');
    expect(via1.texto).toBe(
      'Este item (ou esta dosagem) não consta na lista básica municipal. Isso não significa que você tenha de pagar: veja ao lado se é gratuito no Farmácia Popular ou pergunte na sua unidade sobre o Componente Especializado.',
    );
  });

  it('rejeita ALERTA_ABASTECIMENTO enquanto reservado na v1', () => {
    const apAlerta: Apresentacao = {
      id_apresentacao: 'ap-alerta-1',
      descricao_dosagem: '25 mg comprimido',
      status_remume_cuiaba: 'ALERTA_ABASTECIMENTO',
      local_dispensacao_sus: 'UBS',
      farmacia_popular_gratuito: false,
      requisito_farmacia_popular: 'NAO_DISPONIVEL',
    };

    expect(() => getVia1Copy(apAlerta)).toThrow(/ALERTA_ABASTECIMENTO/);
  });

  it('retorna literalmente os textos da Via 2 (Farmácia Popular) para item no elenco e fora do elenco', () => {
    const apGratuito: Apresentacao = {
      id_apresentacao: 'ap-fp-sim',
      descricao_dosagem: '50 mg comprimido',
      status_remume_cuiaba: 'PADRONIZADO_REMUME',
      local_dispensacao_sus: 'UBS',
      farmacia_popular_gratuito: true,
      requisito_farmacia_popular: 'PADRAO_RECEITA_DOCUMENTO',
    };

    const via2Sim = getVia2Copy(apGratuito);
    expect(via2Sim.gratuito).toBe(true);
    expect(via2Sim.titulo).toBe('Gratuito no Farmácia Popular');
    expect(via2Sim.texto).toBe(
      'Leve documento oficial com foto e receita médica válida. Confirme com a farmácia se o item está disponível hoje.',
    );
    expect(via2Sim.documentosParaLevar.length).toBeGreaterThanOrEqual(2);

    const apFralda: Apresentacao = {
      ...apGratuito,
      id_apresentacao: 'ap-fp-fralda',
      requisito_farmacia_popular: 'FRALDA_GERIATRICA',
    };

    const via2Fralda = getVia2Copy(apFralda);
    expect(via2Fralda.gratuito).toBe(true);
    expect(via2Fralda.documentosParaLevar).toContain(
      'Para fralda geriátrica: ter 60 anos ou mais ou ser pessoa com deficiência, e apresentar prescrição, laudo ou atestado médico indicando a necessidade, conforme as regras do programa',
    );

    const apFora: Apresentacao = {
      ...apGratuito,
      farmacia_popular_gratuito: false,
      requisito_farmacia_popular: 'NAO_DISPONIVEL',
    };

    const via2Nao = getVia2Copy(apFora);
    expect(via2Nao.gratuito).toBe(false);
    expect(via2Nao.titulo).toBe('Fora do Farmácia Popular');
    expect(via2Nao.texto).toBe('Este item não faz parte do Farmácia Popular.');
  });

  it('formata a faixa global de dado desatualizado e o texto do pino exatamente conforme a especificação', () => {
    expect(formatIsoDatePTBR('2026-01-10')).toBe('10/01/2026');
    expect(getStaleBannerCopy('2026-01-10')).toBe(
      'Os dados refletem a última publicação oficial verificada em 10/01/2026. Confirme na unidade ou na farmácia antes de sair de casa.',
    );
    expect(NORMATIVE_TEXTS.via2.PINO_E_CARTAO_FARMACIA).toBe(
      'Farmácia credenciada ao programa. A disponibilidade do item deve ser confirmada com a farmácia.',
    );
  });

  it('não contém afirmações proibidas pela skill busca-textos-saude em nenhum texto normativo', () => {
    const allTexts = JSON.stringify(NORMATIVE_TEXTS).toLowerCase();
    const forbidden = [
      'tem em estoque',
      'em estoque',
      'tem aqui',
      'garantido',
      'pode trocar por',
      'equivalente',
      'pode tomar',
    ];

    for (const term of forbidden) {
      expect(allTexts.includes(term)).toBe(false);
    }

    // "está disponível" só pode aparecer na oração condicional "se o item está disponível hoje"
    const withoutConditionalCheck = allTexts.replace('se o item está disponível hoje', '');
    expect(withoutConditionalCheck.includes('está disponível')).toBe(false);
  });
});
