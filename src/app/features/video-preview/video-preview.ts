import { Component, computed, effect, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { TranslocoDirective } from '@jsverse/transloco';

import { DownloadFormat, DownloadSelectionService } from '../../core/download-selection.service';
import { DownloadService } from '../../core/download.service';
import { formatDuration, formatFileSize } from '../../core/format-utils';
import { VideoLookupService } from '../../core/video-lookup.service';
import { PlatformIcon } from '../../shared/platform-icon/platform-icon';

@Component({
  selector: 'app-video-preview',
  imports: [
    MatButtonModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    PlatformIcon,
    TranslocoDirective,
  ],
  templateUrl: './video-preview.html',
  styleUrl: './video-preview.scss',
})
export class VideoPreview {
  protected readonly lookup = inject(VideoLookupService);
  protected readonly selection = inject(DownloadSelectionService);
  protected readonly downloadService = inject(DownloadService);

  protected readonly durationLabel = computed(() =>
    formatDuration(this.lookup.videoInfo()?.durationSeconds ?? null),
  );

  protected readonly currentAudioSizeLabel = computed(() => {
    const info = this.lookup.videoInfo();
    const option = info?.audioFormats.find((f) => f.id === this.selection.format());
    return formatFileSize(option?.estimatedBytes ?? null);
  });

  constructor() {
    // Bei jedem neuen erfolgreichen Lookup auf sinnvolle Standardwerte
    // zurücksetzen (beste MP4-Qualität) statt eine Auswahl vom vorherigen
    // Video zu behalten, die für dieses Video vielleicht gar nicht existiert.
    effect(() => {
      const info = this.lookup.videoInfo();
      if (info) {
        this.selection.resetTo(info);
      }
    });
  }

  protected onFormatChange(format: DownloadFormat): void {
    this.selection.selectFormat(format);
  }

  protected sizeLabel(bytes: number | null): string | null {
    return formatFileSize(bytes);
  }

  protected onDownload(): void {
    const info = this.lookup.videoInfo();
    if (!info) return;

    void this.downloadService.download({
      sourceUrl: info.sourceUrl,
      format: this.selection.format(),
      height: this.selection.height(),
      title: info.title,
      platform: info.platform,
      platformLabel: info.platformLabel,
    });
  }
}
