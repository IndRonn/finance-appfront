import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiStateService } from '@core/services/ui-state.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  public uiState = inject(UiStateService);

  // Datos simulados del usuario (luego vendrán del AuthService)
  currentUser = signal({
    name: 'Ronny Méndez',
    role: 'Administrador',
    initials: 'RM'
  });

  hasNotifications = signal(true); // Para mostrar el puntito rojo

  openNewTransaction() {
    console.log('✨ Nuevo Gasto clickeado');
    // Aquí abriremos el Modal en el futuro
  }

  toggleNotifications() {
    this.hasNotifications.set(false);
  }
}
