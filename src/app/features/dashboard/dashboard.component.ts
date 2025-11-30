import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from './services/dashboard.service';
import { DailyStatus } from '@core/models/dashboard.model';
import { UiStateService } from '@core/services/ui-state.service';

// 👇 IMPORTAMOS EL RITUAL
import { DailyRitualComponent } from './components/daily-ritual/daily-ritual.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, DailyRitualComponent], // <--- AGREGAR AQUÍ
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  public uiState = inject(UiStateService);

  status = signal<DailyStatus | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);

  // Estado del Ritual
  showRitual = signal(false);

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading.set(true);
    // Usamos el servicio real (o mock si aún no tienes backend para esto)
    this.dashboardService.getDailyStatus().subscribe({
      next: (data) => {
        this.status.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.isLoading.set(false);
        // Fallback visual para desarrollo si falla
        if (!this.status()) {
          this.status.set({
            date: new Date().toISOString(),
            availableForToday: 142.50,
            totalMonthLimit: 3000,
            totalMonthSpent: 1200,
            remainingDays: 15,
            status: 'OK'
          });
        }
      }
    });
  }

  // --- RITUAL ACTIONS ---

  openRitual() {
    this.showRitual.set(true);
  }

  onRitualCompleted() {
    this.showRitual.set(false);
    this.loadData(); // Recargamos para ver el saldo en 0 (o ajustado)
  }

  getAvailabilityColor(amount: number): string {
    if (amount > 50) return 'var(--color-primary)';
    if (amount > 0) return 'var(--color-warning)';
    return 'var(--color-danger)';
  }
}
