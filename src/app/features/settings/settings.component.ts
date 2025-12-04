import { Component, OnInit, inject } from '@angular/core'; // Importar OnInit e inject
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UiStateService } from '@core/services/ui-state.service'; // Asegúrate de la ruta

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  private uiState = inject(UiStateService);

  ngOnInit() {
    // Al entrar a este módulo, tomamos control del Header
    this.uiState.setPageTitle('Configuración');
  }
}
