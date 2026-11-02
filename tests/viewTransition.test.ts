import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { navigateWithTransition } from '@/lib/viewTransition';

describe('navigateWithTransition', () => {
  const originalDocument = globalThis.document;
  const originalWindow = globalThis.window;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    if (originalDocument === undefined) {
      // @ts-expect-error restaurando ambiente node
      delete globalThis.document;
    } else {
      globalThis.document = originalDocument;
    }

    if (originalWindow === undefined) {
      // @ts-expect-error restaurando ambiente node
      delete globalThis.window;
    } else {
      globalThis.window = originalWindow;
    }
  });

  it('navega com router.push diretamente quando executado em ambiente server/node sem document', () => {
    const router = { push: vi.fn() };
    // @ts-expect-error ambiente sem document
    delete globalThis.document;

    navigateWithTransition(router, '/buscar/', false);

    expect(router.push).toHaveBeenCalledTimes(1);
    expect(router.push).toHaveBeenCalledWith('/buscar/');
  });

  it('usa document.startViewTransition quando suportado e sem reduceMotion', () => {
    const router = { push: vi.fn() };
    const mockTransition = vi.fn((cb?: () => void) => {
      cb?.();
      return {
        finished: Promise.resolve(),
        ready: Promise.resolve(),
        updateCallbackDone: Promise.resolve(),
        skipTransition: vi.fn(),
        types: new Set<string>(),
      } as unknown as ViewTransition;
    });

    // @ts-expect-error simulando DOM no teste
    globalThis.document = {
      startViewTransition: mockTransition,
    };
    // @ts-expect-error simulando window no teste
    globalThis.window = {
      matchMedia: vi.fn().mockReturnValue({ matches: false }),
    };

    navigateWithTransition(router, '/medicamento/losartana/', false);

    expect(mockTransition).toHaveBeenCalledTimes(1);
    expect(router.push).toHaveBeenCalledWith('/medicamento/losartana/');
  });

  it('navega diretamente com router.push quando startViewTransition não existe', () => {
    const router = { push: vi.fn() };
    // @ts-expect-error simulando DOM sem a API
    globalThis.document = {};
    // @ts-expect-error simulando window no teste
    globalThis.window = {
      matchMedia: vi.fn().mockReturnValue({ matches: false }),
    };

    navigateWithTransition(router, '/buscar/', false);

    expect(router.push).toHaveBeenCalledTimes(1);
    expect(router.push).toHaveBeenCalledWith('/buscar/');
  });

  it('respeita reduceMotion=true e chama router.push diretamente sem disparar transição', () => {
    const router = { push: vi.fn() };
    const mockTransition = vi.fn();
    // @ts-expect-error simulando DOM no teste
    globalThis.document = {
      startViewTransition: mockTransition,
    };
    // @ts-expect-error simulando window no teste
    globalThis.window = {
      matchMedia: vi.fn().mockReturnValue({ matches: false }),
    };

    navigateWithTransition(router, '/mapa/', true);

    expect(mockTransition).not.toHaveBeenCalled();
    expect(router.push).toHaveBeenCalledWith('/mapa/');
  });

  it('respeita prefers-reduced-motion do sistema operacional', () => {
    const router = { push: vi.fn() };
    const mockTransition = vi.fn();
    // @ts-expect-error simulando DOM no teste
    globalThis.document = {
      startViewTransition: mockTransition,
    };
    // @ts-expect-error simulando window com prefers-reduced-motion
    globalThis.window = {
      matchMedia: vi.fn().mockReturnValue({ matches: true }),
    };

    navigateWithTransition(router, '/sobre/', false);

    expect(mockTransition).not.toHaveBeenCalled();
    expect(router.push).toHaveBeenCalledWith('/sobre/');
  });
});
