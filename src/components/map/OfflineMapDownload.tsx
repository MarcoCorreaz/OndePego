'use client';

import React, { useEffect, useId, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
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

  const radius = 20;
  const circumference = 2 * Math.PI * radius; // ~125.66
  const percentValue = progress.percent ?? 0;
  const strokeOffset = circumference - (percentValue / 100) * circumference;

  return (
    <div
      role="region"
      aria-label="Mapa para uso sem internet"
      aria-live="polite"
      className="rounded-[var(--r-plate)] border border-[var(--c-border)] bg-[var(--c-bg)] p-4"
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
            className="ui-pressable inline-flex min-h-[48px] shrink-0 items-center justify-center gap-2 rounded-[var(--r-button)] bg-[var(--c-brand)] px-4 py-2 font-display text-lg font-bold text-white shadow-xs transition-opacity hover:opacity-95 active:scale-[0.98]"
          >
            <Icon name="download" className="h-5 w-5" />
            <span>Baixar mapa para usar offline</span>
          </button>
        </div>
      )}

      {state === 'baixando' && (
        <div className="flex items-center gap-4">
          {/* Anel de progresso SVG circular (WAI-ARIA progressbar) */}
          <div
            role="progressbar"
            id={progressId}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percentValue}
            aria-label="Progresso do download do mapa offline"
            className="relative flex h-14 w-14 shrink-0 items-center justify-center"
          >
            <svg viewBox="0 0 48 48" className="h-14 w-14 -rotate-90">
              {/* Círculo base */}
              <circle
                cx="24"
                cy="24"
                r={radius}
                fill="none"
                stroke="var(--c-border-strong)"
                strokeWidth={4}
              />
              {/* Anel de progresso */}
              <circle
                cx="24"
                cy="24"
                r={radius}
                fill="none"
                stroke="var(--c-brand)"
                strokeWidth={4}
                strokeDasharray={circumference}
                strokeDashoffset={strokeOffset}
                strokeLinecap="round"
                className="transition-all duration-200"
              />
            </svg>
            <span className="absolute font-display text-xs font-black text-[var(--c-brand)]">
              {percentValue}%
            </span>
          </div>

          <div className="space-y-1">
            <p className="font-display text-base font-bold text-[var(--c-text)]">
              {progress.percent !== null
                ? `Baixando mapa: ${progress.percent}% (${formatBytesToMB(progress.loadedBytes)} de ${formatBytesToMB(progress.totalBytes)})`
                : `Baixando mapa (${formatBytesToMB(progress.loadedBytes)} recebidos)...`}
            </p>
            <p className="text-xs text-[var(--c-text-2)]">
              Aguarde sem fechar esta tela para concluir o armazenamento local.
            </p>
          </div>
        </div>
      )}

      {state === 'salvo' && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex min-h-[48px] items-center gap-2 rounded-[var(--r-chip)] border border-[var(--c-free)]/30 bg-[var(--c-free-tint)] px-3.5 py-1.5 font-display text-base font-bold text-[var(--c-free-ink)]">
            <Icon name="check" className="h-5 w-5" />
            <span>{formatSavedMapCopy(sizeBytes)}</span>
          </span>

          <button
            type="button"
            onClick={handleRemoveSavedMap}
            className="ui-pressable inline-flex min-h-[48px] items-center justify-center rounded-[var(--r-button)] border border-[var(--c-border)] bg-[var(--c-surface)] px-4 py-2 font-display text-base font-bold text-[var(--c-text)] hover:bg-[var(--c-bg-soft)] active:scale-[0.98]"
          >
            Remover mapa salvo
          </button>
        </div>
      )}

      {state === 'erro' && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="rounded-[var(--r-button)] border border-[var(--c-attn-border)] bg-[var(--c-attn-tint)] px-3.5 py-2.5 text-base font-bold text-[var(--c-attn-ink)]">
            Não foi possível baixar o mapa agora. A lista completa continua disponível logo
            abaixo; quando tiver sinal estável, você pode tentar de novo.
          </p>

          <button
            type="button"
            onClick={handleStartDownload}
            className="ui-pressable inline-flex min-h-[48px] shrink-0 items-center justify-center rounded-[var(--r-button)] bg-[var(--c-brand)] px-4 py-2 font-display text-lg font-bold text-white shadow-xs active:scale-[0.98]"
          >
            Tentar de novo
          </button>
        </div>
      )}
    </div>
  );
}
