// frontend/src/app/components/test/test.component.ts
import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-test',
  template: `
    <div *ngIf="data">
      <h3>Datos de API:</h3>
      <pre>{{ data | json }}</pre>
    </div>
    <button (click)="fetchData()">Probar API</button>
  `
})
export class TestComponent {
  data: any;

  constructor(private apiService: ApiService) {}

  fetchData() {
    this.apiService.get('user').subscribe({
      next: (response) => this.data = response,
      error: (error) => console.error('Error:', error)
    });
  }
}