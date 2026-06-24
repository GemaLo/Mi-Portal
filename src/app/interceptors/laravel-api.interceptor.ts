// frontend/src/app/interceptors/laravel-api.interceptor.ts
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class LaravelApiInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let clonedRequest = req;
    
    // Solo modificar requests a nuestra API Laravel
    if (req.url.includes('/api/')) {
      clonedRequest = req.clone({
        setHeaders: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
    }
    
    return next.handle(clonedRequest);
  }
}