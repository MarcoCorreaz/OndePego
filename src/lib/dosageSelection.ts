import type { Apresentacao } from '@/types/schema';

/**
 * Define a apresentação/dosagem inicial da página de um medicamento.
 *
 * Só pré-seleciona quando há UMA única apresentação (não há ambiguidade). Com 2 ou mais,
 * retorna `''` para obrigar a pessoa a escolher a dosagem da receita: a resposta de retirada
 * pode mudar de uma dosagem para outra (SUS e Farmácia Popular) e nunca deve ser
 * mostrada para a dosagem errada sem a pessoa perceber.
 */
export function resolveInitialApresentacaoId(
  apresentacoes: readonly Pick<Apresentacao, 'id_apresentacao'>[],
): string {
  if (apresentacoes.length === 1) {
    return apresentacoes[0]!.id_apresentacao;
  }
  return '';
}

/**
 * Retorna a apresentação escolhida ou `undefined` quando nenhuma dosagem foi escolhida ainda.
 */
export function findSelectedApresentacao<T extends Pick<Apresentacao, 'id_apresentacao'>>(
  apresentacoes: readonly T[],
  selectedId: string,
): T | undefined {
  if (!selectedId) {
    return undefined;
  }
  return apresentacoes.find((a) => a.id_apresentacao === selectedId);
}
