import type { Metadata } from 'next';
import { EstablishmentContactActions } from '@/components/ui/EstablishmentContactActions';
import { FreshnessBanner } from '@/components/ui/FreshnessBanner';
import {
  AlertTriangleIcon,
  BuildingSusIcon,
  CheckCircleIcon,
  MapPinIcon,
  NavigationIcon,
  XCircleIcon,
} from '@/components/ui/Icons';
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
  dataVerificacao?: string,
) {
  switch (status) {
    case 'NORMAL':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-[var(--r-chip)] border border-[var(--c-free)]/25 bg-[var(--c-free-tint)] px-3.5 py-1 font-display text-sm font-bold text-[var(--c-free)]">
          <CheckCircleIcon className="h-4 w-4 shrink-0" />
          <span>
            {dataVerificacao
              ? `Unidade cadastrada (dados verificados em ${dataVerificacao}) — confirme o atendimento por telefone`
              : 'Unidade cadastrada — confirme o atendimento por telefone'}
          </span>
        </span>
      );
    case 'CONTINGENCIA_PARCIAL':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-[var(--r-chip)] border border-[var(--c-attn-border)] bg-[var(--c-attn)] px-3.5 py-1 font-display text-base font-extrabold text-[var(--c-text)]">
          <AlertTriangleIcon className="h-4 w-4 shrink-0" />
          <span>Contingência parcial</span>
        </span>
      );
    case 'INTERDITADO':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-[var(--r-chip)] border border-[var(--c-alert)]/25 bg-[var(--c-alert-tint)] px-3.5 py-1 font-display text-base font-extrabold text-[var(--c-alert)]">
          <XCircleIcon className="h-4 w-4 shrink-0" />
          <span>Atendimento interditado</span>
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
                  className="ui-card p-5 sm:p-6"
                >
                  <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-start">
                    <div>
                      <span className="inline-flex items-center gap-1.5 rounded-[var(--r-chip)] border border-[var(--c-brand)]/25 bg-[var(--c-brand-tint)] px-3 py-0.5 font-display text-sm font-bold text-[var(--c-brand)]">
                        <BuildingSusIcon className="h-3.5 w-3.5" />
                        <span>
                          [{badge.code}] {badge.fullLabel}
                        </span>
                      </span>
                      <h3 className="mt-1.5 font-display text-2xl font-extrabold text-[var(--c-text)]">
                        {unidade.nome_fantasia}
                      </h3>
                      <p className="mt-0.5 inline-flex items-center gap-1.5 text-base font-bold text-[var(--c-brand)]">
                        <MapPinIcon className="h-4 w-4" />
                        <span>Bairro: {unidade.bairro}</span>
                      </p>
                    </div>

                    {renderStatusBadge(status_funcionamento, dataVerificada)}
                  </div>

                  {mensagem_contingencia && (
                    <div
                      role="alert"
                      className="mt-3.5 flex items-start gap-2 rounded-[var(--r-button)] border border-[var(--c-attn-border)] bg-[var(--c-attn)] p-3.5 text-base font-bold text-[var(--c-text)]"
                    >
                      <AlertTriangleIcon className="mt-0.5 h-5 w-5 shrink-0" />
                      <span>{mensagem_contingencia}</span>
                    </div>
                  )}

                  <p className="mt-3 text-base text-[var(--c-text)]">
                    <strong>Endereço:</strong> {unidade.endereco_completo}
                  </p>

                  <div className="mt-2.5">
                    <EstablishmentContactActions
                      telefone={unidade.telefone}
                      endereco={unidade.endereco_completo}
                      nomeFantasia={unidade.nome_fantasia}
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3 border-t border-[var(--c-border-subtle)] pt-3.5">
                    {!temCoordenadaValida ? (
                      <p className="rounded-[var(--r-button)] border border-[var(--c-border)] bg-[var(--c-surface)] px-3.5 py-2 text-base font-bold text-[var(--c-text-2)]">
                        Localização no mapa indisponível. Use o endereço acima.
                      </p>
                    ) : (
                      <a
                        href={gerarUrlRotaGoogleMaps(unidade.coordenadas, 'transit')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[var(--r-button)] bg-[var(--c-brand)] px-4 py-2 font-display text-lg font-bold text-white shadow-xs transition-opacity hover:opacity-95"
                      >
                        <NavigationIcon className="h-4 w-4" />
                        <span>Ver rota para {unidade.nome_fantasia}</span>
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Seção 2: Unidades de Dispensação de Medicamentos Controlados */}
        <section
          aria-labelledby="plantao-controlados-heading"
          className="ui-card-elevated space-y-4 p-5 sm:p-6"
        >
          <h2
            id="plantao-controlados-heading"
            className="font-display text-2xl font-extrabold text-[var(--c-text)]"
          >
            Retirada de medicamentos controlados (Portaria 344 / SUS Cuiabá)
          </h2>
          <p className="max-w-[65ch] text-base text-[var(--c-text-2)]">
            Medicamentos de controle especial padronizados na REMUME são dispensados apenas em
            unidades específicas, mediante apresentação de receita de controle especial válida e
            documento oficial com foto:
          </p>

          <ul className="mt-3 space-y-3.5">
            {unidadesControlados.map((u) => {
              const temCoordenadaValida = hasValidMapCoordinates(u);
              return (
                <li
                  key={u.id}
                  className="rounded-[var(--r-plate)] border border-[var(--c-border)] bg-[var(--c-bg)] p-4 sm:p-5"
                >
                  <h3 className="font-display text-xl font-extrabold text-[var(--c-text)]">
                    {u.nome_fantasia} ({u.bairro})
                  </h3>
                  <p className="mt-1 text-base text-[var(--c-text)]">{u.endereco_completo}</p>

                  <div className="mt-2.5">
                    <EstablishmentContactActions
                      telefone={u.telefone}
                      endereco={u.endereco_completo}
                      nomeFantasia={u.nome_fantasia}
                    />
                  </div>

                  <div className="mt-3.5">
                    {!temCoordenadaValida ? (
                      <p className="rounded-[var(--r-button)] border border-[var(--c-border)] bg-[var(--c-surface)] px-3.5 py-2 text-base font-bold text-[var(--c-text-2)]">
                        Localização no mapa indisponível. Use o endereço acima.
                      </p>
                    ) : (
                      <a
                        href={gerarUrlRotaGoogleMaps(u.coordenadas, 'transit')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[var(--r-button)] bg-[var(--c-brand)] px-4 py-2 font-display text-base font-bold text-white shadow-xs transition-opacity hover:opacity-95"
                      >
                        <NavigationIcon className="h-4 w-4" />
                        <span>Ver rota para {u.nome_fantasia}</span>
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Seção 3: Polos Municipais de Vacinação */}
        <section
          aria-labelledby="plantao-vacinacao-heading"
          className="ui-card space-y-4 p-5 sm:p-6"
        >
          <h2
            id="plantao-vacinacao-heading"
            className="font-display text-2xl font-extrabold text-[var(--c-text)]"
          >
            Polos de vacinação municipal ({polosVacinacao.length})
          </h2>
          <p className="max-w-[65ch] text-base text-[var(--c-text-2)]">
            Unidades com sala de vacinação ativa cadastrada na rede municipal (leve caderneta de
            vacinação e documento com foto):
          </p>

          <ul className="mt-3 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            {polosVacinacao.map((u) => {
              const temCoordenadaValida = hasValidMapCoordinates(u);
              return (
                <li
                  key={u.id}
                  className="flex flex-col justify-between rounded-[var(--r-plate)] border border-[var(--c-border)] bg-[var(--c-bg)] p-4"
                >
                  <div>
                    <span className="font-display text-sm font-bold text-[var(--c-brand)]">
                      [{getEstablishmentTypeBadge(u.tipo).code}] {u.bairro}
                    </span>
                    <h3 className="mt-0.5 font-display text-xl font-extrabold text-[var(--c-text)]">
                      {u.nome_fantasia}
                    </h3>
                    <p className="mt-1 text-base text-[var(--c-text)]">{u.endereco_completo}</p>

                    <div className="mt-2.5">
                      <EstablishmentContactActions
                        telefone={u.telefone}
                        endereco={u.endereco_completo}
                        nomeFantasia={u.nome_fantasia}
                      />
                    </div>
                  </div>
                  <div className="mt-3.5">
                    {!temCoordenadaValida ? (
                      <p className="rounded-[var(--r-button)] border border-[var(--c-border)] bg-[var(--c-surface)] px-3.5 py-2 text-base font-bold text-[var(--c-text-2)]">
                        Localização no mapa indisponível. Use o endereço acima.
                      </p>
                    ) : (
                      <a
                        href={gerarUrlRotaGoogleMaps(u.coordenadas, 'transit')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[var(--r-button)] border border-[var(--c-border)] bg-[var(--c-surface)] px-3.5 py-1.5 font-display text-base font-bold text-[var(--c-text)] hover:border-[var(--c-brand)] hover:text-[var(--c-brand)]"
                      >
                        <NavigationIcon className="h-4 w-4 text-[var(--c-brand)]" />
                        <span>Ver rota para {u.nome_fantasia}</span>
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <footer className="border-t border-[var(--c-border)] pt-4 text-base text-[var(--c-text-2)]">
          Fonte: Secretaria Municipal de Saúde de Cuiabá (SMS) • Publicação verificada em{' '}
          {dataVerificada}
        </footer>
      </main>
    </>
  );
}
