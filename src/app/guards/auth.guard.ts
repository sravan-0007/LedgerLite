import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { FirebaseService } from '../services/firebase.service';
import { map, take, switchMap, filter } from 'rxjs/operators';

export const authGuard: CanActivateFn = () => {
  const firebaseService = inject(FirebaseService);
  const router = inject(Router);

  return firebaseService.loading$.pipe(
    filter(loading => !loading),
    take(1),
    switchMap(() => firebaseService.user$.pipe(
      take(1),
      map(user => {
        if (user) {
          return true;
        } else {
          router.navigate(['/login']);
          return false;
        }
      })
    ))
  );
};
