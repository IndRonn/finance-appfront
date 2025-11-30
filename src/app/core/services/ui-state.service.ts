import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UiStateService {
  // Signal para el Modo Privacidad
  readonly isPrivacyMode = signal<boolean>(localStorage.getItem('privacy_mode') === 'true');

  // 👇 AGREGAMOS ESTO (La propiedad que faltaba)
  readonly currentDate = new Date();

  constructor() {
    effect(() => {
      localStorage.setItem('privacy_mode', String(this.isPrivacyMode()));
    });
  }

  togglePrivacy(): void {
    this.isPrivacyMode.update(v => !v);
  }
}
