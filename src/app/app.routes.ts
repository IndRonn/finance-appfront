import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';

export const routes: Routes = [
  // =========================================================
  // 1. REDIRECCIÓN RAÍZ
  // =========================================================
  // Si el usuario entra a la raíz, intentamos llevarlo al dashboard.
  // El Guard validará si tiene sesión; si no, el Guard lo manda al login.
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },

  // =========================================================
  // 2. RUTAS PÚBLICAS (AUTH)
  // =========================================================
  // Estas cargan FUERA del MainLayout (sin sidebar, sin header interno).
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },

  // =========================================================
  // 3. RUTAS PROTEGIDAS (MAIN LAYOUT)
  // =========================================================
  // Aquí vive la aplicación principal. 'authGuard' protege todo este bloque.
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
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
        path: 'budget',
        loadComponent: () => import('./features/budgets/budgets.component').then(m => m.BudgetsComponent)
      },
      {
        path: 'savings',
        loadComponent: () => import('./features/savings/savings.component').then(m => m.SavingsComponent)
      },
      {
        path: 'debts',
        loadComponent: () => import('./features/debts/debts.component').then(m => m.DebtsComponent)
      },
      {
        path: 'bills',
        loadComponent: () => import('./features/bills/bills.component').then(m => m.BillsComponent)
      },

      // ---> MÓDULO DE CONFIGURACIÓN (CON RUTAS HIJAS) <---
      {
        path: 'settings',
        loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent),
        children: [
          // Redirección por defecto dentro de settings: ir a Categorías
          { path: '', redirectTo: 'categories', pathMatch: 'full' },

          // Pestaña 1: Categorías
          {
            path: 'categories',
            loadComponent: () => import('./features/categories/categories.component').then(m => m.CategoriesComponent)
          },

          // Pestaña 2: Etiquetas (Tags)
          {
            path: 'tags',
            loadComponent: () => import('./features/tags/tags.component').then(m => m.TagsComponent)
          }
        ]
      }
    ]
  },

  // =========================================================
  // 4. FALLBACK (WILDCARD)
  // =========================================================
  // Cualquier ruta desconocida redirige al dashboard (o al login si el guard actúa).
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
