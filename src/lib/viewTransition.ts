/**
 * Progressive Enhancement para navegação com a View Transitions API nativa.
 * Se o navegador suportar e o usuário não preferir redução de movimento,
 * executa document.startViewTransition(). Caso contrário, navega normalmente.
 */

export interface RouterLike {
  push: (href: string) => void;
}

export function navigateWithTransition(
  router: RouterLike,
  href: string,
  reduceMotion = false,
): void {
  if (
    typeof document !== 'undefined' &&
    typeof document.startViewTransition === 'function' &&
    !reduceMotion &&
    !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  ) {
    document.startViewTransition(() => {
      router.push(href);
    });
  } else {
    router.push(href);
  }
}
