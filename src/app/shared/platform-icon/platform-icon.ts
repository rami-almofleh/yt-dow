import { Component, input } from '@angular/core';

import type { Platform } from '../../core/platform';

@Component({
  selector: 'app-platform-icon',
  templateUrl: './platform-icon.html',
  styleUrl: './platform-icon.scss',
})
export class PlatformIcon {
  readonly platform = input.required<Platform>();
}
