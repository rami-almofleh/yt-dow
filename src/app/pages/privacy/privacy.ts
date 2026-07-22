import { Component } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';

import { BackLink } from '../../shared/back-link/back-link';

@Component({
  selector: 'app-privacy',
  imports: [TranslocoDirective, BackLink],
  templateUrl: './privacy.html',
})
export class PrivacyPage {}
