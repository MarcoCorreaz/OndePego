'use client';

import React, { useState } from 'react';
import { CredenciadasSection } from '@/components/medication/CredenciadasSection';
import { MedicationDualCard } from '@/components/medication/MedicationDualCard';
import { ShareMedicationButton } from '@/components/medication/ShareMedicationButton';
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
    medicamento.apresentacoes[0]?.id_apresentacao ?? '',
  );

  const apresentacaoAtiva =
    medicamento.apresentacoes.find((a) => a.id_apresentacao === selectedApresentacaoId) ??
    medicamento.apresentacoes[0];

  return (
    <div className="space-y-6">
      <MedicationDualCard
        medicamento={medicamento}
        meta={meta}
        selectedApresentacaoId={selectedApresentacaoId}
        onSelectApresentacao={setSelectedApresentacaoId}
        controlledUnits={controlledUnits}
      />

      <section
        aria-label="Compartilhar informações deste medicamento"
        className="rounded-[var(--r-plate)] border-2 border-[var(--c-border)] bg-[var(--c-bg)] p-4"
      >
        <h2 className="mb-3 font-display text-xl font-bold text-[var(--c-text)]">
          Guardar ou enviar para um familiar:
        </h2>
        <ShareMedicationButton medicamento={medicamento} />
      </section>

      <CredenciadasSection
        estabelecimentos={estabelecimentos}
        meta={meta}
        apresentacaoAtiva={apresentacaoAtiva}
      />
    </div>
  );
}
