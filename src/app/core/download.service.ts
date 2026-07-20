import { Injectable, inject, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

import { DownloadHistoryService } from './download-history.service';
import type { DownloadFormat } from './download-selection.service';
import type { Platform } from './platform';

export interface DownloadParams {
  sourceUrl: string;
  format: DownloadFormat;
  height: number | null;
  title: string;
  platform: Platform;
  platformLabel: string;
}

// Passend zum Backend-seitigen Hard-Timeout (server/config.mjs, downloadTimeoutMs) -
// verhindert, dass die UI bei einem hängenden Request für immer im Lade-Zustand bleibt.
const DOWNLOAD_TIMEOUT_MS = 10 * 60 * 1000;

@Injectable({ providedIn: 'root' })
export class DownloadService {
  private readonly snackBar = inject(MatSnackBar);
  private readonly history = inject(DownloadHistoryService);

  readonly isDownloading = signal(false);

  async download(params: DownloadParams): Promise<void> {
    if (this.isDownloading()) {
      return;
    }
    this.isDownloading.set(true);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS);

    try {
      const response = await fetch(this.buildUrl(params), { signal: controller.signal });

      if (!response.ok) {
        this.snackBar.open(await this.extractErrorMessage(response), 'OK', { duration: 6000 });
        return;
      }

      // Ganze Datei als Blob puffern statt direkt auf Disk zu streamen - für
      // v1 bewusst in Kauf genommen, siehe Ergebnis-Notiz in PLAN.md
      // (Schritt 9): so lässt sich der Fehlerfall (4xx/5xx-Body) noch normal
      // auslesen, was beim reinen "Link antippen"-Ansatz nicht ginge.
      const blob = await response.blob();
      this.triggerBrowserDownload(blob, this.extractFilename(response, params));

      this.history.add(params);
      this.snackBar.open('Download gestartet.', undefined, { duration: 3000 });
    } catch (err) {
      const message = controller.signal.aborted
        ? 'Der Download hat zu lange gedauert und wurde abgebrochen.'
        : 'Download fehlgeschlagen. Bitte versuche es erneut.';
      this.snackBar.open(message, 'OK', { duration: 6000 });
    } finally {
      clearTimeout(timeout);
      this.isDownloading.set(false);
    }
  }

  private buildUrl(params: DownloadParams): string {
    const query = new URLSearchParams({ url: params.sourceUrl, format: params.format, title: params.title });
    if (params.format === 'mp4' && params.height != null) {
      query.set('height', String(params.height));
    }
    return `/api/download?${query.toString()}`;
  }

  private async extractErrorMessage(response: Response): Promise<string> {
    try {
      const body = await response.json();
      return body?.error?.message ?? 'Download fehlgeschlagen. Bitte versuche es erneut.';
    } catch {
      return 'Download fehlgeschlagen. Bitte versuche es erneut.';
    }
  }

  private extractFilename(response: Response, params: DownloadParams): string {
    const disposition = response.headers.get('Content-Disposition');
    const match = disposition?.match(/filename="([^"]+)"/);
    return match?.[1] ?? `${params.title}.${params.format}`;
  }

  private triggerBrowserDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }
}
