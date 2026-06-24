// frontend/src/app/guards/auth.guard.ts
import { Injectable, inject } from '@angular/core';
import { Router, CanActivate,CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem('auth_token');

  // console.log('Valor del token en el Guard:', token); // ESTO ES CLAVE

  if (token && token !== 'undefined' && token !== 'null') {
    console.log('Guard: Acceso permitido.');
    return true;
  } else {
    console.warn('Guard: Acceso denegado. Token no encontrado.');
    // Usamos el método parseUrl para una redirección más limpia en Guards funcionales
    return router.parseUrl('/login'); 
  }
};