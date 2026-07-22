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
        // Unser Backend liefert bei echten Fehlern immer { error: { code, message } }
        // (siehe server/middleware/errorHandler.mjs) - wenn das da ist, ist es die
        // genaueste verfügbare Information und hat Vorrang; sie kommt bereits fertig
        // (deutsch) vom Server, eine Übersetzung dafür bräuchte Backend-i18n, das ist
        // hier nicht im Umfang. Fehlt sie, wird die Vorlage anhand von errorCode
        // selbst übersetzen (siehe urlInput.error.* Keys).
        const backendCode: string | undefined = err.error?.error?.code;
        const backendMessage: string | undefined = err.error?.error?.message;
        if (backendCode && backendMessage) {
          this._errorCode.set(backendCode);
          this._errorMessage.set(backendMessage);
        } else if (err.status === 0 || [500, 502, 503, 504].includes(err.status)) {
          // Kein strukturierter Body: Der Request hat unser Backend gar nicht (mit
          // einer eigenen Antwort) erreicht. status 0 = Browser konnte keine
          // Verbindung aufbauen; 502/503/504 = ein davorliegender Reverse-Proxy (im
          // Dev-Betrieb: Angulars eigener --proxy-config) ist erreichbar, aber der
          // Node-Prozess dahinter nicht.
          this._errorCode.set('NETWORK_ERROR');
          this._errorMessage.set(null);
        } else {
          this._errorCode.set('UNKNOWN_ERROR');
          this._errorMessage.set(null);
        }
        this._status.set('error');
      },
    });
  }
}
