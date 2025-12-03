import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UiStateService {
  readonly isPrivacyMode = signal<boolean>(localStorage.getItem('privacy_mode') === 'true');
  readonly currentDate = new Date();

  // 👇 NUEVO: Título dinámico de la página
  readonly pageTitle = signal<string>('Dashboard');
  // 👇 NUEVO: Subtítulo opcional (ej: "Visión General")
  readonly pageSubtitle = signal<string>('Visión General');

  constructor() {
    effect(() => {
      localStorage.setItem('privacy_mode', String(this.isPrivacyMode()));
    });
  }

  togglePrivacy(): void {
    this.isPrivacyMode.update(v => !v);
  }

  // Método para que las páginas actualicen el header al entrar
  setPageTitle(title: string, subtitle: string = 'Gestión') {
    this.pageTitle.set(title);
    this.pageSubtitle.set(subtitle);
  }
}
