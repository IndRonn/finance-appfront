import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';

export const routes: Routes = [
  // 1. Redirección inicial (Si entran a raíz, van al dashboard)
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },

  // 2. Rutas Públicas (Login/Register)
  // Estas NO tienen layout, por eso cargan aparte.
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },

  // 3. RUTAS PRIVADAS (LA CLAVE ESTÁ AQUÍ 👇)
  {
    path: '',
    component: MainLayoutComponent, // <--- ¡AQUÍ ESTÁ LA REFERENCIA!
    canActivate: [authGuard],       // Protege al padre y a todos los hijos
    children: [
      // Todo lo que pongas aquí se renderizará DENTRO del MainLayout
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'accounts',
        loadComponent: () => import('./features/accounts/accounts.component').then(m => m.AccountsComponent)
      },
      {
        path: 'transactions',
        loadComponent: () => import('./features/transactions/transactions.component').then(m => m.TransactionsComponent)
      },
      {
        path: 'budget', // 👈 La ruta que definimos en el Sidebar
        loadComponent: () => import('./features/budgets/budgets.component').then(m => m.BudgetsComponent)
      },
      {
        path: 'savings',
        loadComponent: () => import('./features/savings/savings.component').then(m => m.SavingsComponent)
      },
      {
        path: 'categories',
        loadComponent: () => import('./features/categories/categories.component').then(m => m.CategoriesComponent)
      },
      // Futuras rutas:
      // { path: 'budget', ... }
    ]
  },

  // 4. Fallback (Si no encuentra nada, mándalo al dashboard)
  { path: '**', redirectTo: 'dashboard' }
];
