import type { Metadata } from 'next';
import { FreshnessBanner } from '@/components/ui/FreshnessBanner';
import {
  getControlledDispensationUnits,
  getEstablishmentTypeBadge,
  getPlantaoEstablishments,
  getVaccinationUnits,
} from '@/lib/establishmentsFilter';
import { gerarUrlRotaGoogleMaps } from '@/lib/geoEngine';
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
        <span className="inline-flex items-center gap-1.5 rounded border-2 border-[var(--c-free)] bg-[var(--c-free-tint)] px-3 py-1 font-display text-base font-extrabold text-[var(--c-free)]">
          <span aria-hidden="true">✓</span>
          <span>Atendimento normal</span>
        </span>
      );
    case 'CONTINGENCIA_PARCIAL':
      return (
        <span className="inline-flex items-center gap-1.5 rounded border-2 border-[var(--c-border)] bg-[var(--c-attn)] px-3 py-1 font-display text-base font-extrabold text-[var(--c-text)]">
          <span aria-hidden="true">⚠</span>
          <span>Contingência parcial</span>
        </span>
      );
    case 'INTERDITADO':
      return (
        <span className="inline-flex items-center gap-1.5 rounded border-2 border-[var(--c-alert)] bg-[var(--c-alert-tint)] px-3 py-1 font-display text-base font-extrabold text-[var(--c-alert)]">
          <span aria-hidden="true">✕</span>
          <span>Atendimento interditado</span>
        </span>
      );
  }
}

