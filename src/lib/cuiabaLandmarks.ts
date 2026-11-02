import type { LatLng } from '@/lib/geoEngine';

export interface CuiabaLandmark {
  id: string;
  nome: string;
  tipo: 'regiao' | 'bairro' | 'eixo';
  coordenadas: LatLng;
  minZoom: number;
  maxZoom?: number;
}

/**
 * Pontos de referência e eixos viários mais conhecidos de Cuiabá e Várzea Grande.
 * Usados para dar orientação espacial imediata ao usuário na tela /mapa/ sem nenhuma dependência
 * de conexões externas ou CDNs de glifos PBF (0 KB de rede externa).
 */
export const CUIABA_LANDMARKS: readonly CuiabaLandmark[] = [
  // Macrorregiões e Bairros
  {
    id: 'centro-cuiaba',
    nome: 'Centro',
    tipo: 'regiao',
    coordenadas: { lat: -15.596, lng: -56.097 },
    minZoom: 11.0,
    maxZoom: 15.0,
  },
  {
    id: 'grande-cpa',
    nome: 'Grande CPA',
    tipo: 'regiao',
    coordenadas: { lat: -15.568, lng: -56.042 },
    minZoom: 11.0,
    maxZoom: 15.0,
  },
  {
    id: 'coxipo',
    nome: 'Coxipó',
    tipo: 'regiao',
    coordenadas: { lat: -15.652, lng: -56.072 },
    minZoom: 11.0,
    maxZoom: 15.0,
  },
  {
    id: 'tijucal',
    nome: 'Tijucal',
    tipo: 'bairro',
    coordenadas: { lat: -15.658, lng: -56.036 },
    minZoom: 12.0,
    maxZoom: 15.5,
  },
  {
    id: 'pedra-90',
    nome: 'Pedra 90',
    tipo: 'bairro',
    coordenadas: { lat: -15.688, lng: -55.998 },
    minZoom: 11.5,
    maxZoom: 15.5,
  },
  {
    id: 'morada-do-ouro',
    nome: 'Morada do Ouro',
    tipo: 'bairro',
    coordenadas: { lat: -15.562, lng: -56.071 },
    minZoom: 12.0,
    maxZoom: 15.5,
  },
  {
    id: 'bosque-da-saude',
    nome: 'Bosque da Saúde',
    tipo: 'bairro',
    coordenadas: { lat: -15.586, lng: -56.073 },
    minZoom: 12.5,
    maxZoom: 16.0,
  },
  {
    id: 'jardim-leblon',
    nome: 'Jardim Leblon',
    tipo: 'bairro',
    coordenadas: { lat: -15.602, lng: -56.065 },
    minZoom: 12.5,
    maxZoom: 16.0,
  },
  {
    id: 'verdao',
    nome: 'Verdão',
    tipo: 'bairro',
    coordenadas: { lat: -15.604, lng: -56.122 },
    minZoom: 12.0,
    maxZoom: 15.5,
  },
  {
    id: 'cidade-alta',
    nome: 'Cidade Alta',
    tipo: 'bairro',
    coordenadas: { lat: -15.613, lng: -56.115 },
    minZoom: 12.5,
    maxZoom: 16.0,
  },
  {
    id: 'jardim-industriario',
    nome: 'Jd. Industriário',
    tipo: 'bairro',
    coordenadas: { lat: -15.669, lng: -56.012 },
    minZoom: 12.0,
    maxZoom: 15.5,
  },
  {
    id: 'porto',
    nome: 'Porto',
    tipo: 'bairro',
    coordenadas: { lat: -15.612, lng: -56.104 },
    minZoom: 12.5,
    maxZoom: 16.0,
  },
  {
    id: 'cristo-rei-vg',
    nome: 'Cristo Rei (VG)',
    tipo: 'bairro',
    coordenadas: { lat: -15.636, lng: -56.128 },
    minZoom: 11.5,
    maxZoom: 15.0,
  },
  {
    id: 'centro-vg',
    nome: 'Centro (VG)',
    tipo: 'regiao',
    coordenadas: { lat: -15.648, lng: -56.142 },
    minZoom: 11.5,
    maxZoom: 15.0,
  },

  // Eixos Viários Principais
  {
    id: 'eixo-av-cpa',
    nome: 'Av. do CPA',
    tipo: 'eixo',
    coordenadas: { lat: -15.578, lng: -56.059 },
    minZoom: 13.0,
    maxZoom: 16.5,
  },
  {
    id: 'eixo-av-fernando-correa',
    nome: 'Av. Fernando Corrêa',
    tipo: 'eixo',
    coordenadas: { lat: -15.629, lng: -56.076 },
    minZoom: 13.0,
    maxZoom: 16.5,
  },
  {
    id: 'eixo-av-miguel-sutil',
    nome: 'Av. Miguel Sutil',
    tipo: 'eixo',
    coordenadas: { lat: -15.588, lng: -56.107 },
    minZoom: 13.0,
    maxZoom: 16.5,
  },
];

/**
 * Retorna os marcos de referência visíveis no nível de zoom informado.
 */
export function getVisibleLandmarks(zoom: number): readonly CuiabaLandmark[] {
  return CUIABA_LANDMARKS.filter((landmark) => {
    if (zoom < landmark.minZoom) return false;
    if (landmark.maxZoom !== undefined && zoom > landmark.maxZoom) return false;
    return true;
  });
}
