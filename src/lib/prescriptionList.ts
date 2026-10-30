import { formatIsoDatePTBR, getVia1Copy, getVia2Copy } from '@/lib/healthCopy';
import {
  getSafeSessionStorage,
  safeStorageGetItem,
  safeStorageRemoveItem,
  safeStorageSetItem,
} from '@/lib/safeStorage';
import type { Apresentacao, LocalDispensacaoSUS, Medicamento, MetaDados } from '@/types/schema';

export const PRESCRIPTION_STORAGE_KEY = 'onde_pego_minha_receita_v1';

export interface PrescriptionEntry {
  slug: string;
  id_apresentacao: string;
}

export interface PrescriptionSessionState {
  items: PrescriptionEntry[];
  checkedDocs: string[];
}

export const DEFAULT_PRESCRIPTION_SESSION: PrescriptionSessionState = {
  items: [],
  checkedDocs: [],
};

export interface ResolvedPrescriptionItem {
  slug: string;
  principio_ativo: string;
  id_apresentacao: string;
  descricao_dosagem: string;
  apresentacao: Apresentacao;
  localSusLabel: string;
}

export interface PrescriptionSummary {
  resolvedItems: ResolvedPrescriptionItem[];
  gratuitosFarmaciaPopular: ResolvedPrescriptionItem[];
  padronizadosSusCuiaba: ResolvedPrescriptionItem[];
  naoConstamNasListas: ResolvedPrescriptionItem[];
  checklistDocumentos: string[];
  whatsappText: string;
  whatsappUrl: string;
}

function isSameEntry(a: PrescriptionEntry, b: PrescriptionEntry): boolean {
  return (
    a.slug.trim().toLowerCase() === b.slug.trim().toLowerCase() &&
    a.id_apresentacao.trim() === b.id_apresentacao.trim()
  );
}

export function formatSusDispensationPlace(local: LocalDispensacaoSUS): string {
  switch (local) {
    case 'UBS':
      return 'Posto de saúde (UBS)';
    case 'POLICLINICA_PORTARIA344':
      return 'Policlínica / Farmácia polo (Controle Especial — Portaria 344)';
    case 'CEM_ESPECIALIDADES':
      return 'Centro de Especialidades Médicas (CEM)';
    case 'NAO_APLICAVEL':
      return 'Não aplicável na lista municipal';
    default:
      return 'Não aplicável na lista municipal';
  }
}

export function parsePrescriptionSession(
  raw: string | null | undefined,
): PrescriptionSessionState {
  if (!raw) {
    return { items: [], checkedDocs: [] };
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown> | null;
    if (!parsed || typeof parsed !== 'object') {
      return { items: [], checkedDocs: [] };
    }

    const items: PrescriptionEntry[] = [];
    if (Array.isArray(parsed.items)) {
      for (const entry of parsed.items) {
        if (
          entry &&
          typeof entry === 'object' &&
          typeof (entry as Record<string, unknown>).slug === 'string' &&
          typeof (entry as Record<string, unknown>).id_apresentacao === 'string'
        ) {
          const slug = String((entry as Record<string, unknown>).slug).trim();
          const id_apresentacao = String(
            (entry as Record<string, unknown>).id_apresentacao,
          ).trim();
          if (slug && id_apresentacao && !items.some((i) => isSameEntry(i, { slug, id_apresentacao }))) {
            items.push({ slug, id_apresentacao });
          }
        }
      }
    }

    const checkedDocs: string[] = [];
    if (Array.isArray(parsed.checkedDocs)) {
      for (const doc of parsed.checkedDocs) {
        if (typeof doc === 'string' && doc.trim().length > 0 && !checkedDocs.includes(doc)) {
          checkedDocs.push(doc);
        }
      }
    }

    return { items, checkedDocs };
  } catch {
    return { items: [], checkedDocs: [] };
  }
}

export function loadPrescriptionSession(
  storage?: Pick<Storage, 'getItem'> | null,
): PrescriptionSessionState {
  const target = storage !== undefined ? storage : getSafeSessionStorage();

  if (!target) {
    return { items: [], checkedDocs: [] };
  }

  const raw = safeStorageGetItem(target as Storage, PRESCRIPTION_STORAGE_KEY);
  return parsePrescriptionSession(raw);
}

export function savePrescriptionSession(
  state: PrescriptionSessionState,
  storage?: Pick<Storage, 'setItem'> | null,
): void {
  const target = storage !== undefined ? storage : getSafeSessionStorage();

  if (!target) {
    return;
  }

  safeStorageSetItem(target as Storage, PRESCRIPTION_STORAGE_KEY, JSON.stringify(state));
}

export function clearPrescriptionSession(
  storage?: Pick<Storage, 'removeItem'> | null,
): PrescriptionSessionState {
  const target = storage !== undefined ? storage : getSafeSessionStorage();

  if (target) {
    safeStorageRemoveItem(target as Storage, PRESCRIPTION_STORAGE_KEY);
  }

  return { items: [], checkedDocs: [] };
}

export function hasPrescriptionItem(
  state: PrescriptionSessionState,
  entry: PrescriptionEntry,
): boolean {
  return state.items.some((item) => isSameEntry(item, entry));
}

