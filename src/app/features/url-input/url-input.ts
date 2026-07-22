import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslocoDirective } from '@jsverse/transloco';

import { DownloadSelectionService } from '../../core/download-selection.service';
import { detectPlatform } from '../../core/platform';
import { VideoLookupService } from '../../core/video-lookup.service';
import { PlatformIcon } from '../../shared/platform-icon/platform-icon';

@Component({
  selector: 'app-url-input',
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    PlatformIcon,
    TranslocoDirective,
  ],
  templateUrl: './url-input.html',
  styleUrl: './url-input.scss',
})
export class UrlInput {
  protected readonly lookup = inject(VideoLookupService);
  protected readonly selection = inject(DownloadSelectionService);

  protected readonly urlValue = signal('');
  protected readonly touched = signal(false);

  protected readonly detectedPlatform = computed(() => detectPlatform(this.urlValue().trim()));
  protected readonly isEmpty = computed(() => this.urlValue().trim().length === 0);
  protected readonly showFormatError = computed(
    () => this.touched() && !this.isEmpty() && this.detectedPlatform() === null,
  );

  protected onInputChange(value: string): void {
    this.urlValue.set(value);
    this.touched.set(true);
    if (this.lookup.status() !== 'idle') {
      this.lookup.reset();
    }
  }

  protected async onPaste(): Promise<void> {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        this.onInputChange(text.trim());
      }
    } catch {
      // Zwischenablage-Zugriff verweigert oder nicht unterstützt (z. B. kein
      // sicherer Kontext) - der Nutzer kann den Link weiterhin per Cmd/Ctrl+V
      // oder manuell einfügen.
    }
  }

  protected submit(): void {
    this.touched.set(true);
    if (this.isEmpty() || this.detectedPlatform() === null) {
      return;
    }
    this.lookup.fetchInfo(this.urlValue().trim());
  }

  // Setzt den laufenden Vorgang komplett zurück (Feld, Vorschau, Format-
  // /Qualitätsauswahl) - der Download-Verlauf (DownloadHistoryService) ist
  // davon absichtlich unberührt, da völlig unabhängig.
  protected clear(): void {
    this.urlValue.set('');
    this.touched.set(false);
    this.lookup.reset();
    this.selection.reset();
  }
}
