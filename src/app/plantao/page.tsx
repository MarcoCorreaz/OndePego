import type { Metadata } from 'next';
import { EstablishmentContactActions } from '@/components/ui/EstablishmentContactActions';
import { FreshnessBanner } from '@/components/ui/FreshnessBanner';
import { Icon } from '@/components/ui/Icon';
import {
  getControlledDispensationUnits,
  getEstablishmentTypeBadge,
  getPlantaoEstablishments,
  getVaccinationUnits,
} from '@/lib/establishmentsFilter';
import { gerarUrlRotaGoogleMaps, hasValidMapCoordinates } from '@/lib/geoEngine';
import { formatIsoDatePTBR } from '@/lib/healthCopy';
import type { Estabelecimento, MetaDados } from '@/types/schema';
import estabelecimentosJson from '../../../data/estabelecimentos.json';
import metaJson from '../../../data/meta.json';

const estabelecimentos = estabelecimentosJson as Estabelecimento[];
const meta = metaJson as MetaDados;

export const metadata: Metadata = {
  title: 'Plantão 24h (UPAs), Policlínicas e Vacinação — Onde Pego Cuiabá',
  description:
    'Acompanhe o status operacional das UPAs 24h, Policlínicas, unidades de dispensação de medicamentos controlados e polos de vacinação em Cuiabá/MT.',
};

function renderStatusBadge(
  status: Estabelecimento['atributos_operacionais']['status_funcionamento'],
) {
  switch (status) {
    case 'NORMAL':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--c-free)]/25 bg-[var(--c-free-tint)] px-3 py-1 font-display text-sm font-bold text-[var(--c-free-ink)]">
          <Icon name="check" className="h-4 w-4 shrink-0" />
          <span>Normal</span>
        </span>
      );
    case 'CONTINGENCIA_PARCIAL':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--c-attn-border)] bg-[var(--c-attn-tint)] px-3 py-1 font-display text-sm font-bold text-[var(--c-attn-ink)]">
          <Icon name="info" className="h-4 w-4 shrink-0" />
          <span>Contingência parcial</span>
        </span>
      );
    case 'INTERDITADO':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--c-alert)]/25 bg-[var(--c-alert-tint)] px-3 py-1 font-display text-sm font-bold text-[var(--c-alert)]">
          <Icon name="close" className="h-4 w-4 shrink-0" />
          <span>Interditada</span>
        </span>
      );
  }
}

