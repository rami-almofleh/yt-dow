import { Injectable, signal } from '@angular/core';

import type { VideoInfo } from './models/video-info.model';

export type DownloadFormat = 'mp4' | 'mp3' | 'wav';

// Hält die aktuell gewählte Kombination aus Format (mp4/mp3/wav) + Video-Qualität.
// Eigener Service statt Teil von VideoLookupService, weil es fachlich getrennte
// Zuständigkeiten sind (Lookup-Ergebnis vs. Nutzerauswahl) - wird in Schritt 9
// vom Download-Button gelesen.
@Injectable({ providedIn: 'root' })
export class DownloadSelectionService {
  private readonly _format = signal<DownloadFormat>('mp4');
  private readonly _height = signal<number | null>(null);

  readonly format = this._format.asReadonly();
  readonly height = this._height.asReadonly();

  selectFormat(format: DownloadFormat): void {
    this._format.set(format);
  }

  selectHeight(height: number | null): void {
    this._height.set(height);
  }

  // Bei jedem neuen Lookup-Ergebnis auf sinnvolle Standardwerte zurücksetzen:
  // MP4 in der besten verfügbaren Qualität.
  resetTo(videoInfo: VideoInfo): void {
    this._format.set('mp4');
    this._height.set(videoInfo.videoQualities[0]?.height ?? null);
  }
}
