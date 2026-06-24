import { Component,OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // ← Agregar esto
import { RouterModule } from '@angular/router'; // ← Agregar esto

interface MetricCard {
  title: string;
  icon: string;
  value?: number;
  detail?: string;
  color: string;
  route: string;
}
@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  userRole = 'Administrador Global'; // Cambiar según usuario
  metrics: MetricCard[] = [];

  ngOnInit(): void {
    this.loadMetrics();
    this.simulateMetricUpdates();
  }

  private loadMetrics(): void {
    this.metrics = [
      {
        title: 'Empleados',
        icon: 'fas fa-users',
        value: 247,
        detail: '+12 este trimestre',
        color: 'blue',
        route: '/empleados'
      },
      {
        title: 'Tasa Retención',
        icon: 'fas fa-chart-pie',
        value: 94,
        detail: '+2% vs último año',
        color: 'green',
        route: '/metricas'
      },
      {
        title: 'Vacaciones',
        icon: 'fas fa-umbrella-beach',
        value: 18,
        detail: '7 pendientes de aprobación',
        color: 'orange',
        route: '/vacaciones'
      },
      {
        title: 'Fichas técnicas',
        icon: 'fas fa-file-contract',
        value: 9,
        detail: 'En los próximos 30 días',
        color: 'purple',
        route: '/fichas'
      }
    ];
  }

  private simulateMetricUpdates(): void {
    setInterval(() => {
      this.metrics.forEach(metric => {
        if (metric.value && Math.random() > 0.8) {
          metric.value += Math.random() > 0.5 ? 1 : -1;
          metric.value = Math.max(1, metric.value);
        }
      });
    }, 5000);
  }

  getRoleText(): string {
    const roles: { [key: string]: string } = {
      'Administrador Global': 'Panel de Administrador Global',
      'Administrador': 'Panel de Administrador',
      'Usuario': 'Panel de Usuario'
    };
    return roles[this.userRole] || 'Panel de Usuario';
  }

  // Agregar estos métodos en dashboard.component.ts
  onCardHover(event: any): void {
    const card = event.currentTarget;
    card.style.transform = 'translateY(-5px)';
    card.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.15)';
  }
  
  onCardLeave(event: any): void {
    const card = event.currentTarget;
    card.style.transform = 'translateY(0)';
    card.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.1)';
  }
}
