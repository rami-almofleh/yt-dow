import { Injectable, signal } from '@angular/core';

import type { DownloadHistoryEntry } from './models/download-history-entry.model';

const STORAGE_KEY = 'reelio-download-history';
const MAX_ENTRIES = 10;

@Injectable({ providedIn: 'root' })
export class DownloadHistoryService {
  private readonly _entries = signal<DownloadHistoryEntry[]>(this.readFromStorage());

  readonly entries = this._entries.asReadonly();

  add(entry: Omit<DownloadHistoryEntry, 'id' | 'downloadedAt'>): void {
    const newEntry: DownloadHistoryEntry = {
      ...entry,
      id: crypto.randomUUID(),
      downloadedAt: Date.now(),
    };
    // Bei "erneut herunterladen" den alten Eintrag ersetzen statt zu
    // duplizieren - er rutscht einfach mit neuem Zeitstempel nach oben.
    const key = (e: Pick<DownloadHistoryEntry, 'sourceUrl' | 'format' | 'height'>) =>
      `${e.sourceUrl}|${e.format}|${e.height ?? ''}`;
    const withoutDuplicate = this._entries().filter((e) => key(e) !== key(newEntry));
    const next = [newEntry, ...withoutDuplicate].slice(0, MAX_ENTRIES);
    this._entries.set(next);
    this.writeToStorage(next);
  }

  clear(): void {
    this._entries.set([]);
    this.writeToStorage([]);
  }

  private readFromStorage(): DownloadHistoryEntry[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private writeToStorage(entries: DownloadHistoryEntry[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
      // Storage voll/blockiert (z. B. Privatmodus) - Verlauf gilt dann nur für diese Sitzung.
    }
  }
}