export default function PlantaoPage() {
  const unidadesPlantao = getPlantaoEstablishments(estabelecimentos);
  const unidadesControlados = getControlledDispensationUnits(estabelecimentos);
  const polosVacinacao = getVaccinationUnits(estabelecimentos);
  const dataVerificada = formatIsoDatePTBR(meta.data_remume);

  return (
    <>
      <FreshnessBanner meta={meta} />
      <main id="conteudo-principal" className="mx-auto max-w-4xl space-y-8 px-4 py-6 sm:py-8">
        <header className="space-y-2">
          <h1 className="font-display text-3xl font-extrabold text-[var(--c-text)] sm:text-4xl">
            Plantão 24h, Policlínicas e Serviços Especiais
          </h1>
          <p className="max-w-[65ch] text-lg text-[var(--c-text-2)]">
            Consulte a situação operacional das UPAs e Policlínicas de Cuiabá, as unidades que
            dispensam medicamentos controlados e os polos de vacinação municipal.
          </p>
        </header>

        {/* Seção 1: UPAs e Policlínicas (Plantão e Urgência) */}
        <section aria-labelledby="plantao-urgencia-heading" className="space-y-4">
          <h2
            id="plantao-urgencia-heading"
            className="font-display text-2xl font-extrabold text-[var(--c-text)]"
          >
            UPAs 24h e Policlínicas Municipais ({unidadesPlantao.length})
          </h2>

          <ul className="space-y-4">
            {unidadesPlantao.map((unidade) => {
              const badge = getEstablishmentTypeBadge(unidade.tipo);
              const { status_funcionamento, mensagem_contingencia } =
                unidade.atributos_operacionais;
              const temCoordenadaValida = hasValidMapCoordinates(unidade);

              return (
                <li
                  key={unidade.id}
                  className="rounded-[var(--r-card)] border border-[var(--c-border)] bg-[var(--c-surface)] p-5 shadow-2xs sm:p-6"
                >
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full border border-[var(--c-border)] bg-[var(--c-bg)] px-2.5 py-0.5 text-xs font-bold text-[var(--c-text)]">
                          <Icon name="cross" className="h-3.5 w-3.5 text-[var(--c-brand)]" />
                          <span>{badge.shortLabel}</span>
                        </span>
                        {renderStatusBadge(status_funcionamento)}
                      </div>

                      <h3 className="font-display text-xl font-black text-[var(--c-text)] sm:text-2xl">
                        {unidade.nome_fantasia}
                      </h3>
                      <p className="text-base text-[var(--c-text-2)]">
                        <strong>Bairro:</strong> {unidade.bairro} • {unidade.endereco_completo}
                      </p>
                    </div>

                    {temCoordenadaValida && (
                      <a
                        href={gerarUrlRotaGoogleMaps(unidade.coordenadas)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ui-pressable inline-flex min-h-[48px] shrink-0 items-center justify-center gap-2 rounded-[var(--r-button)] bg-[var(--c-brand)] px-4 py-2 font-display text-base font-bold text-white shadow-xs hover:opacity-95 active:scale-[0.98]"
                      >
                        <Icon name="pin" className="h-4 w-4" />
                        <span>Ver rota</span>
                      </a>
                    )}
                  </div>

                  {/* Mensagem de contingência existente mantida */}
                  {status_funcionamento !== 'NORMAL' && mensagem_contingencia && (
                    <div
                      role="note"
                      className="mt-3.5 rounded-[var(--r-button)] border border-[var(--c-attn-border)] bg-[var(--c-attn-tint)] p-3.5 text-base font-bold text-[var(--c-attn-ink)]"
                    >
                      <p className="flex items-start gap-2">
                        <Icon name="info" className="mt-0.5 h-5 w-5 shrink-0" />
                        <span>{mensagem_contingencia}</span>
                      </p>
                    </div>
                  )}

                  <div className="mt-4 border-t border-[var(--c-border-subtle)] pt-3.5">
                    <EstablishmentContactActions
                      telefone={unidade.telefone}
                      endereco={unidade.endereco_completo}
                      nomeFantasia={unidade.nome_fantasia}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Seção 2: Unidades de Dispensação de Medicamentos Controlados */}
        <section aria-labelledby="controlados-heading" className="space-y-4">
          <div className="space-y-1">
            <h2
              id="controlados-heading"
              className="font-display text-2xl font-extrabold text-[var(--c-text)]"
            >
              Farmácias de Medicamentos Controlados / Psicotrópicos ({unidadesControlados.length})
            </h2>
            <p className="max-w-[65ch] text-base text-[var(--c-text-2)]">
              Medicamentos de controle especial (receita azul ou branca especial) são dispensados
              apenas nas farmácias de referência da rede municipal de Cuiabá:
            </p>
          </div>

          <ul className="space-y-3">
            {unidadesControlados.map((unidade) => {
              const temCoordenada = hasValidMapCoordinates(unidade);
              return (
                <li
                  key={unidade.id}
                  className="rounded-[var(--r-card)] border border-[var(--c-border)] bg-[var(--c-surface)] p-4 shadow-2xs sm:p-5"
                >
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full border border-[var(--c-brand)]/20 bg-[var(--c-brand-tint)] px-2.5 py-0.5 text-xs font-bold text-[var(--c-brand)]">
                          <Icon name="doc" className="h-3.5 w-3.5" />
                          <span>Dispensação de Controlados</span>
                        </span>
                      </div>
                      <h3 className="font-display text-lg font-black text-[var(--c-text)] sm:text-xl">
                        {unidade.nome_fantasia}
                      </h3>
                      <p className="text-base text-[var(--c-text-2)]">
                        {unidade.bairro} — {unidade.endereco_completo}
                      </p>
                    </div>

                    {temCoordenada && (
                      <a
                        href={gerarUrlRotaGoogleMaps(unidade.coordenadas)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ui-pressable inline-flex min-h-[48px] shrink-0 items-center justify-center gap-2 rounded-[var(--r-button)] border border-[var(--c-border)] bg-[var(--c-bg)] px-3.5 py-2 font-display text-base font-bold text-[var(--c-text)] hover:bg-[var(--c-bg-soft)] active:scale-[0.98]"
                      >
                        <Icon name="pin" className="h-4 w-4" />
                        <span>Ver rota</span>
                      </a>
                    )}
                  </div>

                  <div className="mt-3 border-t border-[var(--c-border-subtle)] pt-2.5">
                    <EstablishmentContactActions
                      telefone={unidade.telefone}
                      endereco={unidade.endereco_completo}
                      nomeFantasia={unidade.nome_fantasia}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Seção 3: Polos de Vacinação */}
        <section aria-labelledby="vacinacao-heading" className="space-y-4">
          <div className="space-y-1">
            <h2
              id="vacinacao-heading"
              className="font-display text-2xl font-extrabold text-[var(--c-text)]"
            >
              Polos e Salas de Vacinação ({polosVacinacao.length})
            </h2>
            <p className="max-w-[65ch] text-base text-[var(--c-text-2)]">
              Unidades públicas com sala de vacinas ativa para atualização da caderneta infantil e
              do adulto pelo SUS em Cuiabá:
            </p>
          </div>

          <ul className="space-y-3">
            {polosVacinacao.map((unidade) => {
              const temCoordenada = hasValidMapCoordinates(unidade);
              return (
                <li
                  key={unidade.id}
                  className="rounded-[var(--r-card)] border border-[var(--c-border)] bg-[var(--c-surface)] p-4 shadow-2xs sm:p-5"
                >
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full border border-[var(--c-free)]/20 bg-[var(--c-free-tint)] px-2.5 py-0.5 text-xs font-bold text-[var(--c-free-ink)]">
                          <Icon name="check" className="h-3.5 w-3.5" />
                          <span>Sala de Vacinas Ativa</span>
                        </span>
                      </div>
                      <h3 className="font-display text-lg font-black text-[var(--c-text)] sm:text-xl">
                        {unidade.nome_fantasia}
                      </h3>
                      <p className="text-base text-[var(--c-text-2)]">
                        {unidade.bairro} — {unidade.endereco_completo}
                      </p>
                    </div>

                    {temCoordenada && (
                      <a
                        href={gerarUrlRotaGoogleMaps(unidade.coordenadas)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ui-pressable inline-flex min-h-[48px] shrink-0 items-center justify-center gap-2 rounded-[var(--r-button)] border border-[var(--c-border)] bg-[var(--c-bg)] px-3.5 py-2 font-display text-base font-bold text-[var(--c-text)] hover:bg-[var(--c-bg-soft)] active:scale-[0.98]"
                      >
                        <Icon name="pin" className="h-4 w-4" />
                        <span>Ver rota</span>
                      </a>
                    )}
                  </div>

                  <div className="mt-3 border-t border-[var(--c-border-subtle)] pt-2.5">
                    <EstablishmentContactActions
                      telefone={unidade.telefone}
                      endereco={unidade.endereco_completo}
                      nomeFantasia={unidade.nome_fantasia}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <footer className="border-t border-[var(--c-border)] pt-4 text-sm text-[var(--c-text-2)]">
          <p>
            Situação das unidades baseada nas listas municipais verificadas em {dataVerificada}.
            Ligue para confirmar o atendimento antes do deslocamento.
          </p>
        </footer>
      </main>
    </>
  );
}
