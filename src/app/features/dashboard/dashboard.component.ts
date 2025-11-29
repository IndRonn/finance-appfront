import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from './services/dashboard.service';
import { DailyStatus } from '@core/models/dashboard.model';
import { UiStateService } from '@core/services/ui-state.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  public uiState = inject(UiStateService); // Público para usar en HTML (Blur)

  // Estado reactivo para los datos
  status = signal<DailyStatus | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.dashboardService.getDailyStatus().subscribe({
      next: (data) => {
        this.status.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error cargando dashboard', err);
        this.error.set('No se pudo conectar con Gringotts (Error de servidor)');
        this.isLoading.set(false);
      }
    });
  }

  // Helper para determinar el color del "Disponible"
  getAvailabilityColor(amount: number): string {
    if (amount > 50) return 'var(--color-primary)'; // Verde seguro
    if (amount > 0) return 'var(--color-warning)';   // Dorado precaución
    return 'var(--color-danger)';                    // Rojo peligro
  }
}
