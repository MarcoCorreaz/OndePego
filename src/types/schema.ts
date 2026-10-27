import { z } from 'zod';

// Caixa provisória de Cuiabá + Várzea Grande. Ajustar ao extrair o mapa e conferir no mapa.
export const GEO_BBOX = { minLat: -15.85, maxLat: -15.35, minLng: -56.35, maxLng: -55.80 };

export const StatusRemume = z.enum([
  'PADRONIZADO_REMUME',
  'NAO_CONSTA_REMUME',
  'ALERTA_ABASTECIMENTO', // reservado: rejeitado enquanto a flag de estoque estiver desligada
]);

export const LocalDispensacaoSUS = z.enum([
  'UBS',
  'POLICLINICA_PORTARIA344',
  'CEM_ESPECIALIDADES',
  'NAO_APLICAVEL',
]);

// Renomeado de PADRAO_RECEITA_CPF: a exigência de CPF não foi confirmada na fonte oficial.
export const RequisitoFarmaciaPopular = z.enum([
  'PADRAO_RECEITA_DOCUMENTO',
  'FRALDA_GERIATRICA',
  'DIGNIDADE_MENSTRUAL',
  'NAO_DISPONIVEL',
]);

export const ApresentacaoMedicamento = z
  .object({
    id_apresentacao: z.string().min(1),
    descricao_dosagem: z.string().min(1),
    status_remume_cuiaba: StatusRemume,
    local_dispensacao_sus: LocalDispensacaoSUS,
    nota_especifica_cuiaba: z.string().optional(),
    farmacia_popular_gratuito: z.boolean(),
    requisito_farmacia_popular: RequisitoFarmaciaPopular,
  })
  .refine(
    (a) => a.farmacia_popular_gratuito || a.requisito_farmacia_popular === 'NAO_DISPONIVEL',
    { message: 'Item fora do Farmácia Popular deve ter requisito NAO_DISPONIVEL' },
  );

export const MedicamentoCatalogo = z.object({
  slug: z.string().min(1),
  id_dcb: z.string().optional(),
  codigo_atc: z.string().optional(),
  principio_ativo: z.string().min(1),
  nomes_comerciais: z.array(z.string()),
  termos_populares: z.array(z.string()),
  apresentacoes: z.array(ApresentacaoMedicamento).min(1),
  __fixture: z.boolean().optional(),
});

export const Coordenadas = z
  .object({
    lat: z.number(),
    lng: z.number(),
    auditado_manualmente: z.boolean(),
  })
  .refine(
    (c) =>
      c.lat >= GEO_BBOX.minLat &&
      c.lat <= GEO_BBOX.maxLat &&
      c.lng >= GEO_BBOX.minLng &&
      c.lng <= GEO_BBOX.maxLng,
    { message: 'Coordenada fora da caixa geográfica de Cuiabá/Várzea Grande' },
  );

export const EstabelecimentoSaude = z.object({
  id: z.string().min(1),
  nome_fantasia: z.string().min(1),
  tipo: z.enum(['FARMACIA_POPULAR', 'UBS', 'POLICLINICA', 'UPA']),
  bairro: z.string().min(1),
  endereco_completo: z.string().min(1),
  telefone: z.string().optional(),
  coordenadas: Coordenadas,
  atributos_operacionais: z.object({
    credenciamento_pfpb_ativo: z.boolean().optional(),
    dispensa_psicotropicos_sus: z.boolean().optional(),
    polo_vacinacao_municipal: z.boolean().optional(),
    status_funcionamento: z.enum(['NORMAL', 'CONTINGENCIA_PARCIAL', 'INTERDITADO']),
    mensagem_contingencia: z.string().optional(),
  }),
  __fixture: z.boolean().optional(),
});

export const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
  message: 'Data deve estar no formato ISO AAAA-MM-DD',
});

export const Meta = z.object({
  versao: z.string(),
  data_remume: IsoDate,
  data_elenco_pfpb: IsoDate,
  data_infoms: IsoDate,
  ultima_verificacao_ci: IsoDate,
  limite_dias_desatualizado: z.number().int().positive().default(45),
  flags: z.object({ estoque_oficial: z.boolean().default(false) }),
  __fixture: z.boolean().optional(),
});

export const MedicamentosFile = z.array(MedicamentoCatalogo);
export const EstabelecimentosFile = z.array(EstabelecimentoSaude);

export type Medicamento = z.infer<typeof MedicamentoCatalogo>;
export type Apresentacao = z.infer<typeof ApresentacaoMedicamento>;
export type Estabelecimento = z.infer<typeof EstabelecimentoSaude>;
export type MetaDados = z.infer<typeof Meta>;
