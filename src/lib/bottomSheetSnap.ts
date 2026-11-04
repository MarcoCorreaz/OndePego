export type SheetSnapState = 'collapsed' | 'half' | 'full';

export const COLLAPSED_HEIGHT_PX = 68;
export const HALF_RATIO = 0.5;
export const FULL_RATIO = 0.85;
export const DRAG_THRESHOLD_PX = 42;
export const TAP_TOLERANCE_PX = 10;

export interface SnapGestureInput {
  currentState: SheetSnapState;
  deltaY: number;
  viewportHeight: number;
}

/**
 * Calcula a altura em pixels de cada ponto de parada (snap point) da gaveta do mapa.
 */
export function getSnapHeightPx(state: SheetSnapState, viewportHeight: number): number {
  const safeVh = Math.max(400, viewportHeight);
  if (state === 'collapsed') {
    return COLLAPSED_HEIGHT_PX;
  }
  if (state === 'half') {
    return Math.round(safeVh * HALF_RATIO);
  }
  return Math.round(safeVh * FULL_RATIO);
}

/**
 * Resolve de forma determinística o próximo estado (`collapsed`, `half`, `full`)
 * após um gesto de arraste (ou toque simples) na alça da gaveta inferior.
 *
 * - `deltaY < 0` significa arrastar para CIMA (abrir/expandir).
 * - `deltaY > 0` significa arrastar para BAIXO (reduzir/recolher).
 * - `|deltaY| <= TAP_TOLERANCE_PX` significa toque simples na alça (alterna ciclicamente).
 */
export function resolveNextSnapState({
  currentState,
  deltaY,
  viewportHeight,
}: SnapGestureInput): SheetSnapState {
  const safeVh = Math.max(400, viewportHeight);

  // Toque simples sem arraste significativo: avança no ciclo
  if (Math.abs(deltaY) <= TAP_TOLERANCE_PX) {
    if (currentState === 'collapsed') return 'half';
    if (currentState === 'half') return 'full';
    return 'collapsed';
  }

  // Arraste para cima (expandindo)
  if (deltaY <= -DRAG_THRESHOLD_PX) {
    const bigSwipeThreshold = safeVh * 0.42;
    if (currentState === 'collapsed') {
      return Math.abs(deltaY) >= bigSwipeThreshold ? 'full' : 'half';
    }
    return 'full';
  }

  // Arraste para baixo (recolhendo)
  if (deltaY >= DRAG_THRESHOLD_PX) {
    const bigSwipeThreshold = safeVh * 0.42;
    if (currentState === 'full') {
      return deltaY >= bigSwipeThreshold ? 'collapsed' : 'half';
    }
    return 'collapsed';
  }

  // Arraste curto abaixo do limiar: calcula o ponto mais próximo pela altura projetada
  const startHeight = getSnapHeightPx(currentState, safeVh);
  const projectedHeight = startHeight - deltaY;

  const candidates: SheetSnapState[] = ['collapsed', 'half', 'full'];
  let bestState: SheetSnapState = currentState;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const candidate of candidates) {
    const candidateHeight = getSnapHeightPx(candidate, safeVh);
    const distance = Math.abs(projectedHeight - candidateHeight);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestState = candidate;
    }
  }

  return bestState;
}
