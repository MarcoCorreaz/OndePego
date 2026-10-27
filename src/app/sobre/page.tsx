import type { Metadata } from 'next';
import { FreshnessBanner } from '@/components/ui/FreshnessBanner';
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
      <main id="conteudo-principal" className="mx-auto max-w-4xl space-y-6 px-4 py-6">
        <header className="space-y-2">
          <h1 className="font-display text-3xl font-extrabold text-[var(--c-text)] sm:text-4xl">
            Sobre o Onde Pego, fontes e privacidade
          </h1>
          <p className="max-w-[65ch] text-lg text-[var(--c-text-2)]">
            Transparência sobre de onde vêm as informações, como protegemos sua privacidade e como
            avisar se encontrar algum endereço desatualizado.
          </p>
        </header>

        {/* Aviso de independência (literal de busca-textos-saude) */}
        <section
          aria-labelledby="sobre-independencia-heading"
          className="rounded-[var(--r-plate)] border-2 border-[var(--c-border)] bg-[var(--c-bg)] p-5"
        >
          <h2
            id="sobre-independencia-heading"
            className="font-display text-2xl font-extrabold text-[var(--c-text)]"
          >
            Projeto independente de utilidade pública
          </h2>
          <p className="mt-2 max-w-[65ch] text-base leading-relaxed text-[var(--c-text)]">
            {NORMATIVE_TEXTS.avisoIndependencia}
          </p>
        </section>

        {/* Origem e data de cada fonte oficial */}
        <section
          aria-labelledby="sobre-fontes-heading"
          className="rounded-[var(--r-plate)] border-2 border-[var(--c-border)] bg-[var(--c-bg)] p-5"
        >
          <h2
            id="sobre-fontes-heading"
            className="font-display text-2xl font-extrabold text-[var(--c-text)]"
          >
            Fontes oficiais dos dados e datas de verificação
          </h2>
          <p className="mt-2 max-w-[65ch] text-base text-[var(--c-text)]">
            Todas as informações exibidas no aplicativo vêm de publicações abertas de órgãos
            públicos:
          </p>

          <dl className="mt-4 space-y-3 border-t-2 border-[var(--c-border-subtle)] pt-4 text-base">
            <div className="rounded bg-[var(--c-bg-soft)] p-3">
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

            <div className="rounded bg-[var(--c-bg-soft)] p-3">
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

            <div className="rounded bg-[var(--c-bg-soft)] p-3">
              <dt className="font-display text-lg font-bold text-[var(--c-text)]">
                3. Painel de Endereços de Farmácias Credenciadas (InfoMS / Ministério da Saúde)
              </dt>
              <dd className="mt-1 text-[var(--c-text)]">
                Cadastro de drogarias credenciadas em Cuiabá/MT, com coordenadas conferidas.
                <br />
                <strong>Data da base verificada:</strong> {formatIsoDatePTBR(meta.data_infoms)}
              </dd>
            </div>

            <div className="rounded bg-[var(--c-bg-soft)] p-3">
              <dt className="font-display text-lg font-bold text-[var(--c-text)]">
                Última checagem automática de integridade (CI)
              </dt>
              <dd className="mt-1 text-[var(--c-text)]">
                <strong>Verificado em:</strong> {formatIsoDatePTBR(meta.ultima_verificacao_ci)}{' '}
                (versão do pacote de dados: <code>{meta.versao}</code>)
              </dd>
            </div>
          </dl>
        </section>

        {/* Privacidade em linguagem simples (literal de busca-textos-saude / ADR-09) */}
        <section
          aria-labelledby="sobre-privacidade-heading"
          className="rounded-[var(--r-plate)] border-2 border-[var(--c-border)] bg-[var(--c-bg)] p-5"
        >
          <h2
            id="sobre-privacidade-heading"
            className="font-display text-2xl font-extrabold text-[var(--c-text)]"
          >
            Sua privacidade (LGPD)
          </h2>
          <p className="mt-2 max-w-[65ch] text-base leading-relaxed text-[var(--c-text)]">
            {NORMATIVE_TEXTS.privacidadeResumo}
          </p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-base text-[var(--c-text)]">
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

        {/* Como reportar erro ou endereço desatualizado */}
        <section
          aria-labelledby="sobre-contato-heading"
          className="space-y-4 rounded-[var(--r-plate)] border-2 border-[var(--c-border)] bg-[var(--c-bg)] p-5"
        >
          <h2
            id="sobre-contato-heading"
            className="font-display text-2xl font-extrabold text-[var(--c-text)]"
          >
            Encontrou um erro ou endereço desatualizado?
          </h2>

          <div
            role="note"
            className="rounded-[var(--r-plate)] border-2 border-[var(--c-border)] bg-[var(--c-attn)] p-3.5 text-base font-bold text-[var(--c-text)]"
          >
            ⚠ Importante para sua segurança: NUNCA envie foto de receita médica, número de CPF,
            Cartão do SUS, telefone ou dados pessoais de saúde ao relatar uma correção.
          </div>

          <p className="max-w-[65ch] text-base text-[var(--c-text)]">
            Para manter sua privacidade, este aplicativo não possui formulários de coleta de dados.
            Se você notou algum endereço de unidade ou farmácia que mudou em Cuiabá:
          </p>

          <ul className="list-disc space-y-2 pl-5 text-base text-[var(--c-text)]">
            <li>
              <strong>Canal público do projeto Onde Pego:</strong> registre um aviso técnico no{' '}
              <a
                href="https://github.com/marcocorrea/onde-pego/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-[var(--c-brand)] underline"
              >
                repositório público do projeto (GitHub Issues)
              </a>{' '}
              informando apenas o nome da farmácia ou unidade e o bairro.
            </li>
            <li>
              <strong>Programa Farmácia Popular (Ministério da Saúde):</strong> caso uma farmácia
              listada na base oficial não seja localizada no endereço cadastrado, você também pode
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
              manifestações sobre atendimento e abastecimento municipal podem ser registradas na
              Ouvidoria Geral / e-SIC da Prefeitura de Cuiabá.
            </li>
          </ul>
        </section>
      </main>
    </>
  );
}
