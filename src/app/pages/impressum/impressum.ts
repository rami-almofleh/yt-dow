import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';

import { BackLink } from '../../shared/back-link/back-link';

@Component({
  selector: 'app-impressum',
  imports: [RouterLink, TranslocoDirective, BackLink],
  templateUrl: './impressum.html',
})
export class ImpressumPage {}
