'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  type PrescriptionEntry,
  type PrescriptionSessionState,
  addPrescriptionItem,
  clearPrescriptionSession,
  hasPrescriptionItem,
  loadPrescriptionSession,
  removePrescriptionItem,
  savePrescriptionSession,
  toggleCheckedDocument,
} from '@/lib/prescriptionList';

export interface PrescriptionContextValue {
  items: PrescriptionEntry[];
  itemCount: number;
  checkedDocs: string[];
  isHydrated: boolean;
  isItemAdded: (slug: string, id_apresentacao: string) => boolean;
  addItem: (entry: PrescriptionEntry) => void;
  removeItem: (entry: PrescriptionEntry) => void;
  toggleItem: (entry: PrescriptionEntry) => void;
  toggleDoc: (docText: string) => void;
  clearAll: () => void;
}

const PrescriptionContext = createContext<PrescriptionContextValue | null>(null);

export function PrescriptionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PrescriptionSessionState>({
    items: [],
    checkedDocs: [],
  });
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  useEffect(() => {
    const loaded = loadPrescriptionSession();
    setState(loaded);
    setIsHydrated(true);
  }, []);

  const persistState = useCallback((nextState: PrescriptionSessionState) => {
    setState(nextState);
    savePrescriptionSession(nextState);
  }, []);

  const isItemAdded = useCallback(
    (slug: string, id_apresentacao: string) => {
      return hasPrescriptionItem(state, { slug, id_apresentacao });
    },
    [state],
  );

  const addItem = useCallback(
    (entry: PrescriptionEntry) => {
      setState((prev) => {
        const next = addPrescriptionItem(prev, entry);
        savePrescriptionSession(next);
        return next;
      });
    },
    [],
  );

  const removeItem = useCallback(
    (entry: PrescriptionEntry) => {
      setState((prev) => {
        const next = removePrescriptionItem(prev, entry);
        savePrescriptionSession(next);
        return next;
      });
    },
    [],
  );

  const toggleItem = useCallback(
    (entry: PrescriptionEntry) => {
      setState((prev) => {
        const exists = hasPrescriptionItem(prev, entry);
        const next = exists ? removePrescriptionItem(prev, entry) : addPrescriptionItem(prev, entry);
        savePrescriptionSession(next);
        return next;
      });
    },
    [],
  );

  const toggleDoc = useCallback(
    (docText: string) => {
      setState((prev) => {
        const next = toggleCheckedDocument(prev, docText);
        savePrescriptionSession(next);
        return next;
      });
    },
    [],
  );

  const clearAll = useCallback(() => {
    const cleared = clearPrescriptionSession();
    setState(cleared);
  }, []);

  const value = useMemo<PrescriptionContextValue>(
    () => ({
      items: state.items,
      itemCount: state.items.length,
      checkedDocs: state.checkedDocs,
      isHydrated,
      isItemAdded,
      addItem,
      removeItem,
      toggleItem,
      toggleDoc,
      clearAll,
    }),
    [state, isHydrated, isItemAdded, addItem, removeItem, toggleItem, toggleDoc, clearAll],
  );

  return (
    <PrescriptionContext.Provider value={value}>{children}</PrescriptionContext.Provider>
  );
}

export function usePrescription(): PrescriptionContextValue {
  const ctx = useContext(PrescriptionContext);
  if (!ctx) {
    throw new Error('usePrescription deve ser usado dentro de um PrescriptionProvider');
  }
  return ctx;
}
