// frontend/src/app/app.component.ts
import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd,RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet], // 2. Agregarlo aquí
  template: `
    <router-outlet></router-outlet>
  `
})
export class AppComponent implements OnInit {
  title = 'Mi Portal RH';

  constructor(private router: Router) {}
  
  ngOnInit() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      window.scrollTo(0, 0);
    });
  }
}