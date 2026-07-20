import type { DownloadFormat } from '../download-selection.service';
import type { Platform } from '../platform';

export interface DownloadHistoryEntry {
  id: string;
  sourceUrl: string;
  title: string;
  platform: Platform;
  platformLabel: string;
  format: DownloadFormat;
  height: number | null;
  downloadedAt: number;
}
