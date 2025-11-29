import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UiStateService {
  // Signal para el Modo Privacidad (Blur)
  // Leemos del localStorage al iniciar para recordar la preferencia
  readonly isPrivacyMode = signal<boolean>(localStorage.getItem('privacy_mode') === 'true');

  constructor() {
    // Effect: Cada vez que cambie la signal, guardamos en localStorage automáticamente
    effect(() => {
      localStorage.setItem('privacy_mode', String(this.isPrivacyMode()));
    });
  }

  togglePrivacy(): void {
    this.isPrivacyMode.update(v => !v);
  }
}
