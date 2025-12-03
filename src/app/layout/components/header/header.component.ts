import { Component, inject, effect } from '@angular/core'; // Eliminar signal local
import { CommonModule } from '@angular/common';
import { UiStateService } from '@core/services/ui-state.service';
import { ModalStateService } from '@core/services/modal-state.service';
import { AuthService } from '@core/services/auth.service'; // Importar AuthService

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
  private authService = inject(AuthService); // Inyectar

  // Leemos el usuario real del servicio de autenticación
  // (Asegúrate de que AuthService tenga una signal 'currentUser' o un método getUser())
  // Si tu AuthService aún no tiene la signal pública, úsalo así:
  user = this.authService.currentUser;

  // Helper para iniciales
  get userInitials(): string {
    const u = this.user();
    if (!u) return 'GU'; // Guest User
    // Si tienes firstName y lastName
    return (u.firstName[0] + (u.lastName?.[0] || '')).toUpperCase();
  }

  get userName(): string {
    return this.user()?.firstName || 'Usuario';
  }

  openNewTransaction() {
    this.modalStateService.openTransactionModal();
  }
}
