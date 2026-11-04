import { describe, expect, it } from 'vitest';
import {
  COLLAPSED_HEIGHT_PX,
  getSnapHeightPx,
  resolveNextSnapState,
} from '@/lib/bottomSheetSnap';

describe('Bottom Sheet Nativo — Cálculo de Snap e Gestos de Arraste (src/lib/bottomSheetSnap.ts — Bloco C2)', () => {
  const VH = 844;

  it('1. Calcula alturas coerentes em pixels para collapsed (68px), half (50%) e full (85%)', () => {
    expect(getSnapHeightPx('collapsed', VH)).toBe(COLLAPSED_HEIGHT_PX);
    expect(getSnapHeightPx('half', VH)).toBe(422);
    expect(getSnapHeightPx('full', VH)).toBe(717);
  });

  it('2. Toque simples na alça (|deltaY| <= 10px) avança ciclicamente: collapsed -> half -> full -> collapsed', () => {
    expect(resolveNextSnapState({ currentState: 'collapsed', deltaY: 0, viewportHeight: VH })).toBe(
      'half',
    );
    expect(resolveNextSnapState({ currentState: 'half', deltaY: -4, viewportHeight: VH })).toBe(
      'full',
    );
    expect(resolveNextSnapState({ currentState: 'full', deltaY: 5, viewportHeight: VH })).toBe(
      'collapsed',
    );
  });

  it('3. Arraste para cima (deltaY <= -42px) expande de collapsed para half (ou full em swipe longo) e de half para full', () => {
    expect(
      resolveNextSnapState({ currentState: 'collapsed', deltaY: -80, viewportHeight: VH }),
    ).toBe('half');
    expect(
      resolveNextSnapState({ currentState: 'collapsed', deltaY: -450, viewportHeight: VH }),
    ).toBe('full');
    expect(resolveNextSnapState({ currentState: 'half', deltaY: -70, viewportHeight: VH })).toBe(
      'full',
    );
  });

  it('4. Arraste para baixo (deltaY >= 42px) reduz de full para half (ou collapsed em swipe longo) e de half para collapsed', () => {
    expect(resolveNextSnapState({ currentState: 'full', deltaY: 90, viewportHeight: VH })).toBe(
      'half',
    );
    expect(resolveNextSnapState({ currentState: 'full', deltaY: 450, viewportHeight: VH })).toBe(
      'collapsed',
    );
    expect(resolveNextSnapState({ currentState: 'half', deltaY: 75, viewportHeight: VH })).toBe(
      'collapsed',
    );
  });
});
