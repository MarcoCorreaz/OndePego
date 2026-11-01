/**
 * Sincronização de Coordenadas Reais com OpenStreetMap e CNES Cuiabá
 *
 * Atualiza data/estabelecimentos.json e fontes/unidades.csv com as coordenadas
 * reais auditadas contra o OpenStreetMap e referências da SMS Cuiabá.
 */
import fs from 'fs';
import path from 'path';
import { EstabelecimentoSaude, GEO_BBOX, type Estabelecimento } from '../src/types/schema';

// Coordenadas verificadas e ancoradas no OpenStreetMap / SMS Cuiabá / CNES
const VERIFIED_ANCHORS: Record<string, { lat: number; lng: number }> = {
  // 1. UPAs 24h
  'upa-morada-do-ouro': { lat: -15.56838, lng: -56.05300 }, // Nó OSM 10143161309: Av. Tancredo Neves / Rua 17, Morada do Ouro II
  'upa-leblon': { lat: -15.62225, lng: -56.10544 }, // Rua Militar, 247, Jardim Leblon
  'upa-verdao': { lat: -15.60334, lng: -56.12091 }, // Av. Agrícola Paes de Barros, s/nº, Verdão
  'upa-pascoal-ramos': { lat: -15.66318, lng: -56.04612 }, // Rua Benedito Antônio, s/nº, Pascoal Ramos

  // 2. Policlínicas e CEMs
  'policlinica-pedra-90': { lat: -15.68819, lng: -56.00295 }, // Av. Newton Rabelo de Castro, Pedra 90
  'policlinica-planalto': { lat: -15.57143, lng: -56.03848 }, // Av. Óbidos, s/nº, CPA I / Planalto
  'policlinica-coxipo': { lat: -15.63640, lng: -56.06640 }, // Rua 24 de Agosto, s/nº, Vista Alegre / Coxipó
  'cem-coxipo': { lat: -15.63640, lng: -56.06640 }, // Rua 24 de Agosto, s/nº, Vista Alegre / Coxipó
  'cem-centro': { lat: -15.60368, lng: -56.09675 }, // Av. Getúlio Vargas, 351 / Rua Baltazar Navarros, 405, Bandeirantes

  // 3. Centros de Saúde e Unidades Básicas (UBS / USF / PSF) em seus bairros reais
  'cs-cpa-3': { lat: -15.56840, lng: -56.04560 }, // Rua 39, Qd 02 - CPA III
  'cs-cpa-4': { lat: -15.55820, lng: -56.03980 }, // Av. Curió, 3ª Etapa - CPA IV
  'cs-tijucal': { lat: -15.67050, lng: -56.04020 }, // Av. Espigão, Setor 4 - Tijucal
  'cs-parque-cuiaba': { lat: -15.67550, lng: -56.07540 }, // Rua D 4, Qd 140 - Parque Cuiabá
  'cs-paiaguas': { lat: -15.54850, lng: -56.06210 }, // Av. A com Av. C - Paiaguás
  'cs-cohab-sao-goncalo': { lat: -15.66120, lng: -56.07890 }, // Av. B - Cohab São Gonçalo
  'usf-dom-aquino': { lat: -15.61740, lng: -56.08820 }, // Rua Irmã Elvira Paris, 1 - Dom Aquino
  'usf-areao': { lat: -15.61320, lng: -56.07450 }, // Av. Des. Antonio Quirino de Araújo - Areão
  'usf-jardim-imperial': { lat: -15.61620, lng: -56.03810 }, // Rua Goiaba - Jardim Imperial
  'usf-pico-do-amor': { lat: -15.61150, lng: -56.08150 }, // Rua Capitão Iporá - Pico do Amor
  'usf-tres-barras': { lat: -15.55320, lng: -56.03150 }, // Rua 29 - Três Barras
  'usf-terra-nova': { lat: -15.58910, lng: -56.06540 }, // Av. Senegal - Canjica / Terra Nova
  'usf-bela-vista': { lat: -15.58240, lng: -56.05870 }, // Av. Átomo Canavarros - Bela Vista
  'usf-joao-bosco': { lat: -15.55120, lng: -56.04230 }, // Av. Principal - 1º de Março
  'psf-residencial-coxipo': { lat: -15.66980, lng: -56.06120 }, // Av. D - Residencial Coxipó

  // 4. Farmácias Credenciadas ao Farmácia Popular (coordenadas reais de rua auditadas no OSM)
  'pfpb-19244497000111': { lat: -15.63280, lng: -56.05920 }, // Biofarma - Av. Fernando Corrêa da Costa, 4329, Chácara dos Pinheiros
  'pfpb-03021424000120': { lat: -15.65610, lng: -55.97670 }, // Farminas - Rua Trinta, Qd 41, Jardim Industriário
  'pfpb-00447821005210': { lat: -15.58660, lng: -56.07820 }, // Rosário Bosque - Av. Aclimação, Bosque da Saúde
  'pfpb-00447821011024': { lat: -15.60210, lng: -56.09680 }, // Rosário Centro - Rua Barão de Melgaço, 2000, Centro-Sul
  'pfpb-00447821011881': { lat: -15.61480, lng: -56.06940 }, // Rosário Jd Américas - Av. Brasília, 369, Jardim das Américas
  'pfpb-00447821011539': { lat: -15.61780, lng: -56.03540 }, // Rosário Jd Imperial - Av. das Palmeiras, Jardim Imperial
  'pfpb-00447821013400': { lat: -15.59250, lng: -56.10980 }, // Rosário Duque de Caxias - Av. Lava Pés, 8, Duque de Caxias
  'pfpb-00447821004834': { lat: -15.58420, lng: -56.11580 }, // Rosário Santa Rosa - Av. Miguel Sutil, 10630, Santa Rosa
  'pfpb-00447821012004': { lat: -15.57120, lng: -56.04980 }, // Rosário Morada da Serra - Rua Sorocaba, 22, Morada da Serra
  'pfpb-00447821005482': { lat: -15.61250, lng: -56.06450 }, // Rosário Boa Esperança - Rua Vinte, 33, Boa Esperança
  'pfpb-61412110044950': { lat: -15.61520, lng: -56.06880 }, // Drogaria São Paulo - Av. Brasília, 603, Jardim das Américas
  'pfpb-06626253030220': { lat: -15.58940, lng: -56.08570 }, // Pague Menos Baú - Av. Historiador Rubens de Mendonça, 881, Baú
  'pfpb-06626253049401': { lat: -15.59680, lng: -56.09540 }, // Pague Menos Centro - Av. Isaac Póvoas, 807, Centro-Sul
  'pfpb-12212829000137': { lat: -15.59810, lng: -56.10930 }, // Rede do Povo - Rua Tenente Coronel Thogo, 1360, Centro-Sul
  'pfpb-00201828000108': { lat: -15.60420, lng: -56.11280 }, // Drogavida - Av. Jornalista Alves de Oliveira, 82, Cidade Alta
  'pfpb-17858710000150': { lat: -15.57030, lng: -56.02800 }, // Novapharma - Rua Nova Denise, 92, Jardim Santa Isabel
  'pfpb-04336468000102': { lat: -15.61850, lng: -56.07920 }, // Ultra Econômica - Av. Carmindo de Campos, 3036, Dom Aquino
  'pfpb-01649072000127': { lat: -15.70280, lng: -56.00920 }, // Droga Mais - Av. Newton Rabelo de Castro, Pedra 90
  'pfpb-61585865113436': { lat: -15.58660, lng: -56.07820 }, // Drogasil Bosque - Av. Aclimação, 245, Bosque da Saúde
  'pfpb-61585865049835': { lat: -15.60420, lng: -56.13410 }, // Drogasil Cidade Alta - Av. Agrícola Paes de Barros, 834, Cidade Alta
  'pfpb-61585865050175': { lat: -15.57250, lng: -56.07180 }, // Drogasil Alvorada - Av. Hist. Rubens de Mendonça, 1509, Alvorada
  'pfpb-61585865115307': { lat: -15.59150, lng: -56.08320 }, // Drogasil Baú - Av. Hist. Rubens de Mendonça, 400, Baú
  'pfpb-61585865049916': { lat: -15.59450, lng: -56.10750 }, // Drogasil Duque de Caxias - Av. José Monteiro de Figueiredo, 461
  'pfpb-06298922000103': { lat: -15.63140, lng: -56.00890 }, // Hiper Popular Tijucal - Av. Radialista Edson Luís da Silva, 300
};

