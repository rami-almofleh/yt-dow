import { Routes } from '@angular/router';

import { HomePage } from './pages/home/home';
import { PrivacyPage } from './pages/privacy/privacy';

export const routes: Routes = [
  { path: '', component: HomePage },
  { path: 'datenschutz', component: PrivacyPage },
];
