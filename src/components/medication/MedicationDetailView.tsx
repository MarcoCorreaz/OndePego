'use client';

import React, { useState } from 'react';
import { CredenciadasSection } from '@/components/medication/CredenciadasSection';
import { MedicationDualCard } from '@/components/medication/MedicationDualCard';
import { ShareMedicationButton } from '@/components/medication/ShareMedicationButton';
import { AddToPrescriptionButton } from '@/components/prescription/AddToPrescriptionButton';
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
    <div className="space-y-4">
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

      {/* 3. Compartilhar no WhatsApp numa linha única com botão de 48px + Salvar na Receita */}
      {apresentacaoAtiva && (
        <section
          aria-label="Ações para compartilhar ou salvar medicamento"
          className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--r-card)] border border-[var(--c-border)] bg-[var(--c-surface)] p-4 shadow-2xs sm:p-5"
        >
          <div className="flex flex-wrap items-center gap-3">
            <ShareMedicationButton medicamento={medicamento} compact />
          </div>

          <div className="flex items-center">
            <AddToPrescriptionButton
              medicamento={medicamento}
              apresentacao={apresentacaoAtiva}
            />
          </div>
        </section>
      )}
    </div>
  );
}
