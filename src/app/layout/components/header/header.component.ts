import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiStateService } from '@core/services/ui-state.service';
import { ModalStateService } from '@core/services/modal-state.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  public uiState = inject(UiStateService);
  private modalStateService = inject(ModalStateService);

  // Datos simulados del usuario (luego vendrán del AuthService)
  currentUser = signal({
    name: 'Ronny Méndez',
    role: 'Administrador',
    initials: 'RM'
  });

  hasNotifications = signal(true); // Para mostrar el puntito rojo

  openNewTransaction() {
    // LLAMADA AL SERVICIO GLOBAL
    this.modalStateService.openTransactionModal();
    // Console log ya no es necesario
    // console.log('✨ Nuevo Gasto clickeado');
  }

  toggleNotifications() {
    this.hasNotifications.set(false);
  }
}
