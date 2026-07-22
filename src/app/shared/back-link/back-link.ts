import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'app-back-link',
  imports: [RouterLink, TranslocoDirective],
  templateUrl: './back-link.html',
  styleUrl: './back-link.scss',
})
export class BackLink {}
