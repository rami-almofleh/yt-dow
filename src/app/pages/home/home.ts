import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { TranslocoDirective } from '@jsverse/transloco';

import { DOWNLOAD_LINKS, type DesktopOs } from '../../core/downloads.config';
import { isElectronApp } from '../../core/electron-detection';
import { detectOs } from '../../core/os-detection';
import { DownloadHistory } from '../../features/download-history/download-history';
import { UrlInput } from '../../features/url-input/url-input';
import { VideoPreview } from '../../features/video-preview/video-preview';

// Betriebssystem-/Markennamen bleiben unübersetzt (Eigennamen, in allen 4
// unterstützten Sprachen gleich üblich).
const PLATFORMS: { os: DesktopOs; label: string }[] = [
  { os: 'mac', label: 'macOS' },
  { os: 'windows', label: 'Windows' },
  { os: 'linux', label: 'Linux' },
];

@Component({
  selector: 'app-home',
  imports: [MatButtonModule, UrlInput, VideoPreview, DownloadHistory, TranslocoDirective],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class HomePage {
  // Same Angular build serves both the public website and the packaged
  // desktop app - the website should promote downloading the app, while the
  // app itself needs to show the actual tool, not an ad for itself.
  protected readonly isElectron = isElectronApp();

  protected readonly downloadLinks = DOWNLOAD_LINKS;
  // Falls Erkennung fehlschlägt (z.B. Bot, unbekannter User-Agent): Windows
  // als meistgenutztes Desktop-Betriebssystem als Standard vorschlagen.
  protected readonly primary = PLATFORMS.find((p) => p.os === detectOs()) ?? PLATFORMS[1];
  protected readonly others = PLATFORMS.filter((p) => p.os !== this.primary.os);
}