export default function PlantaoPage() {
  const unidadesPlantao = getPlantaoEstablishments(estabelecimentos);
  const unidadesControlados = getControlledDispensationUnits(estabelecimentos);
  const polosVacinacao = getVaccinationUnits(estabelecimentos);

  return (
    <>
      <FreshnessBanner meta={meta} />
      <main id="conteudo-principal" className="mx-auto max-w-4xl space-y-8 px-4 py-6">
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

              return (
                <li
                  key={unidade.id}
                  className="rounded-[var(--r-plate)] border-2 border-[var(--c-border)] bg-[var(--c-bg)] p-4 sm:p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <span className="inline-block rounded border border-[var(--c-border)] bg-[var(--c-brand-tint)] px-2.5 py-0.5 font-display text-sm font-bold text-[var(--c-brand)]">
                        [{badge.code}] {badge.fullLabel}
                      </span>
                      <h3 className="mt-1 font-display text-2xl font-extrabold text-[var(--c-text)]">
                        {unidade.nome_fantasia}
                      </h3>
                      <p className="text-base font-bold text-[var(--c-brand)]">
                        Bairro: {unidade.bairro}
                      </p>
                    </div>

                    {renderStatusBadge(status_funcionamento)}
                  </div>

                  {mensagem_contingencia && (
                    <div
                      role="alert"
                      className="mt-3 rounded-[var(--r-plate)] border-2 border-[var(--c-border)] bg-[var(--c-attn)] p-3.5 text-base font-bold text-[var(--c-text)]"
                    >
                      <span aria-hidden="true">⚠ </span>
                      <span>{mensagem_contingencia}</span>
                    </div>
                  )}

                  <p className="mt-3 text-base text-[var(--c-text)]">
                    <strong>Endereço:</strong> {unidade.endereco_completo}
                  </p>

                  {unidade.telefone && (
                    <p className="mt-1 text-base text-[var(--c-text)]">
                      <strong>Telefone:</strong> {unidade.telefone}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-3 border-t-2 border-[var(--c-border-subtle)] pt-3">
                    <a
                      href={gerarUrlRotaGoogleMaps(unidade.coordenadas, 'transit')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-[48px] items-center justify-center rounded-[var(--r-button)] border-2 border-[var(--c-border)] bg-[var(--c-brand)] px-4 py-2 font-display text-lg font-bold text-white"
                    >
                      Ver rota para {unidade.nome_fantasia}
                    </a>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Seção 2: Unidades de Dispensação de Medicamentos Controlados */}
        <section
          aria-labelledby="plantao-controlados-heading"
          className="space-y-3 rounded-[var(--r-plate)] border-2 border-[var(--c-border)] bg-[var(--c-bg-soft)] p-5"
        >
          <h2
            id="plantao-controlados-heading"
            className="font-display text-2xl font-extrabold text-[var(--c-text)]"
          >
            Retirada de medicamentos controlados (Portaria 344 / SUS Cuiabá)
          </h2>
          <p className="max-w-[65ch] text-base text-[var(--c-text)]">
            Medicamentos de controle especial padronizados na REMUME são dispensados apenas em
            unidades específicas, mediante apresentação de receita de controle especial válida e
            documento oficial com foto:
          </p>

          <ul className="mt-3 space-y-3">
            {unidadesControlados.map((u) => (
              <li
                key={u.id}
                className="rounded-[var(--r-plate)] border-2 border-[var(--c-border)] bg-[var(--c-bg)] p-4"
              >
                <h3 className="font-display text-xl font-extrabold text-[var(--c-text)]">
                  {u.nome_fantasia} ({u.bairro})
                </h3>
                <p className="mt-1 text-base text-[var(--c-text)]">{u.endereco_completo}</p>
                <div className="mt-3">
                  <a
                    href={gerarUrlRotaGoogleMaps(u.coordenadas, 'transit')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[48px] items-center justify-center rounded-[var(--r-button)] border-2 border-[var(--c-border)] bg-[var(--c-brand)] px-4 py-2 font-display text-base font-bold text-white"
                  >
                    Ver rota para {u.nome_fantasia}
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Seção 3: Polos Municipais de Vacinação */}
        <section
          aria-labelledby="plantao-vacinacao-heading"
          className="space-y-3 rounded-[var(--r-plate)] border-2 border-[var(--c-border)] bg-[var(--c-bg)] p-5"
        >
          <h2
            id="plantao-vacinacao-heading"
            className="font-display text-2xl font-extrabold text-[var(--c-text)]"
          >
            Polos de vacinação municipal ({polosVacinacao.length})
          </h2>
          <p className="max-w-[65ch] text-base text-[var(--c-text)]">
            Unidades com sala de vacinação ativa cadastrada na rede municipal (leve caderneta de
            vacinação e documento com foto):
          </p>

          <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {polosVacinacao.map((u) => (
              <li
                key={u.id}
                className="flex flex-col justify-between rounded-[var(--r-plate)] border-2 border-[var(--c-border-subtle)] bg-[var(--c-bg-soft)] p-4"
              >
                <div>
                  <span className="font-display text-sm font-bold text-[var(--c-brand)]">
                    [{getEstablishmentTypeBadge(u.tipo).code}] {u.bairro}
                  </span>
                  <h3 className="font-display text-xl font-extrabold text-[var(--c-text)]">
                    {u.nome_fantasia}
                  </h3>
                  <p className="mt-1 text-base text-[var(--c-text)]">{u.endereco_completo}</p>
                </div>
                <div className="mt-3">
                  <a
                    href={gerarUrlRotaGoogleMaps(u.coordenadas, 'transit')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[48px] items-center justify-center rounded-[var(--r-button)] border-2 border-[var(--c-border)] bg-[var(--c-bg)] px-3 py-1.5 font-display text-base font-bold text-[var(--c-text)]"
                  >
                    Ver rota para {u.nome_fantasia}
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <footer className="border-t-2 border-[var(--c-border-subtle)] pt-4 text-base text-[var(--c-text-2)]">
          Fonte: Secretaria Municipal de Saúde de Cuiabá (SMS) • Publicação verificada em{' '}
          {formatIsoDatePTBR(meta.data_remume)}
        </footer>
      </main>
    </>
  );
}
