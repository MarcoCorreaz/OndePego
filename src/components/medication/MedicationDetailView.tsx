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
    <div className="space-y-6">
      <MedicationDualCard
        medicamento={medicamento}
        meta={meta}
        selectedApresentacaoId={selectedApresentacaoId}
        onSelectApresentacao={setSelectedApresentacaoId}
        controlledUnits={controlledUnits}
      />

      {apresentacaoAtiva && (
        <>
          <section
            aria-label="Minha Receita"
            className="ui-card flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center"
          >
            <div>
              <h2 className="font-display text-xl font-extrabold text-[var(--c-text)]">
                Montando a lista da receita?
              </h2>
              <p className="text-sm text-[var(--c-text-2)]">
                Adicione a dosagem selecionada (<span className="font-bold text-[var(--c-text)]">{apresentacaoAtiva.descricao_dosagem}</span>) para juntar todos os remédios em um checklist único.
              </p>
            </div>
            <AddToPrescriptionButton medicamento={medicamento} apresentacao={apresentacaoAtiva} />
          </section>

          <section
            aria-label="Compartilhar informações deste medicamento"
            className="ui-card flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center"
          >
            <div>
              <h2 className="font-display text-xl font-extrabold text-[var(--c-text)]">
                Guardar ou enviar para um familiar
              </h2>
              <p className="text-sm text-[var(--c-text-2)]">
                Envie o resumo deste medicamento com as regras de retirada em Cuiabá.
              </p>
            </div>
            <ShareMedicationButton medicamento={medicamento} />
          </section>

          <CredenciadasSection
            estabelecimentos={estabelecimentos}
            meta={meta}
            apresentacaoAtiva={apresentacaoAtiva}
          />
        </>
      )}
    </div>
  );
}
