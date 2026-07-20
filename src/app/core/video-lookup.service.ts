import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';

import type { VideoInfo } from './models/video-info.model';

export type LookupStatus = 'idle' | 'loading' | 'success' | 'error';

@Injectable({ providedIn: 'root' })
export class VideoLookupService {
  private readonly http = inject(HttpClient);

  private readonly _status = signal<LookupStatus>('idle');
  private readonly _videoInfo = signal<VideoInfo | null>(null);
  private readonly _errorMessage = signal<string | null>(null);
  private readonly _errorCode = signal<string | null>(null);

  readonly status = this._status.asReadonly();
  readonly videoInfo = this._videoInfo.asReadonly();
  readonly errorMessage = this._errorMessage.asReadonly();
  readonly errorCode = this._errorCode.asReadonly();

  reset(): void {
    this._status.set('idle');
    this._videoInfo.set(null);
    this._errorMessage.set(null);
    this._errorCode.set(null);
  }

  fetchInfo(url: string): void {
    this._status.set('loading');
    this._errorMessage.set(null);
    this._errorCode.set(null);

    this.http.get<VideoInfo>('/api/info', { params: { url } }).subscribe({
      next: (info) => {
        this._videoInfo.set(info);
        this._status.set('success');
      },
      error: (err: HttpErrorResponse) => {
        this._videoInfo.set(null);
        this._errorCode.set(err.error?.error?.code ?? 'UNKNOWN_ERROR');
        this._errorMessage.set(this.resolveErrorMessage(err));
        this._status.set('error');
      },
    });
  }

  private resolveErrorMessage(err: HttpErrorResponse): string {
    // Unser Backend liefert bei echten Fehlern immer { error: { code, message } }
    // (siehe server/middleware/errorHandler.mjs) - wenn das da ist, ist es die
    // genaueste verfügbare Information und hat Vorrang.
    const backendMessage: string | undefined = err.error?.error?.message;
    if (backendMessage) {
      return backendMessage;
    }

    // Kein strukturierter Body: Der Request hat unser Backend gar nicht (mit einer
    // eigenen Antwort) erreicht. status 0 = Browser konnte keine Verbindung
    // aufbauen; 502/503/504 = ein davorliegender Reverse-Proxy (im Dev-Betrieb:
    // Angulars eigener --proxy-config) ist erreichbar, aber der Node-Prozess
    // dahinter nicht - live getestet: Backend gestoppt → Angular-Dev-Proxy
    // antwortete mit einem eigenen 500 ohne unseren JSON-Body.
    if (err.status === 0 || [500, 502, 503, 504].includes(err.status)) {
      return 'Server nicht erreichbar. Bitte prüfe deine Internetverbindung und versuche es erneut.';
    }
    return 'Etwas ist schiefgelaufen. Bitte versuche es erneut.';
  }
}
