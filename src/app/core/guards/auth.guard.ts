import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { StorageService } from '../services/storage.service';

export const authGuard: CanActivateFn = (route, state) => {
  const storage = inject(StorageService);
  const router = inject(Router);

  // Si tiene token, pasa.
  if (storage.getToken()) {
    return true;
  }

  // Si no, al login.
  router.navigate(['/auth/login']);
  return false;
};
