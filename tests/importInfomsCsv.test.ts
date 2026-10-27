import { describe, expect, it } from 'vitest';
import {
  detectCsvDelimiter,
  mergeInfomsEstablishments,
  parseInfomsCsv,
  stripUtf8Bom,
} from '@/lib/infomsCsv';
import { EstabelecimentosFile, type Estabelecimento } from '@/types/schema';

describe('infomsCsv — importação do painel InfoMS preservando coordenadas auditadas', () => {
  it('remove UTF-8 BOM (\\uFEFF) e detecta delimitador ponto-e-vírgula (;) ou vírgula (,)', () => {
    const csvWithBomAndSemicolon =
      '\uFEFFUF;MUNICIPIO;CNPJ;NOME_FANTASIA;BAIRRO;ENDERECO;TELEFONE;SITUACAO;LATITUDE;LONGITUDE\r\n' +
      'MT;Cuiabá;00.000.000/0001-91;"Farmácia Sintética A; Filial 1";Bairro Teste 1;Rua Sintética A, 100;(65) 0000-0001;ATIVA;-15,595;-56,095\r\n' +
      'MT;Rondonópolis;00.000.000/0002-72;Farmácia Outra Cidade;Centro;Rua X, 10;(66) 0000-0000;ATIVA;-16,47;-54,63\r\n';

    expect(stripUtf8Bom(csvWithBomAndSemicolon).startsWith('UF;')).toBe(true);
    expect(detectCsvDelimiter('UF;MUNICIPIO;CNPJ')).toBe(';');
    expect(detectCsvDelimiter('UF,MUNICIPIO,CNPJ')).toBe(',');

    const parsed = parseInfomsCsv(csvWithBomAndSemicolon);
    expect(parsed.rows).toHaveLength(1);
    expect(parsed.skippedOutsideMunicipio).toBe(1);
    expect(parsed.rows[0]).toMatchObject({
      id: 'pfpb-00000000000191',
      nome_fantasia: 'Farmácia Sintética A; Filial 1',
      bairro: 'Bairro Teste 1',
      credenciamento_pfpb_ativo: true,
      lat: -15.595,
      lng: -56.095,
    });
  });

  it('NUNCA sobrescreve coordenadas quando auditado_manualmente === true e marca novas como auditado_manualmente: false', () => {
    const existing: Estabelecimento[] = [
      {
        __fixture: true,
        id: 'pfpb-11111111000111',
        nome_fantasia: 'FARMACIA_AUDITADA_ANTIGA',
        tipo: 'FARMACIA_POPULAR',
        bairro: 'BAIRRO_ANTIGO',
        endereco_completo: 'ENDERECO_ANTIGO, 10',
        coordenadas: {
          lat: -15.581234,
          lng: -56.071234,
          auditado_manualmente: true,
        },
        atributos_operacionais: {
          credenciamento_pfpb_ativo: true,
          status_funcionamento: 'NORMAL',
        },
      },
      {
        __fixture: true,
        id: 'estab-ubs-fixa',
        nome_fantasia: 'UBS_FIXA_MUNICIPAL',
        tipo: 'UBS',
        bairro: 'BAIRRO_UBS',
        endereco_completo: 'RUA UBS, 50',
        coordenadas: {
          lat: -15.55,
          lng: -56.05,
          auditado_manualmente: true,
        },
        atributos_operacionais: {
          dispensa_psicotropicos_sus: false,
          polo_vacinacao_municipal: true,
          status_funcionamento: 'NORMAL',
        },
      },
    ];

    const csvText = [
      'UF,MUNICIPIO,CNPJ,NOME_FANTASIA,BAIRRO,ENDERECO,TELEFONE,SITUACAO,LAT,LNG',
      // Tenta mudar a coordenada da farmácia já auditada para (-15.70, -56.20): deve ser ignorado!
      'MT,Cuiabá,11.111.111/0001-11,FARMACIA_AUDITADA_ATUALIZADA,BAIRRO_NOVO,"AV. SINTETICA, 999",(65) 0000-1111,ATIVA,-15.700000,-56.200000',
      // Nova farmácia sem coordenada no CSV: entra com coordenada provisória na bbox e auditado_manualmente: false
      'MT,Cuiabá,22.222.222/0001-22,FARMACIA_NOVA_TESTE,BAIRRO_TESTE_2,"RUA NOVA, 200",(65) 0000-2222,ATIVA,,',
    ].join('\n');

    const { rows, skippedOutsideMunicipio } = parseInfomsCsv(csvText);
    const result = mergeInfomsEstablishments(existing, rows, skippedOutsideMunicipio);

    expect(result.added).toBe(1);
    expect(result.updated).toBe(1);
    expect(result.preservedAuditedCoords).toBe(1);

    // Valida com o schema Zod oficial
    const validated = EstabelecimentosFile.parse(result.merged);
    expect(validated).toHaveLength(3);

    const auditedPharmacy = validated.find((e) => e.id === 'pfpb-11111111000111')!;
    // Dados cadastrais foram atualizados:
    expect(auditedPharmacy.nome_fantasia).toBe('FARMACIA_AUDITADA_ATUALIZADA');
    expect(auditedPharmacy.bairro).toBe('BAIRRO_NOVO');
    expect(auditedPharmacy.endereco_completo).toBe('AV. SINTETICA, 999');
    // Mas as coordenadas auditadas permaneceram 100% intactas:
    expect(auditedPharmacy.coordenadas).toEqual({
      lat: -15.581234,
      lng: -56.071234,
      auditado_manualmente: true,
    });

    // A nova farmácia entrou com auditado_manualmente: false
    const newPharmacy = validated.find((e) => e.id === 'pfpb-22222222000122')!;
    expect(newPharmacy.coordenadas.auditado_manualmente).toBe(false);

    // E a UBS existente permaneceu intacta
    expect(validated.find((e) => e.id === 'estab-ubs-fixa')).toBeDefined();
  });
});