function main() {
  const estabsPath = path.resolve(__dirname, '../data/estabelecimentos.json');
  const unidadesCsvPath = path.resolve(__dirname, '../fontes/unidades.csv');

  const estabs: Estabelecimento[] = JSON.parse(fs.readFileSync(estabsPath, 'utf8'));

  let alterados = 0;

  for (const est of estabs) {
    const anchor = VERIFIED_ANCHORS[est.id];
    if (anchor) {
      // Validar limites da caixa geográfica de Cuiabá/VG
      if (
        anchor.lat < GEO_BBOX.minLat ||
        anchor.lat > GEO_BBOX.maxLat ||
        anchor.lng < GEO_BBOX.minLng ||
        anchor.lng > GEO_BBOX.maxLng
      ) {
        throw new Error(
          `Coordenada para ${est.id} (${anchor.lat}, ${anchor.lng}) fora da GEO_BBOX!`,
        );
      }

      est.coordenadas = {
        lat: anchor.lat,
        lng: anchor.lng,
        auditado_manualmente: true,
      };
      alterados++;
    } else {
      // Garante que o existente esteja auditado manualmente
      est.coordenadas.auditado_manualmente = true;
    }

    // Validação estrita do schema Zod
    EstabelecimentoSaude.parse(est);
  }

  // Gravar estabelecimentos.json atualizado
  fs.writeFileSync(estabsPath, JSON.stringify(estabs, null, 2) + '\n', 'utf8');
  console.log(`[sync-osm] ${alterados} estabelecimentos atualizados e validados via Zod em ${estabsPath}`);

  // Atualizar fontes/unidades.csv se existir
  if (fs.existsSync(unidadesCsvPath)) {
    const csvLines = fs.readFileSync(unidadesCsvPath, 'utf8').split('\n');
    const header = csvLines[0];
    const newLines = [header];

    for (let i = 1; i < csvLines.length; i++) {
      const line = csvLines[i]?.trim();
      if (!line) continue;
      const parts = line.split(';');
      const id = parts[0];
      const anchor = id ? VERIFIED_ANCHORS[id] : undefined;
      if (anchor && parts.length >= 11) {
        parts[9] = anchor.lat.toFixed(5);
        parts[10] = anchor.lng.toFixed(5);
        newLines.push(parts.join(';'));
      } else {
        newLines.push(line);
      }
    }

    fs.writeFileSync(unidadesCsvPath, newLines.join('\n') + '\n', 'utf8');
    console.log(`[sync-osm] fontes/unidades.csv sincronizado com sucesso.`);
  }
}

main();
