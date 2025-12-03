import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
// Importamos el servicio de cuentas
import { AccountService } from '@features/accounts/services/account.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  private authService = inject(AuthService);
  // Hacemos público el servicio para usar sus signals en el HTML
  public accountService = inject(AccountService);

  ngOnInit() {
    // Cargamos los datos al iniciar la app (así el widget aparece siempre)
    this.accountService.loadAccounts();
  }

  logout() {
    // Solo llamamos al servicio. Él se encarga de borrar token y redirigir.
    this.authService.logout();
  }
}
