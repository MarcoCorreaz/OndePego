'use client';

import React, { useEffect, useId, useState } from 'react';
import {
  type OfflineMapProgress,
  type OfflineMapState,
  checkOfflineMapStatus,
  downloadOfflineMapToCache,
  formatBytesToMB,
  formatPreDownloadCopy,
  formatSavedMapCopy,
  removeOfflineMapFromCache,
  transitionOfflineMapState,
} from '@/lib/offlineMapManager';
import { DEFAULT_PMTILES_ARCHIVE_PATH } from '@/lib/pmtilesProtocol';

export interface OfflineMapDownloadProps {
  pmtilesArchivePath?: string;
}

export function OfflineMapDownload({
  pmtilesArchivePath = DEFAULT_PMTILES_ARCHIVE_PATH,
}: OfflineMapDownloadProps) {
  const progressId = useId();
  const [state, setState] = useState<OfflineMapState>('checando');
  const [sizeBytes, setSizeBytes] = useState<number | null>(null);
  const [progress, setProgress] = useState<OfflineMapProgress>({
    loadedBytes: 0,
    totalBytes: null,
    percent: 0,
  });

  useEffect(() => {
    let cancelled = false;

    async function runInitialCheck() {
      const result = await checkOfflineMapStatus(pmtilesArchivePath);
      if (cancelled) return;

      setSizeBytes(result.sizeBytes);
      if (result.state === 'sem-suporte') {
        setState((prev) => transitionOfflineMapState(prev, { type: 'UNSUPPORTED' }));
      } else if (result.state === 'salvo') {
        setState((prev) =>
          transitionOfflineMapState(prev, {
            type: 'CHECK_FOUND',
            sizeBytes: result.sizeBytes,
          }),
        );
      } else {
        setState((prev) =>
          transitionOfflineMapState(prev, {
            type: 'CHECK_NOT_FOUND',
            sizeBytes: result.sizeBytes,
          }),
        );
      }
    }

    runInitialCheck();

    return () => {
      cancelled = true;
    };
  }, [pmtilesArchivePath]);

  const handleStartDownload = async () => {
    setState((prev) => transitionOfflineMapState(prev, { type: 'START_DOWNLOAD' }));
    setProgress({
      loadedBytes: 0,
      totalBytes: sizeBytes,
      percent: sizeBytes ? 0 : null,
    });

    try {
      const saved = await downloadOfflineMapToCache(pmtilesArchivePath, (nextProgress) => {
        setProgress(nextProgress);
        if (nextProgress.totalBytes) {
          setSizeBytes(nextProgress.totalBytes);
        }
      });

      setSizeBytes(saved.sizeBytes);
      setState((prev) =>
        transitionOfflineMapState(prev, {
          type: 'DOWNLOAD_SUCCESS',
          sizeBytes: saved.sizeBytes,
        }),
      );
    } catch {
      setState((prev) => transitionOfflineMapState(prev, { type: 'DOWNLOAD_ERROR' }));
    }
  };

  const handleRemoveSavedMap = async () => {
    await removeOfflineMapFromCache(pmtilesArchivePath);
    setState((prev) => transitionOfflineMapState(prev, { type: 'REMOVE_SAVED' }));
    const recheck = await checkOfflineMapStatus(pmtilesArchivePath);
    setSizeBytes(recheck.sizeBytes);
  };

  if (state === 'sem-suporte') {
    return null;
  }

  return (
    <div
      role="region"
      aria-label="Mapa para uso sem internet"
      aria-live="polite"
      className="rounded-[var(--r-plate)] border-2 border-[var(--c-border)] bg-[var(--c-bg-soft)] p-3.5 sm:p-4"
    >
      {state === 'checando' && (
        <p className="text-base font-bold text-[var(--c-text-2)]">
          Verificando se o mapa já está salvo neste aparelho...
        </p>
      )}

      {state === 'nao-salvo' && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-base font-bold text-[var(--c-text)]">
            {formatPreDownloadCopy(sizeBytes)}
          </p>
          <button
            type="button"
            onClick={handleStartDownload}
            className="inline-flex min-h-[48px] shrink-0 items-center justify-center gap-2 rounded-[var(--r-button)] border-2 border-[var(--c-border)] bg-[var(--c-brand)] px-4 py-2 font-display text-lg font-bold text-white active:translate-y-px"
          >
            <span aria-hidden="true">⬇</span>
            <span>Baixar mapa para usar offline</span>
          </button>
        </div>
      )}

      {state === 'baixando' && (
        <div className="space-y-2">
          <label
            htmlFor={progressId}
            className="block font-display text-lg font-bold text-[var(--c-text)]"
          >
            {progress.percent !== null
              ? `Baixando mapa para usar sem internet: ${progress.percent}% (${formatBytesToMB(progress.loadedBytes)} de ${formatBytesToMB(progress.totalBytes)})`
              : `Baixando mapa para usar sem internet (${formatBytesToMB(progress.loadedBytes)} recebidos)...`}
          </label>
          <progress
            id={progressId}
            max={100}
            value={progress.percent !== null ? progress.percent : undefined}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress.percent !== null ? progress.percent : undefined}
            className="h-4 w-full overflow-hidden rounded-[var(--r-chip)] border-2 border-[var(--c-border)] accent-[var(--c-brand)]"
          />
        </div>
      )}

      {state === 'salvo' && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex min-h-[48px] items-center gap-2 rounded-[var(--r-chip)] border-2 border-[var(--c-free)] bg-[var(--c-free-tint)] px-3.5 py-1.5 font-display text-lg font-bold text-[var(--c-free)]">
            <span aria-hidden="true">✓</span>
            <span>{formatSavedMapCopy(sizeBytes)}</span>
          </span>

          <button
            type="button"
            onClick={handleRemoveSavedMap}
            className="inline-flex min-h-[48px] items-center justify-center rounded-[var(--r-button)] border-2 border-[var(--c-border)] bg-[var(--c-bg)] px-4 py-2 font-display text-base font-bold text-[var(--c-text)] hover:bg-[var(--c-brand-tint)] active:translate-y-px"
          >
            Remover mapa salvo
          </button>
        </div>
      )}

      {state === 'erro' && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="rounded border-2 border-[var(--c-border)] bg-[var(--c-attn)] px-3 py-2 text-base font-bold text-[var(--c-text)]">
            Não foi possível baixar o mapa agora. A lista completa continua disponível logo
            abaixo; quando tiver sinal estável, você pode tentar de novo.
          </p>

          <button
            type="button"
            onClick={handleStartDownload}
            className="inline-flex min-h-[48px] shrink-0 items-center justify-center rounded-[var(--r-button)] border-2 border-[var(--c-border)] bg-[var(--c-brand)] px-4 py-2 font-display text-lg font-bold text-white active:translate-y-px"
          >
            Tentar de novo
          </button>
        </div>
      )}
    </div>
  );
}
