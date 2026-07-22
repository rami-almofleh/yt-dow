import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';

import { AdConsentService } from '../../core/ad-consent.service';

@Component({
  selector: 'app-consent-banner',
  imports: [MatButtonModule, RouterLink, TranslocoDirective],
  templateUrl: './consent-banner.html',
  styleUrl: './consent-banner.scss',
})
export class ConsentBanner {
  protected readonly consent = inject(AdConsentService);
}
