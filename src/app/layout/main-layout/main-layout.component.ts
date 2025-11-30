import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
// Imports de los componentes del Layout
import { SidebarComponent } from '../components/sidebar/sidebar.component';
import { HeaderComponent } from '../components/header/header.component';
import { FooterComponent } from '../components/footer/footer.component';

// FIX 1A: Importar el Modal y el Servicio de Estado
import { QuickTransactionModalComponent } from '@shared/components/quick-transaction-modal/quick-transaction-modal.component';
import { ModalStateService } from '@core/services/modal-state.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    SidebarComponent,
    HeaderComponent,
    FooterComponent,
    QuickTransactionModalComponent // FIX 1B: Añadir a los imports
  ],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss']
})
export class MainLayoutComponent {
  public modalStateService = inject(ModalStateService);
}
