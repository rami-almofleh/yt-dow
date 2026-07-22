import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';

import { DownloadHistoryService } from '../../core/download-history.service';
import { DownloadService } from '../../core/download.service';
import type { DownloadHistoryEntry } from '../../core/models/download-history-entry.model';
import { PlatformIcon } from '../../shared/platform-icon/platform-icon';

@Component({
  selector: 'app-download-history',
  imports: [MatButtonModule, PlatformIcon, TranslocoDirective],
  templateUrl: './download-history.html',
  styleUrl: './download-history.scss',
})
export class DownloadHistory {
  protected readonly history = inject(DownloadHistoryService);
  protected readonly downloadService = inject(DownloadService);
  // Direkt injiziert statt nur der Template-Direktive: relativeTime() wird aus
  // TS-Code heraus mit dynamisch berechneten Parametern (z.B. Minutenanzahl)
  // aufgerufen, nicht rein im Template.
  private readonly transloco = inject(TranslocoService);

  protected redownload(entry: DownloadHistoryEntry): void {
    void this.downloadService.download({
      sourceUrl: entry.sourceUrl,
      format: entry.format,
      height: entry.height,
      title: entry.title,
      platform: entry.platform,
      platformLabel: entry.platformLabel,
    });
  }

  protected formatLabel(entry: DownloadHistoryEntry): string {
    if (entry.format === 'mp4') {
      return entry.height ? `MP4 · ${entry.height}p` : 'MP4';
    }
    return entry.format.toUpperCase();
  }

  protected relativeTime(timestamp: number): string {
    const diffSeconds = Math.round((Date.now() - timestamp) / 1000);
    if (diffSeconds < 60) return this.transloco.translate('downloadHistory.justNow');
    const diffMinutes = Math.round(diffSeconds / 60);
    if (diffMinutes < 60) return this.transloco.translate('downloadHistory.minutesAgo', { count: diffMinutes });
    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) return this.transloco.translate('downloadHistory.hoursAgo', { count: diffHours });
    const diffDays = Math.round(diffHours / 24);
    const key = diffDays === 1 ? 'downloadHistory.dayAgo' : 'downloadHistory.daysAgo';
    return this.transloco.translate(key, { count: diffDays });
  }
}
