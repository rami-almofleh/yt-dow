import { Component } from '@angular/core';

import { DownloadHistory } from '../../features/download-history/download-history';
import { UrlInput } from '../../features/url-input/url-input';
import { VideoPreview } from '../../features/video-preview/video-preview';
import { AdSlot } from '../../shared/ad-slot/ad-slot';

@Component({
  selector: 'app-home',
  imports: [UrlInput, VideoPreview, DownloadHistory, AdSlot],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class HomePage {}