export function addPrescriptionItem(
  state: PrescriptionSessionState,
  entry: PrescriptionEntry,
): PrescriptionSessionState {
  const cleanSlug = entry.slug.trim();
  const cleanApresentacao = entry.id_apresentacao.trim();
  if (!cleanSlug || !cleanApresentacao) {
    return state;
  }

  if (hasPrescriptionItem(state, { slug: cleanSlug, id_apresentacao: cleanApresentacao })) {
    return state;
  }

  return {
    ...state,
    items: [...state.items, { slug: cleanSlug, id_apresentacao: cleanApresentacao }],
  };
}

export function removePrescriptionItem(
  state: PrescriptionSessionState,
  entry: PrescriptionEntry,
): PrescriptionSessionState {
  return {
    ...state,
    items: state.items.filter((item) => !isSameEntry(item, entry)),
  };
}

export function toggleCheckedDocument(
  state: PrescriptionSessionState,
  docText: string,
): PrescriptionSessionState {
  const cleanDoc = docText.trim();
  if (!cleanDoc) {
    return state;
  }

  const exists = state.checkedDocs.includes(cleanDoc);
  return {
    ...state,
    checkedDocs: exists
      ? state.checkedDocs.filter((d) => d !== cleanDoc)
      : [...state.checkedDocs, cleanDoc],
  };
}

/**
 * Agrupa os itens da Minha Receita em Farmácia Popular, SUS Cuiabá e Não Constam,
 * gera o checklist único desduplicado de documentos e monta o texto de resumo para WhatsApp
 * sem nunca prometer estoque físico.
 */
export function buildPrescriptionSummary(params: {
  entries: readonly PrescriptionEntry[];
  catalogo: readonly Medicamento[];
  meta: Pick<MetaDados, 'data_remume' | 'data_elenco_pfpb'>;
}): PrescriptionSummary {
  const { entries, catalogo, meta } = params;

  const resolvedItems: ResolvedPrescriptionItem[] = [];
  const docSet = new Set<string>();

  for (const entry of entries) {
    const med = catalogo.find(
      (m) => m.slug.trim().toLowerCase() === entry.slug.trim().toLowerCase(),
    );
    if (!med) continue;

    const ap = med.apresentacoes.find(
      (a) => a.id_apresentacao.trim() === entry.id_apresentacao.trim(),
    );
    if (!ap) continue;

    resolvedItems.push({
      slug: med.slug,
      principio_ativo: med.principio_ativo,
      id_apresentacao: ap.id_apresentacao,
      descricao_dosagem: ap.descricao_dosagem,
      apresentacao: ap,
      localSusLabel: formatSusDispensationPlace(ap.local_dispensacao_sus),
    });

    const via1 = getVia1Copy(ap);
    const via2 = getVia2Copy(ap);

    for (const d of via2.documentosParaLevar) {
      docSet.add(d);
    }
    for (const d of via1.documentosParaLevar) {
      docSet.add(d);
    }
  }

  const gratuitosFarmaciaPopular = resolvedItems.filter(
    (item) => item.apresentacao.farmacia_popular_gratuito,
  );

  const padronizadosSusCuiaba = resolvedItems.filter(
    (item) => item.apresentacao.status_remume_cuiaba === 'PADRONIZADO_REMUME',
  );

  const naoConstamNasListas = resolvedItems.filter(
    (item) =>
      !item.apresentacao.farmacia_popular_gratuito &&
      item.apresentacao.status_remume_cuiaba !== 'PADRONIZADO_REMUME',
  );

  const checklistDocumentos = Array.from(docSet);

  const lines: string[] = [
    '*Resumo da Minha Receita — Onde Pego (Cuiabá/MT)*',
    '',
  ];

  if (gratuitosFarmaciaPopular.length > 0) {
    lines.push('*1. Gratuitos nas Drogarias (Farmácia Popular):*');
    for (const item of gratuitosFarmaciaPopular) {
      lines.push(`- ${item.principio_ativo} (${item.descricao_dosagem})`);
    }
    lines.push('');
  }

  if (padronizadosSusCuiaba.length > 0) {
    lines.push('*2. Padronizados na Rede Municipal (SUS Cuiabá):*');
    for (const item of padronizadosSusCuiaba) {
      lines.push(
        `- ${item.principio_ativo} (${item.descricao_dosagem}) — Local: ${item.localSusLabel}`,
      );
    }
    lines.push('');
  }

  if (naoConstamNasListas.length > 0) {
    lines.push('*3. Não constam nas listas gratuitas consultadas:*');
    for (const item of naoConstamNasListas) {
      lines.push(`- ${item.principio_ativo} (${item.descricao_dosagem})`);
    }
    lines.push('');
  }

  if (checklistDocumentos.length > 0) {
    lines.push('*O que separar antes de sair de casa:*');
    for (const doc of checklistDocumentos) {
      lines.push(`[ ] ${doc}`);
    }
    lines.push('');
  }

  lines.push(
    `Lembrete: constar na lista não significa estoque físico na hora. Confirme por telefone antes de se deslocar.`,
  );
  lines.push(
    `Fontes oficiais verificadas em: REMUME Cuiabá (${formatIsoDatePTBR(meta.data_remume)}) | Elenco Farmácia Popular (${formatIsoDatePTBR(meta.data_elenco_pfpb)}).`,
  );

  const whatsappText = lines.join('\n');
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;

  return {
    resolvedItems,
    gratuitosFarmaciaPopular,
    padronizadosSusCuiaba,
    naoConstamNasListas,
    checklistDocumentos,
    whatsappText,
    whatsappUrl,
  };
}
