import type { Metadata } from 'next';
import { FreshnessBanner } from '@/components/ui/FreshnessBanner';
import { Icon } from '@/components/ui/Icon';
import { NORMATIVE_TEXTS, formatIsoDatePTBR } from '@/lib/healthCopy';
import type { MetaDados } from '@/types/schema';
import metaJson from '../../../data/meta.json';

const meta = metaJson as MetaDados;

export const metadata: Metadata = {
  title: 'Sobre, Fontes Oficiais e Privacidade — Onde Pego',
  description:
    'Conheça as fontes públicas de dados, a política de privacidade (LGPD) e o aviso de independência do projeto Onde Pego em Cuiabá/MT.',
};

export default function SobrePage() {
  return (
    <>
      <FreshnessBanner meta={meta} />
      <main id="conteudo-principal" className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:py-8">
        <header className="space-y-2">
          <h1 className="font-display text-3xl font-extrabold text-[var(--c-text)] sm:text-4xl">
            Sobre o Onde Pego, fontes e privacidade
          </h1>
          <p className="max-w-[65ch] text-lg text-[var(--c-text-2)]">
            Transparência sobre de onde vêm as informações, como protegemos sua privacidade e como
            avisar se encontrar algum endereço desatualizado.
          </p>
        </header>

        {/* 1. Aviso de independência (visível, não recolhido) */}
        <section
          aria-labelledby="sobre-independencia-heading"
          className="rounded-[var(--r-card)] border border-[var(--c-border)] bg-[var(--c-surface)] p-5 shadow-2xs sm:p-6"
        >
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] bg-[var(--c-brand-tint)] text-[var(--c-brand)]">
              <Icon name="check" className="h-5 w-5" />
            </span>
            <h2
              id="sobre-independencia-heading"
              className="font-display text-2xl font-black text-[var(--c-text)]"
            >
              Projeto independente de utilidade pública
            </h2>
          </div>
          <p className="mt-3 max-w-[65ch] text-base leading-relaxed text-[var(--c-text)]">
            {NORMATIVE_TEXTS.avisoIndependencia}
          </p>
        </section>

        {/* 2. Origem e data de cada fonte oficial */}
        <section
          aria-labelledby="sobre-fontes-heading"
          className="rounded-[var(--r-card)] border border-[var(--c-border)] bg-[var(--c-surface)] p-5 shadow-2xs sm:p-6"
        >
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] bg-[var(--c-brand-tint)] text-[var(--c-brand)]">
              <Icon name="doc" className="h-5 w-5" />
            </span>
            <h2
              id="sobre-fontes-heading"
              className="font-display text-2xl font-black text-[var(--c-text)]"
            >
              Fontes oficiais dos dados e datas de verificação
            </h2>
          </div>
          <p className="mt-2 max-w-[65ch] text-base text-[var(--c-text-2)]">
            Todas as informações exibidas no aplicativo vêm de publicações abertas de órgãos
            públicos:
          </p>

          <dl className="mt-4 space-y-3 border-t border-[var(--c-border-subtle)] pt-4 text-base">
            <div className="rounded-[var(--r-button)] border border-[var(--c-border-subtle)] bg-[var(--c-bg)] p-4">
              <dt className="font-display text-lg font-bold text-[var(--c-brand)]">
                1. Relação Municipal de Medicamentos Essenciais (REMUME — SMS Cuiabá)
              </dt>
              <dd className="mt-1 text-[var(--c-text)]">
                Lista oficial dos medicamentos padronizados na rede pública municipal de Cuiabá.
                <br />
                <strong>Data da publicação verificada:</strong>{' '}
                {formatIsoDatePTBR(meta.data_remume)}
              </dd>
            </div>

            <div className="rounded-[var(--r-button)] border border-[var(--c-border-subtle)] bg-[var(--c-bg)] p-4">
              <dt className="font-display text-lg font-bold text-[var(--c-free)]">
                2. Elenco do Programa Farmácia Popular do Brasil (Ministério da Saúde)
              </dt>
              <dd className="mt-1 text-[var(--c-text)]">
                Lista nacional dos medicamentos e insumos 100% gratuitos nas farmácias credenciadas.
                <br />
                <strong>Data da publicação verificada:</strong>{' '}
                {formatIsoDatePTBR(meta.data_elenco_pfpb)}
              </dd>
            </div>

            <div className="rounded-[var(--r-button)] border border-[var(--c-border-subtle)] bg-[var(--c-bg)] p-4">
              <dt className="font-display text-lg font-bold text-[var(--c-text)]">
                3. Painel de Endereços de Farmácias Credenciadas (InfoMS / Ministério da Saúde)
              </dt>
              <dd className="mt-1 text-[var(--c-text)]">
                Cadastro e endereço oficial de drogarias credenciadas em Cuiabá/MT fornecidos pelo
                painel do Ministério da Saúde. A posição no mapa passa por auditoria gradual.
                <br />
                <strong>Data da base verificada:</strong> {formatIsoDatePTBR(meta.data_infoms)}
              </dd>
            </div>

            {/* Conteúdo longo secundário em <details> */}
            <details className="group rounded-[var(--r-button)] border border-[var(--c-border-subtle)] bg-[var(--c-bg)] p-4">
              <summary className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 font-display text-base font-bold text-[var(--c-brand)] hover:underline focus:outline-none">
                <span>Detalhes técnicos da base e checagem contínua</span>
                <Icon name="chev" className="h-4 w-4 transition-transform group-open:rotate-90" />
              </summary>
              <div className="pt-2 text-sm text-[var(--c-text)]">
                <p>
                  <strong>Última checagem automática de integridade (CI):</strong>{' '}
                  {formatIsoDatePTBR(meta.ultima_verificacao_ci)} (versão do pacote:{' '}
                  <code>{meta.versao}</code>)
                </p>
                <p className="mt-1 text-xs text-[var(--c-text-2)]">
                  Cada compilação valida os esquemas com Zod em modo strict e garante a
                  correspondência exata entre os princípios ativos e as apresentações.
                </p>
              </div>
            </details>
          </dl>
        </section>

        {/* 3. Privacidade em linguagem simples (visível, não recolhido) */}
        <section
          aria-labelledby="sobre-privacidade-heading"
          className="rounded-[var(--r-card)] border border-[var(--c-border)] bg-[var(--c-surface)] p-5 shadow-2xs sm:p-6"
        >
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] bg-[var(--c-brand-tint)] text-[var(--c-brand)]">
              <Icon name="a11y" className="h-5 w-5" />
            </span>
            <h2
              id="sobre-privacidade-heading"
              className="font-display text-2xl font-black text-[var(--c-text)]"
            >
              Sua privacidade (LGPD)
            </h2>
          </div>
          <p className="mt-3 max-w-[65ch] text-base leading-relaxed text-[var(--c-text)]">
            {NORMATIVE_TEXTS.privacidadeResumo}
          </p>
          <ul className="mt-3.5 list-disc space-y-1.5 rounded-[var(--r-button)] bg-[var(--c-bg)] p-4 pl-8 text-base text-[var(--c-text)]">
            <li>
              O texto que você digita na busca <strong>nunca</strong> entra no endereço da página
              (URL) e não é enviado para nenhum servidor.
            </li>
            <li>
              Suas preferências de leitura (tamanho da letra, alto contraste e redução de
              animações) ficam guardadas apenas no seu próprio celular ou computador.
            </li>
            <li>
              Não usamos rastreadores publicitários nem ferramentas de monitoramento de terceiros.
            </li>
          </ul>
        </section>

        {/* 4. Como reportar erro ou endereço desatualizado */}
        <section
          aria-labelledby="sobre-contato-heading"
          className="rounded-[var(--r-card)] border border-[var(--c-border)] bg-[var(--c-surface)] p-5 shadow-2xs sm:p-6 space-y-4"
        >
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] bg-[var(--c-attn-tint)] text-[var(--c-attn-ink)]">
              <Icon name="info" className="h-5 w-5" />
            </span>
            <h2
              id="sobre-contato-heading"
              className="font-display text-2xl font-black text-[var(--c-text)]"
            >
              Encontrou um erro ou endereço desatualizado?
            </h2>
          </div>

          <div
            role="note"
            className="flex items-start gap-2.5 rounded-[var(--r-button)] border border-[var(--c-attn-border)] bg-[var(--c-attn-tint)] p-4 text-base font-bold text-[var(--c-attn-ink)]"
          >
            <Icon name="info" className="mt-0.5 h-5 w-5 shrink-0" />
            <span>
              Importante para sua segurança: NUNCA envie foto de receita médica, número de CPF,
              Cartão do SUS, telefone ou dados pessoais de saúde ao relatar uma correção.
            </span>
          </div>

          <p className="max-w-[65ch] text-base text-[var(--c-text)]">
            Para manter sua privacidade, este aplicativo não possui formulários de coleta de dados.
            Se você notou algum endereço de unidade ou farmácia que mudou em Cuiabá:
          </p>

          <details className="group rounded-[var(--r-button)] border border-[var(--c-border-subtle)] bg-[var(--c-bg)] p-4">
            <summary className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 font-display text-base font-bold text-[var(--c-brand)] hover:underline focus:outline-none">
              <span>Ver canais oficiais para registrar correção</span>
              <Icon name="chev" className="h-4 w-4 transition-transform group-open:rotate-90" />
            </summary>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-base text-[var(--c-text)]">
              <li>
                <strong>Programa Farmácia Popular (Ministério da Saúde):</strong> caso uma farmácia
                listada na base oficial não seja localizada no endereço cadastrado, você pode
                comunicar diretamente a equipe nacional do programa pelo e-mail oficial{' '}
                <a
                  href="mailto:analise.fpopular@saude.gov.br"
                  className="font-bold text-[var(--c-brand)] underline"
                >
                  analise.fpopular@saude.gov.br
                </a>
                .
              </li>
              <li>
                <strong>Rede Municipal de Cuiabá (UBS, Policlínicas e UPAs):</strong> dúvidas ou
                manifestações sobre atendimento, endereços de unidades públicas e abastecimento
                municipal podem ser registradas na Ouvidoria Geral / e-SIC da Prefeitura de Cuiabá.
              </li>
            </ul>
          </details>
        </section>
      </main>
    </>
  );
}
