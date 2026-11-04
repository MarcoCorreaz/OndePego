'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useSearchSession } from '@/components/search/SearchSessionProvider';
import { shouldResetSearchOnPath } from '@/lib/searchSession';

/**
 * Componente silencioso montado na Home (`/`) que limpa o estado de busca da sessão
 * sempre que o usuário entra ou retorna para a página inicial, evitando que termos anteriores
 * (como "losartana") fiquem presos no input do Hero, sem interferir na digitação subsequente na Home.
 */
export function ResetSearchOnHome() {
  const pathname = usePathname();
  const { isHydrated, clearQuery } = useSearchSession();
  const hasResetRef = useRef(false);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    if (shouldResetSearchOnPath(pathname) && !hasResetRef.current) {
      hasResetRef.current = true;
      clearQuery();
    } else if (!shouldResetSearchOnPath(pathname)) {
      hasResetRef.current = false;
    }
  }, [pathname, isHydrated, clearQuery]);

  return null;
}
