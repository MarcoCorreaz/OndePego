import type { Apresentacao } from '@/types/schema';

/**
 * Textos normativos literais (skill `busca-textos-saude` e DAS v1.2, seção 6).
 * NÃO alterar sem revisão e aprovação explícita do responsável pelo projeto.
 */
export const NORMATIVE_TEXTS = {
  via1: {
    PADRONIZADO_REMUME: {
      titulo: 'Consta na lista da Prefeitura (REMUME)',
      explicacaoPadronizado: 'Padronizado — consta na lista da Prefeitura',
      texto:
        'Este medicamento faz parte da lista de medicamentos essenciais da rede municipal de Cuiabá. A retirada é feita nas unidades de saúde, com consulta e receita médica, e depende do estoque da unidade no dia. O depósito central (CDMIC) não atende ao público.',
    },
    NAO_CONSTA_REMUME: {
      titulo: 'Não consta na lista da Prefeitura',
      texto:
        'Este item (ou esta dosagem) não consta na lista básica municipal. Isso não significa que você tenha de pagar: veja ao lado se é gratuito no Farmácia Popular ou pergunte na sua unidade sobre o Componente Especializado.',
    },
    CONTROLADO_ADICIONAL:
      'Este medicamento é controlado. A retirada ocorre apenas em unidades específicas, com receita de controle especial.',
  },
  via2: {
    NO_ELENCO: {
      titulo: 'Gratuito no Farmácia Popular',
      texto:
        'Leve documento oficial com foto e receita médica válida. Confirme com a farmácia se o item está disponível hoje.',
    },
    FORA_DO_ELENCO: {
      titulo: 'Fora do Farmácia Popular',
      texto: 'Este item não faz parte do Farmácia Popular.',
    },
    PINO_E_CARTAO_FARMACIA:
      'Farmácia credenciada ao programa. A disponibilidade do item deve ser confirmada com a farmácia.',
    FRALDA_GERIATRICA_REQUISITO:
      'Para fralda geriátrica: ter 60 anos ou mais ou ser pessoa com deficiência, e apresentar prescrição, laudo ou atestado médico indicando a necessidade, conforme as regras do programa',
  },
  avisoIndependencia:
    'O Onde Pego é um projeto independente de tecnologia cívica que usa dados abertos públicos. Não tem vínculo com a Prefeitura de Cuiabá, o SUS ou o Ministério da Saúde. Nenhum medicamento é entregue sem avaliação e receita médica.',
  privacidadeResumo:
    'Não pedimos seu nome, CPF, receita nem localização para uma conta. O que você digita na busca fica no seu aparelho. Se você tocar em "perto de mim", sua posição é usada só no aparelho para ordenar as farmácias e não é enviada a ninguém. Links compartilhados trazem o nome do medicamento na página.',
} as const;

export interface Via1ResolvedCopy {
  padronizado: boolean;
  controlado: boolean;
  titulo: string;
  explicacaoPadronizado?: string;
  texto: string;
  textoControlado?: string;
  notaEspecificaCuiaba?: string;
  documentosParaLevar: string[];
}

export interface Via2ResolvedCopy {
  gratuito: boolean;
  titulo: string;
  texto: string;
  documentosParaLevar: string[];
}

/**
 * Formata uma data ISO `AAAA-MM-DD` para o padrão brasileiro `DD/MM/AAAA`.
 */
export function formatIsoDatePTBR(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) {
    return isoDate;
  }
  return `${match[3]}/${match[2]}/${match[1]}`;
}

/**
 * Gera o texto literal da faixa global de atualização (`DADO_DESATUALIZADO`, DAS 6.4).
 */
export function getStaleBannerCopy(isoDate: string): string {
  const formatted = formatIsoDatePTBR(isoDate);
  return `Os dados refletem a última publicação oficial verificada em ${formatted}. Confirme na unidade ou na farmácia antes de sair de casa.`;
}

/**
 * Seleciona os textos normativos e a lista de documentos da Via 1 (SUS Cuiabá)
 * para uma apresentação de medicamento.
 */
export function getVia1Copy(apresentacao: Apresentacao): Via1ResolvedCopy {
  if (apresentacao.status_remume_cuiaba === 'ALERTA_ABASTECIMENTO') {
    throw new Error(
      'ALERTA_ABASTECIMENTO está reservado e desligado na v1 até existir fonte oficial de estoque.',
    );
  }

  if (apresentacao.status_remume_cuiaba === 'PADRONIZADO_REMUME') {
    const controlado = apresentacao.local_dispensacao_sus === 'POLICLINICA_PORTARIA344';

    const documentosParaLevar = controlado
      ? [
          'Receita de controle especial válida (em duas vias, dentro do prazo legal)',
          'Documento oficial com foto e Cartão Nacional de Saúde (Cartão do SUS)',
        ]
      : [
          'Receita médica válida',
          'Documento oficial com foto e Cartão Nacional de Saúde (Cartão do SUS)',
        ];

    return {
      padronizado: true,
      controlado,
      titulo: NORMATIVE_TEXTS.via1.PADRONIZADO_REMUME.titulo,
      explicacaoPadronizado: NORMATIVE_TEXTS.via1.PADRONIZADO_REMUME.explicacaoPadronizado,
      texto: NORMATIVE_TEXTS.via1.PADRONIZADO_REMUME.texto,
      ...(controlado ? { textoControlado: NORMATIVE_TEXTS.via1.CONTROLADO_ADICIONAL } : {}),
      ...(apresentacao.nota_especifica_cuiaba
        ? { notaEspecificaCuiaba: apresentacao.nota_especifica_cuiaba }
        : {}),
      documentosParaLevar,
    };
  }

  return {
    padronizado: false,
    controlado: false,
    titulo: NORMATIVE_TEXTS.via1.NAO_CONSTA_REMUME.titulo,
    texto: NORMATIVE_TEXTS.via1.NAO_CONSTA_REMUME.texto,
    ...(apresentacao.nota_especifica_cuiaba
      ? { notaEspecificaCuiaba: apresentacao.nota_especifica_cuiaba }
      : {}),
    documentosParaLevar: [],
  };
}

/**
 * Seleciona os textos normativos e a lista de documentos da Via 2 (Farmácia Popular)
 * para uma apresentação de medicamento.
 */
export function getVia2Copy(apresentacao: Apresentacao): Via2ResolvedCopy {
  if (!apresentacao.farmacia_popular_gratuito) {
    return {
      gratuito: false,
      titulo: NORMATIVE_TEXTS.via2.FORA_DO_ELENCO.titulo,
      texto: NORMATIVE_TEXTS.via2.FORA_DO_ELENCO.texto,
      documentosParaLevar: [],
    };
  }

  const documentosParaLevar: string[] = [
    'Documento oficial com foto e número do CPF',
    'Receita médica válida (do SUS ou particular), dentro do prazo de validade',
  ];

  if (apresentacao.requisito_farmacia_popular === 'FRALDA_GERIATRICA') {
    documentosParaLevar.push(NORMATIVE_TEXTS.via2.FRALDA_GERIATRICA_REQUISITO);
  } else if (apresentacao.requisito_farmacia_popular === 'DIGNIDADE_MENSTRUAL') {
    documentosParaLevar.push(
      'Para absorvente (Dignidade Menstrual): autorização emitida no Meu SUS Digital, conforme regras do programa',
    );
  }

  return {
    gratuito: true,
    titulo: NORMATIVE_TEXTS.via2.NO_ELENCO.titulo,
    texto: NORMATIVE_TEXTS.via2.NO_ELENCO.texto,
    documentosParaLevar,
  };
}
