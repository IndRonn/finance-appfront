import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';

export const routes: Routes = [
  // Ruta por defecto: Si intenta entrar a la raíz, ver si puede ir al dashboard o al login
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },

  // Módulo de Autenticación (Público)
  {
    path: 'auth',
    loadChildren: () => import('@features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  }

  // Dashboard (Privado - Protegido por Guard)
  // Nota: Crearemos el dashboard luego, esto es para dejar la estructura lista
  //{
    //path: 'dashboard',
    //canActivate: [authGuard],
    //loadComponent: () => import('@features/dashboard/dashhboard.component').then(m => m.DashboardComponent)
    // ⚠️ Nota: DashboardComponent aun no existe, dará error si intentas navegar, pero compila.
    // Si prefieres que no de error runtime, comenta estas lineas del dashboard por ahora.
  //}
];
