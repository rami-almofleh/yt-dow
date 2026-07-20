import { Routes } from '@angular/router';

import { HomePage } from './pages/home/home';
import { ImpressumPage } from './pages/impressum/impressum';
import { PrivacyPage } from './pages/privacy/privacy';
import { TermsPage } from './pages/terms/terms';

export const routes: Routes = [
  { path: '', component: HomePage },
  { path: 'datenschutz', component: PrivacyPage },
  { path: 'impressum', component: ImpressumPage },
  { path: 'nutzungsbedingungen', component: TermsPage },
];
