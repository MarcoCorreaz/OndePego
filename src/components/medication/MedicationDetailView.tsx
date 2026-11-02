'use client';

import React, { useState } from 'react';
import { CredenciadasSection } from '@/components/medication/CredenciadasSection';
import { MedicationDualCard } from '@/components/medication/MedicationDualCard';
import { MedicationStickyBar } from '@/components/medication/MedicationStickyBar';
import { findSelectedApresentacao, resolveInitialApresentacaoId } from '@/lib/dosageSelection';
import type { Estabelecimento, Medicamento, MetaDados } from '@/types/schema';

export interface MedicationDetailViewProps {
  medicamento: Medicamento;
  estabelecimentos: readonly Estabelecimento[];
  meta: MetaDados;
  controlledUnits: readonly Estabelecimento[];
}

export function MedicationDetailView({
  medicamento,
  estabelecimentos,
  meta,
  controlledUnits,
}: MedicationDetailViewProps) {
  const [selectedApresentacaoId, setSelectedApresentacaoId] = useState<string>(
    resolveInitialApresentacaoId(medicamento.apresentacoes),
  );

  const apresentacaoAtiva = findSelectedApresentacao(
    medicamento.apresentacoes,
    selectedApresentacaoId,
  );

  return (
    <div className="space-y-4 pb-40">
      {/* 1. Placas (MedicationDualCard) */}
      <MedicationDualCard
        medicamento={medicamento}
        meta={meta}
        selectedApresentacaoId={selectedApresentacaoId}
        onSelectApresentacao={setSelectedApresentacaoId}
        controlledUnits={controlledUnits}
      />

      {/* 2. Onde buscar (Abas + Mapa) */}
      {apresentacaoAtiva && (
        <CredenciadasSection
          estabelecimentos={estabelecimentos}
          meta={meta}
          apresentacaoAtiva={apresentacaoAtiva}
        />
      )}

      {/* 3. Barra de Ações Fixa posicionada logo acima da BottomNav (D4) */}
      {apresentacaoAtiva && (
        <MedicationStickyBar
          medicamento={medicamento}
          apresentacao={apresentacaoAtiva}
        />
      )}
    </div>
  );
}
