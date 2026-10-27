import type { Medicamento } from '@/types/schema';

export interface ShareMedicationPayload {
  title: string;
  text: string;
  url: string;
  whatsappUrl: string;
}

export function buildMedicationDetailPath(slug: string): string {
  const cleanSlug = encodeURIComponent(slug.trim());
  return `/medicamento/${cleanSlug}/`;
}

/**
 * Gera os dados seguros de compartilhamento de um medicamento do catálogo.
 * NUNCA inclui texto livre digitado pelo usuário nem coordenadas de GPS:
 * usa estritamente os dados oficiais do catálogo (`principio_ativo`, `slug` e dosagens).
 */
export function gerarDadosCompartilhamentoMedicamento(params: {
  medicamento: Medicamento;
  origin?: string;
}): ShareMedicationPayload {
  const { medicamento, origin } = params;
  const relativePath = buildMedicationDetailPath(medicamento.slug);
  const cleanOrigin = origin ? origin.replace(/\/+$/, '') : '';
  const url = cleanOrigin ? `${cleanOrigin}${relativePath}` : relativePath;

  const dosagens = medicamento.apresentacoes.map((a) => a.descricao_dosagem).join(' | ');
  const title = `Onde Pego — ${medicamento.principio_ativo}`;
  const text = `Veja onde retirar ${medicamento.principio_ativo} (${dosagens}) em Cuiabá pelo SUS ou Farmácia Popular. Lembre-se de levar documento com foto e receita médica válida:`;

  const whatsappMessage = `${text} ${url}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

  return {
    title,
    text,
    url,
    whatsappUrl,
  };
}
